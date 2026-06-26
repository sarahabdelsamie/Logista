import { useState, useEffect, useCallback } from 'react';
import AppLayout from '../components/layout/AppLayout';
import Modal from '../components/ui/Modal';
import Pagination from '../components/ui/Pagination';
import StatusBadge from '../components/ui/StatusBadge';
import Spinner from '../components/ui/Spinner';
import api from '../services/api';
import toast from 'react-hot-toast';

const CATEGORIES = ['Grains & Cereals', 'Proteins', 'Vegetables', 'Fruits', 'Dairy', 'Oils & Fats', 'Spices & Condiments', 'Beverages', 'Other'];
const UNITS = ['kg', 'g', 'L', 'mL', 'pcs', 'boxes', 'cans', 'bags'];
const emptyForm = { name: '', sku: '', category: 'Grains & Cereals', unit: 'kg', quantity: 0, unitPrice: 0, minStockLevel: 10 };

const KpiCard = ({ label, value, badge, badgeClass, icon, iconBg }) => (
  <div className="card flex items-start justify-between">
    <div>
      <p className="label">{label}</p>
      <p className="text-3xl font-bold text-[#1E293B] mt-1">{value}</p>
      <span className={`text-xs font-medium px-2 py-0.5 rounded-full mt-2 inline-block ${badgeClass}`}>{badge}</span>
    </div>
    <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${iconBg}`}>{icon}</div>
  </div>
);

const InventoryPage = () => {
  const [items, setItems] = useState([]);
  const [stats, setStats] = useState({ total: 0, lowStock: 0, outOfStock: 0 });
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [catFilter, setCatFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [pages, setPages] = useState(1);
  const [modalOpen, setModalOpen] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [txModal, setTxModal] = useState(null);
  const [txForm, setTxForm] = useState({ type: 'restock', quantity: 1, notes: '' });
  const [txSaving, setTxSaving] = useState(false);
  const LIMIT = 8;

  const fetchItems = useCallback(async () => {
    setLoading(true);
    try {
      const [itemsRes, statsRes] = await Promise.all([
        api.get('/inventory', { params: { search, category: catFilter, status: statusFilter, page, limit: LIMIT } }),
        api.get('/inventory/stats'),
      ]);
      setItems(itemsRes.data.data);
      setTotal(itemsRes.data.total);
      setPages(itemsRes.data.pages);
      setStats(statsRes.data.data);
    } catch { toast.error('Failed to load inventory'); }
    finally { setLoading(false); }
  }, [search, catFilter, statusFilter, page]);

  useEffect(() => { fetchItems(); }, [fetchItems]);

  const openAdd = () => { setEditItem(null); setForm(emptyForm); setModalOpen(true); };
  const openEdit = (item) => {
    setEditItem(item);
    setForm({ name: item.name, sku: item.sku, category: item.category, unit: item.unit, quantity: item.quantity, unitPrice: item.unitPrice, minStockLevel: item.minStockLevel });
    setModalOpen(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (editItem) { await api.put(`/inventory/${editItem._id}`, form); toast.success('Item updated'); }
      else { await api.post('/inventory', form); toast.success('Item created'); }
      setModalOpen(false);
      fetchItems();
    } catch (err) { toast.error(err.response?.data?.message || 'Save failed'); }
    finally { setSaving(false); }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this inventory item?')) return;
    try { await api.delete(`/inventory/${id}`); toast.success('Item deleted'); fetchItems(); }
    catch (err) { toast.error(err.response?.data?.message || 'Delete failed'); }
  };

  const handleTransaction = async (e) => {
    e.preventDefault();
    setTxSaving(true);
    try {
      await api.post(`/inventory/${txModal._id}/transaction`, txForm);
      toast.success(`Stock ${txForm.type === 'issue' ? 'issued' : 'restocked'} successfully`);
      setTxModal(null);
      fetchItems();
    } catch (err) { toast.error(err.response?.data?.message || 'Transaction failed'); }
    finally { setTxSaving(false); }
  };

  return (
    <AppLayout breadcrumbs={['Inventory']}>
      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="page-title">Inventory Management</h1>
          <p className="page-subtitle">Monitor and control supplies across all operational zones.</p>
        </div>
        <div className="flex gap-3">
          <button className="btn-secondary">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
            Export
          </button>
          <button id="add-item-btn" onClick={openAdd} className="btn-primary">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
            Add Item
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <KpiCard label="Total Active SKUs" value={stats.total} badge="+2.4%" badgeClass="bg-green-100 text-green-700"
          iconBg="bg-blue-50" icon={<svg className="w-6 h-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" /></svg>} />
        <KpiCard label="Low Stock Alerts" value={stats.lowStock} badge="Needs Action" badgeClass="bg-amber-100 text-amber-700"
          iconBg="bg-amber-50" icon={<svg className="w-6 h-6 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>} />
        <KpiCard label="Out of Stock" value={stats.outOfStock} badge="Critical" badgeClass="bg-red-100 text-red-700"
          iconBg="bg-red-50" icon={<svg className="w-6 h-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" /></svg>} />
      </div>

      {/* Filters */}
      <div className="card mb-6">
        <div className="flex flex-wrap gap-3">
          <div className="relative flex-1 min-w-48">
            <svg className="w-4 h-4 text-[#94A3B8] absolute left-3 top-1/2 -translate-y-1/2" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
            <input
              type="text"
              placeholder="Search items..."
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              className="input-field pl-9"
            />
          </div>
          <select className="input-field w-44" value={catFilter} onChange={(e) => { setCatFilter(e.target.value); setPage(1); }}>
            <option value="">All Categories</option>
            {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
          <select className="input-field w-40" value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}>
            <option value="">All Statuses</option>
            <option value="In Stock">In Stock</option>
            <option value="Low Stock">Low Stock</option>
            <option value="Out of Stock">Out of Stock</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="card p-0 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="table-header">
              <tr>
                <th className="px-6 py-3 text-left">Item Name</th>
                <th className="px-6 py-3 text-left">SKU</th>
                <th className="px-6 py-3 text-left">Category</th>
                <th className="px-6 py-3 text-right">Current Qty</th>
                <th className="px-6 py-3 text-left">Unit</th>
                <th className="px-6 py-3 text-right">Threshold</th>
                <th className="px-6 py-3 text-left">Status</th>
                <th className="px-6 py-3 text-left">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E2E8F0]">
              {loading ? (
                <tr><td colSpan={8} className="py-16 text-center"><div className="flex justify-center"><Spinner /></div></td></tr>
              ) : items.length === 0 ? (
                <tr><td colSpan={8} className="py-16 text-center text-[#94A3B8] text-sm">No items found</td></tr>
              ) : items.map((item) => (
                <tr key={item._id} className="hover:bg-[#F8FAFC] transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-[#F0F2F7] rounded-lg flex items-center justify-center">
                        <svg className="w-4 h-4 text-[#64748B]" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" /></svg>
                      </div>
                      <span className={`text-sm font-medium ${item.status === 'Out of Stock' ? 'text-red-600' : 'text-[#1E293B]'}`}>{item.name}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-[#64748B] font-mono">{item.sku}</td>
                  <td className="px-6 py-4 text-sm text-[#64748B]">{item.category}</td>
                  <td className={`px-6 py-4 text-sm font-semibold text-right ${item.status === 'Out of Stock' ? 'text-red-600' : 'text-[#1E293B]'}`}>{item.quantity}</td>
                  <td className="px-6 py-4 text-sm text-[#64748B]">{item.unit}</td>
                  <td className="px-6 py-4 text-sm text-[#64748B] text-right">{item.minStockLevel}</td>
                  <td className="px-6 py-4"><StatusBadge status={item.status} /></td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <button title="Restock / Issue" onClick={() => { setTxModal(item); setTxForm({ type: 'restock', quantity: 1, notes: '' }); }}
                        className="p-1.5 rounded-lg hover:bg-blue-50 text-[#1D4ED8]" >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
                      </button>
                      <button title="Edit" onClick={() => openEdit(item)} className="p-1.5 rounded-lg hover:bg-gray-100 text-[#64748B]">
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                      </button>
                      <button title="Delete" onClick={() => handleDelete(item._id)} className="p-1.5 rounded-lg hover:bg-red-50 text-red-500">
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <Pagination page={page} pages={pages} total={total} limit={LIMIT} onPageChange={setPage} />
      </div>

      {/* Add/Edit Modal */}
      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title={editItem ? 'Edit Inventory Item' : 'Add Inventory Item'}>
        <form onSubmit={handleSave} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className="label">Item Name</label>
              <input className="input-field" value={form.name} onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))} placeholder="e.g. White Rice" required />
            </div>
            <div>
              <label className="label">SKU</label>
              <input className="input-field" value={form.sku} onChange={(e) => setForm((p) => ({ ...p, sku: e.target.value }))} placeholder="e.g. GR-001" required />
            </div>
            <div>
              <label className="label">Category</label>
              <select className="input-field" value={form.category} onChange={(e) => setForm((p) => ({ ...p, category: e.target.value }))}>
                {CATEGORIES.map((c) => <option key={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label className="label">Unit</label>
              <select className="input-field" value={form.unit} onChange={(e) => setForm((p) => ({ ...p, unit: e.target.value }))}>
                {UNITS.map((u) => <option key={u}>{u}</option>)}
              </select>
            </div>
            <div>
              <label className="label">Unit Price ($)</label>
              <input type="number" min="0" step="0.01" className="input-field" value={form.unitPrice} onChange={(e) => setForm((p) => ({ ...p, unitPrice: Number(e.target.value) }))} />
            </div>
            <div>
              <label className="label">Current Quantity</label>
              <input type="number" min="0" className="input-field" value={form.quantity} onChange={(e) => setForm((p) => ({ ...p, quantity: Number(e.target.value) }))} />
            </div>
            <div>
              <label className="label">Min Stock Level</label>
              <input type="number" min="0" className="input-field" value={form.minStockLevel} onChange={(e) => setForm((p) => ({ ...p, minStockLevel: Number(e.target.value) }))} />
            </div>
          </div>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={() => setModalOpen(false)} className="btn-secondary flex-1 justify-center">Cancel</button>
            <button type="submit" disabled={saving} className="btn-primary flex-1 justify-center">
              {saving ? <Spinner size="sm" /> : null} {saving ? 'Saving...' : 'Save Item'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Stock Transaction Modal */}
      <Modal isOpen={!!txModal} onClose={() => setTxModal(null)} title={`Stock Transaction — ${txModal?.name}`}>
        <form onSubmit={handleTransaction} className="space-y-4">
          <div className="bg-[#F8FAFC] rounded-lg p-3 flex items-center justify-between">
            <span className="text-sm text-[#64748B]">Current Stock</span>
            <span className="text-sm font-bold text-[#1E293B]">{txModal?.quantity} {txModal?.unit}</span>
          </div>
          <div>
            <label className="label">Transaction Type</label>
            <div className="grid grid-cols-2 gap-3">
              {['restock', 'issue'].map((t) => (
                <button key={t} type="button"
                  onClick={() => setTxForm((p) => ({ ...p, type: t }))}
                  className={`py-3 rounded-lg border-2 text-sm font-semibold capitalize transition-all ${txForm.type === t ? 'border-[#1D4ED8] bg-blue-50 text-[#1D4ED8]' : 'border-[#E2E8F0] text-[#64748B] hover:border-[#94A3B8]'}`}
                >
                  {t === 'restock' ? '↑ Restock' : '↓ Issue'}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="label">Quantity</label>
            <input type="number" min="1" className="input-field" value={txForm.quantity}
              onChange={(e) => setTxForm((p) => ({ ...p, quantity: Number(e.target.value) }))} />
          </div>
          <div>
            <label className="label">Notes (optional)</label>
            <textarea className="input-field h-20 resize-none" value={txForm.notes}
              onChange={(e) => setTxForm((p) => ({ ...p, notes: e.target.value }))} placeholder="Reason for transaction..." />
          </div>
          <div className="flex gap-3">
            <button type="button" onClick={() => setTxModal(null)} className="btn-secondary flex-1 justify-center">Cancel</button>
            <button type="submit" disabled={txSaving} className="btn-primary flex-1 justify-center">
              {txSaving ? <Spinner size="sm" /> : null} Confirm Transaction
            </button>
          </div>
        </form>
      </Modal>
    </AppLayout>
  );
};

export default InventoryPage;
