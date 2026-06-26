import { useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import toast from 'react-hot-toast';
import Spinner from '../components/ui/Spinner';

const ForgotPasswordPage = () => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email) return toast.error('Please enter your email address');
    setLoading(true);
    try {
      await api.post('/auth/forgot-password', { email });
      setSent(true);
      toast.success('Reset link sent! Check your inbox.');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F0F2F7] flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-2xl shadow-lg border border-[#E2E8F0] overflow-hidden">
          {/* Header */}
          <div className="px-8 pt-8 pb-6 text-center border-b border-[#E2E8F0]">
            <div className="inline-flex items-center justify-center w-14 h-14 bg-[#1D4ED8] rounded-xl mb-4">
              <svg className="w-7 h-7 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-[#1B2A4A]">LOGISTA</h1>
            <p className="text-sm text-[#64748B] mt-0.5 font-medium">Reset Password</p>
          </div>

          <div className="px-8 py-7">
            {sent ? (
              <div className="text-center space-y-4">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
                  <svg className="w-8 h-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <p className="text-[#1E293B] font-semibold">Reset Link Sent</p>
                <p className="text-sm text-[#64748B]">Check your email inbox and follow the instructions to reset your password.</p>
                <Link to="/login" className="block text-sm text-[#1D4ED8] hover:underline font-medium mt-4">
                  ← Back to Login
                </Link>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-5">
                <p className="text-sm text-[#64748B] leading-relaxed">
                  Enter the email address associated with your account and we'll send you a link to reset your password.
                </p>

                <div>
                  <label className="label">Email Address</label>
                  <div className="relative">
                    <svg className="w-4 h-4 text-[#94A3B8] absolute left-3 top-1/2 -translate-y-1/2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                    <input
                      id="forgot-email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="name@company.mil"
                      className="input-field pl-9"
                    />
                  </div>
                </div>

                <button
                  id="forgot-submit"
                  type="submit"
                  disabled={loading}
                  className="w-full bg-[#1D4ED8] text-white py-3 rounded-lg font-semibold text-sm hover:bg-blue-700 transition-colors flex items-center justify-center gap-2 disabled:opacity-60"
                >
                  {loading ? <Spinner size="sm" /> : null}
                  {loading ? 'Sending...' : 'Send Reset Link →'}
                </button>

                <div className="text-center">
                  <Link to="/login" className="text-sm text-[#64748B] hover:text-[#1D4ED8] font-medium">
                    ← Back to Login
                  </Link>
                </div>
              </form>
            )}
          </div>
        </div>

        <p className="text-center text-xs text-[#94A3B8] mt-6">
          © {new Date().getFullYear()} Command Logistics Systems. All Rights Reserved.
        </p>
      </div>
    </div>
  );
};

export default ForgotPasswordPage;
