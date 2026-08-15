import React, { useState, useEffect } from 'react';
import { DoctorStaff, Department, StaffRoleType } from '../types';
import { api } from '../services/api';
import {
  UserCheck,
  Plus,
  Edit2,
  Trash2,
  Calendar,
  Clock,
  Mail,
  Phone,
  Search,
  CheckCircle2,
  Stethoscope,
  Award,
  ShieldCheck,
  Briefcase,
  Layers,
  Sparkles,
  Building2,
  X,
  BadgePercent,
  Check,
} from 'lucide-react';

interface HospitalRoleDefinition {
  value: StaffRoleType;
  label: string;
  category:
    | 'Medical & Specialists'
    | 'Nursing & Midwifery'
    | 'Diagnostics & Lab'
    | 'Pharmacy'
    | 'Emergency & Allied'
    | 'Administration & Support';
  defaultFee: number;
  defaultQualification: string;
  defaultShift: 'Morning Shift (08:00 - 14:00)' | 'Evening Shift (14:00 - 20:00)' | 'Night Shift (20:00 - 08:00)' | '24/7 Rotational / Emergency' | 'On-Call / Appointment Based';
  suggestedSpecializations: string[];
}

const HOSPITAL_ROLES: HospitalRoleDefinition[] = [
  // 🩺 Medical & Clinical Specialists
  {
    value: 'Doctor',
    label: 'Doctor / General Practitioner (GP)',
    category: 'Medical & Specialists',
    defaultFee: 25,
    defaultQualification: 'MBBS, General Medicine',
    defaultShift: 'Morning Shift (08:00 - 14:00)',
    suggestedSpecializations: ['General Medicine', 'Family Practice', 'Outpatient Consultation', 'Preventive Health'],
  },
  {
    value: 'Consultant Specialist',
    label: 'Consultant Physician / Specialist',
    category: 'Medical & Specialists',
    defaultFee: 45,
    defaultQualification: 'MD, MRCP, Board Certified',
    defaultShift: 'Morning Shift (08:00 - 14:00)',
    suggestedSpecializations: ['Internal Medicine', 'Neurology', 'Gastroenterology', 'Nephrology', 'Pulmonology', 'Endocrinology', 'Infectious Diseases'],
  },
  {
    value: 'Surgeon',
    label: 'Surgeon (General, Orthopedic, Trauma)',
    category: 'Medical & Specialists',
    defaultFee: 50,
    defaultQualification: 'MBBS, MS, FRCS (Surgery)',
    defaultShift: 'Morning Shift (08:00 - 14:00)',
    suggestedSpecializations: ['General Surgery', 'Orthopedic Surgery', 'Trauma & Emergency Surgery', 'Laparoscopic Surgery', 'Neurosurgery', 'Urology'],
  },
  {
    value: 'Obstetrician & Gynecologist',
    label: 'Obstetrician & Gynecologist (OB/GYN)',
    category: 'Medical & Specialists',
    defaultFee: 35,
    defaultQualification: 'MD, MRCOG (Maternal Health)',
    defaultShift: 'Morning Shift (08:00 - 14:00)',
    suggestedSpecializations: ['Maternal-Fetal Care', 'High-Risk Pregnancy', 'Gynecological Surgery', 'Antenatal & Postnatal Care', 'Infertility Care'],
  },
  {
    value: 'Pediatrician',
    label: 'Pediatrician & Child Health Specialist',
    category: 'Medical & Specialists',
    defaultFee: 30,
    defaultQualification: 'MBBS, MD (Pediatrics), DCH',
    defaultShift: 'Morning Shift (08:00 - 14:00)',
    suggestedSpecializations: ['General Pediatrics', 'Neonatology & Preterm Care', 'Pediatric Emergency', 'Child Development & Nutrition'],
  },
  {
    value: 'Cardiologist',
    label: 'Cardiologist & Heart Specialist',
    category: 'Medical & Specialists',
    defaultFee: 40,
    defaultQualification: 'MD, FACC (Interventional Cardiology)',
    defaultShift: 'Morning Shift (08:00 - 14:00)',
    suggestedSpecializations: ['Interventional Cardiology', 'Echocardiography & ECG', 'Hypertension & Heart Failure', 'Cardiac Rehab'],
  },
  {
    value: 'Anesthesiologist',
    label: 'Anesthesiologist & Critical Sedation',
    category: 'Medical & Specialists',
    defaultFee: 35,
    defaultQualification: 'MD, DA (Anesthesiology)',
    defaultShift: 'On-Call / Appointment Based',
    suggestedSpecializations: ['Surgical Anesthesia', 'Obstetric Epidural & Spinal', 'ICU Critical Care Sedation', 'Pain Management'],
  },
  {
    value: 'Dermatologist',
    label: 'Dermatologist & Skin Specialist',
    category: 'Medical & Specialists',
    defaultFee: 30,
    defaultQualification: 'MD (Dermatology & Venereology)',
    defaultShift: 'Morning Shift (08:00 - 14:00)',
    suggestedSpecializations: ['Clinical Dermatology', 'Skin Infections & Allergy', 'Pediatric Dermatology', 'Cosmetic & Laser Procedures'],
  },
  {
    value: 'Ophthalmologist',
    label: 'Ophthalmologist (Eye Specialist)',
    category: 'Medical & Specialists',
    defaultFee: 35,
    defaultQualification: 'MBBS, MS (Ophthalmology)',
    defaultShift: 'Morning Shift (08:00 - 14:00)',
    suggestedSpecializations: ['Cataract & Lens Surgery', 'Glaucoma Management', 'Refraction & Vision Correction', 'Corneal Diseases'],
  },
  {
    value: 'ENT Specialist',
    label: 'ENT Specialist (Otolaryngologist)',
    category: 'Medical & Specialists',
    defaultFee: 30,
    defaultQualification: 'MS (Otolaryngology / Head & Neck)',
    defaultShift: 'Morning Shift (08:00 - 14:00)',
    suggestedSpecializations: ['Ear & Hearing Disorders', 'Sinus & Nasal Surgery', 'Throat & Voice Pathology', 'Pediatric ENT'],
  },
  {
    value: 'Dentist / Dental Surgeon',
    label: 'Dentist & Maxillofacial Surgeon',
    category: 'Medical & Specialists',
    defaultFee: 25,
    defaultQualification: 'BDS, DDS (Dental Surgery)',
    defaultShift: 'Morning Shift (08:00 - 14:00)',
    suggestedSpecializations: ['Restorative Dentistry', 'Dental Extractions & Surgery', 'Root Canal Therapy (Endodontics)', 'Orthodontics'],
  },
  {
    value: 'Psychiatrist',
    label: 'Psychiatrist & Mental Health Lead',
    category: 'Medical & Specialists',
    defaultFee: 35,
    defaultQualification: 'MD (Psychiatry & Behavioral Health)',
    defaultShift: 'Morning Shift (08:00 - 14:00)',
    suggestedSpecializations: ['Clinical Psychiatry', 'Stress & Trauma Management', 'Psychopharmacology', 'Child & Adolescent Mental Health'],
  },

  // 🏥 Nursing & Midwifery
  {
    value: 'Head Nurse',
    label: 'Head Nurse / Nursing Director (Matron)',
    category: 'Nursing & Midwifery',
    defaultFee: 0,
    defaultQualification: 'B.Sc. / M.Sc. Nursing Administration',
    defaultShift: 'Morning Shift (08:00 - 14:00)',
    suggestedSpecializations: ['Ward Administration', 'Clinical Nursing Governance', 'Patient Triage Coordination', 'Staff Nurse Mentorship'],
  },
  {
    value: 'Registered Nurse',
    label: 'Registered Nurse (RN) / Staff Nurse',
    category: 'Nursing & Midwifery',
    defaultFee: 0,
    defaultQualification: 'B.Sc. Nursing / Dip. Nursing',
    defaultShift: '24/7 Rotational / Emergency',
    suggestedSpecializations: ['Inpatient Ward Care', 'IV Cannulation & Medication', 'Post-Op Wound Dressing', 'Vital Signs Monitoring'],
  },
  {
    value: 'ICU & Critical Care Nurse',
    label: 'ICU & Critical Care Nurse',
    category: 'Nursing & Midwifery',
    defaultFee: 0,
    defaultQualification: 'B.Sc. Nursing, ICU Care Certified',
    defaultShift: '24/7 Rotational / Emergency',
    suggestedSpecializations: ['Intensive Care Life Support', 'Ventilator & Cardiac Monitoring', 'Emergency Resuscitation', 'Post-Surgical ICU'],
  },
  {
    value: 'Emergency & Triage Nurse',
    label: 'Emergency & Triage Nurse',
    category: 'Nursing & Midwifery',
    defaultFee: 0,
    defaultQualification: 'B.Sc. Nursing, Trauma Life Support',
    defaultShift: '24/7 Rotational / Emergency',
    suggestedSpecializations: ['Trauma Bay Response', 'Emergency Patient Triage', 'Acute Medical Stabilization', 'Rapid IV Resuscitation'],
  },
  {
    value: 'Midwife',
    label: 'Midwife / Certified Nurse Midwife',
    category: 'Nursing & Midwifery',
    defaultFee: 15,
    defaultQualification: 'B.Sc. Midwifery & Maternal Health',
    defaultShift: '24/7 Rotational / Emergency',
    suggestedSpecializations: ['Normal Labor & Delivery', 'Antenatal Triage Checkups', 'Postnatal Recovery', 'Neonatal Resuscitation'],
  },
  {
    value: 'Senior Midwife',
    label: 'Senior Midwife / Labor Ward Supervisor',
    category: 'Nursing & Midwifery',
    defaultFee: 20,
    defaultQualification: 'B.Sc., Advanced Midwifery Dip.',
    defaultShift: '24/7 Rotational / Emergency',
    suggestedSpecializations: ['Labor Ward Supervision', 'Complex Delivery Support', 'Eclampsia & Postpartum Hemorrhage Management', 'Infant Care'],
  },
  {
    value: 'Surgical / Scrub Nurse',
    label: 'Surgical & Operating Theatre (OT) Nurse',
    category: 'Nursing & Midwifery',
    defaultFee: 0,
    defaultQualification: 'B.Sc. Nursing, Perioperative Care Dip.',
    defaultShift: 'Morning Shift (08:00 - 14:00)',
    suggestedSpecializations: ['Operating Room Sterile Technique', 'Surgical Instrument Assisting', 'Anesthesia Nurse Assisting', 'Recovery Room Care'],
  },

  // 🔬 Laboratory & Diagnostics
  {
    value: 'Chief Lab Scientist',
    label: 'Chief Medical Laboratory Scientist',
    category: 'Diagnostics & Lab',
    defaultFee: 0,
    defaultQualification: 'B.Sc., M.Sc. Clinical Microbiology / Hematology',
    defaultShift: 'Morning Shift (08:00 - 14:00)',
    suggestedSpecializations: ['Clinical Pathology & Hematology', 'Blood Bank & Crossmatch', 'Molecular Diagnostics & PCR', 'Lab Quality Control'],
  },
  {
    value: 'Lab Technician',
    label: 'Medical Laboratory Technician',
    category: 'Diagnostics & Lab',
    defaultFee: 0,
    defaultQualification: 'Dip. / B.Sc. Medical Lab Technology (MLT)',
    defaultShift: 'Morning Shift (08:00 - 14:00)',
    suggestedSpecializations: ['CBC & Blood Chemistry', 'Urinalysis & Parasitology', 'Malaria & Rapid Immunoassays', 'Electrolyte Testing'],
  },
  {
    value: 'Medical Pathologist',
    label: 'Medical Pathologist & Histopathologist',
    category: 'Diagnostics & Lab',
    defaultFee: 30,
    defaultQualification: 'MD (Pathology), FRCPath',
    defaultShift: 'Morning Shift (08:00 - 14:00)',
    suggestedSpecializations: ['Histopathology & Biopsy', 'Cytopathology', 'Infectious Disease Pathology', 'Hematopathology'],
  },
  {
    value: 'Phlebotomist',
    label: 'Phlebotomist / Specimen Collector',
    category: 'Diagnostics & Lab',
    defaultFee: 0,
    defaultQualification: 'Certified Phlebotomy Technician (CPT)',
    defaultShift: 'Morning Shift (08:00 - 14:00)',
    suggestedSpecializations: ['Venipuncture & Blood Drawing', 'Pediatric Blood Sampling', 'Specimen Storage & Transport', 'Capillary Puncture'],
  },
  {
    value: 'Sonographer / Ultrasound Tech',
    label: 'Sonographer & Ultrasound Technologist',
    category: 'Diagnostics & Lab',
    defaultFee: 20,
    defaultQualification: 'B.Sc. Medical Radiography & Ultrasound',
    defaultShift: 'Morning Shift (08:00 - 14:00)',
    suggestedSpecializations: ['Obstetric 3D/4D Ultrasound', 'Abdominal & Pelvic Sonography', 'Vascular Doppler', 'Echocardiography (Echo)'],
  },
  {
    value: 'X-Ray & CT Technologist',
    label: 'Radiographer / X-Ray & CT Technologist',
    category: 'Diagnostics & Lab',
    defaultFee: 15,
    defaultQualification: 'B.Sc. Medical Imaging & Radiologic Tech',
    defaultShift: 'Morning Shift (08:00 - 14:00)',
    suggestedSpecializations: ['Digital Chest & Skeletal X-Ray', 'Computed Tomography (CT Scan)', 'Radiation Protection Protocol', 'Fluoroscopy'],
  },

  // 💊 Pharmacy
  {
    value: 'Chief Pharmacist',
    label: 'Chief Pharmacist / Pharmacy Director',
    category: 'Pharmacy',
    defaultFee: 0,
    defaultQualification: 'B.Pharm, PharmD, Hospital Pharmacy Dip.',
    defaultShift: 'Morning Shift (08:00 - 14:00)',
    suggestedSpecializations: ['Hospital Formulary Management', 'Antibiotic Stewardship', 'Cold-Chain Drug Storage', 'Pharmacy Quality Assurance'],
  },
  {
    value: 'Clinical Pharmacist',
    label: 'Clinical Pharmacist',
    category: 'Pharmacy',
    defaultFee: 0,
    defaultQualification: 'PharmD (Doctor of Pharmacy)',
    defaultShift: 'Morning Shift (08:00 - 14:00)',
    suggestedSpecializations: ['Inpatient Medication Review', 'Drug Interaction Surveillance', 'Patient Dosage Counseling', 'Pharmacotherapy'],
  },
  {
    value: 'Pharmacy Technician',
    label: 'Pharmacy Technician / Dispenser',
    category: 'Pharmacy',
    defaultFee: 0,
    defaultQualification: 'Dip. Pharmacy Technology',
    defaultShift: 'Morning Shift (08:00 - 14:00)',
    suggestedSpecializations: ['Prescription Dispensing', 'Inventory Stock Checking', 'Medication Labeling', 'Expiry Date Auditing'],
  },

  // 🚑 Emergency & Allied Health
  {
    value: 'Emergency / Paramedic',
    label: 'Emergency Medical Technician (EMT) / Paramedic',
    category: 'Emergency & Allied',
    defaultFee: 0,
    defaultQualification: 'EMT-P / Paramedic Diploma, ACLS',
    defaultShift: '24/7 Rotational / Emergency',
    suggestedSpecializations: ['Ambulance Pre-Hospital Transport', 'Cardiopulmonary Resuscitation (CPR)', 'Road Trauma Stabilization', 'Emergency Defibrillation'],
  },
  {
    value: 'Physiotherapist',
    label: 'Physiotherapist & Physical Rehabilitation',
    category: 'Emergency & Allied',
    defaultFee: 25,
    defaultQualification: 'BPT / MPT (Physiotherapy)',
    defaultShift: 'Morning Shift (08:00 - 14:00)',
    suggestedSpecializations: ['Post-Stroke Neuro Rehabilitation', 'Musculoskeletal & Joint Therapy', 'Orthopedic Post-Op Rehab', 'Pediatric Physical Therapy'],
  },
  {
    value: 'Clinical Nutritionist',
    label: 'Clinical Nutritionist & Dietitian',
    category: 'Emergency & Allied',
    defaultFee: 20,
    defaultQualification: 'B.Sc. Clinical Nutrition & Dietetics',
    defaultShift: 'Morning Shift (08:00 - 14:00)',
    suggestedSpecializations: ['Diabetic Dietary Planning', 'Maternal & Infant Malnutrition', 'Inpatient Enteral Feeding', 'Hypertension Dietary Protocol'],
  },

  // 📋 Administrative & Support
  {
    value: 'Hospital Administrator',
    label: 'Hospital Administrator / Medical Director',
    category: 'Administration & Support',
    defaultFee: 0,
    defaultQualification: 'MHA / MBA Healthcare Management',
    defaultShift: 'Morning Shift (08:00 - 14:00)',
    suggestedSpecializations: ['Executive Hospital Operations', 'Clinical Governance & Compliance', 'Human Resource Management', 'Facility & Budget Planning'],
  },
  {
    value: 'Receptionist',
    label: 'Receptionist & Patient Admissions Officer',
    category: 'Administration & Support',
    defaultFee: 0,
    defaultQualification: 'B.A. Public Relations / Healthcare Admin',
    defaultShift: 'Morning Shift (08:00 - 14:00)',
    suggestedSpecializations: ['Patient Registration & Check-in', 'Appointment Scheduling', 'Front Desk Customer Care', 'Emergency Triage Dispatch'],
  },
  {
    value: 'Cashier / Billing Officer',
    label: 'Hospital Cashier & Medical Billing Officer',
    category: 'Administration & Support',
    defaultFee: 0,
    defaultQualification: 'B.Com / B.Sc. Accounting & Finance',
    defaultShift: 'Morning Shift (08:00 - 14:00)',
    suggestedSpecializations: ['Medical Invoicing & Payments', 'EVC Plus / Zaad / Sahal Mobile Money Processing', 'Patient Accounts Reconciliation', 'Insurance Claims Billing'],
  },
  {
    value: 'Medical Records Officer',
    label: 'Medical Records / Health Information (HIM) Officer',
    category: 'Administration & Support',
    defaultFee: 0,
    defaultQualification: 'Dip. Health Information Management',
    defaultShift: 'Morning Shift (08:00 - 14:00)',
    suggestedSpecializations: ['Electronic Medical Records (EMR)', 'Patient Data Privacy & Archiving', 'ICD-10 Diagnostic Coding', 'Hospital Census Reporting'],
  },
  {
    value: 'Infection Control Officer',
    label: 'Infection Control & Hospital Safety Officer',
    category: 'Administration & Support',
    defaultFee: 0,
    defaultQualification: 'B.Sc. Public Health / Infection Prevention',
    defaultShift: 'Morning Shift (08:00 - 14:00)',
    suggestedSpecializations: ['Hospital Sanitation & Sterilization', 'Biohazard & Waste Management', 'Epidemic Disease Surveillance', 'Staff Occupational Health'],
  },
  {
    value: 'Biomedical Engineer',
    label: 'Biomedical Equipment Engineer',
    category: 'Administration & Support',
    defaultFee: 0,
    defaultQualification: 'B.Sc. Biomedical Engineering',
    defaultShift: 'On-Call / Appointment Based',
    suggestedSpecializations: ['ICU Ventilator & Monitor Calibration', 'Operating Theatre Equipment Support', 'Diagnostic Lab Device Maintenance', 'Hospital Oxygen Plant Support'],
  },
];

export const DoctorStaffManagement: React.FC = () => {
  const [doctors, setDoctors] = useState<DoctorStaff[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [search, setSearch] = useState('');
  const [selectedDeptFilter, setSelectedDeptFilter] = useState('');
  const [selectedCategoryTab, setSelectedCategoryTab] = useState<string>('All');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingDoc, setEditingDoc] = useState<DoctorStaff | null>(null);

  // Form fields
  const [name, setName] = useState('');
  const [role, setRole] = useState<StaffRoleType>('Doctor');
  const [roleCategory, setRoleCategory] = useState<string>('Medical & Specialists');
  const [designation, setDesignation] = useState('');
  const [qualification, setQualification] = useState('');
  const [licenseNumber, setLicenseNumber] = useState('');
  const [shiftType, setShiftType] = useState<string>('Morning Shift (08:00 - 14:00)');
  const [specialization, setSpecialization] = useState('');
  const [departmentId, setDepartmentId] = useState('');
  const [contact, setContact] = useState('');
  const [email, setEmail] = useState('');
  const [availableDays, setAvailableDays] = useState<string[]>(['Mon', 'Wed', 'Fri']);
  const [availableHours, setAvailableHours] = useState('08:00 AM - 02:00 PM');
  const [consultationFee, setConsultationFee] = useState<number>(25);
  const [feedback, setFeedback] = useState<string | null>(null);

  const daysOptions = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

  const categoryTabs = [
    { id: 'All', label: 'All Staff' },
    { id: 'Medical & Specialists', label: '🩺 Doctors & Specialists' },
    { id: 'Nursing & Midwifery', label: '🏥 Nursing & Midwifery' },
    { id: 'Diagnostics & Lab', label: '🔬 Diagnostics & Lab' },
    { id: 'Pharmacy', label: '💊 Pharmacy' },
    { id: 'Emergency & Allied', label: '🚑 Emergency & Allied' },
    { id: 'Administration & Support', label: '📋 Admin & Support' },
  ];

  const loadData = async () => {
    try {
      const [docRes, deptRes] = await Promise.all([api.getDoctors(), api.getDepartments()]);
      setDoctors(docRes);
      setDepartments(deptRes);
      if (deptRes.length > 0 && !departmentId) {
        setDepartmentId(deptRes[0].id);
      }
    } catch (err) {
      console.warn('Error loading doctors data:', err);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // When role changes in modal, auto-fill defaults and suggestions
  const handleRoleChange = (newRole: StaffRoleType) => {
    setRole(newRole);
    const def = HOSPITAL_ROLES.find((r) => r.value === newRole);
    if (def) {
      setRoleCategory(def.category);
      setConsultationFee(def.defaultFee);
      if (!editingDoc) {
        setQualification(def.defaultQualification);
        setShiftType(def.defaultShift);
        if (def.suggestedSpecializations.length > 0) {
          setSpecialization(def.suggestedSpecializations[0]);
        }
      }
    }
  };

  const handleOpenModal = (doc?: DoctorStaff) => {
    if (doc) {
      setEditingDoc(doc);
      setName(doc.name);
      setRole(doc.role as StaffRoleType);
      setRoleCategory(doc.roleCategory || 'Medical & Specialists');
      setDesignation(doc.designation || '');
      setQualification(doc.qualification || '');
      setLicenseNumber(doc.licenseNumber || '');
      setShiftType(doc.shiftType || 'Morning Shift (08:00 - 14:00)');
      setSpecialization(doc.specialization);
      setDepartmentId(doc.departmentId);
      setContact(doc.contact);
      setEmail(doc.email);
      setAvailableDays(doc.availableDays);
      setAvailableHours(doc.availableHours);
      setConsultationFee(doc.consultationFee);
    } else {
      const defaultRoleDef = HOSPITAL_ROLES[0];
      setEditingDoc(null);
      setName('');
      setRole('Doctor');
      setRoleCategory('Medical & Specialists');
      setDesignation('Medical Practitioner');
      setQualification(defaultRoleDef.defaultQualification);
      setLicenseNumber(`SOM-GB-${Math.floor(1000 + Math.random() * 9000)}`);
      setShiftType('Morning Shift (08:00 - 14:00)');
      setSpecialization('General Medicine');
      setDepartmentId(departments[0]?.id || '');
      setContact('+252 61 5000000');
      setEmail('staff@garasbaley.so');
      setAvailableDays(['Mon', 'Tue', 'Wed', 'Thu', 'Sat']);
      setAvailableHours('08:00 AM - 02:00 PM');
      setConsultationFee(25);
    }
    setIsModalOpen(true);
  };

  const handleToggleDay = (day: string) => {
    if (availableDays.includes(day)) {
      setAvailableDays(availableDays.filter((d) => d !== day));
    } else {
      setAvailableDays([...availableDays, day]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const deptObj = departments.find((d) => d.id === departmentId);
    const selectedRoleDef = HOSPITAL_ROLES.find((r) => r.value === role);

    const docData: Partial<DoctorStaff> = {
      name,
      role,
      roleCategory: (selectedRoleDef?.category || roleCategory) as any,
      designation: designation || (selectedRoleDef?.label ?? role),
      qualification,
      licenseNumber,
      shiftType: shiftType as any,
      specialization,
      departmentId,
      departmentName: deptObj ? deptObj.name : 'General Care',
      contact,
      email,
      availableDays,
      availableHours,
      consultationFee: Number(consultationFee) || 0,
    };

    try {
      if (editingDoc) {
        await api.updateDoctor(editingDoc.id, docData);
        setFeedback(`Staff record for "${name}" successfully updated.`);
      } else {
        await api.createDoctor(docData);
        setFeedback(`New staff profile "${name}" (${role}) successfully registered.`);
      }
      setIsModalOpen(false);
      loadData();
      setTimeout(() => setFeedback(null), 3500);
    } catch (err: any) {
      alert(err.message || 'Operation failed');
    }
  };

  const handleDelete = async (id: string, docName: string) => {
    if (confirm(`Are you sure you want to delete the record for ${docName}?`)) {
      try {
        await api.deleteDoctor(id);
        setFeedback(`Record for ${docName} has been deleted.`);
        loadData();
        setTimeout(() => setFeedback(null), 3000);
      } catch (err: any) {
        alert(err.message || 'Delete failed');
      }
    }
  };

  const filteredDoctors = doctors.filter((d) => {
    const matchesSearch =
      d.name.toLowerCase().includes(search.toLowerCase()) ||
      d.specialization.toLowerCase().includes(search.toLowerCase()) ||
      d.role.toLowerCase().includes(search.toLowerCase()) ||
      (d.licenseNumber && d.licenseNumber.toLowerCase().includes(search.toLowerCase()));

    const matchesDept = selectedDeptFilter ? d.departmentId === selectedDeptFilter : true;

    const matchesCategory =
      selectedCategoryTab === 'All'
        ? true
        : d.roleCategory === selectedCategoryTab ||
          HOSPITAL_ROLES.find((r) => r.value === d.role)?.category === selectedCategoryTab;

    return matchesSearch && matchesDept && matchesCategory;
  });

  const selectedRoleDef = HOSPITAL_ROLES.find((r) => r.value === role);

  const getRoleBadgeStyle = (category?: string, roleStr?: string) => {
    const cat = category || HOSPITAL_ROLES.find((r) => r.value === roleStr)?.category || '';
    switch (cat) {
      case 'Medical & Specialists':
        return 'bg-emerald-100 text-emerald-900 border-emerald-300';
      case 'Nursing & Midwifery':
        return 'bg-rose-100 text-rose-900 border-rose-300';
      case 'Diagnostics & Lab':
        return 'bg-indigo-100 text-indigo-900 border-indigo-300';
      case 'Pharmacy':
        return 'bg-amber-100 text-amber-900 border-amber-300';
      case 'Emergency & Allied':
        return 'bg-orange-100 text-orange-900 border-orange-300';
      case 'Administration & Support':
        return 'bg-slate-100 text-slate-900 border-slate-300';
      default:
        return 'bg-emerald-100 text-emerald-900 border-emerald-300';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-emerald-100 shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <span className="bg-emerald-100 text-emerald-800 text-[11px] font-extrabold px-2.5 py-0.5 rounded-full uppercase tracking-wider">
              Clinical & Administrative Workforce
            </span>
            <span className="text-xs font-bold text-gray-500">({doctors.length} Registered Personnel)</span>
          </div>
          <h1 className="text-xl font-black text-emerald-950 flex items-center gap-2 mt-1">
            <UserCheck className="w-6 h-6 text-emerald-600" /> Doctors & Medical Staff Directory
          </h1>
          <p className="text-xs text-gray-600 mt-1 max-w-2xl">
            Comprehensive hospital workforce directory including Physicians, Specialists, Surgeons, Nurses, Midwives, Pharmacists, Lab Scientists, and Administrative Officers.
          </p>
        </div>

        <button
          onClick={() => handleOpenModal()}
          className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs px-5 py-3 rounded-xl transition-all shadow-md hover:shadow-lg flex items-center justify-center gap-2 shrink-0 cursor-pointer"
        >
          <Plus className="w-4 h-4" /> Add Doctor / Staff Member
        </button>
      </div>

      {feedback && (
        <div className="p-3.5 bg-emerald-50 text-emerald-900 border border-emerald-200 rounded-xl text-xs font-bold flex items-center gap-2 shadow-xs">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{feedback}</span>
        </div>
      )}

      {/* Category Tabs */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-thin">
        {categoryTabs.map((tab) => {
          const isActive = selectedCategoryTab === tab.id;
          const count =
            tab.id === 'All'
              ? doctors.length
              : doctors.filter(
                  (d) =>
                    d.roleCategory === tab.id ||
                    HOSPITAL_ROLES.find((r) => r.value === d.role)?.category === tab.id
                ).length;

          return (
            <button
              key={tab.id}
              onClick={() => setSelectedCategoryTab(tab.id)}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap flex items-center gap-1.5 cursor-pointer ${
                isActive
                  ? 'bg-emerald-800 text-white shadow-sm ring-2 ring-emerald-600/30'
                  : 'bg-white text-gray-700 hover:bg-emerald-50 border border-gray-200'
              }`}
            >
              <span>{tab.label}</span>
              <span
                className={`text-[10px] px-1.5 py-0.2 rounded-full font-black ${
                  isActive ? 'bg-emerald-600 text-white' : 'bg-gray-100 text-gray-600'
                }`}
              >
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Search & Department Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-3" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name, role (e.g. Surgeon, Midwife), specialization, or license ID..."
            className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl text-xs focus:ring-2 focus:ring-emerald-500 font-medium"
          />
        </div>

        <div className="flex items-center gap-2">
          <Building2 className="w-4 h-4 text-emerald-700 shrink-0" />
          <select
            value={selectedDeptFilter}
            onChange={(e) => setSelectedDeptFilter(e.target.value)}
            className="bg-white border border-gray-200 rounded-xl px-3.5 py-2.5 text-xs font-bold text-gray-700 cursor-pointer"
          >
            <option value="">All Hospital Departments</option>
            {departments.map((d) => (
              <option key={d.id} value={d.id}>
                {d.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Staff Grid */}
      {filteredDoctors.length === 0 ? (
        <div className="bg-white p-12 rounded-2xl border border-dashed border-gray-300 text-center space-y-3">
          <UserCheck className="w-12 h-12 text-gray-300 mx-auto" />
          <h3 className="text-sm font-extrabold text-gray-700">No hospital staff found matching your filter</h3>
          <p className="text-xs text-gray-500 max-w-sm mx-auto">
            Try adjusting your search keywords, department filter, or role category tabs.
          </p>
          <button
            onClick={() => {
              setSearch('');
              setSelectedDeptFilter('');
              setSelectedCategoryTab('All');
            }}
            className="text-xs text-emerald-700 font-bold hover:underline cursor-pointer"
          >
            Reset all filters
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4.5">
          {filteredDoctors.map((doc) => {
            const roleDef = HOSPITAL_ROLES.find((r) => r.value === doc.role);
            const badgeClass = getRoleBadgeStyle(doc.roleCategory, doc.role);

            return (
              <div
                key={doc.id}
                className="bg-white p-5 rounded-2xl border border-emerald-100/80 shadow-xs hover:shadow-md transition-all flex flex-col justify-between space-y-3.5 group"
              >
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h3 className="text-base font-black text-emerald-950 group-hover:text-emerald-700 transition-colors">
                        {doc.name}
                      </h3>
                      <p className="text-xs font-bold text-emerald-700 mt-0.5 flex items-center gap-1">
                        <Stethoscope className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                        <span>{doc.specialization}</span>
                      </p>
                    </div>
                    <span
                      className={`text-[10px] font-black px-2.5 py-1 rounded-lg border uppercase tracking-wider shrink-0 ${badgeClass}`}
                    >
                      {doc.role}
                    </span>
                  </div>

                  {/* Professional Qualifications & License */}
                  {(doc.qualification || doc.licenseNumber) && (
                    <div className="mt-2 flex flex-wrap items-center gap-1.5 text-[11px]">
                      {doc.qualification && (
                        <span className="bg-slate-100 text-slate-700 px-2 py-0.5 rounded font-bold flex items-center gap-1">
                          <Award className="w-3 h-3 text-slate-500" />
                          <span className="truncate max-w-[180px]">{doc.qualification}</span>
                        </span>
                      )}
                      {doc.licenseNumber && (
                        <span className="bg-emerald-50 text-emerald-800 border border-emerald-200 px-1.5 py-0.5 rounded font-mono font-bold text-[10px] flex items-center gap-1">
                          <ShieldCheck className="w-3 h-3 text-emerald-600" />
                          <span>{doc.licenseNumber}</span>
                        </span>
                      )}
                    </div>
                  )}

                  {/* Department & Contact Card */}
                  <div className="mt-3 bg-emerald-50/50 p-3 rounded-xl border border-emerald-100 space-y-1.5 text-xs text-gray-700">
                    <div className="flex items-center gap-2 font-bold text-emerald-950">
                      <Building2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                      <span className="truncate">{doc.departmentName}</span>
                    </div>
                    <div className="flex items-center gap-2 text-gray-600">
                      <Phone className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                      <span className="font-mono text-xs">{doc.contact}</span>
                    </div>
                    <div className="flex items-center gap-2 text-gray-600">
                      <Mail className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                      <span className="truncate text-[11px]">{doc.email}</span>
                    </div>
                  </div>
                </div>

                {/* Duty Schedule & Fee */}
                <div className="space-y-2 text-xs border-t border-gray-100 pt-3">
                  <div className="flex items-center justify-between text-gray-600">
                    <div className="flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                      <span className="font-bold text-[11px]">
                        Days: {doc.availableDays && doc.availableDays.length > 0 ? doc.availableDays.join(', ') : 'Daily'}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-gray-600">
                    <div className="flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                      <span className="text-[11px]">{doc.shiftType || doc.availableHours}</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-1 border-t border-dashed border-gray-100">
                    <span className="text-[11px] font-bold text-gray-500">Consultation Fee:</span>
                    <span className="text-sm font-black text-emerald-700">
                      {doc.consultationFee > 0 ? `$${doc.consultationFee.toFixed(2)}` : 'Hospital Service'}
                    </span>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center justify-end gap-2 pt-2 border-t border-gray-100">
                  <button
                    onClick={() => handleOpenModal(doc)}
                    className="px-3 py-1.5 text-emerald-800 hover:bg-emerald-50 rounded-lg border border-emerald-200 text-xs font-bold flex items-center gap-1 transition-colors cursor-pointer"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                    <span>Edit</span>
                  </button>
                  <button
                    onClick={() => handleDelete(doc.id, doc.name)}
                    className="px-3 py-1.5 text-red-600 hover:bg-red-50 rounded-lg border border-red-200 text-xs font-bold flex items-center gap-1 transition-colors cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Delete</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal Form */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 space-y-5 shadow-2xl border border-emerald-100 my-8">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b pb-3">
              <div>
                <span className="text-[10px] font-black text-emerald-700 uppercase tracking-widest">
                  Hospital Human Resources & Credentialing
                </span>
                <h2 className="text-lg font-black text-emerald-950 flex items-center gap-2">
                  <UserCheck className="w-5 h-5 text-emerald-600" />
                  {editingDoc ? `Edit Profile: ${editingDoc.name}` : 'Add Hospital Doctor or Staff Member'}
                </h2>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 text-gray-400 hover:text-gray-700 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Row 1: Full Name & Primary Hospital Role */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">
                    Full Name & Title <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Dr. Amina Hassan, Sister Maryan Ali"
                    className="w-full px-3 py-2 border border-gray-300 rounded-xl text-xs font-semibold focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">
                    Hospital Role Type <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={role}
                    onChange={(e) => handleRoleChange(e.target.value as StaffRoleType)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-xl text-xs font-bold bg-emerald-50/50 text-emerald-950 focus:ring-2 focus:ring-emerald-500 cursor-pointer"
                  >
                    <optgroup label="🩺 Medical & Clinical Physicians / Specialists">
                      {HOSPITAL_ROLES.filter((r) => r.category === 'Medical & Specialists').map((r) => (
                        <option key={r.value} value={r.value}>
                          {r.label}
                        </option>
                      ))}
                    </optgroup>

                    <optgroup label="🏥 Nursing & Midwifery">
                      {HOSPITAL_ROLES.filter((r) => r.category === 'Nursing & Midwifery').map((r) => (
                        <option key={r.value} value={r.value}>
                          {r.label}
                        </option>
                      ))}
                    </optgroup>

                    <optgroup label="🔬 Laboratory & Diagnostics">
                      {HOSPITAL_ROLES.filter((r) => r.category === 'Diagnostics & Lab').map((r) => (
                        <option key={r.value} value={r.value}>
                          {r.label}
                        </option>
                      ))}
                    </optgroup>

                    <optgroup label="💊 Pharmacy & Therapeutics">
                      {HOSPITAL_ROLES.filter((r) => r.category === 'Pharmacy').map((r) => (
                        <option key={r.value} value={r.value}>
                          {r.label}
                        </option>
                      ))}
                    </optgroup>

                    <optgroup label="🚑 Emergency & Allied Healthcare">
                      {HOSPITAL_ROLES.filter((r) => r.category === 'Emergency & Allied').map((r) => (
                        <option key={r.value} value={r.value}>
                          {r.label}
                        </option>
                      ))}
                    </optgroup>

                    <optgroup label="📋 Administrative & Support Services">
                      {HOSPITAL_ROLES.filter((r) => r.category === 'Administration & Support').map((r) => (
                        <option key={r.value} value={r.value}>
                          {r.label}
                        </option>
                      ))}
                    </optgroup>
                  </select>
                </div>
              </div>

              {/* Specialization & Quick Preset Chips */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-bold text-gray-700">
                    Clinical Specialization / Focus Area <span className="text-red-500">*</span>
                  </label>
                  <span className="text-[10px] text-gray-500">Click a suggestion to autofill</span>
                </div>
                <input
                  type="text"
                  required
                  value={specialization}
                  onChange={(e) => setSpecialization(e.target.value)}
                  placeholder="e.g. Consultant Cardiologist, Maternal & Delivery Care"
                  className="w-full px-3 py-2 border border-gray-300 rounded-xl text-xs font-semibold focus:ring-2 focus:ring-emerald-500"
                />

                {selectedRoleDef && selectedRoleDef.suggestedSpecializations.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {selectedRoleDef.suggestedSpecializations.map((spec) => (
                      <button
                        type="button"
                        key={spec}
                        onClick={() => setSpecialization(spec)}
                        className={`text-[11px] px-2 py-0.5 rounded-lg border font-medium transition-all cursor-pointer ${
                          specialization === spec
                            ? 'bg-emerald-600 text-white border-emerald-600 font-bold'
                            : 'bg-gray-50 text-gray-700 border-gray-200 hover:bg-emerald-50 hover:text-emerald-800'
                        }`}
                      >
                        + {spec}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Row 2: Qualification & Medical License Registration */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">
                    Degrees & Qualifications
                  </label>
                  <input
                    type="text"
                    value={qualification}
                    onChange={(e) => setQualification(e.target.value)}
                    placeholder="e.g. MBBS, MD, B.Sc. Nursing, PharmD"
                    className="w-full px-3 py-2 border border-gray-300 rounded-xl text-xs font-medium focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">
                    License / Medical Council ID
                  </label>
                  <input
                    type="text"
                    value={licenseNumber}
                    onChange={(e) => setLicenseNumber(e.target.value)}
                    placeholder="e.g. SOM-MD-2024-102"
                    className="w-full px-3 py-2 border border-gray-300 rounded-xl text-xs font-mono font-medium focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>

              {/* Row 3: Assigned Department & Shift Schedule */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">
                    Assigned Department <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={departmentId}
                    onChange={(e) => setDepartmentId(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-xl text-xs font-bold text-gray-800 focus:ring-2 focus:ring-emerald-500 cursor-pointer"
                  >
                    {departments.map((d) => (
                      <option key={d.id} value={d.id}>
                        {d.name} {d.ward ? `(${d.ward})` : ''}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">
                    Duty Shift Type
                  </label>
                  <select
                    value={shiftType}
                    onChange={(e) => setShiftType(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-xl text-xs font-bold text-gray-800 focus:ring-2 focus:ring-emerald-500 cursor-pointer"
                  >
                    <option value="Morning Shift (08:00 - 14:00)">Morning Shift (08:00 - 14:00)</option>
                    <option value="Evening Shift (14:00 - 20:00)">Evening Shift (14:00 - 20:00)</option>
                    <option value="Night Shift (20:00 - 08:00)">Night Shift (20:00 - 08:00)</option>
                    <option value="24/7 Rotational / Emergency">24/7 Rotational / Emergency</option>
                    <option value="On-Call / Appointment Based">On-Call / Appointment Based</option>
                  </select>
                </div>
              </div>

              {/* Row 4: Phone & Email */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">
                    Contact Phone Number <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={contact}
                    onChange={(e) => setContact(e.target.value)}
                    placeholder="+252 61 5000000"
                    className="w-full px-3 py-2 border border-gray-300 rounded-xl text-xs font-medium focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">
                    Hospital Email Address <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="doctor@garasbaley.so"
                    className="w-full px-3 py-2 border border-gray-300 rounded-xl text-xs font-medium focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>

              {/* Working Days Selector */}
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1.5">
                  Available Working Days
                </label>
                <div className="flex flex-wrap gap-1.5">
                  {daysOptions.map((day) => {
                    const selected = availableDays.includes(day);
                    return (
                      <button
                        type="button"
                        key={day}
                        onClick={() => handleToggleDay(day)}
                        className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                          selected
                            ? 'bg-emerald-700 text-white shadow-xs'
                            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                        }`}
                      >
                        {day}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Row 5: Working Hours & Consultation Fee */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">
                    Available Consultation Hours
                  </label>
                  <input
                    type="text"
                    required
                    value={availableHours}
                    onChange={(e) => setAvailableHours(e.target.value)}
                    placeholder="08:00 AM - 02:00 PM"
                    className="w-full px-3 py-2 border border-gray-300 rounded-xl text-xs font-medium focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-xs font-bold text-gray-700">
                      Consultation Fee ($ USD)
                    </label>
                    <span className="text-[10px] text-gray-500">(Set 0 for internal staff)</span>
                  </div>
                  <input
                    type="number"
                    required
                    min={0}
                    value={consultationFee}
                    onChange={(e) => setConsultationFee(Number(e.target.value))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-xl text-xs font-black text-emerald-800 focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>

              {/* Modal Buttons */}
              <div className="flex justify-end gap-2 pt-4 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl text-xs font-bold text-gray-600 hover:bg-gray-100 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-md hover:shadow-lg transition-all flex items-center gap-1.5 cursor-pointer"
                >
                  <Check className="w-4 h-4" />
                  <span>{editingDoc ? 'Update Staff Record' : 'Save Staff Profile'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
