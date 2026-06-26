import { useState, useEffect } from 'react';
import AppLayout from '../components/layout/AppLayout';
import Spinner from '../components/ui/Spinner';
import api from '../services/api';

const StatCard = ({ label, value, sub, color }) => (
  <div className="card">
    <p className="label">{label}</p>
    <p className={`text-3xl font-bold mt-1 ${color || 'text-[#1E293B]'}`}>{value ?? '—'}</p>
    {sub && <p className="text-xs text-[#94A3B8] mt-1">{sub}</p>}
  </div>
);

const ReportsPage = () => {
  const [summary, setSummary] = useState(null);
  const [value, setValue] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.get('/reports/summary').catch(() => null),
      api.get('/reports/inventory-value').catch(() => null),
    ]).then(([sRes, vRes]) => {
      if (sRes) setSummary(sRes.data.data);
      if (vRes) setValue(vRes.data.data);
    }).finally(() => setLoading(false));
  }, []);

  if (loading) return <AppLayout breadcrumbs={['Reports']}><div className="flex justify-center py-20"><Spinner size="lg" /></div></AppLayout>;

  return (
    <AppLayout breadcrumbs={['Reports']}>
      <div className="mb-6">
        <h1 className="page-title">Reports & Analytics</h1>
        <p className="page-subtitle">System-wide operational summary and logistics metrics.</p>
      </div>

      <div className="space-y-6">
        <div>
          <h2 className="text-sm font-semibold text-[#64748B] uppercase tracking-wide mb-3">Inventory Overview</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <StatCard label="Total SKUs" value={summary?.inventory?.totalItems} />
            <StatCard label="Low Stock" value={summary?.inventory?.lowStock} color="text-amber-600" />
            <StatCard label="Out of Stock" value={summary?.inventory?.outOfStock} color="text-red-600" />
            <StatCard label="Total Inventory Value" value={value ? `$${value.totalValue?.toLocaleString()}` : '—'} color="text-[#1D4ED8]" />
          </div>
        </div>

        <div>
          <h2 className="text-sm font-semibold text-[#64748B] uppercase tracking-wide mb-3">Meals & Planning</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <StatCard label="Published Meals" value={summary?.meals?.totalMeals} />
            <StatCard label="Total Plans" value={summary?.plans?.totalPlans} />
            <StatCard label="Approved Plans" value={summary?.plans?.approvedPlans} color="text-green-600" />
          </div>
        </div>

        {value?.byCategory && Object.keys(value.byCategory).length > 0 && (
          <div>
            <h2 className="text-sm font-semibold text-[#64748B] uppercase tracking-wide mb-3">Inventory Value by Category</h2>
            <div className="card">
              <div className="space-y-3">
                {Object.entries(value.byCategory)
                  .sort((a, b) => b[1] - a[1])
                  .map(([cat, val]) => {
                    const pct = value.totalValue ? (val / value.totalValue) * 100 : 0;
                    return (
                      <div key={cat}>
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-sm text-[#1E293B] font-medium">{cat}</span>
                          <span className="text-sm text-[#1D4ED8] font-semibold">${val.toFixed(2)}</span>
                        </div>
                        <div className="h-2 bg-[#F0F2F7] rounded-full overflow-hidden">
                          <div className="h-full bg-[#1D4ED8] rounded-full" style={{ width: `${pct}%` }} />
                        </div>
                      </div>
                    );
                  })}
              </div>
            </div>
          </div>
        )}
      </div>
    </AppLayout>
  );
};

export default ReportsPage;
