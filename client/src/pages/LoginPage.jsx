import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import Spinner from '../components/ui/Spinner';
import api from '../services/api';

const DEFAULT_DEMO_ACCOUNTS = [
  {
    role: 'Admin',
    name: 'Demo Administrator',
    email: 'demo.admin@logista.mil',
    password: 'Demo@123',
    rank: 'Colonel',
    unit: 'HQ Logistics Command',
    badgeClass: 'bg-purple-100 text-purple-800 border-purple-200',
    description: 'Full administrative access: User management, workforce rules, audit logs, and approval overrides.',
  },
  {
    role: 'Mezz Manager',
    name: 'Demo Mess Manager',
    email: 'demo.manager@logista.mil',
    password: 'Demo@123',
    rank: 'Major',
    unit: '1st Battalion Mess Hall',
    badgeClass: 'bg-blue-100 text-blue-800 border-blue-200',
    description: 'Daily meal planning, workforce calculations, headcount scheduling, and supply request approval workflows.',
  },
  {
    role: 'Kitchen Supervisor',
    name: 'Demo Kitchen Supervisor',
    email: 'demo.kitchen@logista.mil',
    password: 'Demo@123',
    rank: 'Sergeant',
    unit: 'Bravo Mess Hall Galley',
    badgeClass: 'bg-amber-100 text-amber-800 border-amber-200',
    description: 'Recipe scaling, meal profile preparations, preparation instructions, and kitchen meal logs.',
  },
  {
    role: 'Store Keeper',
    name: 'Demo Store Keeper',
    email: 'demo.store@logista.mil',
    password: 'Demo@123',
    rank: 'Corporal',
    unit: 'Depot Supply Station 4',
    badgeClass: 'bg-emerald-100 text-emerald-800 border-emerald-200',
    description: 'Depot stock management, issue & restock transactions, automated low-stock and stockout alerts.',
  },
];

const LoginPage = () => {
  const [form, setForm] = useState({ email: '', password: '', remember: false });
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [isDemoOpen, setIsDemoOpen] = useState(true);
  const [demoAccounts, setDemoAccounts] = useState(DEFAULT_DEMO_ACCOUNTS);
  const [copiedKey, setCopiedKey] = useState(null);

  const { login } = useAuth();
  const navigate = useNavigate();

  // Optionally sync with backend demo-accounts endpoint if live
  useEffect(() => {
    let mounted = true;
    api
      .get('/auth/demo-accounts')
      .then((res) => {
        if (mounted && res.data?.data && Array.isArray(res.data.data)) {
          // Merge styling badges with backend data
          const merged = res.data.data.map((acc) => {
            const match = DEFAULT_DEMO_ACCOUNTS.find((d) => d.email === acc.email);
            return {
              ...acc,
              badgeClass: match?.badgeClass || 'bg-gray-100 text-gray-800 border-gray-200',
            };
          });
          setDemoAccounts(merged);
        }
      })
      .catch(() => {
        // Fall back gracefully to DEFAULT_DEMO_ACCOUNTS
      });
    return () => {
      mounted = false;
    };
  }, []);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm((prev) => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
  };

  const handleCopy = async (text, key, label) => {
    try {
      if (navigator?.clipboard?.writeText) {
        await navigator.clipboard.writeText(text);
      } else {
        const textArea = document.createElement('textarea');
        textArea.value = text;
        textArea.style.position = 'fixed';
        textArea.style.left = '-999999px';
        textArea.style.top = '-999999px';
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        document.execCommand('copy');
        textArea.remove();
      }
      setCopiedKey(key);
      toast.success(`${label} copied to clipboard`);
      setTimeout(() => setCopiedKey(null), 2000);
    } catch {
      toast.error('Failed to copy to clipboard');
    }
  };

  const handleCopyAll = () => {
    const summary = demoAccounts
      .map(
        (acc) =>
          `[${acc.role}] (${acc.rank} - ${acc.name})\nEmail: ${acc.email}\nPassword: ${acc.password}\nScope: ${acc.description}`
      )
      .join('\n\n-----------------------------\n\n');
    handleCopy(summary, 'all', 'All demo credentials');
  };

  const handleAutoFill = (acc) => {
    setForm((prev) => ({
      ...prev,
      email: acc.email,
      password: acc.password,
    }));
    toast.success(`Loaded credentials for ${acc.role}`);
    const emailInput = document.getElementById('login-email');
    if (emailInput) emailInput.focus();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
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

  return (
    <div className="min-h-screen bg-[#F0F2F7] flex items-center justify-center p-4 py-8">
      <div className="w-full max-w-xl space-y-4">
        {/* Main Login Card */}
        <div className="bg-white rounded-2xl shadow-lg border border-[#E2E8F0] overflow-hidden">
          {/* Header */}
          <div className="px-8 pt-8 pb-6 text-center border-b border-[#E2E8F0]">
            <div className="inline-flex items-center justify-center w-14 h-14 bg-[#1B2A4A] rounded-xl mb-4 shadow-sm">
              <svg className="w-7 h-7 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17a2 2 0 11-4 0 2 2 0 014 0zM19 17a2 2 0 11-4 0 2 2 0 014 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16V6a1 1 0 00-1-1H4a1 1 0 00-1 1v10l2.5.5M13 16H3M13 16l2.5-9H21l-2 9h-4" />
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-[#1B2A4A] tracking-tight">LOGISTA</h1>
            <p className="text-xs font-semibold text-[#94A3B8] uppercase tracking-[0.2em] mt-0.5">Military Logistics & Mess Management</p>
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
                  aria-label="Toggle password visibility"
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
              className="w-full bg-[#1B2A4A] text-white py-3 rounded-lg font-semibold text-sm hover:bg-[#243557] transition-colors duration-200 flex items-center justify-center gap-2 disabled:opacity-60 shadow-sm"
            >
              {loading ? <Spinner size="sm" /> : (
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
              )}
              {loading ? 'Authenticating...' : 'Sign In to System'}
            </button>
          </form>

          {/* Footer */}
          <div className="px-8 pb-5 text-center">
            <div className="flex items-center justify-center gap-2 text-[#94A3B8]">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
              <span className="text-[10px] font-semibold uppercase tracking-widest">Authorized Access Only</span>
            </div>
          </div>
        </div>

        {/* Public Demo Accounts Card (For Recruiters & Portfolio Exploration) */}
        <div className="bg-white rounded-2xl shadow-lg border border-[#E2E8F0] overflow-hidden">
          {/* Header & Controls */}
          <div className="px-6 py-4 bg-gradient-to-r from-[#1B2A4A] to-[#243557] text-white flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center text-amber-300">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <div>
                <h2 className="text-sm font-bold tracking-wide flex items-center gap-2">
                  Public Demo Accounts
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 font-medium">
                    Instant Access
                  </span>
                </h2>
                <p className="text-[11px] text-gray-300">Explore LOGISTA using any of the 4 military roles</p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleCopyAll}
                className="text-xs bg-white/10 hover:bg-white/20 text-white px-2.5 py-1.5 rounded-md font-medium flex items-center gap-1.5 transition-colors border border-white/15"
                title="Copy all demo accounts to clipboard"
              >
                {copiedKey === 'all' ? (
                  <>
                    <svg className="w-3.5 h-3.5 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <span className="text-emerald-300 text-[11px]">Copied All</span>
                  </>
                ) : (
                  <>
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                    </svg>
                    <span className="text-[11px]">Copy All</span>
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={() => setIsDemoOpen(!isDemoOpen)}
                className="w-8 h-8 rounded-md bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors text-white"
                aria-label="Toggle demo accounts section"
              >
                <svg
                  className={`w-4 h-4 transition-transform duration-200 ${isDemoOpen ? 'rotate-180' : ''}`}
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
            </div>
          </div>

          {/* Collapsible Content */}
          {isDemoOpen && (
            <div className="p-4 sm:p-5 space-y-3 bg-[#FAFBFD]">
              <div className="grid grid-cols-1 gap-3">
                {demoAccounts.map((acc, idx) => {
                  const emailKey = `${acc.email}-email`;
                  const passKey = `${acc.email}-pass`;

                  return (
                    <div
                      key={idx}
                      className="p-3.5 rounded-xl bg-white border border-[#E2E8F0] shadow-sm hover:border-[#CBD5E1] transition-all"
                    >
                      {/* Top Bar: Role & Rank & Auto-Fill */}
                      <div className="flex items-center justify-between gap-2 mb-1.5">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className={`text-[11px] font-bold px-2 py-0.5 rounded-md border ${acc.badgeClass}`}>
                            {acc.role}
                          </span>
                          <span className="text-xs font-semibold text-[#1E293B]">
                            {acc.rank} • {acc.name}
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleAutoFill(acc)}
                          className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#1D4ED8] bg-blue-50 hover:bg-blue-100 border border-blue-200 px-2 py-1 rounded-md transition-colors"
                          title={`Auto-fill form with ${acc.role} credentials`}
                        >
                          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                          </svg>
                          <span>Auto-Fill</span>
                        </button>
                      </div>

                      {/* Description */}
                      <p className="text-[11px] text-[#64748B] mb-2.5 leading-relaxed">{acc.description}</p>

                      {/* Credentials Row */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                        {/* Email */}
                        <div className="flex items-center justify-between bg-[#F8FAFC] border border-[#E2E8F0] rounded-lg px-2.5 py-1.5">
                          <span className="font-mono text-[11px] text-[#334155] truncate select-all">{acc.email}</span>
                          <button
                            type="button"
                            onClick={() => handleCopy(acc.email, emailKey, `${acc.role} email`)}
                            className="ml-2 text-[#64748B] hover:text-[#1E293B] flex items-center gap-1 text-[10px] font-medium transition-colors"
                            title="Copy Email"
                          >
                            {copiedKey === emailKey ? (
                              <span className="text-emerald-600 font-bold flex items-center gap-0.5">
                                <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                </svg>
                                Copied
                              </span>
                            ) : (
                              <>
                                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                                </svg>
                                <span>Copy</span>
                              </>
                            )}
                          </button>
                        </div>

                        {/* Password */}
                        <div className="flex items-center justify-between bg-[#F8FAFC] border border-[#E2E8F0] rounded-lg px-2.5 py-1.5">
                          <span className="font-mono text-[11px] text-[#334155] select-all">{acc.password}</span>
                          <button
                            type="button"
                            onClick={() => handleCopy(acc.password, passKey, `${acc.role} password`)}
                            className="ml-2 text-[#64748B] hover:text-[#1E293B] flex items-center gap-1 text-[10px] font-medium transition-colors"
                            title="Copy Password"
                          >
                            {copiedKey === passKey ? (
                              <span className="text-emerald-600 font-bold flex items-center gap-0.5">
                                <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                </svg>
                                Copied
                              </span>
                            ) : (
                              <>
                                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                                </svg>
                                <span>Copy</span>
                              </>
                            )}
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="pt-2 text-center text-[11px] text-[#94A3B8]">
                Protected Demo Environment • Destructive resets are restricted to preserve portfolio integrity
              </div>
            </div>
          )}
        </div>

        <p className="text-center text-xs text-[#94A3B8] pt-2">
          © {new Date().getFullYear()} Command Logistics Systems. All Rights Reserved.
        </p>
      </div>
    </div>
  );
};

export default LoginPage;
