import { useState, useEffect, useCallback } from 'react';
import AppLayout from '../../components/layout/AppLayout';
import Pagination from '../../components/ui/Pagination';
import Spinner from '../../components/ui/Spinner';
import Modal from '../../components/ui/Modal';
import api from '../../services/api';
import toast from 'react-hot-toast';

const MODULES = ['all', 'Auth', 'Users', 'Inventory', 'Meals', 'DailyPlans', 'SupplyRequests', 'Reports'];

const AuditLogPage = () => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [moduleFilter, setModuleFilter] = useState('all');
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [pages, setPages] = useState(1);
  const [selectedLog, setSelectedLog] = useState(null);
  const LIMIT = 15;

  const fetchLogs = useCallback(async () => {
    setLoading(true);
    try {
      const params = { page, limit: LIMIT };
      if (moduleFilter !== 'all') params.module = moduleFilter;

      const res = await api.get('/audit-logs', { params });
      if (res.data?.success) {
        setLogs(res.data.data || []);
        setTotal(res.data.total || 0);
        setPages(res.data.pages || 1);
      }
    } catch {
      toast.error('Failed to load audit logs');
    } finally {
      setLoading(false);
    }
  }, [page, moduleFilter]);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  const getModuleBadgeClass = (module) => {
    switch (module) {
      case 'Auth':
        return 'bg-purple-100 text-purple-700';
      case 'Users':
        return 'bg-indigo-100 text-indigo-700';
      case 'Inventory':
        return 'bg-amber-100 text-amber-700';
      case 'Meals':
        return 'bg-emerald-100 text-emerald-700';
      case 'DailyPlans':
        return 'bg-blue-100 text-blue-700';
      case 'SupplyRequests':
        return 'bg-teal-100 text-teal-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  return (
    <AppLayout breadcrumbs={['Admin', 'Audit Log & History']}>
      {/* Page Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="page-title">Audit Logs & Activity History</h1>
          <p className="page-subtitle">Immutable trace of all administrative, inventory, and operational transactions.</p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs bg-white border border-[#E2E8F0] px-3 py-1.5 rounded-lg text-[#64748B] font-medium">
            Total Events: <strong className="text-[#1E293B]">{total}</strong>
          </span>
        </div>
      </div>

      {/* Module Filter Pills */}
      <div className="flex flex-wrap items-center gap-2 mb-6">
        {MODULES.map((m) => (
          <button
            key={m}
            onClick={() => {
              setModuleFilter(m);
              setPage(1);
            }}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold uppercase tracking-wider transition-all ${
              moduleFilter === m
                ? 'bg-[#1D4ED8] text-white shadow-sm'
                : 'bg-white text-[#64748B] border border-[#E2E8F0] hover:bg-gray-50'
            }`}
          >
            {m === 'all' ? 'All Modules' : m}
          </button>
        ))}
      </div>

      {/* Table */}
      {loading ? (
        <div className="flex justify-center py-20"><Spinner size="lg" /></div>
      ) : logs.length === 0 ? (
        <div className="card text-center py-16">
          <div className="text-4xl mb-3">📜</div>
          <p className="text-[#1E293B] font-semibold">No audit logs found</p>
          <p className="text-sm text-[#94A3B8] mt-1">Actions performed across modules will appear here automatically.</p>
        </div>
      ) : (
        <div className="card p-0 overflow-hidden mb-6">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="table-header">
                <tr>
                  <th className="px-6 py-3.5 text-left">Timestamp</th>
                  <th className="px-6 py-3.5 text-left">Operator</th>
                  <th className="px-6 py-3.5 text-left">Module</th>
                  <th className="px-6 py-3.5 text-left">Action</th>
                  <th className="px-6 py-3.5 text-left">Summary / Details</th>
                  <th className="px-6 py-3.5 text-right">Inspect</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E2E8F0]">
                {logs.map((log) => (
                  <tr key={log._id} className="hover:bg-[#F8FAFC] transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap text-xs text-[#64748B]">
                      {new Date(log.timestamp).toLocaleString([], {
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                        second: '2-digit',
                      })}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-full bg-[#1B2A4A] flex items-center justify-center text-white text-[10px] font-bold">
                          {log.userId?.name?.charAt(0) || 'S'}
                        </div>
                        <div>
                          <p className="text-xs font-semibold text-[#1E293B]">{log.userId?.name || 'System'}</p>
                          <p className="text-[10px] text-[#94A3B8]">{log.userId?.role || 'Service'}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${getModuleBadgeClass(log.module)}`}>
                        {log.module}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-xs font-medium text-[#1E293B]">{log.action}</span>
                    </td>
                    <td className="px-6 py-4 text-xs text-[#64748B] max-w-xs truncate">
                      {log.details ? JSON.stringify(log.details) : '—'}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button
                        onClick={() => setSelectedLog(log)}
                        className="text-xs text-[#1D4ED8] hover:underline font-semibold"
                      >
                        Details
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <Pagination page={page} pages={pages} total={total} limit={LIMIT} onPageChange={setPage} />
        </div>
      )}

      {/* Details Modal */}
      <Modal isOpen={!!selectedLog} onClose={() => setSelectedLog(null)} title="Audit Event Details">
        {selectedLog && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3 text-xs bg-[#F8FAFC] p-3 rounded-lg border border-[#E2E8F0]">
              <div>
                <span className="text-[#94A3B8] block uppercase text-[10px] font-semibold">Action</span>
                <span className="font-semibold text-[#1E293B] text-sm">{selectedLog.action}</span>
              </div>
              <div>
                <span className="text-[#94A3B8] block uppercase text-[10px] font-semibold">Module</span>
                <span className="font-semibold text-[#1D4ED8]">{selectedLog.module}</span>
              </div>
              <div>
                <span className="text-[#94A3B8] block uppercase text-[10px] font-semibold">Operator</span>
                <span className="font-medium text-[#1E293B]">{selectedLog.userId?.name} ({selectedLog.userId?.role})</span>
              </div>
              <div>
                <span className="text-[#94A3B8] block uppercase text-[10px] font-semibold">Date & Time</span>
                <span className="text-[#64748B]">{new Date(selectedLog.timestamp).toLocaleString()}</span>
              </div>
            </div>

            <div>
              <span className="label">Event Payload</span>
              <pre className="bg-[#1B2A4A] text-emerald-400 p-4 rounded-xl text-xs overflow-x-auto font-mono">
                {JSON.stringify(selectedLog.details || {}, null, 2)}
              </pre>
            </div>

            <button onClick={() => setSelectedLog(null)} className="btn-secondary w-full justify-center">
              Close
            </button>
          </div>
        )}
      </Modal>
    </AppLayout>
  );
};

export default AuditLogPage;
