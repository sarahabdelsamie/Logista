import { useState, useEffect, useCallback } from 'react';
import AppLayout from '../../components/layout/AppLayout';
import Drawer from '../../components/ui/Drawer';
import Pagination from '../../components/ui/Pagination';
import StatusBadge from '../../components/ui/StatusBadge';
import Spinner from '../../components/ui/Spinner';
import api from '../../services/api';
import toast from 'react-hot-toast';

const ROLES = ['Admin', 'Mezz Manager', 'Kitchen Supervisor', 'Store Keeper'];
const RANKS = ['Private', 'Corporal', 'Sergeant', 'Lieutenant', 'Captain', 'Major', 'Colonel', 'General'];
const UNITS = ['Alpha Company', 'Bravo Company', 'Charlie Company', 'HQ Unit', 'Support Unit', 'Logistics Battalion'];

const emptyForm = { name: '', email: '', password: '', role: 'Store Keeper', rank: '', unit: '', isActive: true };

const UserManagementPage = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [filters, setFilters] = useState({ rank: '', unit: '', status: '' });
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [pages, setPages] = useState(1);
  const [openMenu, setOpenMenu] = useState(null);
  const LIMIT = 10;

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const params = { page, limit: LIMIT, ...filters };
      const res = await api.get('/users', { params });
      setUsers(res.data.data);
      setTotal(res.data.total);
      setPages(res.data.pages);
    } catch {
      toast.error('Failed to load users');
    } finally {
      setLoading(false);
    }
  }, [page, filters]);

  useEffect(() => { fetchUsers(); }, [fetchUsers]);

  const openAddDrawer = () => {
    setEditingUser(null);
    setForm(emptyForm);
    setDrawerOpen(true);
  };

  const openEditDrawer = (user) => {
    setEditingUser(user);
    setForm({ name: user.name, email: user.email, password: '', role: user.role, rank: user.rank || '', unit: user.unit || '', isActive: user.isActive });
    setDrawerOpen(true);
    setOpenMenu(null);
  };

  const handleFormChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm((p) => ({ ...p, [name]: type === 'checkbox' ? checked : value }));
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!form.name || !form.email || !form.role) return toast.error('Name, email, and role are required');
    if (!editingUser && !form.password) return toast.error('Password is required for new users');

    setSaving(true);
    try {
      const payload = { ...form };
      if (!payload.password) delete payload.password;

      if (editingUser) {
        await api.put(`/users/${editingUser._id}`, payload);
        toast.success('User updated successfully');
      } else {
        await api.post('/users', payload);
        toast.success('User created successfully');
      }
      setDrawerOpen(false);
      fetchUsers();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Save failed');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (userId) => {
    if (!window.confirm('Are you sure you want to delete this user?')) return;
    try {
      await api.delete(`/users/${userId}`);
      toast.success('User deleted');
      fetchUsers();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Delete failed');
    }
    setOpenMenu(null);
  };

  const getUserStatus = (user) => {
    if (!user.isActive) return 'Inactive';
    return 'Active';
  };

  return (
    <AppLayout breadcrumbs={['Workforce', 'User Management']}>
      {/* Page Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="page-title">User Management</h1>
          <p className="page-subtitle">Manage workforce personnel, roles, and access levels.</p>
        </div>
        <div className="flex items-center gap-3">
          <button className="btn-secondary">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
            Export
          </button>
          <button id="add-user-btn" onClick={openAddDrawer} className="btn-primary">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
            Add User
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="card mb-6">
        <div className="flex flex-wrap items-center gap-3">
          <select
            className="input-field w-40"
            value={filters.rank}
            onChange={(e) => { setFilters((p) => ({ ...p, rank: e.target.value })); setPage(1); }}
          >
            <option value="">All Ranks</option>
            {RANKS.map((r) => <option key={r} value={r}>{r}</option>)}
          </select>
          <select
            className="input-field w-44"
            value={filters.unit}
            onChange={(e) => { setFilters((p) => ({ ...p, unit: e.target.value })); setPage(1); }}
          >
            <option value="">All Units</option>
            {UNITS.map((u) => <option key={u} value={u}>{u}</option>)}
          </select>
          <select
            className="input-field w-40"
            value={filters.status}
            onChange={(e) => { setFilters((p) => ({ ...p, status: e.target.value })); setPage(1); }}
          >
            <option value="">All Statuses</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
          {(filters.rank || filters.unit || filters.status) && (
            <button
              onClick={() => { setFilters({ rank: '', unit: '', status: '' }); setPage(1); }}
              className="text-sm text-[#64748B] hover:text-[#1D4ED8] flex items-center gap-1"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              Clear filters
            </button>
          )}
        </div>
      </div>

      {/* Table */}
      <div className="card p-0 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="table-header">
              <tr>
                <th className="px-6 py-3 text-left">Name</th>
                <th className="px-6 py-3 text-left">Rank</th>
                <th className="px-6 py-3 text-left">Role</th>
                <th className="px-6 py-3 text-left">Unit</th>
                <th className="px-6 py-3 text-left">Status</th>
                <th className="px-6 py-3 text-left">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E2E8F0]">
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-6 py-16 text-center">
                    <div className="flex justify-center"><Spinner /></div>
                  </td>
                </tr>
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-16 text-center text-[#94A3B8] text-sm">No users found</td>
                </tr>
              ) : users.map((user) => (
                <tr key={user._id} className="hover:bg-[#F8FAFC] transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-[#1B2A4A] flex items-center justify-center flex-shrink-0">
                        <span className="text-white text-sm font-semibold">{user.name?.charAt(0)?.toUpperCase()}</span>
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-[#1E293B]">{user.name}</p>
                        <p className="text-xs text-[#94A3B8]">{user.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-[#64748B]">{user.rank || '—'}</td>
                  <td className="px-6 py-4">
                    <span className="badge-blue">{user.role}</span>
                  </td>
                  <td className="px-6 py-4 text-sm text-[#64748B]">{user.unit || '—'}</td>
                  <td className="px-6 py-4">
                    <StatusBadge status={getUserStatus(user)} />
                  </td>
                  <td className="px-6 py-4">
                    <div className="relative">
                      <button
                        onClick={() => setOpenMenu(openMenu === user._id ? null : user._id)}
                        className="p-1.5 rounded-lg hover:bg-gray-100 text-[#94A3B8] hover:text-[#1E293B]"
                      >
                        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                          <circle cx="12" cy="5" r="1.5" /><circle cx="12" cy="12" r="1.5" /><circle cx="12" cy="19" r="1.5" />
                        </svg>
                      </button>
                      {openMenu === user._id && (
                        <div className="absolute right-0 top-8 z-10 bg-white border border-[#E2E8F0] rounded-xl shadow-lg py-1 w-36">
                          <button
                            onClick={() => openEditDrawer(user)}
                            className="w-full text-left px-4 py-2 text-sm text-[#1E293B] hover:bg-[#F8FAFC] flex items-center gap-2"
                          >
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                            Edit
                          </button>
                          <button
                            onClick={() => handleDelete(user._id)}
                            className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center gap-2"
                          >
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                            Delete
                          </button>
                        </div>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <Pagination page={page} pages={pages} total={total} limit={LIMIT} onPageChange={setPage} />
      </div>

      {/* Add/Edit User Drawer */}
      <Drawer isOpen={drawerOpen} onClose={() => setDrawerOpen(false)} title={editingUser ? 'Edit User' : 'Add New User'}>
        <form onSubmit={handleSave} className="space-y-5">
          <div>
            <label className="label">Full Name</label>
            <input name="name" value={form.name} onChange={handleFormChange} className="input-field" placeholder="e.g. John Doe" required />
          </div>
          <div>
            <label className="label">Email Address</label>
            <input name="email" type="email" value={form.email} onChange={handleFormChange} className="input-field" placeholder="name@unit.mil" required />
          </div>
          <div>
            <label className="label">{editingUser ? 'New Password (leave blank to keep)' : 'Password'}</label>
            <input name="password" type="password" value={form.password} onChange={handleFormChange} className="input-field" placeholder="Min. 6 characters" />
          </div>
          <div>
            <label className="label">Role</label>
            <select name="role" value={form.role} onChange={handleFormChange} className="input-field" required>
              {ROLES.map((r) => <option key={r} value={r}>{r}</option>)}
            </select>
          </div>
          <div>
            <label className="label">Rank</label>
            <select name="rank" value={form.rank} onChange={handleFormChange} className="input-field">
              <option value="">Select Rank</option>
              {RANKS.map((r) => <option key={r} value={r}>{r}</option>)}
            </select>
          </div>
          <div>
            <label className="label">Unit</label>
            <select name="unit" value={form.unit} onChange={handleFormChange} className="input-field">
              <option value="">Select Unit</option>
              {UNITS.map((u) => <option key={u} value={u}>{u}</option>)}
            </select>
          </div>
          <div className="flex items-center justify-between py-3 border-t border-[#E2E8F0]">
            <span className="text-sm font-medium text-[#1E293B]">Account Status</span>
            <button
              type="button"
              onClick={() => setForm((p) => ({ ...p, isActive: !p.isActive }))}
              className={`relative w-12 h-6 rounded-full transition-colors ${form.isActive ? 'bg-[#1D4ED8]' : 'bg-gray-300'}`}
            >
              <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${form.isActive ? 'translate-x-6' : 'translate-x-0'}`} />
            </button>
          </div>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={() => setDrawerOpen(false)} className="btn-secondary flex-1 justify-center">Cancel</button>
            <button type="submit" disabled={saving} className="btn-primary flex-1 justify-center">
              {saving ? <Spinner size="sm" /> : null}
              {saving ? 'Saving...' : editingUser ? 'Update User' : 'Create User'}
            </button>
          </div>
        </form>
      </Drawer>
    </AppLayout>
  );
};

export default UserManagementPage;
