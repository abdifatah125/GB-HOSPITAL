import React, { useState, useEffect } from 'react';
import { LabTestRequest, Patient, DoctorStaff, LabTestStatus } from '../types';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { getLabReportHtml } from '../utils/printDocument';
import { PrintDocumentModal } from '../components/PrintDocumentModal';
import {
  TestTube,
  Plus,
  CheckCircle2,
  Clock,
  Search,
  Printer,
  RefreshCw,
  X,
  Send,
  Stethoscope,
  User,
  FlaskConical,
  Sparkles,
  Layers,
  Check,
  AlertCircle,
  XCircle,
  FileText,
  Barcode,
  Calendar,
  AlertTriangle,
  Flame,
} from 'lucide-react';

const COMMON_TEST_PRESETS = [
  {
    name: 'Full Blood Count (FBC) & Hemoglobin',
    category: 'Hematology',
    sampleType: 'Venous Whole Blood (EDTA Tube)',
    referenceRange: 'Hb: 12.0 - 16.5 g/dL | WBC: 4.0 - 11.0 x10^9/L | PLT: 150 - 450 x10^9/L',
    templateResult: 'Hemoglobin: 13.8 g/dL (Normal)\nWBC Count: 6.4 x10^9/L (Normal)\nPlatelets: 280 x10^9/L (Adequate)\nRBC: 4.6 x10^12/L\nDifferential: Neutrophils 60%, Lymphocytes 32%, Monocytes 5%, Eosinophils 3%',
  },
  {
    name: 'Fasting Blood Glucose (FBG)',
    category: 'Biochemistry',
    sampleType: 'Fluoride Oxalate Plasma',
    referenceRange: 'Fasting: 70 - 100 mg/dL (Normal) | 100 - 125 mg/dL (Impaired)',
    templateResult: 'Fasting Blood Glucose: 92 mg/dL\nInterpretation: Euglycemic / Normal fasting glucose level.',
  },
  {
    name: 'Malaria Rapid Test & Giemsa Blood Smear',
    category: 'Parasitology',
    sampleType: 'Capillary / Whole Blood (EDTA)',
    referenceRange: 'Negative (No Plasmodium falciparum / vivax trophozoites seen)',
    templateResult: 'Giemsa Stain Thick & Thin Film: NEGATIVE for Malaria Parasites (MPS).\nNo intra-erythrocytic inclusions seen on 100 high-power fields.\nRapid Diagnostic Test (Pf/Pv Ag): Negative.',
  },
  {
    name: 'Renal Function Test (Urea & Creatinine)',
    category: 'Biochemistry',
    sampleType: 'Serum (Gel Separator Tube)',
    referenceRange: 'Serum Creatinine: 0.6 - 1.2 mg/dL | Serum Urea: 15 - 45 mg/dL',
    templateResult: 'Serum Creatinine: 0.88 mg/dL (Normal)\nSerum Blood Urea: 24 mg/dL (Normal)\neGFR: > 90 mL/min/1.73m2 (Normal renal clearance)',
  },
  {
    name: 'Lipid Profile Panel',
    category: 'Biochemistry',
    sampleType: 'Fasting Serum (12-hour fast)',
    referenceRange: 'Total Chol: < 200 mg/dL | HDL: > 40 mg/dL | LDL: < 100 mg/dL | Trig: < 150 mg/dL',
    templateResult: 'Total Cholesterol: 178 mg/dL\nHDL Cholesterol: 52 mg/dL\nLDL Cholesterol: 96 mg/dL\nTriglycerides: 130 mg/dL\nRisk Ratio: Low cardiovascular risk profile.',
  },
  {
    name: 'Routine Urinalysis & Microscopy',
    category: 'Urinalysis',
    sampleType: 'Midstream Clean-Catch Urine',
    referenceRange: 'Color: Straw/Amber | Protein: Nil | Glucose: Nil | WBC: 0-2 /HPF | RBC: 0-1 /HPF',
    templateResult: 'Appearance: Clear, Pale Yellow\npH: 6.0 | Specific Gravity: 1.015\nProtein: Negative | Glucose: Negative | Ketones: Negative | Bilirubin: Negative\nMicroscopy: Pus Cells: 0-2 /hpf, RBCs: Nil, Epithelial Cells: Few, Casts/Crystals: Nil',
  },
  {
    name: 'Widal Agglutination (Typhoid Fever)',
    category: 'Microbiology',
    sampleType: 'Serum',
    referenceRange: 'TO & TH Titers < 1:80 (Non-significant baseline)',
    templateResult: 'S. typhi "O" antigen titer: 1:40 (Negative)\nS. typhi "H" antigen titer: 1:40 (Negative)\nNo active acute Salmonella enterica serotype typhi seroreactivity.',
  },
  {
    name: 'Digital Chest X-Ray (PA View)',
    category: 'Radiology & X-Ray',
    sampleType: 'Digital Radiographic Imaging',
    referenceRange: 'Clear lung fields, normal cardiothoracic ratio (< 0.5)',
    templateResult: 'Lungs: Clear bilaterally, no focal consolidation, pleural effusion, or pneumothorax.\nHeart: Normal cardiac silhouette and mediastinal contours.\nBony Cage: Intact without acute fracture or deformity.',
  },
];

const SAMPLE_TYPES = [
  'Venous Whole Blood (EDTA Tube)',
  'Serum (Gel Separator Tube)',
  'Fluoride Oxalate Plasma (Glucose)',
  'Midstream Clean-Catch Urine',
  'Sputum Specimen',
  'Stool Sample',
  'Throat / Wound Swab',
  'Digital Radiographic Imaging (X-Ray)',
  'Other Clinical Specimen',
];

export const LabManagement: React.FC = () => {
  const { user } = useAuth();
  const isDoctor = user?.role === 'Doctor';
  const isLabTech = user?.role === 'Lab Technician';
  const isAdmin = user?.role === 'Admin';
  const canOrderTests = isDoctor || isAdmin || user?.role === 'Receptionist';
  const canProcessTests = isLabTech || isAdmin || isDoctor;

  const [labTests, setLabTests] = useState<LabTestRequest[]>([]);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [doctors, setDoctors] = useState<DoctorStaff[]>([]);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [activeTab, setActiveTab] = useState<'pending' | 'in-progress' | 'completed' | 'all'>('pending');
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Doctor Request Modal State
  const [isRequestModalOpen, setIsRequestModalOpen] = useState(false);
  const [patientId, setPatientId] = useState('');
  const [doctorId, setDoctorId] = useState('');
  const [testName, setTestName] = useState('Full Blood Count (FBC) & Hemoglobin');
  const [category, setCategory] = useState('Hematology');
  const [sampleType, setSampleType] = useState('Venous Whole Blood (EDTA Tube)');
  const [priority, setPriority] = useState<'Routine' | 'Urgent / STAT'>('Routine');
  const [clinicalNotes, setClinicalNotes] = useState('');

  // Accept Doctor Request Modal State
  const [acceptingTest, setAcceptingTest] = useState<LabTestRequest | null>(null);
  const [acceptSampleType, setAcceptSampleType] = useState('');
  const [acceptBarcode, setAcceptBarcode] = useState('');
  const [acceptTechName, setAcceptTechName] = useState('');
  const [acceptNotes, setAcceptNotes] = useState('');

  // Reject Request Modal State
  const [rejectingTest, setRejectingTest] = useState<LabTestRequest | null>(null);
  const [rejectionReason, setRejectionReason] = useState('Specimen hemolyzed / insufficient quantity');

  // Report Diagnostic Results Modal State
  const [reportingTest, setReportingTest] = useState<LabTestRequest | null>(null);
  const [reportStatus, setReportStatus] = useState<LabTestStatus>('Completed');
  const [results, setResults] = useState('');
  const [referenceRange, setReferenceRange] = useState('');
  const [technicianNotes, setTechnicianNotes] = useState('');
  const [technicianName, setTechnicianName] = useState('');

  // Print Document Modal State
  const [printDoc, setPrintDoc] = useState<{
    isOpen: boolean;
    title: string;
    htmlContent: string;
  }>({
    isOpen: false,
    title: '',
    htmlContent: '',
  });

  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const showFeedback = (message: string, type: 'success' | 'error' = 'success') => {
    setFeedback({ type, message });
    setTimeout(() => setFeedback(null), 4500);
  };

  const loadData = async () => {
    setIsRefreshing(true);
    try {
      const [labRes, patRes, docRes] = await Promise.all([
        api.getLabTests(),
        api.getPatients(),
        api.getDoctors(),
      ]);
      setLabTests(labRes);
      setPatients(patRes);
      setDoctors(docRes);

      if (patRes.length > 0 && !patientId) setPatientId(patRes[0].id);

      if (isDoctor && user) {
        const matchingDoc = docRes.find(
          (d) =>
            d.email.toLowerCase() === user.email.toLowerCase() ||
            d.name.toLowerCase() === user.name.toLowerCase()
        );
        if (matchingDoc) {
          setDoctorId(matchingDoc.id);
        } else if (docRes.length > 0) {
          setDoctorId(docRes[0].id);
        }
      } else if (docRes.length > 0 && !doctorId) {
        setDoctorId(docRes[0].id);
      }
    } catch (err) {
      console.warn('Error loading lab management data', err);
    } finally {
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // 1. Doctor Creates New Diagnostic Test Order
  const handleCreateRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    const pat = patients.find((p) => p.id === patientId);
    const doc = doctors.find((d) => d.id === doctorId);
    if (!pat || !doc) return;

    try {
      await api.createLabTest({
        patientId: pat.id,
        patientName: pat.name,
        doctorId: doc.id,
        doctorName: doc.name,
        testName,
        category,
        sampleType,
        priority,
        clinicalNotes,
        status: 'Requested',
      });

      showFeedback(`Diagnostic test order "${testName}" created for ${pat.name}. Forwarded to Laboratory Station.`);
      setIsRequestModalOpen(false);
      setClinicalNotes('');
      await loadData();
    } catch (err: any) {
      showFeedback(err.message || 'Error creating lab test order', 'error');
    }
  };

  // 2. Open Accept Modal for a Doctor's Request
  const handleOpenAcceptModal = (test: LabTestRequest) => {
    setAcceptingTest(test);
    setAcceptSampleType(test.sampleType || 'Venous Whole Blood (EDTA Tube)');
    setAcceptBarcode(test.specimenBarcode || `SPEC-${test.id.replace('lab-', '')}-${Math.floor(100 + Math.random() * 900)}`);
    setAcceptTechName(user?.name || 'Hassan Ali (Lab Tech)');
    setAcceptNotes(test.technicianNotes || 'Specimen received in good condition. Intake verified.');
  };

  // 2b. Submit Acceptance & Transition to "In Progress"
  const handleConfirmAccept = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!acceptingTest) return;

    try {
      const todayDate = new Date().toISOString().split('T')[0];
      await api.updateLabTest(acceptingTest.id, {
        status: 'In Progress',
        sampleCollectedDate: todayDate,
        sampleType: acceptSampleType,
        specimenBarcode: acceptBarcode,
        technicianName: acceptTechName || user?.name || 'Duty Medical Technologist',
        technicianNotes: acceptNotes,
      });

      showFeedback(`Doctor request for ${acceptingTest.patientName} (${acceptingTest.testName}) ACCEPTED. Specimen queued for analysis.`);
      setAcceptingTest(null);
      await loadData();
    } catch (err: any) {
      showFeedback(err.message || 'Error accepting laboratory test request', 'error');
    }
  };

  // 2c. Fast 1-Click Quick Accept
  const handleQuickAccept = async (test: LabTestRequest) => {
    try {
      const todayDate = new Date().toISOString().split('T')[0];
      const barcode = test.specimenBarcode || `SPEC-${test.id.replace('lab-', '')}-${Math.floor(100 + Math.random() * 900)}`;
      const techName = user?.name || 'Hassan Ali (Lab Tech)';

      await api.updateLabTest(test.id, {
        status: 'In Progress',
        sampleCollectedDate: todayDate,
        sampleType: test.sampleType || 'Clinical Specimen',
        specimenBarcode: barcode,
        technicianName: techName,
        technicianNotes: 'Order accepted by laboratory. Specimen intake confirmed.',
      });

      showFeedback(`Accepted doctor order for ${test.patientName} (${test.testName}). Status: In Progress.`);
      await loadData();
    } catch (err: any) {
      showFeedback(err.message || 'Error quickly accepting order', 'error');
    }
  };

  // 3. Reject / Decline Request
  const handleConfirmReject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!rejectingTest) return;

    try {
      await api.updateLabTest(rejectingTest.id, {
        status: 'Rejected',
        rejectionReason,
        technicianName: user?.name || 'Lab Technologist',
        technicianNotes: `Request rejected by laboratory: ${rejectionReason}`,
      });

      showFeedback(`Order for ${rejectingTest.patientName} marked as Rejected (${rejectionReason}).`, 'error');
      setRejectingTest(null);
      await loadData();
    } catch (err: any) {
      showFeedback(err.message || 'Error rejecting lab test', 'error');
    }
  };

  // 4. Open Result Reporting Modal
  const handleOpenResultModal = (test: LabTestRequest) => {
    setReportingTest(test);
    setReportStatus('Completed');
    setResults(test.results || '');
    setReferenceRange(
      test.referenceRange || 'Standard reference intervals according to clinical pathology guidelines.'
    );
    setTechnicianNotes(test.technicianNotes || '');
    setTechnicianName(test.technicianName || user?.name || 'Hassan Ali (Lab Tech)');
  };

  // 4b. Apply Preset Template
  const handleApplyPreset = (preset: (typeof COMMON_TEST_PRESETS)[0]) => {
    setReferenceRange(preset.referenceRange);
    setResults(preset.templateResult);
    setReportStatus('Completed');
  };

  // 4c. Submit Diagnostic Report to Doctor
  const handleUpdateResult = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reportingTest) return;

    try {
      const isCompleted = reportStatus === 'Completed';
      const resultDate = isCompleted ? new Date().toISOString().split('T')[0] : reportingTest.resultDate;

      await api.updateLabTest(reportingTest.id, {
        status: reportStatus,
        results,
        referenceRange,
        technicianNotes,
        resultDate,
        technicianName: technicianName || user?.name || 'Duty Medical Technologist',
      });

      showFeedback(
        isCompleted
          ? `Verified diagnostic findings transmitted to ${reportingTest.doctorName} for patient ${reportingTest.patientName}.`
          : `Diagnostic progress saved as "${reportStatus}" for ${reportingTest.patientName}.`
      );

      setReportingTest(null);
      await loadData();
    } catch (err: any) {
      showFeedback(err.message || 'Error transmitting lab results', 'error');
    }
  };

  // 5. Print Official Laboratory Report
  const handlePrintLabReport = (test: LabTestRequest) => {
    const html = getLabReportHtml({
      id: test.id,
      patientId: test.patientId,
      patientName: test.patientName,
      doctorId: test.doctorId,
      doctorName: test.doctorName,
      testName: test.testName,
      category: test.category,
      requestDate: test.requestDate,
      status: test.status,
      results: test.results,
      referenceRange: test.referenceRange,
      technicianNotes: test.technicianNotes,
      technicianName: test.technicianName,
      resultDate: test.resultDate,
    });

    setPrintDoc({
      isOpen: true,
      title: `Lab Report - ${test.testName} (${test.patientName})`,
      htmlContent: html,
    });
  };

  // Filter Logic
  const filteredTests = labTests.filter((l) => {
    const matchesSearch =
      l.patientName.toLowerCase().includes(search.toLowerCase()) ||
      l.testName.toLowerCase().includes(search.toLowerCase()) ||
      l.doctorName.toLowerCase().includes(search.toLowerCase()) ||
      l.id.toLowerCase().includes(search.toLowerCase()) ||
      (l.specimenBarcode && l.specimenBarcode.toLowerCase().includes(search.toLowerCase()));

    const matchesCategory = categoryFilter ? l.category === categoryFilter : true;

    if (!matchesSearch || !matchesCategory) return false;

    if (activeTab === 'pending') {
      return l.status === 'Requested';
    }
    if (activeTab === 'in-progress') {
      return l.status === 'In Progress';
    }
    if (activeTab === 'completed') {
      return l.status === 'Completed';
    }
    return true; // 'all'
  });

  const pendingCount = labTests.filter((l) => l.status === 'Requested').length;
  const inProgressCount = labTests.filter((l) => l.status === 'In Progress').length;
  const completedCount = labTests.filter((l) => l.status === 'Completed').length;

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-emerald-100 shadow-xs">
        <div>
          <h1 className="text-xl font-extrabold text-emerald-950 flex items-center gap-2">
            <TestTube className="w-6 h-6 text-emerald-600" /> Laboratory & Diagnostics Management
          </h1>
          <p className="text-xs text-emerald-800 mt-1">
            {isLabTech
              ? 'Medical Laboratory Station: Review incoming doctor requests, accept orders, process specimens, and transmit verified findings to attending physicians.'
              : isDoctor
              ? 'Physician Diagnostic Portal: Order laboratory investigations, monitor sample processing, and review clinical pathology reports.'
              : 'Garasbaley Hospital Clinical Pathology & Diagnostic Services: Manage test requests, specimen processing, and doctor diagnostic reports.'}
          </p>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap sm:flex-nowrap">
          <button
            onClick={loadData}
            disabled={isRefreshing}
            className="inline-flex items-center gap-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 px-3.5 py-2.5 rounded-xl font-bold text-xs transition-colors cursor-pointer"
            title="Refresh database records"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-emerald-700 ${isRefreshing ? 'animate-spin' : ''}`} />
            <span>{isRefreshing ? 'Refreshing...' : 'Refresh'}</span>
          </button>

          {canOrderTests && (
            <button
              onClick={() => setIsRequestModalOpen(true)}
              className="bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs px-4 py-2.5 rounded-xl transition-all shadow-md flex items-center justify-center gap-2 shrink-0 cursor-pointer"
            >
              <Plus className="w-4 h-4" /> Order New Lab Test
            </button>
          )}
        </div>
      </div>

      {feedback && (
        <div
          className={`p-3.5 rounded-xl text-xs font-semibold flex items-center gap-2 animate-fadeIn border ${
            feedback.type === 'error'
              ? 'bg-red-50 text-red-900 border-red-200'
              : 'bg-emerald-50 text-emerald-900 border-emerald-300'
          }`}
        >
          {feedback.type === 'error' ? (
            <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
          ) : (
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          )}
          <span>{feedback.message}</span>
        </div>
      )}

      {/* Quick Summary Navigation Tabs */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 text-xs">
        {/* Tab 1: Pending Doctor Requests */}
        <div
          onClick={() => setActiveTab('pending')}
          className={`p-4 rounded-xl border transition-all cursor-pointer ${
            activeTab === 'pending'
              ? 'bg-amber-50 border-amber-300 shadow-xs ring-2 ring-amber-400'
              : 'bg-white border-gray-200 hover:border-amber-200'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="font-bold text-amber-900 uppercase text-[10px] tracking-wider flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-amber-600" /> Pending Doctor Orders
            </span>
            <span className="px-2 py-0.5 rounded-full bg-amber-200 text-amber-950 font-black text-xs">
              {pendingCount}
            </span>
          </div>
          <p className="text-xl font-black text-amber-950 mt-1">{pendingCount} Awaiting Acceptance</p>
          <span className="text-[11px] text-amber-700">Needs lab tech to accept & collect sample</span>
        </div>

        {/* Tab 2: In Progress */}
        <div
          onClick={() => setActiveTab('in-progress')}
          className={`p-4 rounded-xl border transition-all cursor-pointer ${
            activeTab === 'in-progress'
              ? 'bg-cyan-50 border-cyan-300 shadow-xs ring-2 ring-cyan-400'
              : 'bg-white border-gray-200 hover:border-cyan-200'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="font-bold text-cyan-900 uppercase text-[10px] tracking-wider flex items-center gap-1.5">
              <FlaskConical className="w-3.5 h-3.5 text-cyan-600" /> In Progress (Analyzing)
            </span>
            <span className="px-2 py-0.5 rounded-full bg-cyan-200 text-cyan-950 font-black text-xs">
              {inProgressCount}
            </span>
          </div>
          <p className="text-xl font-black text-cyan-950 mt-1">{inProgressCount} Processing</p>
          <span className="text-[11px] text-cyan-700">Specimen collected & undergoing test</span>
        </div>

        {/* Tab 3: Completed */}
        <div
          onClick={() => setActiveTab('completed')}
          className={`p-4 rounded-xl border transition-all cursor-pointer ${
            activeTab === 'completed'
              ? 'bg-emerald-50 border-emerald-300 shadow-xs ring-2 ring-emerald-400'
              : 'bg-white border-gray-200 hover:border-emerald-200'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="font-bold text-emerald-900 uppercase text-[10px] tracking-wider flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> Reported to Doctors
            </span>
            <span className="px-2 py-0.5 rounded-full bg-emerald-200 text-emerald-950 font-black text-xs">
              {completedCount}
            </span>
          </div>
          <p className="text-xl font-black text-emerald-950 mt-1">{completedCount} Verified</p>
          <span className="text-[11px] text-emerald-700">Findings transmitted to physicians</span>
        </div>

        {/* Tab 4: All Test Archive */}
        <div
          onClick={() => setActiveTab('all')}
          className={`p-4 rounded-xl border transition-all cursor-pointer ${
            activeTab === 'all'
              ? 'bg-blue-50 border-blue-300 shadow-xs ring-2 ring-blue-400'
              : 'bg-white border-gray-200 hover:border-blue-200'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="font-bold text-blue-900 uppercase text-[10px] tracking-wider flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5 text-blue-600" /> Total Diagnostic Log
            </span>
            <span className="px-2 py-0.5 rounded-full bg-blue-200 text-blue-950 font-black text-xs">
              {labTests.length}
            </span>
          </div>
          <p className="text-xl font-black text-blue-950 mt-1">{labTests.length} Records</p>
          <span className="text-[11px] text-blue-700">Complete laboratory archive</span>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-emerald-100 shadow-xs flex flex-col md:flex-row gap-3 items-center justify-between">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by patient, doctor, test name, barcode, or ID..."
            className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-xl text-xs focus:ring-2 focus:ring-emerald-500 font-medium"
          />
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto">
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="w-full md:w-auto bg-emerald-50 border border-emerald-200 rounded-xl px-3 py-2 text-xs font-bold text-emerald-900 cursor-pointer"
          >
            <option value="">All Diagnostic Categories</option>
            <option value="Hematology">Hematology</option>
            <option value="Biochemistry">Biochemistry</option>
            <option value="Microbiology">Microbiology</option>
            <option value="Parasitology">Parasitology</option>
            <option value="Radiology & X-Ray">Radiology & X-Ray</option>
            <option value="Urinalysis">Urinalysis</option>
            <option value="Immunology & Serology">Immunology & Serology</option>
          </select>
        </div>
      </div>

      {/* Lab Tests Cards Grid */}
      {filteredTests.length === 0 ? (
        <div className="bg-white p-12 rounded-2xl border border-dashed border-gray-300 text-center space-y-3">
          <TestTube className="w-12 h-12 text-gray-300 mx-auto" />
          <h3 className="text-sm font-extrabold text-gray-700">No laboratory test orders found</h3>
          <p className="text-xs text-gray-500 max-w-sm mx-auto">
            {activeTab === 'pending'
              ? 'No pending doctor requests awaiting acceptance.'
              : activeTab === 'in-progress'
              ? 'No tests currently in progress in the laboratory.'
              : 'Try changing your search keywords or category filters.'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredTests.map((test) => {
            const isRequested = test.status === 'Requested';
            const isInProgress = test.status === 'In Progress';
            const isCompleted = test.status === 'Completed';
            const isRejected = test.status === 'Rejected';

            return (
              <div
                key={test.id}
                className={`bg-white rounded-2xl p-5 border shadow-xs hover:shadow-md transition-all space-y-3.5 flex flex-col justify-between ${
                  isRequested
                    ? 'border-amber-200/90 ring-1 ring-amber-300/40 bg-amber-50/10'
                    : isInProgress
                    ? 'border-cyan-200/90 ring-1 ring-cyan-300/40'
                    : isRejected
                    ? 'border-red-200 bg-red-50/10'
                    : 'border-emerald-100/90'
                }`}
              >
                <div className="space-y-3">
                  {/* Top Header Badge & Test Name */}
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 border border-slate-200">
                          {test.category}
                        </span>
                        <span className="text-[10px] font-mono text-gray-500">#{test.id}</span>
                        {test.priority === 'Urgent / STAT' && (
                          <span className="px-2 py-0.5 rounded-md bg-red-100 text-red-800 border border-red-300 font-extrabold text-[10px] flex items-center gap-1">
                            <Flame className="w-3 h-3 text-red-600" /> STAT / URGENT
                          </span>
                        )}
                      </div>
                      <h3 className="text-base font-black text-emerald-950 mt-1">{test.testName}</h3>
                    </div>

                    {/* Status Badge */}
                    <span
                      className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider shrink-0 ${
                        isCompleted
                          ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                          : isInProgress
                          ? 'bg-cyan-100 text-cyan-900 border border-cyan-300 font-extrabold'
                          : isRejected
                          ? 'bg-red-100 text-red-800 border border-red-300'
                          : 'bg-amber-100 text-amber-900 border border-amber-300 animate-pulse font-extrabold'
                      }`}
                    >
                      {isRequested
                        ? 'Pending Doctor Request'
                        : isInProgress
                        ? 'In Progress (Analyzing)'
                        : isCompleted
                        ? 'Completed & Reported'
                        : 'Order Rejected'}
                    </span>
                  </div>

                  {/* Doctor & Patient Info Block */}
                  <div className="bg-emerald-50/70 p-3.5 rounded-xl border border-emerald-100 text-xs space-y-1.5 text-gray-700">
                    <div className="flex items-center justify-between">
                      <span className="text-gray-500 font-semibold flex items-center gap-1">
                        <User className="w-3.5 h-3.5 text-gray-400" /> Patient:
                      </span>
                      <strong className="text-emerald-950 font-bold">
                        {test.patientName} <span className="text-[11px] text-gray-500 font-normal">(MRN: {test.patientId})</span>
                      </strong>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-gray-500 font-semibold flex items-center gap-1">
                        <Stethoscope className="w-3.5 h-3.5 text-emerald-600" /> Requesting Doctor:
                      </span>
                      <strong className="text-emerald-900 font-bold">{test.doctorName}</strong>
                    </div>

                    {test.clinicalNotes && (
                      <div className="pt-1 text-[11px] text-emerald-900 border-t border-emerald-100/70">
                        <span className="font-bold text-gray-600">Clinical Indication: </span>
                        {test.clinicalNotes}
                      </div>
                    )}

                    <div className="flex items-center justify-between text-[11px] text-gray-600 pt-1 border-t border-emerald-100">
                      <span>Order Date: {test.requestDate}</span>
                      {test.sampleCollectedDate && (
                        <span className="text-cyan-900 font-semibold">Sample: {test.sampleCollectedDate}</span>
                      )}
                      {test.resultDate && (
                        <span className="font-bold text-emerald-800">Reported: {test.resultDate}</span>
                      )}
                    </div>
                  </div>

                  {/* Specimen Barcode & Type Box if Available */}
                  {(test.sampleType || test.specimenBarcode) && (
                    <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-[11px] flex items-center justify-between gap-2 flex-wrap text-slate-700">
                      {test.sampleType && (
                        <div className="flex items-center gap-1.5">
                          <FlaskConical className="w-3.5 h-3.5 text-emerald-600" />
                          <span className="font-semibold">{test.sampleType}</span>
                        </div>
                      )}
                      {test.specimenBarcode && (
                        <div className="flex items-center gap-1 font-mono font-bold text-slate-900 bg-white px-2 py-0.5 rounded border border-slate-200">
                          <Barcode className="w-3.5 h-3.5 text-gray-500" />
                          <span>{test.specimenBarcode}</span>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Diagnostic Findings or Processing Status Box */}
                  {test.results ? (
                    <div className="p-3.5 bg-emerald-50/40 border border-emerald-200 rounded-xl text-xs space-y-1.5">
                      <div className="flex items-center justify-between border-b border-emerald-200/80 pb-1">
                        <span className="font-extrabold text-emerald-950 flex items-center gap-1">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> Verified Diagnostic Findings:
                        </span>
                        {test.technicianName && (
                          <span className="text-[10px] text-gray-500 italic">By: {test.technicianName}</span>
                        )}
                      </div>
                      <p className="text-gray-900 font-semibold leading-relaxed whitespace-pre-wrap font-mono text-[11px]">
                        {test.results}
                      </p>

                      {test.referenceRange && (
                        <div className="text-[11px] text-gray-600 pt-1 bg-white/70 p-2 rounded-lg border border-emerald-100">
                          <strong>Reference Range:</strong> {test.referenceRange}
                        </div>
                      )}

                      {test.technicianNotes && (
                        <p className="text-[11px] text-amber-800 font-medium pt-0.5">
                          <strong>Technologist Remarks:</strong> {test.technicianNotes}
                        </p>
                      )}
                    </div>
                  ) : isRequested ? (
                    <div className="p-3.5 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-900 space-y-1">
                      <p className="font-bold flex items-center gap-1.5">
                        <Clock className="w-4 h-4 text-amber-600 shrink-0" /> Doctor Order Awaiting Laboratory Acceptance
                      </p>
                      <p className="text-[11px] text-amber-800 leading-relaxed">
                        Attending doctor <strong>{test.doctorName}</strong> requested this investigation. Laboratory staff can accept the request, collect specimen, and begin analysis.
                      </p>
                    </div>
                  ) : isInProgress ? (
                    <div className="p-3.5 bg-cyan-50 border border-cyan-200 rounded-xl text-xs text-cyan-950 space-y-1">
                      <p className="font-bold flex items-center gap-1.5 text-cyan-900">
                        <FlaskConical className="w-4 h-4 text-cyan-600 shrink-0 animate-bounce" /> Specimen In Laboratory Analysis
                      </p>
                      <p className="text-[11px] text-cyan-800 leading-relaxed">
                        Sample received and registered. Click <strong>"Enter & Transmit Results"</strong> to report verified values to {test.doctorName}.
                      </p>
                    </div>
                  ) : isRejected ? (
                    <div className="p-3.5 bg-red-50 border border-red-200 rounded-xl text-xs text-red-900 space-y-1">
                      <p className="font-bold flex items-center gap-1.5">
                        <XCircle className="w-4 h-4 text-red-600 shrink-0" /> Order Rejected
                      </p>
                      <p className="text-[11px] text-red-800">
                        Reason: {test.rejectionReason || 'Sample inadequate or incorrect order'}
                      </p>
                    </div>
                  ) : null}
                </div>

                {/* Card Actions Footer */}
                <div className="pt-3 border-t border-gray-100 flex items-center justify-between gap-2 flex-wrap">
                  <span className="text-[11px] text-gray-500 font-medium">
                    {test.technicianName ? `Technologist: ${test.technicianName}` : 'Duty Technologist Station'}
                  </span>

                  <div className="flex items-center gap-2 flex-wrap">
                    {/* 1. When Requested: Show Accept & Reject buttons */}
                    {isRequested && canProcessTests && (
                      <>
                        <button
                          onClick={() => setRejectingTest(test)}
                          className="px-2.5 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-800 border border-rose-200 rounded-lg text-xs font-bold transition-colors inline-flex items-center gap-1 cursor-pointer"
                          title="Reject or decline this request"
                        >
                          <X className="w-3.5 h-3.5" /> Decline
                        </button>

                        <button
                          onClick={() => handleQuickAccept(test)}
                          className="px-2.5 py-1.5 bg-amber-100 hover:bg-amber-200 text-amber-900 border border-amber-300 rounded-lg text-xs font-black transition-colors inline-flex items-center gap-1 cursor-pointer"
                          title="Instantly accept and mark In Progress"
                        >
                          <Check className="w-3.5 h-3.5 text-amber-700" /> Quick Accept
                        </button>

                        <button
                          onClick={() => handleOpenAcceptModal(test)}
                          className="px-3.5 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg text-xs font-extrabold transition-colors shadow-xs inline-flex items-center gap-1.5 cursor-pointer"
                          title="Accept doctor request and enter specimen intake details"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" /> Accept & Intake Sample
                        </button>
                      </>
                    )}

                    {/* 2. When In Progress: Show Enter Results button */}
                    {isInProgress && canProcessTests && (
                      <button
                        onClick={() => handleOpenResultModal(test)}
                        className="px-3.5 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg text-xs font-extrabold transition-colors shadow-xs inline-flex items-center gap-1.5 cursor-pointer"
                        title="Enter measurement values and transmit findings to doctor"
                      >
                        <Send className="w-3.5 h-3.5" /> Enter & Transmit Results
                      </button>
                    )}

                    {/* 3. When Completed: Print Sheet & Update */}
                    {isCompleted && (
                      <>
                        <button
                          onClick={() => handlePrintLabReport(test)}
                          className="bg-blue-50 hover:bg-blue-100 text-blue-800 border border-blue-200 px-3 py-1.5 rounded-lg text-xs font-bold transition-colors inline-flex items-center gap-1.5 cursor-pointer"
                          title="Print Official Lab Report Document"
                        >
                          <Printer className="w-3.5 h-3.5 text-blue-600" /> Print Official Report
                        </button>

                        {canProcessTests && (
                          <button
                            onClick={() => handleOpenResultModal(test)}
                            className="bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-300 px-2.5 py-1.5 rounded-lg text-xs font-bold transition-colors inline-flex items-center gap-1 cursor-pointer"
                            title="Update or amend reported findings"
                          >
                            <FileText className="w-3.5 h-3.5" /> Edit Report
                          </button>
                        )}
                      </>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* --- MODAL 1: DOCTOR ORDER NEW LAB TEST --- */}
      {isRequestModalOpen && canOrderTests && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 space-y-4 shadow-2xl border border-emerald-100">
            <div className="flex justify-between items-center border-b pb-2">
              <h2 className="text-base font-extrabold text-emerald-950 flex items-center gap-2">
                <TestTube className="w-5 h-5 text-emerald-600" /> Order Diagnostic Laboratory Investigation
              </h2>
              <button
                onClick={() => setIsRequestModalOpen(false)}
                className="text-gray-400 hover:text-gray-600 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateRequest} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-bold text-gray-700 mb-1">Select Patient</label>
                <select
                  required
                  value={patientId}
                  onChange={(e) => setPatientId(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-xl font-semibold bg-white"
                >
                  {patients.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} (Age {p.age}, Blood {p.bloodGroup}) — MRN: {p.id}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-bold text-gray-700 mb-1">Ordering Physician / Doctor</label>
                <select
                  required
                  value={doctorId}
                  onChange={(e) => setDoctorId(e.target.value)}
                  className="w-full px-3 py-2 border border-emerald-300 bg-emerald-50/50 rounded-xl font-bold text-emerald-950"
                >
                  {doctors.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.name} — {d.specialty} ({d.departmentName})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-bold text-gray-700 mb-1">Quick Select Investigation Preset</label>
                <select
                  onChange={(e) => {
                    const preset = COMMON_TEST_PRESETS.find((p) => p.name === e.target.value);
                    if (preset) {
                      setTestName(preset.name);
                      setCategory(preset.category);
                      if (preset.sampleType) setSampleType(preset.sampleType);
                    }
                  }}
                  className="w-full px-3 py-2 border border-gray-200 rounded-xl font-medium bg-gray-50 text-gray-800"
                >
                  <option value="">-- Choose standard hospital investigation --</option>
                  {COMMON_TEST_PRESETS.map((preset) => (
                    <option key={preset.name} value={preset.name}>
                      {preset.name} ({preset.category})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-gray-700 mb-1">Test Name</label>
                  <input
                    type="text"
                    required
                    value={testName}
                    onChange={(e) => setTestName(e.target.value)}
                    placeholder="e.g. Full Blood Count"
                    className="w-full px-3 py-2 border border-gray-300 rounded-xl font-semibold"
                  />
                </div>

                <div>
                  <label className="block font-bold text-gray-700 mb-1">Diagnostic Category</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-xl font-semibold bg-white"
                  >
                    <option value="Hematology">Hematology</option>
                    <option value="Biochemistry">Biochemistry</option>
                    <option value="Microbiology">Microbiology</option>
                    <option value="Parasitology">Parasitology</option>
                    <option value="Radiology & X-Ray">Radiology & X-Ray</option>
                    <option value="Urinalysis">Urinalysis</option>
                    <option value="Immunology & Serology">Immunology & Serology</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-gray-700 mb-1">Recommended Specimen</label>
                  <select
                    value={sampleType}
                    onChange={(e) => setSampleType(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-xl bg-white"
                  >
                    {SAMPLE_TYPES.map((st) => (
                      <option key={st} value={st}>
                        {st}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-gray-700 mb-1">Priority</label>
                  <select
                    value={priority}
                    onChange={(e) => setPriority(e.target.value as any)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-xl font-bold bg-white text-emerald-950"
                  >
                    <option value="Routine">Routine (Standard Turnaround)</option>
                    <option value="Urgent / STAT">Urgent / STAT (Emergency)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-bold text-gray-700 mb-1">Clinical Indication / Doctor Notes</label>
                <textarea
                  rows={2}
                  value={clinicalNotes}
                  onChange={(e) => setClinicalNotes(e.target.value)}
                  placeholder="e.g. Persistent fever x 3 days, chills, suspect acute malaria or bacteremia."
                  className="w-full px-3 py-2 border border-gray-300 rounded-xl font-medium"
                />
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t">
                <button
                  type="button"
                  onClick={() => setIsRequestModalOpen(false)}
                  className="px-4 py-2 rounded-xl font-bold text-gray-600 hover:bg-gray-100 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl font-bold shadow-md cursor-pointer flex items-center gap-1.5"
                >
                  <Send className="w-3.5 h-3.5" /> Transmit Order to Lab
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* --- MODAL 2: ACCEPT DOCTOR REQUEST (SPECIMEN INTAKE) --- */}
      {acceptingTest && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 space-y-4 shadow-2xl border border-emerald-100">
            <div className="flex justify-between items-center border-b pb-2">
              <div>
                <h2 className="text-base font-extrabold text-emerald-950 flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600" /> Accept Doctor Diagnostic Order
                </h2>
                <p className="text-[11px] text-gray-500">
                  Register specimen intake and queue sample for diagnostic execution.
                </p>
              </div>
              <button
                onClick={() => setAcceptingTest(null)}
                className="text-gray-400 hover:text-gray-600 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Test Context Details */}
            <div className="bg-amber-50/70 p-3.5 rounded-xl border border-amber-200 text-xs space-y-1.5 text-amber-950">
              <div className="flex justify-between">
                <span>
                  Investigation: <strong>{acceptingTest.testName}</strong>
                </span>
                <span className="font-bold text-amber-800 uppercase tracking-wide">
                  {acceptingTest.category}
                </span>
              </div>
              <div className="flex justify-between">
                <span>
                  Patient: <strong>{acceptingTest.patientName}</strong> (MRN: {acceptingTest.patientId})
                </span>
                <span>
                  Ordering Doctor: <strong className="text-emerald-900">{acceptingTest.doctorName}</strong>
                </span>
              </div>
              {acceptingTest.clinicalNotes && (
                <div className="pt-1 text-[11px] text-gray-700 border-t border-amber-200/70">
                  <strong>Clinical Indication:</strong> {acceptingTest.clinicalNotes}
                </div>
              )}
            </div>

            <form onSubmit={handleConfirmAccept} className="space-y-3.5 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-gray-700 mb-1">Specimen Collected / Sample Type</label>
                  <select
                    value={acceptSampleType}
                    onChange={(e) => setAcceptSampleType(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-xl bg-white font-medium"
                  >
                    {SAMPLE_TYPES.map((st) => (
                      <option key={st} value={st}>
                        {st}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-gray-700 mb-1">Specimen Barcode / Tube #</label>
                  <input
                    type="text"
                    required
                    value={acceptBarcode}
                    onChange={(e) => setAcceptBarcode(e.target.value)}
                    placeholder="e.g. SPEC-7003-882"
                    className="w-full px-3 py-2 border border-gray-300 rounded-xl font-mono font-bold"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-gray-700 mb-1">Processing Technologist</label>
                <input
                  type="text"
                  required
                  value={acceptTechName}
                  onChange={(e) => setAcceptTechName(e.target.value)}
                  placeholder="e.g. Hassan Ali (Medical Technologist)"
                  className="w-full px-3 py-2 border border-gray-300 rounded-xl font-semibold"
                />
              </div>

              <div>
                <label className="block font-bold text-gray-700 mb-1">Specimen Intake Remarks</label>
                <input
                  type="text"
                  value={acceptNotes}
                  onChange={(e) => setAcceptNotes(e.target.value)}
                  placeholder="e.g. Sample adequate, fasting confirmed, no hemolysis observed."
                  className="w-full px-3 py-2 border border-gray-300 rounded-xl"
                />
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t">
                <button
                  type="button"
                  onClick={() => setAcceptingTest(null)}
                  className="px-4 py-2 rounded-xl font-bold text-gray-600 hover:bg-gray-100 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl font-extrabold shadow-md cursor-pointer flex items-center gap-1.5"
                >
                  <Check className="w-4 h-4" /> Confirm & Accept Request
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* --- MODAL 3: REJECT / DECLINE ORDER --- */}
      {rejectingTest && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl border border-red-100">
            <div className="flex justify-between items-center border-b pb-2">
              <h2 className="text-base font-extrabold text-red-900 flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-red-600" /> Decline / Reject Lab Order
              </h2>
              <button
                onClick={() => setRejectingTest(null)}
                className="text-gray-400 hover:text-gray-600 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-gray-600">
              Are you sure you want to decline the request for <strong>{rejectingTest.patientName}</strong> ({rejectingTest.testName})?
            </p>

            <form onSubmit={handleConfirmReject} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-bold text-gray-700 mb-1">Reason for Rejection</label>
                <select
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-xl bg-white font-medium"
                >
                  <option value="Specimen hemolyzed / clotted / inadequate">Specimen hemolyzed / clotted / inadequate</option>
                  <option value="Patient not in required fasting state">Patient not in required fasting state</option>
                  <option value="Incorrect specimen collection tube used">Incorrect specimen collection tube used</option>
                  <option value="Diagnostic reagent temporarily out of stock">Diagnostic reagent temporarily out of stock</option>
                  <option value="Duplicate order submitted in error">Duplicate order submitted in error</option>
                </select>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t">
                <button
                  type="button"
                  onClick={() => setRejectingTest(null)}
                  className="px-4 py-2 rounded-xl font-bold text-gray-600 hover:bg-gray-100 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl font-bold shadow-md cursor-pointer"
                >
                  Confirm Rejection
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* --- MODAL 4: REPORT RESULTS TO DOCTOR --- */}
      {reportingTest && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-xl w-full p-6 space-y-4 shadow-2xl border border-emerald-100 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center border-b pb-2">
              <div>
                <h2 className="text-base font-extrabold text-emerald-950 flex items-center gap-2">
                  <Send className="w-4 h-4 text-emerald-600" /> Report Diagnostic Results to Attending Physician
                </h2>
                <p className="text-[11px] text-gray-500">
                  Transmit verified clinical findings, measurements, and reference intervals to {reportingTest.doctorName}.
                </p>
              </div>
              <button
                onClick={() => setReportingTest(null)}
                className="text-gray-400 hover:text-gray-600 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Test Context Details */}
            <div className="bg-emerald-50 p-3.5 rounded-xl border border-emerald-200 text-xs space-y-1.5 text-emerald-950">
              <div className="flex justify-between">
                <span>
                  Investigation: <strong>{reportingTest.testName}</strong>
                </span>
                <span className="font-bold text-emerald-700 uppercase tracking-wide">
                  {reportingTest.category}
                </span>
              </div>
              <div className="flex justify-between">
                <span>
                  Patient: <strong>{reportingTest.patientName}</strong> (MRN: {reportingTest.patientId})
                </span>
                <span>
                  Ordering Physician: <strong className="text-emerald-900">{reportingTest.doctorName}</strong>
                </span>
              </div>
            </div>

            {/* Quick Auto-fill Presets */}
            <div>
              <label className="block text-[11px] font-bold text-gray-700 mb-1 flex items-center gap-1">
                <Sparkles className="w-3.5 h-3.5 text-amber-500" /> Quick Standard Template Auto-Fill:
              </label>
              <div className="flex flex-wrap gap-1.5">
                {COMMON_TEST_PRESETS.map((preset) => (
                  <button
                    key={preset.name}
                    type="button"
                    onClick={() => handleApplyPreset(preset)}
                    className="px-2.5 py-1 bg-gray-100 hover:bg-emerald-100 hover:text-emerald-900 border border-gray-200 rounded-lg text-[11px] font-semibold text-gray-700 transition-colors cursor-pointer"
                  >
                    {preset.name.split('(')[0]}
                  </button>
                ))}
              </div>
            </div>

            <form onSubmit={handleUpdateResult} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-bold text-gray-700 mb-1">Diagnostic Progress Status</label>
                <select
                  value={reportStatus}
                  onChange={(e) => setReportStatus(e.target.value as any)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-xl font-bold text-emerald-900 bg-white"
                >
                  <option value="Completed">Completed (Verified & Transmitted to Doctor)</option>
                  <option value="In Progress">In Progress (Draft / Partial Specimen Processing)</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-gray-700 mb-1">
                  Verified Findings & Measurement Values <span className="text-red-500">*</span>
                </label>
                <textarea
                  rows={4}
                  required
                  value={results}
                  onChange={(e) => setResults(e.target.value)}
                  placeholder="Enter detailed laboratory measurements, serum titers, culture findings, or radiologist observations..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-xl font-medium focus:ring-2 focus:ring-emerald-500 font-mono text-xs"
                />
              </div>

              <div>
                <label className="block font-bold text-gray-700 mb-1">Standard Biological Reference Range</label>
                <input
                  type="text"
                  value={referenceRange}
                  onChange={(e) => setReferenceRange(e.target.value)}
                  placeholder="e.g. Hb: 12.0 - 16.0 g/dL | Fasting Glucose: 70 - 100 mg/dL"
                  className="w-full px-3 py-2 border border-gray-300 rounded-xl font-medium"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-gray-700 mb-1">Reporting Medical Technologist</label>
                  <input
                    type="text"
                    required
                    value={technicianName}
                    onChange={(e) => setTechnicianName(e.target.value)}
                    placeholder="e.g. Hassan Ali (Medical Technologist)"
                    className="w-full px-3 py-2 border border-gray-300 rounded-xl font-semibold"
                  />
                </div>

                <div>
                  <label className="block font-bold text-gray-700 mb-1">Technologist Notes & Observations</label>
                  <input
                    type="text"
                    value={technicianNotes}
                    onChange={(e) => setTechnicianNotes(e.target.value)}
                    placeholder="e.g. Repeated test twice for calibration check."
                    className="w-full px-3 py-2 border border-gray-300 rounded-xl"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t">
                <button
                  type="button"
                  onClick={() => setReportingTest(null)}
                  className="px-4 py-2 rounded-xl font-bold text-gray-600 hover:bg-gray-100 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl font-bold shadow-md cursor-pointer flex items-center gap-1.5"
                >
                  <Send className="w-3.5 h-3.5" /> Transmit & Report Results to {reportingTest.doctorName}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Official Print Document Modal */}
      <PrintDocumentModal
        isOpen={printDoc.isOpen}
        title={printDoc.title}
        htmlContent={printDoc.htmlContent}
        onClose={() => setPrintDoc((prev) => ({ ...prev, isOpen: false }))}
      />
    </div>
  );
};
