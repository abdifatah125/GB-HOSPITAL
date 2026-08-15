import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { UserRole } from '../types';
import { HospitalLogo } from '../components/HospitalLogo';
import {
  Shield,
  Stethoscope,
  Clipboard,
  Pill,
  TestTube,
  Baby,
  User as UserIcon,
  KeyRound,
  Mail,
  Lock,
  UserPlus,
  LogIn,
  Hospital,
  AlertCircle,
  CheckCircle2,
} from 'lucide-react';

export const LoginPage: React.FC = () => {
  const { login, register, resetPassword, quickLoginAsRole } = useAuth();

  const [activeTab, setActiveTab] = useState<'login' | 'register' | 'forgot'>('login');
  const [usernameOrEmail, setUsernameOrEmail] = useState('');
  const [password, setPassword] = useState('');

  // Register form state
  const [regName, setRegName] = useState('');
  const [regUsername, setRegUsername] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPhone, setRegPhone] = useState('');
  const [regRole, setRegRole] = useState<UserRole>('Patient');
  const [regPassword, setRegPassword] = useState('');

  // Reset password state
  const [resetEmail, setResetEmail] = useState('');

  const [message, setMessage] = useState<{ type: 'error' | 'success'; text: string } | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);
    setIsSubmitting(true);
    try {
      await login(usernameOrEmail || 'admin', password || 'password');
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'Login failed' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);
    setIsSubmitting(true);
    try {
      await register({
        name: regName,
        username: regUsername,
        email: regEmail,
        phone: regPhone,
        role: regRole,
        password: regPassword,
      });
      setMessage({ type: 'success', text: 'Account registered successfully!' });
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'Registration failed' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResetSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);
    if (!resetEmail) {
      setMessage({ type: 'error', text: 'Please enter your registered email address' });
      return;
    }
    const resText = await resetPassword(resetEmail);
    setMessage({ type: 'success', text: resText });
  };

  const demoRoles: { role: UserRole; label: string; icon: any; email: string }[] = [
    { role: 'Admin', label: 'Admin', icon: Shield, email: 'admin@gbhospital.com' },
    { role: 'Doctor', label: 'Doctor', icon: Stethoscope, email: 'doctor@gbhospital.com' },
    { role: 'Receptionist', label: 'Receptionist', icon: Clipboard, email: 'reception@gbhospital.com' },
    { role: 'Pharmacist', label: 'Pharmacist', icon: Pill, email: 'pharmacy@gbhospital.com' },
    { role: 'Lab Technician', label: 'Lab Tech', icon: TestTube, email: 'lab@gbhospital.com' },
    { role: 'Midwife', label: 'Midwife', icon: Baby, email: 'midwife@gbhospital.com' },
    { role: 'Patient', label: 'Patient', icon: UserIcon, email: 'patient@gbhospital.com' },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-emerald-950 to-slate-900 flex flex-col justify-center py-12 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Decorative ambient blurred medical cross/glow */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-10 right-10 w-72 h-72 bg-teal-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center relative z-10">
        {/* Hospital Logo Emblem with glowing effect */}
        <div className="flex justify-center mb-4">
          <HospitalLogo size="xl" variant="light" showBadge={true} badgeText="Hospital System 2026" />
        </div>
      </div>

      <div className="mt-4 sm:mx-auto sm:w-full sm:max-w-lg relative z-10">
        <div className="bg-white/95 backdrop-blur-md py-8 px-6 shadow-2xl rounded-3xl border border-white/20 sm:px-10">
          {/* Tab Navigation */}
          <div className="flex rounded-xl bg-slate-100 p-1 mb-6 border border-slate-200">
            <button
              onClick={() => { setActiveTab('login'); setMessage(null); }}
              className={`flex-1 py-2 text-xs font-black rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                activeTab === 'login'
                  ? 'bg-emerald-700 text-white shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <LogIn className="w-3.5 h-3.5" /> Login
            </button>
            <button
              onClick={() => { setActiveTab('register'); setMessage(null); }}
              className={`flex-1 py-2 text-xs font-black rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                activeTab === 'register'
                  ? 'bg-emerald-700 text-white shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <UserPlus className="w-3.5 h-3.5" /> Register
            </button>
            <button
              onClick={() => { setActiveTab('forgot'); setMessage(null); }}
              className={`flex-1 py-2 text-xs font-black rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                activeTab === 'forgot'
                  ? 'bg-emerald-700 text-white shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <KeyRound className="w-3.5 h-3.5" /> Reset
            </button>
          </div>

          {/* Feedback Message */}
          {message && (
            <div
              className={`p-3.5 rounded-xl mb-6 text-xs font-bold flex items-center gap-2 border shadow-xs ${
                message.type === 'error'
                  ? 'bg-red-50 text-red-800 border-red-200'
                  : 'bg-emerald-50 text-emerald-800 border-emerald-200'
              }`}
            >
              {message.type === 'error' ? (
                <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
              ) : (
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              )}
              <span>{message.text}</span>
            </div>
          )}

          {/* LOGIN FORM */}
          {activeTab === 'login' && (
            <form onSubmit={handleLoginSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  Username or Email
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-gray-400 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    value={usernameOrEmail}
                    onChange={(e) => setUsernameOrEmail(e.target.value)}
                    placeholder="e.g. admin@gbhospital.com or admin"
                    className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg text-xs focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  Password
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-gray-400 absolute left-3 top-2.5" />
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg text-xs focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white py-2.5 rounded-lg text-xs font-bold transition-colors shadow-md flex items-center justify-center gap-2"
              >
                <LogIn className="w-4 h-4" /> Sign In to GB Hospital
              </button>
            </form>
          )}

          {/* REGISTER FORM */}
          {activeTab === 'register' && (
            <form onSubmit={handleRegisterSubmit} className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Full Name</label>
                <input
                  type="text"
                  required
                  value={regName}
                  onChange={(e) => setRegName(e.target.value)}
                  placeholder="e.g. Dr. Said Hassan"
                  className="w-full px-3 py-1.5 border border-gray-300 rounded-lg text-xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Username</label>
                  <input
                    type="text"
                    required
                    value={regUsername}
                    onChange={(e) => setRegUsername(e.target.value)}
                    placeholder="username"
                    className="w-full px-3 py-1.5 border border-gray-300 rounded-lg text-xs"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Email</label>
                  <input
                    type="email"
                    required
                    value={regEmail}
                    onChange={(e) => setRegEmail(e.target.value)}
                    placeholder="email@gbhospital.com"
                    className="w-full px-3 py-1.5 border border-gray-300 rounded-lg text-xs"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Phone Number</label>
                  <input
                    type="text"
                    value={regPhone}
                    onChange={(e) => setRegPhone(e.target.value)}
                    placeholder="+252 61 0000000"
                    className="w-full px-3 py-1.5 border border-gray-300 rounded-lg text-xs"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Assign Role</label>
                  <select
                    value={regRole}
                    onChange={(e) => setRegRole(e.target.value as UserRole)}
                    className="w-full px-3 py-1.5 border border-gray-300 rounded-lg text-xs font-semibold text-emerald-800"
                  >
                    <option value="Patient">Patient</option>
                    <option value="Doctor">Doctor</option>
                    <option value="Receptionist">Receptionist</option>
                    <option value="Pharmacist">Pharmacist</option>
                    <option value="Lab Technician">Lab Technician</option>
                    <option value="Midwife">Midwife</option>
                    <option value="Admin">Admin</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Password</label>
                <input
                  type="password"
                  required
                  value={regPassword}
                  onChange={(e) => setRegPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full px-3 py-1.5 border border-gray-300 rounded-lg text-xs"
                />
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white py-2.5 rounded-lg text-xs font-bold transition-colors shadow-md mt-2 flex items-center justify-center gap-2"
              >
                <UserPlus className="w-4 h-4" /> Create Account
              </button>
            </form>
          )}

          {/* FORGOT PASSWORD FORM */}
          {activeTab === 'forgot' && (
            <form onSubmit={handleResetSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  Registered Email Address
                </label>
                <input
                  type="email"
                  value={resetEmail}
                  onChange={(e) => setResetEmail(e.target.value)}
                  placeholder="e.g. user@gbhospital.com"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-xs"
                />
              </div>

              <button
                type="submit"
                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white py-2.5 rounded-lg text-xs font-bold transition-colors shadow-md flex items-center justify-center gap-2"
              >
                <KeyRound className="w-4 h-4" /> Send Reset Link
              </button>
            </form>
          )}

          {/* DEMO 1-CLICK ROLE QUICK LOGINS */}
          <div className="mt-8 pt-6 border-t border-emerald-100">
            <h3 className="text-xs font-extrabold text-emerald-900 uppercase tracking-wider mb-3 text-center flex items-center justify-center gap-1">
              <Hospital className="w-3.5 h-3.5 text-emerald-600" />
              Instant Demo Logins (1-Click Role Testing):
            </h3>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {demoRoles.map(({ role, label, icon: Icon, email }) => (
                <button
                  key={role}
                  type="button"
                  onClick={() => quickLoginAsRole(role)}
                  className="flex items-center gap-1.5 p-2 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-900 border border-emerald-200 transition-all text-xs font-bold text-left group"
                >
                  <div className="w-6 h-6 rounded bg-emerald-600 text-white flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
                    <Icon className="w-3.5 h-3.5" />
                  </div>
                  <div className="overflow-hidden">
                    <div className="truncate">{label}</div>
                    <div className="text-[10px] text-emerald-600 font-normal truncate">{email}</div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
