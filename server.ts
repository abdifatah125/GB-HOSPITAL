import express from 'express';
import path from 'path';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { createServer as createViteServer } from 'vite';
import {
  INITIAL_USERS,
  INITIAL_DEPARTMENTS,
  INITIAL_DOCTORS,
  INITIAL_PATIENTS,
  INITIAL_APPOINTMENTS,
  INITIAL_MEDICINES,
  INITIAL_PHARMACY_STOCK,
  INITIAL_LAB_TESTS,
  INITIAL_MATERNITY_RECORDS,
  INITIAL_ANC_VISITS,
  INITIAL_DELIVERIES,
  INITIAL_POSTNATAL_VISITS,
  INITIAL_INVOICES,
} from './src/data/seedData';
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
} from './src/types';

const JWT_SECRET = process.env.JWT_SECRET || 'gb_hospital_secret_key_2026';
const PORT = 3000;

// In-Memory persistent data store (seeded)
let users: User[] = [...INITIAL_USERS];
let departments: Department[] = [...INITIAL_DEPARTMENTS];
let doctors: DoctorStaff[] = [...INITIAL_DOCTORS];
let patients: Patient[] = [...INITIAL_PATIENTS];
let appointments: Appointment[] = [...INITIAL_APPOINTMENTS];
let medicines: Medicine[] = [...INITIAL_MEDICINES];
let pharmacyStock: PharmacyItem[] = [...INITIAL_PHARMACY_STOCK];
let labTests: LabTestRequest[] = [...INITIAL_LAB_TESTS];
let maternityRecords: MaternityRecord[] = [...INITIAL_MATERNITY_RECORDS];
let ancVisits: AntenatalVisit[] = [...INITIAL_ANC_VISITS];
let deliveryRecords: DeliveryRecord[] = [...INITIAL_DELIVERIES];
let postnatalVisits: PostnatalVisit[] = [...INITIAL_POSTNATAL_VISITS];
let invoices: Invoice[] = [...INITIAL_INVOICES];

async function startServer() {
  const app = express();
  app.use(express.json());

  // Middleware to authenticate JWT
  const authenticateToken = (req: any, res: any, next: any) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) return res.status(401).json({ error: 'Access token required' });

    jwt.verify(token, JWT_SECRET, (err: any, user: any) => {
      if (err) return res.status(403).json({ error: 'Invalid or expired token' });
      req.user = user;
      next();
    });
  };

  // --- AUTH ROUTES ---
  app.post('/api/auth/login', async (req, res) => {
    const { usernameOrEmail, password } = req.body;
    if (!usernameOrEmail) {
      return res.status(400).json({ error: 'Username or email is required' });
    }

    const target = usernameOrEmail.toLowerCase().trim();
    const user = users.find(
      (u) => u.username.toLowerCase() === target || u.email.toLowerCase() === target
    );

    if (!user) {
      return res.status(401).json({ error: 'User not found with provided credentials' });
    }

    // For demo ease, any password or 'password' works for seeded demo users
    const token = jwt.sign(
      { id: user.id, username: user.username, role: user.role, name: user.name },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.json({ token, user });
  });

  app.post('/api/auth/register', async (req, res) => {
    const { username, email, password, role, name, phone, departmentId } = req.body;

    if (!username || !email || !role || !name) {
      return res.status(400).json({ error: 'Missing required registration fields' });
    }

    const existing = users.find(
      (u) => u.username.toLowerCase() === username.toLowerCase() || u.email.toLowerCase() === email.toLowerCase()
    );

    if (existing) {
      return res.status(400).json({ error: 'Username or email already registered' });
    }

    const newUser: User = {
      id: `usr-${Date.now()}`,
      username,
      email,
      role: role || 'Patient',
      name,
      phone,
      departmentId,
      createdAt: new Date().toISOString().split('T')[0],
    };

    users.push(newUser);

    // Also auto-create patient profile if registering as Patient
    if (newUser.role === 'Patient') {
      patients.push({
        id: `pat-${Date.now()}`,
        name: newUser.name,
        age: 30,
        gender: 'Female',
        contact: newUser.phone || '+252 61 0000000',
        email: newUser.email,
        address: 'Garasbaley, Mogadishu',
        bloodGroup: 'O+',
        medicalHistory: 'Newly registered patient.',
        allergies: 'None reported',
        emergencyContact: 'Family Contact (+252 61 0000000)',
        createdAt: newUser.createdAt,
      });
    }

    const token = jwt.sign(
      { id: newUser.id, username: newUser.username, role: newUser.role, name: newUser.name },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.json({ token, user: newUser });
  });

  app.get('/api/auth/me', authenticateToken, (req: any, res) => {
    const user = users.find((u) => u.id === req.user.id);
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json({ user });
  });

  // --- DEPARTMENTS ---
  app.get('/api/departments', (req, res) => {
    res.json(departments);
  });

  app.post('/api/departments', (req, res) => {
    const dept: Department = { id: `dept-${Date.now()}`, ...req.body };
    departments.push(dept);
    res.status(201).json(dept);
  });

  app.put('/api/departments/:id', (req, res) => {
    const index = departments.findIndex((d) => d.id === req.params.id);
    if (index === -1) return res.status(404).json({ error: 'Department not found' });
    departments[index] = { ...departments[index], ...req.body };
    res.json(departments[index]);
  });

  app.delete('/api/departments/:id', (req, res) => {
    departments = departments.filter((d) => d.id !== req.params.id);
    res.json({ success: true });
  });

  // --- DOCTORS & STAFF ---
  app.get('/api/doctors', (req, res) => {
    res.json(doctors);
  });

  app.post('/api/doctors', (req, res) => {
    const doc: DoctorStaff = { id: `doc-${Date.now()}`, ...req.body };
    doctors.push(doc);
    res.status(201).json(doc);
  });

  app.put('/api/doctors/:id', (req, res) => {
    const index = doctors.findIndex((d) => d.id === req.params.id);
    if (index === -1) return res.status(404).json({ error: 'Doctor not found' });
    doctors[index] = { ...doctors[index], ...req.body };
    res.json(doctors[index]);
  });

  app.delete('/api/doctors/:id', (req, res) => {
    doctors = doctors.filter((d) => d.id !== req.params.id);
    res.json({ success: true });
  });

  // --- PATIENTS ---
  app.get('/api/patients', (req, res) => {
    res.json(patients);
  });

  app.post('/api/patients', (req, res) => {
    const pat: Patient = {
      id: `pat-${Date.now()}`,
      createdAt: new Date().toISOString().split('T')[0],
      ...req.body,
    };
    patients.push(pat);
    res.status(201).json(pat);
  });

  app.put('/api/patients/:id', (req, res) => {
    const index = patients.findIndex((p) => p.id === req.params.id);
    if (index === -1) return res.status(404).json({ error: 'Patient not found' });
    patients[index] = { ...patients[index], ...req.body };
    res.json(patients[index]);
  });

  app.delete('/api/patients/:id', (req, res) => {
    patients = patients.filter((p) => p.id !== req.params.id);
    res.json({ success: true });
  });

  // --- APPOINTMENTS ---
  app.get('/api/appointments', (req, res) => {
    res.json(appointments);
  });

  app.post('/api/appointments', (req, res) => {
    const { doctorId, date, timeSlot } = req.body;

    // Check double-booking slot conflict
    const conflict = appointments.find(
      (a) =>
        a.doctorId === doctorId &&
        a.date === date &&
        a.timeSlot === timeSlot &&
        a.status !== 'Cancelled'
    );

    if (conflict) {
      return res.status(400).json({
        error: `Dr. ${conflict.doctorName} is already booked for ${timeSlot} on ${date}. Please select another time slot.`,
      });
    }

    const newApt: Appointment = {
      id: `apt-${Date.now()}`,
      status: 'Confirmed',
      createdAt: new Date().toISOString().split('T')[0],
      ...req.body,
    };
    appointments.push(newApt);
    res.status(201).json(newApt);
  });

  app.put('/api/appointments/:id', (req, res) => {
    const index = appointments.findIndex((a) => a.id === req.params.id);
    if (index === -1) return res.status(404).json({ error: 'Appointment not found' });
    appointments[index] = { ...appointments[index], ...req.body };
    res.json(appointments[index]);
  });

  app.post('/api/appointments/:id/transfer', (req, res) => {
    const index = appointments.findIndex((a) => a.id === req.params.id);
    if (index === -1) return res.status(404).json({ error: 'Appointment not found' });

    const current = appointments[index];
    const {
      targetDoctorId,
      targetDoctorName,
      targetDepartmentId,
      targetDepartmentName,
      reason,
      transferredByDoctorName,
      transferredByDoctorId,
      newDate,
      newTimeSlot,
      notes,
    } = req.body;

    const targetDoc = doctors.find((d) => d.id === targetDoctorId);
    const updatedFee = targetDoc ? targetDoc.consultationFee : current.fee;
    const originDoctorName = transferredByDoctorName || current.doctorName;
    const transferNote = `[Transferred from ${originDoctorName} to ${targetDoctorName} on ${new Date().toISOString().split('T')[0]}: ${reason}]`;
    const combinedNotes = notes
      ? `${notes} | ${transferNote}`
      : current.notes
      ? `${current.notes} | ${transferNote}`
      : transferNote;

    appointments[index] = {
      ...current,
      doctorId: targetDoctorId,
      doctorName: targetDoctorName,
      departmentId: targetDepartmentId || (targetDoc ? targetDoc.departmentId : current.departmentId),
      departmentName: targetDepartmentName || (targetDoc ? targetDoc.departmentName : current.departmentName),
      date: newDate || current.date,
      timeSlot: newTimeSlot || current.timeSlot,
      fee: updatedFee,
      notes: combinedNotes,
      transferredFromDoctorId: transferredByDoctorId || current.doctorId,
      transferredFromDoctorName: originDoctorName,
      transferredReason: reason,
      transferredAt: new Date().toISOString(),
    };

    res.json(appointments[index]);
  });

  // --- MEDICINE LIBRARY ---
  app.get('/api/medicines', (req, res) => {
    res.json(medicines);
  });

  app.post('/api/medicines', (req, res) => {
    const med: Medicine = { id: `med-${Date.now()}`, ...req.body };
    medicines.push(med);
    res.status(201).json(med);
  });

  // --- PHARMACY & INVENTORY ---
  app.get('/api/pharmacy', (req, res) => {
    res.json(pharmacyStock);
  });

  app.post('/api/pharmacy', (req, res) => {
    const item: PharmacyItem = { id: `stock-${Date.now()}`, ...req.body };
    pharmacyStock.push(item);
    res.status(201).json(item);
  });

  app.put('/api/pharmacy/:id', (req, res) => {
    const index = pharmacyStock.findIndex((p) => p.id === req.params.id);
    if (index === -1) return res.status(404).json({ error: 'Stock item not found' });
    pharmacyStock[index] = { ...pharmacyStock[index], ...req.body };
    res.json(pharmacyStock[index]);
  });

  // Deduct stock upon prescription fulfillment
  app.post('/api/pharmacy/deduct', (req, res) => {
    const { stockId, quantity } = req.body;
    const item = pharmacyStock.find((p) => p.id === stockId);

    if (!item) return res.status(404).json({ error: 'Stock item not found' });
    if (item.stockQuantity < quantity) {
      return res.status(400).json({ error: `Insufficient stock. Current stock is ${item.stockQuantity}.` });
    }

    item.stockQuantity -= quantity;
    res.json(item);
  });

  // --- LAB TESTS ---
  app.get('/api/lab-tests', (req, res) => {
    res.json(labTests);
  });

  app.post('/api/lab-tests', (req, res) => {
    const reqTest: LabTestRequest = {
      id: `lab-${Date.now()}`,
      status: 'Requested',
      requestDate: new Date().toISOString().split('T')[0],
      ...req.body,
    };
    labTests.push(reqTest);
    res.status(201).json(reqTest);
  });

  app.put('/api/lab-tests/:id', (req, res) => {
    const index = labTests.findIndex((l) => l.id === req.params.id);
    if (index === -1) return res.status(404).json({ error: 'Lab test request not found' });
    labTests[index] = { ...labTests[index], ...req.body };
    res.json(labTests[index]);
  });

  // --- MATERNITY & MIDWIFERY ---
  app.get('/api/maternity', (req, res) => {
    res.json({
      records: maternityRecords,
      ancVisits,
      deliveryRecords,
      postnatalVisits,
    });
  });

  app.post('/api/maternity/register', (req, res) => {
    const { patientId, patientName, patientAge, lmpDate, gravida, para, riskLevel, notes } = req.body;

    // Auto-calculate EDD (LMP + 280 days)
    const lmp = new Date(lmpDate);
    const edd = new Date(lmp.getTime() + 280 * 24 * 60 * 60 * 1000);
    const eddDate = edd.toISOString().split('T')[0];

    const record: MaternityRecord = {
      id: `mat-${Date.now()}`,
      patientId,
      patientName,
      patientAge: Number(patientAge) || 25,
      lmpDate,
      eddDate,
      gravida: Number(gravida) || 1,
      para: Number(para) || 0,
      riskLevel: riskLevel || 'Normal',
      notes,
      registeredAt: new Date().toISOString().split('T')[0],
    };

    maternityRecords.push(record);
    res.status(201).json(record);
  });

  app.post('/api/maternity/anc-visit', (req, res) => {
    const visit: AntenatalVisit = {
      id: `anc-${Date.now()}`,
      ...req.body,
    };
    ancVisits.push(visit);
    res.status(201).json(visit);
  });

  app.post('/api/maternity/delivery', (req, res) => {
    const delivery: DeliveryRecord = {
      id: `del-${Date.now()}`,
      ...req.body,
    };
    deliveryRecords.push(delivery);
    res.status(201).json(delivery);
  });

  app.post('/api/maternity/postnatal', (req, res) => {
    const pnc: PostnatalVisit = {
      id: `pnc-${Date.now()}`,
      ...req.body,
    };
    postnatalVisits.push(pnc);
    res.status(201).json(pnc);
  });

  // --- BILLING & INVOICES ---
  app.get('/api/invoices', (req, res) => {
    res.json(invoices);
  });

  app.post('/api/invoices', (req, res) => {
    const { items, patientId, patientName, patientContact, notes, dueDate } = req.body;

    const totalAmount = items.reduce((sum: number, item: any) => sum + (item.amount || 0), 0);
    const inv: Invoice = {
      id: `inv-${Date.now()}`,
      invoiceNumber: `GB-INV-2026-${Math.floor(100 + Math.random() * 900)}`,
      patientId,
      patientName,
      patientContact,
      date: new Date().toISOString().split('T')[0],
      dueDate: dueDate || new Date(Date.now() + 14 * 86400000).toISOString().split('T')[0],
      items,
      totalAmount,
      paidAmount: 0,
      status: 'Unpaid',
      notes,
    };

    invoices.push(inv);
    res.status(201).json(inv);
  });

  app.put('/api/invoices/:id', (req, res) => {
    const index = invoices.findIndex((i) => i.id === req.params.id);
    if (index === -1) return res.status(404).json({ error: 'Invoice not found' });
    invoices[index] = { ...invoices[index], ...req.body };
    res.json(invoices[index]);
  });

  // --- ADMIN STATS & ANALYTICS ---
  app.get('/api/stats', (req, res) => {
    const totalPatients = patients.length;
    const totalDoctors = doctors.length;
    const totalDepartments = departments.length;

    const todayStr = new Date().toISOString().split('T')[0];
    const todayAppointments = appointments.filter((a) => a.date === todayStr).length;

    const totalRevenue = invoices.reduce((sum, inv) => sum + inv.paidAmount, 0);

    const lowStockAlerts = pharmacyStock.filter((p) => p.stockQuantity <= p.reorderThreshold);
    const todayDateObj = new Date();
    const expiryAlerts = pharmacyStock.filter((p) => {
      const exp = new Date(p.expiryDate);
      const diffDays = (exp.getTime() - todayDateObj.getTime()) / (1000 * 3600 * 24);
      return diffDays <= 60;
    });

    res.json({
      totalPatients,
      totalDoctors,
      totalDepartments,
      todayAppointments,
      totalRevenue,
      lowStockCount: lowStockAlerts.length,
      lowStockItems: lowStockAlerts,
      expiryCount: expiryAlerts.length,
      expiryItems: expiryAlerts,
      appointmentsPerWeek: [
        { day: 'Mon', count: 12 },
        { day: 'Tue', count: 18 },
        { day: 'Wed', count: 15 },
        { day: 'Thu', count: 22 },
        { day: 'Fri', count: 14 },
        { day: 'Sat', count: 25 },
        { day: 'Sun', count: 9 },
      ],
      revenuePerMonth: [
        { month: 'Mar', revenue: 4200 },
        { month: 'Apr', revenue: 5800 },
        { month: 'May', revenue: 6400 },
        { month: 'Jun', revenue: 7100 },
        { month: 'Jul', revenue: 8300 },
        { month: 'Aug', revenue: 9500 },
      ],
    });
  });

  // Vite middleware in dev / static serve in prod
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Garasbaley Hospital (GB Hospital) server running on http://localhost:${PORT}`);
  });
}

startServer();
