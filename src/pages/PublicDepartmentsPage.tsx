import React, { useState, useEffect } from 'react';
import { Department, DoctorStaff } from '../types';
import { api } from '../services/api';
import { Building2, MapPin, Phone, UserCheck, Search, ChevronRight } from 'lucide-react';

interface PublicDepartmentsPageProps {
  setCurrentTab?: (tab: string) => void;
}

export const PublicDepartmentsPage: React.FC<PublicDepartmentsPageProps> = ({ setCurrentTab }) => {
  const [departments, setDepartments] = useState<Department[]>([]);
  const [doctors, setDoctors] = useState<DoctorStaff[]>([]);
  const [search, setSearch] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [deptRes, docRes] = await Promise.all([api.getDepartments(), api.getDoctors()]);
        setDepartments(deptRes);
        setDoctors(docRes);
      } catch (err) {
        console.warn('Error loading public departments', err);
      }
    };
    fetchData();
  }, []);

  const filteredDepts = departments.filter((d) =>
    d.name.toLowerCase().includes(search.toLowerCase()) ||
    d.description.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Hero Banner */}
      <div className="bg-gradient-to-br from-emerald-800 via-emerald-700 to-teal-800 text-white p-8 rounded-2xl shadow-lg space-y-3">
        <div className="flex items-center gap-2 text-emerald-200 text-xs font-bold uppercase tracking-wider">
          <Building2 className="w-4 h-4 text-emerald-300" /> Garasbaley Hospital Medical Care
        </div>
        <h1 className="text-2xl sm:text-3xl font-black tracking-tight">
          Clinical Departments & Specialized Services
        </h1>
        <p className="text-xs sm:text-sm text-emerald-100 max-w-2xl leading-relaxed">
          GB Hospital offers comprehensive outpatient, inpatient, emergency, and surgical care across specialized departments staffed by certified physicians.
        </p>
      </div>

      {/* Search Input */}
      <div className="relative max-w-md">
        <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-3" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search department or specialty..."
          className="w-full pl-10 pr-4 py-2.5 bg-white border border-emerald-100 rounded-xl text-xs focus:ring-2 focus:ring-emerald-500 shadow-xs"
        />
      </div>

      {/* Department Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {filteredDepts.map((dept) => {
          const deptDocs = doctors.filter((doc) => doc.departmentId === dept.id);

          return (
            <div
              key={dept.id}
              className="bg-white rounded-2xl p-6 border border-emerald-100 shadow-sm hover:shadow-md transition-all space-y-4 flex flex-col justify-between"
            >
              <div className="space-y-3">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h2 className="text-lg font-black text-emerald-950">{dept.name}</h2>
                    <p className="text-xs text-gray-600 mt-1 leading-relaxed">{dept.description}</p>
                  </div>
                  <span className="bg-emerald-50 text-emerald-800 font-bold text-xs px-2.5 py-1 rounded-lg border border-emerald-200 shrink-0">
                    {dept.extension}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs bg-emerald-50/50 p-3 rounded-xl border border-emerald-100 text-gray-700">
                  <div className="flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                    <span className="font-semibold truncate">{dept.location}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Building2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                    <span className="truncate">{dept.ward || 'General Ward'}</span>
                  </div>
                </div>
              </div>

              {/* Department Doctors List */}
              <div className="space-y-2 border-t border-gray-100 pt-3">
                <h3 className="text-xs font-bold text-emerald-900 uppercase tracking-wider flex items-center gap-1.5">
                  <UserCheck className="w-3.5 h-3.5 text-emerald-600" />
                  Assigned Doctors ({deptDocs.length})
                </h3>

                {deptDocs.length > 0 ? (
                  <div className="space-y-1.5">
                    {deptDocs.map((doc) => (
                      <div
                        key={doc.id}
                        className="flex items-center justify-between bg-gray-50 p-2 rounded-lg border border-gray-100 text-xs"
                      >
                        <div>
                          <strong className="text-emerald-950 font-bold">{doc.name}</strong>
                          <span className="text-gray-500 block text-[11px]">{doc.specialization}</span>
                        </div>
                        <span className="text-emerald-700 font-bold text-xs">${doc.consultationFee} Fee</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-gray-400 italic">No doctors currently assigned.</p>
                )}
              </div>

              {setCurrentTab && (
                <button
                  onClick={() => setCurrentTab('find-doctor')}
                  className="w-full mt-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs py-2 rounded-xl transition-colors flex items-center justify-center gap-1"
                >
                  <span>Book Appointment in {dept.name}</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
