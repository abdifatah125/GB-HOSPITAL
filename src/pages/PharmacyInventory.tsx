import React, { useState, useEffect } from 'react';
import { PharmacyItem, Medicine } from '../types';
import { api } from '../services/api';
import {
  Pill,
  Plus,
  AlertTriangle,
  Clock,
  PackageCheck,
  Search,
  CheckCircle2,
  MinusCircle,
  PlusCircle,
  AlertCircle,
} from 'lucide-react';

export const PharmacyInventory: React.FC = () => {
  const [stock, setStock] = useState<PharmacyItem[]>([]);
  const [medicines, setMedicines] = useState<Medicine[]>([]);
  const [search, setSearch] = useState('');

  // Add Stock Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedMedicineId, setSelectedMedicineId] = useState('');
  const [batchNumber, setBatchNumber] = useState('');
  const [stockQuantity, setStockQuantity] = useState<number>(100);
  const [unitPrice, setUnitPrice] = useState<number>(0.5);
  const [expiryDate, setExpiryDate] = useState('2027-06-30');
  const [supplier, setSupplier] = useState('Mogadishu Central Medical Supplies');
  const [reorderThreshold, setReorderThreshold] = useState<number>(30);

  // Issue / Deduct Prescription Modal State
  const [deductModalItem, setDeductModalItem] = useState<PharmacyItem | null>(null);
  const [deductQty, setDeductQty] = useState<number>(1);

  const [feedback, setFeedback] = useState<string | null>(null);

  const loadData = async () => {
    try {
      const [pharmRes, medRes] = await Promise.all([api.getPharmacyStock(), api.getMedicines()]);
      setStock(pharmRes);
      setMedicines(medRes);
      if (medRes.length > 0 && !selectedMedicineId) {
        setSelectedMedicineId(medRes[0].id);
      }
    } catch (err) {
      console.warn('Error loading pharmacy data:', err);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleAddStock = async (e: React.FormEvent) => {
    e.preventDefault();
    const med = medicines.find((m) => m.id === selectedMedicineId);
    if (!med) return;

    try {
      await api.createPharmacyStock({
        medicineId: med.id,
        medicineName: med.name,
        brandName: med.brandName,
        genericName: med.genericName,
        batchNumber: batchNumber || `BATCH-${Date.now().toString().slice(-4)}`,
        stockQuantity: Number(stockQuantity),
        unitPrice: Number(unitPrice),
        expiryDate,
        supplier,
        reorderThreshold: Number(reorderThreshold),
      });

      setFeedback(`Stock batch for "${med.name}" added to inventory.`);
      setIsModalOpen(false);
      loadData();
      setTimeout(() => setFeedback(null), 3000);
    } catch (err: any) {
      alert(err.message || 'Error adding stock batch');
    }
  };

  const handleDeductPrescription = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!deductModalItem) return;

    try {
      await api.deductStock(deductModalItem.id, Number(deductQty));
      setFeedback(`Prescription issued: ${deductQty} unit(s) of ${deductModalItem.medicineName} deducted.`);
      setDeductModalItem(null);
      loadData();
      setTimeout(() => setFeedback(null), 3000);
    } catch (err: any) {
      alert(err.message || 'Prescription deduction failed');
    }
  };

  const todayStr = new Date().toISOString().split('T')[0];
  const todayDateObj = new Date();

  // Filtered Stock Items
  const filteredStock = stock.filter(
    (s) =>
      s.medicineName.toLowerCase().includes(search.toLowerCase()) ||
      s.brandName.toLowerCase().includes(search.toLowerCase()) ||
      s.batchNumber.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-emerald-100 shadow-sm">
        <div>
          <h1 className="text-xl font-extrabold text-emerald-950 flex items-center gap-2">
            <Pill className="w-6 h-6 text-emerald-600" /> Pharmacy Inventory & Stock Control
          </h1>
          <p className="text-xs text-emerald-800 mt-1">
            Track medicine batch stock levels, unit pricing, expiration dates, low-stock thresholds, and prescription deductions.
          </p>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs px-4 py-2.5 rounded-xl transition-all shadow-md flex items-center justify-center gap-2 shrink-0"
        >
          <Plus className="w-4 h-4" /> Add Stock Batch
        </button>
      </div>

      {feedback && (
        <div className="p-3 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-xl text-xs font-semibold flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          <span>{feedback}</span>
        </div>
      )}

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search inventory by medicine name, brand, or batch #..."
          className="w-full pl-9 pr-4 py-2 bg-white border border-gray-200 rounded-xl text-xs focus:ring-2 focus:ring-emerald-500"
        />
      </div>

      {/* Inventory Table */}
      <div className="bg-white rounded-2xl border border-emerald-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-emerald-800 text-emerald-100 uppercase text-[11px] font-extrabold tracking-wider">
              <tr>
                <th className="p-3.5">Medicine & Brand</th>
                <th className="p-3.5">Batch #</th>
                <th className="p-3.5">In Stock</th>
                <th className="p-3.5">Unit Price ($)</th>
                <th className="p-3.5">Expiry Date</th>
                <th className="p-3.5">Supplier</th>
                <th className="p-3.5">Stock Status</th>
                <th className="p-3.5 text-right">Fulfill Prescription</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 font-medium text-gray-700">
              {filteredStock.map((item) => {
                const isLowStock = item.stockQuantity <= item.reorderThreshold;

                const exp = new Date(item.expiryDate);
                const diffDays = Math.ceil((exp.getTime() - todayDateObj.getTime()) / (1000 * 3600 * 24));
                const isNearExpiry = diffDays <= 60;
                const isExpired = diffDays <= 0;

                return (
                  <tr key={item.id} className="hover:bg-emerald-50/50 transition-colors">
                    <td className="p-3.5 font-bold text-emerald-950">
                      <div>{item.medicineName}</div>
                      <div className="text-[10px] text-gray-500 font-semibold">{item.brandName} ({item.genericName})</div>
                    </td>
                    <td className="p-3.5 font-mono text-gray-600">{item.batchNumber}</td>
                    <td className="p-3.5">
                      <span className={`text-sm font-black ${isLowStock ? 'text-red-700' : 'text-emerald-800'}`}>
                        {item.stockQuantity}
                      </span>
                      <span className="text-[10px] text-gray-400 block">Min: {item.reorderThreshold}</span>
                    </td>
                    <td className="p-3.5 font-bold text-emerald-700">${item.unitPrice.toFixed(2)}</td>
                    <td className="p-3.5 font-bold">
                      <span className={isExpired ? 'text-red-700 font-extrabold' : isNearExpiry ? 'text-amber-700 font-extrabold' : 'text-gray-800'}>
                        {item.expiryDate}
                      </span>
                      {isNearExpiry && (
                        <span className="block text-[10px] font-extrabold text-amber-700">
                          {isExpired ? 'EXPIRED' : `Expires in ${diffDays}d`}
                        </span>
                      )}
                    </td>
                    <td className="p-3.5 truncate max-w-[150px]">{item.supplier}</td>
                    <td className="p-3.5">
                      {isLowStock ? (
                        <span className="inline-flex items-center gap-1 bg-amber-100 text-amber-900 border border-amber-300 font-black text-[10px] px-2 py-0.5 rounded-full animate-pulse">
                          <AlertTriangle className="w-3 h-3 text-amber-600" /> Low Stock
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 bg-emerald-100 text-emerald-800 font-bold text-[10px] px-2 py-0.5 rounded-full">
                          <PackageCheck className="w-3 h-3 text-emerald-600" /> Healthy
                        </span>
                      )}
                    </td>
                    <td className="p-3.5 text-right">
                      <button
                        onClick={() => {
                          setDeductModalItem(item);
                          setDeductQty(1);
                        }}
                        disabled={item.stockQuantity <= 0}
                        className="bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-bold px-3 py-1.5 rounded-lg text-xs transition-colors shadow-xs inline-flex items-center gap-1"
                      >
                        <MinusCircle className="w-3.5 h-3.5" /> Issue Prescription
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Stock Batch Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 space-y-4 shadow-2xl border border-emerald-100">
            <h2 className="text-base font-extrabold text-emerald-950 border-b pb-2">
              Add Inventory Stock Batch
            </h2>

            <form onSubmit={handleAddStock} className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Select Medicine from Library</label>
                <select
                  required
                  value={selectedMedicineId}
                  onChange={(e) => setSelectedMedicineId(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-xs font-bold text-emerald-900"
                >
                  {medicines.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.name} ({m.brandName} - {m.strength})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Batch Number</label>
                  <input
                    type="text"
                    required
                    value={batchNumber}
                    onChange={(e) => setBatchNumber(e.target.value)}
                    placeholder="e.g. AMX-2026-09"
                    className="w-full px-3 py-1.5 border border-gray-300 rounded-lg text-xs font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Stock Quantity</label>
                  <input
                    type="number"
                    required
                    min={1}
                    value={stockQuantity}
                    onChange={(e) => setStockQuantity(Number(e.target.value))}
                    className="w-full px-3 py-1.5 border border-gray-300 rounded-lg text-xs font-bold"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Unit Price ($)</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={unitPrice}
                    onChange={(e) => setUnitPrice(Number(e.target.value))}
                    className="w-full px-3 py-1.5 border border-gray-300 rounded-lg text-xs font-bold"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Expiry Date</label>
                  <input
                    type="date"
                    required
                    value={expiryDate}
                    onChange={(e) => setExpiryDate(e.target.value)}
                    className="w-full px-3 py-1.5 border border-gray-300 rounded-lg text-xs font-semibold"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Supplier / Distributor</label>
                  <input
                    type="text"
                    required
                    value={supplier}
                    onChange={(e) => setSupplier(e.target.value)}
                    placeholder="Mogadishu Central Medical Supplies"
                    className="w-full px-3 py-1.5 border border-gray-300 rounded-lg text-xs"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Low-Stock Alert Threshold</label>
                  <input
                    type="number"
                    required
                    min={1}
                    value={reorderThreshold}
                    onChange={(e) => setReorderThreshold(Number(e.target.value))}
                    className="w-full px-3 py-1.5 border border-gray-300 rounded-lg text-xs font-bold"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-lg text-xs font-bold text-gray-600 hover:bg-gray-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold shadow-md"
                >
                  Save Batch
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Fulfill Prescription Modal */}
      {deductModalItem && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl border border-emerald-100">
            <h2 className="text-base font-extrabold text-emerald-950 border-b pb-2">
              Fulfill Prescription: {deductModalItem.medicineName}
            </h2>

            <div className="bg-emerald-50 p-3 rounded-xl border border-emerald-100 text-xs space-y-1 text-emerald-900">
              <div>Batch Number: <strong className="font-mono">{deductModalItem.batchNumber}</strong></div>
              <div>Available In Stock: <strong className="text-emerald-700 text-sm">{deductModalItem.stockQuantity} units</strong></div>
            </div>

            <form onSubmit={handleDeductPrescription} className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Prescribed Quantity to Issue</label>
                <input
                  type="number"
                  required
                  min={1}
                  max={deductModalItem.stockQuantity}
                  value={deductQty}
                  onChange={(e) => setDeductQty(Number(e.target.value))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-xs font-black text-emerald-900"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t">
                <button
                  type="button"
                  onClick={() => setDeductModalItem(null)}
                  className="px-4 py-2 rounded-lg text-xs font-bold text-gray-600 hover:bg-gray-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold shadow-md"
                >
                  Confirm Stock Deduction
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
