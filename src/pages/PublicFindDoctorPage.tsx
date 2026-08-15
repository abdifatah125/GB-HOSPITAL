import React, { useState, useEffect } from 'react';
import { DoctorStaff, Department } from '../types';
import { api } from '../services/api';
import { Search, Calendar, Clock, DollarSign, UserCheck, ArrowRight, Filter } from 'lucide-react';

interface PublicFindDoctorPageProps {
  setCurrentTab: (tab: string) => void;
  setSelectedDoctorForBooking?: (doc: DoctorStaff) => void;
}

export const PublicFindDoctorPage: React.FC<PublicFindDoctorPageProps> = ({
  setCurrentTab,
  setSelectedDoctorForBooking,
}) => {
  const [doctors, setDoctors] = useState<DoctorStaff[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [search, setSearch] = useState('');
  const [selectedDept, setSelectedDept] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [docRes, deptRes] = await Promise.all([api.getDoctors(), api.getDepartments()]);
        setDoctors(docRes);
        setDepartments(deptRes);
      } catch (err) {
        console.warn('Error fetching doctor directory:', err);
      }
    };
    fetchData();
  }, []);

  const handleBook = (doc: DoctorStaff) => {
    if (setSelectedDoctorForBooking) {
      setSelectedDoctorForBooking(doc);
    }
    setCurrentTab('appointments');
  };

  const filteredDocs = doctors.filter((doc) => {
    const matchesSearch =
      doc.name.toLowerCase().includes(search.toLowerCase()) ||
      doc.specialization.toLowerCase().includes(search.toLowerCase());
    const matchesDept = selectedDept ? doc.departmentId === selectedDept : true;
    return matchesSearch && matchesDept;
  });

  return (
    <div className="space-y-6">
      {/* Banner */}
      <div className="bg-gradient-to-r from-teal-800 to-emerald-700 text-white p-6 rounded-2xl shadow-md space-y-2">
        <div className="flex items-center gap-2 text-emerald-200 text-xs font-bold uppercase tracking-wider">
          <Search className="w-4 h-4 text-emerald-300" /> Garasbaley Hospital Physician Directory
        </div>
        <h1 className="text-2xl font-black tracking-tight">Find a Doctor & Book Consultation</h1>
        <p className="text-xs text-emerald-100 max-w-xl">
          Search Garasbaley Hospital's medical specialists by department or clinical expertise. Book an appointment directly with real-time slot scheduling.
        </p>
      </div>

      {/* Filter Controls */}
      <div className="bg-white p-4 rounded-2xl border border-emerald-100 shadow-sm flex flex-col sm:flex-row gap-3 items-center">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by doctor name or specialization (e.g., Cardiologist)..."
            className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-xl text-xs focus:ring-2 focus:ring-emerald-500"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto shrink-0">
          <Filter className="w-4 h-4 text-emerald-700" />
          <select
            value={selectedDept}
            onChange={(e) => setSelectedDept(e.target.value)}
            className="w-full sm:w-auto bg-emerald-50 border border-emerald-200 rounded-xl px-3 py-2 text-xs font-bold text-emerald-900"
          >
            <option value="">All Departments</option>
            {departments.map((d) => (
              <option key={d.id} value={d.id}>
                {d.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Doctor Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {filteredDocs.map((doc) => (
          <div
            key={doc.id}
            className="bg-white rounded-2xl p-5 border border-emerald-100 shadow-sm hover:shadow-md transition-all flex flex-col justify-between space-y-4"
          >
            <div className="space-y-3">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <h3 className="text-base font-extrabold text-emerald-950">{doc.name}</h3>
                  <p className="text-xs font-bold text-emerald-700">{doc.specialization}</p>
                </div>
                <span className="bg-emerald-100 text-emerald-800 text-[10px] font-black px-2 py-0.5 rounded uppercase">
                  {doc.departmentName}
                </span>
              </div>

              <div className="bg-emerald-50/60 p-3 rounded-xl border border-emerald-100 text-xs space-y-1.5 text-gray-700">
                <div className="flex items-center gap-2">
                  <Calendar className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  <span>
                    Days: <strong className="text-emerald-950">{doc.availableDays.join(', ')}</strong>
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  <span>Hours: {doc.availableHours}</span>
                </div>
              </div>
            </div>

            <div className="pt-3 border-t border-gray-100 flex items-center justify-between">
              <div>
                <span className="text-[10px] font-bold text-gray-400 uppercase block">Consultation Fee</span>
                <span className="text-lg font-black text-emerald-700">${doc.consultationFee}</span>
              </div>

              <button
                onClick={() => handleBook(doc)}
                className="bg-emerald-600 hover:bg-emerald-700 text-white px-3.5 py-2 rounded-xl text-xs font-bold transition-colors shadow-sm flex items-center gap-1.5"
              >
                <span>Book Slot</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
