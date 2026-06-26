import { useState, useEffect } from 'react';
import AppLayout from '../components/layout/AppLayout';
import StatusBadge from '../components/ui/StatusBadge';
import Spinner from '../components/ui/Spinner';
import api from '../services/api';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';

const SupplyRequestsPage = () => {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    api.get('/supply-requests')
      .then((res) => setRequests(res.data.data || []))
      .catch(() => toast.error('Failed to load supply requests'))
      .finally(() => setLoading(false));
  }, []);

  const handleStatusChange = async (id, status) => {
    try {
      await api.put(`/supply-requests/${id}`, { status });
      setRequests((prev) => prev.map((r) => r._id === id ? { ...r, status } : r));
      toast.success(`Request ${status}`);
    } catch { toast.error('Update failed'); }
  };

  return (
    <AppLayout breadcrumbs={['Supply Requests']}>
      <div className="mb-6">
        <h1 className="page-title">Supply Requests</h1>
        <p className="page-subtitle">Review and manage inventory supply requests from daily plans.</p>
      </div>

      {loading ? (
        <div className="flex justify-center py-20"><Spinner size="lg" /></div>
      ) : requests.length === 0 ? (
        <div className="card text-center py-20">
          <div className="text-4xl mb-4">📦</div>
          <p className="text-[#1E293B] font-semibold">No supply requests yet</p>
          <p className="text-sm text-[#64748B] mt-1">Supply requests are generated from approved daily plans.</p>
        </div>
      ) : (
        <div className="card p-0 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="table-header">
                <tr>
                  <th className="px-6 py-3 text-left">Daily Plan</th>
                  <th className="px-6 py-3 text-left">Requested By</th>
                  <th className="px-6 py-3 text-left">Items</th>
                  <th className="px-6 py-3 text-left">Status</th>
                  <th className="px-6 py-3 text-left">Date</th>
                  {['Admin', 'Mezz Manager'].includes(user?.role) && (
                    <th className="px-6 py-3 text-left">Actions</th>
                  )}
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E2E8F0]">
                {requests.map((req) => (
                  <tr key={req._id} className="hover:bg-[#F8FAFC]">
                    <td className="px-6 py-4 text-sm font-medium text-[#1E293B]">{req.dailyPlanId?.planName || '—'}</td>
                    <td className="px-6 py-4 text-sm text-[#64748B]">{req.requestedBy?.name || '—'}</td>
                    <td className="px-6 py-4 text-sm text-[#64748B]">{req.items?.length || 0} items</td>
                    <td className="px-6 py-4"><StatusBadge status={req.status} /></td>
                    <td className="px-6 py-4 text-sm text-[#94A3B8]">
                      {new Date(req.createdAt).toLocaleDateString()}
                    </td>
                    {['Admin', 'Mezz Manager'].includes(user?.role) && (
                      <td className="px-6 py-4">
                        {req.status === 'pending' && (
                          <div className="flex gap-2">
                            <button onClick={() => handleStatusChange(req._id, 'approved')} className="btn-primary text-xs py-1 px-3">Approve</button>
                            <button onClick={() => handleStatusChange(req._id, 'rejected')} className="btn-danger text-xs py-1 px-3">Reject</button>
                          </div>
                        )}
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </AppLayout>
  );
};

export default SupplyRequestsPage;
