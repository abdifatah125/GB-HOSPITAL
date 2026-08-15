import React, { useEffect, useState } from 'react';
import { api } from '../services/api';
import {
  Users,
  UserCheck,
  Building2,
  Calendar,
  DollarSign,
  AlertTriangle,
  TrendingUp,
  Activity,
  ArrowRight,
  ShieldCheck,
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from 'recharts';

interface AdminDashboardProps {
  setCurrentTab: (tab: string) => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({ setCurrentTab }) => {
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const data = await api.getStats();
        setStats(data);
      } catch (err) {
        console.warn('Error loading stats:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  if (loading) {
    return (
      <div className="p-8 text-center text-emerald-800 flex items-center justify-center gap-2">
        <Activity className="w-5 h-5 animate-spin text-emerald-600" />
        <span>Loading Garasbaley Hospital Analytics...</span>
      </div>
    );
  }

  const statCards = [
    {
      title: 'Total Patients',
      value: stats?.totalPatients || 0,
      icon: Users,
      color: 'bg-emerald-500',
      tab: 'patients',
    },
    {
      title: 'Active Doctors',
      value: stats?.totalDoctors || 0,
      icon: UserCheck,
      color: 'bg-teal-600',
      tab: 'doctors',
    },
    {
      title: 'Departments',
      value: stats?.totalDepartments || 0,
      icon: Building2,
      color: 'bg-green-600',
      tab: 'departments',
    },
    {
      title: "Today's Appointments",
      value: stats?.todayAppointments || 0,
      icon: Calendar,
      color: 'bg-emerald-700',
      tab: 'appointments',
    },
    {
      title: 'Monthly Revenue',
      value: `$${(stats?.totalRevenue || 0).toLocaleString()}`,
      icon: DollarSign,
      color: 'bg-lime-600',
      tab: 'payments',
    },
    {
      title: 'Low Stock Alerts',
      value: stats?.lowStockCount || 0,
      icon: AlertTriangle,
      color: stats?.lowStockCount > 0 ? 'bg-amber-600 animate-pulse' : 'bg-emerald-600',
      tab: 'pharmacy',
    },
  ];

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-emerald-800 to-emerald-600 text-white rounded-2xl p-6 shadow-lg flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-emerald-200 text-xs font-bold uppercase tracking-wider mb-1">
            <ShieldCheck className="w-4 h-4 text-emerald-300" /> Administrative Command Center
          </div>
          <h1 className="text-2xl font-black text-white tracking-tight">
            Garasbaley Hospital Executive Dashboard
          </h1>
          <p className="text-xs text-emerald-100 mt-1 max-w-2xl">
            Real-time operations metrics for GB Hospital. Monitor patient volumes, clinical staff deployment, pharmacy inventories, and financial performance.
          </p>
        </div>

        <button
          onClick={() => setCurrentTab('billing')}
          className="bg-white text-emerald-900 hover:bg-emerald-50 font-bold text-xs px-4 py-2.5 rounded-xl transition-all shadow-md flex items-center gap-2 shrink-0"
        >
          <span>Generate Patient Invoice</span>
          <ArrowRight className="w-4 h-4 text-emerald-700" />
        </button>
      </div>

      {/* KPI Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {statCards.map((card, idx) => {
          const Icon = card.icon;
          return (
            <div
              key={idx}
              onClick={() => setCurrentTab(card.tab)}
              className="bg-white p-5 rounded-2xl border border-emerald-100 shadow-sm hover:shadow-md transition-all cursor-pointer group flex items-center justify-between"
            >
              <div>
                <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">{card.title}</p>
                <h3 className="text-2xl font-black text-emerald-950 mt-1 group-hover:text-emerald-600 transition-colors">
                  {card.value}
                </h3>
                <span className="text-[11px] font-semibold text-emerald-700 flex items-center gap-1 mt-2">
                  View module <ArrowRight className="w-3 h-3 group-hover:translate-x-1 transition-transform" />
                </span>
              </div>
              <div className={`w-12 h-12 rounded-xl text-white ${card.color} flex items-center justify-center shadow-md shrink-0`}>
                <Icon className="w-6 h-6" />
              </div>
            </div>
          );
        })}
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Appointments Per Week Chart */}
        <div className="bg-white p-5 rounded-2xl border border-emerald-100 shadow-sm space-y-3">
          <div className="flex items-center justify-between border-b border-gray-100 pb-3">
            <h3 className="text-sm font-extrabold text-emerald-950 flex items-center gap-2">
              <Calendar className="w-4 h-4 text-emerald-600" /> Weekly Appointments Distribution
            </h3>
            <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full">
              Current Week
            </span>
          </div>

          <div className="h-64 w-full pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stats?.appointmentsPerWeek || []}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="day" tick={{ fontSize: 12, fill: '#334155' }} />
                <YAxis tick={{ fontSize: 12, fill: '#334155' }} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#064e3b', borderRadius: '8px', color: '#fff', fontSize: '12px' }}
                />
                <Bar dataKey="count" fill="#10b981" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Monthly Revenue Chart */}
        <div className="bg-white p-5 rounded-2xl border border-emerald-100 shadow-sm space-y-3">
          <div className="flex items-center justify-between border-b border-gray-100 pb-3">
            <h3 className="text-sm font-extrabold text-emerald-950 flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-emerald-600" /> Monthly Revenue Trend ($)
            </h3>
            <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full">
              Past 6 Months
            </span>
          </div>

          <div className="h-64 w-full pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={stats?.revenuePerMonth || []}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="month" tick={{ fontSize: 12, fill: '#334155' }} />
                <YAxis tick={{ fontSize: 12, fill: '#334155' }} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#064e3b', borderRadius: '8px', color: '#fff', fontSize: '12px' }}
                />
                <Line type="monotone" dataKey="revenue" stroke="#059669" strokeWidth={3} dot={{ r: 5, fill: '#047857' }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Critical Alerts Section */}
      <div className="bg-white p-5 rounded-2xl border border-emerald-100 shadow-sm space-y-4">
        <h3 className="text-sm font-extrabold text-emerald-950 flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-amber-600" /> Pharmacy & Medicine Safety Alerts
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Low Stock Items */}
          <div className="border border-amber-200 bg-amber-50/50 p-4 rounded-xl space-y-2">
            <h4 className="text-xs font-bold text-amber-900 uppercase tracking-wider flex items-center justify-between">
              <span>Low Stock Items ({stats?.lowStockCount || 0})</span>
              <button
                onClick={() => setCurrentTab('pharmacy')}
                className="text-amber-700 hover:underline text-[11px] font-semibold"
              >
                Manage Inventory
              </button>
            </h4>

            {stats?.lowStockItems?.length > 0 ? (
              <ul className="space-y-1.5 text-xs text-amber-950">
                {stats.lowStockItems.map((item: any) => (
                  <li key={item.id} className="flex items-center justify-between bg-white p-2 rounded border border-amber-200">
                    <span className="font-bold">{item.medicineName} ({item.brandName})</span>
                    <span className="text-red-700 font-extrabold">Qty: {item.stockQuantity} (Min: {item.reorderThreshold})</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-xs text-amber-800">All pharmacy medicine stocks are at healthy levels.</p>
            )}
          </div>

          {/* Near Expiry Items */}
          <div className="border border-red-200 bg-red-50/50 p-4 rounded-xl space-y-2">
            <h4 className="text-xs font-bold text-red-900 uppercase tracking-wider flex items-center justify-between">
              <span>Nearing Expiration ({stats?.expiryCount || 0})</span>
              <button
                onClick={() => setCurrentTab('pharmacy')}
                className="text-red-700 hover:underline text-[11px] font-semibold"
              >
                Review Expiries
              </button>
            </h4>

            {stats?.expiryItems?.length > 0 ? (
              <ul className="space-y-1.5 text-xs text-red-950">
                {stats.expiryItems.map((item: any) => (
                  <li key={item.id} className="flex items-center justify-between bg-white p-2 rounded border border-red-200">
                    <span className="font-bold">{item.medicineName} (Batch {item.batchNumber})</span>
                    <span className="text-red-700 font-extrabold">Expires: {item.expiryDate}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-xs text-red-800">No medicines nearing expiration within 60 days.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
