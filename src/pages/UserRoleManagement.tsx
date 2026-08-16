import React, { useState, useEffect } from 'react';
import { User, UserRole, Department } from '../types';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import {
  ShieldCheck,
  UserPlus,
  ShieldAlert,
  Search,
  CheckCircle2,
  XCircle,
  RotateCcw,
  Trash2,
  Mail,
  Phone,
  Calendar,
  Building2,
  Lock,
  Unlock,
  AlertTriangle,
  Users,
  Check,
  X,
  Stethoscope,
  Clipboard,
  Pill,
  TestTube,
  Baby,
  User as UserIcon,
  Shield,
  Filter,
} from 'lucide-react';

export const UserRoleManagement: React.FC = () => {
  const { user: currentAdmin } = useAuth();

  const [users, setUsers] = useState<User[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  // Register Modal State
  const [showRegisterModal, setShowRegisterModal] = useState<boolean>(false);
  const [regName, setRegName] = useState('');
  const [regUsername, setRegUsername] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPhone, setRegPhone] = useState('');
  const [regRole, setRegRole] = useState<UserRole>('Doctor');
  const [regDeptId, setRegDeptId] = useState('');
  const [regStatus, setRegStatus] = useState<'Active' | 'Disabled'>('Active');
  const [regPassword, setRegPassword] = useState('Password@123');

  // Role Reset Modal State
  const [selectedUserForRoleReset, setSelectedUserForRoleReset] = useState<User | null>(null);
  const [newSelectedRole, setNewSelectedRole] = useState<UserRole>('Doctor');

  // Notification Banner
  const [banner, setBanner] = useState<{ type: 'success' | 'error' | 'info'; message: string } | null>(null);
  const [actionLoading, setActionLoading] = useState<boolean>(false);

  const fetchUsersAndDepts = async () => {
    try {
      const [usersData, deptsData] = await Promise.all([
        api.getUsers().catch(() => []),
        api.getDepartments().catch(() => []),
      ]);
      setUsers(usersData || []);
      setDepartments(deptsData || []);
    } catch (err: any) {
      console.warn('Failed to load user management data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsersAndDepts();
  }, []);

  const showNotification = (type: 'success' | 'error' | 'info', message: string) => {
    setBanner({ type, message });
    setTimeout(() => {
      setBanner(null);
    }, 5000);
  };

  // Toggle user active/disabled status
  const handleToggleUserStatus = async (userToToggle: User) => {
    if (userToToggle.id === 'usr-admin' || userToToggle.username === 'admin') {
      showNotification('error', 'The primary administrator account cannot be disabled.');
      return;
    }

    const newActiveState = userToToggle.isActive === false ? true : false;
    setActionLoading(true);

    try {
      await api.updateUserStatus(
        userToToggle.id,
        newActiveState,
        newActiveState ? 'Active' : 'Disabled'
      );
      setUsers((prev) =>
        prev.map((u) =>
          u.id === userToToggle.id
            ? { ...u, isActive: newActiveState, status: newActiveState ? 'Active' : 'Disabled' }
            : u
        )
      );
      showNotification(
        'success',
        `User "${userToToggle.name}" (${userToToggle.username}) is now ${
          newActiveState ? 'ACTIVE (Access Granted)' : 'DISABLED (Access Blocked)'
        }.`
      );
    } catch (err: any) {
      showNotification('error', err.message || 'Failed to update user status');
    } finally {
      setActionLoading(false);
    }
  };

  // Reset / Change user role
  const handleResetRoleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUserForRoleReset) return;

    if (
      (selectedUserForRoleReset.id === 'usr-admin' || selectedUserForRoleReset.username === 'admin') &&
      newSelectedRole !== 'Admin'
    ) {
      showNotification('error', 'Cannot remove Admin role from the primary system administrator.');
      return;
    }

    setActionLoading(true);
    try {
      await api.updateUserRole(selectedUserForRoleReset.id, newSelectedRole);
      setUsers((prev) =>
        prev.map((u) =>
          u.id === selectedUserForRoleReset.id ? { ...u, role: newSelectedRole } : u
        )
      );
      showNotification(
        'success',
        `Role successfully reset! "${selectedUserForRoleReset.name}" is now assigned the "${newSelectedRole}" role.`
      );
      setSelectedUserForRoleReset(null);
    } catch (err: any) {
      showNotification('error', err.message || 'Failed to reset role');
    } finally {
      setActionLoading(false);
    }
  };

  // Disable all non-admin users in 1 click
  const handleDisableAllNonAdmins = async () => {
    const confirmLockdown = window.confirm(
      'Are you sure you want to DISABLE all non-admin and incoming users? All staff and patient accounts will be immediately blocked from accessing the system.'
    );
    if (!confirmLockdown) return;

    setActionLoading(true);
    try {
      const res = await api.disableAllNonAdmins();
      await fetchUsersAndDepts();
      showNotification(
        'info',
        `System Lockdown Activated: Disabled ${res.disabledCount || 'all non-admin'} user accounts. Only Administrators can currently access the system.`
      );
    } catch (err: any) {
      showNotification('error', err.message || 'Failed to execute lockdown');
    } finally {
      setActionLoading(false);
    }
  };

  // Enable all users in 1 click
  const handleEnableAllUsers = async () => {
    setActionLoading(true);
    try {
      await api.enableAllUsers();
      await fetchUsersAndDepts();
      showNotification('success', 'All user accounts have been enabled and restored to ACTIVE status.');
    } catch (err: any) {
      showNotification('error', err.message || 'Failed to enable users');
    } finally {
      setActionLoading(false);
    }
  };

  // Register new user (Admin only)
  const handleRegisterNewUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!regName || !regUsername || !regEmail) {
      showNotification('error', 'Please fill in all required user fields.');
      return;
    }

    setActionLoading(true);
    try {
      const newUser = await api.createUser({
        name: regName,
        username: regUsername,
        email: regEmail,
        phone: regPhone,
        role: regRole,
        departmentId: regDeptId,
        isActive: regStatus === 'Active',
        status: regStatus,
        password: regPassword,
      });

      setUsers((prev) => [newUser, ...prev]);
      showNotification(
        'success',
        `New ${regRole} account "${regName}" registered and provisioned successfully!`
      );
      setShowRegisterModal(false);
      // Reset form
      setRegName('');
      setRegUsername('');
      setRegEmail('');
      setRegPhone('');
      setRegRole('Doctor');
      setRegDeptId('');
      setRegStatus('Active');
    } catch (err: any) {
      showNotification('error', err.message || 'Failed to register new user');
    } finally {
      setActionLoading(false);
    }
  };

  // Delete user
  const handleDeleteUser = async (userToDelete: User) => {
    if (userToDelete.id === 'usr-admin' || userToDelete.username === 'admin') {
      showNotification('error', 'Cannot delete the primary Administrator account.');
      return;
    }

    const confirmDel = window.confirm(`Permanently remove user "${userToDelete.name}" (${userToDelete.username})?`);
    if (!confirmDel) return;

    setActionLoading(true);
    try {
      await api.deleteUser(userToDelete.id);
      setUsers((prev) => prev.filter((u) => u.id !== userToDelete.id));
      showNotification('success', `User "${userToDelete.name}" has been removed.`);
    } catch (err: any) {
      showNotification('error', err.message || 'Failed to delete user');
    } finally {
      setActionLoading(false);
    }
  };

  // Helper badge for role
  const getRoleBadge = (role: UserRole) => {
    switch (role) {
      case 'Admin':
        return (
          <span className="inline-flex items-center gap-1 bg-emerald-100 text-emerald-900 border border-emerald-300 px-2.5 py-0.5 rounded-full text-xs font-bold">
            <Shield className="w-3 h-3 text-emerald-700" /> Admin
          </span>
        );
      case 'Doctor':
        return (
          <span className="inline-flex items-center gap-1 bg-teal-100 text-teal-900 border border-teal-300 px-2.5 py-0.5 rounded-full text-xs font-bold">
            <Stethoscope className="w-3 h-3 text-teal-700" /> Doctor
          </span>
        );
      case 'Receptionist':
        return (
          <span className="inline-flex items-center gap-1 bg-indigo-100 text-indigo-900 border border-indigo-300 px-2.5 py-0.5 rounded-full text-xs font-bold">
            <Clipboard className="w-3 h-3 text-indigo-700" /> Receptionist
          </span>
        );
      case 'Pharmacist':
        return (
          <span className="inline-flex items-center gap-1 bg-amber-100 text-amber-900 border border-amber-300 px-2.5 py-0.5 rounded-full text-xs font-bold">
            <Pill className="w-3 h-3 text-amber-700" /> Pharmacist
          </span>
        );
      case 'Lab Technician':
        return (
          <span className="inline-flex items-center gap-1 bg-cyan-100 text-cyan-900 border border-cyan-300 px-2.5 py-0.5 rounded-full text-xs font-bold">
            <TestTube className="w-3 h-3 text-cyan-700" /> Lab Tech
          </span>
        );
      case 'Midwife':
        return (
          <span className="inline-flex items-center gap-1 bg-rose-100 text-rose-900 border border-rose-300 px-2.5 py-0.5 rounded-full text-xs font-bold">
            <Baby className="w-3 h-3 text-rose-700" /> Midwife
          </span>
        );
      case 'Patient':
        return (
          <span className="inline-flex items-center gap-1 bg-slate-100 text-slate-800 border border-slate-300 px-2.5 py-0.5 rounded-full text-xs font-bold">
            <UserIcon className="w-3 h-3 text-slate-600" /> Patient
          </span>
        );
      default:
        return (
          <span className="bg-gray-100 text-gray-800 px-2.5 py-0.5 rounded-full text-xs font-bold">
            {role}
          </span>
        );
    }
  };

  // Filtered users list
  const filteredUsers = users.filter((u) => {
    const matchesSearch =
      u.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (u.phone && u.phone.includes(searchQuery));

    const matchesRole = roleFilter === 'all' || u.role === roleFilter;
    const matchesStatus =
      statusFilter === 'all' ||
      (statusFilter === 'active' && u.isActive !== false && u.status !== 'Disabled') ||
      (statusFilter === 'disabled' && (u.isActive === false || u.status === 'Disabled'));

    return matchesSearch && matchesRole && matchesStatus;
  });

  const totalUsersCount = users.length;
  const activeUsersCount = users.filter((u) => u.isActive !== false && u.status !== 'Disabled').length;
  const disabledUsersCount = users.filter((u) => u.isActive === false || u.status === 'Disabled').length;

  return (
    <div className="space-y-6">
      {/* Top Banner & Header */}
      <div className="bg-gradient-to-r from-slate-900 via-emerald-950 to-slate-900 text-white rounded-2xl p-6 shadow-xl border border-slate-800 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-emerald-400 text-xs font-bold uppercase tracking-wider mb-1">
            <ShieldCheck className="w-4 h-4 text-emerald-400" /> Administrator Master Control
          </div>
          <h1 className="text-2xl font-black text-white tracking-tight">
            User Registration, Role Reset & Access Control
          </h1>
          <p className="text-xs text-slate-300 mt-1 max-w-2xl">
            Only administrators can provision new accounts, reset assigned department roles, and enable or disable staff and incoming user access across Garasbaley Hospital.
          </p>
        </div>

        {/* Master Action Buttons */}
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => setShowRegisterModal(true)}
            className="inline-flex items-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-2.5 rounded-xl text-xs font-bold shadow-md transition-all cursor-pointer hover:scale-102"
          >
            <UserPlus className="w-4 h-4" />
            Register New User
          </button>

          <button
            onClick={handleDisableAllNonAdmins}
            disabled={actionLoading}
            className="inline-flex items-center gap-1.5 bg-red-600 hover:bg-red-700 text-white px-3.5 py-2.5 rounded-xl text-xs font-bold shadow-md transition-all cursor-pointer border border-red-500"
            title="Deactivate all staff and patient accounts"
          >
            <Lock className="w-4 h-4" />
            Disable All Non-Admins
          </button>

          <button
            onClick={handleEnableAllUsers}
            disabled={actionLoading}
            className="inline-flex items-center gap-1.5 bg-slate-800 hover:bg-slate-700 text-slate-100 px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer border border-slate-700"
            title="Enable all user accounts"
          >
            <Unlock className="w-4 h-4 text-emerald-400" />
            Enable All
          </button>
        </div>
      </div>

      {/* Notification Banner */}
      {banner && (
        <div
          className={`p-4 rounded-xl flex items-center justify-between gap-3 text-xs font-bold border shadow-md animate-fadeIn ${
            banner.type === 'success'
              ? 'bg-emerald-50 text-emerald-900 border-emerald-300'
              : banner.type === 'error'
              ? 'bg-red-50 text-red-900 border-red-300'
              : 'bg-amber-50 text-amber-900 border-amber-300'
          }`}
        >
          <div className="flex items-center gap-2">
            {banner.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            ) : banner.type === 'error' ? (
              <AlertTriangle className="w-4 h-4 text-red-600 shrink-0" />
            ) : (
              <ShieldAlert className="w-4 h-4 text-amber-600 shrink-0" />
            )}
            <span>{banner.message}</span>
          </div>
          <button
            onClick={() => setBanner(null)}
            className="text-slate-400 hover:text-slate-700 p-1 rounded cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Total Registered Accounts</div>
            <div className="text-2xl font-black text-slate-900 mt-0.5">{totalUsersCount}</div>
            <div className="text-[11px] text-slate-500 mt-1">Hospital staff & patients</div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center">
            <Users className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <div className="text-[11px] font-bold text-emerald-700 uppercase tracking-wider">Active Users (Authorized)</div>
            <div className="text-2xl font-black text-emerald-700 mt-0.5">{activeUsersCount}</div>
            <div className="text-[11px] text-emerald-600 mt-1">Full system access granted</div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <CheckCircle2 className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <div className="text-[11px] font-bold text-red-700 uppercase tracking-wider">Disabled / Blocked Users</div>
            <div className="text-2xl font-black text-red-600 mt-0.5">{disabledUsersCount}</div>
            <div className="text-[11px] text-red-600 mt-1">Deactivated & login blocked</div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-red-50 text-red-600 flex items-center justify-center">
            <XCircle className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row gap-3 items-center justify-between">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by name, username, email, phone..."
            className="w-full pl-9 pr-3 py-2 border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
          />
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto flex-wrap">
          <div className="flex items-center gap-1.5 bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-200 text-xs">
            <Filter className="w-3.5 h-3.5 text-slate-500" />
            <span className="text-slate-500 font-medium">Role:</span>
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="bg-transparent font-bold text-slate-800 outline-hidden cursor-pointer"
            >
              <option value="all">All Roles ({totalUsersCount})</option>
              <option value="Admin">Admin</option>
              <option value="Doctor">Doctor</option>
              <option value="Receptionist">Receptionist</option>
              <option value="Pharmacist">Pharmacist</option>
              <option value="Lab Technician">Lab Technician</option>
              <option value="Midwife">Midwife</option>
              <option value="Patient">Patient</option>
            </select>
          </div>

          <div className="flex items-center gap-1.5 bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-200 text-xs">
            <span className="text-slate-500 font-medium">Status:</span>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-transparent font-bold text-slate-800 outline-hidden cursor-pointer"
            >
              <option value="all">All Statuses</option>
              <option value="active">Active Only ({activeUsersCount})</option>
              <option value="disabled">Disabled Only ({disabledUsersCount})</option>
            </select>
          </div>
        </div>
      </div>

      {/* Users Management Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between">
          <h2 className="text-sm font-black text-slate-900 uppercase tracking-wider flex items-center gap-2">
            <Users className="w-4 h-4 text-emerald-600" />
            Registered Users Directory ({filteredUsers.length})
          </h2>
          <span className="text-[11px] text-slate-500">
            Admin can reset roles and disable/enable any user with immediate enforcement.
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200">
              <tr>
                <th className="py-3 px-4">User Details</th>
                <th className="py-3 px-4">Username & Email</th>
                <th className="py-3 px-4">Assigned Role</th>
                <th className="py-3 px-4">Access Status</th>
                <th className="py-3 px-4">Registered Date</th>
                <th className="py-3 px-4 text-right">Admin Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-400">
                    No users found matching your filters.
                  </td>
                </tr>
              ) : (
                filteredUsers.map((userItem) => {
                  const isPrimaryAdmin = userItem.id === 'usr-admin' || userItem.username === 'admin';
                  const isUserActive = userItem.isActive !== false && userItem.status !== 'Disabled';

                  return (
                    <tr
                      key={userItem.id}
                      className={`hover:bg-slate-50/80 transition-colors ${
                        !isUserActive ? 'bg-red-50/30' : ''
                      }`}
                    >
                      <td className="py-3 px-4">
                        <div className="font-bold text-slate-900 flex items-center gap-2">
                          <span>{userItem.name}</span>
                          {isPrimaryAdmin && (
                            <span className="bg-emerald-100 text-emerald-800 text-[10px] px-1.5 py-0.5 rounded font-black border border-emerald-300">
                              PRIMARY ADMIN
                            </span>
                          )}
                        </div>
                        {userItem.phone && (
                          <div className="text-[11px] text-slate-500 flex items-center gap-1 mt-0.5">
                            <Phone className="w-3 h-3 text-slate-400" /> {userItem.phone}
                          </div>
                        )}
                      </td>

                      <td className="py-3 px-4">
                        <div className="font-mono text-slate-700 font-semibold">{userItem.username}</div>
                        <div className="text-[11px] text-slate-500 flex items-center gap-1 mt-0.5">
                          <Mail className="w-3 h-3 text-slate-400" /> {userItem.email}
                        </div>
                      </td>

                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          {getRoleBadge(userItem.role)}
                          <button
                            onClick={() => {
                              setSelectedUserForRoleReset(userItem);
                              setNewSelectedRole(userItem.role);
                            }}
                            className="text-[10px] font-bold text-emerald-700 hover:text-emerald-900 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 px-2 py-0.5 rounded-lg transition-colors cursor-pointer flex items-center gap-1"
                            title="Reset / Reassign User Role"
                          >
                            <RotateCcw className="w-2.5 h-2.5" /> Reset Role
                          </button>
                        </div>
                      </td>

                      <td className="py-3 px-4">
                        {isUserActive ? (
                          <span className="inline-flex items-center gap-1 bg-emerald-100 text-emerald-800 px-2.5 py-0.5 rounded-full text-xs font-bold border border-emerald-200">
                            <CheckCircle2 className="w-3 h-3 text-emerald-600" /> Active
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 bg-red-100 text-red-800 px-2.5 py-0.5 rounded-full text-xs font-bold border border-red-200">
                            <XCircle className="w-3 h-3 text-red-600" /> Disabled / Blocked
                          </span>
                        )}
                      </td>

                      <td className="py-3 px-4 text-slate-500 font-mono text-[11px]">
                        <div className="flex items-center gap-1">
                          <Calendar className="w-3 h-3 text-slate-400" />
                          {userItem.createdAt || '2025-01-01'}
                        </div>
                      </td>

                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          {/* Toggle Active / Disabled Button */}
                          <button
                            onClick={() => handleToggleUserStatus(userItem)}
                            disabled={isPrimaryAdmin || actionLoading}
                            className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                              isPrimaryAdmin
                                ? 'opacity-40 cursor-not-allowed bg-slate-100 text-slate-400'
                                : isUserActive
                                ? 'bg-red-50 hover:bg-red-100 text-red-700 border border-red-200'
                                : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200'
                            }`}
                            title={isUserActive ? 'Disable this user' : 'Enable this user'}
                          >
                            {isUserActive ? (
                              <>
                                <Lock className="w-3 h-3" /> Disable
                              </>
                            ) : (
                              <>
                                <Unlock className="w-3 h-3" /> Enable
                              </>
                            )}
                          </button>

                          {/* Delete user button */}
                          {!isPrimaryAdmin && (
                            <button
                              onClick={() => handleDeleteUser(userItem)}
                              disabled={actionLoading}
                              className="p-1 text-slate-400 hover:text-red-600 rounded hover:bg-red-50 transition-colors cursor-pointer"
                              title="Delete user"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* REGISTER NEW USER MODAL (ADMIN-ONLY) */}
      {showRegisterModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fadeIn">
          <div className="bg-white rounded-3xl p-6 max-w-lg w-full shadow-2xl border border-slate-200 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-emerald-600 text-white flex items-center justify-center">
                  <UserPlus className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-base font-black text-slate-900">Provision & Register New User</h3>
                  <p className="text-xs text-slate-500">Admin Account Registration Authority</p>
                </div>
              </div>
              <button
                onClick={() => setShowRegisterModal(false)}
                className="text-slate-400 hover:text-slate-700 p-1.5 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleRegisterNewUser} className="space-y-3.5 mt-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Full Legal Name *</label>
                <input
                  type="text"
                  required
                  value={regName}
                  onChange={(e) => setRegName(e.target.value)}
                  placeholder="e.g. Dr. Hassan Nur Warsame"
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Username *</label>
                  <input
                    type="text"
                    required
                    value={regUsername}
                    onChange={(e) => setRegUsername(e.target.value)}
                    placeholder="e.g. dr.hassannur"
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Email Address *</label>
                  <input
                    type="email"
                    required
                    value={regEmail}
                    onChange={(e) => setRegEmail(e.target.value)}
                    placeholder="user@gbhospital.com"
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Phone Number</label>
                  <input
                    type="text"
                    value={regPhone}
                    onChange={(e) => setRegPhone(e.target.value)}
                    placeholder="+252 61 0000000"
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Assign User Role *</label>
                  <select
                    value={regRole}
                    onChange={(e) => setRegRole(e.target.value as UserRole)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs font-bold text-emerald-800 focus:ring-2 focus:ring-emerald-500"
                  >
                    <option value="Doctor">Doctor</option>
                    <option value="Receptionist">Receptionist</option>
                    <option value="Pharmacist">Pharmacist</option>
                    <option value="Lab Technician">Lab Technician</option>
                    <option value="Midwife">Midwife</option>
                    <option value="Patient">Patient</option>
                    <option value="Admin">Administrator</option>
                  </select>
                </div>
              </div>

              {(regRole === 'Doctor' || regRole === 'Midwife') && (
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Department</label>
                  <select
                    value={regDeptId}
                    onChange={(e) => setRegDeptId(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-emerald-500"
                  >
                    <option value="">-- Select Department --</option>
                    {departments.map((d) => (
                      <option key={d.id} value={d.id}>
                        {d.name} ({d.location})
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Initial Password</label>
                  <input
                    type="text"
                    value={regPassword}
                    onChange={(e) => setRegPassword(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Initial Status</label>
                  <select
                    value={regStatus}
                    onChange={(e) => setRegStatus(e.target.value as 'Active' | 'Disabled')}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs font-bold focus:ring-2 focus:ring-emerald-500"
                  >
                    <option value="Active">Active (Granted Access)</option>
                    <option value="Disabled">Disabled (Blocked)</option>
                  </select>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowRegisterModal(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="px-5 py-2.5 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white shadow-md transition-all cursor-pointer flex items-center gap-1.5"
                >
                  <Check className="w-4 h-4" /> Provision Account
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* RESET USER ROLE MODAL (ADMIN ONLY) */}
      {selectedUserForRoleReset && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fadeIn">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-teal-600 text-white flex items-center justify-center">
                  <RotateCcw className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-base font-black text-slate-900">Reset / Change User Role</h3>
                  <p className="text-xs text-slate-500">Modify system permissions & view</p>
                </div>
              </div>
              <button
                onClick={() => setSelectedUserForRoleReset(null)}
                className="text-slate-400 hover:text-slate-700 p-1.5 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleResetRoleSubmit} className="space-y-4 mt-4">
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs">
                <div className="font-bold text-slate-800">{selectedUserForRoleReset.name}</div>
                <div className="text-slate-500 text-[11px] mt-0.5">
                  Username: <span className="font-mono font-semibold">{selectedUserForRoleReset.username}</span> | Current Role: <strong>{selectedUserForRoleReset.role}</strong>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">Select New Role</label>
                <select
                  value={newSelectedRole}
                  onChange={(e) => setNewSelectedRole(e.target.value as UserRole)}
                  className="w-full px-3 py-2.5 border border-slate-300 rounded-xl text-xs font-bold text-emerald-900 focus:ring-2 focus:ring-emerald-500"
                >
                  <option value="Doctor">Doctor</option>
                  <option value="Receptionist">Receptionist</option>
                  <option value="Pharmacist">Pharmacist</option>
                  <option value="Lab Technician">Lab Technician</option>
                  <option value="Midwife">Midwife</option>
                  <option value="Patient">Patient</option>
                  <option value="Admin">Administrator</option>
                </select>
                <p className="text-[11px] text-slate-500 mt-1.5">
                  Resetting the role will immediately adjust this user's module access, permissions, and sidebar navigation upon their next interaction.
                </p>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setSelectedUserForRoleReset(null)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="px-5 py-2.5 rounded-xl text-xs font-bold bg-teal-700 hover:bg-teal-800 text-white shadow-md transition-all cursor-pointer flex items-center gap-1.5"
                >
                  <Check className="w-4 h-4" /> Confirm Role Reset
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
