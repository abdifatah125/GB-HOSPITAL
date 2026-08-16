import React, { useState, useEffect } from 'react';
import { Department, DoctorStaff } from '../types';
import { api } from '../services/api';
import { DoctorAvatar } from '../components/DoctorAvatar';
import {
  Building2,
  MapPin,
  Phone,
  UserCheck,
  Search,
  ChevronRight,
  Award,
  Stethoscope,
  Sparkles,
} from 'lucide-react';

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
    d.description.toLowerCase().includes(search.toLowerCase()) ||
    (d.headDoctorName && d.headDoctorName.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div className="space-y-6">
      {/* Hero Banner */}
      <div className="bg-gradient-to-br from-emerald-900 via-emerald-800 to-teal-900 text-white p-8 rounded-2xl shadow-lg space-y-3">
        <div className="flex items-center gap-2 text-emerald-300 text-xs font-bold uppercase tracking-wider">
          <Building2 className="w-4 h-4 text-emerald-300" /> Garasbaley Hospital Medical Care
        </div>
        <h1 className="text-2xl sm:text-3xl font-black tracking-tight">
          Clinical Departments & Leadership
        </h1>
        <p className="text-xs sm:text-sm text-emerald-100 max-w-2xl leading-relaxed">
          GB Hospital offers comprehensive outpatient, inpatient, emergency, and surgical care across specialized clinical departments led by certified consultant physicians.
        </p>
      </div>

      {/* Search Input */}
      <div className="relative max-w-md">
        <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-3" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search department, HOD physician, or specialty..."
          className="w-full pl-10 pr-4 py-2.5 bg-white border border-emerald-100 rounded-xl text-xs focus:ring-2 focus:ring-emerald-500 shadow-xs"
        />
      </div>

      {/* Department Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {filteredDepts.map((dept) => {
          const deptDocs = doctors.filter((doc) => doc.departmentId === dept.id);
          const matchedHead = doctors.find((doc) => doc.id === dept.headDoctorId);
          const headPhoto = dept.headDoctorPhoto || matchedHead?.photoUrl;
          const headName = dept.headDoctorName || matchedHead?.name || 'Unassigned';
          const headSpecialty =
            dept.headDoctorSpecialty || matchedHead?.specialization || matchedHead?.designation || 'Specialist Head';
          const headQualification = dept.headDoctorQualification || matchedHead?.qualification;

          return (
            <div
              key={dept.id}
              className="bg-white rounded-2xl p-6 border border-emerald-100 shadow-sm hover:shadow-md transition-all space-y-5 flex flex-col justify-between"
            >
              <div className="space-y-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h2 className="text-lg font-black text-emerald-950">{dept.name}</h2>
                    <p className="text-xs text-gray-600 mt-1 leading-relaxed">{dept.description}</p>
                  </div>
                  <span className="bg-emerald-50 text-emerald-800 font-bold text-xs px-2.5 py-1 rounded-lg border border-emerald-200 shrink-0 flex items-center gap-1">
                    <Phone className="w-3 h-3 text-emerald-600" />
                    {dept.extension}
                  </span>
                </div>

                {/* Location and Ward Details */}
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

                {/* Department Head Spotlight with Photo */}
                <div className="p-3.5 bg-gradient-to-r from-emerald-50 via-teal-50/50 to-white rounded-xl border border-emerald-100 flex items-center gap-3.5">
                  <DoctorAvatar src={headPhoto} name={headName} size="lg" showBadge={headName !== 'Unassigned'} />
                  <div className="min-w-0 flex-1 space-y-0.5">
                    <div className="text-[10px] font-black uppercase tracking-wider text-emerald-800 flex items-center gap-1">
                      <Award className="w-3 h-3 text-emerald-600" /> Department Head (HOD)
                    </div>
                    <div className="text-xs font-black text-emerald-950 truncate">{headName}</div>
                    <div className="text-[11px] text-emerald-800 font-medium truncate">{headSpecialty}</div>
                    {headQualification && (
                      <div className="text-[10px] text-gray-500 font-medium truncate">{headQualification}</div>
                    )}
                  </div>
                </div>
              </div>

              {/* Department Doctors List */}
              <div className="space-y-2 border-t border-gray-100 pt-3">
                <h3 className="text-xs font-bold text-emerald-900 uppercase tracking-wider flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <UserCheck className="w-3.5 h-3.5 text-emerald-600" />
                    Department Physicians & Staff
                  </span>
                  <span className="text-gray-400 font-normal text-[11px]">{deptDocs.length} Total</span>
                </h3>

                {deptDocs.length > 0 ? (
                  <div className="space-y-1.5 max-h-40 overflow-y-auto pr-1">
                    {deptDocs.map((doc) => (
                      <div
                        key={doc.id}
                        className="flex items-center justify-between bg-gray-50/80 p-2 rounded-xl border border-gray-100 text-xs"
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <DoctorAvatar src={doc.photoUrl} name={doc.name} size="xs" />
                          <div className="truncate">
                            <strong className="text-emerald-950 font-bold block truncate">{doc.name}</strong>
                            <span className="text-gray-500 text-[10px] block truncate">{doc.specialization}</span>
                          </div>
                        </div>
                        <span className="text-emerald-700 font-bold text-xs shrink-0 ml-2">
                          {doc.consultationFee > 0 ? `$${doc.consultationFee}` : 'Included'}
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-gray-400 italic">No additional doctors currently assigned.</p>
                )}
              </div>

              {setCurrentTab && (
                <button
                  onClick={() => setCurrentTab('find-doctor')}
                  className="w-full mt-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs py-2.5 rounded-xl transition-colors flex items-center justify-center gap-1 shadow-xs"
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
