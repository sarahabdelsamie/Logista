import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import AppLayout from '../../components/layout/AppLayout';
import StatusBadge from '../../components/ui/StatusBadge';
import Spinner from '../../components/ui/Spinner';
import Pagination from '../../components/ui/Pagination';
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
  const navigate = useNavigate();
  const { user } = useAuth();
  const LIMIT = 8;

  useEffect(() => {
    const fetch = async () => {
      setLoading(true);
      try {
        const res = await api.get('/daily-plans', { params: { status: statusFilter, page, limit: LIMIT } });
        setPlans(res.data.data);
        setTotal(res.data.total);
        setPages(res.data.pages);
      } catch { toast.error('Failed to load plans'); }
      finally { setLoading(false); }
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
    } catch { toast.error('Delete failed'); }
  };

  const handleApprove = async (id) => {
    try {
      await api.put(`/daily-plans/${id}`, { status: 'approved' });
      toast.success('Plan approved');
      setPlans((prev) => prev.map((p) => p._id === id ? { ...p, status: 'approved' } : p));
    } catch { toast.error('Approval failed'); }
  };

  const statusCounts = {
    draft: plans.filter(p => p.status === 'draft').length,
    submitted: plans.filter(p => p.status === 'submitted').length,
    approved: plans.filter(p => p.status === 'approved').length,
  };

  return (
    <AppLayout breadcrumbs={['Planning', 'Daily Plans']}>
      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="page-title">Daily Planning</h1>
          <p className="page-subtitle">Manage operational meal cycles, workforce allocation, and ingredient requirements.</p>
        </div>
        <button id="create-plan-btn" onClick={() => navigate('/planning/create')} className="btn-primary">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Create Daily Plan
        </button>
      </div>

      {/* Status KPIs */}
      <div className="grid grid-cols-3 gap-5 mb-6">
        {[
          { label: 'Draft Plans', count: statusCounts.draft, color: 'text-gray-600', bg: 'bg-gray-100', border: 'border-gray-200' },
          { label: 'Awaiting Approval', count: statusCounts.submitted, color: 'text-amber-700', bg: 'bg-amber-100', border: 'border-amber-200' },
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

      {/* Filter */}
      <div className="flex items-center gap-3 mb-4">
        {['', 'draft', 'submitted', 'approved'].map((s) => (
          <button
            key={s}
            onClick={() => { setStatusFilter(s); setPage(1); }}
            className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-colors ${
              statusFilter === s ? 'bg-[#1D4ED8] text-white' : 'bg-white border border-[#E2E8F0] text-[#64748B] hover:bg-gray-50'
            }`}
          >
            {s === '' ? 'All' : s.charAt(0).toUpperCase() + s.slice(1)}
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
          <p className="text-[#1E293B] font-semibold mb-1">No daily plans yet</p>
          <p className="text-sm text-[#64748B] mb-4">Create your first daily plan to get started.</p>
          <button onClick={() => navigate('/planning/create')} className="btn-primary mx-auto">Create Daily Plan</button>
        </div>
      ) : (
        <>
          <div className="space-y-4 mb-6">
            {plans.map((plan) => (
              <div key={plan._id} className="card hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-base font-semibold text-[#1E293B]">{plan.planName}</h3>
                      <StatusBadge status={plan.status} />
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs text-[#64748B]">
                      <div className="flex items-center gap-1.5">
                        <svg className="w-3.5 h-3.5 text-[#94A3B8]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                        {new Date(plan.date).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                      </div>
                      <div className="flex items-center gap-1.5">
                        <svg className="w-3.5 h-3.5 text-[#94A3B8]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                        {plan.studentCount} personnel
                      </div>
                      <div className="flex items-center gap-1.5">
                        <svg className="w-3.5 h-3.5 text-[#94A3B8]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        Est. ${plan.estimatedTotalCost?.toFixed(2) || '0.00'}
                      </div>
                      <div className="flex items-center gap-1.5">
                        <svg className="w-3.5 h-3.5 text-[#94A3B8]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                        </svg>
                        By {plan.createdBy?.name || 'Unknown'}
                      </div>
                    </div>
                    {plan.meals?.length > 0 && (
                      <div className="flex items-center gap-2 mt-3">
                        {plan.meals.map((meal) => (
                          <span key={meal._id} className="badge-blue">{meal.name || meal.category}</span>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 ml-4 flex-shrink-0">
                    {plan.status === 'submitted' && ['Admin', 'Mezz Manager'].includes(user?.role) && (
                      <button onClick={() => handleApprove(plan._id)} className="btn-primary py-1.5 text-xs">
                        ✓ Approve
                      </button>
                    )}
                    <button
                      onClick={() => navigate(`/planning/${plan._id}/edit`)}
                      className="btn-secondary py-1.5 text-xs"
                    >
                      Edit
                    </button>
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
    </AppLayout>
  );
};

export default PlanningOverviewPage;
