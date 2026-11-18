import { useState, useEffect, useCallback } from 'react';
import AppLayout from '../../components/layout/AppLayout';
import Modal from '../../components/ui/Modal';
import Spinner from '../../components/ui/Spinner';
import api from '../../services/api';
import toast from 'react-hot-toast';

const emptyForm = { minStudents: 1, maxStudents: 50, kitchen: 3, distribution: 2, cleaning: 2 };

const WorkforceRulesPage = () => {
  const [rules, setRules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingRule, setEditingRule] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);

  const fetchRules = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get('/workforce-rules');
      setRules(res.data?.data || []);
    } catch {
      toast.error('Failed to load workforce rules');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchRules();
  }, [fetchRules]);

  const openAddModal = () => {
    setEditingRule(null);
    setForm(emptyForm);
    setModalOpen(true);
  };

  const openEditModal = (rule) => {
    setEditingRule(rule);
    setForm({
      minStudents: rule.minStudents,
      maxStudents: rule.maxStudents,
      kitchen: rule.kitchen,
      distribution: rule.distribution,
      cleaning: rule.cleaning,
    });
    setModalOpen(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (form.minStudents > form.maxStudents) {
      return toast.error('Min Personnel must be less than or equal to Max Personnel');
    }
    setSaving(true);
    try {
      if (editingRule) {
        await api.put(`/workforce-rules/${editingRule._id}`, form);
        toast.success('Workforce rule updated');
      } else {
        await api.post('/workforce-rules', form);
        toast.success('Workforce rule created');
      }
      setModalOpen(false);
      fetchRules();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save rule');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this workforce rule?')) return;
    try {
      await api.delete(`/workforce-rules/${id}`);
      toast.success('Rule deleted');
      fetchRules();
    } catch {
      toast.error('Failed to delete rule');
    }
  };

  return (
    <AppLayout breadcrumbs={['Admin', 'Workforce Rules']}>
      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="page-title">Workforce Allocation Rules</h1>
          <p className="page-subtitle">Configure automated staff sizing rules based on troop and personnel attendance brackets.</p>
        </div>
        <button onClick={openAddModal} className="btn-primary">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Add Rule
        </button>
      </div>

      {/* Rules Table */}
      {loading ? (
        <div className="flex justify-center py-20"><Spinner size="lg" /></div>
      ) : rules.length === 0 ? (
        <div className="card text-center py-16">
          <div className="text-4xl mb-3">⚙️</div>
          <p className="text-[#1E293B] font-semibold">No workforce rules configured</p>
          <p className="text-sm text-[#64748B] mt-1 mb-4">Add your first bracket to enable dynamic calculations.</p>
          <button onClick={openAddModal} className="btn-primary mx-auto">Create Rule</button>
        </div>
      ) : (
        <div className="card p-0 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="table-header">
                <tr>
                  <th className="px-6 py-3.5 text-left">Troop Bracket</th>
                  <th className="px-6 py-3.5 text-center">Kitchen Staff</th>
                  <th className="px-6 py-3.5 text-center">Distribution Staff</th>
                  <th className="px-6 py-3.5 text-center">Cleaning Staff</th>
                  <th className="px-6 py-3.5 text-center">Total Required</th>
                  <th className="px-6 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E2E8F0]">
                {rules.map((rule) => {
                  const total = (rule.kitchen || 0) + (rule.distribution || 0) + (rule.cleaning || 0);
                  return (
                    <tr key={rule._id} className="hover:bg-[#F8FAFC] transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <span className="w-2 h-2 rounded-full bg-[#1D4ED8]" />
                          <span className="text-sm font-semibold text-[#1E293B]">
                            {rule.minStudents} – {rule.maxStudents >= 9999 ? '9999+' : rule.maxStudents} personnel
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className="badge-blue font-semibold">{rule.kitchen} cooks</span>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className="badge-amber font-semibold">{rule.distribution} servers</span>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className="badge-gray font-semibold">{rule.cleaning} cleaners</span>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className="text-sm font-bold text-[#1D4ED8] bg-blue-50 px-3 py-1 rounded-full">
                          {total} total
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => openEditModal(rule)}
                            className="p-1.5 rounded-lg hover:bg-gray-100 text-[#64748B] hover:text-[#1D4ED8]"
                            title="Edit"
                          >
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                          </button>
                          <button
                            onClick={() => handleDelete(rule._id)}
                            className="p-1.5 rounded-lg hover:bg-red-50 text-[#64748B] hover:text-red-600"
                            title="Delete"
                          >
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Add/Edit Modal */}
      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title={editingRule ? 'Edit Workforce Rule' : 'New Workforce Rule'}>
        <form onSubmit={handleSave} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Min Personnel</label>
              <input
                type="number"
                min="1"
                className="input-field"
                value={form.minStudents}
                onChange={(e) => setForm((p) => ({ ...p, minStudents: Number(e.target.value) }))}
                required
              />
            </div>
            <div>
              <label className="label">Max Personnel</label>
              <input
                type="number"
                min="1"
                className="input-field"
                value={form.maxStudents}
                onChange={(e) => setForm((p) => ({ ...p, maxStudents: Number(e.target.value) }))}
                required
              />
            </div>
            <div>
              <label className="label">Kitchen Staff</label>
              <input
                type="number"
                min="0"
                className="input-field"
                value={form.kitchen}
                onChange={(e) => setForm((p) => ({ ...p, kitchen: Number(e.target.value) }))}
                required
              />
            </div>
            <div>
              <label className="label">Distribution Staff</label>
              <input
                type="number"
                min="0"
                className="input-field"
                value={form.distribution}
                onChange={(e) => setForm((p) => ({ ...p, distribution: Number(e.target.value) }))}
                required
              />
            </div>
            <div className="col-span-2">
              <label className="label">Cleaning Staff</label>
              <input
                type="number"
                min="0"
                className="input-field"
                value={form.cleaning}
                onChange={(e) => setForm((p) => ({ ...p, cleaning: Number(e.target.value) }))}
                required
              />
            </div>
          </div>
          <div className="flex gap-3 pt-3">
            <button type="button" onClick={() => setModalOpen(false)} className="btn-secondary flex-1 justify-center">
              Cancel
            </button>
            <button type="submit" disabled={saving} className="btn-primary flex-1 justify-center">
              {saving ? <Spinner size="sm" /> : null}
              {saving ? 'Saving...' : editingRule ? 'Update Rule' : 'Save Rule'}
            </button>
          </div>
        </form>
      </Modal>
    </AppLayout>
  );
};

export default WorkforceRulesPage;
