import {
  User,
  Department,
  DoctorStaff,
  Patient,
  Appointment,
  Medicine,
  PharmacyItem,
  LabTestRequest,
  MaternityRecord,
  AntenatalVisit,
  DeliveryRecord,
  PostnatalVisit,
  Invoice,
} from '../types';

const TOKEN_KEY = 'gb_hospital_jwt_token';

export function getStoredToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

export function setStoredToken(token: string) {
  localStorage.setItem(TOKEN_KEY, token);
}

export function removeStoredToken() {
  localStorage.removeItem(TOKEN_KEY);
}

async function request<T>(url: string, options: RequestInit = {}): Promise<T> {
  const token = getStoredToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  try {
    const res = await fetch(url, { ...options, headers });
    if (!res.ok) {
      const errBody = await res.json().catch(() => ({}));
      throw new Error(errBody.error || `Request failed with status ${res.status}`);
    }
    return await res.json();
  } catch (err: any) {
    console.warn(`API call to ${url} failed:`, err.message);
    throw err;
  }
}

export const api = {
  // Auth
  login: (usernameOrEmail: string, password?: string) =>
    request<{ token: string; user: User }>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ usernameOrEmail, password }),
    }),

  register: (userData: Partial<User> & { password?: string }) =>
    request<{ token: string; user: User }>('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify(userData),
    }),

  getMe: () => request<{ user: User }>('/api/auth/me'),

  // Departments
  getDepartments: () => request<Department[]>('/api/departments'),
  createDepartment: (dept: Partial<Department>) =>
    request<Department>('/api/departments', { method: 'POST', body: JSON.stringify(dept) }),
  updateDepartment: (id: string, dept: Partial<Department>) =>
    request<Department>(`/api/departments/${id}`, { method: 'PUT', body: JSON.stringify(dept) }),
  deleteDepartment: (id: string) =>
    request<{ success: boolean }>(`/api/departments/${id}`, { method: 'DELETE' }),

  // Doctors
  getDoctors: () => request<DoctorStaff[]>('/api/doctors'),
  createDoctor: (doc: Partial<DoctorStaff>) =>
    request<DoctorStaff>('/api/doctors', { method: 'POST', body: JSON.stringify(doc) }),
  updateDoctor: (id: string, doc: Partial<DoctorStaff>) =>
    request<DoctorStaff>(`/api/doctors/${id}`, { method: 'PUT', body: JSON.stringify(doc) }),
  deleteDoctor: (id: string) =>
    request<{ success: boolean }>(`/api/doctors/${id}`, { method: 'DELETE' }),

  // Patients
  getPatients: () => request<Patient[]>('/api/patients'),
  createPatient: (pat: Partial<Patient>) =>
    request<Patient>('/api/patients', { method: 'POST', body: JSON.stringify(pat) }),
  updatePatient: (id: string, pat: Partial<Patient>) =>
    request<Patient>(`/api/patients/${id}`, { method: 'PUT', body: JSON.stringify(pat) }),
  deletePatient: (id: string) =>
    request<{ success: boolean }>(`/api/patients/${id}`, { method: 'DELETE' }),

  // Appointments
  getAppointments: () => request<Appointment[]>('/api/appointments'),
  createAppointment: (apt: Partial<Appointment>) =>
    request<Appointment>('/api/appointments', { method: 'POST', body: JSON.stringify(apt) }),
  updateAppointment: (id: string, apt: Partial<Appointment>) =>
    request<Appointment>(`/api/appointments/${id}`, { method: 'PUT', body: JSON.stringify(apt) }),
  transferAppointment: (
    id: string,
    transferData: {
      targetDoctorId: string;
      targetDoctorName: string;
      targetDepartmentId?: string;
      targetDepartmentName?: string;
      reason: string;
      transferredByDoctorName?: string;
      transferredByDoctorId?: string;
      newDate?: string;
      newTimeSlot?: string;
      notes?: string;
    }
  ) =>
    request<Appointment>(`/api/appointments/${id}/transfer`, {
      method: 'POST',
      body: JSON.stringify(transferData),
    }),

  // Medicine Library
  getMedicines: () => request<Medicine[]>('/api/medicines'),
  createMedicine: (med: Partial<Medicine>) =>
    request<Medicine>('/api/medicines', { method: 'POST', body: JSON.stringify(med) }),

  // Pharmacy & Inventory
  getPharmacyStock: () => request<PharmacyItem[]>('/api/pharmacy'),
  createPharmacyStock: (item: Partial<PharmacyItem>) =>
    request<PharmacyItem>('/api/pharmacy', { method: 'POST', body: JSON.stringify(item) }),
  updatePharmacyStock: (id: string, item: Partial<PharmacyItem>) =>
    request<PharmacyItem>(`/api/pharmacy/${id}`, { method: 'PUT', body: JSON.stringify(item) }),
  deductStock: (stockId: string, quantity: number) =>
    request<PharmacyItem>('/api/pharmacy/deduct', {
      method: 'POST',
      body: JSON.stringify({ stockId, quantity }),
    }),

  // Lab Tests
  getLabTests: () => request<LabTestRequest[]>('/api/lab-tests'),
  createLabTest: (reqTest: Partial<LabTestRequest>) =>
    request<LabTestRequest>('/api/lab-tests', { method: 'POST', body: JSON.stringify(reqTest) }),
  updateLabTest: (id: string, reqTest: Partial<LabTestRequest>) =>
    request<LabTestRequest>(`/api/lab-tests/${id}`, { method: 'PUT', body: JSON.stringify(reqTest) }),

  // Maternity
  getMaternityData: () =>
    request<{
      records: MaternityRecord[];
      ancVisits: AntenatalVisit[];
      deliveryRecords: DeliveryRecord[];
      postnatalVisits: PostnatalVisit[];
    }>('/api/maternity'),
  registerPregnancy: (record: Partial<MaternityRecord>) =>
    request<MaternityRecord>('/api/maternity/register', {
      method: 'POST',
      body: JSON.stringify(record),
    }),
  addAncVisit: (visit: Partial<AntenatalVisit>) =>
    request<AntenatalVisit>('/api/maternity/anc-visit', {
      method: 'POST',
      body: JSON.stringify(visit),
    }),
  addDeliveryRecord: (delivery: Partial<DeliveryRecord>) =>
    request<DeliveryRecord>('/api/maternity/delivery', {
      method: 'POST',
      body: JSON.stringify(delivery),
    }),
  addPostnatalVisit: (pnc: Partial<PostnatalVisit>) =>
    request<PostnatalVisit>('/api/maternity/postnatal', {
      method: 'POST',
      body: JSON.stringify(pnc),
    }),

  // Billing & Invoices
  getInvoices: () => request<Invoice[]>('/api/invoices'),
  createInvoice: (inv: Partial<Invoice>) =>
    request<Invoice>('/api/invoices', { method: 'POST', body: JSON.stringify(inv) }),
  updateInvoice: (id: string, inv: Partial<Invoice>) =>
    request<Invoice>(`/api/invoices/${id}`, { method: 'PUT', body: JSON.stringify(inv) }),

  // Admin Stats
  getStats: () => request<any>('/api/stats'),
};
