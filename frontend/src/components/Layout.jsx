import React, { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import {
  LayoutDashboard, Tv, Film, ListVideo, MapPin, Palette,
  LogOut, Settings, ChevronLeft, ChevronRight, CreditCard, Menu, X
} from 'lucide-react';

const LOGO_URL = 'https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/6992cb8c619d2da592897a92/a9063ac46_getapp2.png';

const NAV = [
  { to: '/dashboard',  label: 'Dashboard',  icon: LayoutDashboard },
  { to: '/screens',    label: 'Ecrane',      icon: Tv },
  { to: '/content',    label: 'Conținut',    icon: Film },
  { to: '/playlists',  label: 'Playlisturi', icon: ListVideo },
  { to: '/locations',  label: 'Locații',     icon: MapPin },
  { to: '/brands',     label: 'Branduri',    icon: Palette },
  { to: '/billing',    label: 'Abonament',   icon: CreditCard },
];

export default function Layout({ children }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleLogout = () => { logout(); navigate('/login'); };

  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className={`flex items-center gap-3 px-4 py-5 border-b border-white/[0.06] ${collapsed ? 'justify-center' : ''}`}>
        <a href="https://getapp.ro" target="_blank" rel="noreferrer">
          <div className="bg-white rounded-lg p-1.5 shrink-0">
            <img src={LOGO_URL} alt="GetApp" className="h-6 w-auto" />
          </div>
        </a>
        {!collapsed && (
          <div>
            <div className="text-sm font-bold text-white leading-tight">Smart Displays</div>
            <div className="text-[10px] text-white/40 uppercase tracking-wider">by GetApp</div>
          </div>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 py-4 overflow-y-auto">
        {NAV.map(({ to, label, icon: Icon }) => (
          <NavLink key={to} to={to}
            className={({ isActive }) =>
              `flex items-center gap-3 mx-2 px-3 py-2.5 rounded-xl mb-0.5 text-sm font-medium transition-all duration-200
               ${isActive
                 ? 'bg-brand-600/20 text-brand-400 border border-brand-500/20'
                 : 'text-white/50 hover:text-white hover:bg-white/[0.05]'
               }`
            }
          >
            <Icon className="w-4 h-4 shrink-0" />
            {!collapsed && label}
          </NavLink>
        ))}
      </nav>

      {/* User footer */}
      <div className="border-t border-white/[0.06] p-3">
        {!collapsed && (
          <div className="px-2 py-2 mb-2">
            <div className="text-xs text-white/70 font-medium truncate">{user?.full_name}</div>
            <div className="text-[10px] text-white/30 truncate">{user?.org_name}</div>
          </div>
        )}
        <button onClick={handleLogout}
          className="flex items-center gap-2 w-full px-3 py-2 rounded-xl text-sm text-red-400/70
                     hover:text-red-400 hover:bg-red-500/10 transition-all duration-200">
          <LogOut className="w-4 h-4 shrink-0" />
          {!collapsed && 'Deconectare'}
        </button>
      </div>
    </div>
  );

  return (
    <div className="flex h-screen bg-surface-900 overflow-hidden">
      {/* Desktop sidebar */}
      <aside className={`hidden md:flex flex-col bg-surface-800 border-r border-white/[0.06]
                         flex-shrink-0 transition-all duration-300 relative
                         ${collapsed ? 'w-16' : 'w-60'}`}>
        <SidebarContent />
        <button onClick={() => setCollapsed(c => !c)}
          className="absolute -right-3 top-16 bg-surface-700 border border-white/10
                     rounded-full p-1 text-white/40 hover:text-white transition-colors z-10">
          {collapsed ? <ChevronRight className="w-3 h-3" /> : <ChevronLeft className="w-3 h-3" />}
        </button>
      </aside>

      {/* Mobile sidebar overlay */}
      {mobileOpen && (
        <div className="fixed inset-0 z-40 md:hidden">
          <div className="absolute inset-0 bg-black/60" onClick={() => setMobileOpen(false)} />
          <aside className="absolute left-0 top-0 bottom-0 w-60 bg-surface-800 border-r border-white/[0.06] z-50">
            <SidebarContent />
          </aside>
        </div>
      )}

      {/* Main */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Mobile header */}
        <header className="md:hidden flex items-center gap-3 px-4 py-3 border-b border-white/[0.06] bg-surface-800">
          <button onClick={() => setMobileOpen(true)} className="text-white/60 hover:text-white">
            <Menu className="w-5 h-5" />
          </button>
          <span className="text-sm font-semibold text-white">Smart Displays</span>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto p-4 md:p-6 animate-fade-in">
          {children}
        </main>
      </div>
    </div>
  );
}
