import { useState, useEffect, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import AppLayout from '../../components/layout/AppLayout';
import Spinner from '../../components/ui/Spinner';
import api from '../../services/api';
import toast from 'react-hot-toast';

const CATEGORIES = ['Breakfast', 'Lunch', 'Dinner', 'Snack'];
const emptyForm = {
  name: '',
  category: 'Lunch',
  preparationInstructions: '',
  estimatedCalories: '',
  ingredients: [],
  status: 'draft',
};

const AddMealPage = () => {
  const { id } = useParams(); // if editing
  const navigate = useNavigate();
  const [form, setForm] = useState(emptyForm);
  const [inventoryItems, setInventoryItems] = useState([]);
  const [ingSearch, setIngSearch] = useState('');
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(!!id);
  const [liveIngData, setLiveIngData] = useState({}); // itemId -> { name, sku, unitPrice, unit }

  // Load inventory for ingredient picker
  useEffect(() => {
    api.get('/inventory', { params: { limit: 200 } })
      .then((res) => setInventoryItems(res.data.data || []))
      .catch(() => {});
  }, []);

  // Load meal if editing
  useEffect(() => {
    if (!id) return;
    api.get(`/meals/${id}`).then((res) => {
      const meal = res.data.data;
      setForm({
        name: meal.name,
        category: meal.category,
        preparationInstructions: meal.preparationInstructions || '',
        estimatedCalories: meal.estimatedCalories || '',
        ingredients: meal.ingredients.map((ing) => ({
          itemId: ing.itemId?._id || ing.itemId,
          quantityPerStudent: ing.quantityPerStudent,
          unit: ing.unit,
        })),
        status: meal.status,
      });
      // Build live data map from populated data
      const map = {};
      meal.ingredients.forEach((ing) => {
        if (ing.itemId?._id) {
          map[ing.itemId._id] = { name: ing.itemId.name, sku: ing.itemId.sku, unitPrice: ing.itemId.unitPrice, unit: ing.itemId.unit };
        }
      });
      setLiveIngData(map);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, [id]);

  // Build live data from inventory items for new additions
  const getItemData = useCallback((itemId) => {
    return liveIngData[itemId] || inventoryItems.find((i) => i._id === itemId) || {};
  }, [liveIngData, inventoryItems]);

  // Estimated cost per student
  const estimatedCost = form.ingredients.reduce((sum, ing) => {
    const item = getItemData(ing.itemId);
    return sum + (ing.quantityPerStudent || 0) * (item.unitPrice || 0);
  }, 0);

  const addIngredient = (invItem) => {
    if (form.ingredients.find((i) => i.itemId === invItem._id)) {
      toast('Item already added'); return;
    }
    setLiveIngData((prev) => ({ ...prev, [invItem._id]: { name: invItem.name, sku: invItem.sku, unitPrice: invItem.unitPrice, unit: invItem.unit } }));
    setForm((prev) => ({
      ...prev,
      ingredients: [...prev.ingredients, { itemId: invItem._id, quantityPerStudent: 0.1, unit: invItem.unit }],
    }));
    setIngSearch('');
  };

  const updateIngredient = (idx, field, value) => {
    setForm((prev) => {
      const ings = [...prev.ingredients];
      ings[idx] = { ...ings[idx], [field]: value };
      return { ...prev, ingredients: ings };
    });
  };

  const removeIngredient = (idx) => {
    setForm((prev) => ({ ...prev, ingredients: prev.ingredients.filter((_, i) => i !== idx) }));
  };

  const handleSave = async (status) => {
    if (!form.name) return toast.error('Meal name is required');
    setSaving(true);
    try {
      const payload = { ...form, status, estimatedCalories: Number(form.estimatedCalories) || 0 };
      if (id) {
        await api.put(`/meals/${id}`, payload);
        toast.success('Meal updated');
      } else {
        await api.post('/meals', payload);
        toast.success('Meal created');
      }
      navigate('/meals');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Save failed');
    } finally {
      setSaving(false);
    }
  };

  const filteredInventory = inventoryItems.filter((item) =>
    ingSearch && (item.name.toLowerCase().includes(ingSearch.toLowerCase()) || item.sku.toLowerCase().includes(ingSearch.toLowerCase()))
  );

  if (loading) return <AppLayout breadcrumbs={['Planning', 'Meal Management', 'Edit']}><div className="flex justify-center py-20"><Spinner size="lg" /></div></AppLayout>;

  return (
    <AppLayout breadcrumbs={['Planning', 'Meal Management', id ? 'Edit Meal' : 'Add New Meal']}>
      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="page-title">{id ? 'Edit Meal Profile' : 'Add New Meal Profile'}</h1>
          <p className="page-subtitle">Define meal specifications, ingredients, and nutritional targets.</p>
        </div>
        <div className="flex gap-3">
          <button onClick={() => navigate('/meals')} className="btn-secondary">Cancel</button>
          <button onClick={() => handleSave('draft')} disabled={saving} className="btn-secondary">
            {saving ? <Spinner size="sm" /> : null} Save as Draft
          </button>
          <button onClick={() => handleSave('published')} disabled={saving} className="btn-primary" style={{ backgroundColor: '#1B2A4A' }}>
            {saving ? <Spinner size="sm" /> : null} Publish Meal
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* LEFT PANEL — Meal Specification */}
        <div className="lg:col-span-2 space-y-6">
          <div className="card">
            <h2 className="text-base font-semibold text-[#1E293B] mb-5">Meal Specification</h2>

            <div className="space-y-4">
              <div>
                <label className="label">Recipe Nomenclature</label>
                <input
                  value={form.name}
                  onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
                  className="input-field"
                  placeholder="e.g., Standard Infantry Ration - Beef Stew"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="label">Classification</label>
                  <select className="input-field" value={form.category} onChange={(e) => setForm((p) => ({ ...p, category: e.target.value }))}>
                    {CATEGORIES.map((c) => <option key={c}>{c}</option>)}
                  </select>
                </div>
                <div>
                  <label className="label">Est. Caloric Yield (kcal)</label>
                  <input
                    type="number" min="0"
                    value={form.estimatedCalories}
                    onChange={(e) => setForm((p) => ({ ...p, estimatedCalories: e.target.value }))}
                    className="input-field"
                    placeholder="e.g., 650"
                  />
                </div>
              </div>

              <div>
                <label className="label">Preparation Directives</label>
                <textarea
                  value={form.preparationInstructions}
                  onChange={(e) => setForm((p) => ({ ...p, preparationInstructions: e.target.value }))}
                  className="input-field h-28 resize-none"
                  placeholder="Step-by-step preparation instructions..."
                />
              </div>
            </div>
          </div>

          {/* Bill of Materials */}
          <div className="card">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-semibold text-[#1E293B]">Bill of Materials (Ingredients)</h2>
            </div>

            {/* Ingredients table */}
            {form.ingredients.length > 0 && (
              <div className="overflow-x-auto mb-4">
                <table className="w-full">
                  <thead className="table-header">
                    <tr>
                      <th className="px-4 py-2 text-left">Item (NSN/Description)</th>
                      <th className="px-4 py-2 text-right">Qty Req.</th>
                      <th className="px-4 py-2 text-left">UOM</th>
                      <th className="px-4 py-2 text-right">Unit Cost</th>
                      <th className="px-4 py-2 text-right">Total</th>
                      <th className="px-4 py-2"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#E2E8F0]">
                    {form.ingredients.map((ing, idx) => {
                      const item = getItemData(ing.itemId);
                      const lineTotal = (ing.quantityPerStudent || 0) * (item.unitPrice || 0);
                      return (
                        <tr key={idx} className="hover:bg-[#F8FAFC]">
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-2">
                              <div className="w-7 h-7 bg-[#F0F2F7] rounded flex items-center justify-center">
                                <svg className="w-3.5 h-3.5 text-[#64748B]" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" /></svg>
                              </div>
                              <div>
                                <p className="text-sm font-medium text-[#1E293B]">{item.name || '—'}</p>
                                <p className="text-xs text-[#94A3B8]">{item.sku || '—'}</p>
                              </div>
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            <input
                              type="number" min="0" step="0.01"
                              value={ing.quantityPerStudent}
                              onChange={(e) => updateIngredient(idx, 'quantityPerStudent', parseFloat(e.target.value) || 0)}
                              className="input-field w-20 text-right py-1 px-2"
                            />
                          </td>
                          <td className="px-4 py-3 text-sm text-[#64748B]">{ing.unit}</td>
                          <td className="px-4 py-3 text-sm text-[#64748B] text-right">${(item.unitPrice || 0).toFixed(2)}</td>
                          <td className="px-4 py-3 text-sm font-semibold text-[#1D4ED8] text-right">${lineTotal.toFixed(2)}</td>
                          <td className="px-4 py-3">
                            <button onClick={() => removeIngredient(idx)} className="text-red-400 hover:text-red-600 p-1">
                              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}

            {/* Ingredient search */}
            <div className="relative">
              <svg className="w-4 h-4 text-[#94A3B8] absolute left-3 top-1/2 -translate-y-1/2" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
              <input
                type="text"
                value={ingSearch}
                onChange={(e) => setIngSearch(e.target.value)}
                className="input-field pl-9"
                placeholder="Search inventory by NSN or name to add ingredient..."
              />
              {filteredInventory.length > 0 && (
                <div className="absolute z-10 w-full bg-white border border-[#E2E8F0] rounded-xl shadow-lg mt-1 max-h-52 overflow-y-auto">
                  {filteredInventory.map((item) => (
                    <button
                      key={item._id}
                      type="button"
                      onClick={() => addIngredient(item)}
                      className="w-full text-left px-4 py-3 hover:bg-[#F8FAFC] flex items-center justify-between border-b border-[#E2E8F0] last:border-0"
                    >
                      <div>
                        <p className="text-sm font-medium text-[#1E293B]">{item.name}</p>
                        <p className="text-xs text-[#94A3B8]">{item.sku} · {item.unit}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-xs font-semibold text-[#1D4ED8]">${item.unitPrice?.toFixed(2)}/{item.unit}</p>
                        <span className={`text-xs ${item.status === 'Out of Stock' ? 'text-red-500' : 'text-green-600'}`}>{item.status}</span>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* RIGHT PANEL — Cost & Nutrition */}
        <div className="space-y-5">
          {/* Cost card */}
          <div className="rounded-xl bg-[#1B2A4A] text-white p-6">
            <p className="text-[10px] font-semibold uppercase tracking-widest text-[#94A3B8] mb-1">Estimated Cost Per Unit</p>
            <p className="text-4xl font-bold text-white mb-0.5">${estimatedCost.toFixed(2)}</p>
            <p className="text-xs text-[#64748B] mb-5">USD per student</p>

            <div className="space-y-2.5 text-sm">
              <div className="flex items-center justify-between border-b border-white/10 pb-2.5">
                <span className="text-[#94A3B8]">Ingredients Total</span>
                <span className="font-semibold text-white">${estimatedCost.toFixed(2)}</span>
              </div>
              <div className="flex items-center justify-between border-b border-white/10 pb-2.5">
                <span className="text-[#94A3B8]">Est. Packaging</span>
                <span className="font-semibold text-white">$0.45</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-white font-semibold">Total Gross Est.</span>
                <span className="font-bold text-white">${(estimatedCost + 0.45).toFixed(2)}</span>
              </div>
            </div>

            <div className="mt-5 bg-green-500/20 border border-green-500/30 rounded-lg px-3 py-2.5 flex items-center gap-2">
              <svg className="w-4 h-4 text-green-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
              <p className="text-xs text-green-300 font-medium">Within standard operational budget</p>
            </div>
          </div>

          {/* Nutritional Profile */}
          <div className="card">
            <h3 className="text-sm font-semibold text-[#1E293B] mb-4">Nutritional Profile</h3>
            <div className="space-y-3">
              {[
                { label: 'Protein', value: 28, target: 35, color: 'bg-blue-500' },
                { label: 'Carbohydrates', value: 55, target: 65, color: 'bg-amber-500' },
                { label: 'Fats', value: 18, target: 25, color: 'bg-green-500' },
              ].map(({ label, value, target, color }) => (
                <div key={label}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-medium text-[#64748B]">{label}</span>
                    <span className="text-xs text-[#94A3B8]">{value}g / {target}g target</span>
                  </div>
                  <div className="h-1.5 bg-[#F0F2F7] rounded-full overflow-hidden">
                    <div className={`h-full rounded-full ${color}`} style={{ width: `${(value / target) * 100}%` }} />
                  </div>
                </div>
              ))}
            </div>
            <p className="text-xs text-[#94A3B8] mt-3">Based on estimated caloric yield: <span className="font-medium text-[#64748B]">{form.estimatedCalories || '—'} kcal</span></p>
          </div>

          {/* Meal preview */}
          <div className="card">
            <h3 className="text-sm font-semibold text-[#1E293B] mb-3">Meal Preview</h3>
            <div className="w-full h-32 bg-gradient-to-br from-[#1B2A4A] to-[#1D4ED8] rounded-lg flex items-center justify-center">
              <div className="text-center">
                <p className="text-3xl mb-1">🍽️</p>
                <p className="text-white text-xs font-medium">{form.name || 'Unnamed Meal'}</p>
                <p className="text-[#94A3B8] text-xs">{form.category}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  );
};

export default AddMealPage;
