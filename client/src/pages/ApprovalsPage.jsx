import { useState, useEffect, useCallback } from 'react';
import AppLayout from '../components/layout/AppLayout';
import StatusBadge from '../components/ui/StatusBadge';
import Spinner from '../components/ui/Spinner';
import Modal from '../components/ui/Modal';
import api from '../services/api';
import toast from 'react-hot-toast';

const ApprovalsPage = () => {
  const [plans, setPlans] = useState([]);
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('plans'); // 'plans' | 'requests'
  const [selectedReq, setSelectedReq] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);

  const fetchPendingData = useCallback(async () => {
    setLoading(true);
    try {
      const [plansRes, requestsRes] = await Promise.all([
        api.get('/daily-plans?status=submitted&limit=50'),
        api.get('/supply-requests'),
      ]);

      setPlans(plansRes.data?.data || []);
      const pendingReqs = (requestsRes.data?.data || []).filter((r) => r.status === 'pending');
      setRequests(pendingReqs);
    } catch {
      toast.error('Failed to load pending approvals');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPendingData();
  }, [fetchPendingData]);

  const handleApprovePlan = async (planId) => {
    setActionLoading(true);
    try {
      await api.put(`/daily-plans/${planId}`, { status: 'approved' });
      toast.success('Daily plan approved & supply request auto-generated');
      setPlans((prev) => prev.filter((p) => p._id !== planId));
      setSelectedPlan(null);
      // Re-fetch to see any newly generated supply requests
      fetchPendingData();
    } catch {
      toast.error('Failed to approve daily plan');
    } finally {
      setActionLoading(false);
    }
  };

  const handleRejectPlan = async (planId) => {
    setActionLoading(true);
    try {
      await api.put(`/daily-plans/${planId}`, { status: 'draft' });
      toast.success('Daily plan reverted to draft');
      setPlans((prev) => prev.filter((p) => p._id !== planId));
      setSelectedPlan(null);
    } catch {
      toast.error('Failed to revert daily plan');
    } finally {
      setActionLoading(false);
    }
  };

  const handleApproveRequest = async (requestId) => {
    setActionLoading(true);
    try {
      await api.put(`/supply-requests/${requestId}`, { status: 'approved' });
      toast.success('Supply request approved');
      setRequests((prev) => prev.filter((r) => r._id !== requestId));
      setSelectedReq(null);
    } catch {
      toast.error('Failed to approve supply request');
    } finally {
      setActionLoading(false);
    }
  };

  const handleRejectRequest = async (requestId) => {
    setActionLoading(true);
    try {
      await api.put(`/supply-requests/${requestId}`, { status: 'rejected' });
      toast.success('Supply request rejected');
      setRequests((prev) => prev.filter((r) => r._id !== requestId));
      setSelectedReq(null);
    } catch {
      toast.error('Failed to reject supply request');
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <AppLayout breadcrumbs={['Workflow', 'Approvals Center']}>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="page-title">Command Approval Center</h1>
          <p className="page-subtitle">Centralized authorization station for operational meal plans and inventory supply requests.</p>
        </div>
        <div className="flex items-center gap-2">
          <span className="badge-blue text-xs font-semibold px-3 py-1">
            {plans.length + requests.length} Total Pending Actions
          </span>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-3 border-b border-[#E2E8F0] mb-6">
        <button
          onClick={() => setActiveTab('plans')}
          className={`pb-3 text-sm font-semibold flex items-center gap-2 border-b-2 transition-all ${
            activeTab === 'plans'
              ? 'border-[#1D4ED8] text-[#1D4ED8]'
              : 'border-transparent text-[#64748B] hover:text-[#1E293B]'
          }`}
        >
          <span>Daily Meal Plans</span>
          <span className={`text-xs px-2 py-0.5 rounded-full ${activeTab === 'plans' ? 'bg-blue-100 text-[#1D4ED8]' : 'bg-gray-100 text-[#64748B]'}`}>
            {plans.length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('requests')}
          className={`pb-3 text-sm font-semibold flex items-center gap-2 border-b-2 transition-all ${
            activeTab === 'requests'
              ? 'border-[#1D4ED8] text-[#1D4ED8]'
              : 'border-transparent text-[#64748B] hover:text-[#1E293B]'
          }`}
        >
          <span>Supply Requisitions</span>
          <span className={`text-xs px-2 py-0.5 rounded-full ${activeTab === 'requests' ? 'bg-blue-100 text-[#1D4ED8]' : 'bg-gray-100 text-[#64748B]'}`}>
            {requests.length}
          </span>
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center py-20"><Spinner size="lg" /></div>
      ) : activeTab === 'plans' ? (
        plans.length === 0 ? (
          <div className="card text-center py-16">
            <div className="text-4xl mb-3">✅</div>
            <p className="text-[#1E293B] font-semibold">All daily plans are up to date</p>
            <p className="text-sm text-[#94A3B8] mt-1">No meal plans currently submitted for authorization.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {plans.map((plan) => (
              <div key={plan._id} className="card hover:shadow-md transition-shadow">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-1.5">
                      <h3 className="text-base font-bold text-[#1E293B]">{plan.planName}</h3>
                      <StatusBadge status={plan.status} />
                      <span className="text-xs text-[#94A3B8]">
                        Submitted {new Date(plan.createdAt).toLocaleDateString()}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs text-[#64748B] mt-2">
                      <div>
                        <span className="text-[#94A3B8] block text-[10px] uppercase font-semibold">Planned Date</span>
                        <span className="font-medium text-[#1E293B]">
                          {new Date(plan.date).toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}
                        </span>
                      </div>
                      <div>
                        <span className="text-[#94A3B8] block text-[10px] uppercase font-semibold">Personnel</span>
                        <span className="font-medium text-[#1E293B]">{plan.studentCount} troops</span>
                      </div>
                      <div>
                        <span className="text-[#94A3B8] block text-[10px] uppercase font-semibold">Estimated Cost</span>
                        <span className="font-bold text-[#1D4ED8]">${plan.estimatedTotalCost?.toFixed(2) || '0.00'}</span>
                      </div>
                      <div>
                        <span className="text-[#94A3B8] block text-[10px] uppercase font-semibold">Created By</span>
                        <span className="font-medium text-[#1E293B]">{plan.createdBy?.name || 'Logistics Officer'}</span>
                      </div>
                    </div>

                    {plan.meals?.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 mt-3">
                        {plan.meals.map((m) => (
                          <span key={m._id} className="badge-blue text-[11px]">
                            {m.name || m.category}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-2 flex-shrink-0 pt-2 md:pt-0 border-t md:border-t-0 border-[#E2E8F0]">
                    <button
                      onClick={() => handleApprovePlan(plan._id)}
                      disabled={actionLoading}
                      className="btn-primary text-xs py-2 px-3.5"
                    >
                      ✓ Approve Plan
                    </button>
                    <button
                      onClick={() => handleRejectPlan(plan._id)}
                      disabled={actionLoading}
                      className="btn-secondary text-xs py-2 px-3 text-red-600 hover:bg-red-50"
                    >
                      Return to Draft
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )
      ) : requests.length === 0 ? (
        <div className="card text-center py-16">
          <div className="text-4xl mb-3">✅</div>
          <p className="text-[#1E293B] font-semibold">No pending supply requisitions</p>
          <p className="text-sm text-[#94A3B8] mt-1">All supply orders have been reviewed and approved.</p>
        </div>
      ) : (
        <div className="card p-0 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="table-header">
                <tr>
                  <th className="px-6 py-3.5 text-left">Requisition Source</th>
                  <th className="px-6 py-3.5 text-left">Requester</th>
                  <th className="px-6 py-3.5 text-left">Items Count</th>
                  <th className="px-6 py-3.5 text-left">Submission Date</th>
                  <th className="px-6 py-3.5 text-right">Decision</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E2E8F0]">
                {requests.map((req) => (
                  <tr key={req._id} className="hover:bg-[#F8FAFC]">
                    <td className="px-6 py-4">
                      <p className="text-sm font-semibold text-[#1E293B]">
                        {req.dailyPlanId?.planName || 'Manual Request'}
                      </p>
                      {req.notes && <p className="text-xs text-[#94A3B8]">{req.notes}</p>}
                    </td>
                    <td className="px-6 py-4 text-xs font-medium text-[#1E293B]">
                      {req.requestedBy?.name || 'Staff'}
                    </td>
                    <td className="px-6 py-4">
                      <button
                        onClick={() => setSelectedReq(req)}
                        className="badge-blue text-xs font-semibold hover:bg-blue-200 cursor-pointer"
                      >
                        {req.items?.length || 0} items (inspect)
                      </button>
                    </td>
                    <td className="px-6 py-4 text-xs text-[#94A3B8]">
                      {new Date(req.createdAt).toLocaleString()}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => handleApproveRequest(req._id)}
                          disabled={actionLoading}
                          className="btn-primary text-xs py-1.5 px-3"
                        >
                          Approve
                        </button>
                        <button
                          onClick={() => handleRejectRequest(req._id)}
                          disabled={actionLoading}
                          className="btn-danger text-xs py-1.5 px-3"
                        >
                          Reject
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Inspect Request Modal */}
      <Modal isOpen={!!selectedReq} onClose={() => setSelectedReq(null)} title="Inspect Supply Requisition">
        {selectedReq && (
          <div className="space-y-4">
            <div className="p-3 bg-[#F8FAFC] rounded-lg text-xs space-y-1">
              <p><strong>Source:</strong> {selectedReq.dailyPlanId?.planName || 'Direct Request'}</p>
              <p><strong>Requester:</strong> {selectedReq.requestedBy?.name}</p>
              <p><strong>Submitted:</strong> {new Date(selectedReq.createdAt).toLocaleString()}</p>
            </div>

            <div>
              <p className="label">Itemized Breakdown</p>
              <div className="max-h-56 overflow-y-auto border border-[#E2E8F0] rounded-lg divide-y divide-[#E2E8F0]">
                {(selectedReq.items || []).map((it, idx) => (
                  <div key={idx} className="flex items-center justify-between p-3 text-xs">
                    <div>
                      <p className="font-semibold text-[#1E293B]">{it.itemId?.name || 'Supply Item'}</p>
                      <p className="text-[10px] text-[#94A3B8]">SKU: {it.itemId?.sku || 'N/A'}</p>
                    </div>
                    <div>
                      <span className="font-bold text-sm text-[#1D4ED8]">{it.quantity}</span>
                      <span className="text-[#64748B] ml-1">{it.itemId?.unit || 'units'}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex gap-2 pt-2">
              <button
                onClick={() => handleApproveRequest(selectedReq._id)}
                className="btn-primary flex-1 justify-center"
              >
                Approve Requisition
              </button>
              <button
                onClick={() => handleRejectRequest(selectedReq._id)}
                className="btn-danger flex-1 justify-center"
              >
                Reject Requisition
              </button>
            </div>
          </div>
        )}
      </Modal>
    </AppLayout>
  );
};

export default ApprovalsPage;
