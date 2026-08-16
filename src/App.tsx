import React, { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { HospitalLogo } from './components/HospitalLogo';
import { LoginPage } from './pages/LoginPage';
import { AdminDashboard } from './pages/AdminDashboard';
import { DepartmentManagement } from './pages/DepartmentManagement';
import { PublicDepartmentsPage } from './pages/PublicDepartmentsPage';
import { DoctorStaffManagement } from './pages/DoctorStaffManagement';
import { PublicFindDoctorPage } from './pages/PublicFindDoctorPage';
import { UserRoleManagement } from './pages/UserRoleManagement';
import { PatientManagement } from './pages/PatientManagement';
import { AppointmentScheduling } from './pages/AppointmentScheduling';
import { MedicineLibrary } from './pages/MedicineLibrary';
import { PharmacyInventory } from './pages/PharmacyInventory';
import { PrescriptionManagement } from './pages/PrescriptionManagement';
import { LabManagement } from './pages/LabManagement';
import { PaymentManagement } from './pages/PaymentManagement';
import {
  LayoutDashboard,
  Building2,
  UserCheck,
  Search,
  Users,
  Calendar,
  BookOpen,
  Pill,
  TestTube,
  CreditCard,
  LogOut,
  Clock,
  Menu,
  X,
  Activity,
  ShieldCheck,
  ShieldAlert,
  Stethoscope,
  FileText,
} from 'lucide-react';
import { UserRole } from './types';

const MainApp: React.FC = () => {
  const { user, logout } = useAuth();
  const role: UserRole = user?.role || 'Admin';

  // State for navigating to prescriptions with preselected patient
  const [targetPatientIdForRx, setTargetPatientIdForRx] = useState<string | undefined>(undefined);

  // Navigation Items mapped by role accessibility
  const navItems = [
    { id: 'dashboard', label: 'Executive Dashboard', icon: LayoutDashboard, category: 'Main', roles: ['Admin'] },
    { id: 'user-management', label: 'User & Role Access', icon: ShieldAlert, category: 'Main', roles: ['Admin'] },
    { id: 'departments', label: 'Departments', icon: Building2, category: 'Clinical Operations', roles: ['Admin', 'Doctor', 'Receptionist', 'Pharmacist', 'Lab Technician', 'Midwife', 'Patient'] },
    { id: 'doctors', label: 'Doctors & Staff', icon: UserCheck, category: 'Clinical Operations', roles: ['Admin'] },
    { id: 'find-doctor', label: 'Find a Doctor', icon: Search, category: 'Clinical Operations', roles: ['Admin', 'Doctor', 'Receptionist', 'Pharmacist', 'Lab Technician', 'Midwife', 'Patient'] },
    { id: 'patients', label: 'Patient Management', icon: Users, category: 'Patient Services', roles: ['Admin', 'Doctor', 'Receptionist', 'Midwife'] },
    { id: 'appointments', label: 'Appointments', icon: Calendar, category: 'Patient Services', roles: ['Admin', 'Doctor', 'Receptionist', 'Patient'] },
    { id: 'prescriptions', label: 'Doctor Prescriptions (Rx)', icon: FileText, category: 'Pharmacy & Diagnostics', roles: ['Admin', 'Doctor', 'Pharmacist', 'Patient'] },
    { id: 'medicine-library', label: 'Medicine Library', icon: BookOpen, category: 'Pharmacy & Diagnostics', roles: ['Admin', 'Pharmacist', 'Doctor'] },
    { id: 'pharmacy', label: 'Pharmacy & Stock', icon: Pill, category: 'Pharmacy & Diagnostics', roles: ['Admin', 'Pharmacist'] },
    { id: 'lab', label: 'Lab & Diagnostics', icon: TestTube, category: 'Pharmacy & Diagnostics', roles: ['Admin', 'Doctor', 'Lab Technician', 'Patient'] },
    { id: 'payments', label: 'Billing & Payments', icon: CreditCard, category: 'Patient Services', roles: ['Admin', 'Receptionist', 'Pharmacist', 'Patient', 'Doctor', 'Midwife'] },
  ];

  const visibleNavItems = navItems.filter((item) => item.roles.includes(role));

  // Default initial tab depending on role
  const [currentTab, setCurrentTab] = useState<string>(
    role === 'Admin' ? 'dashboard' : visibleNavItems[0]?.id || 'departments'
  );
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  // When role changes, ensure currentTab is permitted for that role
  React.useEffect(() => {
    const isCurrentTabValid = visibleNavItems.some((item) => item.id === currentTab);
    if (!isCurrentTabValid && visibleNavItems.length > 0) {
      setCurrentTab(visibleNavItems[0].id);
    }
  }, [role]);

  // Render current active tab view
  const renderTabContent = () => {
    switch (currentTab) {
      case 'dashboard':
        return role === 'Admin' ? <AdminDashboard setCurrentTab={setCurrentTab} /> : <PublicDepartmentsPage />;
      case 'user-management':
        return role === 'Admin' ? <UserRoleManagement /> : <PublicDepartmentsPage />;
      case 'departments':
        return role === 'Admin' ? <DepartmentManagement /> : <PublicDepartmentsPage />;
      case 'doctors':
        return role === 'Admin' ? <DoctorStaffManagement /> : <PublicFindDoctorPage />;
      case 'find-doctor':
        return <PublicFindDoctorPage />;
      case 'patients':
        return (
          <PatientManagement
            onNavigateToPrescriptions={(patId?: string) => {
              setTargetPatientIdForRx(patId);
              setCurrentTab('prescriptions');
            }}
          />
        );
      case 'appointments':
        return <AppointmentScheduling />;
      case 'prescriptions':
        return (
          <PrescriptionManagement
            initialPatientId={targetPatientIdForRx}
            onNavigateToPharmacy={() => setCurrentTab('pharmacy')}
          />
        );
      case 'medicine-library':
        return <MedicineLibrary />;
      case 'pharmacy':
        return (
          <PharmacyInventory
            onNavigateToPrescriptions={() => setCurrentTab('prescriptions')}
          />
        );
      case 'lab':
        return <LabManagement />;
      case 'payments':
        return <PaymentManagement />;
      default:
        return role === 'Admin' ? <AdminDashboard setCurrentTab={setCurrentTab} /> : <PublicDepartmentsPage />;
    }
  };

  const activeNavObj = navItems.find((n) => n.id === currentTab);

  if (!user) {
    return <LoginPage />;
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans selection:bg-emerald-200">
      <div className="flex flex-1 overflow-hidden">
        {/* LEFT SIDEBAR NAVIGATION */}
        <aside
          className={`fixed inset-y-0 left-0 z-50 w-68 bg-white border-r border-slate-200/90 shadow-sm flex flex-col justify-between transform transition-transform duration-200 ease-in-out md:relative md:translate-x-0 ${
            isMobileSidebarOpen ? 'translate-x-0' : '-translate-x-full'
          }`}
        >
          <div>
            {/* Brand Header with Attractive Logo */}
            <div className="p-4.5 border-b border-slate-100 flex items-center justify-between bg-gradient-to-b from-slate-50/80 to-white">
              <div
                className="cursor-pointer group"
                onClick={() => setCurrentTab(role === 'Admin' ? 'dashboard' : 'departments')}
              >
                <HospitalLogo size="md" variant="dark" showBadge={true} badgeText="EMR v2.5" />
              </div>

              <button
                onClick={() => setIsMobileSidebarOpen(false)}
                className="md:hidden text-slate-400 hover:text-slate-700 p-1.5 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Navigation Group Links */}
            <nav className="p-3.5 space-y-3 overflow-y-auto max-h-[calc(100vh-190px)] scrollbar-thin">
              {['Main', 'Clinical Operations', 'Patient Services', 'Pharmacy & Diagnostics'].map((category) => {
                const categoryItems = visibleNavItems.filter((i) => i.category === category);
                if (categoryItems.length === 0) return null;

                return (
                  <div key={category} className="space-y-1">
                    <div className="px-3 py-0.5 text-[10px] font-black text-slate-400 uppercase tracking-wider flex items-center justify-between">
                      <span>{category}</span>
                      <span className="w-1.5 h-1.5 rounded-full bg-slate-300" />
                    </div>
                    <div className="space-y-1 mt-1">
                      {categoryItems.map((item) => {
                        const Icon = item.icon;
                        const isActive = currentTab === item.id;
                        return (
                          <button
                            key={item.id}
                            onClick={() => {
                              setCurrentTab(item.id);
                              setIsMobileSidebarOpen(false);
                            }}
                            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                              isActive
                                ? 'bg-emerald-700 text-white shadow-md shadow-emerald-900/15'
                                : 'text-slate-600 hover:bg-slate-100/80 hover:text-emerald-800'
                            }`}
                          >
                            <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-white' : 'text-slate-400 group-hover:text-emerald-600'}`} />
                            <span className="truncate">{item.label}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </nav>
          </div>

          {/* User Profile Footer in Sidebar */}
          <div className="p-3.5 border-t border-slate-100 bg-slate-50/70">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-emerald-700 to-teal-600 text-white flex items-center justify-center font-black text-xs shrink-0 shadow-sm">
                  {user.name.charAt(0)}
                </div>
                <div className="truncate text-xs">
                  <div className="font-extrabold text-slate-900 truncate">{user.name}</div>
                  <div className="text-[10px] text-emerald-700 font-bold flex items-center gap-1">
                    <ShieldCheck className="w-3 h-3" />
                    <span>{user.role}</span>
                  </div>
                </div>
              </div>

              <button
                onClick={logout}
                className="p-2 text-slate-400 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors shrink-0 cursor-pointer"
                title="Sign out / Reset user"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          </div>
        </aside>

        {/* MAIN LAYOUT WRAPPER */}
        <div className="flex-1 flex flex-col min-w-0 bg-[#F8FAFC]">
          {/* TOP HEADER BAR (Authoritative Hospital Indigo/Emerald Gradient) */}
          <header className="h-16 bg-gradient-to-r from-emerald-900 via-teal-950 to-slate-900 text-white shadow-md flex items-center justify-between px-4 md:px-6 sticky top-0 z-40 border-b border-emerald-800/40">
            <div className="flex items-center gap-3">
              <button
                onClick={() => setIsMobileSidebarOpen(true)}
                className="md:hidden text-white p-1.5 hover:bg-white/10 rounded-lg transition-colors cursor-pointer"
              >
                <Menu className="w-6 h-6" />
              </button>

              <div className="flex items-center gap-2.5">
                <h2 className="text-base md:text-lg font-black tracking-tight text-white flex items-center gap-2">
                  <span>{activeNavObj?.label || 'Hospital Portal'}</span>
                </h2>
                <div className="hidden sm:block h-4 w-px bg-white/20 mx-1" />
                <span className="hidden sm:flex items-center gap-1.5 text-xs text-emerald-200/90 font-medium">
                  <Clock className="w-3.5 h-3.5 text-teal-300" />
                  {new Date().toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-3">
              {/* Emergency Status Pill with Live Pulse */}
              <div className="bg-emerald-950/80 border border-emerald-700/60 text-emerald-200 px-3 py-1 rounded-full text-xs font-extrabold tracking-wide shadow-sm flex items-center gap-2">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
                </span>
                <span className="text-[11px] text-white">Emergency Center 24/7</span>
              </div>

              {/* Hospital System Badge */}
              <div className="hidden md:flex items-center gap-1.5 bg-white/10 px-2.5 py-1 rounded-lg text-[11px] font-bold text-teal-100 border border-white/10">
                <Activity className="w-3.5 h-3.5 text-teal-300" />
                <span>GB-Hospital OS</span>
              </div>
            </div>
          </header>

          {/* PAGE CONTENT CONTAINER */}
          <main className="flex-1 p-4 md:p-6 overflow-y-auto bg-slate-50/80">
            {renderTabContent()}
          </main>
        </div>
      </div>
    </div>
  );
};

export default function App() {
  return (
    <AuthProvider>
      <MainApp />
    </AuthProvider>
  );
}

