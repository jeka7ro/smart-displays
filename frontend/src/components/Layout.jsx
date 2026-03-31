import React, { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import {
  LayoutDashboard, Tv, Film, ListVideo, MapPin, Palette,
  LogOut, CreditCard, Menu, X, ChevronLeft, ChevronRight
} from 'lucide-react';

const LOGO_URL = '/logo.png';

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

  // Avatar inițiale
  const initials = (user?.full_name || '?').split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();

  const SidebarContent = ({ onNav }) => (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className={`flex items-center gap-3 px-4 py-5 ${collapsed ? 'justify-center' : ''}`} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
        <a href="https://getapp.ro" target="_blank" rel="noreferrer">
          <div className="bg-white rounded-xl p-1.5 shrink-0 shadow-lg shadow-white/10">
            <img src={LOGO_URL} alt="GetApp" className="h-6 w-auto" />
          </div>
        </a>
        {!collapsed && (
          <div>
            <div className="text-sm font-bold text-white leading-tight">Smart Displays</div>
            <div className="text-[10px] font-medium uppercase tracking-widest" style={{ color: 'rgba(255,255,255,0.3)' }}>by GetApp</div>
          </div>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 py-3 overflow-y-auto px-2 space-y-0.5">
        {NAV.map(({ to, label, icon: Icon }) => (
          <NavLink key={to} to={to} onClick={onNav}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-2xl text-sm font-medium transition-all duration-150
               ${isActive
                 ? 'text-white'
                 : 'hover:text-white'
               }`
            }
            style={({ isActive }) => isActive
              ? { background: 'rgba(99,87,255,0.18)', boxShadow: '0 0 0 1px rgba(99,87,255,0.25) inset', color: 'white' }
              : { color: 'rgba(255,255,255,0.45)' }
            }
          >
            <Icon className="w-4 h-4 shrink-0" />
            {!collapsed && label}
          </NavLink>
        ))}
      </nav>

      {/* User footer */}
      <div className="p-3" style={{ borderTop: '1px solid rgba(255,255,255,0.05)' }}>
        {!collapsed && (
          <div className="flex items-center gap-3 px-2 py-2 mb-1 rounded-2xl" style={{ background: 'rgba(255,255,255,0.03)' }}>
            <div className="w-7 h-7 rounded-xl flex items-center justify-center text-[11px] font-bold text-white shrink-0"
              style={{ background: 'linear-gradient(135deg, #5b4fff, #7c3aed)' }}>
              {initials}
            </div>
            <div className="min-w-0">
              <div className="text-xs font-semibold text-white truncate">{user?.full_name}</div>
              <div className="text-[10px] truncate" style={{ color: 'rgba(255,255,255,0.3)' }}>{user?.org_name}</div>
            </div>
          </div>
        )}
        <button onClick={handleLogout}
          className="flex items-center gap-2 w-full px-3 py-2 rounded-2xl text-sm transition-all duration-150"
          style={{ color: 'rgba(239,68,68,0.6)' }}
          onMouseEnter={e => { e.currentTarget.style.background = 'rgba(239,68,68,0.08)'; e.currentTarget.style.color = '#f87171'; }}
          onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'rgba(239,68,68,0.6)'; }}>
          <LogOut className="w-4 h-4 shrink-0" />
          {!collapsed && 'Deconectare'}
        </button>
      </div>
    </div>
  );

  return (
    <div className="flex h-screen overflow-hidden" style={{ background: '#07091a' }}>

      {/* Desktop sidebar — glassmorphism */}
      <aside className={`hidden md:flex flex-col flex-shrink-0 transition-all duration-300 relative`}
        style={{
          width: collapsed ? '64px' : '232px',
          background: 'rgba(255,255,255,0.035)',
          borderRight: '1px solid rgba(255,255,255,0.06)',
          backdropFilter: 'blur(20px)',
        }}>
        <SidebarContent />
        <button onClick={() => setCollapsed(c => !c)}
          className="absolute -right-3 top-16 rounded-full p-1 transition-all duration-150 z-10"
          style={{
            background: 'rgba(15,18,35,0.95)',
            border: '1px solid rgba(255,255,255,0.08)',
            color: 'rgba(255,255,255,0.4)',
            boxShadow: '0 4px 12px rgba(0,0,0,0.3)'
          }}
          onMouseEnter={e => e.currentTarget.style.color = 'white'}
          onMouseLeave={e => e.currentTarget.style.color = 'rgba(255,255,255,0.4)'}>
          {collapsed ? <ChevronRight className="w-3 h-3" /> : <ChevronLeft className="w-3 h-3" />}
        </button>
      </aside>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div className="fixed inset-0 z-40 md:hidden">
          <div className="absolute inset-0" style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)' }}
            onClick={() => setMobileOpen(false)} />
          <aside className="absolute left-0 top-0 bottom-0 w-64 z-50 flex flex-col"
            style={{
              background: 'rgba(10,12,28,0.98)',
              borderRight: '1px solid rgba(255,255,255,0.06)',
              backdropFilter: 'blur(24px)',
            }}>
            <div className="flex justify-end p-3">
              <button onClick={() => setMobileOpen(false)} style={{ color: 'rgba(255,255,255,0.4)' }}>
                <X className="w-5 h-5" />
              </button>
            </div>
            <SidebarContent onNav={() => setMobileOpen(false)} />
          </aside>
        </div>
      )}

      {/* Main */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Mobile header */}
        <header className="md:hidden flex items-center gap-3 px-4 py-3"
          style={{ borderBottom: '1px solid rgba(255,255,255,0.05)', background: 'rgba(255,255,255,0.025)' }}>
          <button onClick={() => setMobileOpen(true)} style={{ color: 'rgba(255,255,255,0.6)' }}>
            <Menu className="w-5 h-5" />
          </button>
          <span className="text-sm font-semibold text-white">Smart Displays</span>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto p-4 md:p-7 animate-fade-in">
          {children}
        </main>
      </div>
    </div>
  );
}
