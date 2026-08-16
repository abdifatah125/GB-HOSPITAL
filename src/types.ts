/**
 * Garasbaley Hospital (GB Hospital) Management System
 * Type definitions across all 11 core modules
 */

export type UserRole =
  | 'Admin'
  | 'Doctor'
  | 'Receptionist'
  | 'Pharmacist'
  | 'Lab Technician'
  | 'Midwife'
  | 'Patient';

export interface User {
  id: string;
  username: string;
  email: string;
  role: UserRole;
  name: string;
  departmentId?: string;
  phone?: string;
  createdAt: string;
  isActive?: boolean;
  status?: 'Active' | 'Disabled';
}

export interface Department {
  id: string;
  name: string;
  description: string;
  headDoctorId?: string;
  headDoctorName?: string;
  headDoctorPhoto?: string;
  headDoctorSpecialty?: string;
  headDoctorQualification?: string;
  extension: string;
  location: string; // e.g., "Floor 2, West Wing"
  ward?: string;
}

export type StaffRoleType =
  // Medical & Surgical Specialists
  | 'Doctor'
  | 'Consultant Specialist'
  | 'Surgeon'
  | 'Obstetrician & Gynecologist'
  | 'Pediatrician'
  | 'Cardiologist'
  | 'Anesthesiologist'
  | 'Radiologist'
  | 'Dermatologist'
  | 'Ophthalmologist'
  | 'ENT Specialist'
  | 'Dentist / Dental Surgeon'
  | 'Psychiatrist'
  // Nursing & Midwifery
  | 'Head Nurse'
  | 'Registered Nurse'
  | 'ICU & Critical Care Nurse'
  | 'Emergency & Triage Nurse'
  | 'Midwife'
  | 'Senior Midwife'
  | 'Surgical / Scrub Nurse'
  // Laboratory & Diagnostics
  | 'Chief Lab Scientist'
  | 'Lab Technician'
  | 'Medical Pathologist'
  | 'Phlebotomist'
  | 'Sonographer / Ultrasound Tech'
  | 'X-Ray & CT Technologist'
  // Pharmacy
  | 'Chief Pharmacist'
  | 'Clinical Pharmacist'
  | 'Pharmacy Technician'
  // Emergency & Allied
  | 'Emergency / Paramedic'
  | 'Physiotherapist'
  | 'Clinical Nutritionist'
  // Administrative & Support
  | 'Hospital Administrator'
  | 'Receptionist'
  | 'Cashier / Billing Officer'
  | 'Medical Records Officer'
  | 'Infection Control Officer'
  | 'Biomedical Engineer'
  | 'Nurse'
  | 'Staff';

export interface DoctorStaff {
  id: string;
  userId?: string;
  name: string;
  role: StaffRoleType | string;
  roleCategory?:
    | 'Medical & Specialists'
    | 'Nursing & Midwifery'
    | 'Diagnostics & Lab'
    | 'Pharmacy'
    | 'Emergency & Allied'
    | 'Administration & Support';
  designation?: string; // e.g. 'Senior Consultant', 'Head of Department', 'Registered Practitioner'
  qualification?: string; // e.g. 'MD, FACC', 'B.Sc. Nursing', 'PharmD', 'MLS'
  licenseNumber?: string; // e.g. 'SOM-MD-2024-102'
  shiftType?: 'Morning Shift (08:00 - 14:00)' | 'Evening Shift (14:00 - 20:00)' | 'Night Shift (20:00 - 08:00)' | '24/7 Rotational / Emergency' | 'On-Call / Appointment Based';
  specialization: string;
  departmentId: string;
  departmentName: string;
  contact: string;
  email: string;
  availableDays: string[]; // e.g., ['Mon', 'Wed', 'Fri']
  availableHours: string; // e.g., '08:00 - 14:00'
  consultationFee: number;
  photoUrl?: string;
}

export interface Patient {
  id: string;
  name: string;
  age: number;
  gender: 'Male' | 'Female' | 'Other';
  contact: string;
  email?: string;
  address: string;
  bloodGroup: 'A+' | 'A-' | 'B+' | 'B-' | 'O+' | 'O-' | 'AB+' | 'AB-';
  medicalHistory: string;
  allergies: string;
  emergencyContact: string;
  createdAt: string;
}

export type AppointmentStatus = 'Pending' | 'Confirmed' | 'Completed' | 'Cancelled';

export interface Appointment {
  id: string;
  patientId: string;
  patientName: string;
  doctorId: string;
  doctorName: string;
  departmentId: string;
  departmentName: string;
  date: string; // YYYY-MM-DD
  timeSlot: string; // e.g., "09:00 AM"
  status: AppointmentStatus;
  notes?: string;
  fee: number;
  createdAt: string;
  transferredFromDoctorId?: string;
  transferredFromDoctorName?: string;
  transferredReason?: string;
  transferredAt?: string;
}

export interface Medicine {
  id: string;
  name: string;
  genericName: string;
  brandName: string;
  category: string; // e.g., Antibiotic, Painkiller, Antacid, Antihypertensive
  dosageForm: string; // Tablet, Syrup, Injection, Ointment, Capsule
  strength: string; // e.g. 500mg, 10mg/ml
  manufacturer: string;
  description: string;
}

export interface PharmacyItem {
  id: string;
  medicineId: string;
  medicineName: string;
  brandName: string;
  genericName: string;
  batchNumber: string;
  stockQuantity: number;
  unitPrice: number;
  expiryDate: string; // YYYY-MM-DD
  supplier: string;
  reorderThreshold: number;
}

export type LabTestStatus = 'Requested' | 'In Progress' | 'Completed' | 'Rejected';

export interface LabTestRequest {
  id: string;
  patientId: string;
  patientName: string;
  doctorId: string;
  doctorName: string;
  testName: string; // e.g. "Full Blood Count (FBC)", "Lipid Profile", "Chest X-Ray", "Urinalysis"
  category: string;
  status: LabTestStatus;
  priority?: 'Routine' | 'Urgent / STAT';
  clinicalNotes?: string;
  sampleType?: string;
  specimenBarcode?: string;
  requestDate: string;
  sampleCollectedDate?: string;
  resultDate?: string;
  results?: string;
  referenceRange?: string;
  technicianNotes?: string;
  technicianName?: string;
  rejectionReason?: string;
}

export interface MaternityRecord {
  id: string;
  patientId: string;
  patientName: string;
  patientAge: number;
  lmpDate: string; // Last Menstrual Period YYYY-MM-DD
  eddDate: string; // Estimated Due Date YYYY-MM-DD
  gravida: number; // Number of pregnancies
  para: number; // Number of births
  riskLevel: 'Normal' | 'High-risk';
  notes?: string;
  registeredAt: string;
}

export interface AntenatalVisit {
  id: string;
  maternityRecordId: string;
  patientId: string;
  visitDate: string;
  gestationalAgeWeeks: number;
  weightKg: number;
  bloodPressure: string; // e.g. "120/80"
  fetalHeartbeat: string; // e.g. "145 bpm" or "Normal"
  midwifeNotes: string;
}

export interface DeliveryRecord {
  id: string;
  maternityRecordId: string;
  patientId: string;
  patientName: string;
  deliveryDate: string;
  deliveryType: 'Normal' | 'C-section' | 'Assisted';
  outcome: 'Live birth' | 'Stillbirth';
  babyWeightKg: number;
  babyGender: 'Male' | 'Female';
  complications?: string;
  midwifeDoctorName: string;
}

export interface PostnatalVisit {
  id: string;
  maternityRecordId: string;
  patientId: string;
  visitDate: string;
  motherCondition: string;
  babyCondition: string;
  notes: string;
}

export interface InvoiceItem {
  id: string;
  description: string;
  category: 'Consultation' | 'Lab' | 'Pharmacy' | 'Maternity' | 'Other';
  quantity: number;
  unitPrice: number;
  amount: number;
}

export type InvoiceStatus = 'Paid' | 'Unpaid' | 'Partial';

export interface Invoice {
  id: string;
  invoiceNumber: string;
  patientId: string;
  patientName: string;
  patientContact?: string;
  date: string;
  dueDate: string;
  items: InvoiceItem[];
  totalAmount: number;
  paidAmount: number;
  status: InvoiceStatus;
  notes?: string;
}

export type PrescriptionStatus = 'Pending' | 'Dispensed' | 'Partially Dispensed' | 'Cancelled';
export type PrescriptionPriority = 'Routine' | 'Urgent' | 'STAT / Emergency';

export interface PrescriptionItem {
  id?: string;
  medicineId?: string;
  medicineName: string;
  genericName?: string;
  dosage: string; // e.g., "500mg" or "1 tablet"
  dosageForm?: string; // Tablet, Syrup, Capsule, Injection
  frequency: string; // e.g., "TDS (3 times daily)", "BD (Twice daily)", "OD (Once daily)"
  duration: string; // e.g., "5 days", "7 days", "1 month"
  quantity: number; // e.g., 15
  instructions: string; // e.g., "Take with food after meals"
  dispensed?: boolean;
  dispensedQuantity?: number;
  unitPrice?: number;
}

export interface Prescription {
  id: string;
  prescriptionNumber: string; // e.g., "RX-2026-001"
  patientId: string;
  patientName: string;
  patientAge?: number;
  patientGender?: 'Male' | 'Female' | 'Other';
  patientContact?: string;
  doctorId: string;
  doctorName: string;
  departmentId?: string;
  departmentName?: string;
  diagnosis: string;
  clinicalNotes?: string;
  allergies?: string;
  priority: PrescriptionPriority;
  status: PrescriptionStatus;
  items: PrescriptionItem[];
  createdAt: string;
  dispensedAt?: string;
  dispensedByPharmacistId?: string;
  dispensedByPharmacistName?: string;
  pharmacistNotes?: string;
  totalCost?: number;
  invoiceId?: string;
}
