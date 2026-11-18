import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';
import toast from 'react-hot-toast';
import Modal from '../ui/Modal';
import Spinner from '../ui/Spinner';

const TopNavbar = ({ breadcrumbs = [] }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [searchValue, setSearchValue] = useState('');

  // Notifications state
  const [notifications, setNotifications] = useState([]);
  const [notifOpen, setNotifOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  // User profile dropdown & change password modal
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [pwdModalOpen, setPwdModalOpen] = useState(false);
  const [pwdForm, setPwdForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [pwdSaving, setPwdSaving] = useState(false);

  const notifRef = useRef(null);
  const userMenuRef = useRef(null);

  const fetchNotifications = async () => {
    try {
      const res = await api.get('/notifications');
      if (res.data?.success) {
        setNotifications(res.data.data || []);
        setUnreadCount((res.data.data || []).filter((n) => !n.isRead).length);
      }
    } catch {
      // Graceful fallback
    }
  };

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
  }, []);

  // Close dropdowns on outside click
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (notifRef.current && !notifRef.current.contains(e.target)) {
        setNotifOpen(false);
      }
      if (userMenuRef.current && !userMenuRef.current.contains(e.target)) {
        setUserMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const markAsRead = async (id) => {
    try {
      await api.patch(`/notifications/${id}/read`);
      setNotifications((prev) =>
        prev.map((n) => (n._id === id ? { ...n, isRead: true } : n))
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch {
      toast.error('Failed to mark notification as read');
    }
  };

  const markAllRead = async () => {
    try {
      await api.patch('/notifications/mark-all-read');
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      setUnreadCount(0);
      toast.success('All notifications marked as read');
    } catch {
      toast.error('Failed to mark all as read');
    }
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    if (!pwdForm.currentPassword || !pwdForm.newPassword) {
      return toast.error('Please fill in all password fields');
    }
    if (pwdForm.newPassword.length < 6) {
      return toast.error('New password must be at least 6 characters');
    }
    if (pwdForm.newPassword !== pwdForm.confirmPassword) {
      return toast.error('New passwords do not match');
    }

    setPwdSaving(true);
    try {
      const res = await api.post('/auth/change-password', {
        currentPassword: pwdForm.currentPassword,
        newPassword: pwdForm.newPassword,
      });
      if (res.data?.success) {
        toast.success('Password changed successfully');
        setPwdModalOpen(false);
        setPwdForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to change password');
    } finally {
      setPwdSaving(false);
    }
  };

  return (
    <header className="h-16 bg-white border-b border-[#E2E8F0] flex items-center justify-between px-6 sticky top-0 z-20">
      {/* Left: breadcrumbs */}
      <div className="flex items-center gap-2 text-xs text-[#64748B]">
        <span className="font-semibold text-[#94A3B8] uppercase tracking-wide">LOGISTICS CORE</span>
        {breadcrumbs.map((crumb, i) => (
          <span key={i} className="flex items-center gap-2">
            <span className="text-[#CBD5E1]">›</span>
            <span className={i === breadcrumbs.length - 1 ? 'text-[#1D4ED8] font-semibold' : 'text-[#64748B] font-medium uppercase tracking-wide'}>
              {crumb}
            </span>
          </span>
        ))}
      </div>

      {/* Right: search + notification bell + user dropdown */}
      <div className="flex items-center gap-3">
        {/* Search */}
        <div className="relative hidden md:block">
          <svg className="w-4 h-4 text-[#94A3B8] absolute left-3 top-1/2 -translate-y-1/2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            placeholder="Search LOGISTA..."
            value={searchValue}
            onChange={(e) => setSearchValue(e.target.value)}
            className="pl-9 pr-4 py-2 text-sm border border-[#E2E8F0] rounded-lg w-56 focus:outline-none focus:ring-2 focus:ring-[#1D4ED8] focus:border-transparent bg-[#F8FAFC]"
          />
        </div>

        {/* Notifications Bell */}
        <div className="relative" ref={notifRef}>
          <button
            onClick={() => setNotifOpen(!notifOpen)}
            className="relative p-2 rounded-lg hover:bg-gray-100 text-[#64748B] hover:text-[#1E293B] transition-colors"
            title="Notifications"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
            </svg>
            {unreadCount > 0 && (
              <span className="absolute -top-0.5 -right-0.5 bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.2 rounded-full min-w-4 text-center">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </button>

          {/* Notifications Dropdown Panel */}
          {notifOpen && (
            <div className="absolute right-0 mt-2 w-80 md:w-96 bg-white border border-[#E2E8F0] rounded-xl shadow-xl z-50 overflow-hidden">
              <div className="px-4 py-3 bg-[#1B2A4A] text-white flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-semibold">Notification Center</h4>
                  <p className="text-[11px] text-[#94A3B8]">{unreadCount} unread update{unreadCount !== 1 ? 's' : ''}</p>
                </div>
                {unreadCount > 0 && (
                  <button
                    onClick={markAllRead}
                    className="text-xs text-blue-300 hover:text-white underline font-medium"
                  >
                    Mark all read
                  </button>
                )}
              </div>

              <div className="max-h-80 overflow-y-auto divide-y divide-[#F0F2F7]">
                {notifications.length === 0 ? (
                  <div className="py-8 text-center text-sm text-[#94A3B8]">
                    No notifications at this time
                  </div>
                ) : (
                  notifications.slice(0, 15).map((n) => (
                    <div
                      key={n._id}
                      onClick={() => !n.isRead && markAsRead(n._id)}
                      className={`p-3.5 flex items-start gap-3 transition-colors cursor-pointer hover:bg-[#F8FAFC] ${
                        !n.isRead ? 'bg-blue-50/50' : ''
                      }`}
                    >
                      <span
                        className={`w-2 h-2 rounded-full mt-1.5 flex-shrink-0 ${
                          !n.isRead
                            ? n.type === 'alert'
                              ? 'bg-red-500'
                              : n.type === 'warning'
                              ? 'bg-amber-500'
                              : 'bg-blue-600'
                            : 'bg-transparent'
                        }`}
                      />
                      <div className="flex-1 min-w-0">
                        <p className={`text-xs ${!n.isRead ? 'font-semibold text-[#1E293B]' : 'text-[#64748B]'}`}>
                          {n.message}
                        </p>
                        <p className="text-[10px] text-[#94A3B8] mt-1">
                          {new Date(n.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} • {new Date(n.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* User Dropdown */}
        <div className="relative" ref={userMenuRef}>
          <div
            onClick={() => setUserMenuOpen(!userMenuOpen)}
            className="flex items-center gap-2 pl-3 border-l border-[#E2E8F0] cursor-pointer hover:opacity-80 transition-opacity"
          >
            <div className="w-8 h-8 rounded-full bg-[#1B2A4A] flex items-center justify-center flex-shrink-0">
              <span className="text-white text-sm font-semibold">{user?.name?.charAt(0)?.toUpperCase() || 'U'}</span>
            </div>
            <div className="hidden sm:block text-left">
              <p className="text-sm font-medium text-[#1E293B] leading-tight">{user?.name}</p>
              <p className="text-xs text-[#94A3B8]">{user?.rank ? `${user?.rank} • ` : ''}{user?.role}</p>
            </div>
            <svg className="w-4 h-4 text-[#94A3B8] ml-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </div>

          {/* User Menu Panel */}
          {userMenuOpen && (
            <div className="absolute right-0 mt-2 w-64 bg-white border border-[#E2E8F0] rounded-xl shadow-xl z-50 py-1 overflow-hidden">
              <div className="px-4 py-3 border-b border-[#F0F2F7] bg-[#F8FAFC]">
                <p className="text-sm font-semibold text-[#1E293B]">{user?.name}</p>
                <p className="text-xs text-[#64748B]">{user?.email}</p>
                <div className="mt-1.5 flex items-center gap-2">
                  <span className="badge-blue text-[10px]">{user?.role}</span>
                  {user?.unit && <span className="text-[10px] text-[#94A3B8]">{user.unit}</span>}
                </div>
              </div>

              <div className="py-1">
                <button
                  onClick={() => {
                    setUserMenuOpen(false);
                    setPwdModalOpen(true);
                  }}
                  className="w-full text-left px-4 py-2.5 text-xs text-[#1E293B] hover:bg-[#F8FAFC] flex items-center gap-2.5"
                >
                  <svg className="w-4 h-4 text-[#64748B]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
                  </svg>
                  Change Password
                </button>

                <button
                  onClick={() => {
                    setUserMenuOpen(false);
                    logout();
                    navigate('/login');
                  }}
                  className="w-full text-left px-4 py-2.5 text-xs text-red-600 hover:bg-red-50 flex items-center gap-2.5 border-t border-[#F0F2F7]"
                >
                  <svg className="w-4 h-4 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                  </svg>
                  Sign Out
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Change Password Modal */}
      <Modal isOpen={pwdModalOpen} onClose={() => setPwdModalOpen(false)} title="Change Password">
        <form onSubmit={handlePasswordSubmit} className="space-y-4">
          <div>
            <label className="label">Current Password</label>
            <input
              type="password"
              className="input-field"
              value={pwdForm.currentPassword}
              onChange={(e) => setPwdForm((p) => ({ ...p, currentPassword: e.target.value }))}
              placeholder="••••••••"
              required
            />
          </div>
          <div>
            <label className="label">New Password</label>
            <input
              type="password"
              className="input-field"
              value={pwdForm.newPassword}
              onChange={(e) => setPwdForm((p) => ({ ...p, newPassword: e.target.value }))}
              placeholder="Min. 6 characters"
              required
            />
          </div>
          <div>
            <label className="label">Confirm New Password</label>
            <input
              type="password"
              className="input-field"
              value={pwdForm.confirmPassword}
              onChange={(e) => setPwdForm((p) => ({ ...p, confirmPassword: e.target.value }))}
              placeholder="Repeat new password"
              required
            />
          </div>
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={() => setPwdModalOpen(false)}
              className="btn-secondary flex-1 justify-center"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={pwdSaving}
              className="btn-primary flex-1 justify-center"
            >
              {pwdSaving ? <Spinner size="sm" /> : null}
              {pwdSaving ? 'Updating...' : 'Update Password'}
            </button>
          </div>
        </form>
      </Modal>
    </header>
  );
};

export default TopNavbar;
