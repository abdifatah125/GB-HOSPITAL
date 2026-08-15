import React, { useState, useEffect } from 'react';
import { Medicine } from '../types';
import { api } from '../services/api';
import { BookOpen, Plus, Search, Filter, Pill, ShieldAlert, CheckCircle2 } from 'lucide-react';

export const MedicineLibrary: React.FC = () => {
  const [medicines, setMedicines] = useState<Medicine[]>([]);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');

  // Add Medicine Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [name, setName] = useState('');
  const [genericName, setGenericName] = useState('');
  const [brandName, setBrandName] = useState('');
  const [category, setCategory] = useState('Antibiotic');
  const [dosageForm, setDosageForm] = useState('Tablet');
  const [strength, setStrength] = useState('500mg');
  const [manufacturer, setManufacturer] = useState('');
  const [description, setDescription] = useState('');
  const [feedback, setFeedback] = useState<string | null>(null);

  const loadMedicines = async () => {
    try {
      const data = await api.getMedicines();
      setMedicines(data);
    } catch (err) {
      console.warn('Error loading master drug library', err);
    }
  };

  useEffect(() => {
    loadMedicines();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.createMedicine({
        name,
        genericName,
        brandName,
        category,
        dosageForm,
        strength,
        manufacturer,
        description,
      });
      setFeedback(`Medicine "${name}" added to GB Hospital Master Drug Database.`);
      setIsModalOpen(false);
      loadMedicines();
      setTimeout(() => setFeedback(null), 3000);
    } catch (err: any) {
      alert(err.message || 'Error adding drug');
    }
  };

  const categories = Array.from(new Set(medicines.map((m) => m.category)));

  const filteredMeds = medicines.filter((m) => {
    const matchesSearch =
      m.name.toLowerCase().includes(search.toLowerCase()) ||
      m.genericName.toLowerCase().includes(search.toLowerCase()) ||
      m.brandName.toLowerCase().includes(search.toLowerCase());
    const matchesCat = categoryFilter ? m.category === categoryFilter : true;
    return matchesSearch && matchesCat;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-emerald-100 shadow-sm">
        <div>
          <h1 className="text-xl font-extrabold text-emerald-950 flex items-center gap-2">
            <BookOpen className="w-6 h-6 text-emerald-600" /> Master Medicine Library
          </h1>
          <p className="text-xs text-emerald-800 mt-1">
            Pharmacopeia reference index with generic compounds, strengths, dosage forms, and brand formulations.
          </p>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs px-4 py-2.5 rounded-xl transition-all shadow-md flex items-center justify-center gap-2 shrink-0"
        >
          <Plus className="w-4 h-4" /> Add New Medicine Entry
        </button>
      </div>

      {feedback && (
        <div className="p-3 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-xl text-xs font-semibold flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          <span>{feedback}</span>
        </div>
      )}

      {/* Search & Category Filter */}
      <div className="bg-white p-4 rounded-2xl border border-emerald-100 shadow-sm flex flex-col sm:flex-row gap-3 items-center">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search drug by brand name, generic formulation, or active agent..."
            className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-xl text-xs focus:ring-2 focus:ring-emerald-500"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto shrink-0">
          <Filter className="w-4 h-4 text-emerald-700" />
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="w-full sm:w-auto bg-emerald-50 border border-emerald-200 rounded-xl px-3 py-2 text-xs font-bold text-emerald-900"
          >
            <option value="">All Drug Categories</option>
            {categories.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Grid of Master Drugs */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredMeds.map((med) => (
          <div
            key={med.id}
            className="bg-white p-5 rounded-2xl border border-emerald-100 shadow-sm hover:shadow-md transition-all flex flex-col justify-between space-y-3"
          >
            <div>
              <div className="flex items-start justify-between gap-2">
                <div>
                  <h3 className="text-base font-extrabold text-emerald-950">{med.name}</h3>
                  <p className="text-xs font-bold text-gray-500">{med.genericName}</p>
                </div>
                <span className="bg-emerald-100 text-emerald-800 text-[10px] font-black px-2 py-0.5 rounded uppercase">
                  {med.dosageForm}
                </span>
              </div>

              <div className="mt-2.5 bg-emerald-50/60 p-2.5 rounded-xl border border-emerald-100 space-y-1 text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-gray-500 font-medium">Brand:</span>
                  <strong className="text-emerald-900 font-bold">{med.brandName}</strong>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-500 font-medium">Category:</span>
                  <span className="text-emerald-700 font-bold">{med.category}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-500 font-medium">Strength:</span>
                  <span className="text-emerald-800 font-black">{med.strength}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-500 font-medium">Manufacturer:</span>
                  <span className="text-gray-700 truncate max-w-[150px]">{med.manufacturer}</span>
                </div>
              </div>
            </div>

            <p className="text-xs text-gray-600 pt-2 border-t border-gray-100 line-clamp-2 leading-relaxed">
              {med.description}
            </p>
          </div>
        ))}
      </div>

      {/* Modal Form */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 space-y-4 shadow-2xl border border-emerald-100">
            <h2 className="text-base font-extrabold text-emerald-950 border-b pb-2">
              Add Master Drug Entry
            </h2>

            <form onSubmit={handleSubmit} className="space-y-3">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Trade/Drug Name</label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Amoxicillin 500mg"
                    className="w-full px-3 py-1.5 border border-gray-300 rounded-lg text-xs"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Generic Name</label>
                  <input
                    type="text"
                    required
                    value={genericName}
                    onChange={(e) => setGenericName(e.target.value)}
                    placeholder="Amoxicillin Trihydrate"
                    className="w-full px-3 py-1.5 border border-gray-300 rounded-lg text-xs"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Brand Formulation</label>
                  <input
                    type="text"
                    required
                    value={brandName}
                    onChange={(e) => setBrandName(e.target.value)}
                    placeholder="e.g. Amoxil / Panadol"
                    className="w-full px-3 py-1.5 border border-gray-300 rounded-lg text-xs"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Drug Category</label>
                  <input
                    type="text"
                    required
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    placeholder="e.g. Antibiotic, Antacid, Analgesic"
                    className="w-full px-3 py-1.5 border border-gray-300 rounded-lg text-xs"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Dosage Form</label>
                  <select
                    value={dosageForm}
                    onChange={(e) => setDosageForm(e.target.value)}
                    className="w-full px-3 py-1.5 border border-gray-300 rounded-lg text-xs font-semibold"
                  >
                    <option value="Tablet">Tablet</option>
                    <option value="Capsule">Capsule</option>
                    <option value="Syrup">Syrup</option>
                    <option value="Injection">Injection</option>
                    <option value="Ointment">Ointment</option>
                    <option value="Inhaler">Inhaler</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Strength</label>
                  <input
                    type="text"
                    required
                    value={strength}
                    onChange={(e) => setStrength(e.target.value)}
                    placeholder="500mg, 10mg/ml"
                    className="w-full px-3 py-1.5 border border-gray-300 rounded-lg text-xs"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Manufacturer</label>
                  <input
                    type="text"
                    required
                    value={manufacturer}
                    onChange={(e) => setManufacturer(e.target.value)}
                    placeholder="GSK / Novartis"
                    className="w-full px-3 py-1.5 border border-gray-300 rounded-lg text-xs"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Clinical Usage Description</label>
                <textarea
                  rows={2}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Primary clinical indications and dosage guidelines..."
                  className="w-full px-3 py-1.5 border border-gray-300 rounded-lg text-xs"
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
                  Save Master Entry
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
