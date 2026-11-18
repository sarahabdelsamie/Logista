import { useState, useEffect, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import AppLayout from '../../components/layout/AppLayout';
import Spinner from '../../components/ui/Spinner';
import api from '../../services/api';
import toast from 'react-hot-toast';

const MEAL_SLOTS = [
  { label: 'Breakfast', time: '06:00 HRS', icon: '🌅', category: 'Breakfast' },
  { label: 'Lunch',     time: '12:00 HRS', icon: '☀️', category: 'Lunch'     },
  { label: 'Dinner',    time: '18:00 HRS', icon: '🌙', category: 'Dinner'    },
];

const CreateDailyPlanPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [form, setForm] = useState({
    planName: '',
    date: new Date().toISOString().split('T')[0],
    studentCount: 100,
    selectedMeals: [],  // meal IDs
  });

  const [availableMeals, setAvailableMeals] = useState([]);
  const [preview, setPreview] = useState(null);
  const [loadingPreview, setLoadingPreview] = useState(false);
  const [saving, setSaving] = useState(false);
  const [pageLoading, setPageLoading] = useState(!!id);

  // Load published meals
  useEffect(() => {
    api.get('/meals', { params: { status: 'published', limit: 100 } })
      .then((res) => setAvailableMeals(res.data.data || []))
      .catch(() => {});
  }, []);

  // Load existing plan for editing
  useEffect(() => {
    if (!id) return;
    api.get(`/daily-plans/${id}`).then((res) => {
      const plan = res.data.data;
      setForm({
        planName: plan.planName,
        date: new Date(plan.date).toISOString().split('T')[0],
        studentCount: plan.studentCount,
        selectedMeals: plan.meals.map((m) => m._id || m),
      });
      setPageLoading(false);
    }).catch(() => setPageLoading(false));
  }, [id]);

  // Live preview whenever meals or student count changes
  const fetchPreview = useCallback(async () => {
    if (form.selectedMeals.length === 0 || !form.studentCount) {
      setPreview(null); return;
    }
    setLoadingPreview(true);
    try {
      const res = await api.post('/daily-plans/preview', {
        meals: form.selectedMeals,
        studentCount: Number(form.studentCount),
      });
      setPreview(res.data.data);
    } catch { /* silent */ }
    finally { setLoadingPreview(false); }
  }, [form.selectedMeals, form.studentCount]);

  useEffect(() => {
    const timer = setTimeout(fetchPreview, 600);
    return () => clearTimeout(timer);
  }, [fetchPreview]);

  const toggleMeal = (mealId) => {
    setForm((prev) => ({
      ...prev,
      selectedMeals: prev.selectedMeals.includes(mealId)
        ? prev.selectedMeals.filter((id) => id !== mealId)
        : [...prev.selectedMeals, mealId],
    }));
  };

  const getMealForSlot = (category) =>
    availableMeals.filter((m) => m.category === category);

  const handleSave = async (status) => {
    if (!form.planName) return toast.error('Plan name is required');
    if (!form.date) return toast.error('Date is required');
    if (form.selectedMeals.length === 0) return toast.error('Select at least one meal');
    setSaving(true);
    try {
      const payload = {
        planName: form.planName,
        date: form.date,
        studentCount: Number(form.studentCount),
        meals: form.selectedMeals,
        status,
      };
      if (id) {
        await api.put(`/daily-plans/${id}`, payload);
        toast.success('Plan updated');
      } else {
        await api.post('/daily-plans', payload);
        toast.success('Plan created');
      }
      navigate('/planning');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Save failed');
    } finally { setSaving(false); }
  };

  const totalStaff = preview
    ? (preview.workforceRequirements?.kitchen || 0) + (preview.workforceRequirements?.distribution || 0) + (preview.workforceRequirements?.cleaning || 0)
    : 0;

  if (pageLoading) return <AppLayout breadcrumbs={['Planning', 'Edit Plan']}><div className="flex justify-center py-20"><Spinner size="lg" /></div></AppLayout>;

  return (
    <AppLayout breadcrumbs={['Planning', id ? 'Edit Daily Plan' : 'Create Daily Plan']}>
      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="page-title">{id ? 'Edit Daily Plan' : 'Create Daily Plan'}</h1>
          <p className="page-subtitle">Configure logistics, meal requirements, and workforce allocations for the upcoming operational cycle.</p>
        </div>
        <button onClick={() => navigate('/planning')} className="btn-secondary">Cancel</button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* LEFT — General Info + Meals */}
        <div className="lg:col-span-2 space-y-6">

          {/* General Information */}
          <div className="card">
            <div className="flex items-center gap-2 mb-5">
              <div className="w-7 h-7 rounded-lg bg-[#F0F2F7] flex items-center justify-center">
                <svg className="w-4 h-4 text-[#1D4ED8]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h2 className="text-base font-semibold text-[#1E293B]">General Information</h2>
            </div>

            <div className="space-y-4">
              <div>
                <label className="label">Plan Name</label>
                <input
                  value={form.planName}
                  onChange={(e) => setForm((p) => ({ ...p, planName: e.target.value }))}
                  className="input-field"
                  placeholder="e.g., Weekly Combat Ration Plan — Alpha Company"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="label">Date of Execution</label>
                  <input
                    type="date"
                    value={form.date}
                    onChange={(e) => setForm((p) => ({ ...p, date: e.target.value }))}
                    className="input-field"
                  />
                </div>
                <div>
                  <label className="label">Expected Personnel Count</label>
                  <div className="relative">
                    <svg className="w-4 h-4 text-[#94A3B8] absolute left-3 top-1/2 -translate-y-1/2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    <input
                      type="number" min="1"
                      value={form.studentCount}
                      onChange={(e) => setForm((p) => ({ ...p, studentCount: e.target.value }))}
                      className="input-field pl-9"
                      placeholder="e.g., 250"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Meal Requirements */}
          <div className="card">
            <div className="flex items-center gap-2 mb-5">
              <div className="w-7 h-7 rounded-lg bg-[#F0F2F7] flex items-center justify-center">
                <svg className="w-4 h-4 text-[#1D4ED8]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
                </svg>
              </div>
              <h2 className="text-base font-semibold text-[#1E293B]">Meal Requirements</h2>
            </div>
            <p className="text-xs text-[#64748B] mb-4">Select the meals required for this operational cycle. Ingredients will be calculated automatically.</p>

            <div className="space-y-4">
              {MEAL_SLOTS.map((slot) => {
                const slotMeals = getMealForSlot(slot.category);
                return (
                  <div key={slot.label}>
                    <p className="text-xs font-semibold text-[#94A3B8] uppercase tracking-wide mb-2">
                      {slot.icon} {slot.label} — {slot.time}
                    </p>
                    {slotMeals.length === 0 ? (
                      <div className="border border-dashed border-[#E2E8F0] rounded-lg p-3 text-center">
                        <p className="text-xs text-[#94A3B8]">No published {slot.label.toLowerCase()} meals. <a href="/meals/add" className="text-[#1D4ED8] hover:underline">Add one →</a></p>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {slotMeals.map((meal) => {
                          const selected = form.selectedMeals.includes(meal._id);
                          return (
                            <button
                              key={meal._id}
                              type="button"
                              onClick={() => toggleMeal(meal._id)}
                              className={`text-left p-3 rounded-xl border-2 transition-all ${
                                selected
                                  ? 'border-[#1D4ED8] bg-blue-50'
                                  : 'border-[#E2E8F0] bg-white hover:border-[#94A3B8]'
                              }`}
                            >
                              <div className="flex items-center justify-between">
                                <div>
                                  <p className={`text-sm font-semibold ${selected ? 'text-[#1D4ED8]' : 'text-[#1E293B]'}`}>{meal.name}</p>
                                  <p className="text-xs text-[#94A3B8] mt-0.5">${meal.estimatedCostPerStudent?.toFixed(2)}/student · {meal.estimatedCalories || '—'} kcal</p>
                                </div>
                                <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${
                                  selected ? 'border-[#1D4ED8] bg-[#1D4ED8]' : 'border-[#CBD5E1]'
                                }`}>
                                  {selected && (
                                    <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                                    </svg>
                                  )}
                                </div>
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* RIGHT — Cost Preview + Workforce + Ingredients */}
        <div className="space-y-5">
          {/* Cost Card */}
          <div className="rounded-xl bg-[#1B2A4A] text-white p-6">
            <p className="text-[10px] font-semibold uppercase tracking-widest text-[#64748B] mb-1">Estimated Total Cost</p>
            <div className="flex items-center gap-2 mb-1">
              {loadingPreview ? (
                <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <p className="text-4xl font-bold text-white">${preview?.estimatedTotalCost?.toFixed(2) || '0.00'}</p>
              )}
            </div>
            <p className="text-xs text-[#64748B] mb-4">for {form.studentCount} personnel</p>

            <div className="bg-green-500/20 border border-green-500/30 rounded-lg px-3 py-2.5 flex items-center gap-2 mb-3">
              <svg className="w-4 h-4 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              <p className="text-xs text-green-300 font-medium">Budget Status: Within Limits</p>
            </div>

            {/* Inventory Availability Check Status */}
            {preview && (
              <div className={`rounded-lg px-3 py-2.5 flex items-center gap-2 border ${
                preview.inventoryFeasible !== false
                  ? 'bg-blue-500/20 border-blue-500/30 text-blue-200'
                  : 'bg-red-500/20 border-red-500/30 text-red-300'
              }`}>
                <span className="text-sm">
                  {preview.inventoryFeasible !== false ? '✓' : '⚠️'}
                </span>
                <p className="text-xs font-medium">
                  {preview.inventoryFeasible !== false
                    ? 'All ingredients available in stock'
                    : `Stock Shortage: ${preview.shortagesCount} item(s) insufficient`}
                </p>
              </div>
            )}
          </div>

          {/* Staff Needed */}
          {preview && (
            <div className="card bg-[#1D4ED8] border-[#1D4ED8]">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-9 h-9 bg-white/20 rounded-lg flex items-center justify-center">
                  <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                </div>
                <div>
                  <p className="text-white font-semibold text-sm">Staff Needed</p>
                  <p className="text-blue-200 text-xs">Based on {form.studentCount} personnel</p>
                </div>
                <span className="ml-auto text-3xl font-bold text-white">{totalStaff}</span>
              </div>
              <div className="grid grid-cols-3 gap-2 text-center">
                {[
                  { label: 'Kitchen', val: preview.workforceRequirements?.kitchen },
                  { label: 'Distribution', val: preview.workforceRequirements?.distribution },
                  { label: 'Cleaning', val: preview.workforceRequirements?.cleaning },
                ].map(({ label, val }) => (
                  <div key={label} className="bg-white/10 rounded-lg p-2">
                    <p className="text-white font-bold text-lg">{val || 0}</p>
                    <p className="text-blue-200 text-[10px] font-medium uppercase tracking-wide">{label}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Ingredient Preview */}
          {preview?.ingredientRequirements?.length > 0 && (
            <div className="card">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-semibold text-[#1E293B]">Ingredient Requirements</h3>
                <span className="text-[10px] text-[#94A3B8]">Stock Check</span>
              </div>
              <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                {preview.ingredientRequirements.map((req, i) => (
                  <div key={i} className="py-2 border-b border-[#F0F2F7] last:border-0">
                    <div className="flex items-center justify-between mb-1">
                      <p className="text-xs font-semibold text-[#1E293B] truncate flex-1 pr-2">{req.name || `Item ${i + 1}`}</p>
                      <div className="text-right flex-shrink-0">
                        <span className="text-xs font-bold text-[#1D4ED8]">{req.totalQty?.toFixed(2)}</span>
                        <span className="text-xs text-[#94A3B8] ml-1">{req.unit}</span>
                      </div>
                    </div>
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="text-[#94A3B8]">
                        In Stock: {req.currentStock !== undefined ? `${req.currentStock} ${req.unit}` : 'Checking...'}
                      </span>
                      {req.availabilityStatus && (
                        <span className={`px-2 py-0.2 rounded-full text-[10px] font-semibold ${
                          req.availabilityStatus === 'Sufficient'
                            ? 'bg-emerald-100 text-emerald-700'
                            : req.availabilityStatus === 'Low After Use'
                            ? 'bg-amber-100 text-amber-700'
                            : 'bg-red-100 text-red-700'
                        }`}>
                          {req.availabilityStatus}
                          {req.shortage > 0 ? ` (-${req.shortage})` : ''}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
              <p className="text-[10px] text-[#94A3B8] mt-2 text-center">Auto-calculated from selected meals × personnel count</p>
            </div>
          )}

          {!preview && form.selectedMeals.length === 0 && (
            <div className="card border-dashed border-[#E2E8F0] text-center py-8">
              <p className="text-[#94A3B8] text-sm">Select meals to see cost & ingredient preview</p>
            </div>
          )}
        </div>
      </div>

      {/* Bottom action buttons */}
      <div className="flex items-center justify-end gap-3 mt-8 pt-6 border-t border-[#E2E8F0]">
        <button onClick={() => navigate('/planning')} className="btn-secondary">Cancel</button>
        <button onClick={() => handleSave('draft')} disabled={saving} className="btn-secondary">
          {saving ? <Spinner size="sm" /> : null} Save Draft
        </button>
        <button onClick={() => handleSave('submitted')} disabled={saving} className="btn-primary">
          {saving ? <Spinner size="sm" /> : null} Submit for Approval
        </button>
      </div>
    </AppLayout>
  );
};

export default CreateDailyPlanPage;
