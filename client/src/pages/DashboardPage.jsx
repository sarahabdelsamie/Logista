import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import AppLayout from '../components/layout/AppLayout';
import StatusBadge from '../components/ui/StatusBadge';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';

const KpiCard = ({ title, value, subtitle, badge, badgeColor, icon, iconBg, onClick }) => (
  <div
    onClick={onClick}
    className={`card flex items-start justify-between ${onClick ? 'cursor-pointer hover:shadow-md transition-shadow' : ''}`}
  >
    <div>
      <p className="label">{title}</p>
      <p className="text-3xl font-bold text-[#1E293B] mt-1">{value}</p>
      <div className="flex items-center gap-2 mt-2">
        <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${badgeColor}`}>{badge}</span>
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
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [alerts, setAlerts] = useState([]);
  const [plans, setPlans] = useState([]);
  const [notifications, setNotifications] = useState([]);

  useEffect(() => {
    const load = async () => {
      try {
        const [statsRes, alertsRes, plansRes, notifRes] = await Promise.all([
          api.get('/reports/summary').catch(() => ({ data: { data: {} } })),
          api.get('/inventory/alerts').catch(() => ({ data: { data: [] } })),
          api.get('/daily-plans?limit=5').catch(() => ({ data: { data: [] } })),
          api.get('/notifications').catch(() => ({ data: { data: [] } })),
        ]);
        setStats(statsRes.data?.data || {});
        setAlerts(alertsRes.data?.data?.slice(0, 5) || []);
        setPlans(plansRes.data?.data || []);
        setNotifications((notifRes.data?.data || []).slice(0, 4));
      } catch (e) {
        console.error(e);
      }
    };
    load();
  }, []);

  const now = new Date();
  const greeting = now.getHours() < 12 ? 'Good morning' : now.getHours() < 17 ? 'Good afternoon' : 'Good evening';

  const pendingApprovalsCount = (plans || []).filter((p) => p.status === 'submitted').length;

  return (
    <AppLayout breadcrumbs={['Dashboard']}>
      {/* Welcome Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
        <div>
          <h1 className="page-title">{greeting}, {user?.rank ? `${user.rank} ` : ''}{user?.name?.split(' ')[0]} 👋</h1>
          <p className="page-subtitle">Tactical Military Mess Overview • {user?.unit || 'HQ Command Battalion'}</p>
        </div>
        <div className="flex items-center gap-2">
          {['Admin', 'Mezz Manager'].includes(user?.role) && (
            <button onClick={() => navigate('/planning/create')} className="btn-primary text-xs">
              + New Daily Plan
            </button>
          )}
          {['Admin', 'Store Keeper'].includes(user?.role) && (
            <button onClick={() => navigate('/inventory')} className="btn-secondary text-xs">
              Stock Operations
            </button>
          )}
        </div>
      </div>

      {/* KPI Row (4 Cards) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
        <KpiCard
          title="Active Provisions"
          value={stats?.inventory?.totalItems ?? '—'}
          badge="Inventory"
          badgeColor="bg-blue-100 text-blue-700"
          subtitle="Tracked SKUs"
          iconBg="bg-blue-50"
          onClick={() => navigate('/inventory')}
          icon={<svg className="w-6 h-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" /></svg>}
        />
        <KpiCard
          title="Stock Shortages"
          value={stats?.inventory?.lowStock ?? alerts.length}
          badge="Attention"
          badgeColor="bg-amber-100 text-amber-700"
          subtitle="Low threshold"
          iconBg="bg-amber-50"
          onClick={() => navigate('/inventory')}
          icon={<svg className="w-6 h-6 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>}
        />
        <KpiCard
          title="Published Meals"
          value={stats?.meals?.totalMeals ?? '—'}
          badge="Menu Recipes"
          badgeColor="bg-emerald-100 text-emerald-700"
          subtitle="Active profiles"
          iconBg="bg-emerald-50"
          onClick={() => navigate('/meals')}
          icon={<svg className="w-6 h-6 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" /></svg>}
        />
        <KpiCard
          title="Awaiting Approval"
          value={pendingApprovalsCount}
          badge="Workflow"
          badgeColor={pendingApprovalsCount > 0 ? 'bg-purple-100 text-purple-700' : 'bg-gray-100 text-gray-700'}
          subtitle="Daily cycles"
          iconBg="bg-purple-50"
          onClick={() => navigate('/approvals')}
          icon={<svg className="w-6 h-6 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Stock Alerts */}
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-semibold text-[#1E293B]">Stock Alerts & Shortages</h2>
            <button onClick={() => navigate('/inventory')} className="text-xs text-[#1D4ED8] hover:underline font-semibold">View all →</button>
          </div>
          {alerts.length === 0 ? (
            <p className="text-sm text-[#94A3B8] text-center py-8">All items are sufficiently stocked ✓</p>
          ) : (
            <div className="space-y-3">
              {alerts.map((item) => (
                <div key={item._id} className="flex items-center justify-between py-2 border-b border-[#F0F2F7] last:border-0">
                  <div>
                    <p className={`text-sm font-semibold ${item.status === 'Out of Stock' ? 'text-red-600' : 'text-[#1E293B]'}`}>{item.name}</p>
                    <p className="text-xs text-[#94A3B8]">SKU: {item.sku} · Qty: {item.quantity} {item.unit}</p>
                  </div>
                  <StatusBadge status={item.status} />
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recent Daily Plans */}
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-semibold text-[#1E293B]">Recent Daily Plans</h2>
            <button onClick={() => navigate('/planning')} className="text-xs text-[#1D4ED8] hover:underline font-semibold">View all →</button>
          </div>
          {plans.length === 0 ? (
            <p className="text-sm text-[#94A3B8] text-center py-8">No daily plans scheduled yet</p>
          ) : (
            <div className="space-y-3">
              {plans.slice(0, 5).map((plan) => (
                <div key={plan._id} className="flex items-center justify-between py-2 border-b border-[#F0F2F7] last:border-0">
                  <div>
                    <p className="text-sm font-semibold text-[#1E293B]">{plan.planName}</p>
                    <p className="text-xs text-[#94A3B8]">
                      {new Date(plan.date).toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' })} · {plan.studentCount} troops
                    </p>
                  </div>
                  <StatusBadge status={plan.status} />
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Live Operational Notifications */}
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-semibold text-[#1E293B]">Live Activity Feed</h2>
            <span className="badge-blue text-[10px] font-semibold">Broadcasts</span>
          </div>
          {notifications.length === 0 ? (
            <p className="text-sm text-[#94A3B8] text-center py-8">No recent alerts recorded</p>
          ) : (
            <div className="space-y-3">
              {notifications.map((n) => (
                <div key={n._id} className="flex items-start gap-2.5 py-2 border-b border-[#F0F2F7] last:border-0 text-xs">
                  <span className={`w-2 h-2 rounded-full mt-1.5 flex-shrink-0 ${
                    n.type === 'alert' ? 'bg-red-500' : n.type === 'warning' ? 'bg-amber-500' : 'bg-blue-600'
                  }`} />
                  <div>
                    <p className="text-[#1E293B] font-medium leading-tight">{n.message}</p>
                    <p className="text-[10px] text-[#94A3B8] mt-0.5">
                      {new Date(n.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
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
