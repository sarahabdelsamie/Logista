import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import Spinner from '../components/ui/Spinner';

const QUICK_ACCOUNTS = [
  { label: 'Admin', email: 'admin@logista.mil', password: 'Admin@123' },
  { label: 'Manager', email: 'manager@logista.mil', password: 'Pass@123' },
  { label: 'Kitchen', email: 'kitchen@logista.mil', password: 'Pass@123' },
  { label: 'Store Keeper', email: 'store@logista.mil', password: 'Pass@123' },
];

const LoginPage = () => {
  const [form, setForm] = useState({ email: '', password: '', remember: false });
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm((prev) => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
  };

  const handleSubmit = async (e) => {
    if (e?.preventDefault) e.preventDefault();
    if (!form.email || !form.password) return toast.error('Please fill in all fields');
    setLoading(true);
    try {
      const user = await login(form.email, form.password);
      toast.success(`Welcome back, ${user.name}!`);
      navigate('/dashboard');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickLogin = async (account) => {
    setForm((prev) => ({ ...prev, email: account.email, password: account.password }));
    setLoading(true);
    try {
      const user = await login(account.email, account.password);
      toast.success(`Welcome back, ${user.name}!`);
      navigate('/dashboard');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F0F2F7] flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Card */}
        <div className="bg-white rounded-2xl shadow-lg border border-[#E2E8F0] overflow-hidden">
          {/* Header */}
          <div className="px-8 pt-8 pb-6 text-center border-b border-[#E2E8F0]">
            <div className="inline-flex items-center justify-center w-14 h-14 bg-[#1B2A4A] rounded-xl mb-4">
              <svg className="w-7 h-7 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17a2 2 0 11-4 0 2 2 0 014 0zM19 17a2 2 0 11-4 0 2 2 0 014 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16V6a1 1 0 00-1-1H4a1 1 0 00-1 1v10l2.5.5M13 16H3M13 16l2.5-9H21l-2 9h-4" />
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-[#1B2A4A] tracking-tight">LOGISTA</h1>
            <p className="text-xs font-semibold text-[#94A3B8] uppercase tracking-[0.2em] mt-0.5">Military Logistics</p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="px-8 py-7 space-y-5">
            <div>
              <label className="label">Username or Email</label>
              <div className="relative">
                <svg className="w-4 h-4 text-[#94A3B8] absolute left-3 top-1/2 -translate-y-1/2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
                <input
                  id="login-email"
                  type="email"
                  name="email"
                  value={form.email}
                  onChange={handleChange}
                  placeholder="name@unit.mil"
                  className="input-field pl-9"
                  autoComplete="email"
                />
              </div>
            </div>

            <div>
              <label className="label">Password</label>
              <div className="relative">
                <svg className="w-4 h-4 text-[#94A3B8] absolute left-3 top-1/2 -translate-y-1/2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
                <input
                  id="login-password"
                  type={showPass ? 'text' : 'password'}
                  name="password"
                  value={form.password}
                  onChange={handleChange}
                  placeholder="••••••••"
                  className="input-field pl-9 pr-10"
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPass(!showPass)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#94A3B8] hover:text-[#64748B]"
                >
                  {showPass ? (
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" /></svg>
                  ) : (
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                  )}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  name="remember"
                  checked={form.remember}
                  onChange={handleChange}
                  className="w-4 h-4 rounded border-[#E2E8F0] text-[#1D4ED8] focus:ring-[#1D4ED8]"
                />
                <span className="text-sm text-[#64748B]">Remember me</span>
              </label>
              <Link to="/forgot-password" className="text-sm text-[#1D4ED8] hover:underline font-medium">
                Forgot password?
              </Link>
            </div>

            <button
              id="login-submit"
              type="submit"
              disabled={loading}
              className="w-full bg-[#1B2A4A] text-white py-3 rounded-lg font-semibold text-sm hover:bg-[#243557] transition-colors duration-200 flex items-center justify-center gap-2 disabled:opacity-60"
            >
              {loading ? <Spinner size="sm" /> : (
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
              )}
              {loading ? 'Authenticating...' : 'Sign In to System'}
            </button>

            {/* Quick Demo Login */}
            <div className="pt-2">
              <div className="relative flex py-2 items-center">
                <div className="flex-grow border-t border-[#E2E8F0]"></div>
                <span className="flex-shrink mx-3 text-[11px] font-semibold text-[#94A3B8] uppercase tracking-wider">
                  Quick Demo Login
                </span>
                <div className="flex-grow border-t border-[#E2E8F0]"></div>
              </div>

              <div className="grid grid-cols-2 gap-2 mt-1">
                {QUICK_ACCOUNTS.map((acc) => (
                  <button
                    key={acc.label}
                    type="button"
                    disabled={loading}
                    onClick={() => handleQuickLogin(acc)}
                    className="flex items-center justify-between px-3 py-2 text-xs font-medium rounded-lg border border-[#E2E8F0] bg-[#F8FAFC] hover:bg-[#F1F5F9] hover:border-[#CBD5E1] text-[#1E293B] transition-colors disabled:opacity-50"
                  >
                    <span className="font-semibold">{acc.label}</span>
                    <span className="text-[10px] text-[#64748B] flex items-center gap-0.5 font-mono">
                      ⚡ Login
                    </span>
                  </button>
                ))}
              </div>
            </div>
          </form>

          {/* Footer */}
          <div className="px-8 pb-6 text-center">
            <div className="flex items-center justify-center gap-2 text-[#94A3B8]">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
              <span className="text-[10px] font-semibold uppercase tracking-widest">Secure Access Required</span>
            </div>
          </div>
        </div>

        <p className="text-center text-xs text-[#94A3B8] mt-6">
          © {new Date().getFullYear()} Command Logistics Systems. All Rights Reserved.
        </p>
      </div>
    </div>
  );
};

export default LoginPage;
