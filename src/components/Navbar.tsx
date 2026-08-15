import React from 'react';
import { useAuth } from '../context/AuthContext';
import { UserRole } from '../types';
import { HospitalLogo } from './HospitalLogo';
import {
  LayoutDashboard,
  Building2,
  UserCheck,
  Users,
  Calendar,
  BookOpen,
  Pill,
  TestTube,
  Baby,
  Receipt,
  Search,
  LogOut,
} from 'lucide-react';

interface NavbarProps {
  currentTab: string;
  setCurrentTab: (tab: string) => void;
}

export const Navbar: React.FC<NavbarProps> = ({ currentTab, setCurrentTab }) => {
  const { user, logout } = useAuth();
  const role: UserRole = user?.role || 'Patient';

  // Navigation Items mapped by role accessibility
  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, roles: ['Admin'] },
    { id: 'departments', label: 'Departments', icon: Building2, roles: ['Admin', 'Doctor', 'Receptionist', 'Pharmacist', 'Lab Technician', 'Midwife', 'Patient'] },
    { id: 'doctors', label: 'Doctors & Staff', icon: UserCheck, roles: ['Admin'] },
    { id: 'find-doctor', label: 'Find a Doctor', icon: Search, roles: ['Admin', 'Doctor', 'Receptionist', 'Pharmacist', 'Lab Technician', 'Midwife', 'Patient'] },
    { id: 'patients', label: 'Patients', icon: Users, roles: ['Admin', 'Doctor', 'Receptionist', 'Lab Technician', 'Midwife'] },
    { id: 'appointments', label: 'Appointments', icon: Calendar, roles: ['Admin', 'Doctor', 'Receptionist', 'Patient'] },
    { id: 'medicine-library', label: 'Medicine Library', icon: BookOpen, roles: ['Admin', 'Pharmacist', 'Doctor'] },
    { id: 'pharmacy', label: 'Pharmacy & Stock', icon: Pill, roles: ['Admin', 'Pharmacist'] },
    { id: 'lab', label: 'Lab & Tests', icon: TestTube, roles: ['Admin', 'Doctor', 'Lab Technician', 'Patient'] },
    { id: 'maternity', label: 'Maternity & Midwifery', icon: Baby, roles: ['Admin', 'Doctor', 'Midwife'] },
    { id: 'billing', label: 'Billing & Invoices', icon: Receipt, roles: ['Admin', 'Receptionist', 'Pharmacist', 'Patient'] },
  ];

  const visibleItems = navItems.filter((item) => item.roles.includes(role));

  return (
    <header className="bg-gradient-to-r from-emerald-900 via-teal-950 to-slate-900 text-white shadow-md border-b border-emerald-800/50 sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Brand Logo & Name */}
          <div
            className="cursor-pointer group"
            onClick={() => setCurrentTab(role === 'Admin' ? 'dashboard' : 'departments')}
          >
            <HospitalLogo size="md" variant="light" showBadge={true} badgeText="Hospital System" />
          </div>

          {/* User Profile Info & Logout */}
          <div className="flex items-center gap-3">
            {user && (
              <div className="hidden md:flex flex-col items-end text-xs">
                <span className="font-bold text-white">{user.name}</span>
                <span className="text-emerald-300 flex items-center gap-1 font-medium">
                  Role: <strong className="text-white underline decoration-emerald-400">{user.role}</strong>
                </span>
              </div>
            )}

            <button
              onClick={logout}
              className="inline-flex items-center gap-1.5 bg-white/10 hover:bg-white/20 text-white px-3 py-1.5 rounded-lg text-xs font-bold transition-colors border border-white/10 shadow-sm cursor-pointer"
              title="Logout session"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Logout</span>
            </button>
          </div>
        </div>

        {/* Scrollable Navigation Bar */}
        <nav className="flex items-center gap-1 overflow-x-auto py-2 border-t border-emerald-800/40 no-scrollbar">
          {visibleItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setCurrentTab(item.id)}
                className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-semibold whitespace-nowrap transition-all ${
                  isActive
                    ? 'bg-white text-emerald-900 shadow-sm font-bold'
                    : 'text-emerald-100 hover:bg-emerald-600 hover:text-white'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-emerald-700' : 'text-emerald-200'}`} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>
      </div>
    </header>
  );
};
