import { useState, useEffect } from 'react';
import AppLayout from '../components/layout/AppLayout';
import StatusBadge from '../components/ui/StatusBadge';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';

const KpiCard = ({ title, value, subtitle, badge, badgeColor, icon, iconBg }) => (
  <div className="card flex items-start justify-between">
    <div>
      <p className="label">{title}</p>
      <p className="text-3xl font-bold text-[#1E293B] mt-1">{value}</p>
      <div className="flex items-center gap-2 mt-2">
        <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${badgeColor}`}>{badge}</span>
        {subtitle && <span className="text-xs text-[#94A3B8]">{subtitle}</span>}
      </div>
    </div>
    <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${iconBg}`}>
      {icon}
    </div>
  </div>
);

const DashboardPage = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [alerts, setAlerts] = useState([]);
  const [plans, setPlans] = useState([]);

  useEffect(() => {
    const load = async () => {
      try {
        const [statsRes, alertsRes, plansRes] = await Promise.all([
          api.get('/reports/summary').catch(() => ({ data: { data: {} } })),
          api.get('/inventory/alerts'),
          api.get('/daily-plans?limit=5'),
        ]);
        setStats(statsRes.data.data);
        setAlerts(alertsRes.data.data?.slice(0, 5) || []);
        setPlans(plansRes.data.data || []);
      } catch (e) {
        console.error(e);
      }
    };
    load();
  }, []);

  const now = new Date();
  const greeting = now.getHours() < 12 ? 'Good morning' : now.getHours() < 17 ? 'Good afternoon' : 'Good evening';

  return (
    <AppLayout breadcrumbs={['Dashboard']}>
      {/* Welcome */}
      <div className="mb-8">
        <h1 className="page-title">{greeting}, {user?.name?.split(' ')[0]} 👋</h1>
        <p className="page-subtitle">Here's what's happening in your logistics operations today.</p>
      </div>

      {/* KPI Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <KpiCard
          title="Total Active SKUs"
          value={stats?.inventory?.totalItems ?? '—'}
          badge="Inventory"
          badgeColor="bg-blue-100 text-blue-700"
          iconBg="bg-blue-50"
          icon={<svg className="w-6 h-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" /></svg>}
        />
        <KpiCard
          title="Low Stock Alerts"
          value={stats?.inventory?.lowStock ?? '—'}
          badge="Needs Action"
          badgeColor="bg-amber-100 text-amber-700"
          iconBg="bg-amber-50"
          icon={<svg className="w-6 h-6 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>}
        />
        <KpiCard
          title="Out of Stock"
          value={stats?.inventory?.outOfStock ?? '—'}
          badge="Critical"
          badgeColor="bg-red-100 text-red-700"
          iconBg="bg-red-50"
          icon={<svg className="w-6 h-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" /></svg>}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Stock Alerts */}
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-semibold text-[#1E293B]">Stock Alerts</h2>
            <a href="/inventory" className="text-xs text-[#1D4ED8] hover:underline font-medium">View all →</a>
          </div>
          {alerts.length === 0 ? (
            <p className="text-sm text-[#94A3B8] text-center py-6">All items are sufficiently stocked ✓</p>
          ) : (
            <div className="space-y-3">
              {alerts.map((item) => (
                <div key={item._id} className="flex items-center justify-between py-2.5 border-b border-[#F0F2F7] last:border-0">
                  <div>
                    <p className={`text-sm font-medium ${item.status === 'Out of Stock' ? 'text-red-600' : 'text-[#1E293B]'}`}>{item.name}</p>
                    <p className="text-xs text-[#94A3B8]">SKU: {item.sku} · Qty: {item.quantity} {item.unit}</p>
                  </div>
                  <StatusBadge status={item.status} />
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recent Plans */}
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-semibold text-[#1E293B]">Recent Daily Plans</h2>
            <a href="/planning" className="text-xs text-[#1D4ED8] hover:underline font-medium">View all →</a>
          </div>
          {plans.length === 0 ? (
            <p className="text-sm text-[#94A3B8] text-center py-6">No daily plans yet</p>
          ) : (
            <div className="space-y-3">
              {plans.map((plan) => (
                <div key={plan._id} className="flex items-center justify-between py-2.5 border-b border-[#F0F2F7] last:border-0">
                  <div>
                    <p className="text-sm font-medium text-[#1E293B]">{plan.planName}</p>
                    <p className="text-xs text-[#94A3B8]">
                      {new Date(plan.date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })} · {plan.studentCount} personnel
                    </p>
                  </div>
                  <StatusBadge status={plan.status} />
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </AppLayout>
  );
};

export default DashboardPage;
