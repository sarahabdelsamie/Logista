import { useState, useEffect } from 'react';
import AppLayout from '../../components/layout/AppLayout';
import StatusBadge from '../../components/ui/StatusBadge';
import Spinner from '../../components/ui/Spinner';
import Pagination from '../../components/ui/Pagination';
import api from '../../services/api';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';

const MealsPage = () => {
  const [meals, setMeals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [pages, setPages] = useState(1);
  const navigate = useNavigate();
  const LIMIT = 8;

  useEffect(() => {
    const fetch = async () => {
      setLoading(true);
      try {
        const res = await api.get('/meals', { params: { search, category: categoryFilter, page, limit: LIMIT } });
        setMeals(res.data.data);
        setTotal(res.data.total);
        setPages(res.data.pages);
      } catch { toast.error('Failed to load meals'); }
      finally { setLoading(false); }
    };
    fetch();
  }, [search, categoryFilter, page]);

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this meal profile?')) return;
    try {
      await api.delete(`/meals/${id}`);
      toast.success('Meal deleted');
      setMeals((prev) => prev.filter((m) => m._id !== id));
    } catch { toast.error('Delete failed'); }
  };

  return (
    <AppLayout breadcrumbs={['Planning', 'Meal Management']}>
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="page-title">Meal Management</h1>
          <p className="page-subtitle">Define meal profiles, ingredients, and nutritional data.</p>
        </div>
        <button id="add-meal-btn" onClick={() => navigate('/meals/add')} className="btn-primary">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
          Add Meal Profile
        </button>
      </div>

      {/* Filters */}
      <div className="card mb-6">
        <div className="flex flex-wrap gap-3">
          <div className="relative flex-1 min-w-48">
            <svg className="w-4 h-4 text-[#94A3B8] absolute left-3 top-1/2 -translate-y-1/2" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
            <input type="text" placeholder="Search meals..." value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} className="input-field pl-9" />
          </div>
          <select className="input-field w-40" value={categoryFilter} onChange={(e) => { setCategoryFilter(e.target.value); setPage(1); }}>
            <option value="">All Categories</option>
            {['Breakfast', 'Lunch', 'Dinner', 'Snack'].map((c) => <option key={c}>{c}</option>)}
          </select>
        </div>
      </div>

      {/* Cards grid */}
      {loading ? (
        <div className="flex justify-center py-20"><Spinner size="lg" /></div>
      ) : meals.length === 0 ? (
        <div className="card text-center py-20">
          <div className="text-4xl mb-4">🍽️</div>
          <p className="text-[#1E293B] font-semibold mb-1">No meal profiles yet</p>
          <p className="text-sm text-[#64748B] mb-4">Create your first meal profile to get started.</p>
          <button onClick={() => navigate('/meals/add')} className="btn-primary mx-auto">Add Meal Profile</button>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 mb-6">
            {meals.map((meal) => (
              <div key={meal._id} className="card hover:shadow-md transition-shadow cursor-pointer group" onClick={() => navigate(`/meals/${meal._id}/edit`)}>
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <span className="badge-blue text-xs">{meal.category}</span>
                    <h3 className="text-sm font-semibold text-[#1E293B] mt-2 group-hover:text-[#1D4ED8] transition-colors">{meal.name}</h3>
                  </div>
                  <StatusBadge status={meal.status} />
                </div>
                <div className="space-y-1.5 mb-4">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-[#94A3B8]">Ingredients</span>
                    <span className="font-medium text-[#64748B]">{meal.ingredients?.length || 0} items</span>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-[#94A3B8]">Est. Calories</span>
                    <span className="font-medium text-[#64748B]">{meal.estimatedCalories || '—'} kcal</span>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-[#94A3B8]">Cost / Student</span>
                    <span className="font-bold text-[#1D4ED8]">${meal.estimatedCostPerStudent?.toFixed(2) || '0.00'}</span>
                  </div>
                </div>
                <div className="flex gap-2 pt-3 border-t border-[#E2E8F0]" onClick={(e) => e.stopPropagation()}>
                  <button onClick={() => navigate(`/meals/${meal._id}/edit`)} className="btn-secondary text-xs py-1.5 flex-1 justify-center">Edit</button>
                  <button onClick={() => handleDelete(meal._id)} className="btn-danger text-xs py-1.5 px-3">Delete</button>
                </div>
              </div>
            ))}
          </div>
          <div className="card p-0">
            <Pagination page={page} pages={pages} total={total} limit={LIMIT} onPageChange={setPage} />
          </div>
        </>
      )}
    </AppLayout>
  );
};

export default MealsPage;
