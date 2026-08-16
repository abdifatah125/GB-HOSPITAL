import React, { useState, useEffect } from 'react';
import { Patient, Appointment, LabTestRequest, Invoice, MaternityRecord, DoctorStaff } from '../types';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { getPatientCardHtml } from '../utils/printDocument';
import { PrintDocumentModal } from '../components/PrintDocumentModal';
import {
  Users,
  Plus,
  Search,
  Eye,
  Edit2,
  Trash2,
  Phone,
  MapPin,
  AlertCircle,
  Activity,
  Calendar,
  TestTube,
  Receipt,
  Baby,
  CheckCircle2,
  Printer,
  RefreshCw,
  X,
  ArrowRightLeft,
  ShieldAlert,
  Pill,
} from 'lucide-react';

interface PatientManagementProps {
  onNavigateToPrescriptions?: (patientId?: string) => void;
}

export const PatientManagement: React.FC<PatientManagementProps> = ({ onNavigateToPrescriptions }) => {
  const { user } = useAuth();
  const isDoctor = user?.role === 'Doctor';

  const [patients, setPatients] = useState<Patient[]>([]);
  const [doctors, setDoctors] = useState<DoctorStaff[]>([]);
  const [search, setSearch] = useState('');
  const [bloodFilter, setBloodFilter] = useState('');
  const [genderFilter, setGenderFilter] = useState('');
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Print Document Modal
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

  // Patient Modal Form
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingPat, setEditingPat] = useState<Patient | null>(null);

  // Form state
  const [name, setName] = useState('');
  const [age, setAge] = useState<number>(30);
  const [gender, setGender] = useState<'Male' | 'Female' | 'Other'>('Female');
  const [contact, setContact] = useState('');
  const [email, setEmail] = useState('');
  const [address, setAddress] = useState('');
  const [bloodGroup, setBloodGroup] = useState<'A+' | 'A-' | 'B+' | 'B-' | 'O+' | 'O-' | 'AB+' | 'AB-'>('O+');
  const [medicalHistory, setMedicalHistory] = useState('');
  const [allergies, setAllergies] = useState('');
  const [emergencyContact, setEmergencyContact] = useState('');

  // Detailed Patient Profile Modal View
  const [viewingPatient, setViewingPatient] = useState<Patient | null>(null);
  const [patientApts, setPatientApts] = useState<Appointment[]>([]);
  const [patientLabs, setPatientLabs] = useState<LabTestRequest[]>([]);
  const [patientInvoices, setPatientInvoices] = useState<Invoice[]>([]);
  const [patientMaternity, setPatientMaternity] = useState<MaternityRecord | null>(null);

  // Doctor Patient Referral Modal State
  const [isReferralModalOpen, setIsReferralModalOpen] = useState(false);
  const [referringPatient, setReferringPatient] = useState<Patient | null>(null);
  const [targetDoctorId, setTargetDoctorId] = useState('');
  const [referralReason, setReferralReason] = useState('Specialist Clinical Consultation');
  const [referralNotes, setReferralNotes] = useState('');
  const [referralDate, setReferralDate] = useState(new Date().toISOString().split('T')[0]);
  const [referralTimeSlot, setReferralTimeSlot] = useState('09:30 AM');

  const [feedback, setFeedback] = useState<string | null>(null);

  const loadPatients = async () => {
    try {
      const [patData, docData] = await Promise.all([
        api.getPatients(),
        api.getDoctors(),
      ]);
      setPatients(patData);
      setDoctors(docData);
      if (docData.length > 0 && !targetDoctorId) {
        setTargetDoctorId(docData[0].id);
      }
    } catch (err) {
      console.warn('Error loading patients', err);
    }
  };

  const handleManualRefresh = async () => {
    setIsRefreshing(true);
    try {
      await loadPatients();
      setFeedback('Patient directory refreshed with latest records.');
      setTimeout(() => setFeedback(null), 3000);
    } catch (err: any) {
      console.error(err);
    } finally {
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    loadPatients();
  }, []);

  const handleOpenPrintCard = (pat: Patient) => {
    const html = getPatientCardHtml(pat);
    const text = `
GARASBALEY HOSPITAL - PATIENT CARD
MRN: ${pat.id}
Name: ${pat.name} | Age/Gender: ${pat.age} yrs / ${pat.gender}
Blood Group: ${pat.bloodGroup} | Contact: ${pat.contact}
Emergency Contact: ${pat.emergencyContact}
Address: ${pat.address}
Allergies: ${pat.allergies || 'None'}
Medical Notes: ${pat.medicalHistory || 'None'}
    `.trim();

    setPrintDoc({
      isOpen: true,
      title: `Patient Card - ${pat.name}`,
      html,
      rawText: text,
    });
  };

  const handleOpenForm = (pat?: Patient) => {
    if (pat) {
      setEditingPat(pat);
      setName(pat.name);
      setAge(pat.age);
      setGender(pat.gender);
      setContact(pat.contact);
      setEmail(pat.email || '');
      setAddress(pat.address);
      setBloodGroup(pat.bloodGroup);
      setMedicalHistory(pat.medicalHistory);
      setAllergies(pat.allergies);
      setEmergencyContact(pat.emergencyContact);
    } else {
      if (isDoctor) {
        setFeedback('Access Restricted: Doctor accounts cannot register new patients. Registration is performed at the Reception Desk.');
        setTimeout(() => setFeedback(null), 4000);
        return;
      }
      setEditingPat(null);
      setName('');
      setAge(28);
      setGender('Female');
      setContact('+252 61 7000000');
      setEmail('');
      setAddress('Garasbaley Area, Block B');
      setBloodGroup('O+');
      setMedicalHistory('No prior chronic conditions recorded.');
      setAllergies('None known');
      setEmergencyContact('Family Member (+252 61 7000000)');
    }
    setIsFormOpen(true);
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const patData: Partial<Patient> = {
      name,
      age: Number(age),
      gender,
      contact,
      email,
      address,
      bloodGroup,
      medicalHistory,
      allergies,
      emergencyContact,
    };

    try {
      if (editingPat) {
        await api.updatePatient(editingPat.id, patData);
        setFeedback(`Patient record for "${name}" updated successfully.`);
      } else {
        if (isDoctor) {
          throw new Error('Doctor accounts cannot register new patients.');
        }
        await api.createPatient(patData);
        setFeedback(`New patient "${name}" registered at GB Hospital.`);
      }
      setIsFormOpen(false);
      loadPatients();
      setTimeout(() => setFeedback(null), 3000);
    } catch (err: any) {
      alert(err.message || 'Operation failed');
    }
  };

  const handleDelete = async (id: string, patName: string) => {
    if (isDoctor) {
      setFeedback('Access Restricted: Patient record deletion is restricted to Hospital Admin.');
      setTimeout(() => setFeedback(null), 3000);
      return;
    }
    if (confirm(`Are you sure you want to delete patient record for ${patName}?`)) {
      try {
        await api.deletePatient(id);
        setFeedback(`Patient ${patName} deleted.`);
        loadPatients();
        setTimeout(() => setFeedback(null), 3000);
      } catch (err: any) {
        alert(err.message || 'Delete failed');
      }
    }
  };

  // Open detailed medical history profile
  const handleViewProfile = async (pat: Patient) => {
    setViewingPatient(pat);
    try {
      const [apts, labs, invs, matRes] = await Promise.all([
        api.getAppointments(),
        api.getLabTests(),
        api.getInvoices(),
        api.getMaternityData(),
      ]);

      setPatientApts(apts.filter((a) => a.patientId === pat.id));
      setPatientLabs(labs.filter((l) => l.patientId === pat.id));
      setPatientInvoices(invs.filter((i) => i.patientId === pat.id));

      const matRecord = matRes.records.find((m) => m.patientId === pat.id);
      setPatientMaternity(matRecord || null);
    } catch (err) {
      console.warn('Error loading patient deep details', err);
    }
  };

  // Open Doctor Referral Modal
  const handleOpenReferral = (pat: Patient) => {
    setReferringPatient(pat);
    setReferralDate(new Date().toISOString().split('T')[0]);
    setReferralTimeSlot('09:30 AM');
    setReferralReason('Specialist Clinical Consultation');
    setReferralNotes('');
    setIsReferralModalOpen(true);
  };

  const handleExecuteReferral = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!referringPatient) return;

    const doc = doctors.find((d) => d.id === targetDoctorId);
    if (!doc) {
      alert('Please select a doctor to refer to.');
      return;
    }

    try {
      await api.createAppointment({
        patientId: referringPatient.id,
        patientName: referringPatient.name,
        doctorId: doc.id,
        doctorName: doc.name,
        departmentId: doc.departmentId,
        departmentName: doc.departmentName,
        date: referralDate,
        timeSlot: referralTimeSlot,
        fee: doc.consultationFee,
        notes: `Clinical Referral by Dr. ${user?.name || 'Physician'} (${referralReason})${referralNotes ? `: ${referralNotes}` : ''}`,
        status: 'Confirmed',
        transferredFromDoctorName: user?.name ? `Dr. ${user.name}` : 'Referring Doctor',
        transferredReason: referralReason,
        transferredAt: new Date().toISOString(),
      });

      setFeedback(`Patient ${referringPatient.name} referred to ${doc.name} (${doc.departmentName}) successfully.`);
      setIsReferralModalOpen(false);
      setReferringPatient(null);
      setTimeout(() => setFeedback(null), 4000);
    } catch (err: any) {
      alert(err.message || 'Failed to create doctor referral appointment.');
    }
  };

  const filteredPatients = patients.filter((p) => {
    const matchesSearch =
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.contact.includes(search) ||
      p.address.toLowerCase().includes(search.toLowerCase());
    const matchesBlood = bloodFilter ? p.bloodGroup === bloodFilter : true;
    const matchesGender = genderFilter ? p.gender === genderFilter : true;
    return matchesSearch && matchesBlood && matchesGender;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-emerald-100 shadow-sm">
        <div>
          <h1 className="text-xl font-extrabold text-emerald-950 flex items-center gap-2">
            <Users className="w-6 h-6 text-emerald-600" /> Patient Registry & Electronic Health Records
          </h1>
          <p className="text-xs text-emerald-800 mt-1">
            {isDoctor
              ? 'Physician Clinical EHR View: Access medical histories, diagnostic tests, and refer patients to specialist doctors.'
              : 'Register, search, update, and manage complete patient profiles and reception check-ins.'}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleManualRefresh}
            disabled={isRefreshing}
            className="bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300 font-bold text-xs px-3.5 py-2.5 rounded-xl transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
            title="Refresh patient list"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin text-emerald-600' : ''}`} />
            <span>{isRefreshing ? 'Refreshing...' : 'Refresh Records'}</span>
          </button>

          {/* DOCTOR RESTRICTION: Disable Patient Registration for Doctors */}
          {isDoctor ? (
            <div
              className="bg-emerald-50 text-emerald-900 border border-emerald-300 font-bold text-xs px-3.5 py-2.5 rounded-xl flex items-center gap-2"
              title="Patient Registration is performed exclusively at the Reception Desk"
            >
              <ShieldAlert className="w-4 h-4 text-emerald-700 shrink-0" />
              <span>Registration Restricted to Reception</span>
            </div>
          ) : (
            <button
              onClick={() => handleOpenForm()}
              className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs px-4 py-2.5 rounded-xl transition-all shadow-md flex items-center justify-center gap-2 shrink-0 cursor-pointer"
            >
              <Plus className="w-4 h-4" /> Register New Patient
            </button>
          )}
        </div>
      </div>

      {feedback && (
        <div className="p-3 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-xl text-xs font-semibold flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{feedback}</span>
        </div>
      )}

      {/* Search & Filters */}
      <div className="bg-white p-4 rounded-2xl border border-emerald-100 shadow-sm flex flex-col md:flex-row gap-3 items-center">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search patient by name, phone number, or address..."
            className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-xl text-xs focus:ring-2 focus:ring-emerald-500"
          />
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto">
          <select
            value={bloodFilter}
            onChange={(e) => setBloodFilter(e.target.value)}
            className="bg-emerald-50 border border-emerald-200 text-emerald-900 rounded-xl px-3 py-2 text-xs font-bold"
          >
            <option value="">All Blood Types</option>
            {['A+', 'A-', 'B+', 'B-', 'O+', 'O-', 'AB+', 'AB-'].map((b) => (
              <option key={b} value={b}>{b}</option>
            ))}
          </select>

          <select
            value={genderFilter}
            onChange={(e) => setGenderFilter(e.target.value)}
            className="bg-emerald-50 border border-emerald-200 text-emerald-900 rounded-xl px-3 py-2 text-xs font-bold"
          >
            <option value="">All Genders</option>
            <option value="Female">Female</option>
            <option value="Male">Male</option>
          </select>
        </div>
      </div>

      {/* Patient Table */}
      <div className="bg-white rounded-2xl border border-emerald-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-emerald-800 text-emerald-100 uppercase text-[11px] font-extrabold tracking-wider">
              <tr>
                <th className="p-3.5">Patient Name</th>
                <th className="p-3.5">Age / Gender</th>
                <th className="p-3.5">Blood Group</th>
                <th className="p-3.5">Contact Phone</th>
                <th className="p-3.5">Allergies</th>
                <th className="p-3.5">Address</th>
                <th className="p-3.5 text-right">Clinical & Administrative Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 font-medium text-gray-700">
              {filteredPatients.map((pat) => (
                <tr key={pat.id} className="hover:bg-emerald-50/50 transition-colors">
                  <td className="p-3.5 font-bold text-emerald-950">
                    <div>{pat.name}</div>
                    <div className="text-[10px] text-gray-400 font-normal">ID: {pat.id}</div>
                  </td>
                  <td className="p-3.5">
                    {pat.age} yrs / {pat.gender}
                  </td>
                  <td className="p-3.5">
                    <span className="bg-red-50 text-red-700 font-black px-2 py-0.5 rounded border border-red-200">
                      {pat.bloodGroup}
                    </span>
                  </td>
                  <td className="p-3.5">{pat.contact}</td>
                  <td className="p-3.5">
                    <span className="text-amber-700 font-semibold">{pat.allergies || 'None'}</span>
                  </td>
                  <td className="p-3.5 truncate max-w-xs">{pat.address}</td>
                  <td className="p-3.5 text-right space-x-1.5 whitespace-nowrap">
                    <button
                      onClick={() => handleViewProfile(pat)}
                      className="p-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg transition-colors font-bold text-xs inline-flex items-center gap-1 cursor-pointer shadow-2xs"
                      title="View Full Medical Record"
                    >
                      <Eye className="w-3.5 h-3.5" /> Record
                    </button>

                    {/* Prescribe Medication Button */}
                    {onNavigateToPrescriptions && (
                      <button
                        onClick={() => onNavigateToPrescriptions(pat.id)}
                        className="p-1.5 bg-emerald-50 text-emerald-900 hover:bg-emerald-100 rounded-lg transition-colors border border-emerald-300 font-black text-xs inline-flex items-center gap-1 cursor-pointer"
                        title="Write and Send Doctor e-Prescription (Rx) to Pharmacy"
                      >
                        <Pill className="w-3.5 h-3.5 text-emerald-700" /> Prescribe Rx
                      </button>
                    )}

                    {/* Refer to Specialist Doctor */}
                    <button
                      onClick={() => handleOpenReferral(pat)}
                      className="p-1.5 bg-purple-50 text-purple-800 hover:bg-purple-100 rounded-lg transition-colors border border-purple-300 font-bold text-xs inline-flex items-center gap-1 cursor-pointer"
                      title="Refer / Transfer Patient to Another Doctor"
                    >
                      <ArrowRightLeft className="w-3.5 h-3.5 text-purple-600" /> Refer Doctor
                    </button>

                    <button
                      onClick={() => handleOpenPrintCard(pat)}
                      className="p-1.5 bg-blue-50 text-blue-700 hover:bg-blue-100 rounded-lg transition-colors border border-blue-200 font-bold text-xs inline-flex items-center gap-1 cursor-pointer"
                      title="Print Official Reception Patient Card"
                    >
                      <Printer className="w-3.5 h-3.5" /> Card
                    </button>

                    {!isDoctor && (
                      <>
                        <button
                          onClick={() => handleOpenForm(pat)}
                          className="p-1.5 bg-emerald-100 text-emerald-800 hover:bg-emerald-200 rounded-lg transition-colors border border-emerald-300 cursor-pointer"
                          title="Edit Patient"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDelete(pat.id, pat.name)}
                          className="p-1.5 bg-red-50 text-red-600 hover:bg-red-100 rounded-lg transition-colors border border-red-200 cursor-pointer"
                          title="Delete Patient"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Patient Register / Edit Modal Form */}
      {isFormOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-xl w-full p-6 space-y-4 shadow-2xl border border-emerald-100">
            <h2 className="text-base font-extrabold text-emerald-950 border-b pb-2">
              {editingPat ? `Update EHR: ${editingPat.name}` : 'Register New Patient'}
            </h2>

            <form onSubmit={handleFormSubmit} className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Full Name</label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Khadija Abdi"
                    className="w-full px-3 py-1.5 border border-gray-300 rounded-lg text-xs"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Age</label>
                  <input
                    type="number"
                    required
                    min={0}
                    max={120}
                    value={age}
                    onChange={(e) => setAge(Number(e.target.value))}
                    className="w-full px-3 py-1.5 border border-gray-300 rounded-lg text-xs"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Gender</label>
                  <select
                    value={gender}
                    onChange={(e) => setGender(e.target.value as any)}
                    className="w-full px-3 py-1.5 border border-gray-300 rounded-lg text-xs font-semibold"
                  >
                    <option value="Female">Female</option>
                    <option value="Male">Male</option>
                    <option value="Other">Other</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Blood Group</label>
                  <select
                    value={bloodGroup}
                    onChange={(e) => setBloodGroup(e.target.value as any)}
                    className="w-full px-3 py-1.5 border border-gray-300 rounded-lg text-xs font-bold text-red-700"
                  >
                    {['A+', 'A-', 'B+', 'B-', 'O+', 'O-', 'AB+', 'AB-'].map((b) => (
                      <option key={b} value={b}>{b}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Phone Number</label>
                  <input
                    type="text"
                    required
                    value={contact}
                    onChange={(e) => setContact(e.target.value)}
                    placeholder="+252 61 7000000"
                    className="w-full px-3 py-1.5 border border-gray-300 rounded-lg text-xs"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Residential Address</label>
                <input
                  type="text"
                  required
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="Garasbaley, Mogadishu"
                  className="w-full px-3 py-1.5 border border-gray-300 rounded-lg text-xs"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Known Allergies</label>
                <input
                  type="text"
                  value={allergies}
                  onChange={(e) => setAllergies(e.target.value)}
                  placeholder="e.g. Penicillin, Sulfa, Nuts"
                  className="w-full px-3 py-1.5 border border-gray-300 rounded-lg text-xs text-amber-800 font-semibold"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Medical History / Chronic Conditions</label>
                <textarea
                  rows={2}
                  value={medicalHistory}
                  onChange={(e) => setMedicalHistory(e.target.value)}
                  placeholder="e.g. Hypertension, Diabetes Type 2, Previous Surgeries..."
                  className="w-full px-3 py-1.5 border border-gray-300 rounded-lg text-xs"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Emergency Contact Person</label>
                <input
                  type="text"
                  required
                  value={emergencyContact}
                  onChange={(e) => setEmergencyContact(e.target.value)}
                  placeholder="Relative Name & Phone Number"
                  className="w-full px-3 py-1.5 border border-gray-300 rounded-lg text-xs"
                />
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t">
                <button
                  type="button"
                  onClick={() => setIsFormOpen(false)}
                  className="px-4 py-2 rounded-lg text-xs font-bold text-gray-600 hover:bg-gray-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold shadow-md"
                >
                  Save Record
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DETAILED PATIENT PROFILE MODAL VIEW */}
      {viewingPatient && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-3xl w-full p-6 space-y-5 shadow-2xl border border-emerald-100 my-8">
            <div className="flex items-center justify-between border-b pb-3">
              <div>
                <span className="text-[11px] font-bold text-emerald-600 uppercase">GB Hospital EHR Profile</span>
                <h2 className="text-xl font-black text-emerald-950">{viewingPatient.name}</h2>
              </div>
              <button
                onClick={() => setViewingPatient(null)}
                className="p-2 hover:bg-gray-100 rounded-full text-gray-500"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Quick Details Badges */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-emerald-50 p-3.5 rounded-xl border border-emerald-100 text-xs">
              <div>
                <span className="text-gray-500 block text-[10px] font-bold">AGE / GENDER</span>
                <strong className="text-emerald-950 font-bold">{viewingPatient.age} yrs / {viewingPatient.gender}</strong>
              </div>
              <div>
                <span className="text-gray-500 block text-[10px] font-bold">BLOOD GROUP</span>
                <strong className="text-red-700 font-extrabold">{viewingPatient.bloodGroup}</strong>
              </div>
              <div>
                <span className="text-gray-500 block text-[10px] font-bold">CONTACT PHONE</span>
                <strong className="text-emerald-950">{viewingPatient.contact}</strong>
              </div>
              <div>
                <span className="text-gray-500 block text-[10px] font-bold">EMERGENCY CONTACT</span>
                <strong className="text-emerald-950 truncate block">{viewingPatient.emergencyContact}</strong>
              </div>
            </div>

            {/* Medical History & Allergies */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div className="p-3 border border-amber-200 bg-amber-50/60 rounded-xl space-y-1">
                <span className="font-extrabold text-amber-900 flex items-center gap-1">
                  <AlertCircle className="w-3.5 h-3.5 text-amber-600" /> Allergies
                </span>
                <p className="text-amber-950 font-bold">{viewingPatient.allergies || 'None recorded'}</p>
              </div>

              <div className="p-3 border border-emerald-200 bg-emerald-50/60 rounded-xl space-y-1">
                <span className="font-extrabold text-emerald-900 flex items-center gap-1">
                  <Activity className="w-3.5 h-3.5 text-emerald-600" /> Medical History
                </span>
                <p className="text-emerald-950">{viewingPatient.medicalHistory || 'No prior medical conditions noted.'}</p>
              </div>
            </div>

            {/* Maternity Record Badge if registered */}
            {patientMaternity && (
              <div className="bg-lime-50 border border-lime-300 p-3.5 rounded-xl space-y-1 text-xs">
                <div className="flex items-center justify-between">
                  <span className="font-extrabold text-lime-900 flex items-center gap-1">
                    <Baby className="w-4 h-4 text-lime-700" /> Active Pregnancy Record (Midwifery Dept)
                  </span>
                  <span className={`px-2 py-0.5 rounded font-extrabold text-[10px] ${patientMaternity.riskLevel === 'High-risk' ? 'bg-red-100 text-red-800' : 'bg-emerald-100 text-emerald-800'}`}>
                    {patientMaternity.riskLevel}
                  </span>
                </div>
                <div className="grid grid-cols-3 gap-2 pt-1 font-semibold text-lime-950">
                  <div>LMP: {patientMaternity.lmpDate}</div>
                  <div>Estimated Due: <strong className="text-emerald-800">{patientMaternity.eddDate}</strong></div>
                  <div>Gravida {patientMaternity.gravida} / Para {patientMaternity.para}</div>
                </div>
              </div>
            )}

            {/* Linked Visit & Appointment History */}
            <div className="space-y-3 pt-2">
              <h3 className="text-xs font-extrabold text-emerald-950 uppercase tracking-wider flex items-center gap-1.5">
                <Calendar className="w-4 h-4 text-emerald-600" /> Consultation & Appointment History ({patientApts.length})
              </h3>

              {patientApts.length > 0 ? (
                <div className="space-y-2 max-h-40 overflow-y-auto pr-1">
                  {patientApts.map((apt) => (
                    <div key={apt.id} className="p-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs flex items-center justify-between">
                      <div>
                        <strong className="text-emerald-950">{apt.doctorName}</strong> ({apt.departmentName})
                        <div className="text-[11px] text-gray-500">{apt.date} at {apt.timeSlot} - {apt.notes}</div>
                      </div>
                      <span className="font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded">{apt.status}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-gray-400 italic">No appointment history logged yet.</p>
              )}
            </div>

            {/* Linked Lab Tests */}
            <div className="space-y-3 pt-2">
              <h3 className="text-xs font-extrabold text-emerald-950 uppercase tracking-wider flex items-center gap-1.5">
                <TestTube className="w-4 h-4 text-emerald-600" /> Laboratory Results ({patientLabs.length})
              </h3>

              {patientLabs.length > 0 ? (
                <div className="space-y-2 max-h-40 overflow-y-auto pr-1">
                  {patientLabs.map((lab) => (
                    <div key={lab.id} className="p-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs space-y-1">
                      <div className="flex items-center justify-between">
                        <strong className="text-emerald-950">{lab.testName}</strong>
                        <span className="font-bold text-xs text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded">{lab.status}</span>
                      </div>
                      <p className="text-gray-700 font-medium">{lab.results || 'Pending laboratory execution'}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-gray-400 italic">No lab tests logged.</p>
              )}
            </div>

            {/* Linked Invoices */}
            <div className="space-y-3 pt-2">
              <h3 className="text-xs font-extrabold text-emerald-950 uppercase tracking-wider flex items-center gap-1.5">
                <Receipt className="w-4 h-4 text-emerald-600" /> Financial Billing Invoices ({patientInvoices.length})
              </h3>

              {patientInvoices.length > 0 ? (
                <div className="space-y-2">
                  {patientInvoices.map((inv) => (
                    <div key={inv.id} className="p-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs flex items-center justify-between">
                      <div>
                        <strong className="text-emerald-950">{inv.invoiceNumber}</strong> ({inv.date})
                        <span className="block text-[11px] text-gray-500">{inv.items.length} items included</span>
                      </div>
                      <div className="text-right">
                        <span className="font-black text-emerald-800 text-sm">${inv.totalAmount}</span>
                        <span className={`block font-bold text-[10px] ${inv.status === 'Paid' ? 'text-emerald-600' : 'text-red-600'}`}>
                          {inv.status}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-gray-400 italic">No billing invoices issued yet.</p>
              )}
            </div>

            <div className="flex flex-wrap justify-between items-center border-t pt-3 gap-2">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => viewingPatient && handleOpenPrintCard(viewingPatient)}
                  className="px-4 py-2 bg-blue-600 text-white font-bold text-xs rounded-xl hover:bg-blue-700 inline-flex items-center gap-1.5 cursor-pointer shadow-xs"
                >
                  <Printer className="w-4 h-4" /> Print Reception Card
                </button>

                {onNavigateToPrescriptions && viewingPatient && (
                  <button
                    onClick={() => {
                      const pid = viewingPatient.id;
                      setViewingPatient(null);
                      onNavigateToPrescriptions(pid);
                    }}
                    className="px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white font-extrabold text-xs rounded-xl inline-flex items-center gap-1.5 cursor-pointer shadow-xs"
                  >
                    <Pill className="w-4 h-4" /> Write e-Prescription (Rx)
                  </button>
                )}
              </div>

              <button
                onClick={() => setViewingPatient(null)}
                className="px-5 py-2 bg-slate-200 text-slate-800 font-bold text-xs rounded-xl hover:bg-slate-300 cursor-pointer"
              >
                Close EHR Profile
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Doctor Referral Modal */}
      {isReferralModalOpen && referringPatient && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 space-y-4 shadow-2xl border border-purple-100">
            <div className="flex justify-between items-center border-b pb-3">
              <h2 className="text-base font-extrabold text-purple-950 flex items-center gap-2">
                <ArrowRightLeft className="w-5 h-5 text-purple-600" /> Refer Patient to Specialist Doctor
              </h2>
              <button
                onClick={() => {
                  setIsReferralModalOpen(false);
                  setReferringPatient(null);
                }}
                className="text-gray-400 hover:text-gray-600 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-3 bg-purple-50 rounded-xl border border-purple-200 text-xs text-purple-900 space-y-1">
              <div><strong>Patient:</strong> {referringPatient.name} (MRN: {referringPatient.id})</div>
              <div><strong>Age / Gender:</strong> {referringPatient.age} yrs / {referringPatient.gender} | <strong>Blood:</strong> {referringPatient.bloodGroup}</div>
              <div><strong>Contact:</strong> {referringPatient.contact}</div>
            </div>

            <form onSubmit={handleExecuteReferral} className="space-y-3 text-xs">
              <div>
                <label className="block text-gray-700 font-bold mb-1">Target Specialist / Doctor</label>
                <select
                  value={targetDoctorId}
                  onChange={(e) => setTargetDoctorId(e.target.value)}
                  className="w-full p-2.5 border border-purple-200 rounded-xl focus:ring-2 focus:ring-purple-500 font-semibold bg-white"
                  required
                >
                  {doctors.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.name} — {d.specialty} ({d.departmentName}) • Fee: ${d.consultationFee}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-gray-700 font-bold mb-1">Primary Referral Reason</label>
                <select
                  value={referralReason}
                  onChange={(e) => setReferralReason(e.target.value)}
                  className="w-full p-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 font-semibold"
                >
                  <option value="Specialist Clinical Consultation">Specialist Clinical Consultation</option>
                  <option value="Second Medical Opinion">Second Medical Opinion</option>
                  <option value="Maternity & OBGYN Care">Maternity & OBGYN Care</option>
                  <option value="Pediatric Specialized Assessment">Pediatric Specialized Assessment</option>
                  <option value="Surgical Evaluation & Procedure">Surgical Evaluation & Procedure</option>
                  <option value="Urgent Outpatient Review">Urgent Outpatient Review</option>
                  <option value="Follow-up Under Specialist">Follow-up Under Specialist</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-gray-700 font-bold mb-1">Consultation Date</label>
                  <input
                    type="date"
                    value={referralDate}
                    onChange={(e) => setReferralDate(e.target.value)}
                    className="w-full p-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-gray-700 font-bold mb-1">Time Slot</label>
                  <select
                    value={referralTimeSlot}
                    onChange={(e) => setReferralTimeSlot(e.target.value)}
                    className="w-full p-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 font-medium"
                  >
                    {['08:30 AM', '09:30 AM', '10:30 AM', '11:30 AM', '02:00 PM', '03:00 PM', '04:00 PM', '05:00 PM'].map((slot) => (
                      <option key={slot} value={slot}>{slot}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-gray-700 font-bold mb-1">Physician Clinical Notes & Instructions</label>
                <textarea
                  value={referralNotes}
                  onChange={(e) => setReferralNotes(e.target.value)}
                  placeholder="Provide clinical summary, differential diagnosis, or specific evaluation requested..."
                  rows={3}
                  className="w-full p-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t">
                <button
                  type="button"
                  onClick={() => {
                    setIsReferralModalOpen(false);
                    setReferringPatient(null);
                  }}
                  className="px-4 py-2 border border-gray-300 rounded-xl font-bold hover:bg-gray-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-purple-700 hover:bg-purple-800 text-white rounded-xl font-bold shadow-md cursor-pointer flex items-center gap-1.5"
                >
                  <ArrowRightLeft className="w-4 h-4" /> Confirm & Issue Referral
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Print Document Modal */}
      <PrintDocumentModal
        isOpen={printDoc.isOpen}
        onClose={() => setPrintDoc((prev) => ({ ...prev, isOpen: false }))}
        title={printDoc.title}
        documentType="Patient Card"
        htmlContent={printDoc.html}
        rawText={printDoc.rawText}
      />
    </div>
  );
};
