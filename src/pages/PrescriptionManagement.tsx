import React, { useState, useEffect } from 'react';
import {
  Prescription,
  PrescriptionItem,
  PrescriptionPriority,
  Patient,
  DoctorStaff,
  Medicine,
  PharmacyItem,
} from '../types';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { PrintDocumentModal } from '../components/PrintDocumentModal';
import { getPrescriptionSlipHtml } from '../utils/printDocument';
import {
  Pill,
  Plus,
  Search,
  Filter,
  CheckCircle2,
  Clock,
  AlertCircle,
  Stethoscope,
  Send,
  Printer,
  Eye,
  Trash2,
  RefreshCw,
  AlertTriangle,
  User,
  Building2,
  FileText,
  Check,
  X,
  PackageCheck,
  Sparkles,
  ShieldAlert,
} from 'lucide-react';

interface PrescriptionManagementProps {
  initialPatientId?: string;
  onNavigateToPharmacy?: () => void;
}

export const PrescriptionManagement: React.FC<PrescriptionManagementProps> = ({
  initialPatientId,
  onNavigateToPharmacy,
}) => {
  const { user } = useAuth();
  const isDoctor = user?.role === 'Doctor';
  const isPharmacist = user?.role === 'Pharmacist';
  const isAdmin = user?.role === 'Admin';
  const isPatient = user?.role === 'Patient';

  const [prescriptions, setPrescriptions] = useState<Prescription[]>([]);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [doctors, setDoctors] = useState<DoctorStaff[]>([]);
  const [medicines, setMedicines] = useState<Medicine[]>([]);
  const [pharmacyStock, setPharmacyStock] = useState<PharmacyItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Filters
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'All' | 'Pending' | 'Dispensed' | 'Urgent'>('All');
  const [doctorFilter, setDoctorFilter] = useState('');
  const [patientFilter, setPatientFilter] = useState(initialPatientId || '');

  // Print Modal
  const [printDoc, setPrintDoc] = useState<{
    isOpen: boolean;
    title: string;
    html: string;
  }>({
    isOpen: false,
    title: '',
    html: '',
  });

  // Doctor: Write Prescription Modal
  const [isWriteModalOpen, setIsWriteModalOpen] = useState(false);
  const [selectedPatientId, setSelectedPatientId] = useState(initialPatientId || '');
  const [selectedDoctorId, setSelectedDoctorId] = useState('');
  const [diagnosis, setDiagnosis] = useState('');
  const [clinicalNotes, setClinicalNotes] = useState('');
  const [priority, setPriority] = useState<PrescriptionPriority>('Routine');

  // Dynamic Prescription Items
  const [items, setItems] = useState<PrescriptionItem[]>([
    {
      id: 'item-1',
      medicineId: '',
      medicineName: '',
      genericName: '',
      dosage: '500mg',
      dosageForm: 'Tablet',
      frequency: 'TDS (3 times daily)',
      duration: '5 Days',
      quantity: 15,
      instructions: 'Take orally after meals with water',
    },
  ]);

  // Pharmacist: View & Dispense Modal
  const [selectedRxToDispense, setSelectedRxToDispense] = useState<Prescription | null>(null);
  const [pharmacistNotes, setPharmacistNotes] = useState('');
  const [deductStockCheck, setDeductStockCheck] = useState(true);
  const [isDispensing, setIsDispensing] = useState(false);

  // Feedback Notification
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const loadAllData = async () => {
    try {
      setLoading(true);
      const [rxData, patData, docData, medData, stockData] = await Promise.all([
        api.getPrescriptions(),
        api.getPatients(),
        api.getDoctors(),
        api.getMedicines(),
        api.getPharmacyStock(),
      ]);

      setPrescriptions(rxData);
      setPatients(patData);
      setDoctors(docData);
      setMedicines(medData);
      setPharmacyStock(stockData);

      if (patData.length > 0 && !selectedPatientId) {
        setSelectedPatientId(patData[0].id);
      }

      // Default doctor based on logged-in user or first available doctor
      const matchedDoc = docData.find((d) => d.email.toLowerCase() === user?.email.toLowerCase() || d.name.toLowerCase().includes(user?.name.toLowerCase() || ''));
      if (matchedDoc) {
        setSelectedDoctorId(matchedDoc.id);
      } else if (docData.length > 0 && !selectedDoctorId) {
        setSelectedDoctorId(docData[0].id);
      }
    } catch (err) {
      console.warn('Error loading prescription data:', err);
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    loadAllData();
  }, []);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await loadAllData();
  };

  // Selected Patient Details for the Prescriber Modal
  const currentSelectedPatient = patients.find((p) => p.id === selectedPatientId);
  const currentSelectedDoctor = doctors.find((d) => d.id === selectedDoctorId);

  // Add Item in Prescriber
  const handleAddItem = () => {
    setItems([
      ...items,
      {
        id: `item-${Date.now()}`,
        medicineId: medicines[0]?.id || '',
        medicineName: medicines[0]?.name || '',
        genericName: medicines[0]?.genericName || '',
        dosage: '1 Tablet',
        dosageForm: medicines[0]?.dosageForm || 'Tablet',
        frequency: 'BD (Twice daily)',
        duration: '7 Days',
        quantity: 14,
        instructions: 'Take as directed by physician',
      },
    ]);
  };

  // Remove Item
  const handleRemoveItem = (index: number) => {
    if (items.length <= 1) return;
    setItems(items.filter((_, i) => i !== index));
  };

  // Handle drug select
  const handleSelectMedicineForItem = (index: number, medId: string) => {
    const med = medicines.find((m) => m.id === medId);
    if (!med) return;

    const newItems = [...items];
    newItems[index] = {
      ...newItems[index],
      medicineId: med.id,
      medicineName: med.name,
      genericName: med.genericName,
      dosageForm: med.dosageForm || 'Tablet',
      dosage: med.strength || '1 Dose',
    };
    setItems(newItems);
  };

  // Doctor Submit Prescription
  const handleCreatePrescription = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPatientId) {
      setFeedback({ type: 'error', text: 'Please select a patient to prescribe for.' });
      return;
    }
    if (!diagnosis.trim()) {
      setFeedback({ type: 'error', text: 'Please enter a diagnosis or clinical indication.' });
      return;
    }

    const pat = patients.find((p) => p.id === selectedPatientId);
    const doc = doctors.find((d) => d.id === selectedDoctorId);

    const validItems = items.filter((it) => it.medicineName.trim().length > 0);
    if (validItems.length === 0) {
      setFeedback({ type: 'error', text: 'Please add at least one medication to the prescription.' });
      return;
    }

    try {
      const newRx = await api.createPrescription({
        patientId: selectedPatientId,
        patientName: pat?.name || 'Unknown Patient',
        patientAge: pat?.age,
        patientGender: pat?.gender,
        patientContact: pat?.contact,
        allergies: pat?.allergies || 'None',
        doctorId: selectedDoctorId || user?.id || 'doc-general',
        doctorName: doc?.name || user?.name || 'Dr. Medical Officer',
        departmentId: doc?.departmentId,
        departmentName: doc?.departmentName || 'General Clinical Practice',
        diagnosis: diagnosis.trim(),
        clinicalNotes: clinicalNotes.trim(),
        priority,
        status: 'Pending',
        items: validItems,
        createdAt: new Date().toISOString().split('T')[0],
      });

      setFeedback({
        type: 'success',
        text: `Prescription #${newRx.prescriptionNumber} successfully transmitted to the Hospital Pharmacy for ${pat?.name}!`,
      });

      setIsWriteModalOpen(false);
      // Reset form
      setDiagnosis('');
      setClinicalNotes('');
      setPriority('Routine');
      setItems([
        {
          id: 'item-1',
          medicineId: medicines[0]?.id || '',
          medicineName: medicines[0]?.name || '',
          genericName: medicines[0]?.genericName || '',
          dosage: '500mg',
          dosageForm: 'Tablet',
          frequency: 'TDS (3 times daily)',
          duration: '5 Days',
          quantity: 15,
          instructions: 'Take orally after meals with water',
        },
      ]);

      await loadAllData();
      setTimeout(() => setFeedback(null), 5000);
    } catch (err: any) {
      setFeedback({ type: 'error', text: err.message || 'Failed to submit prescription' });
    }
  };

  // Pharmacist Dispense
  const handleDispenseSubmit = async () => {
    if (!selectedRxToDispense) return;

    try {
      setIsDispensing(true);
      const updatedRx = await api.dispensePrescription(selectedRxToDispense.id, {
        pharmacistId: user?.id || 'usr-pharm',
        pharmacistName: user?.name || 'Mohamed Warsame (Chief Pharmacist)',
        pharmacistNotes: pharmacistNotes.trim() || 'Medications verified, labeled, and dispensed according to doctor instructions.',
        deductStock: deductStockCheck,
      });

      setFeedback({
        type: 'success',
        text: `Prescription #${updatedRx.prescriptionNumber} for ${updatedRx.patientName} marked as DISPENSED! Inventory updated.`,
      });

      setSelectedRxToDispense(null);
      setPharmacistNotes('');
      await loadAllData();
      setTimeout(() => setFeedback(null), 5000);
    } catch (err: any) {
      setFeedback({ type: 'error', text: err.message || 'Dispensing failed' });
    } finally {
      setIsDispensing(false);
    }
  };

  // Print Prescription
  const handlePrintRx = (rx: Prescription) => {
    const html = getPrescriptionSlipHtml({
      id: rx.id,
      prescriptionNumber: rx.prescriptionNumber,
      patientId: rx.patientId,
      patientName: rx.patientName,
      patientAge: rx.patientAge,
      patientGender: rx.patientGender,
      patientContact: rx.patientContact,
      allergies: rx.allergies,
      doctorId: rx.doctorId,
      doctorName: rx.doctorName,
      departmentName: rx.departmentName,
      diagnosis: rx.diagnosis,
      clinicalNotes: rx.clinicalNotes,
      priority: rx.priority,
      status: rx.status,
      createdAt: rx.createdAt,
      items: rx.items.map((i) => ({
        medicineName: i.medicineName,
        genericName: i.genericName,
        dosage: i.dosage,
        frequency: i.frequency,
        duration: i.duration,
        quantity: i.quantity,
        instructions: i.instructions,
      })),
      dispensedAt: rx.dispensedAt,
      dispensedByPharmacistName: rx.dispensedByPharmacistName,
      pharmacistNotes: rx.pharmacistNotes,
    });

    setPrintDoc({
      isOpen: true,
      title: `e-Prescription Slip - ${rx.prescriptionNumber} - ${rx.patientName}`,
      html,
    });
  };

  // Delete Prescription (Admin only)
  const handleDeleteRx = async (id: string, number: string) => {
    if (!window.confirm(`Are you sure you want to delete prescription record ${number}?`)) return;
    try {
      await api.deletePrescription(id);
      setFeedback({ type: 'success', text: `Prescription ${number} deleted.` });
      loadAllData();
    } catch (err: any) {
      setFeedback({ type: 'error', text: err.message || 'Delete failed' });
    }
  };

  // Filter Prescriptions
  const filteredPrescriptions = prescriptions.filter((rx) => {
    const matchesSearch =
      rx.prescriptionNumber.toLowerCase().includes(search.toLowerCase()) ||
      rx.patientName.toLowerCase().includes(search.toLowerCase()) ||
      rx.doctorName.toLowerCase().includes(search.toLowerCase()) ||
      rx.diagnosis.toLowerCase().includes(search.toLowerCase()) ||
      rx.items.some(
        (it) =>
          it.medicineName.toLowerCase().includes(search.toLowerCase()) ||
          (it.genericName && it.genericName.toLowerCase().includes(search.toLowerCase()))
      );

    const matchesStatus =
      statusFilter === 'All'
        ? true
        : statusFilter === 'Pending'
        ? rx.status === 'Pending'
        : statusFilter === 'Dispensed'
        ? rx.status === 'Dispensed'
        : statusFilter === 'Urgent'
        ? rx.priority === 'Urgent' || rx.priority === 'STAT / Emergency'
        : true;

    const matchesDoctor = doctorFilter ? rx.doctorId === doctorFilter : true;
    const matchesPatient = patientFilter ? rx.patientId === patientFilter : true;

    // If logged in as Patient, only see own prescriptions
    if (isPatient && user?.name) {
      return matchesSearch && matchesStatus && rx.patientName.toLowerCase().includes(user.name.toLowerCase());
    }

    return matchesSearch && matchesStatus && matchesDoctor && matchesPatient;
  });

  const pendingCount = prescriptions.filter((p) => p.status === 'Pending').length;
  const dispensedCount = prescriptions.filter((p) => p.status === 'Dispensed').length;
  const urgentCount = prescriptions.filter(
    (p) => (p.priority === 'Urgent' || p.priority === 'STAT / Emergency') && p.status === 'Pending'
  ).length;

  return (
    <div className="space-y-6">
      {/* HEADER SECTION */}
      <div className="bg-white p-6 rounded-2xl border border-emerald-100 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-emerald-700 text-white flex items-center justify-center shadow-sm">
              <Pill className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
                Doctor e-Prescriptions & Pharmacy Dispensing Portal
                <span className="text-xs bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded-full border border-emerald-200">
                  Live Dispatch
                </span>
              </h1>
              <p className="text-xs text-slate-500 mt-0.5">
                Seamless digital medication orders directly from Doctors to Pharmacists with live stock checks & dispensing confirmation.
              </p>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer"
            title="Refresh Prescriptions Queue"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
            Refresh
          </button>

          {/* Doctor / Admin: Write Prescription Button */}
          {(isDoctor || isAdmin) && (
            <button
              onClick={() => setIsWriteModalOpen(true)}
              className="px-4 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-black transition-all shadow-md flex items-center gap-2 cursor-pointer hover:shadow-emerald-700/20 hover:-translate-y-0.5"
            >
              <Plus className="w-4 h-4" />
              Write & Send e-Prescription (Rx)
            </button>
          )}

          {/* Pharmacist shortcut to inventory */}
          {(isPharmacist || isAdmin) && onNavigateToPharmacy && (
            <button
              onClick={onNavigateToPharmacy}
              className="px-3.5 py-2 rounded-xl bg-teal-50 hover:bg-teal-100 text-teal-800 border border-teal-200 text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <PackageCheck className="w-3.5 h-3.5 text-teal-700" />
              Pharmacy Stock Inventory
            </button>
          )}
        </div>
      </div>

      {/* FEEDBACK BANNER */}
      {feedback && (
        <div
          className={`p-4 rounded-xl text-xs font-bold flex items-center gap-2.5 shadow-sm border ${
            feedback.type === 'success'
              ? 'bg-emerald-50 text-emerald-900 border-emerald-200'
              : 'bg-red-50 text-red-900 border-red-200'
          }`}
        >
          {feedback.type === 'success' ? (
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          ) : (
            <AlertCircle className="w-5 h-5 text-red-600 shrink-0" />
          )}
          <span>{feedback.text}</span>
        </div>
      )}

      {/* QUICK STATUS METRICS CARDS */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <button
          onClick={() => setStatusFilter('All')}
          className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer ${
            statusFilter === 'All'
              ? 'bg-slate-900 text-white border-slate-900 shadow-sm'
              : 'bg-white text-slate-800 border-slate-200 hover:border-slate-300'
          }`}
        >
          <div className="text-[11px] font-bold opacity-75">All Prescriptions</div>
          <div className="text-xl font-black mt-1">{prescriptions.length}</div>
        </button>

        <button
          onClick={() => setStatusFilter('Pending')}
          className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer relative overflow-hidden ${
            statusFilter === 'Pending'
              ? 'bg-amber-600 text-white border-amber-600 shadow-sm'
              : 'bg-white text-slate-800 border-amber-200 hover:border-amber-300'
          }`}
        >
          <div className="text-[11px] font-bold flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
            Pending Dispense (Pharmacy Queue)
          </div>
          <div className="text-xl font-black mt-1 text-amber-900 font-mono">
            {pendingCount}
          </div>
        </button>

        <button
          onClick={() => setStatusFilter('Dispensed')}
          className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer ${
            statusFilter === 'Dispensed'
              ? 'bg-emerald-700 text-white border-emerald-700 shadow-sm'
              : 'bg-white text-slate-800 border-emerald-200 hover:border-emerald-300'
          }`}
        >
          <div className="text-[11px] font-bold text-emerald-800 flex items-center gap-1.5">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
            Dispensed & Fulfilled
          </div>
          <div className="text-xl font-black mt-1 text-emerald-900">{dispensedCount}</div>
        </button>

        <button
          onClick={() => setStatusFilter('Urgent')}
          className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer ${
            statusFilter === 'Urgent'
              ? 'bg-rose-700 text-white border-rose-700 shadow-sm'
              : 'bg-white text-slate-800 border-rose-200 hover:border-rose-300'
          }`}
        >
          <div className="text-[11px] font-bold text-rose-800 flex items-center gap-1.5">
            <AlertTriangle className="w-3.5 h-3.5 text-rose-600" />
            Urgent / STAT Orders
          </div>
          <div className="text-xl font-black mt-1 text-rose-900">{urgentCount}</div>
        </button>
      </div>

      {/* FILTER & SEARCH BAR */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row gap-3 items-center justify-between">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search by Rx#, patient, doctor, drug, or diagnosis..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 bg-slate-50/50"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
          {/* Doctor Filter */}
          <select
            value={doctorFilter}
            onChange={(e) => setDoctorFilter(e.target.value)}
            className="px-3 py-2 border border-slate-200 rounded-xl text-xs bg-white text-slate-700 focus:ring-2 focus:ring-emerald-500"
          >
            <option value="">All Prescribing Doctors</option>
            {doctors.map((d) => (
              <option key={d.id} value={d.id}>
                {d.name} ({d.specialization})
              </option>
            ))}
          </select>

          {/* Patient Filter */}
          <select
            value={patientFilter}
            onChange={(e) => setPatientFilter(e.target.value)}
            className="px-3 py-2 border border-slate-200 rounded-xl text-xs bg-white text-slate-700 focus:ring-2 focus:ring-emerald-500"
          >
            <option value="">All Patients</option>
            {patients.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name} (MRN: {p.id})
              </option>
            ))}
          </select>

          {(search || doctorFilter || patientFilter || statusFilter !== 'All') && (
            <button
              onClick={() => {
                setSearch('');
                setDoctorFilter('');
                setPatientFilter('');
                setStatusFilter('All');
              }}
              className="px-2.5 py-1.5 text-xs text-slate-500 hover:text-slate-900 underline cursor-pointer"
            >
              Reset Filters
            </button>
          )}
        </div>
      </div>

      {/* PRESCRIPTIONS LIST / QUEUE */}
      <div className="space-y-3.5">
        {loading ? (
          <div className="text-center py-16 bg-white rounded-2xl border border-slate-200">
            <RefreshCw className="w-8 h-8 text-emerald-600 animate-spin mx-auto mb-2" />
            <p className="text-xs text-slate-500 font-bold">Loading prescription dispatch queue...</p>
          </div>
        ) : filteredPrescriptions.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-2xl border border-slate-200 shadow-xs">
            <Pill className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <h3 className="text-sm font-bold text-slate-800">No Prescriptions Found</h3>
            <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
              {search || statusFilter !== 'All'
                ? 'No prescriptions match the current filter criteria.'
                : 'No e-prescriptions have been submitted yet. Doctors can click "Write & Send e-Prescription" above.'}
            </p>
          </div>
        ) : (
          filteredPrescriptions.map((rx) => {
            const isPending = rx.status === 'Pending';
            const isUrgent = rx.priority === 'Urgent' || rx.priority === 'STAT / Emergency';

            return (
              <div
                key={rx.id}
                className={`bg-white rounded-2xl border transition-all duration-150 p-5 shadow-xs hover:shadow-md ${
                  isPending
                    ? isUrgent
                      ? 'border-rose-300 ring-2 ring-rose-100 bg-gradient-to-r from-rose-50/40 via-white to-white'
                      : 'border-amber-200 bg-gradient-to-r from-amber-50/30 via-white to-white'
                    : 'border-slate-200 hover:border-emerald-200'
                }`}
              >
                {/* Top Card Row */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-3.5 border-b border-slate-100">
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-10 h-10 rounded-xl flex items-center justify-center font-mono font-black text-xs shrink-0 ${
                        isPending
                          ? isUrgent
                            ? 'bg-rose-700 text-white shadow-xs'
                            : 'bg-amber-600 text-white shadow-xs'
                          : 'bg-emerald-700 text-white shadow-xs'
                      }`}
                    >
                      Rx
                    </div>
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-mono font-black text-sm text-slate-900">
                          {rx.prescriptionNumber}
                        </span>
                        <span
                          className={`text-[10px] font-black px-2.5 py-0.5 rounded-full uppercase tracking-wider ${
                            rx.status === 'Dispensed'
                              ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                              : 'bg-amber-100 text-amber-900 border border-amber-300 animate-pulse'
                          }`}
                        >
                          {rx.status}
                        </span>
                        {isUrgent && (
                          <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-rose-100 text-rose-900 border border-rose-300 flex items-center gap-1">
                            <AlertTriangle className="w-3 h-3 text-rose-600" />
                            {rx.priority}
                          </span>
                        )}
                        <span className="text-[11px] text-slate-400 font-medium">
                          Issued on {rx.createdAt}
                        </span>
                      </div>

                      <div className="text-xs text-slate-600 mt-1 flex flex-wrap items-center gap-x-3 gap-y-1">
                        <span className="flex items-center gap-1 font-bold text-slate-900">
                          <User className="w-3.5 h-3.5 text-emerald-700" />
                          {rx.patientName}{' '}
                          {rx.patientAge ? `(${rx.patientAge}y, ${rx.patientGender || ''})` : ''}
                        </span>
                        <span className="text-slate-400">•</span>
                        <span className="flex items-center gap-1 text-slate-700">
                          <Stethoscope className="w-3.5 h-3.5 text-slate-500" />
                          Prescribed by <strong>{rx.doctorName}</strong> ({rx.departmentName || 'Clinic'})
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Actions Right */}
                  <div className="flex items-center gap-2 self-start md:self-center">
                    {/* Pharmacist Review & Dispense Button */}
                    {(isPharmacist || isAdmin || isDoctor) && isPending && (
                      <button
                        onClick={() => {
                          setSelectedRxToDispense(rx);
                          setPharmacistNotes('');
                          setDeductStockCheck(true);
                        }}
                        className="px-3.5 py-1.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-black shadow-xs flex items-center gap-1.5 cursor-pointer transition-all hover:scale-105"
                      >
                        <PackageCheck className="w-3.5 h-3.5" />
                        See & Dispense Medications
                      </button>
                    )}

                    {/* View Details / Verified */}
                    {rx.status === 'Dispensed' && (
                      <button
                        onClick={() => setSelectedRxToDispense(rx)}
                        className="px-3 py-1.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-900 border border-emerald-200 text-xs font-bold flex items-center gap-1.5 cursor-pointer"
                      >
                        <Eye className="w-3.5 h-3.5 text-emerald-700" />
                        View Dispense Record
                      </button>
                    )}

                    {/* Print Slip */}
                    <button
                      onClick={() => handlePrintRx(rx)}
                      className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-all cursor-pointer"
                      title="Print Official Prescription Slip"
                    >
                      <Printer className="w-3.5 h-3.5" />
                    </button>

                    {/* Delete (Admin only) */}
                    {isAdmin && (
                      <button
                        onClick={() => handleDeleteRx(rx.id, rx.prescriptionNumber)}
                        className="p-2 rounded-xl bg-red-50 hover:bg-red-100 text-red-700 text-xs font-bold transition-all cursor-pointer"
                        title="Delete Prescription"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>

                {/* Patient Allergies Warning Banner */}
                {rx.allergies && rx.allergies !== 'None' && (
                  <div className="mt-3 px-3 py-1.5 rounded-lg bg-rose-50 border border-rose-200 text-[11px] font-bold text-rose-900 flex items-center gap-2">
                    <ShieldAlert className="w-4 h-4 text-rose-600 shrink-0" />
                    <span>⚠️ Patient Known Allergies: <strong>{rx.allergies}</strong></span>
                  </div>
                )}

                {/* Diagnosis & Doctor Clinical Notes */}
                <div className="mt-3 bg-slate-50/80 rounded-xl p-3 border border-slate-200/70 text-xs">
                  <div className="flex flex-col sm:flex-row sm:items-baseline gap-1.5">
                    <span className="font-extrabold text-slate-900">Doctor Diagnosis:</span>
                    <span className="text-emerald-900 font-bold bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                      {rx.diagnosis}
                    </span>
                  </div>
                  {rx.clinicalNotes && (
                    <div className="text-slate-600 mt-1.5 text-[11px] italic">
                      Doctor Clinical Notes: "{rx.clinicalNotes}"
                    </div>
                  )}
                </div>

                {/* Prescribed Drugs Table */}
                <div className="mt-3 overflow-x-auto">
                  <table className="w-full text-xs text-left border-collapse">
                    <thead>
                      <tr className="bg-slate-100 text-slate-700 border-b border-slate-200 text-[11px] font-extrabold">
                        <th className="py-2 px-3">#</th>
                        <th className="py-2 px-3">Prescribed Medication</th>
                        <th className="py-2 px-3">Dosage & Strength</th>
                        <th className="py-2 px-3">Frequency</th>
                        <th className="py-2 px-3">Duration</th>
                        <th className="py-2 px-3 text-center">Qty</th>
                        <th className="py-2 px-3">Doctor Directions</th>
                        <th className="py-2 px-3 text-center">Dispense Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {rx.items.map((item, idx) => (
                        <tr key={item.id || idx} className="hover:bg-slate-50/60">
                          <td className="py-2.5 px-3 font-bold text-slate-400">{idx + 1}</td>
                          <td className="py-2.5 px-3">
                            <div className="font-extrabold text-slate-900">{item.medicineName}</div>
                            {item.genericName && (
                              <div className="text-[10px] text-slate-500">Generic: {item.genericName}</div>
                            )}
                          </td>
                          <td className="py-2.5 px-3 font-bold text-slate-800">{item.dosage}</td>
                          <td className="py-2.5 px-3 font-medium text-emerald-800">{item.frequency}</td>
                          <td className="py-2.5 px-3 text-slate-600">{item.duration}</td>
                          <td className="py-2.5 px-3 font-black text-slate-900 text-center">{item.quantity}</td>
                          <td className="py-2.5 px-3 text-slate-600 italic">{item.instructions || 'As directed'}</td>
                          <td className="py-2.5 px-3 text-center">
                            {rx.status === 'Dispensed' || item.dispensed ? (
                              <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                                <Check className="w-3 h-3" /> Dispensed
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
                                <Clock className="w-3 h-3" /> Pending
                              </span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Pharmacist Dispensing Verification Footer */}
                {rx.status === 'Dispensed' && (
                  <div className="mt-3.5 pt-3 border-t border-emerald-100 flex flex-col sm:flex-row sm:items-center justify-between text-xs text-emerald-900 bg-emerald-50/50 p-2.5 rounded-xl">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                      <div>
                        Dispensed & Checked by Pharmacist: <strong>{rx.dispensedByPharmacistName}</strong> on{' '}
                        <strong>{rx.dispensedAt}</strong>
                      </div>
                    </div>
                    {rx.pharmacistNotes && (
                      <div className="text-[11px] text-emerald-800 italic mt-1 sm:mt-0">
                        "{rx.pharmacistNotes}"
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* DOCTOR: WRITE E-PRESCRIPTION MODAL */}
      {isWriteModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-3xl w-full p-6 shadow-2xl border border-slate-200 max-h-[90vh] flex flex-col my-8">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-emerald-700 text-white flex items-center justify-center font-bold">
                  <Stethoscope className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-base font-black text-slate-900">
                    Write & Send Doctor e-Prescription (Rx)
                  </h2>
                  <p className="text-xs text-slate-500">
                    Prescribe medications to patient and dispatch directly to Hospital Pharmacist queue.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsWriteModalOpen(false)}
                className="text-slate-400 hover:text-slate-700 p-1.5 rounded-lg hover:bg-slate-100 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreatePrescription} className="overflow-y-auto flex-1 py-4 space-y-4 pr-1">
              {/* STEP 1: PATIENT & DOCTOR SELECTION */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-slate-50 p-3.5 rounded-2xl border border-slate-200">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Select Patient <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={selectedPatientId}
                    onChange={(e) => setSelectedPatientId(e.target.value)}
                    required
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs bg-white font-medium focus:ring-2 focus:ring-emerald-500"
                  >
                    {patients.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name} ({p.gender}, {p.age} yrs) - MRN: {p.id}
                      </option>
                    ))}
                  </select>

                  {currentSelectedPatient && (
                    <div className="mt-1.5 text-[11px] text-slate-500">
                      Blood: <strong>{currentSelectedPatient.bloodGroup}</strong> | Contact: {currentSelectedPatient.contact}
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Prescribing Doctor
                  </label>
                  <select
                    value={selectedDoctorId}
                    onChange={(e) => setSelectedDoctorId(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs bg-white font-medium focus:ring-2 focus:ring-emerald-500"
                  >
                    {doctors.map((d) => (
                      <option key={d.id} value={d.id}>
                        {d.name} ({d.specialization} - {d.departmentName})
                      </option>
                    ))}
                  </select>

                  {currentSelectedDoctor && (
                    <div className="mt-1.5 text-[11px] text-slate-500">
                      Dept: <strong>{currentSelectedDoctor.departmentName}</strong>
                    </div>
                  )}
                </div>
              </div>

              {/* Patient Allergies Notice */}
              {currentSelectedPatient?.allergies && currentSelectedPatient.allergies !== 'None' && (
                <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-xs text-red-900 font-bold flex items-center gap-2">
                  <ShieldAlert className="w-4 h-4 text-red-600 shrink-0" />
                  <span>
                    Clinical Warning: Patient has documented allergies to:{' '}
                    <span className="underline">{currentSelectedPatient.allergies}</span>. Ensure contraindications are checked.
                  </span>
                </div>
              )}

              {/* STEP 2: CLINICAL DIAGNOSIS & PRIORITY */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Primary Clinical Diagnosis / Indication <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Acute Bacterial Bronchitis, Hypertension Refill, Gastroenteritis..."
                    value={diagnosis}
                    onChange={(e) => setDiagnosis(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-emerald-500 font-medium"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Prescription Urgency / Priority
                  </label>
                  <select
                    value={priority}
                    onChange={(e) => setPriority(e.target.value as PrescriptionPriority)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs font-bold focus:ring-2 focus:ring-emerald-500 bg-white"
                  >
                    <option value="Routine">Routine Dispensary</option>
                    <option value="Urgent">Urgent Priority</option>
                    <option value="STAT / Emergency">STAT / Emergency Order</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Doctor Clinical Notes & Instructions for Pharmacist (Optional)
                </label>
                <input
                  type="text"
                  placeholder="e.g. Patient presents with persistent fever for 3 days. Recommend antipyretic counseling."
                  value={clinicalNotes}
                  onChange={(e) => setClinicalNotes(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              {/* STEP 3: PRESCRIBE MEDICATIONS LIST */}
              <div className="border border-slate-200 rounded-2xl p-4 bg-slate-50/50 space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-extrabold text-slate-900 flex items-center gap-1.5">
                    <Pill className="w-4 h-4 text-emerald-600" />
                    Prescribed Medications & Regimen ({items.length})
                  </h3>
                  <button
                    type="button"
                    onClick={handleAddItem}
                    className="px-2.5 py-1 rounded-lg bg-emerald-700 text-white text-[11px] font-bold hover:bg-emerald-800 transition-colors flex items-center gap-1 cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" /> Add Another Drug
                  </button>
                </div>

                <div className="space-y-3">
                  {items.map((item, index) => {
                    // Check live stock status from pharmacyStock
                    const stockMatch = pharmacyStock.find(
                      (s) => s.medicineId === item.medicineId || s.medicineName === item.medicineName
                    );

                    return (
                      <div
                        key={item.id || index}
                        className="bg-white p-3 rounded-xl border border-slate-200 shadow-xs space-y-2.5 relative group"
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-[11px] font-black text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                            Drug #{index + 1}
                          </span>

                          <div className="flex items-center gap-2">
                            {stockMatch ? (
                              <span
                                className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                                  stockMatch.stockQuantity > 20
                                    ? 'bg-emerald-100 text-emerald-800'
                                    : stockMatch.stockQuantity > 0
                                    ? 'bg-amber-100 text-amber-800'
                                    : 'bg-red-100 text-red-800'
                                }`}
                              >
                                Pharmacy Stock: {stockMatch.stockQuantity} units in stock (Batch: {stockMatch.batchNumber})
                              </span>
                            ) : (
                              <span className="text-[10px] text-slate-400 italic">
                                Formulary Listed
                              </span>
                            )}

                            {items.length > 1 && (
                              <button
                                type="button"
                                onClick={() => handleRemoveItem(index)}
                                className="text-red-400 hover:text-red-600 p-1 rounded hover:bg-red-50 transition-colors"
                                title="Remove this drug"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                          {/* Medicine Selector */}
                          <div className="sm:col-span-2">
                            <label className="block text-[11px] font-bold text-slate-600 mb-0.5">
                              Drug / Formulation <span className="text-red-500">*</span>
                            </label>
                            <select
                              value={item.medicineId}
                              onChange={(e) => handleSelectMedicineForItem(index, e.target.value)}
                              className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg text-xs bg-white font-bold"
                            >
                              <option value="">-- Choose Medicine or Custom --</option>
                              {medicines.map((m) => (
                                <option key={m.id} value={m.id}>
                                  {m.name} ({m.genericName}) - {m.strength} [{m.dosageForm}]
                                </option>
                              ))}
                            </select>
                          </div>

                          {/* Dosage & Strength */}
                          <div>
                            <label className="block text-[11px] font-bold text-slate-600 mb-0.5">
                              Dosage & Strength
                            </label>
                            <input
                              type="text"
                              placeholder="e.g. 500mg, 1 tablet, 5ml"
                              value={item.dosage}
                              onChange={(e) => {
                                const newItems = [...items];
                                newItems[index].dosage = e.target.value;
                                setItems(newItems);
                              }}
                              className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg text-xs font-semibold"
                            />
                          </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                          {/* Frequency */}
                          <div>
                            <label className="block text-[11px] font-bold text-slate-600 mb-0.5">
                              Frequency
                            </label>
                            <select
                              value={item.frequency}
                              onChange={(e) => {
                                const newItems = [...items];
                                newItems[index].frequency = e.target.value;
                                setItems(newItems);
                              }}
                              className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg text-xs font-semibold bg-white"
                            >
                              <option value="TDS (3 times daily)">TDS (3 times daily)</option>
                              <option value="BD (Twice daily - Every 12h)">BD (Twice daily - Every 12h)</option>
                              <option value="OD (Once daily in morning)">OD (Once daily in morning)</option>
                              <option value="QDS (4 times daily - Every 6h)">QDS (4 times daily - Every 6h)</option>
                              <option value="Nocte (Once daily at night)">Nocte (Once daily at night)</option>
                              <option value="PRN (As needed for symptoms)">PRN (As needed for symptoms)</option>
                              <option value="STAT (Single immediate dose)">STAT (Single immediate dose)</option>
                            </select>
                          </div>

                          {/* Duration */}
                          <div>
                            <label className="block text-[11px] font-bold text-slate-600 mb-0.5">
                              Duration
                            </label>
                            <input
                              type="text"
                              placeholder="e.g. 5 Days, 7 Days, 30 Days"
                              value={item.duration}
                              onChange={(e) => {
                                const newItems = [...items];
                                newItems[index].duration = e.target.value;
                                setItems(newItems);
                              }}
                              className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg text-xs font-semibold"
                            />
                          </div>

                          {/* Total Quantity */}
                          <div>
                            <label className="block text-[11px] font-bold text-slate-600 mb-0.5">
                              Total Quantity (Units)
                            </label>
                            <input
                              type="number"
                              min="1"
                              value={item.quantity}
                              onChange={(e) => {
                                const newItems = [...items];
                                newItems[index].quantity = Number(e.target.value) || 1;
                                setItems(newItems);
                              }}
                              className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg text-xs font-black text-slate-900"
                            />
                          </div>
                        </div>

                        {/* Directions / Instructions */}
                        <div>
                          <label className="block text-[11px] font-bold text-slate-600 mb-0.5">
                            Specific Patient Directions / Instructions
                          </label>
                          <input
                            type="text"
                            placeholder="e.g. Take after full meal with plenty of water. Avoid taking with dairy products."
                            value={item.instructions}
                            onChange={(e) => {
                              const newItems = [...items];
                              newItems[index].instructions = e.target.value;
                              setItems(newItems);
                            }}
                            className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg text-xs"
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Submit Buttons */}
              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsWriteModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-black transition-all shadow-md flex items-center gap-2 cursor-pointer"
                >
                  <Send className="w-4 h-4" />
                  Transmit e-Prescription to Pharmacy
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* PHARMACIST: REVIEW & DISPENSE MODAL */}
      {selectedRxToDispense && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-6 shadow-2xl border border-slate-200 max-h-[90vh] flex flex-col my-8">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-xl bg-emerald-700 text-white flex items-center justify-center font-bold">
                  <PackageCheck className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-base font-black text-slate-900">
                    Pharmacist Prescription Review & Dispense
                  </h2>
                  <p className="text-xs text-slate-500 font-mono">
                    Rx Reference: {selectedRxToDispense.prescriptionNumber}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setSelectedRxToDispense(null)}
                className="text-slate-400 hover:text-slate-700 p-1.5 rounded-lg hover:bg-slate-100 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="overflow-y-auto flex-1 py-4 space-y-4">
              {/* Doctor & Patient Overview Card */}
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div>
                    <span className="text-[10px] font-extrabold uppercase text-slate-400 block">
                      Patient Details
                    </span>
                    <div className="font-extrabold text-slate-900 text-sm mt-0.5">
                      {selectedRxToDispense.patientName}
                    </div>
                    <div className="text-slate-500 text-[11px] mt-0.5">
                      Age: {selectedRxToDispense.patientAge || 'N/A'} yrs | Gender: {selectedRxToDispense.patientGender || 'N/A'} | MRN: {selectedRxToDispense.patientId}
                    </div>
                    {selectedRxToDispense.allergies && selectedRxToDispense.allergies !== 'None' && (
                      <div className="mt-1 text-[11px] text-red-700 font-extrabold bg-red-100 px-2 py-0.5 rounded inline-block border border-red-200">
                        ⚠️ Allergies: {selectedRxToDispense.allergies}
                      </div>
                    )}
                  </div>

                  <div className="sm:text-right">
                    <span className="text-[10px] font-extrabold uppercase text-slate-400 block">
                      Prescribing Physician
                    </span>
                    <div className="font-extrabold text-emerald-800 text-sm mt-0.5">
                      {selectedRxToDispense.doctorName}
                    </div>
                    <div className="text-slate-500 text-[11px] mt-0.5">
                      {selectedRxToDispense.departmentName || 'Clinical Department'}
                    </div>
                    <div className="text-slate-400 text-[11px]">
                      Issued: {selectedRxToDispense.createdAt}
                    </div>
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-200 text-xs">
                  <span className="font-bold text-slate-700">Diagnosis: </span>
                  <span className="font-extrabold text-slate-900">{selectedRxToDispense.diagnosis}</span>
                  {selectedRxToDispense.clinicalNotes && (
                    <div className="text-[11px] text-slate-500 italic mt-0.5">
                      Notes: {selectedRxToDispense.clinicalNotes}
                    </div>
                  )}
                </div>
              </div>

              {/* What Doctor Prescribed - Detailed Item Breakdown */}
              <div className="border border-slate-200 rounded-2xl p-4 bg-white space-y-3">
                <h3 className="text-xs font-black text-slate-900 flex items-center justify-between">
                  <span>💊 What the Doctor Prescribed ({selectedRxToDispense.items.length} Medications):</span>
                  <span className="text-[11px] text-slate-500 font-normal">
                    Verify against stock before dispensing
                  </span>
                </h3>

                <div className="space-y-2">
                  {selectedRxToDispense.items.map((item, idx) => {
                    const stockItem = pharmacyStock.find(
                      (s) => s.medicineId === item.medicineId || s.medicineName.toLowerCase() === item.medicineName.toLowerCase()
                    );
                    const hasStock = stockItem ? stockItem.stockQuantity >= item.quantity : false;

                    return (
                      <div
                        key={idx}
                        className={`p-3 rounded-xl border text-xs space-y-1.5 ${
                          hasStock
                            ? 'bg-slate-50 border-slate-200'
                            : 'bg-amber-50/60 border-amber-200'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div className="font-extrabold text-slate-900 text-sm">
                            {idx + 1}. {item.medicineName}
                          </div>
                          {stockItem ? (
                            <span
                              className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                                hasStock
                                  ? 'bg-emerald-100 text-emerald-900 border border-emerald-200'
                                  : 'bg-red-100 text-red-900 border border-red-200'
                              }`}
                            >
                              Stock: {stockItem.stockQuantity} available ({stockItem.batchNumber})
                            </span>
                          ) : (
                            <span className="text-[10px] text-slate-400 bg-slate-100 px-2 py-0.5 rounded">
                              General Stock
                            </span>
                          )}
                        </div>

                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px] text-slate-700 bg-white p-2 rounded-lg border border-slate-100">
                          <div>
                            <span className="text-slate-400 block text-[10px]">Dosage</span>
                            <strong>{item.dosage}</strong>
                          </div>
                          <div>
                            <span className="text-slate-400 block text-[10px]">Frequency</span>
                            <strong className="text-emerald-800">{item.frequency}</strong>
                          </div>
                          <div>
                            <span className="text-slate-400 block text-[10px]">Duration</span>
                            <strong>{item.duration}</strong>
                          </div>
                          <div>
                            <span className="text-slate-400 block text-[10px]">Quantity</span>
                            <strong className="text-slate-900">{item.quantity} Units</strong>
                          </div>
                        </div>

                        <div className="text-[11px] text-slate-600 italic">
                          <strong>Instructions:</strong> {item.instructions || 'As directed by physician.'}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Pharmacist Dispensing Form (If not already dispensed) */}
              {selectedRxToDispense.status === 'Pending' && (
                <div className="bg-emerald-50/70 p-4 rounded-2xl border border-emerald-200 space-y-3">
                  <h4 className="text-xs font-black text-emerald-950 flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-700" />
                    Pharmacist Dispensing Confirmation & Verification
                  </h4>

                  <label className="flex items-center gap-2 text-xs font-bold text-emerald-900 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={deductStockCheck}
                      onChange={(e) => setDeductStockCheck(e.target.checked)}
                      className="w-4 h-4 text-emerald-600 rounded focus:ring-emerald-500"
                    />
                    <span>Automatically deduct dispensed medication quantities from Pharmacy Inventory stock</span>
                  </label>

                  <div>
                    <label className="block text-[11px] font-bold text-emerald-900 mb-1">
                      Pharmacist Remarks & Patient Counseling Notes
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. All drugs verified, expiry checked, patient counseled on hydration and taking after meals."
                      value={pharmacistNotes}
                      onChange={(e) => setPharmacistNotes(e.target.value)}
                      className="w-full px-3 py-2 border border-emerald-300 rounded-xl text-xs bg-white focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>
                </div>
              )}
            </div>

            <div className="flex items-center justify-between pt-4 border-t border-slate-100">
              <button
                type="button"
                onClick={() => handlePrintRx(selectedRxToDispense)}
                className="px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-colors flex items-center gap-1.5 cursor-pointer"
              >
                <Printer className="w-3.5 h-3.5" />
                Print Rx Document
              </button>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setSelectedRxToDispense(null)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 transition-colors"
                >
                  Close
                </button>

                {selectedRxToDispense.status === 'Pending' && (
                  <button
                    type="button"
                    disabled={isDispensing}
                    onClick={handleDispenseSubmit}
                    className="px-5 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-black transition-all shadow-md flex items-center gap-2 cursor-pointer disabled:opacity-50"
                  >
                    <Check className="w-4 h-4" />
                    {isDispensing ? 'Dispensing...' : 'Confirm & Dispense to Patient'}
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* PRINT DOCUMENT MODAL */}
      <PrintDocumentModal
        isOpen={printDoc.isOpen}
        onClose={() => setPrintDoc({ isOpen: false, title: '', html: '' })}
        title={printDoc.title}
        htmlContent={printDoc.html}
      />
    </div>
  );
};
