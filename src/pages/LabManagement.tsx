import React, { useState, useEffect } from 'react';
import { LabTestRequest, Patient, DoctorStaff } from '../types';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { TestTube, Plus, Edit2, CheckCircle2, Clock, AlertCircle, Search, FileText, Upload } from 'lucide-react';

export const LabManagement: React.FC = () => {
  const { user } = useAuth();
  const [labTests, setLabTests] = useState<LabTestRequest[]>([]);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [doctors, setDoctors] = useState<DoctorStaff[]>([]);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  // Doctor Request Modal State
  const [isRequestModalOpen, setIsRequestModalOpen] = useState(false);
  const [patientId, setPatientId] = useState('');
  const [doctorId, setDoctorId] = useState('');
  const [testName, setTestName] = useState('Full Blood Count (FBC) & Hb');
  const [category, setCategory] = useState('Hematology');

  // Lab Tech Result Upload Modal State
  const [editingLabTest, setEditingLabTest] = useState<LabTestRequest | null>(null);
  const [status, setStatus] = useState<'Requested' | 'In Progress' | 'Completed'>('In Progress');
  const [results, setResults] = useState('');
  const [referenceRange, setReferenceRange] = useState('');
  const [technicianNotes, setTechnicianNotes] = useState('');

  const [feedback, setFeedback] = useState<string | null>(null);

  const loadData = async () => {
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
      if (docRes.length > 0 && !doctorId) setDoctorId(docRes[0].id);
    } catch (err) {
      console.warn('Error loading lab management data', err);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

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
        status: 'Requested',
      });

      setFeedback(`Lab test "${testName}" requested for ${pat.name}.`);
      setIsRequestModalOpen(false);
      loadData();
      setTimeout(() => setFeedback(null), 3000);
    } catch (err: any) {
      alert(err.message || 'Error creating test request');
    }
  };

  const handleOpenResultModal = (test: LabTestRequest) => {
    setEditingLabTest(test);
    setStatus(test.status);
    setResults(test.results || '');
    setReferenceRange(test.referenceRange || 'Hb: 12.0 - 15.5 g/dL, WBC: 4,000 - 11,000 /uL');
    setTechnicianNotes(test.technicianNotes || '');
  };

  const handleUpdateResult = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingLabTest) return;

    try {
      await api.updateLabTest(editingLabTest.id, {
        status,
        results,
        referenceRange,
        technicianNotes,
        resultDate: status === 'Completed' ? new Date().toISOString().split('T')[0] : undefined,
        technicianName: user?.name || 'Hassan Ali (Lab Tech)',
      });

      setFeedback(`Lab test results updated for ${editingLabTest.patientName}.`);
      setEditingLabTest(null);
      loadData();
      setTimeout(() => setFeedback(null), 3000);
    } catch (err: any) {
      alert(err.message || 'Error updating lab results');
    }
  };

  const filteredTests = labTests.filter((l) => {
    const matchesSearch =
      l.patientName.toLowerCase().includes(search.toLowerCase()) ||
      l.testName.toLowerCase().includes(search.toLowerCase()) ||
      l.doctorName.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter ? l.status === statusFilter : true;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-emerald-100 shadow-sm">
        <div>
          <h1 className="text-xl font-extrabold text-emerald-950 flex items-center gap-2">
            <TestTube className="w-6 h-6 text-emerald-600" /> Laboratory & Diagnostics Management
          </h1>
          <p className="text-xs text-emerald-800 mt-1">
            Order pathology/radiology tests, upload lab results, record reference ranges, and manage diagnostic status.
          </p>
        </div>

        <button
          onClick={() => setIsRequestModalOpen(true)}
          className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs px-4 py-2.5 rounded-xl transition-all shadow-md flex items-center justify-center gap-2 shrink-0"
        >
          <Plus className="w-4 h-4" /> Order New Lab Test
        </button>
      </div>

      {feedback && (
        <div className="p-3 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-xl text-xs font-semibold flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          <span>{feedback}</span>
        </div>
      )}

      {/* Search & Status Filters */}
      <div className="bg-white p-4 rounded-2xl border border-emerald-100 shadow-sm flex flex-col sm:flex-row gap-3 items-center">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by patient, doctor, or test name (e.g. CBC, Lipid Profile)..."
            className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-xl text-xs focus:ring-2 focus:ring-emerald-500"
          />
        </div>

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="w-full sm:w-auto bg-emerald-50 border border-emerald-200 rounded-xl px-3 py-2 text-xs font-bold text-emerald-900"
        >
          <option value="">All Test Statuses</option>
          <option value="Requested">Requested</option>
          <option value="In Progress">In Progress</option>
          <option value="Completed">Completed</option>
        </select>
      </div>

      {/* Lab Test Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filteredTests.map((test) => (
          <div
            key={test.id}
            className="bg-white rounded-2xl p-5 border border-emerald-100 shadow-sm hover:shadow-md transition-all space-y-3 flex flex-col justify-between"
          >
            <div className="space-y-2">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <h3 className="text-base font-extrabold text-emerald-950">{test.testName}</h3>
                  <p className="text-xs font-bold text-gray-500">Patient: {test.patientName}</p>
                </div>

                <span
                  className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase ${
                    test.status === 'Completed'
                      ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                      : test.status === 'In Progress'
                      ? 'bg-amber-100 text-amber-800 border border-amber-300 animate-pulse'
                      : 'bg-gray-100 text-gray-700 border border-gray-300'
                  }`}
                >
                  {test.status}
                </span>
              </div>

              <div className="bg-emerald-50/60 p-3 rounded-xl border border-emerald-100 text-xs space-y-1 text-gray-700">
                <div className="flex items-center justify-between">
                  <span>Ordered By:</span>
                  <strong className="text-emerald-900 font-bold">{test.doctorName}</strong>
                </div>
                <div className="flex items-center justify-between">
                  <span>Order Date:</span>
                  <span>{test.requestDate}</span>
                </div>
                {test.resultDate && (
                  <div className="flex items-center justify-between font-bold text-emerald-800">
                    <span>Completed Date:</span>
                    <span>{test.resultDate}</span>
                  </div>
                )}
              </div>

              {test.results && (
                <div className="p-3 bg-white border border-emerald-200 rounded-xl text-xs space-y-1">
                  <span className="font-extrabold text-emerald-900 block border-b pb-1">Lab Results Output:</span>
                  <p className="text-gray-800 font-medium leading-relaxed">{test.results}</p>
                  {test.referenceRange && (
                    <p className="text-[11px] text-gray-500 italic pt-1">Ref Range: {test.referenceRange}</p>
                  )}
                  {test.technicianNotes && (
                    <p className="text-[11px] text-emerald-700 font-semibold pt-1">Notes: {test.technicianNotes}</p>
                  )}
                </div>
              )}
            </div>

            <div className="pt-3 border-t border-gray-100 flex items-center justify-between">
              <span className="text-[11px] text-gray-400 italic">
                {test.technicianName ? `Tech: ${test.technicianName}` : 'Awaiting Technician Execution'}
              </span>

              <button
                onClick={() => handleOpenResultModal(test)}
                className="bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-1.5 rounded-lg text-xs font-bold transition-colors shadow-xs inline-flex items-center gap-1"
              >
                <Upload className="w-3.5 h-3.5" /> Enter / Update Results
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Order Test Modal */}
      {isRequestModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 space-y-4 shadow-2xl border border-emerald-100">
            <h2 className="text-base font-extrabold text-emerald-950 border-b pb-2">
              Request Diagnostic Laboratory Test
            </h2>

            <form onSubmit={handleCreateRequest} className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Select Patient</label>
                <select
                  required
                  value={patientId}
                  onChange={(e) => setPatientId(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-xs font-semibold"
                >
                  {patients.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} (Age {p.age}, Blood {p.bloodGroup})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Requesting Doctor</label>
                <select
                  required
                  value={doctorId}
                  onChange={(e) => setDoctorId(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-xs font-bold text-emerald-900"
                >
                  {doctors.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.name} ({d.departmentName})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Test Name</label>
                  <input
                    type="text"
                    required
                    value={testName}
                    onChange={(e) => setTestName(e.target.value)}
                    placeholder="e.g. Full Blood Count, Chest X-Ray"
                    className="w-full px-3 py-1.5 border border-gray-300 rounded-lg text-xs"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Diagnostic Category</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full px-3 py-1.5 border border-gray-300 rounded-lg text-xs font-semibold"
                  >
                    <option value="Hematology">Hematology</option>
                    <option value="Biochemistry">Biochemistry</option>
                    <option value="Microbiology">Microbiology</option>
                    <option value="Radiology & X-Ray">Radiology & X-Ray</option>
                    <option value="Urinalysis">Urinalysis</option>
                  </select>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t">
                <button
                  type="button"
                  onClick={() => setIsRequestModalOpen(false)}
                  className="px-4 py-2 rounded-lg text-xs font-bold text-gray-600 hover:bg-gray-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold shadow-md"
                >
                  Submit Order
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Lab Technician Upload Results Modal */}
      {editingLabTest && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 space-y-4 shadow-2xl border border-emerald-100">
            <h2 className="text-base font-extrabold text-emerald-950 border-b pb-2">
              Update Test Results: {editingLabTest.testName}
            </h2>

            <div className="bg-emerald-50 p-3 rounded-xl border border-emerald-100 text-xs space-y-1 text-emerald-900">
              <div>Patient: <strong className="font-bold">{editingLabTest.patientName}</strong></div>
              <div>Doctor: <strong>{editingLabTest.doctorName}</strong></div>
            </div>

            <form onSubmit={handleUpdateResult} className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Progress Status</label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value as any)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-xs font-bold text-emerald-800"
                >
                  <option value="Requested">Requested</option>
                  <option value="In Progress">In Progress</option>
                  <option value="Completed">Completed</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Laboratory Findings & Result Values</label>
                <textarea
                  rows={3}
                  required
                  value={results}
                  onChange={(e) => setResults(e.target.value)}
                  placeholder="Enter detailed laboratory measurements, serum levels, or x-ray radiologist findings..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-xs font-medium"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Standard Reference Range</label>
                <input
                  type="text"
                  value={referenceRange}
                  onChange={(e) => setReferenceRange(e.target.value)}
                  placeholder="e.g. Hb Normal Female: 12.0 - 15.5 g/dL"
                  className="w-full px-3 py-1.5 border border-gray-300 rounded-lg text-xs"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Technician Notes & Observations</label>
                <input
                  type="text"
                  value={technicianNotes}
                  onChange={(e) => setTechnicianNotes(e.target.value)}
                  placeholder="e.g. Sample re-tested twice for confirmation..."
                  className="w-full px-3 py-1.5 border border-gray-300 rounded-lg text-xs"
                />
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t">
                <button
                  type="button"
                  onClick={() => setEditingLabTest(null)}
                  className="px-4 py-2 rounded-lg text-xs font-bold text-gray-600 hover:bg-gray-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold shadow-md"
                >
                  Save Results
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
