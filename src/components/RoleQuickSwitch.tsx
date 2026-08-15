import React from 'react';
import { useAuth } from '../context/AuthContext';
import { UserRole } from '../types';
import {
  Shield,
  Stethoscope,
  Clipboard,
  Pill,
  TestTube,
  Baby,
  User as UserIcon,
  RotateCcw,
  Eye,
} from 'lucide-react';

export const RoleQuickSwitch: React.FC = () => {
  const { user, isAdmin, isInspectingRole, switchDepartmentRole, restoreAdminRole } = useAuth();

  // Strictly disabled and hidden for all other departments/users except Admin
  if (!isAdmin) {
    return null;
  }

  const roles: { role: UserRole; label: string; icon: any; color: string }[] = [
    { role: 'Admin', label: 'Admin HQ', icon: Shield, color: 'bg-emerald-700 text-white hover:bg-emerald-600' },
    { role: 'Doctor', label: 'Doctor', icon: Stethoscope, color: 'bg-teal-700 text-white hover:bg-teal-600' },
    { role: 'Receptionist', label: 'Receptionist', icon: Clipboard, color: 'bg-indigo-700 text-white hover:bg-indigo-600' },
    { role: 'Pharmacist', label: 'Pharmacist', icon: Pill, color: 'bg-amber-700 text-white hover:bg-amber-600' },
    { role: 'Lab Technician', label: 'Lab Tech', icon: TestTube, color: 'bg-cyan-700 text-white hover:bg-cyan-600' },
    { role: 'Midwife', label: 'Midwife', icon: Baby, color: 'bg-rose-700 text-white hover:bg-rose-600' },
    { role: 'Patient', label: 'Patient Portal', icon: UserIcon, color: 'bg-slate-700 text-white hover:bg-slate-600' },
  ];

  return (
    <div className="bg-slate-950 text-slate-200 text-xs px-4 py-2 border-b border-slate-800 flex flex-wrap items-center justify-between gap-2.5 shadow-inner">
      <div className="flex items-center gap-2 flex-wrap">
        <span className="font-extrabold text-emerald-400 uppercase tracking-widest text-[10px] flex items-center gap-1.5 bg-emerald-950/80 px-2 py-0.5 rounded border border-emerald-800/60">
          <Shield className="w-3.5 h-3.5 text-emerald-400" /> Admin Inspector
        </span>

        {isInspectingRole ? (
          <div className="flex items-center gap-2">
            <span className="bg-amber-950/90 text-amber-300 border border-amber-800/80 px-2.5 py-0.5 rounded-lg font-bold text-[11px] flex items-center gap-1.5 animate-pulse">
              <Eye className="w-3 h-3 text-amber-400" />
              Previewing Department: <strong className="text-white">{user?.role}</strong>
            </span>
            <button
              onClick={restoreAdminRole}
              className="inline-flex items-center gap-1 bg-emerald-600 hover:bg-emerald-500 text-white px-2.5 py-0.5 rounded-lg text-[11px] font-bold shadow-xs transition-colors cursor-pointer"
            >
              <RotateCcw className="w-3 h-3" />
              Return to Admin HQ
            </button>
          </div>
        ) : (
          <span className="text-slate-400 text-[11px] font-medium hidden sm:inline">
            Switch views to inspect all hospital departments:
          </span>
        )}
      </div>

      <div className="flex items-center gap-1.5 flex-wrap">
        <span className="text-slate-400 font-semibold text-[10px] uppercase tracking-wider hidden md:inline mr-1">
          Switch View:
        </span>
        {roles.map(({ role, label, icon: Icon, color }) => {
          const isActive = user?.role === role;
          return (
            <button
              key={role}
              onClick={() => switchDepartmentRole(role)}
              className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg transition-all text-[11px] font-bold cursor-pointer ${color} ${
                isActive
                  ? 'ring-2 ring-emerald-400 ring-offset-1 ring-offset-slate-950 shadow-md scale-105'
                  : 'opacity-80 hover:opacity-100 hover:scale-102'
              }`}
              title={`Switch view to ${role} department`}
            >
              <Icon className="w-3 h-3" />
              <span>{label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
};

