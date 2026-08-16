import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { HospitalLogo } from '../components/HospitalLogo';
import {
  Shield,
  KeyRound,
  Mail,
  Lock,
  UserPlus,
  LogIn,
  AlertCircle,
  CheckCircle2,
} from 'lucide-react';

export const LoginPage: React.FC = () => {
  const { login, resetPassword } = useAuth();

  const [activeTab, setActiveTab] = useState<'login' | 'register' | 'forgot'>('login');
  const [usernameOrEmail, setUsernameOrEmail] = useState('');
  const [password, setPassword] = useState('');

  // Reset password state
  const [resetEmail, setResetEmail] = useState('');

  const [message, setMessage] = useState<{ type: 'error' | 'success'; text: string } | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);

    const inputUser = usernameOrEmail.trim();
    if (!inputUser) {
      setMessage({ type: 'error', text: 'Please enter your username or registered email address.' });
      return;
    }

    if (!password) {
      setMessage({ type: 'error', text: 'Please enter your account password.' });
      return;
    }

    setIsSubmitting(true);
    try {
      await login(inputUser, password);
    } catch (err: any) {
      setMessage({
        type: 'error',
        text: err.message || 'Login failed. Please check your credentials or contact the Hospital Administrator.',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResetSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);
    if (!resetEmail) {
      setMessage({ type: 'error', text: 'Please enter your registered email address.' });
      return;
    }
    const resText = await resetPassword(resetEmail);
    setMessage({ type: 'success', text: resText });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-emerald-950 to-slate-900 flex flex-col justify-center py-10 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Decorative ambient blurred glow */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-10 right-10 w-72 h-72 bg-teal-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center relative z-10 mb-2">
        {/* Hospital Logo Emblem */}
        <div className="flex justify-center mb-3">
          <HospitalLogo size="xl" variant="light" showBadge={true} badgeText="Hospital System 2026" />
        </div>
      </div>

      <div className="sm:mx-auto sm:w-full sm:max-w-lg relative z-10">
        <div className="bg-white/95 backdrop-blur-md py-7 px-6 shadow-2xl rounded-3xl border border-white/20 sm:px-9">
          {/* Tab Navigation */}
          <div className="flex rounded-xl bg-slate-100 p-1 mb-5 border border-slate-200">
            <button
              onClick={() => {
                setActiveTab('login');
                setMessage(null);
              }}
              className={`flex-1 py-2 text-xs font-black rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                activeTab === 'login'
                  ? 'bg-emerald-700 text-white shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <LogIn className="w-3.5 h-3.5" /> Login Portal
            </button>
            <button
              onClick={() => {
                setActiveTab('register');
                setMessage(null);
              }}
              className={`flex-1 py-2 text-xs font-black rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                activeTab === 'register'
                  ? 'bg-emerald-700 text-white shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <UserPlus className="w-3.5 h-3.5" /> Registration Policy
            </button>
            <button
              onClick={() => {
                setActiveTab('forgot');
                setMessage(null);
              }}
              className={`flex-1 py-2 text-xs font-black rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                activeTab === 'forgot'
                  ? 'bg-emerald-700 text-white shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <KeyRound className="w-3.5 h-3.5" /> Password Reset
            </button>
          </div>

          {/* Feedback Message */}
          {message && (
            <div
              className={`p-3.5 rounded-xl mb-5 text-xs font-bold flex items-start gap-2.5 border shadow-xs animate-fadeIn ${
                message.type === 'error'
                  ? 'bg-red-50 text-red-900 border-red-200'
                  : 'bg-emerald-50 text-emerald-900 border-emerald-200'
              }`}
            >
              {message.type === 'error' ? (
                <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
              ) : (
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              )}
              <div className="leading-relaxed">{message.text}</div>
            </div>
          )}

          {/* LOGIN FORM */}
          {activeTab === 'login' && (
            <form onSubmit={handleLoginSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  Username or Registered Email
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-gray-400 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    value={usernameOrEmail}
                    onChange={(e) => setUsernameOrEmail(e.target.value)}
                    placeholder="Enter your username or email..."
                    className="w-full pl-9 pr-3 py-2.5 border border-gray-300 rounded-xl text-xs focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 font-medium"
                    autoComplete="username"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Password</label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-gray-400 absolute left-3 top-2.5" />
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter your password..."
                    className="w-full pl-9 pr-3 py-2.5 border border-gray-300 rounded-xl text-xs focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 font-medium"
                    autoComplete="current-password"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full bg-emerald-700 hover:bg-emerald-800 text-white py-2.5 rounded-xl text-xs font-bold transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 mt-2"
              >
                <LogIn className="w-4 h-4" /> Sign In to Garasbaley Hospital
              </button>
            </form>
          )}

          {/* REGISTER TAB - ADMIN RESTRICTION POLICY */}
          {activeTab === 'register' && (
            <div className="space-y-4">
              <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-amber-950 text-xs">
                <div className="font-extrabold flex items-center gap-1.5 text-amber-900 mb-1">
                  <Shield className="w-4 h-4 text-amber-700" />
                  Admin-Only Account Registration Policy
                </div>
                <p className="text-amber-800 leading-relaxed">
                  In compliance with Garasbaley Hospital clinical security & privacy regulations, public self-registration is closed. Only the <strong>Hospital System Administrator</strong> is authorized to register, provision, reset roles, and activate accounts for doctors, clinical staff, nurses, lab technologists, pharmacists, and patients.
                </p>
              </div>

              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 text-xs space-y-2.5">
                <div className="font-bold text-slate-800 flex items-center gap-1.5">
                  <Lock className="w-3.5 h-3.5 text-emerald-700" />
                  How to get an account:
                </div>
                <ul className="list-disc list-inside text-slate-600 space-y-1 text-[11px]">
                  <li><strong>Hospital Staff / Doctors / Technicians:</strong> Request credentials from Hospital Administration IT Desk.</li>
                  <li><strong>Patients / Reception:</strong> Registration is handled in-person or directly provisioned by hospital admins.</li>
                  <li><strong>Hospital Administrators:</strong> Log in with Admin credentials to access the User & Role Management Portal.</li>
                </ul>
              </div>

              <button
                type="button"
                onClick={() => {
                  setActiveTab('login');
                  setUsernameOrEmail('');
                  setPassword('');
                }}
                className="w-full bg-emerald-700 hover:bg-emerald-800 text-white py-2.5 rounded-xl text-xs font-bold transition-colors shadow-md flex items-center justify-center gap-2 cursor-pointer"
              >
                <LogIn className="w-4 h-4" /> Go to Login Portal
              </button>
            </div>
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
                  className="w-full px-3 py-2.5 border border-gray-300 rounded-xl text-xs focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <button
                type="submit"
                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white py-2.5 rounded-xl text-xs font-bold transition-colors shadow-md flex items-center justify-center gap-2 cursor-pointer"
              >
                <KeyRound className="w-4 h-4" /> Send Reset Link
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
