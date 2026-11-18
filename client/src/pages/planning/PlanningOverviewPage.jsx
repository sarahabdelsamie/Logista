import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import AppLayout from '../../components/layout/AppLayout';
import StatusBadge from '../../components/ui/StatusBadge';
import Spinner from '../../components/ui/Spinner';
import Pagination from '../../components/ui/Pagination';
import Modal from '../../components/ui/Modal';
import api from '../../services/api';
import toast from 'react-hot-toast';
import { useAuth } from '../../context/AuthContext';

const PlanningOverviewPage = () => {
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [pages, setPages] = useState(1);
  const [inspectPlan, setInspectPlan] = useState(null);
  const [inspectTab, setInspectTab] = useState('overview'); // 'overview' | 'ingredients' | 'workforce' | 'cost'
  const navigate = useNavigate();
  const { user } = useAuth();
  const LIMIT = 8;

  useEffect(() => {
    const fetch = async () => {
      setLoading(true);
      try {
        const res = await api.get('/daily-plans', { params: { status: statusFilter, page, limit: LIMIT } });
        setPlans(res.data?.data || []);
        setTotal(res.data?.total || 0);
        setPages(res.data?.pages || 1);
      } catch {
        toast.error('Failed to load plans');
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, [statusFilter, page]);

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this daily plan?')) return;
    try {
      await api.delete(`/daily-plans/${id}`);
      toast.success('Plan deleted');
      setPlans((prev) => prev.filter((p) => p._id !== id));
      setTotal((t) => t - 1);
    } catch {
      toast.error('Delete failed');
    }
  };

  const handleApprove = async (id) => {
    try {
      await api.put(`/daily-plans/${id}`, { status: 'approved' });
      toast.success('Plan approved & supply requisition generated');
      setPlans((prev) => prev.map((p) => (p._id === id ? { ...p, status: 'approved' } : p)));
    } catch {
      toast.error('Approval failed');
    }
  };

  const openInspectDashboard = async (planId) => {
    setInspectLoading(true);
    setInspectTab('overview');
    try {
      const res = await api.get(`/daily-plans/${planId}`);
      if (res.data?.success) {
        setInspectPlan(res.data.data);
      }
    } catch {
      toast.error('Failed to load plan details');
    } finally {
      setInspectLoading(false);
    }
  };

  const handleExportCSV = async () => {
    try {
      const res = await api.get('/reports/export/plans-csv', { responseType: 'blob' });
      const blob = new Blob([res.data], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'daily-plans-report.csv';
      document.body.appendChild(a);
      a.click();
      a.remove();
      toast.success('Plans exported to CSV');
    } catch {
      toast.error('Export failed');
    }
  };

  const statusCounts = {
    draft: plans.filter((p) => p.status === 'draft').length,
    submitted: plans.filter((p) => p.status === 'submitted').length,
    approved: plans.filter((p) => p.status === 'approved').length,
  };

  return (
    <AppLayout breadcrumbs={['Planning', 'Daily Plans Master']}>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="page-title">Daily Planning Operations</h1>
          <p className="page-subtitle">Configure meal rotations, calculate precise troop rations, and automate workforce assignments.</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button onClick={handleExportCSV} className="btn-secondary text-xs">
            <svg className="w-4 h-4 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
            Export Plans (.CSV)
          </button>
          {['Admin', 'Mezz Manager'].includes(user?.role) && (
            <button id="create-plan-btn" onClick={() => navigate('/planning/create')} className="btn-primary text-xs">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Create Daily Plan
            </button>
          )}
        </div>
      </div>

      {/* Status KPIs */}
      <div className="grid grid-cols-3 gap-5 mb-6">
        {[
          { label: 'Draft Plans', count: statusCounts.draft, color: 'text-gray-600', bg: 'bg-gray-100', border: 'border-gray-200' },
          { label: 'Awaiting Authorization', count: statusCounts.submitted, color: 'text-amber-700', bg: 'bg-amber-100', border: 'border-amber-200' },
          { label: 'Approved Plans', count: statusCounts.approved, color: 'text-green-700', bg: 'bg-green-100', border: 'border-green-200' },
        ].map(({ label, count, color, bg, border }) => (
          <div key={label} className={`card border ${border} flex items-center gap-4`}>
            <div className={`w-12 h-12 ${bg} rounded-xl flex items-center justify-center flex-shrink-0`}>
              <span className={`text-xl font-bold ${color}`}>{count}</span>
            </div>
            <div>
              <p className="text-xs font-semibold text-[#94A3B8] uppercase tracking-wide">{label}</p>
              <p className={`text-sm font-semibold ${color} mt-0.5`}>
                {count === 0 ? 'None' : `${count} plan${count !== 1 ? 's' : ''}`}
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 mb-4">
        {['', 'draft', 'submitted', 'approved'].map((s) => (
          <button
            key={s}
            onClick={() => { setStatusFilter(s); setPage(1); }}
            className={`px-4 py-1.5 rounded-lg text-xs font-semibold uppercase tracking-wider transition-all ${
              statusFilter === s ? 'bg-[#1D4ED8] text-white shadow-sm' : 'bg-white border border-[#E2E8F0] text-[#64748B] hover:bg-gray-50'
            }`}
          >
            {s === '' ? 'All Plans' : s}
          </button>
        ))}
        <span className="ml-auto text-xs text-[#94A3B8]">{total} total plan{total !== 1 ? 's' : ''}</span>
      </div>

      {/* Plans List */}
      {loading ? (
        <div className="flex justify-center py-20"><Spinner size="lg" /></div>
      ) : plans.length === 0 ? (
        <div className="card text-center py-20">
          <div className="text-4xl mb-4">📅</div>
          <p className="text-[#1E293B] font-semibold mb-1">No daily plans found</p>
          <p className="text-sm text-[#64748B] mb-4">Create your first daily plan to calculate ingredients and workforce requirements.</p>
          <button onClick={() => navigate('/planning/create')} className="btn-primary mx-auto">Create Daily Plan</button>
        </div>
      ) : (
        <>
          <div className="space-y-4 mb-6">
            {plans.map((plan) => (
              <div key={plan._id} className="card hover:shadow-md transition-shadow">
                <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-base font-bold text-[#1E293B]">{plan.planName}</h3>
                      <StatusBadge status={plan.status} />
                      <span className="badge-green text-[10px] font-semibold">{plan.budgetStatus}</span>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs text-[#64748B]">
                      <div className="flex items-center gap-1.5">
                        <svg className="w-3.5 h-3.5 text-[#94A3B8]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                        <span>{new Date(plan.date).toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <svg className="w-3.5 h-3.5 text-[#94A3B8]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                        <span className="font-semibold text-[#1E293B]">{plan.studentCount} troops</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <svg className="w-3.5 h-3.5 text-[#94A3B8]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <span className="font-bold text-[#1D4ED8]">${plan.estimatedTotalCost?.toFixed(2) || '0.00'}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <svg className="w-3.5 h-3.5 text-[#94A3B8]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                        </svg>
                        <span>By {plan.createdBy?.name || 'Officer'}</span>
                      </div>
                    </div>

                    {plan.meals?.length > 0 && (
                      <div className="flex flex-wrap items-center gap-2 mt-3">
                        {plan.meals.map((meal) => (
                          <span key={meal._id} className="badge-blue text-[11px] font-medium">
                            {meal.name || meal.category}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 flex-shrink-0 pt-2 md:pt-0 border-t md:border-t-0 border-[#E2E8F0]">
                    <button
                      onClick={() => openInspectDashboard(plan._id)}
                      className="btn-primary text-xs py-1.5 px-3"
                    >
                      Inspect Results
                    </button>
                    {plan.status === 'submitted' && ['Admin', 'Mezz Manager'].includes(user?.role) && (
                      <button onClick={() => handleApprove(plan._id)} className="btn-secondary text-xs py-1.5 px-3 text-emerald-700 hover:bg-emerald-50">
                        ✓ Approve
                      </button>
                    )}
                    {['Admin', 'Mezz Manager'].includes(user?.role) && (
                      <button
                        onClick={() => navigate(`/planning/${plan._id}/edit`)}
                        className="btn-secondary py-1.5 px-2.5 text-xs"
                      >
                        Edit
                      </button>
                    )}
                    {['Admin'].includes(user?.role) && (
                      <button onClick={() => handleDelete(plan._id)} className="p-1.5 rounded-lg hover:bg-red-50 text-red-400 hover:text-red-600">
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
          <div className="card p-0">
            <Pagination page={page} pages={pages} total={total} limit={LIMIT} onPageChange={setPage} />
          </div>
        </>
      )}

      {/* Results Dashboard & Core Engine Inspection Modal (Week 6 Gantt) */}
      <Modal isOpen={!!inspectPlan} onClose={() => setInspectPlan(null)} title={`Results Dashboard — ${inspectPlan?.planName}`}>
        {inspectPlan && (
          <div className="space-y-4">
            {/* Modal Tabs */}
            <div className="flex items-center gap-2 border-b border-[#E2E8F0] pb-2 text-xs font-semibold">
              <button
                onClick={() => setInspectTab('overview')}
                className={`px-3 py-1.5 rounded-lg transition-all ${inspectTab === 'overview' ? 'bg-[#1D4ED8] text-white' : 'text-[#64748B] hover:bg-gray-100'}`}
              >
                1. Results Overview
              </button>
              <button
                onClick={() => setInspectTab('ingredients')}
                className={`px-3 py-1.5 rounded-lg transition-all ${inspectTab === 'ingredients' ? 'bg-[#1D4ED8] text-white' : 'text-[#64748B] hover:bg-gray-100'}`}
              >
                2. Stock Availability
              </button>
              <button
                onClick={() => setInspectTab('workforce')}
                className={`px-3 py-1.5 rounded-lg transition-all ${inspectTab === 'workforce' ? 'bg-[#1D4ED8] text-white' : 'text-[#64748B] hover:bg-gray-100'}`}
              >
                3. Workforce Screen
              </button>
              <button
                onClick={() => setInspectTab('cost')}
                className={`px-3 py-1.5 rounded-lg transition-all ${inspectTab === 'cost' ? 'bg-[#1D4ED8] text-white' : 'text-[#64748B] hover:bg-gray-100'}`}
              >
                4. Cost Analysis
              </button>
            </div>

            {inspectTab === 'overview' && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  <div className="p-3 bg-[#F8FAFC] rounded-lg border border-[#E2E8F0]">
                    <span className="text-[10px] uppercase font-bold text-[#94A3B8] block">Troops Count</span>
                    <span className="text-xl font-bold text-[#1E293B]">{inspectPlan.studentCount}</span>
                  </div>
                  <div className="p-3 bg-[#F8FAFC] rounded-lg border border-[#E2E8F0]">
                    <span className="text-[10px] uppercase font-bold text-[#94A3B8] block">Total Budget</span>
                    <span className="text-xl font-bold text-[#1D4ED8]">${inspectPlan.estimatedTotalCost?.toFixed(2)}</span>
                  </div>
                  <div className="p-3 bg-[#F8FAFC] rounded-lg border border-[#E2E8F0]">
                    <span className="text-[10px] uppercase font-bold text-[#94A3B8] block">Budget Status</span>
                    <StatusBadge status={inspectPlan.budgetStatus} />
                  </div>
                  <div className="p-3 bg-[#F8FAFC] rounded-lg border border-[#E2E8F0]">
                    <span className="text-[10px] uppercase font-bold text-[#94A3B8] block">Plan Workflow</span>
                    <StatusBadge status={inspectPlan.status} />
                  </div>
                </div>

                <div>
                  <span className="label">Scheduled Meals for Cycle</span>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {(inspectPlan.meals || []).map((m) => (
                      <div key={m._id} className="p-3 bg-[#F8FAFC] rounded-lg border border-[#E2E8F0] flex items-center justify-between">
                        <div>
                          <p className="text-xs font-bold text-[#1E293B]">{m.name}</p>
                          <p className="text-[10px] text-[#94A3B8]">{m.category} • {m.estimatedCalories || '—'} kcal</p>
                        </div>
                        <span className="text-xs font-semibold text-[#1D4ED8]">${m.estimatedCostPerStudent?.toFixed(2)}/troop</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {inspectTab === 'ingredients' && (
              <div className="space-y-3">
                <p className="text-xs text-[#64748B]">Automated ingredient explosion & inventory feasibility check:</p>
                <div className="max-h-64 overflow-y-auto border border-[#E2E8F0] rounded-lg divide-y divide-[#E2E8F0]">
                  {(inspectPlan.ingredientRequirements || []).map((it, idx) => (
                    <div key={idx} className="p-3 flex items-center justify-between text-xs hover:bg-[#F8FAFC]">
                      <div>
                        <p className="font-semibold text-[#1E293B]">{it.itemId?.name || 'Ingredient'}</p>
                        <p className="text-[10px] text-[#94A3B8]">SKU: {it.itemId?.sku || 'N/A'}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-[#1D4ED8]">
                          {it.totalQty?.toFixed(2)} {it.unit}
                        </p>
                        <span className="badge-green text-[10px]">Calculated Ration</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {inspectTab === 'workforce' && (
              <div className="space-y-4">
                <div className="p-4 bg-[#1D4ED8] text-white rounded-xl">
                  <p className="text-xs text-blue-200 uppercase font-semibold">Total Assigned Mess Personnel</p>
                  <p className="text-3xl font-bold mt-1">
                    {(inspectPlan.workforceRequirements?.kitchen || 0) +
                      (inspectPlan.workforceRequirements?.distribution || 0) +
                      (inspectPlan.workforceRequirements?.cleaning || 0)}{' '}
                    Troops
                  </p>
                  <p className="text-xs text-blue-100 mt-1">Sized automatically for {inspectPlan.studentCount} diners</p>
                </div>

                <div className="grid grid-cols-3 gap-3 text-center">
                  <div className="card p-4">
                    <p className="text-2xl font-bold text-[#1E293B]">{inspectPlan.workforceRequirements?.kitchen || 0}</p>
                    <p className="text-xs font-semibold text-[#64748B] uppercase mt-1">Kitchen Cooks</p>
                    <span className="text-[10px] text-[#94A3B8]">Prep & Hot Line</span>
                  </div>
                  <div className="card p-4">
                    <p className="text-2xl font-bold text-[#1E293B]">{inspectPlan.workforceRequirements?.distribution || 0}</p>
                    <p className="text-xs font-semibold text-[#64748B] uppercase mt-1">Distribution Staff</p>
                    <span className="text-[10px] text-[#94A3B8]">Mess Hall Serving</span>
                  </div>
                  <div className="card p-4">
                    <p className="text-2xl font-bold text-[#1E293B]">{inspectPlan.workforceRequirements?.cleaning || 0}</p>
                    <p className="text-xs font-semibold text-[#64748B] uppercase mt-1">Sanitation & Dish</p>
                    <span className="text-[10px] text-[#94A3B8]">Clean-down Ops</span>
                  </div>
                </div>
              </div>
            )}

            {inspectTab === 'cost' && (
              <div className="space-y-4">
                <div className="p-4 bg-[#1B2A4A] text-white rounded-xl">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs text-[#94A3B8] uppercase font-semibold">Total Estimated Cost</p>
                      <p className="text-3xl font-bold mt-1">${inspectPlan.estimatedTotalCost?.toFixed(2)}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-[#94A3B8]">Per Troop Cost</p>
                      <p className="text-xl font-bold text-emerald-400">
                        ${(inspectPlan.estimatedTotalCost / (inspectPlan.studentCount || 1)).toFixed(2)}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="space-y-2 text-xs">
                  <div className="flex justify-between p-2.5 bg-[#F8FAFC] rounded-lg">
                    <span className="text-[#64748B]">Food & Ingredients Base</span>
                    <span className="font-semibold text-[#1E293B]">${inspectPlan.estimatedTotalCost?.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between p-2.5 bg-[#F8FAFC] rounded-lg">
                    <span className="text-[#64748B]">Estimated Packaging & Consumables</span>
                    <span className="font-semibold text-[#1E293B]">${(inspectPlan.studentCount * 0.45).toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between p-2.5 bg-blue-50 text-blue-900 rounded-lg font-bold">
                    <span>Total Projected Allocation</span>
                    <span>${(inspectPlan.estimatedTotalCost + inspectPlan.studentCount * 0.45).toFixed(2)}</span>
                  </div>
                </div>
              </div>
            )}

            <div className="flex gap-2 pt-2 border-t border-[#E2E8F0]">
              <button
                onClick={() => window.print()}
                className="btn-secondary text-xs flex-1 justify-center"
              >
                Print Breakdown
              </button>
              <button
                onClick={() => setInspectPlan(null)}
                className="btn-primary text-xs flex-1 justify-center"
              >
                Close Dashboard
              </button>
            </div>
          </div>
        )}
      </Modal>
    </AppLayout>
  );
};

export default PlanningOverviewPage;
