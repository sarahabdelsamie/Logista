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
  // Mode: 'items' | 'transactions'
  const [activeTab, setActiveTab] = useState('items');

  // Items state
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

  // Quick transaction modal
  const [txModal, setTxModal] = useState(null);
  const [txForm, setTxForm] = useState({ type: 'restock', quantity: 1, notes: '' });
  const [txSaving, setTxSaving] = useState(false);

  // Transactions Log state
  const [transactions, setTransactions] = useState([]);
  const [txLoading, setTxLoading] = useState(false);
  const [txPage, setTxPage] = useState(1);
  const [txTotal, setTxTotal] = useState(0);
  const [txPages, setTxPages] = useState(1);
  const [txFilterType, setTxFilterType] = useState('');

  const LIMIT = 8;
  const TX_LIMIT = 10;

  const fetchItems = useCallback(async () => {
    setLoading(true);
    try {
      const [itemsRes, statsRes] = await Promise.all([
        api.get('/inventory', { params: { search, category: catFilter, status: statusFilter, page, limit: LIMIT } }),
        api.get('/inventory/stats'),
      ]);
      setItems(itemsRes.data?.data || []);
      setTotal(itemsRes.data?.total || 0);
      setPages(itemsRes.data?.pages || 1);
      setStats(statsRes.data?.data || { total: 0, lowStock: 0, outOfStock: 0 });
    } catch {
      toast.error('Failed to load inventory');
    } finally {
      setLoading(false);
    }
  }, [search, catFilter, statusFilter, page]);

  const fetchTransactions = useCallback(async () => {
    setTxLoading(true);
    try {
      const params = { page: txPage, limit: TX_LIMIT };
      if (txFilterType) params.type = txFilterType;
      const res = await api.get('/inventory/transactions', { params });
      if (res.data?.success) {
        setTransactions(res.data.data || []);
        setTxTotal(res.data.total || 0);
        setTxPages(res.data.pages || 1);
      }
    } catch {
      toast.error('Failed to load transactions');
    } finally {
      setTxLoading(false);
    }
  }, [txPage, txFilterType]);

  useEffect(() => {
    if (activeTab === 'items') {
      fetchItems();
    } else {
      fetchTransactions();
    }
  }, [activeTab, fetchItems, fetchTransactions]);

  const openAdd = () => {
    setEditItem(null);
    setForm(emptyForm);
    setModalOpen(true);
  };

  const openEdit = (item) => {
    setEditItem(item);
    setForm({
      name: item.name,
      sku: item.sku,
      category: item.category,
      unit: item.unit,
      quantity: item.quantity,
      unitPrice: item.unitPrice,
      minStockLevel: item.minStockLevel,
    });
    setModalOpen(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (editItem) {
        await api.put(`/inventory/${editItem._id}`, form);
        toast.success('Item updated');
      } else {
        await api.post('/inventory', form);
        toast.success('Item created');
      }
      setModalOpen(false);
      fetchItems();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Save failed');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this inventory item?')) return;
    try {
      await api.delete(`/inventory/${id}`);
      toast.success('Item deleted');
      fetchItems();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Delete failed');
    }
  };

  const handleTransaction = async (e) => {
    e.preventDefault();
    setTxSaving(true);
    try {
      await api.post(`/inventory/${txModal._id}/transaction`, txForm);
      toast.success(`Stock ${txForm.type === 'issue' ? 'issued' : 'restocked'} successfully`);
      setTxModal(null);
      setTxForm({ type: 'restock', quantity: 1, notes: '' });
      fetchItems();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Transaction failed');
    } finally {
      setTxSaving(false);
    }
  };

  const handleExportCSV = async () => {
    try {
      const res = await api.get('/reports/export/inventory-csv', { responseType: 'blob' });
      const blob = new Blob([res.data], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'inventory-ledger.csv';
      document.body.appendChild(a);
      a.click();
      a.remove();
      toast.success('Inventory ledger exported');
    } catch {
      toast.error('Export failed');
    }
  };

  return (
    <AppLayout breadcrumbs={['Inventory', activeTab === 'items' ? 'Stock Overview' : 'Transactions Ledger']}>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="page-title">Inventory Management</h1>
          <p className="page-subtitle">Monitor rations, manage provisions, track stock issues, and audit replenish transactions.</p>
        </div>
        <div className="flex flex-wrap items-center gap-2.5">
          <button onClick={handleExportCSV} className="btn-secondary text-xs">
            <svg className="w-4 h-4 text-[#1D4ED8]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
            Export CSV
          </button>
          <button onClick={openAdd} className="btn-primary text-xs">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Add New Item
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-6">
        <KpiCard
          label="Total Tracked SKUs"
          value={stats.total}
          badge="Active Inventory"
          badgeClass="bg-blue-100 text-blue-700"
          iconBg="bg-blue-50"
          icon={<svg className="w-6 h-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" /></svg>}
        />
        <KpiCard
          label="Low Stock Alert"
          value={stats.lowStock}
          badge="Needs Reorder"
          badgeClass="bg-amber-100 text-amber-700"
          iconBg="bg-amber-50"
          icon={<svg className="w-6 h-6 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>}
        />
        <KpiCard
          label="Stockout Status"
          value={stats.outOfStock}
          badge="Critical"
          badgeClass="bg-red-100 text-red-700"
          iconBg="bg-red-50"
          icon={<svg className="w-6 h-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" /></svg>}
        />
      </div>

      {/* Tabs: Stock Overview vs Transactions Log */}
      <div className="flex items-center gap-3 border-b border-[#E2E8F0] mb-6">
        <button
          onClick={() => { setActiveTab('items'); setPage(1); }}
          className={`pb-3 text-sm font-semibold flex items-center gap-2 border-b-2 transition-all ${
            activeTab === 'items'
              ? 'border-[#1D4ED8] text-[#1D4ED8]'
              : 'border-transparent text-[#64748B] hover:text-[#1E293B]'
          }`}
        >
          <span>Stock Items Master List</span>
          <span className="text-xs px-2 py-0.5 rounded-full bg-blue-100 text-[#1D4ED8]">
            {stats.total}
          </span>
        </button>

        <button
          onClick={() => { setActiveTab('transactions'); setTxPage(1); }}
          className={`pb-3 text-sm font-semibold flex items-center gap-2 border-b-2 transition-all ${
            activeTab === 'transactions'
              ? 'border-[#1D4ED8] text-[#1D4ED8]'
              : 'border-transparent text-[#64748B] hover:text-[#1E293B]'
          }`}
        >
          <span>Stock Transactions History</span>
          <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-[#64748B]">
            Ledger
          </span>
        </button>
      </div>

      {activeTab === 'items' ? (
        <>
          {/* Filters Bar */}
          <div className="card mb-6">
            <div className="flex flex-wrap items-center gap-3">
              <div className="relative flex-1 min-w-48">
                <svg className="w-4 h-4 text-[#94A3B8] absolute left-3 top-1/2 -translate-y-1/2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                <input
                  type="text"
                  placeholder="Search item name or SKU..."
                  value={search}
                  onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                  className="input-field pl-9"
                />
              </div>

              <select
                className="input-field w-44"
                value={catFilter}
                onChange={(e) => { setCatFilter(e.target.value); setPage(1); }}
              >
                <option value="">All Categories</option>
                {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>

              <select
                className="input-field w-36"
                value={statusFilter}
                onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
              >
                <option value="">All Statuses</option>
                <option value="In Stock">In Stock</option>
                <option value="Low Stock">Low Stock</option>
                <option value="Out of Stock">Out of Stock</option>
              </select>
            </div>
          </div>

          {/* Items Table */}
          {loading ? (
            <div className="flex justify-center py-20"><Spinner size="lg" /></div>
          ) : items.length === 0 ? (
            <div className="card text-center py-16">
              <div className="text-4xl mb-3">📦</div>
              <p className="text-[#1E293B] font-semibold">No inventory items found</p>
              <p className="text-sm text-[#94A3B8] mt-1 mb-4">Try adjusting search filters or add a new stock item.</p>
              <button onClick={openAdd} className="btn-primary mx-auto">Add Item</button>
            </div>
          ) : (
            <div className="card p-0 overflow-hidden mb-6">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="table-header">
                    <tr>
                      <th className="px-6 py-3.5 text-left">Item Name & SKU</th>
                      <th className="px-6 py-3.5 text-left">Category</th>
                      <th className="px-6 py-3.5 text-center">Unit Price</th>
                      <th className="px-6 py-3.5 text-center">Available Stock</th>
                      <th className="px-6 py-3.5 text-center">Status</th>
                      <th className="px-6 py-3.5 text-right">Stock Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#E2E8F0]">
                    {items.map((item) => (
                      <tr key={item._id} className="hover:bg-[#F8FAFC] transition-colors">
                        <td className="px-6 py-4">
                          <div>
                            <p className="text-sm font-semibold text-[#1E293B]">{item.name}</p>
                            <span className="text-xs font-mono text-[#94A3B8]">SKU: {item.sku}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-xs font-medium text-[#64748B]">
                          {item.category}
                        </td>
                        <td className="px-6 py-4 text-xs font-semibold text-center text-[#1E293B]">
                          ${item.unitPrice?.toFixed(2)} / {item.unit}
                        </td>
                        <td className="px-6 py-4 text-center">
                          <p className="text-sm font-bold text-[#1E293B]">
                            {item.quantity} <span className="text-xs font-normal text-[#94A3B8]">{item.unit}</span>
                          </p>
                          <p className="text-[10px] text-[#94A3B8]">Min: {item.minStockLevel} {item.unit}</p>
                        </td>
                        <td className="px-6 py-4 text-center">
                          <StatusBadge status={item.status} />
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => {
                                setTxModal(item);
                                setTxForm({ type: 'restock', quantity: 1, notes: '' });
                              }}
                              className="btn-secondary text-xs py-1 px-2.5 text-[#1D4ED8]"
                              title="Restock or Issue"
                            >
                              Transact
                            </button>
                            <button
                              onClick={() => openEdit(item)}
                              className="p-1.5 rounded-lg hover:bg-gray-100 text-[#64748B] hover:text-[#1D4ED8]"
                              title="Edit Item"
                            >
                              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                              </svg>
                            </button>
                            <button
                              onClick={() => handleDelete(item._id)}
                              className="p-1.5 rounded-lg hover:bg-red-50 text-[#64748B] hover:text-red-600"
                              title="Delete Item"
                            >
                              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                              </svg>
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
          )}
        </>
      ) : (
        /* Transactions Ledger View */
        <div>
          {/* Transaction Filter */}
          <div className="flex items-center gap-2 mb-4">
            {[
              { id: '', label: 'All Transactions' },
              { id: 'restock', label: 'Restocks (Incoming)' },
              { id: 'issue', label: 'Issues (Outgoing)' },
            ].map((t) => (
              <button
                key={t.id}
                onClick={() => { setTxFilterType(t.id); setTxPage(1); }}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold uppercase tracking-wider transition-all ${
                  txFilterType === t.id
                    ? 'bg-[#1D4ED8] text-white shadow-sm'
                    : 'bg-white text-[#64748B] border border-[#E2E8F0] hover:bg-gray-50'
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>

          {txLoading ? (
            <div className="flex justify-center py-20"><Spinner size="lg" /></div>
          ) : transactions.length === 0 ? (
            <div className="card text-center py-16">
              <div className="text-4xl mb-3">📋</div>
              <p className="text-[#1E293B] font-semibold">No stock transactions recorded</p>
              <p className="text-sm text-[#94A3B8] mt-1">Issues and restocks performed will be logged here.</p>
            </div>
          ) : (
            <div className="card p-0 overflow-hidden mb-6">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="table-header">
                    <tr>
                      <th className="px-6 py-3.5 text-left">Date & Time</th>
                      <th className="px-6 py-3.5 text-left">Item SKU</th>
                      <th className="px-6 py-3.5 text-center">Type</th>
                      <th className="px-6 py-3.5 text-center">Transacted Qty</th>
                      <th className="px-6 py-3.5 text-center">Remaining Balance</th>
                      <th className="px-6 py-3.5 text-left">Officer</th>
                      <th className="px-6 py-3.5 text-left">Notes</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#E2E8F0]">
                    {transactions.map((tx) => {
                      const isRestock = tx.action?.includes('Restock');
                      return (
                        <tr key={tx._id} className="hover:bg-[#F8FAFC]">
                          <td className="px-6 py-4 text-xs text-[#64748B] whitespace-nowrap">
                            {new Date(tx.timestamp).toLocaleString([], {
                              month: 'short',
                              day: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </td>
                          <td className="px-6 py-4">
                            <span className="text-xs font-mono font-semibold text-[#1E293B]">
                              {tx.details?.sku || 'N/A'}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-center">
                            <span className={`text-xs font-bold px-2.5 py-0.5 rounded-full ${isRestock ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'}`}>
                              {isRestock ? '↑ Restock' : '↓ Issue'}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-center">
                            <span className={`text-sm font-bold ${isRestock ? 'text-emerald-600' : 'text-amber-600'}`}>
                              {isRestock ? '+' : '-'}{tx.details?.quantity}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-center text-xs font-bold text-[#1E293B]">
                            {tx.details?.newQuantity !== undefined ? tx.details.newQuantity : '—'}
                          </td>
                          <td className="px-6 py-4 text-xs text-[#1E293B] font-medium">
                            {tx.userId?.name || 'Authorized User'}
                          </td>
                          <td className="px-6 py-4 text-xs text-[#64748B] max-w-xs truncate">
                            {tx.details?.notes || '—'}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
              <Pagination page={txPage} pages={txPages} total={txTotal} limit={TX_LIMIT} onPageChange={setTxPage} />
            </div>
          )}
        </div>
      )}

      {/* Add/Edit Item Modal */}
      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title={editItem ? 'Edit Item' : 'New Inventory Item'}>
        <form onSubmit={handleSave} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className="label">Item Name</label>
              <input className="input-field" value={form.name} onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))} placeholder="e.g. Basmati Rice" required />
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
              <label className="label">Unit of Measure</label>
              <select className="input-field" value={form.unit} onChange={(e) => setForm((p) => ({ ...p, unit: e.target.value }))}>
                {UNITS.map((u) => <option key={u}>{u}</option>)}
              </select>
            </div>
            <div>
              <label className="label">Unit Price ($)</label>
              <input type="number" min="0" step="0.01" className="input-field" value={form.unitPrice} onChange={(e) => setForm((p) => ({ ...p, unitPrice: Number(e.target.value) }))} required />
            </div>
            <div>
              <label className="label">Current Quantity</label>
              <input type="number" min="0" className="input-field" value={form.quantity} onChange={(e) => setForm((p) => ({ ...p, quantity: Number(e.target.value) }))} required />
            </div>
            <div>
              <label className="label">Min Threshold Level</label>
              <input type="number" min="0" className="input-field" value={form.minStockLevel} onChange={(e) => setForm((p) => ({ ...p, minStockLevel: Number(e.target.value) }))} required />
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
      <Modal isOpen={!!txModal} onClose={() => setTxModal(null)} title={`Stock Action — ${txModal?.name}`}>
        <form onSubmit={handleTransaction} className="space-y-4">
          <div className="bg-[#F8FAFC] rounded-lg p-3 flex items-center justify-between border border-[#E2E8F0]">
            <div>
              <span className="text-xs text-[#64748B] block">Current Available Balance</span>
              <span className="text-xs font-mono text-[#94A3B8]">SKU: {txModal?.sku}</span>
            </div>
            <span className="text-base font-bold text-[#1E293B]">{txModal?.quantity} {txModal?.unit}</span>
          </div>

          <div>
            <label className="label">Transaction Type</label>
            <div className="grid grid-cols-2 gap-3">
              {['restock', 'issue'].map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setTxForm((p) => ({ ...p, type: t }))}
                  className={`py-3 rounded-lg border-2 text-xs font-bold uppercase tracking-wider transition-all ${
                    txForm.type === t
                      ? 'border-[#1D4ED8] bg-blue-50 text-[#1D4ED8]'
                      : 'border-[#E2E8F0] text-[#64748B] hover:border-[#94A3B8]'
                  }`}
                >
                  {t === 'restock' ? '↑ Restock (Incoming)' : '↓ Issue (Outgoing)'}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="label">Quantity ({txModal?.unit})</label>
            <input
              type="number"
              min="0.1"
              step="any"
              className="input-field"
              value={txForm.quantity}
              onChange={(e) => setTxForm((p) => ({ ...p, quantity: Number(e.target.value) }))}
              required
            />
          </div>

          <div>
            <label className="label">Notes / Operation Order (Optional)</label>
            <textarea
              className="input-field h-20 resize-none"
              value={txForm.notes}
              onChange={(e) => setTxForm((p) => ({ ...p, notes: e.target.value }))}
              placeholder="e.g. Issued for Breakfast daily plan, received shipment #4402..."
            />
          </div>

          <div className="flex gap-3 pt-2">
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
