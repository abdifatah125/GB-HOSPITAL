import React, { useState, useEffect } from 'react';
import { Appointment, DoctorStaff, Patient, AppointmentStatus } from '../types';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { getAppointmentSlipHtml } from '../utils/printDocument';
import { PrintDocumentModal } from '../components/PrintDocumentModal';
import {
  Calendar,
  Clock,
  UserCheck,
  Users,
  Plus,
  CheckCircle2,
  AlertCircle,
  Search,
  Filter,
  Check,
  XCircle,
  Bell,
  Printer,
  RefreshCw,
  ArrowRightLeft,
  Stethoscope,
  Share2,
  ShieldCheck,
  X,
} from 'lucide-react';

interface AppointmentSchedulingProps {
  preselectedDoctor?: DoctorStaff | null;
}

export const AppointmentScheduling: React.FC<AppointmentSchedulingProps> = ({ preselectedDoctor }) => {
  const { user } = useAuth();
  const isDoctor = user?.role === 'Doctor';
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [doctors, setDoctors] = useState<DoctorStaff[]>([]);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Print Document Modal State
  const [printDoc, setPrintDoc] = useState<{
    isOpen: boolean;
    title: string;
    html: string;
    rawText?: string;
  }>({
    isOpen: false,
    title: '',
    html: '',
  });

  // Filters
  const [doctorFilter, setDoctorFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [dateFilter, setDateFilter] = useState('');
  const [activeTabFilter, setActiveTabFilter] = useState<'all' | 'my' | 'transferred'>('all');

  // Booking Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedPatientId, setSelectedPatientId] = useState('');
  const [selectedDoctorId, setSelectedDoctorId] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [timeSlot, setTimeSlot] = useState('09:00 AM');
  const [notes, setNotes] = useState('');

  // Transfer Consultation Modal
  const [isTransferModalOpen, setIsTransferModalOpen] = useState(false);
  const [transferringApt, setTransferringApt] = useState<Appointment | null>(null);
  const [targetDoctorId, setTargetDoctorId] = useState('');
  const [transferReasonCategory, setTransferReasonCategory] = useState('Specialist Clinical Referral');
  const [customTransferReason, setCustomTransferReason] = useState('');
  const [transferDate, setTransferDate] = useState('');
  const [transferTimeSlot, setTransferTimeSlot] = useState('');
  const [transferClinicalNotes, setTransferClinicalNotes] = useState('');
  const [transferError, setTransferError] = useState<string | null>(null);

  // Notifications
  const [notification, setNotification] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const availableSlots = [
    '08:00 AM',
    '08:30 AM',
    '09:00 AM',
    '09:30 AM',
    '10:00 AM',
    '10:30 AM',
    '11:00 AM',
    '11:30 AM',
    '01:30 PM',
    '02:00 PM',
    '02:30 PM',
    '03:00 PM',
    '03:30 PM',
    '04:00 PM',
  ];

  const loadData = async () => {
    try {
      const [aptRes, docRes, patRes] = await Promise.all([
        api.getAppointments(),
        api.getDoctors(),
        api.getPatients(),
      ]);
      setAppointments(aptRes);
      setDoctors(docRes);
      setPatients(patRes);

      if (preselectedDoctor) {
        setSelectedDoctorId(preselectedDoctor.id);
        setIsModalOpen(true);
      } else if (docRes.length > 0 && !selectedDoctorId) {
        setSelectedDoctorId(docRes[0].id);
      }

      if (patRes.length > 0 && !selectedPatientId) {
        setSelectedPatientId(patRes[0].id);
      }
    } catch (err) {
      console.warn('Error loading appointment schedule', err);
    }
  };

  const handleManualRefresh = async () => {
    setIsRefreshing(true);
    try {
      await loadData();
      setNotification('Appointments schedule refreshed successfully.');
      setTimeout(() => setNotification(null), 3000);
    } catch (err: any) {
      console.error(err);
    } finally {
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [preselectedDoctor]);

  const handleOpenPrintSlip = (apt: Appointment) => {
    const html = getAppointmentSlipHtml(apt);
    const text = `
GARASBALEY HOSPITAL - OPD APPOINTMENT SLIP
Token/Slip ID: ${apt.id}
Patient: ${apt.patientName} ${apt.patientId ? `(MRN: ${apt.patientId})` : ''}
Attending Doctor: ${apt.doctorName}
Department: ${apt.departmentName}
Scheduled Date: ${apt.date} | Time Slot: ${apt.timeSlot}
Status: ${apt.status} | Consultation Fee: $${apt.fee}
${apt.transferredFromDoctorName ? `Referred / Transferred from: ${apt.transferredFromDoctorName} (Reason: ${apt.transferredReason || 'Clinical referral'})` : ''}
Notes: ${apt.notes || 'None'}
    `.trim();

    setPrintDoc({
      isOpen: true,
      title: `Appointment Slip - ${apt.patientName}`,
      html,
      rawText: text,
    });
  };

  const handleBook = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setNotification(null);

    if (isDoctor) {
      setErrorMsg('Access Restricted: Doctor accounts cannot book new initial appointments. Booking is handled at Reception Desk.');
      return;
    }

    const doc = doctors.find((d) => d.id === selectedDoctorId);
    const pat = patients.find((p) => p.id === selectedPatientId);

    if (!doc || !pat) {
      setErrorMsg('Please select a valid doctor and patient.');
      return;
    }

    try {
      const newApt = await api.createAppointment({
        patientId: pat.id,
        patientName: pat.name,
        doctorId: doc.id,
        doctorName: doc.name,
        departmentId: doc.departmentId,
        departmentName: doc.departmentName,
        date,
        timeSlot,
        fee: doc.consultationFee,
        notes,
        status: 'Confirmed',
      });

      setNotification(
        `Appointment booked successfully! Confirmed with ${doc.name} (${doc.departmentName}) for ${pat.name} on ${date} at ${timeSlot}. Notification sent.`
      );
      setIsModalOpen(false);
      setNotes('');
      loadData();
    } catch (err: any) {
      setErrorMsg(err.message || 'Double-booking conflict encountered.');
    }
  };

  const handleStatusChange = async (id: string, newStatus: AppointmentStatus) => {
    try {
      await api.updateAppointment(id, { status: newStatus });
      setNotification(`Appointment status updated to "${newStatus}".`);
      loadData();
      setTimeout(() => setNotification(null), 3000);
    } catch (err: any) {
      alert(err.message || 'Status update failed');
    }
  };

  // Open Transfer Modal
  const handleOpenTransfer = (apt: Appointment) => {
    setTransferringApt(apt);
    const otherDoctors = doctors.filter((d) => d.id !== apt.doctorId);
    setTargetDoctorId(otherDoctors[0]?.id || '');
    setTransferDate(apt.date);
    setTransferTimeSlot(apt.timeSlot);
    setTransferReasonCategory('Specialist Clinical Referral');
    setCustomTransferReason('');
    setTransferClinicalNotes('');
    setTransferError(null);
    setIsTransferModalOpen(true);
  };

  // Execute Transfer to another Doctor
  const handleExecuteTransfer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!transferringApt) return;
    setTransferError(null);

    const targetDoc = doctors.find((d) => d.id === targetDoctorId);
    if (!targetDoc) {
      setTransferError('Please select a target doctor.');
      return;
    }

    if (targetDoc.id === transferringApt.doctorId) {
      setTransferError('Cannot transfer to the same doctor. Please select another physician.');
      return;
    }

    const fullReason = customTransferReason.trim()
      ? `${transferReasonCategory} - ${customTransferReason.trim()}`
      : transferReasonCategory;

    try {
      await api.transferAppointment(transferringApt.id, {
        targetDoctorId: targetDoc.id,
        targetDoctorName: targetDoc.name,
        targetDepartmentId: targetDoc.departmentId,
        targetDepartmentName: targetDoc.departmentName,
        reason: fullReason,
        transferredByDoctorName: user?.name || transferringApt.doctorName,
        transferredByDoctorId: user?.id,
        newDate: transferDate || transferringApt.date,
        newTimeSlot: transferTimeSlot || transferringApt.timeSlot,
        notes: transferClinicalNotes.trim() ? transferClinicalNotes.trim() : undefined,
      });

      setNotification(
        `Consultation transferred successfully! Patient "${transferringApt.patientName}" has been transferred to ${targetDoc.name} (${targetDoc.departmentName}).`
      );
      setIsTransferModalOpen(false);
      setTransferringApt(null);
      await loadData();
      setTimeout(() => setNotification(null), 4000);
    } catch (err: any) {
      setTransferError(err.message || 'Failed to transfer appointment.');
    }
  };

  const currentDoctorProfile = doctors.find(
    (d) =>
      d.email.toLowerCase() === user?.email.toLowerCase() ||
      (user?.name && d.name.toLowerCase().includes(user.name.toLowerCase()))
  );

  const filteredApts = appointments.filter((a) => {
    const matchesDoc = doctorFilter ? a.doctorId === doctorFilter : true;
    const matchesStatus = statusFilter ? a.status === statusFilter : true;
    const matchesDate = dateFilter ? a.date === dateFilter : true;

    // Doctor role tab filters
    if (isDoctor && currentDoctorProfile) {
      if (activeTabFilter === 'my') {
        if (a.doctorId !== currentDoctorProfile.id) return false;
      } else if (activeTabFilter === 'transferred') {
        const isTransferredToMe =
          a.doctorId === currentDoctorProfile.id && Boolean(a.transferredFromDoctorName);
        const isTransferredByMe =
          a.transferredFromDoctorName?.toLowerCase().includes(user?.name.toLowerCase() || '') ||
          a.transferredFromDoctorName?.toLowerCase().includes(currentDoctorProfile.name.toLowerCase());
        if (!isTransferredToMe && !isTransferredByMe && !a.transferredFromDoctorName) {
          return false;
        }
      }
    } else if (activeTabFilter === 'transferred') {
      if (!a.transferredFromDoctorName) return false;
    }

    // Patient role sees their own appointments
    if (user?.role === 'Patient') {
      const matchedPat = patients.find(
        (p) => p.email === user.email || (user?.name && p.name.includes(user.name))
      );
      if (matchedPat && a.patientId !== matchedPat.id) {
        return false;
      }
    }

    return matchesDoc && matchesStatus && matchesDate;
  });

  const transferredCount = appointments.filter((a) => a.transferredFromDoctorName).length;
  const myAppointmentsCount = currentDoctorProfile
    ? appointments.filter((a) => a.doctorId === currentDoctorProfile.id).length
    : 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-emerald-100 shadow-sm">
        <div>
          <h1 className="text-xl font-extrabold text-emerald-950 flex items-center gap-2">
            <Calendar className="w-6 h-6 text-emerald-600" /> Patient Appointment Scheduling & Clinical Transfers
          </h1>
          <p className="text-xs text-emerald-800 mt-1">
            Book consultations, manage doctor daily timetables, avoid slot conflicts, and transfer patients to specialist colleagues.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleManualRefresh}
            disabled={isRefreshing}
            className="bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300 font-bold text-xs px-3.5 py-2.5 rounded-xl transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
            title="Refresh appointments list"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin text-emerald-600' : ''}`} />
            <span>{isRefreshing ? 'Refreshing...' : 'Refresh Schedule'}</span>
          </button>

          {isDoctor ? (
            <div
              className="bg-emerald-50 text-emerald-900 border border-emerald-300 font-bold text-xs px-3.5 py-2.5 rounded-xl flex items-center gap-2"
              title="Appointment booking is handled at the Reception Desk. Doctors can transfer consultations to specialist colleagues."
            >
              <ShieldCheck className="w-4 h-4 text-emerald-700 shrink-0" />
              <span>Booking Handled by Reception</span>
            </div>
          ) : (
            <button
              onClick={() => {
                setErrorMsg(null);
                setIsModalOpen(true);
              }}
              className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs px-4 py-2.5 rounded-xl transition-all shadow-md flex items-center justify-center gap-2 shrink-0 cursor-pointer"
            >
              <Plus className="w-4 h-4" /> Book New Appointment
            </button>
          )}
        </div>
      </div>

      {/* Notification Toast */}
      {notification && (
        <div className="p-4 bg-emerald-700 text-white rounded-2xl shadow-md text-xs font-bold flex items-center gap-2.5">
          <Bell className="w-5 h-5 text-emerald-200 shrink-0 animate-bounce" />
          <span className="flex-1">{notification}</span>
          <button onClick={() => setNotification(null)} className="text-emerald-200 hover:text-white">
            <XCircle className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Category Tabs for Fast Switching */}
      <div className="flex flex-wrap gap-2 border-b border-gray-200 pb-2">
        <button
          onClick={() => setActiveTabFilter('all')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
            activeTabFilter === 'all'
              ? 'bg-emerald-700 text-white shadow-xs'
              : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-200'
          }`}
        >
          <Calendar className="w-3.5 h-3.5" />
          <span>All Appointments ({appointments.length})</span>
        </button>

        {isDoctor && (
          <button
            onClick={() => setActiveTabFilter('my')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTabFilter === 'my'
                ? 'bg-emerald-700 text-white shadow-xs'
                : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-200'
            }`}
          >
            <Stethoscope className="w-3.5 h-3.5" />
            <span>My Consultations ({myAppointmentsCount})</span>
          </button>
        )}

        <button
          onClick={() => setActiveTabFilter('transferred')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
            activeTabFilter === 'transferred'
              ? 'bg-purple-700 text-white shadow-xs'
              : 'bg-purple-50 text-purple-800 hover:bg-purple-100 border border-purple-200'
          }`}
        >
          <ArrowRightLeft className="w-3.5 h-3.5" />
          <span>Transferred / Referred ({transferredCount})</span>
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-2xl border border-emerald-100 shadow-sm flex flex-col sm:flex-row gap-3 items-center">
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Filter className="w-4 h-4 text-emerald-700" />
          <select
            value={doctorFilter}
            onChange={(e) => setDoctorFilter(e.target.value)}
            className="w-full sm:w-auto bg-emerald-50 border border-emerald-200 rounded-xl px-3 py-2 text-xs font-bold text-emerald-900"
          >
            <option value="">All Doctors Schedule</option>
            {doctors.map((d) => (
              <option key={d.id} value={d.id}>
                {d.name} ({d.departmentName})
              </option>
            ))}
          </select>
        </div>

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="w-full sm:w-auto bg-emerald-50 border border-emerald-200 rounded-xl px-3 py-2 text-xs font-bold text-emerald-900"
        >
          <option value="">All Statuses</option>
          <option value="Confirmed">Confirmed</option>
          <option value="Pending">Pending</option>
          <option value="Completed">Completed</option>
          <option value="Cancelled">Cancelled</option>
        </select>

        <input
          type="date"
          value={dateFilter}
          onChange={(e) => setDateFilter(e.target.value)}
          className="w-full sm:w-auto bg-emerald-50 border border-emerald-200 rounded-xl px-3 py-2 text-xs font-bold text-emerald-900"
        />

        {dateFilter && (
          <button
            onClick={() => setDateFilter('')}
            className="text-xs text-red-600 font-bold hover:underline"
          >
            Clear Date Filter
          </button>
        )}
      </div>

      {/* Appointments List */}
      <div className="bg-white rounded-2xl border border-emerald-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-emerald-800 text-emerald-100 uppercase text-[11px] font-extrabold tracking-wider">
              <tr>
                <th className="p-3.5">Date & Time Slot</th>
                <th className="p-3.5">Patient Name</th>
                <th className="p-3.5">Attending Doctor</th>
                <th className="p-3.5">Department</th>
                <th className="p-3.5">Fee</th>
                <th className="p-3.5">Status</th>
                <th className="p-3.5 text-right">Actions & Transfer</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 font-medium text-gray-700">
              {filteredApts.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-gray-500 font-semibold">
                    No appointments match the selected filters.
                  </td>
                </tr>
              ) : (
                filteredApts.map((apt) => {
                  return (
                    <tr key={apt.id} className="hover:bg-emerald-50/50 transition-colors">
                      <td className="p-3.5 font-bold text-emerald-950">
                        <div className="flex items-center gap-1.5">
                          <Calendar className="w-3.5 h-3.5 text-emerald-600" />
                          <span>{apt.date}</span>
                        </div>
                        <div className="flex items-center gap-1.5 text-gray-500 font-normal mt-0.5">
                          <Clock className="w-3.5 h-3.5 text-emerald-600" />
                          <span>{apt.timeSlot}</span>
                        </div>
                      </td>
                      <td className="p-3.5 font-bold text-gray-900">
                        <div>{apt.patientName}</div>
                        {apt.notes && (
                          <div className="text-[10px] text-gray-500 font-normal truncate max-w-xs mt-0.5" title={apt.notes}>
                            {apt.notes}
                          </div>
                        )}
                      </td>
                      <td className="p-3.5 font-bold text-emerald-800">
                        <div>{apt.doctorName}</div>
                        {apt.transferredFromDoctorName && (
                          <div
                            className="mt-1 inline-flex items-center gap-1 text-[10px] font-bold text-purple-800 bg-purple-100 px-2 py-0.5 rounded border border-purple-300"
                            title={`Transferred by ${apt.transferredFromDoctorName}. Reason: ${apt.transferredReason || 'Clinical Referral'}`}
                          >
                            <ArrowRightLeft className="w-3 h-3 text-purple-600 shrink-0" />
                            <span>From {apt.transferredFromDoctorName}</span>
                          </div>
                        )}
                      </td>
                      <td className="p-3.5">{apt.departmentName}</td>
                      <td className="p-3.5 font-black text-emerald-700">${apt.fee}</td>
                      <td className="p-3.5">
                        <span
                          className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase ${
                            apt.status === 'Confirmed'
                              ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                              : apt.status === 'Completed'
                              ? 'bg-blue-100 text-blue-800 border border-blue-300'
                              : apt.status === 'Cancelled'
                              ? 'bg-red-100 text-red-800 border border-red-300'
                              : 'bg-amber-100 text-amber-800 border border-amber-300'
                          }`}
                        >
                          {apt.status}
                        </span>
                      </td>
                      <td className="p-3.5 text-right space-x-1.5 whitespace-nowrap">
                        <button
                          onClick={() => handleOpenPrintSlip(apt)}
                          className="px-2 py-1 bg-blue-50 text-blue-700 hover:bg-blue-100 rounded text-[11px] font-bold border border-blue-200 inline-flex items-center gap-1 cursor-pointer"
                          title="Print OPD Appointment Slip"
                        >
                          <Printer className="w-3 h-3" /> Slip
                        </button>

                        {/* Doctor Transfer to Another Doctor Action */}
                        <button
                          onClick={() => handleOpenTransfer(apt)}
                          disabled={apt.status === 'Cancelled' || apt.status === 'Completed'}
                          className="px-2.5 py-1 bg-purple-50 text-purple-800 hover:bg-purple-100 disabled:opacity-40 disabled:cursor-not-allowed rounded text-[11px] font-bold border border-purple-300 inline-flex items-center gap-1 cursor-pointer"
                          title="Transfer consultation to another doctor"
                        >
                          <ArrowRightLeft className="w-3 h-3 text-purple-600" /> Transfer
                        </button>

                        {apt.status !== 'Completed' && (
                          <button
                            onClick={() => handleStatusChange(apt.id, 'Completed')}
                            className="px-2 py-1 bg-emerald-600 text-white hover:bg-emerald-700 rounded text-[11px] font-bold cursor-pointer"
                            title="Mark as Completed"
                          >
                            Complete
                          </button>
                        )}
                        {apt.status !== 'Cancelled' && (
                          <button
                            onClick={() => handleStatusChange(apt.id, 'Cancelled')}
                            className="px-2 py-1 bg-red-100 text-red-700 hover:bg-red-200 rounded text-[11px] font-bold cursor-pointer"
                            title="Cancel Appointment"
                          >
                            Cancel
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Booking Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 space-y-4 shadow-2xl border border-emerald-100">
            <h2 className="text-base font-extrabold text-emerald-950 border-b pb-2">
              Book Doctor Appointment
            </h2>

            {errorMsg && (
              <div className="p-3 bg-red-50 text-red-800 border border-red-200 rounded-xl text-xs font-semibold flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            <form onSubmit={handleBook} className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Select Patient</label>
                <select
                  required
                  value={selectedPatientId}
                  onChange={(e) => setSelectedPatientId(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-xs font-semibold"
                >
                  {patients.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} (Age: {p.age}, {p.gender})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Select Physician</label>
                <select
                  required
                  value={selectedDoctorId}
                  onChange={(e) => setSelectedDoctorId(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-xs font-bold text-emerald-900"
                >
                  {doctors.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.name} - {d.specialization} (${d.consultationFee})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Appointment Date</label>
                  <input
                    type="date"
                    required
                    min={new Date().toISOString().split('T')[0]}
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-xs font-semibold"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Time Slot</label>
                  <select
                    value={timeSlot}
                    onChange={(e) => setTimeSlot(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-xs font-semibold text-emerald-800"
                  >
                    {availableSlots.map((slot) => (
                      <option key={slot} value={slot}>
                        {slot}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Consultation Reason / Notes</label>
                <textarea
                  rows={2}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="e.g. Fever, antenatal routine checkup, persistent chest ache..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-xs"
                />
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
                  Confirm Booking & Send Alert
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DOCTOR TRANSFER / REFERRAL MODAL */}
      {isTransferModalOpen && transferringApt && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 space-y-4 shadow-2xl border border-purple-200 animate-fade-in">
            <div className="flex items-center justify-between border-b pb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-purple-100 text-purple-700 flex items-center justify-center">
                  <ArrowRightLeft className="w-4 h-4" />
                </div>
                <div>
                  <h2 className="text-base font-extrabold text-purple-950">
                    Transfer Consultation to Another Doctor
                  </h2>
                  <p className="text-[11px] text-gray-500">
                    Refer patient to a specialist or transfer clinical handover.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsTransferModalOpen(false)}
                className="text-gray-400 hover:text-gray-700 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Current Summary Card */}
            <div className="bg-purple-50/70 border border-purple-200 rounded-xl p-3.5 text-xs space-y-1.5">
              <div className="flex justify-between">
                <span className="text-gray-500 font-semibold">Patient:</span>
                <span className="font-extrabold text-purple-950">{transferringApt.patientName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500 font-semibold">Current Doctor:</span>
                <span className="font-bold text-gray-800">{transferringApt.doctorName} ({transferringApt.departmentName})</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500 font-semibold">Current Slot:</span>
                <span className="font-bold text-gray-800">{transferringApt.date} at {transferringApt.timeSlot}</span>
              </div>
            </div>

            {transferError && (
              <div className="p-3 bg-red-50 text-red-800 border border-red-200 rounded-xl text-xs font-semibold flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
                <span>{transferError}</span>
              </div>
            )}

            <form onSubmit={handleExecuteTransfer} className="space-y-3.5">
              <div>
                <label className="block text-xs font-bold text-gray-800 mb-1">
                  Select New Receiving Doctor / Specialist <span className="text-red-500">*</span>
                </label>
                <select
                  required
                  value={targetDoctorId}
                  onChange={(e) => setTargetDoctorId(e.target.value)}
                  className="w-full px-3 py-2 border border-purple-300 rounded-xl text-xs font-bold text-purple-950 focus:ring-2 focus:ring-purple-500 bg-white"
                >
                  <option value="" disabled>-- Select Doctor --</option>
                  {doctors
                    .filter((d) => d.id !== transferringApt.doctorId)
                    .map((d) => (
                      <option key={d.id} value={d.id}>
                        {d.name} — {d.specialization} ({d.departmentName}) [${d.consultationFee}]
                      </option>
                    ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-800 mb-1">
                  Clinical Transfer / Referral Reason <span className="text-red-500">*</span>
                </label>
                <select
                  value={transferReasonCategory}
                  onChange={(e) => setTransferReasonCategory(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-xl text-xs font-semibold text-gray-800 mb-2"
                >
                  <option value="Specialist Clinical Referral">Specialist Clinical Evaluation / Referral</option>
                  <option value="Second Opinion Request">Second Clinical Opinion</option>
                  <option value="Surgical / Diagnostic Workup">Surgical or Diagnostic Workup</option>
                  <option value="Maternity & Midwifery Referral">Obstetric / Maternity Consultation</option>
                  <option value="Pediatric Subspecialty">Pediatric Specialty Care</option>
                  <option value="Shift Handover / Schedule Coverage">Doctor Shift Handover / Coverage</option>
                  <option value="Patient Preference">Patient / Family Preference</option>
                  <option value="Emergency Escalation">Emergency / Critical Escalation</option>
                </select>

                <input
                  type="text"
                  value={customTransferReason}
                  onChange={(e) => setCustomTransferReason(e.target.value)}
                  placeholder="Additional reason details (e.g. Needs cardiac echocardiogram review)..."
                  className="w-full px-3 py-1.5 border border-gray-300 rounded-lg text-xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Transfer Date</label>
                  <input
                    type="date"
                    required
                    min={new Date().toISOString().split('T')[0]}
                    value={transferDate}
                    onChange={(e) => setTransferDate(e.target.value)}
                    className="w-full px-3 py-1.5 border border-gray-300 rounded-lg text-xs font-semibold"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Time Slot</label>
                  <select
                    value={transferTimeSlot}
                    onChange={(e) => setTransferTimeSlot(e.target.value)}
                    className="w-full px-3 py-1.5 border border-gray-300 rounded-lg text-xs font-semibold text-purple-900"
                  >
                    {availableSlots.map((slot) => (
                      <option key={slot} value={slot}>
                        {slot}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  Clinical Handover Notes for Receiving Physician
                </label>
                <textarea
                  rows={2}
                  value={transferClinicalNotes}
                  onChange={(e) => setTransferClinicalNotes(e.target.value)}
                  placeholder="e.g. Patient presents with persistent tachycardia; referred for immediate ECG and cardiology review..."
                  className="w-full px-3 py-1.5 border border-gray-300 rounded-lg text-xs"
                />
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t">
                <button
                  type="button"
                  onClick={() => setIsTransferModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-gray-600 hover:bg-gray-100 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-purple-700 hover:bg-purple-800 text-white rounded-xl text-xs font-bold shadow-md inline-flex items-center gap-1.5 cursor-pointer"
                >
                  <ArrowRightLeft className="w-3.5 h-3.5" />
                  <span>Confirm Doctor Transfer</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Print Appointment Slip Modal */}
      <PrintDocumentModal
        isOpen={printDoc.isOpen}
        onClose={() => setPrintDoc((prev) => ({ ...prev, isOpen: false }))}
        title={printDoc.title}
        documentType="Appointment Slip"
        htmlContent={printDoc.html}
        rawText={printDoc.rawText}
      />
    </div>
  );
};

