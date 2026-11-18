import { useState, useEffect, useCallback } from 'react';
import AppLayout from '../components/layout/AppLayout';
import StatusBadge from '../components/ui/StatusBadge';
import Spinner from '../components/ui/Spinner';
import Modal from '../components/ui/Modal';
import api from '../services/api';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';

const SupplyRequestsPage = () => {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');
  const [selectedReq, setSelectedReq] = useState(null);
  const [inventoryItems, setInventoryItems] = useState([]);
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [newRequestItems, setNewRequestItems] = useState([{ itemId: '', quantity: 1 }]);
  const [newRequestNotes, setNewRequestNotes] = useState('');
  const [savingReq, setSavingReq] = useState(false);
  const { user } = useAuth();

  const fetchRequests = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get('/supply-requests');
      setRequests(res.data?.data || []);
    } catch {
      toast.error('Failed to load supply requests');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchRequests();
    api.get('/inventory?limit=100').then((res) => {
      setInventoryItems(res.data?.data || []);
    }).catch(() => {});
  }, [fetchRequests]);

  const handleStatusChange = async (id, status) => {
    try {
      await api.put(`/supply-requests/${id}`, { status });
      setRequests((prev) =>
        prev.map((r) => (r._id === id ? { ...r, status, reviewedBy: { name: user.name } } : r))
      );
      toast.success(`Request ${status}`);
      if (selectedReq?._id === id) {
        setSelectedReq((prev) => ({ ...prev, status }));
      }
    } catch {
      toast.error('Update failed');
    }
  };

  const handleAddItemRow = () => {
    setNewRequestItems((prev) => [...prev, { itemId: '', quantity: 1 }]);
  };

  const handleRemoveItemRow = (idx) => {
    setNewRequestItems((prev) => prev.filter((_, i) => i !== idx));
  };

  const handleCreateRequest = async (e) => {
    e.preventDefault();
    const validItems = newRequestItems.filter((i) => i.itemId && i.quantity > 0);
    if (!validItems.length) {
      return toast.error('Please add at least one valid inventory item');
    }

    setSavingReq(true);
    try {
      await api.post('/supply-requests', {
        items: validItems,
        notes: newRequestNotes,
      });
      toast.success('Supply request created');
      setCreateModalOpen(false);
      setNewRequestItems([{ itemId: '', quantity: 1 }]);
      setNewRequestNotes('');
      fetchRequests();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to create request');
    } finally {
      setSavingReq(false);
    }
  };

  const filteredRequests = statusFilter
    ? requests.filter((r) => r.status?.toLowerCase() === statusFilter.toLowerCase())
    : requests;

  const counts = {
    total: requests.length,
    pending: requests.filter((r) => r.status === 'pending').length,
    approved: requests.filter((r) => r.status === 'approved').length,
    rejected: requests.filter((r) => r.status === 'rejected').length,
  };

  return (
    <AppLayout breadcrumbs={['Supply Requests & Tracking']}>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="page-title">Supply Requests & Stock Fulfillment</h1>
          <p className="page-subtitle">Track requisition orders, verify inventory allotments, and manage distribution workflows.</p>
        </div>
        <button
          onClick={() => setCreateModalOpen(true)}
          className="btn-primary"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          New Requisition
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="card border-l-4 border-l-blue-600">
          <p className="label">Total Requisitions</p>
          <p className="text-2xl font-bold text-[#1E293B] mt-1">{counts.total}</p>
          <span className="text-xs text-[#94A3B8]">All records</span>
        </div>
        <div className="card border-l-4 border-l-amber-500">
          <p className="label">Awaiting Approval</p>
          <p className="text-2xl font-bold text-amber-600 mt-1">{counts.pending}</p>
          <span className="text-xs text-amber-700 font-medium">Pending action</span>
        </div>
        <div className="card border-l-4 border-l-emerald-500">
          <p className="label">Approved & Fulfilled</p>
          <p className="text-2xl font-bold text-emerald-600 mt-1">{counts.approved}</p>
          <span className="text-xs text-emerald-700 font-medium">Authorized</span>
        </div>
        <div className="card border-l-4 border-l-red-500">
          <p className="label">Rejected / Cancelled</p>
          <p className="text-2xl font-bold text-red-600 mt-1">{counts.rejected}</p>
          <span className="text-xs text-red-700 font-medium">Declined</span>
        </div>
      </div>

      {/* Status Filter Tabs */}
      <div className="flex items-center gap-2 mb-4">
        {['', 'pending', 'approved', 'rejected'].map((s) => (
          <button
            key={s}
            onClick={() => setStatusFilter(s)}
            className={`px-4 py-1.5 rounded-lg text-xs font-semibold uppercase tracking-wider transition-all ${
              statusFilter === s
                ? 'bg-[#1D4ED8] text-white shadow-sm'
                : 'bg-white text-[#64748B] border border-[#E2E8F0] hover:bg-gray-50'
            }`}
          >
            {s === '' ? 'All Requests' : s}
          </button>
        ))}
        <span className="ml-auto text-xs text-[#94A3B8]">
          Showing {filteredRequests.length} of {requests.length}
        </span>
      </div>

      {/* Request Table */}
      {loading ? (
        <div className="flex justify-center py-20"><Spinner size="lg" /></div>
      ) : filteredRequests.length === 0 ? (
        <div className="card text-center py-16">
          <div className="text-4xl mb-3">📦</div>
          <p className="text-[#1E293B] font-semibold">No supply requests found</p>
          <p className="text-sm text-[#64748B] mt-1">Requisitions are generated automatically from approved daily plans or added manually.</p>
        </div>
      ) : (
        <div className="card p-0 overflow-hidden mb-6">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="table-header">
                <tr>
                  <th className="px-6 py-3.5 text-left">Requisition Source</th>
                  <th className="px-6 py-3.5 text-left">Requested By</th>
                  <th className="px-6 py-3.5 text-left">Items Count</th>
                  <th className="px-6 py-3.5 text-left">Workflow Status</th>
                  <th className="px-6 py-3.5 text-left">Date</th>
                  <th className="px-6 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E2E8F0]">
                {filteredRequests.map((req) => (
                  <tr key={req._id} className="hover:bg-[#F8FAFC] transition-colors">
                    <td className="px-6 py-4">
                      <div>
                        <p className="text-sm font-semibold text-[#1E293B]">
                          {req.dailyPlanId?.planName || 'Manual Requisition'}
                        </p>
                        {req.dailyPlanId?.date && (
                          <p className="text-[11px] text-[#94A3B8]">
                            Plan Date: {new Date(req.dailyPlanId.date).toLocaleDateString()}
                          </p>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-full bg-[#1B2A4A] text-white flex items-center justify-center text-[10px] font-bold">
                          {req.requestedBy?.name?.charAt(0) || 'U'}
                        </div>
                        <span className="text-xs text-[#1E293B] font-medium">{req.requestedBy?.name || 'Authorized Staff'}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <button
                        onClick={() => setSelectedReq(req)}
                        className="badge-blue text-xs font-semibold hover:bg-blue-200 transition-colors cursor-pointer"
                      >
                        {req.items?.length || 0} item{req.items?.length !== 1 ? 's' : ''} (inspect)
                      </button>
                    </td>
                    <td className="px-6 py-4">
                      <StatusBadge status={req.status} />
                    </td>
                    <td className="px-6 py-4 text-xs text-[#94A3B8]">
                      {new Date(req.createdAt).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => setSelectedReq(req)}
                          className="btn-secondary text-xs py-1 px-2.5"
                        >
                          View
                        </button>
                        {['Admin', 'Mezz Manager'].includes(user?.role) && req.status === 'pending' && (
                          <>
                            <button
                              onClick={() => handleStatusChange(req._id, 'approved')}
                              className="btn-primary text-xs py-1 px-2.5"
                            >
                              Approve
                            </button>
                            <button
                              onClick={() => handleStatusChange(req._id, 'rejected')}
                              className="btn-danger text-xs py-1 px-2.5"
                            >
                              Reject
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Inspect Request Detail Modal */}
      <Modal isOpen={!!selectedReq} onClose={() => setSelectedReq(null)} title="Requisition Order Breakdown">
        {selectedReq && (
          <div className="space-y-4">
            {/* Status Stepper */}
            <div className="p-4 bg-[#F8FAFC] rounded-xl border border-[#E2E8F0]">
              <div className="flex items-center justify-between text-xs font-semibold mb-2">
                <span className="text-[#1D4ED8]">1. Submitted</span>
                <span className={selectedReq.status !== 'pending' ? 'text-[#1D4ED8]' : 'text-[#94A3B8]'}>
                  2. Reviewed
                </span>
                <span className={selectedReq.status === 'approved' ? 'text-emerald-600' : 'text-[#94A3B8]'}>
                  3. Fulfilled
                </span>
              </div>
              <div className="h-2 bg-[#E2E8F0] rounded-full overflow-hidden flex">
                <div className="h-full bg-[#1D4ED8] w-1/3" />
                <div className={`h-full w-1/3 transition-all ${selectedReq.status !== 'pending' ? 'bg-[#1D4ED8]' : 'bg-transparent'}`} />
                <div className={`h-full w-1/3 transition-all ${selectedReq.status === 'approved' ? 'bg-emerald-500' : selectedReq.status === 'rejected' ? 'bg-red-500' : 'bg-transparent'}`} />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs bg-[#F8FAFC] p-3 rounded-lg">
              <div>
                <span className="text-[#94A3B8] block uppercase text-[10px] font-semibold">Source</span>
                <span className="font-semibold text-[#1E293B]">{selectedReq.dailyPlanId?.planName || 'Manual Request'}</span>
              </div>
              <div>
                <span className="text-[#94A3B8] block uppercase text-[10px] font-semibold">Current Status</span>
                <StatusBadge status={selectedReq.status} />
              </div>
              <div>
                <span className="text-[#94A3B8] block uppercase text-[10px] font-semibold">Requested By</span>
                <span className="font-medium text-[#1E293B]">{selectedReq.requestedBy?.name || 'Staff'}</span>
              </div>
              <div>
                <span className="text-[#94A3B8] block uppercase text-[10px] font-semibold">Date Submitted</span>
                <span className="text-[#64748B]">{new Date(selectedReq.createdAt).toLocaleString()}</span>
              </div>
            </div>

            {selectedReq.notes && (
              <div className="text-xs p-3 bg-blue-50 text-blue-900 rounded-lg">
                <strong>Notes:</strong> {selectedReq.notes}
              </div>
            )}

            {/* Items Table */}
            <div>
              <p className="label">Requested Supplies ({selectedReq.items?.length || 0})</p>
              <div className="max-h-56 overflow-y-auto border border-[#E2E8F0] rounded-lg divide-y divide-[#E2E8F0]">
                {(selectedReq.items || []).map((it, idx) => (
                  <div key={idx} className="flex items-center justify-between p-3 text-xs">
                    <div>
                      <p className="font-semibold text-[#1E293B]">{it.itemId?.name || 'Inventory Item'}</p>
                      <p className="text-[10px] text-[#94A3B8]">SKU: {it.itemId?.sku || 'N/A'}</p>
                    </div>
                    <div className="text-right">
                      <span className="font-bold text-sm text-[#1D4ED8]">{it.quantity}</span>
                      <span className="text-[#64748B] ml-1">{it.itemId?.unit || 'units'}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Action buttons inside modal */}
            <div className="flex gap-2 pt-2">
              {['Admin', 'Mezz Manager'].includes(user?.role) && selectedReq.status === 'pending' && (
                <>
                  <button
                    onClick={() => handleStatusChange(selectedReq._id, 'approved')}
                    className="btn-primary flex-1 justify-center"
                  >
                    Approve Order
                  </button>
                  <button
                    onClick={() => handleStatusChange(selectedReq._id, 'rejected')}
                    className="btn-danger flex-1 justify-center"
                  >
                    Reject Order
                  </button>
                </>
              )}
              <button
                onClick={() => setSelectedReq(null)}
                className="btn-secondary flex-1 justify-center"
              >
                Close
              </button>
            </div>
          </div>
        )}
      </Modal>

      {/* Create Requisition Modal */}
      <Modal isOpen={createModalOpen} onClose={() => setCreateModalOpen(false)} title="New Supply Requisition">
        <form onSubmit={handleCreateRequest} className="space-y-4">
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="label mb-0">Select Items & Quantities</label>
              <button
                type="button"
                onClick={handleAddItemRow}
                className="text-xs text-[#1D4ED8] hover:underline font-semibold"
              >
                + Add Item
              </button>
            </div>
            <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
              {newRequestItems.map((row, index) => (
                <div key={index} className="flex items-center gap-2">
                  <select
                    className="input-field flex-1 text-xs"
                    value={row.itemId}
                    onChange={(e) => {
                      const val = e.target.value;
                      setNewRequestItems((prev) =>
                        prev.map((r, i) => (i === index ? { ...r, itemId: val } : r))
                      );
                    }}
                    required
                  >
                    <option value="">Select Item from Inventory</option>
                    {inventoryItems.map((item) => (
                      <option key={item._id} value={item._id}>
                        {item.name} ({item.sku}) - In Stock: {item.quantity} {item.unit}
                      </option>
                    ))}
                  </select>
                  <input
                    type="number"
                    min="1"
                    className="input-field w-24 text-xs"
                    value={row.quantity}
                    onChange={(e) => {
                      const val = Number(e.target.value);
                      setNewRequestItems((prev) =>
                        prev.map((r, i) => (i === index ? { ...r, quantity: val } : r))
                      );
                    }}
                    required
                  />
                  {newRequestItems.length > 1 && (
                    <button
                      type="button"
                      onClick={() => handleRemoveItemRow(index)}
                      className="p-1 text-red-500 hover:text-red-700"
                    >
                      ✕
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>

          <div>
            <label className="label">Requisition Notes (Optional)</label>
            <textarea
              className="input-field h-20 resize-none text-xs"
              placeholder="Operational reason, unit destination, emergency replenishment..."
              value={newRequestNotes}
              onChange={(e) => setNewRequestNotes(e.target.value)}
            />
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={() => setCreateModalOpen(false)}
              className="btn-secondary flex-1 justify-center"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={savingReq}
              className="btn-primary flex-1 justify-center"
            >
              {savingReq ? <Spinner size="sm" /> : null}
              {savingReq ? 'Submitting...' : 'Submit Requisition'}
            </button>
          </div>
        </form>
      </Modal>
    </AppLayout>
  );
};

export default SupplyRequestsPage;
