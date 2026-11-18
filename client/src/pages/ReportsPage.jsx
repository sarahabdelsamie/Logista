import { useState, useEffect } from 'react';
import AppLayout from '../components/layout/AppLayout';
import Spinner from '../components/ui/Spinner';
import api from '../services/api';
import toast from 'react-hot-toast';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from 'recharts';

const StatCard = ({ label, value, sub, color, icon }) => (
  <div className="card flex items-start justify-between">
    <div>
      <p className="label">{label}</p>
      <p className={`text-2xl font-bold mt-1 ${color || 'text-[#1E293B]'}`}>{value ?? '—'}</p>
      {sub && <p className="text-xs text-[#94A3B8] mt-1">{sub}</p>}
    </div>
    {icon && (
      <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center text-[#1D4ED8] flex-shrink-0">
        {icon}
      </div>
    )}
  </div>
);

const STATUS_COLORS = {
  pending: '#F59E0B',
  approved: '#22C55E',
  rejected: '#EF4444',
};

const ReportsPage = () => {
  const [summary, setSummary] = useState(null);
  const [valueData, setValueData] = useState(null);
  const [costTrend, setCostTrend] = useState([]);
  const [supplyStats, setSupplyStats] = useState(null);
  const [mealUsage, setMealUsage] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.get('/reports/summary').catch(() => null),
      api.get('/reports/inventory-value').catch(() => null),
      api.get('/reports/cost-trend').catch(() => null),
      api.get('/reports/supply-request-stats').catch(() => null),
      api.get('/reports/meal-usage').catch(() => null),
    ])
      .then(([sRes, vRes, cRes, srRes, mRes]) => {
        if (sRes?.data?.success) setSummary(sRes.data.data);
        if (vRes?.data?.success) setValueData(vRes.data.data);
        if (cRes?.data?.success) setCostTrend(cRes.data.data || []);
        if (srRes?.data?.success) setSupplyStats(srRes.data.data);
        if (mRes?.data?.success) setMealUsage(mRes.data.data || []);
      })
      .finally(() => setLoading(false));
  }, []);

  const downloadFile = async (url, filename) => {
    try {
      const res = await api.get(url, { responseType: 'blob' });
      const blob = new Blob([res.data], { type: 'text/csv' });
      const downloadUrl = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = downloadUrl;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      a.remove();
      toast.success(`${filename} downloaded`);
    } catch {
      toast.error('Download failed');
    }
  };

  if (loading) {
    return (
      <AppLayout breadcrumbs={['Reports']}>
        <div className="flex justify-center py-20"><Spinner size="lg" /></div>
      </AppLayout>
    );
  }

  // Format data for PieChart
  const supplyPieData = supplyStats
    ? [
        { name: 'Approved', value: supplyStats.approved || 0, color: STATUS_COLORS.approved },
        { name: 'Pending', value: supplyStats.pending || 0, color: STATUS_COLORS.pending },
        { name: 'Rejected', value: supplyStats.rejected || 0, color: STATUS_COLORS.rejected },
      ].filter((d) => d.value > 0)
    : [];

  return (
    <AppLayout breadcrumbs={['Reports & Monitoring']}>
      {/* Header with Export actions */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="page-title">Executive Reports & Analytics</h1>
          <p className="page-subtitle">Tactical logistics metrics, financial trends, supply throughput, and consumption patterns.</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => downloadFile('/reports/export/inventory-csv', 'LOGISTA-Inventory.csv')}
            className="btn-secondary text-xs"
            title="Export Excel/CSV"
          >
            <svg className="w-4 h-4 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
            Export Inventory (.CSV)
          </button>
          <button
            onClick={() => downloadFile('/reports/export/plans-csv', 'LOGISTA-DailyPlans.csv')}
            className="btn-secondary text-xs"
            title="Export Excel/CSV"
          >
            <svg className="w-4 h-4 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
            Export Plans (.CSV)
          </button>
          <button
            onClick={() => window.print()}
            className="btn-primary text-xs"
            title="Print / Save PDF"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
            </svg>
            Print / PDF
          </button>
        </div>
      </div>

      <div className="space-y-6">
        {/* KPI Summary Cards */}
        <div>
          <h2 className="text-xs font-semibold text-[#64748B] uppercase tracking-wide mb-3">Core Operational Metrics</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <StatCard
              label="Active SKUs"
              value={summary?.inventory?.totalItems}
              sub="Total tracked items"
              icon={<svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" /></svg>}
            />
            <StatCard
              label="Inventory Value"
              value={valueData ? `$${valueData.totalValue?.toLocaleString(undefined, { minimumFractionDigits: 2 })}` : '—'}
              sub="Asset valuation"
              color="text-[#1D4ED8]"
              icon={<svg className="w-5 h-5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>}
            />
            <StatCard
              label="Low Stock / Stockout"
              value={`${summary?.inventory?.lowStock || 0} / ${summary?.inventory?.outOfStock || 0}`}
              sub="Action required"
              color={summary?.inventory?.outOfStock > 0 ? 'text-red-600' : 'text-amber-600'}
              icon={<svg className="w-5 h-5 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>}
            />
            <StatCard
              label="Approved Plans"
              value={`${summary?.plans?.approvedPlans || 0} / ${summary?.plans?.totalPlans || 0}`}
              sub="Readiness rate"
              color="text-emerald-600"
              icon={<svg className="w-5 h-5 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>}
            />
          </div>
        </div>

        {/* Charts Row 1: Cost Trend & Supply Request Distribution */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Cost Trend Chart */}
          <div className="card lg:col-span-2">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-sm font-semibold text-[#1E293B]">Daily Planning Cost Progression ($)</h3>
                <p className="text-xs text-[#94A3B8]">Estimated meal planning budget requirements over time</p>
              </div>
              <span className="badge-blue text-xs font-semibold">Expenditure</span>
            </div>
            {costTrend.length === 0 ? (
              <div className="h-64 flex items-center justify-center text-sm text-[#94A3B8]">
                No cost trend data recorded yet.
              </div>
            ) : (
              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={costTrend} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#64748B' }} />
                    <YAxis tick={{ fontSize: 11, fill: '#64748B' }} />
                    <Tooltip
                      formatter={(val) => [`$${Number(val).toFixed(2)}`, 'Estimated Cost']}
                      labelFormatter={(label) => `Date: ${label}`}
                      contentStyle={{ backgroundColor: '#1E293B', borderRadius: '8px', color: '#FFF', fontSize: '12px' }}
                    />
                    <Bar dataKey="cost" fill="#1D4ED8" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>

          {/* Supply Requests Pie Chart */}
          <div className="card">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-sm font-semibold text-[#1E293B]">Supply Requests Status</h3>
                <p className="text-xs text-[#94A3B8]">Total requests: {supplyStats?.total || 0}</p>
              </div>
            </div>
            {supplyPieData.length === 0 ? (
              <div className="h-64 flex items-center justify-center text-sm text-[#94A3B8]">
                No supply requests to display.
              </div>
            ) : (
              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={supplyPieData}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      outerRadius={75}
                      innerRadius={45}
                      paddingAngle={4}
                    >
                      {supplyPieData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{ backgroundColor: '#1E293B', borderRadius: '8px', color: '#FFF', fontSize: '12px' }}
                    />
                    <Legend verticalAlign="bottom" height={36} wrapperStyle={{ fontSize: '11px' }} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>
        </div>

        {/* Charts Row 2: Most Planned Meals & Inventory Breakdown by Category */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Top Meals BarChart */}
          <div className="card">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-sm font-semibold text-[#1E293B]">Top Meal Profiles by Scheduled Frequency</h3>
                <p className="text-xs text-[#94A3B8]">Most utilized recipes across operational cycles</p>
              </div>
              <span className="badge-green text-xs font-semibold">Consumption</span>
            </div>
            {mealUsage.length === 0 ? (
              <div className="h-60 flex items-center justify-center text-sm text-[#94A3B8]">
                No meal scheduling history found.
              </div>
            ) : (
              <div className="h-60 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={mealUsage} layout="vertical" margin={{ top: 5, right: 20, left: 20, bottom: 5 }}>
                    <XAxis type="number" tick={{ fontSize: 11, fill: '#64748B' }} allowDecimals={false} />
                    <YAxis dataKey="name" type="category" width={90} tick={{ fontSize: 11, fill: '#1E293B' }} />
                    <Tooltip
                      formatter={(val) => [`${val} times`, 'Scheduled']}
                      contentStyle={{ backgroundColor: '#1E293B', borderRadius: '8px', color: '#FFF', fontSize: '12px' }}
                    />
                    <Bar dataKey="count" fill="#10B981" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>

          {/* Value by Category List */}
          <div className="card">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-sm font-semibold text-[#1E293B]">Valuation by Food Category</h3>
                <p className="text-xs text-[#94A3B8]">Capital allocation across rations & provisions</p>
              </div>
              <span className="text-xs font-bold text-[#1D4ED8]">
                Total: ${valueData?.totalValue?.toLocaleString(undefined, { minimumFractionDigits: 2 }) || '0.00'}
              </span>
            </div>
            {valueData?.byCategory && Object.keys(valueData.byCategory).length > 0 ? (
              <div className="space-y-3 max-h-60 overflow-y-auto pr-1">
                {Object.entries(valueData.byCategory)
                  .sort((a, b) => b[1] - a[1])
                  .map(([cat, val]) => {
                    const pct = valueData.totalValue ? (val / valueData.totalValue) * 100 : 0;
                    return (
                      <div key={cat}>
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-xs font-semibold text-[#1E293B]">{cat}</span>
                          <span className="text-xs text-[#1D4ED8] font-bold">
                            ${val.toFixed(2)} <span className="text-[10px] text-[#94A3B8] font-normal">({pct.toFixed(1)}%)</span>
                          </span>
                        </div>
                        <div className="h-2 bg-[#F0F2F7] rounded-full overflow-hidden">
                          <div className="h-full bg-[#1D4ED8] rounded-full transition-all duration-300" style={{ width: `${pct}%` }} />
                        </div>
                      </div>
                    );
                  })}
              </div>
            ) : (
              <div className="h-60 flex items-center justify-center text-sm text-[#94A3B8]">
                No inventory category data available.
              </div>
            )}
          </div>
        </div>
      </div>
    </AppLayout>
  );
};

export default ReportsPage;
