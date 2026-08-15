import React, { useState, useEffect } from 'react';
import { Department, DoctorStaff } from '../types';
import { api } from '../services/api';
import { Building2, Plus, Edit2, Trash2, Phone, MapPin, UserCheck, Search, CheckCircle2 } from 'lucide-react';

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
  const [extension, setExtension] = useState('');
  const [location, setLocation] = useState('');
  const [ward, setWard] = useState('');
  const [feedback, setFeedback] = useState<string | null>(null);

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
    if (dept) {
      setEditingDept(dept);
      setName(dept.name);
      setDescription(dept.description);
      setHeadDoctorId(dept.headDoctorId || '');
      setExtension(dept.extension);
      setLocation(dept.location);
      setWard(dept.ward || '');
    } else {
      setEditingDept(null);
      setName('');
      setDescription('');
      setHeadDoctorId('');
      setExtension('Ext 101');
      setLocation('Floor 1, Main Block');
      setWard('General Ward');
    }
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const headDoc = doctors.find((d) => d.id === headDoctorId);
    const deptData: Partial<Department> = {
      name,
      description,
      headDoctorId,
      headDoctorName: headDoc ? headDoc.name : 'Unassigned',
      extension,
      location,
      ward,
    };

    try {
      if (editingDept) {
        await api.updateDepartment(editingDept.id, deptData);
        setFeedback(`Department "${name}" updated successfully.`);
      } else {
        await api.createDepartment(deptData);
        setFeedback(`Department "${name}" created successfully.`);
      }
      setIsModalOpen(false);
      loadData();
      setTimeout(() => setFeedback(null), 3000);
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
      d.location.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-emerald-100 shadow-sm">
        <div>
          <h1 className="text-xl font-extrabold text-emerald-950 flex items-center gap-2">
            <Building2 className="w-6 h-6 text-emerald-600" /> Garasbaley Hospital Departments
          </h1>
          <p className="text-xs text-emerald-800 mt-1">
            Manage hospital medical units, ward locations, extensions, and assigned Department Heads.
          </p>
        </div>

        <button
          onClick={() => handleOpenModal()}
          className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs px-4 py-2.5 rounded-xl transition-all shadow-md flex items-center justify-center gap-2 shrink-0"
        >
          <Plus className="w-4 h-4" /> Add Department
        </button>
      </div>

      {feedback && (
        <div className="p-3 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-xl text-xs font-semibold flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          <span>{feedback}</span>
        </div>
      )}

      {/* Search Bar */}
      <div className="relative max-w-md">
        <Search className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search department name or floor location..."
          className="w-full pl-9 pr-4 py-2 bg-white border border-gray-200 rounded-xl text-xs focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
        />
      </div>

      {/* Department Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredDepts.map((dept) => (
          <div
            key={dept.id}
            className="bg-white p-5 rounded-2xl border border-emerald-100 shadow-sm hover:shadow-md transition-all flex flex-col justify-between space-y-4"
          >
            <div className="space-y-2">
              <div className="flex items-start justify-between gap-2">
                <h3 className="text-base font-extrabold text-emerald-950">{dept.name}</h3>
                <span className="bg-emerald-50 text-emerald-700 text-[11px] font-bold px-2 py-0.5 rounded border border-emerald-200 shrink-0">
                  {dept.extension}
                </span>
              </div>

              <p className="text-xs text-gray-600 line-clamp-2 leading-relaxed">{dept.description}</p>
            </div>

            <div className="space-y-2 pt-3 border-t border-gray-100 text-xs">
              <div className="flex items-center gap-2 text-gray-700">
                <UserCheck className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                <span className="truncate">
                  Head: <strong>{dept.headDoctorName || 'Unassigned'}</strong>
                </span>
              </div>

              <div className="flex items-center gap-2 text-gray-700">
                <MapPin className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                <span className="truncate">{dept.location} ({dept.ward || 'Main Ward'})</span>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => handleOpenModal(dept)}
                className="p-1.5 text-emerald-700 hover:bg-emerald-50 rounded-lg transition-colors border border-emerald-200"
                title="Edit Department"
              >
                <Edit2 className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => handleDelete(dept.id, dept.name)}
                className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg transition-colors border border-red-200"
                title="Delete Department"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Modal Form */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 space-y-4 shadow-2xl border border-emerald-100">
            <h2 className="text-base font-extrabold text-emerald-950 border-b pb-2">
              {editingDept ? `Edit Department: ${editingDept.name}` : 'Create New Hospital Department'}
            </h2>

            <form onSubmit={handleSubmit} className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Department Name</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Cardiology, Midwifery & Maternity"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-xs"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Description</label>
                <textarea
                  rows={2}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Brief summary of department services..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Department Head (Doctor)</label>
                  <select
                    value={headDoctorId}
                    onChange={(e) => setHeadDoctorId(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-xs font-semibold"
                  >
                    <option value="">-- Select Head Doctor --</option>
                    {doctors.map((doc) => (
                      <option key={doc.id} value={doc.id}>
                        {doc.name} ({doc.specialization})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Extension Number</label>
                  <input
                    type="text"
                    required
                    value={extension}
                    onChange={(e) => setExtension(e.target.value)}
                    placeholder="Ext 101"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-xs"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Floor / Location</label>
                  <input
                    type="text"
                    required
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    placeholder="Floor 2, East Wing"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-xs"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Ward Name</label>
                  <input
                    type="text"
                    value={ward}
                    onChange={(e) => setWard(e.target.value)}
                    placeholder="Maternity Ward Suite B"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-xs"
                  />
                </div>
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
                  Save Department
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
