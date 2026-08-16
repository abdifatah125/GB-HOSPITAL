import React, { useState, useEffect, useRef } from 'react';
import { Department, DoctorStaff } from '../types';
import { api } from '../services/api';
import { DoctorAvatar } from '../components/DoctorAvatar';
import {
  Building2,
  Plus,
  Edit2,
  Trash2,
  MapPin,
  UserCheck,
  Search,
  CheckCircle2,
  Camera,
  Upload,
  Image as ImageIcon,
  Sparkles,
  Stethoscope,
  Award,
  X,
  Phone,
  Layers,
  ShieldCheck,
} from 'lucide-react';

const PRESET_HEAD_PHOTOS = [
  {
    url: 'https://images.unsplash.com/photo-1622253692010-333f2da6031d?auto=format&fit=crop&q=80&w=400',
    label: 'Male Senior Consultant',
  },
  {
    url: 'https://images.unsplash.com/photo-1594824813570-5882379d4694?auto=format&fit=crop&q=80&w=400',
    label: 'Female Cardiologist',
  },
  {
    url: 'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?auto=format&fit=crop&q=80&w=400',
    label: 'Female Obstetrician',
  },
  {
    url: 'https://images.unsplash.com/photo-1537368910025-700350fe46c7?auto=format&fit=crop&q=80&w=400',
    label: 'Male Pediatrician',
  },
  {
    url: 'https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?auto=format&fit=crop&q=80&w=400',
    label: 'Male Surgeon',
  },
  {
    url: 'https://images.unsplash.com/photo-1527613426441-4da17471b66d?auto=format&fit=crop&q=80&w=400',
    label: 'Female Neurologist',
  },
  {
    url: 'https://images.unsplash.com/photo-1582750433449-648ed127bb54?auto=format&fit=crop&q=80&w=400',
    label: 'Male ER Director',
  },
  {
    url: 'https://images.unsplash.com/photo-1584515979956-d9f6e5d09982?auto=format&fit=crop&q=80&w=400',
    label: 'Senior Midwife',
  },
];

export const DepartmentManagement: React.FC = () => {
  const [departments, setDepartments] = useState<Department[]>([]);
  const [doctors, setDoctors] = useState<DoctorStaff[]>([]);
  const [search, setSearch] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingDept, setEditingDept] = useState<Department | null>(null);

  // Form State
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [headDoctorId, setHeadDoctorId] = useState('');
  const [headDoctorName, setHeadDoctorName] = useState('');
  const [headDoctorPhoto, setHeadDoctorPhoto] = useState('');
  const [headDoctorSpecialty, setHeadDoctorSpecialty] = useState('');
  const [headDoctorQualification, setHeadDoctorQualification] = useState('');
  const [extension, setExtension] = useState('');
  const [location, setLocation] = useState('');
  const [ward, setWard] = useState('');
  const [feedback, setFeedback] = useState<string | null>(null);
  const [showPresetGallery, setShowPresetGallery] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const loadData = async () => {
    try {
      const [deptRes, docRes] = await Promise.all([api.getDepartments(), api.getDoctors()]);
      setDepartments(deptRes);
      setDoctors(docRes);
    } catch (err) {
      console.warn('Failed loading departments data', err);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleOpenModal = (dept?: Department) => {
    setShowPresetGallery(false);
    if (dept) {
      setEditingDept(dept);
      setName(dept.name);
      setDescription(dept.description);
      setHeadDoctorId(dept.headDoctorId || '');
      setHeadDoctorName(dept.headDoctorName || '');

      // Resolve head photo from department or matching doctor
      const matchedDoctor = doctors.find((d) => d.id === dept.headDoctorId);
      setHeadDoctorPhoto(dept.headDoctorPhoto || matchedDoctor?.photoUrl || '');
      setHeadDoctorSpecialty(dept.headDoctorSpecialty || matchedDoctor?.specialization || '');
      setHeadDoctorQualification(dept.headDoctorQualification || matchedDoctor?.qualification || '');

      setExtension(dept.extension);
      setLocation(dept.location);
      setWard(dept.ward || '');
    } else {
      setEditingDept(null);
      setName('');
      setDescription('');
      setHeadDoctorId('');
      setHeadDoctorName('');
      setHeadDoctorPhoto('');
      setHeadDoctorSpecialty('');
      setHeadDoctorQualification('');
      setExtension('Ext 101');
      setLocation('Floor 1, Main Block');
      setWard('General Ward');
    }
    setIsModalOpen(true);
  };

  const handleDoctorSelect = (selectedId: string) => {
    setHeadDoctorId(selectedId);
    if (!selectedId) {
      setHeadDoctorName('');
      setHeadDoctorPhoto('');
      setHeadDoctorSpecialty('');
      setHeadDoctorQualification('');
      return;
    }

    const doc = doctors.find((d) => d.id === selectedId);
    if (doc) {
      setHeadDoctorName(doc.name);
      if (doc.photoUrl) {
        setHeadDoctorPhoto(doc.photoUrl);
      }
      setHeadDoctorSpecialty(doc.specialization || doc.designation || 'Medical Specialist');
      setHeadDoctorQualification(doc.qualification || '');
    }
  };

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        alert('Image size exceeds 2MB limit. Please choose a smaller photo.');
        return;
      }
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          setHeadDoctorPhoto(event.target.result as string);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const headDoc = doctors.find((d) => d.id === headDoctorId);
    const finalHeadName = headDoctorName || (headDoc ? headDoc.name : 'Unassigned');

    const deptData: Partial<Department> = {
      name,
      description,
      headDoctorId,
      headDoctorName: finalHeadName,
      headDoctorPhoto: headDoctorPhoto || headDoc?.photoUrl || undefined,
      headDoctorSpecialty: headDoctorSpecialty || headDoc?.specialization || undefined,
      headDoctorQualification: headDoctorQualification || headDoc?.qualification || undefined,
      extension,
      location,
      ward,
    };

    try {
      if (editingDept) {
        await api.updateDepartment(editingDept.id, deptData);
        setFeedback(`Department "${name}" updated successfully with Head Doctor profile.`);
      } else {
        await api.createDepartment(deptData);
        setFeedback(`Department "${name}" created successfully.`);
      }
      setIsModalOpen(false);
      loadData();
      setTimeout(() => setFeedback(null), 4000);
    } catch (err: any) {
      alert(err.message || 'Operation failed');
    }
  };

  const handleDelete = async (id: string, deptName: string) => {
    if (confirm(`Are you sure you want to delete the "${deptName}" department?`)) {
      try {
        await api.deleteDepartment(id);
        setFeedback(`Department "${deptName}" removed.`);
        loadData();
        setTimeout(() => setFeedback(null), 3000);
      } catch (err: any) {
        alert(err.message || 'Deletion failed');
      }
    }
  };

  const filteredDepts = departments.filter(
    (d) =>
      d.name.toLowerCase().includes(search.toLowerCase()) ||
      d.location.toLowerCase().includes(search.toLowerCase()) ||
      (d.headDoctorName && d.headDoctorName.toLowerCase().includes(search.toLowerCase()))
  );

  const departmentsWithHead = departments.filter((d) => d.headDoctorId || d.headDoctorName).length;

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gradient-to-r from-emerald-900 via-emerald-800 to-teal-900 text-white p-6 rounded-2xl shadow-lg">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-emerald-300 text-xs font-bold uppercase tracking-wider">
            <Building2 className="w-4 h-4" /> Garasbaley Hospital Clinical Divisions
          </div>
          <h1 className="text-xl sm:text-2xl font-black tracking-tight text-white flex items-center gap-2">
            Hospital Departments & Leadership
          </h1>
          <p className="text-xs sm:text-sm text-emerald-100/90 max-w-2xl leading-relaxed">
            Manage hospital departments, ward locations, extensions, and Department Head profile photos and credentials.
          </p>
        </div>

        <button
          onClick={() => handleOpenModal()}
          className="bg-emerald-500 hover:bg-emerald-400 text-emerald-950 font-black text-xs px-5 py-3 rounded-xl transition-all shadow-md hover:shadow-lg flex items-center justify-center gap-2 shrink-0 self-start md:self-center"
        >
          <Plus className="w-4 h-4 text-emerald-950" /> Add New Department
        </button>
      </div>

      {/* Metrics Summary Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-white p-4 rounded-xl border border-emerald-100 shadow-xs flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center shrink-0">
            <Building2 className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xs text-gray-500 font-medium">Departments</div>
            <div className="text-lg font-black text-emerald-950">{departments.length}</div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-emerald-100 shadow-xs flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-teal-50 text-teal-700 flex items-center justify-center shrink-0">
            <UserCheck className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xs text-gray-500 font-medium">Appointed HODs</div>
            <div className="text-lg font-black text-emerald-950">{departmentsWithHead}</div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-emerald-100 shadow-xs flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center shrink-0">
            <Stethoscope className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xs text-gray-500 font-medium">Clinical Staff</div>
            <div className="text-lg font-black text-emerald-950">{doctors.length}</div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-emerald-100 shadow-xs flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-700 flex items-center justify-center shrink-0">
            <Layers className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xs text-gray-500 font-medium">Inpatient Wards</div>
            <div className="text-lg font-black text-emerald-950">{departments.filter((d) => d.ward).length}</div>
          </div>
        </div>
      </div>

      {feedback && (
        <div className="p-3 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-xl text-xs font-bold flex items-center gap-2 shadow-xs">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{feedback}</span>
        </div>
      )}

      {/* Search Bar */}
      <div className="relative max-w-md">
        <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-3" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search department, HOD doctor, or location..."
          className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl text-xs focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 shadow-xs"
        />
      </div>

      {/* Department Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {filteredDepts.map((dept) => {
          // Find matching doctor for profile photo resolution if not direct on department
          const matchedDoctor = doctors.find((d) => d.id === dept.headDoctorId);
          const hodPhoto = dept.headDoctorPhoto || matchedDoctor?.photoUrl;
          const hodName = dept.headDoctorName || matchedDoctor?.name || 'Unassigned';
          const hodSpecialty =
            dept.headDoctorSpecialty || matchedDoctor?.specialization || matchedDoctor?.designation || 'Specialist Physician';
          const hodQualification = dept.headDoctorQualification || matchedDoctor?.qualification;
          const deptDocs = doctors.filter((doc) => doc.departmentId === dept.id);

          return (
            <div
              key={dept.id}
              className="bg-white rounded-2xl border border-emerald-100 shadow-sm hover:shadow-md transition-all flex flex-col justify-between overflow-hidden group"
            >
              {/* Department Header Banner */}
              <div className="p-5 pb-4 space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="space-y-1">
                    <h2 className="text-base font-extrabold text-emerald-950 group-hover:text-emerald-700 transition-colors">
                      {dept.name}
                    </h2>
                    <div className="flex items-center gap-1.5 text-xs text-gray-500 font-medium">
                      <MapPin className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                      <span className="truncate">{dept.location}</span>
                    </div>
                  </div>
                  <span className="bg-emerald-50 text-emerald-800 text-[11px] font-extrabold px-2.5 py-1 rounded-lg border border-emerald-200 shrink-0 flex items-center gap-1">
                    <Phone className="w-3 h-3 text-emerald-600" />
                    {dept.extension}
                  </span>
                </div>

                <p className="text-xs text-gray-600 line-clamp-2 leading-relaxed">{dept.description}</p>
              </div>

              {/* Department Head (HOD) Spotlight Section with Photo */}
              <div className="mx-4 my-2 p-3.5 bg-gradient-to-br from-emerald-50/90 via-teal-50/50 to-white rounded-xl border border-emerald-100/90 space-y-2.5">
                <div className="flex items-center justify-between">
                  <div className="text-[10px] font-black uppercase tracking-wider text-emerald-900 flex items-center gap-1">
                    <Award className="w-3.5 h-3.5 text-emerald-600" />
                    Department Head (HOD)
                  </div>
                  {hodName !== 'Unassigned' && (
                    <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100/80 px-2 py-0.5 rounded-full">
                      Leader
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-3">
                  <DoctorAvatar src={hodPhoto} name={hodName} size="md" showBadge={hodName !== 'Unassigned'} />

                  <div className="min-w-0 flex-1">
                    <div className="text-xs font-black text-emerald-950 truncate">{hodName}</div>
                    <div className="text-[11px] text-emerald-800/90 font-medium truncate">{hodSpecialty}</div>
                    {hodQualification && (
                      <div className="text-[10px] text-gray-500 font-medium truncate">{hodQualification}</div>
                    )}
                  </div>
                </div>
              </div>

              {/* Card Footer: Ward, Staff Count & Action Buttons */}
              <div className="p-4 pt-3 border-t border-gray-100 flex items-center justify-between gap-2 bg-gray-50/50">
                <div className="text-[11px] text-gray-600 flex items-center gap-1.5 font-medium truncate">
                  <Building2 className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                  <span className="truncate">{dept.ward || 'General Medical Ward'}</span>
                  <span className="text-gray-300">•</span>
                  <span className="text-emerald-700 font-bold">{deptDocs.length} Staff</span>
                </div>

                <div className="flex items-center gap-1.5 shrink-0">
                  <button
                    onClick={() => handleOpenModal(dept)}
                    className="p-2 text-emerald-700 hover:bg-emerald-100/80 rounded-lg transition-colors border border-emerald-200"
                    title="Edit Department & Head Photo"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => handleDelete(dept.id, dept.name)}
                    className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors border border-red-200"
                    title="Delete Department"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Modal Form */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-xl w-full p-6 space-y-5 shadow-2xl border border-emerald-100 my-8">
            <div className="flex items-center justify-between border-b pb-3">
              <div className="space-y-0.5">
                <h2 className="text-base font-black text-emerald-950 flex items-center gap-2">
                  <Building2 className="w-5 h-5 text-emerald-600" />
                  {editingDept ? `Edit Department: ${editingDept.name}` : 'Create New Hospital Department'}
                </h2>
                <p className="text-[11px] text-gray-500">
                  Configure department details and assign head doctor with profile photo
                </p>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Department Name & Extension */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-gray-700 mb-1">Department Name *</label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Cardiology, Midwifery & Maternity"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-xs font-medium focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Internal Extension *</label>
                  <input
                    type="text"
                    required
                    value={extension}
                    onChange={(e) => setExtension(e.target.value)}
                    placeholder="Ext 101"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-xs font-medium focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Department Description</label>
                <textarea
                  rows={2}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Summary of clinical services provided..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-xs font-medium focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              {/* Location & Ward */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Floor / Wing Location *</label>
                  <input
                    type="text"
                    required
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    placeholder="Floor 2, East Wing"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-xs font-medium focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Associated Ward</label>
                  <input
                    type="text"
                    value={ward}
                    onChange={(e) => setWard(e.target.value)}
                    placeholder="e.g. Cardiac Care Unit (CCU)"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-xs font-medium focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>

              {/* Department Head (HOD) Profile Photo Section */}
              <div className="p-4 bg-emerald-50/70 border border-emerald-200/80 rounded-xl space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-black text-emerald-950 flex items-center gap-1.5">
                    <Award className="w-4 h-4 text-emerald-600" />
                    Department Head (HOD) & Profile Photo
                  </label>
                  <button
                    type="button"
                    onClick={() => setShowPresetGallery(!showPresetGallery)}
                    className="text-[11px] font-bold text-emerald-700 hover:text-emerald-900 flex items-center gap-1"
                  >
                    <Sparkles className="w-3 h-3 text-emerald-600" />
                    {showPresetGallery ? 'Hide Preset Photos' : 'Choose Preset Avatar'}
                  </button>
                </div>

                {/* Doctor Select */}
                <div>
                  <label className="block text-[11px] font-bold text-gray-600 mb-1">
                    Select Head Doctor from Staff List
                  </label>
                  <select
                    value={headDoctorId}
                    onChange={(e) => handleDoctorSelect(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-xs font-bold bg-white focus:ring-2 focus:ring-emerald-500"
                  >
                    <option value="">-- No Head Doctor Assigned --</option>
                    {doctors.map((doc) => (
                      <option key={doc.id} value={doc.id}>
                        {doc.name} — {doc.specialization} ({doc.departmentName || 'Medical'})
                      </option>
                    ))}
                  </select>
                </div>

                {/* Doctor Avatar Preview & Upload Options */}
                <div className="flex flex-col sm:flex-row sm:items-center gap-4 bg-white p-3.5 rounded-xl border border-emerald-100">
                  <div className="flex items-center gap-3">
                    <DoctorAvatar
                      src={headDoctorPhoto}
                      name={headDoctorName || name || 'Doctor'}
                      size="lg"
                      showBadge={Boolean(headDoctorPhoto)}
                    />
                    <div>
                      <div className="text-xs font-extrabold text-emerald-950">
                        {headDoctorName || 'Doctor Photo Preview'}
                      </div>
                      <div className="text-[11px] text-gray-500">
                        {headDoctorPhoto ? 'Custom photo active' : 'Default initials avatar'}
                      </div>
                      {headDoctorPhoto && (
                        <button
                          type="button"
                          onClick={() => setHeadDoctorPhoto('')}
                          className="text-[10px] text-red-600 hover:underline font-bold mt-0.5"
                        >
                          Remove Photo
                        </button>
                      )}
                    </div>
                  </div>

                  <div className="sm:ml-auto flex flex-wrap items-center gap-2">
                    <input
                      type="file"
                      ref={fileInputRef}
                      onChange={handlePhotoUpload}
                      accept="image/*"
                      className="hidden"
                    />
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="px-3 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 rounded-lg text-xs font-bold border border-emerald-200 flex items-center gap-1.5 transition-colors"
                    >
                      <Upload className="w-3.5 h-3.5 text-emerald-600" />
                      <span>Upload Photo</span>
                    </button>
                  </div>
                </div>

                {/* Direct Image URL input */}
                <div>
                  <label className="block text-[11px] font-bold text-gray-600 mb-1">
                    Or Enter Image URL for Head Doctor
                  </label>
                  <div className="relative">
                    <ImageIcon className="w-3.5 h-3.5 text-gray-400 absolute left-3 top-2.5" />
                    <input
                      type="url"
                      value={headDoctorPhoto}
                      onChange={(e) => setHeadDoctorPhoto(e.target.value)}
                      placeholder="https://images.unsplash.com/... or custom photo link"
                      className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg text-xs focus:ring-2 focus:ring-emerald-500 bg-white"
                    />
                  </div>
                </div>

                {/* Preset Avatars Gallery */}
                {showPresetGallery && (
                  <div className="p-3 bg-white rounded-xl border border-emerald-100 space-y-2">
                    <div className="text-[11px] font-bold text-gray-700">Click a doctor photo to apply:</div>
                    <div className="grid grid-cols-4 sm:grid-cols-8 gap-2">
                      {PRESET_HEAD_PHOTOS.map((preset, idx) => (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => setHeadDoctorPhoto(preset.url)}
                          className={`relative rounded-xl overflow-hidden aspect-square border-2 transition-all hover:scale-105 ${
                            headDoctorPhoto === preset.url
                              ? 'border-emerald-600 ring-2 ring-emerald-400'
                              : 'border-gray-200 hover:border-emerald-400'
                          }`}
                          title={preset.label}
                        >
                          <img
                            src={preset.url}
                            alt={preset.label}
                            referrerPolicy="no-referrer"
                            className="w-full h-full object-cover"
                          />
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Doctor Specialization & Qualification Override */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                  <div>
                    <label className="block text-[11px] font-bold text-gray-600 mb-1">HOD Specialty / Title</label>
                    <input
                      type="text"
                      value={headDoctorSpecialty}
                      onChange={(e) => setHeadDoctorSpecialty(e.target.value)}
                      placeholder="e.g. Chief of Cardiology"
                      className="w-full px-3 py-1.5 border border-gray-300 rounded-lg text-xs bg-white"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-gray-600 mb-1">HOD Qualification</label>
                    <input
                      type="text"
                      value={headDoctorQualification}
                      onChange={(e) => setHeadDoctorQualification(e.target.value)}
                      placeholder="e.g. MD, FACC, Board Certified"
                      className="w-full px-3 py-1.5 border border-gray-300 rounded-lg text-xs bg-white"
                    />
                  </div>
                </div>
              </div>

              {/* Modal Buttons */}
              <div className="flex justify-end gap-2 pt-3 border-t">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-gray-600 hover:bg-gray-100 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-black shadow-md transition-all flex items-center gap-1.5"
                >
                  <ShieldCheck className="w-4 h-4" />
                  <span>Save Department</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
