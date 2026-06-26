import { useState } from 'react';
import { useAuth } from '../../context/AuthContext';

const TopNavbar = ({ breadcrumbs = [] }) => {
  const { user } = useAuth();
  const [searchValue, setSearchValue] = useState('');

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

      {/* Right: search + icons */}
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

        {/* Bell */}
        <button className="relative p-2 rounded-lg hover:bg-gray-100 text-[#64748B] hover:text-[#1E293B] transition-colors">
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
          </svg>
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full" />
        </button>

        {/* Grid */}
        <button className="p-2 rounded-lg hover:bg-gray-100 text-[#64748B] hover:text-[#1E293B] transition-colors">
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
          </svg>
        </button>

        {/* Avatar */}
        <div className="flex items-center gap-2 pl-3 border-l border-[#E2E8F0]">
          <div className="w-8 h-8 rounded-full bg-[#1B2A4A] flex items-center justify-center">
            <span className="text-white text-sm font-semibold">{user?.name?.charAt(0)?.toUpperCase() || 'U'}</span>
          </div>
          <div className="hidden sm:block">
            <p className="text-sm font-medium text-[#1E293B] leading-tight">{user?.name}</p>
            <p className="text-xs text-[#94A3B8]">{user?.rank || user?.role}</p>
          </div>
        </div>
      </div>
    </header>
  );
};

export default TopNavbar;
