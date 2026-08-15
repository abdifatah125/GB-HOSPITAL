import React, { useState, useEffect } from 'react';
import {
  CreditCard,
  DollarSign,
  Receipt,
  CheckCircle2,
  Clock,
  AlertCircle,
  Plus,
  Search,
  Printer,
  Smartphone,
  Check,
  Eye,
  X,
  FileText,
  Filter,
  ArrowUpRight,
  Send,
  Building,
  RefreshCw,
  Download,
  Copy,
  ExternalLink,
} from 'lucide-react';
import { api } from '../services/api';
import { Invoice, InvoiceItem, Patient } from '../types';
import { useAuth } from '../context/AuthContext';
import { renderFullHtml, getInvoiceReceiptHtml, printDocumentContent } from '../utils/printDocument';

export const PaymentManagement: React.FC = () => {
  const { user } = useAuth();
  const isDoctor = user?.role === 'Doctor';
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [receiptFeedback, setReceiptFeedback] = useState<string | null>(null);

  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'All' | 'Paid' | 'Unpaid' | 'Partial'>('All');

  // Modals
  const [isNewInvoiceOpen, setIsNewInvoiceOpen] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [isReceiptModalOpen, setIsReceiptModalOpen] = useState(false);

  // New Invoice Form State
  const [patientId, setPatientId] = useState('');
  const [patientName, setPatientName] = useState('');
  const [patientContact, setPatientContact] = useState('');
  const [dueDate, setDueDate] = useState(
    new Date(Date.now() + 14 * 86400000).toISOString().split('T')[0]
  );
  const [invoiceNotes, setInvoiceNotes] = useState('');
  const [lineItems, setLineItems] = useState<
    { description: string; category: InvoiceItem['category']; quantity: number; unitPrice: number }[]
  >([
    { description: 'General Consultation Fee', category: 'Consultation', quantity: 1, unitPrice: 20 },
  ]);

  // Payment Form State
  const [paymentMethod, setPaymentMethod] = useState<'EVC Plus' | 'Zaad' | 'Sahal' | 'Cash' | 'Credit Card' | 'Bank Transfer'>('EVC Plus');
  const [mobileNumber, setMobileNumber] = useState('');
  const [transactionRef, setTransactionRef] = useState('');
  const [amountToPay, setAmountToPay] = useState<number>(0);
  const [paymentSuccessMsg, setPaymentSuccessMsg] = useState('');

  const loadData = async () => {
    try {
      const [invRes, patRes] = await Promise.all([api.getInvoices(), api.getPatients()]);
      setInvoices(invRes);
      setPatients(patRes);
      setError(null);
    } catch (err: any) {
      setError('Failed to fetch billing and invoice records.');
    } finally {
      setLoading(false);
    }
  };

  const handleManualRefresh = async () => {
    setIsRefreshing(true);
    try {
      await loadData();
      setReceiptFeedback('Invoices and ledger refreshed successfully.');
      setTimeout(() => setReceiptFeedback(null), 3000);
    } catch (err) {
      console.error(err);
    } finally {
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Sync patient name & contact when patient select changes
  const handlePatientSelect = (pId: string) => {
    setPatientId(pId);
    const pat = patients.find((p) => p.id === pId);
    if (pat) {
      setPatientName(pat.name);
      setPatientContact(pat.contact);
    }
  };

  // Line Items Handler
  const handleAddLineItem = () => {
    setLineItems([...lineItems, { description: '', category: 'Consultation', quantity: 1, unitPrice: 0 }]);
  };

  const handleRemoveLineItem = (index: number) => {
    if (lineItems.length === 1) return;
    setLineItems(lineItems.filter((_, i) => i !== index));
  };

  const handleLineItemChange = (
    index: number,
    field: 'description' | 'category' | 'quantity' | 'unitPrice',
    value: any
  ) => {
    const updated = [...lineItems];
    updated[index] = { ...updated[index], [field]: value };
    setLineItems(updated);
  };

  // Calculate invoice draft total
  const calculatedTotal = lineItems.reduce(
    (sum, item) => sum + Number(item.quantity || 0) * Number(item.unitPrice || 0),
    0
  );

  // Create Invoice Submission
  const handleCreateInvoiceSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isDoctor) {
      alert('Access Restricted: Doctor accounts cannot generate billing invoices. Invoicing is managed by Reception & Cashier desks.');
      return;
    }
    if (!patientName) {
      alert('Please select or enter a patient name.');
      return;
    }

    const items: InvoiceItem[] = lineItems.map((item, index) => ({
      id: `item-${Date.now()}-${index}`,
      description: item.description || 'Medical Service',
      category: item.category,
      quantity: Number(item.quantity) || 1,
      unitPrice: Number(item.unitPrice) || 0,
      amount: (Number(item.quantity) || 1) * (Number(item.unitPrice) || 0),
    }));

    try {
      await api.createInvoice({
        patientId: patientId || 'pat-walkin',
        patientName,
        patientContact,
        dueDate,
        notes: invoiceNotes,
        items,
      });

      setIsNewInvoiceOpen(false);
      // Reset form
      setPatientId('');
      setPatientName('');
      setPatientContact('');
      setInvoiceNotes('');
      setLineItems([{ description: 'General Consultation Fee', category: 'Consultation', quantity: 1, unitPrice: 20 }]);
      loadData();
    } catch (err: any) {
      alert('Error creating invoice: ' + err.message);
    }
  };

  // Open Payment Modal
  const handleOpenPayment = (inv: Invoice) => {
    setSelectedInvoice(inv);
    const dueAmount = inv.totalAmount - inv.paidAmount;
    setAmountToPay(dueAmount > 0 ? dueAmount : 0);
    setTransactionRef(`TXN-${Math.floor(100000 + Math.random() * 900000)}`);
    setMobileNumber(inv.patientContact || '+252 61 ');
    setPaymentSuccessMsg('');
    setIsPaymentModalOpen(true);
  };

  // Submit Payment Processing
  const handleProcessPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedInvoice) return;

    const newPaidTotal = selectedInvoice.paidAmount + Number(amountToPay);
    const newStatus: 'Paid' | 'Partial' | 'Unpaid' =
      newPaidTotal >= selectedInvoice.totalAmount
        ? 'Paid'
        : newPaidTotal > 0
        ? 'Partial'
        : 'Unpaid';

    try {
      await api.updateInvoice(selectedInvoice.id, {
        paidAmount: newPaidTotal,
        status: newStatus,
        notes: `${selectedInvoice.notes || ''}\n[Payment Recorded]: $${amountToPay} via ${paymentMethod} (Ref: ${transactionRef}) on ${new Date().toLocaleDateString()}`.trim(),
      });

      setPaymentSuccessMsg(`Payment of $${amountToPay} recorded successfully!`);
      setTimeout(() => {
        setIsPaymentModalOpen(false);
        loadData();
      }, 1500);
    } catch (err: any) {
      alert('Failed to process payment: ' + err.message);
    }
  };

  // View Receipt
  const handleViewReceipt = (inv: Invoice) => {
    setSelectedInvoice(inv);
    setIsReceiptModalOpen(true);
  };

  // Print Receipt handler (Reliable across all browser contexts)
  const handlePrint = () => {
    if (!selectedInvoice) return;
    const htmlContent = getInvoiceReceiptHtml(selectedInvoice);
    printDocumentContent(`Receipt - ${selectedInvoice.invoiceNumber}`, htmlContent);
  };

  // Open in New Tab to Print (Bypasses sandboxed iframes)
  const handleOpenPrintWindow = () => {
    if (!selectedInvoice) return;
    const htmlContent = getInvoiceReceiptHtml(selectedInvoice);
    const fullHtml = renderFullHtml(`Receipt - ${selectedInvoice.invoiceNumber}`, htmlContent);
    try {
      const blob = new Blob([fullHtml], { type: 'text/html;charset=utf-8' });
      const blobUrl = URL.createObjectURL(blob);
      const win = window.open(blobUrl, '_blank');
      if (!win) {
        alert('Popup was blocked by browser. Please allow popups or use "Download HTML".');
      }
    } catch {
      const win = window.open('', '_blank');
      if (win) {
        win.document.write(fullHtml);
        win.document.close();
      }
    }
  };

  // Download HTML Receipt file
  const handleDownloadReceiptHtml = () => {
    if (!selectedInvoice) return;
    const htmlContent = getInvoiceReceiptHtml(selectedInvoice);
    const fullHtml = renderFullHtml(`Receipt - ${selectedInvoice.invoiceNumber}`, htmlContent);
    const blob = new Blob([fullHtml], { type: 'text/html;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `GB_Receipt_${selectedInvoice.invoiceNumber}.html`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Copy Formatted Receipt Text
  const handleCopyReceipt = () => {
    if (!selectedInvoice) return;
    const content = `GARASBALEY HOSPITAL - OFFICIAL RECEIPT
Invoice: ${selectedInvoice.invoiceNumber}
Date: ${selectedInvoice.date} | Due: ${selectedInvoice.dueDate}
Patient: ${selectedInvoice.patientName} (ID: ${selectedInvoice.patientId})
Status: ${selectedInvoice.status}
Items:
${selectedInvoice.items.map((it, i) => `${i + 1}. ${it.description} x${it.quantity} = $${it.amount.toFixed(2)}`).join('\n')}
Total Bill: $${selectedInvoice.totalAmount.toFixed(2)}
Amount Paid: $${selectedInvoice.paidAmount.toFixed(2)}
Balance Due: $${(selectedInvoice.totalAmount - selectedInvoice.paidAmount).toFixed(2)}`;

    navigator.clipboard.writeText(content);
    setReceiptFeedback('Receipt text copied to clipboard.');
    setTimeout(() => setReceiptFeedback(null), 3000);
  };

  // Download Text File Copy of Receipt
  const handleDownloadReceiptText = () => {
    if (!selectedInvoice) return;
    const content = `==================================================
              GARASBALEY HOSPITAL
  General Medical, Surgical & Maternity Hospital
  Garasbaley Main District Road, Mogadishu, Somalia
                  OFFICIAL RECEIPT
==================================================
Receipt #:     ${selectedInvoice.invoiceNumber}
Date:          ${selectedInvoice.date}
Patient Name:  ${selectedInvoice.patientName}
Patient ID:    ${selectedInvoice.patientId}
Phone:         ${selectedInvoice.patientContact || 'N/A'}
Status:        ${selectedInvoice.status}
--------------------------------------------------
ITEMS & CHARGES:
${selectedInvoice.items
  .map(
    (item, idx) =>
      `${idx + 1}. ${item.description} (${item.category})\n   Qty: ${item.quantity} x $${item.unitPrice.toFixed(2)} = $${item.amount.toFixed(2)}`
  )
  .join('\n')}
--------------------------------------------------
Subtotal:     $${selectedInvoice.totalAmount.toFixed(2)}
Amount Paid:  $${selectedInvoice.paidAmount.toFixed(2)}
Balance Due:  $${(selectedInvoice.totalAmount - selectedInvoice.paidAmount).toFixed(2)}
==================================================
Cashier: GB Cashier (Verified)
Valid Computer Generated Receipt
==================================================`;

    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `GB-Receipt-${selectedInvoice.invoiceNumber}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // User role filtering for Patients (Patients only see their own invoices)
  const isPatientUser = user?.role === 'Patient';
  const displayedInvoices = invoices.filter((inv) => {
    if (isPatientUser && inv.patientName.toLowerCase() !== user?.name.toLowerCase()) {
      return false;
    }

    const matchesSearch =
      inv.invoiceNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      inv.patientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (inv.patientContact && inv.patientContact.includes(searchTerm));

    const matchesStatus = statusFilter === 'All' || inv.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  // KPI Calculations
  const totalRevenue = invoices.reduce((sum, inv) => sum + inv.paidAmount, 0);
  const totalOutstanding = invoices.reduce(
    (sum, inv) => sum + (inv.totalAmount - inv.paidAmount),
    0
  );
  const paidCount = invoices.filter((i) => i.status === 'Paid').length;
  const unpaidCount = invoices.filter((i) => i.status === 'Unpaid' || i.status === 'Partial').length;

  return (
    <div className="space-y-6">
      {/* Top Banner Header */}
      <div className="bg-white p-5 rounded-xl border border-[#C8E6C9] shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-[#4CAF50] font-bold text-xs uppercase tracking-wider mb-1">
            <Receipt className="w-4 h-4" />
            <span>Financial Operations & Revenue</span>
          </div>
          <h1 className="text-xl font-extrabold text-[#1B5E20]">Billing & Patient Payments</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Manage hospital invoices, process EVC Plus / mobile payments, track account receivables and generate official receipts.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleManualRefresh}
            disabled={isRefreshing}
            className="inline-flex items-center gap-1.5 bg-[#E8F5E9] hover:bg-[#C8E6C9] text-[#1B5E20] border border-[#A5D6A7] px-3.5 py-2 rounded-lg font-bold text-xs shadow-xs transition-colors shrink-0 cursor-pointer disabled:opacity-50"
            title="Refresh Invoices & Ledger"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin text-[#2E7D32]' : ''}`} />
            <span>{isRefreshing ? 'Refreshing...' : 'Refresh Invoices'}</span>
          </button>

          {isDoctor ? (
            <div
              className="bg-[#E8F5E9] text-[#1B5E20] border border-[#A5D6A7] font-bold text-xs px-3.5 py-2 rounded-lg flex items-center gap-2"
              title="Invoice generation is restricted to Reception and Cashier accounts"
            >
              <CreditCard className="w-4 h-4 text-[#2E7D32] shrink-0" />
              <span>Invoicing Managed by Reception / Cashier</span>
            </div>
          ) : user?.role !== 'Patient' ? (
            <button
              onClick={() => setIsNewInvoiceOpen(true)}
              className="inline-flex items-center gap-2 bg-[#4CAF50] hover:bg-[#388E3C] text-white px-4 py-2 rounded-lg font-bold text-xs shadow-xs transition-colors shrink-0 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Create New Invoice</span>
            </button>
          ) : null}
        </div>
      </div>

      {/* Feedback Alert */}
      {receiptFeedback && (
        <div className="p-3 bg-emerald-800 text-white rounded-xl text-xs font-bold flex items-center justify-between shadow-sm animate-fade-in">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-300" />
            <span>{receiptFeedback}</span>
          </div>
          <button onClick={() => setReceiptFeedback(null)} className="text-emerald-200 hover:text-white">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* KPI Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl border border-[#C8E6C9] shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
              Total Revenue Collected
            </span>
            <div className="text-2xl font-black text-[#1B5E20] mt-1">${totalRevenue.toLocaleString()}</div>
            <span className="text-[10px] font-semibold text-emerald-700 flex items-center gap-1 mt-1">
              <ArrowUpRight className="w-3 h-3" />
              <span>Verified Hospital Ledger</span>
            </span>
          </div>
          <div className="w-10 h-10 rounded-lg bg-[#E8F5E9] border border-[#C8E6C9] flex items-center justify-center text-[#2E7D32]">
            <DollarSign className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-[#C8E6C9] shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
              Outstanding Balance
            </span>
            <div className="text-2xl font-black text-amber-700 mt-1">${totalOutstanding.toLocaleString()}</div>
            <span className="text-[10px] font-semibold text-amber-800 flex items-center gap-1 mt-1">
              <Clock className="w-3 h-3" />
              <span>{unpaidCount} Pending Invoices</span>
            </span>
          </div>
          <div className="w-10 h-10 rounded-lg bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-700">
            <AlertCircle className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-[#C8E6C9] shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
              Paid Invoices
            </span>
            <div className="text-2xl font-black text-[#2E7D32] mt-1">{paidCount}</div>
            <span className="text-[10px] font-semibold text-[#4CAF50] flex items-center gap-1 mt-1">
              <CheckCircle2 className="w-3 h-3" />
              <span>{invoices.length > 0 ? Math.round((paidCount / invoices.length) * 100) : 0}% Collection Rate</span>
            </span>
          </div>
          <div className="w-10 h-10 rounded-lg bg-[#E8F5E9] border border-[#C8E6C9] flex items-center justify-center text-[#2E7D32]">
            <CheckCircle2 className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-[#C8E6C9] shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
              EVC Plus / Mobile Money
            </span>
            <div className="text-2xl font-black text-indigo-700 mt-1">Active</div>
            <span className="text-[10px] font-semibold text-indigo-600 flex items-center gap-1 mt-1">
              <Smartphone className="w-3 h-3" />
              <span>Direct Somali Gateway</span>
            </span>
          </div>
          <div className="w-10 h-10 rounded-lg bg-indigo-50 border border-indigo-200 flex items-center justify-center text-indigo-700">
            <CreditCard className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Main Table Section */}
      <div className="bg-white rounded-xl border border-[#C8E6C9] shadow-xs overflow-hidden">
        {/* Filter Controls Bar */}
        <div className="p-4 border-b border-[#C8E6C9] bg-[#F9FBF9] flex flex-col md:flex-row items-center justify-between gap-3">
          {/* Search Box */}
          <div className="relative w-full md:w-72">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5 pointer-events-none" />
            <input
              type="text"
              placeholder="Search by invoice # or patient name..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 bg-white border border-[#C8E6C9] rounded-lg text-xs font-medium focus:outline-none focus:ring-2 focus:ring-[#4CAF50] text-slate-800"
            />
          </div>

          {/* Status Filter Tabs */}
          <div className="flex items-center gap-1 bg-[#E8F5E9] p-1 rounded-lg border border-[#C8E6C9] self-start md:self-auto overflow-x-auto">
            {(['All', 'Unpaid', 'Partial', 'Paid'] as const).map((status) => (
              <button
                key={status}
                onClick={() => setStatusFilter(status)}
                className={`px-3 py-1 text-xs font-bold rounded-md transition-all ${
                  statusFilter === status
                    ? 'bg-white text-[#2E7D32] shadow-xs'
                    : 'text-slate-600 hover:text-[#1B5E20]'
                }`}
              >
                {status}
              </button>
            ))}
          </div>
        </div>

        {/* Invoice Data Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-[#E8F5E9] border-b border-[#C8E6C9] text-[#1B5E20] font-black uppercase tracking-wider text-[11px]">
                <th className="p-3">Invoice #</th>
                <th className="p-3">Patient Name</th>
                <th className="p-3">Issued Date</th>
                <th className="p-3">Total Amount</th>
                <th className="p-3">Paid Amount</th>
                <th className="p-3">Balance Due</th>
                <th className="p-3">Status</th>
                <th className="p-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E8F5E9]">
              {loading ? (
                <tr>
                  <td colSpan={8} className="p-8 text-center text-slate-500 font-medium">
                    Loading medical invoices and payment records...
                  </td>
                </tr>
              ) : displayedInvoices.length === 0 ? (
                <tr>
                  <td colSpan={8} className="p-8 text-center text-slate-500 font-medium">
                    No invoice records found matching your filters.
                  </td>
                </tr>
              ) : (
                displayedInvoices.map((inv) => {
                  const balance = inv.totalAmount - inv.paidAmount;
                  return (
                    <tr key={inv.id} className="hover:bg-[#F9FBF9] transition-colors">
                      <td className="p-3 font-extrabold text-[#1B5E20]">
                        <div className="flex items-center gap-1.5">
                          <FileText className="w-3.5 h-3.5 text-[#4CAF50]" />
                          <span>{inv.invoiceNumber}</span>
                        </div>
                      </td>
                      <td className="p-3">
                        <div className="font-bold text-slate-800">{inv.patientName}</div>
                        <div className="text-[10px] text-slate-500">{inv.patientContact || 'N/A'}</div>
                      </td>
                      <td className="p-3 font-semibold text-slate-600">{inv.date}</td>
                      <td className="p-3 font-black text-slate-800">${inv.totalAmount.toFixed(2)}</td>
                      <td className="p-3 font-extrabold text-[#2E7D32]">
                        ${inv.paidAmount.toFixed(2)}
                      </td>
                      <td className="p-3 font-extrabold text-amber-700">
                        ${balance > 0 ? balance.toFixed(2) : '0.00'}
                      </td>
                      <td className="p-3">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${
                            inv.status === 'Paid'
                              ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                              : inv.status === 'Partial'
                              ? 'bg-amber-100 text-amber-800 border border-amber-300'
                              : 'bg-red-100 text-red-800 border border-red-300'
                          }`}
                        >
                          {inv.status}
                        </span>
                      </td>
                      <td className="p-3 text-right space-x-2">
                        {inv.status !== 'Paid' && !isDoctor && (
                          <button
                            onClick={() => handleOpenPayment(inv)}
                            className="px-2.5 py-1 bg-[#4CAF50] hover:bg-[#388E3C] text-white font-bold rounded-lg text-[11px] shadow-xs transition-colors inline-flex items-center gap-1 cursor-pointer"
                          >
                            <DollarSign className="w-3 h-3" />
                            <span>Pay Now</span>
                          </button>
                        )}
                        <button
                          onClick={() => handleViewReceipt(inv)}
                          className="px-2.5 py-1 bg-[#E8F5E9] hover:bg-[#C8E6C9] text-[#2E7D32] font-bold rounded-lg text-[11px] transition-colors inline-flex items-center gap-1 cursor-pointer border border-[#C8E6C9]"
                        >
                          <Eye className="w-3 h-3" />
                          <span>Receipt</span>
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* CREATE NEW INVOICE MODAL */}
      {isNewInvoiceOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl border border-[#C8E6C9] shadow-xl w-full max-w-2xl overflow-hidden my-8">
            <div className="p-4 bg-[#4CAF50] text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Receipt className="w-5 h-5" />
                <h3 className="font-extrabold text-base">Generate New Hospital Invoice</h3>
              </div>
              <button
                onClick={() => setIsNewInvoiceOpen(false)}
                className="p-1 text-white/80 hover:text-white rounded-lg transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateInvoiceSubmit} className="p-5 space-y-4 text-xs">
              {/* Patient Selector */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-[#1B5E20] mb-1">Select Patient *</label>
                  <select
                    value={patientId}
                    onChange={(e) => handlePatientSelect(e.target.value)}
                    className="w-full p-2 border border-[#C8E6C9] rounded-lg bg-white font-medium text-slate-800 focus:ring-2 focus:ring-[#4CAF50]"
                    required
                  >
                    <option value="">-- Choose Registered Patient --</option>
                    {patients.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name} ({p.contact})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-[#1B5E20] mb-1">Patient Name (Walk-in or Custom)</label>
                  <input
                    type="text"
                    value={patientName}
                    onChange={(e) => setPatientName(e.target.value)}
                    placeholder="Full Patient Name"
                    className="w-full p-2 border border-[#C8E6C9] rounded-lg font-medium text-slate-800"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-[#1B5E20] mb-1">Contact Phone</label>
                  <input
                    type="text"
                    value={patientContact}
                    onChange={(e) => setPatientContact(e.target.value)}
                    placeholder="+252 61 XXX XXXX"
                    className="w-full p-2 border border-[#C8E6C9] rounded-lg font-medium text-slate-800"
                  />
                </div>

                <div>
                  <label className="block font-bold text-[#1B5E20] mb-1">Due Date</label>
                  <input
                    type="date"
                    value={dueDate}
                    onChange={(e) => setDueDate(e.target.value)}
                    className="w-full p-2 border border-[#C8E6C9] rounded-lg font-medium text-slate-800"
                    required
                  />
                </div>
              </div>

              {/* Line Items Section */}
              <div className="border-t border-[#C8E6C9] pt-3">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-extrabold text-[#1B5E20] uppercase text-[11px] tracking-wider">
                    Medical Services & Charges
                  </span>
                  <button
                    type="button"
                    onClick={handleAddLineItem}
                    className="text-[#4CAF50] hover:text-[#388E3C] font-extrabold flex items-center gap-1 cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add Charge Item</span>
                  </button>
                </div>

                <div className="space-y-2">
                  {lineItems.map((item, idx) => (
                    <div
                      key={idx}
                      className="flex flex-col sm:flex-row items-center gap-2 p-2 bg-[#F9FBF9] rounded-lg border border-[#C8E6C9]"
                    >
                      <input
                        type="text"
                        placeholder="Description (e.g. CBC Test, Ultrasound)"
                        value={item.description}
                        onChange={(e) => handleLineItemChange(idx, 'description', e.target.value)}
                        className="flex-1 p-1.5 border border-[#C8E6C9] rounded bg-white font-medium"
                        required
                      />

                      <select
                        value={item.category}
                        onChange={(e) =>
                          handleLineItemChange(idx, 'category', e.target.value as InvoiceItem['category'])
                        }
                        className="w-32 p-1.5 border border-[#C8E6C9] rounded bg-white font-medium"
                      >
                        <option value="Consultation">Consultation</option>
                        <option value="Lab">Lab Test</option>
                        <option value="Pharmacy">Pharmacy</option>
                        <option value="Maternity">Maternity</option>
                        <option value="Other">Ward / Other</option>
                      </select>

                      <div className="flex items-center gap-1 w-full sm:w-auto">
                        <span className="text-[10px] text-slate-500 font-bold">Qty:</span>
                        <input
                          type="number"
                          min="1"
                          value={item.quantity}
                          onChange={(e) => handleLineItemChange(idx, 'quantity', e.target.value)}
                          className="w-16 p-1.5 border border-[#C8E6C9] rounded bg-white font-bold text-center"
                        />
                      </div>

                      <div className="flex items-center gap-1 w-full sm:w-auto">
                        <span className="text-[10px] text-slate-500 font-bold">$</span>
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          value={item.unitPrice}
                          onChange={(e) => handleLineItemChange(idx, 'unitPrice', e.target.value)}
                          className="w-20 p-1.5 border border-[#C8E6C9] rounded bg-white font-bold text-right"
                        />
                      </div>

                      {lineItems.length > 1 && (
                        <button
                          type="button"
                          onClick={() => handleRemoveLineItem(idx)}
                          className="p-1 text-red-500 hover:text-red-700 rounded"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Total Summary */}
              <div className="bg-[#E8F5E9] p-3 rounded-lg border border-[#C8E6C9] flex items-center justify-between">
                <span className="font-extrabold text-[#1B5E20]">Calculated Total Bill:</span>
                <span className="text-lg font-black text-[#2E7D32]">${calculatedTotal.toFixed(2)}</span>
              </div>

              <div>
                <label className="block font-bold text-[#1B5E20] mb-1">Notes / Instructions</label>
                <textarea
                  value={invoiceNotes}
                  onChange={(e) => setInvoiceNotes(e.target.value)}
                  placeholder="Optional billing remarks..."
                  rows={2}
                  className="w-full p-2 border border-[#C8E6C9] rounded-lg font-medium text-slate-800"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#C8E6C9]">
                <button
                  type="button"
                  onClick={() => setIsNewInvoiceOpen(false)}
                  className="px-4 py-2 border border-slate-300 text-slate-600 font-bold rounded-lg hover:bg-slate-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-[#4CAF50] hover:bg-[#388E3C] text-white font-extrabold rounded-lg shadow-xs transition-colors cursor-pointer"
                >
                  Save & Issue Invoice
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* PROCESS PAYMENT MODAL */}
      {isPaymentModalOpen && selectedInvoice && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-[#C8E6C9] shadow-xl w-full max-w-md overflow-hidden">
            <div className="p-4 bg-[#4CAF50] text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Smartphone className="w-5 h-5" />
                <h3 className="font-extrabold text-base">Process Payment</h3>
              </div>
              <button
                onClick={() => setIsPaymentModalOpen(false)}
                className="p-1 text-white/80 hover:text-white rounded-lg transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleProcessPayment} className="p-5 space-y-4 text-xs">
              <div className="bg-[#E8F5E9] p-3 rounded-lg border border-[#C8E6C9] space-y-1">
                <div className="flex justify-between font-bold text-slate-700">
                  <span>Invoice Reference:</span>
                  <span className="text-[#1B5E20]">{selectedInvoice.invoiceNumber}</span>
                </div>
                <div className="flex justify-between font-bold text-slate-700">
                  <span>Patient Name:</span>
                  <span className="text-slate-900">{selectedInvoice.patientName}</span>
                </div>
                <div className="flex justify-between font-bold text-slate-700">
                  <span>Total Bill Amount:</span>
                  <span>${selectedInvoice.totalAmount.toFixed(2)}</span>
                </div>
                <div className="flex justify-between font-black text-amber-800 pt-1 border-t border-[#C8E6C9]">
                  <span>Remaining Balance:</span>
                  <span>${(selectedInvoice.totalAmount - selectedInvoice.paidAmount).toFixed(2)}</span>
                </div>
              </div>

              {/* Payment Method Selector */}
              <div>
                <label className="block font-bold text-[#1B5E20] mb-1">Select Payment Method</label>
                <div className="grid grid-cols-3 gap-2">
                  {(['EVC Plus', 'Zaad', 'Sahal', 'Cash', 'Credit Card', 'Bank Transfer'] as const).map(
                    (method) => (
                      <button
                        type="button"
                        key={method}
                        onClick={() => setPaymentMethod(method)}
                        className={`p-2 rounded-lg border text-center font-bold text-[11px] transition-all cursor-pointer ${
                          paymentMethod === method
                            ? 'border-[#4CAF50] bg-[#E8F5E9] text-[#2E7D32] ring-2 ring-[#4CAF50]/30'
                            : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                        }`}
                      >
                        {method}
                      </button>
                    )
                  )}
                </div>
              </div>

              {/* Mobile details if EVC Plus / Zaad / Sahal */}
              {['EVC Plus', 'Zaad', 'Sahal'].includes(paymentMethod) && (
                <div>
                  <label className="block font-bold text-[#1B5E20] mb-1">Mobile Money Number</label>
                  <input
                    type="text"
                    value={mobileNumber}
                    onChange={(e) => setMobileNumber(e.target.value)}
                    placeholder="+252 61 5000000"
                    className="w-full p-2 border border-[#C8E6C9] rounded-lg font-bold text-slate-800"
                    required
                  />
                  <span className="text-[10px] text-slate-500 mt-0.5 block">
                    Simulated API push prompt sent to patient mobile.
                  </span>
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-[#1B5E20] mb-1">Amount to Pay ($)</label>
                  <input
                    type="number"
                    step="0.01"
                    min="1"
                    max={selectedInvoice.totalAmount - selectedInvoice.paidAmount}
                    value={amountToPay}
                    onChange={(e) => setAmountToPay(Number(e.target.value))}
                    className="w-full p-2 border border-[#C8E6C9] rounded-lg font-black text-[#2E7D32] text-sm"
                    required
                  />
                </div>

                <div>
                  <label className="block font-bold text-[#1B5E20] mb-1">Transaction Ref #</label>
                  <input
                    type="text"
                    value={transactionRef}
                    onChange={(e) => setTransactionRef(e.target.value)}
                    className="w-full p-2 border border-[#C8E6C9] rounded-lg font-mono text-xs font-bold text-slate-800"
                    required
                  />
                </div>
              </div>

              {paymentSuccessMsg && (
                <div className="p-3 bg-emerald-100 text-emerald-800 border border-emerald-300 rounded-lg font-bold flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                  <span>{paymentSuccessMsg}</span>
                </div>
              )}

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#C8E6C9]">
                <button
                  type="button"
                  onClick={() => setIsPaymentModalOpen(false)}
                  className="px-4 py-2 border border-slate-300 text-slate-600 font-bold rounded-lg hover:bg-slate-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-[#4CAF50] hover:bg-[#388E3C] text-white font-extrabold rounded-lg shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer"
                >
                  <Check className="w-4 h-4" />
                  <span>Confirm & Record Payment</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* OFFICIAL PRINTABLE RECEIPT MODAL */}
      {isReceiptModalOpen && selectedInvoice && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl border border-[#C8E6C9] shadow-2xl w-full max-w-2xl overflow-hidden my-8">
            {/* Modal Header */}
            <div className="p-4 bg-[#1B5E20] text-white flex items-center justify-between no-print">
              <div className="flex items-center gap-2">
                <Printer className="w-5 h-5" />
                <h3 className="font-extrabold text-base">Official Hospital Medical Bill & Receipt</h3>
              </div>
              <div className="flex flex-wrap items-center gap-1.5">
                <button
                  onClick={handlePrint}
                  title="Print directly"
                  className="px-2.5 py-1.5 bg-[#4CAF50] hover:bg-[#388E3C] text-white font-bold rounded-lg text-xs transition-colors flex items-center gap-1 cursor-pointer"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Print</span>
                </button>
                <button
                  onClick={handleOpenPrintWindow}
                  title="Open in new window / tab and print"
                  className="px-2.5 py-1.5 bg-emerald-800 hover:bg-emerald-900 text-white font-bold rounded-lg text-xs transition-colors flex items-center gap-1 cursor-pointer border border-emerald-600"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span>New Tab</span>
                </button>
                <button
                  onClick={handleDownloadReceiptHtml}
                  title="Download offline HTML receipt"
                  className="px-2.5 py-1.5 bg-emerald-900 hover:bg-emerald-950 text-white font-bold rounded-lg text-xs transition-colors flex items-center gap-1 cursor-pointer border border-emerald-700"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>.html</span>
                </button>
                <button
                  onClick={handleDownloadReceiptText}
                  title="Download receipt text file"
                  className="px-2.5 py-1.5 bg-white/10 hover:bg-white/20 text-white font-bold rounded-lg text-xs transition-colors flex items-center gap-1 cursor-pointer"
                >
                  <FileText className="w-3.5 h-3.5" />
                  <span>.txt</span>
                </button>
                <button
                  onClick={handleCopyReceipt}
                  title="Copy receipt text to clipboard"
                  className="px-2.5 py-1.5 bg-white/10 hover:bg-white/20 text-white font-bold rounded-lg text-xs transition-colors flex items-center gap-1 cursor-pointer"
                >
                  <Copy className="w-3.5 h-3.5" />
                  <span>Copy</span>
                </button>
                <button
                  onClick={() => setIsReceiptModalOpen(false)}
                  className="p-1.5 text-white/80 hover:text-white rounded-lg transition-colors cursor-pointer ml-1"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Receipt Printable Paper Body */}
            <div id="printable-receipt" className="p-8 space-y-6 text-slate-800 bg-white font-sans text-xs">
              {/* Letterhead */}
              <div className="border-b-2 border-[#4CAF50] pb-4 flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-[#4CAF50] text-white font-black text-2xl flex items-center justify-center shadow-md">
                    GB
                  </div>
                  <div>
                    <h2 className="text-xl font-black text-[#1B5E20] uppercase tracking-tight">
                      GARASBALEY HOSPITAL
                    </h2>
                    <p className="text-[11px] font-bold text-[#4CAF50]">
                      General Medical, Surgical & Maternity Hospital
                    </p>
                    <p className="text-[10px] text-slate-500 font-semibold">
                      Garasbaley Main District Road, Mogadishu, Somalia | Tel: +252 61 5000000
                    </p>
                  </div>
                </div>

                <div className="text-right">
                  <div className="inline-block px-3 py-1 rounded bg-[#E8F5E9] border border-[#C8E6C9] text-[#1B5E20] font-black uppercase text-xs">
                    OFFICIAL RECEIPT
                  </div>
                  <div className="text-xs font-mono font-bold text-slate-700 mt-1">
                    {selectedInvoice.invoiceNumber}
                  </div>
                </div>
              </div>

              {/* Patient & Billing Details */}
              <div className="grid grid-cols-2 gap-4 bg-[#F9FBF9] p-4 rounded-xl border border-[#C8E6C9]">
                <div>
                  <span className="text-[10px] font-bold uppercase text-slate-500 block mb-0.5">
                    Patient Information:
                  </span>
                  <div className="font-extrabold text-sm text-[#1B5E20]">{selectedInvoice.patientName}</div>
                  <div className="font-medium text-slate-600">ID: {selectedInvoice.patientId}</div>
                  <div className="font-medium text-slate-600">Phone: {selectedInvoice.patientContact || 'N/A'}</div>
                </div>

                <div className="text-right">
                  <span className="text-[10px] font-bold uppercase text-slate-500 block mb-0.5">
                    Invoice Metadata:
                  </span>
                  <div className="font-semibold text-slate-700">Issued Date: {selectedInvoice.date}</div>
                  <div className="font-semibold text-slate-700">Due Date: {selectedInvoice.dueDate}</div>
                  <div className="mt-1">
                    <span
                      className={`inline-block px-2.5 py-0.5 rounded text-[10px] font-black uppercase tracking-wider ${
                        selectedInvoice.status === 'Paid'
                          ? 'bg-emerald-600 text-white'
                          : 'bg-red-600 text-white'
                      }`}
                    >
                      {selectedInvoice.status}
                    </span>
                  </div>
                </div>
              </div>

              {/* Itemized Table */}
              <div>
                <table className="w-full text-left border-collapse border border-[#C8E6C9]">
                  <thead>
                    <tr className="bg-[#E8F5E9] text-[#1B5E20] font-black text-[11px] uppercase tracking-wider">
                      <th className="p-2 border border-[#C8E6C9]">#</th>
                      <th className="p-2 border border-[#C8E6C9]">Item Description</th>
                      <th className="p-2 border border-[#C8E6C9]">Category</th>
                      <th className="p-2 border border-[#C8E6C9] text-center">Qty</th>
                      <th className="p-2 border border-[#C8E6C9] text-right">Unit Price</th>
                      <th className="p-2 border border-[#C8E6C9] text-right">Amount</th>
                    </tr>
                  </thead>
                  <tbody>
                    {selectedInvoice.items.map((item, idx) => (
                      <tr key={item.id || idx} className="border-b border-[#E8F5E9]">
                        <td className="p-2 border border-[#C8E6C9] text-center font-bold text-slate-500">
                          {idx + 1}
                        </td>
                        <td className="p-2 border border-[#C8E6C9] font-bold text-slate-800">
                          {item.description}
                        </td>
                        <td className="p-2 border border-[#C8E6C9] text-slate-600 font-semibold">
                          {item.category}
                        </td>
                        <td className="p-2 border border-[#C8E6C9] text-center font-bold">{item.quantity}</td>
                        <td className="p-2 border border-[#C8E6C9] text-right font-medium">
                          ${item.unitPrice.toFixed(2)}
                        </td>
                        <td className="p-2 border border-[#C8E6C9] text-right font-black text-slate-900">
                          ${item.amount.toFixed(2)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Totals Summary */}
              <div className="flex justify-end">
                <div className="w-64 space-y-1.5 bg-[#F9FBF9] p-3 rounded-lg border border-[#C8E6C9] text-xs">
                  <div className="flex justify-between font-bold text-slate-700">
                    <span>Subtotal:</span>
                    <span>${selectedInvoice.totalAmount.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between font-bold text-slate-700">
                    <span>Tax / Vat (0%):</span>
                    <span>$0.00</span>
                  </div>
                  <div className="flex justify-between font-black text-base text-[#1B5E20] pt-1 border-t border-[#C8E6C9]">
                    <span>Total Bill:</span>
                    <span>${selectedInvoice.totalAmount.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between font-extrabold text-[#2E7D32]">
                    <span>Amount Paid:</span>
                    <span>${selectedInvoice.paidAmount.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between font-black text-amber-800 pt-1 border-t border-slate-200">
                    <span>Balance Due:</span>
                    <span>
                      ${(selectedInvoice.totalAmount - selectedInvoice.paidAmount).toFixed(2)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Cashier Sign & Stamp Line */}
              <div className="pt-8 border-t border-dashed border-slate-300 flex items-end justify-between">
                <div>
                  <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                    Hospital Cashier Stamp & Signature:
                  </div>
                  <div className="h-10 mt-1 border-b border-slate-400 w-48 font-mono text-xs font-bold text-slate-700 flex items-end pb-1">
                    GB Cashier (Verified)
                  </div>
                </div>

                <div className="text-right">
                  <p className="text-[10px] italic text-slate-500">
                    Thank you for trusting Garasbaley Hospital with your healthcare.
                  </p>
                  <p className="text-[9px] font-bold text-[#4CAF50] uppercase mt-0.5">
                    Valid Computer Generated Receipt
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
