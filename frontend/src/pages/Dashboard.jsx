import React, { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { screens as screensApi, content as contentApi, playlists as playlistsApi } from '../lib/api';
import { Tv, Film, ListVideo, Activity, Wifi, WifiOff, AlertTriangle, ArrowRight, Plus, Sparkles } from 'lucide-react';
import { Link } from 'react-router-dom';

function StatCard({ icon: Icon, label, value, gradient, to }) {
  const card = (
    <div className="sd-card group hover:scale-[1.01] transition-all duration-200 cursor-default" style={{ position: 'relative', overflow: 'hidden' }}>
      {/* Glow accent */}
      <div style={{
        position: 'absolute', top: -24, right: -24,
        width: 80, height: 80,
        background: gradient,
        borderRadius: '50%',
        filter: 'blur(28px)',
        opacity: 0.25,
        pointerEvents: 'none',
      }} />
      <div className="flex items-start justify-between relative">
        <div>
          <div className="text-3xl font-black text-white tracking-tight">{value ?? '—'}</div>
          <div className="text-xs font-medium mt-1" style={{ color: 'rgba(255,255,255,0.4)' }}>{label}</div>
        </div>
        <div className="w-10 h-10 rounded-2xl flex items-center justify-center shrink-0"
          style={{ background: gradient, opacity: 0.85 }}>
          <Icon className="w-4 h-4 text-white" />
        </div>
      </div>
      {to && (
        <div className="flex items-center gap-1 mt-3 text-[11px] font-medium" style={{ color: 'rgba(255,255,255,0.25)' }}>
          <span>Vezi detalii</span>
          <ArrowRight className="w-3 h-3" />
        </div>
      )}
    </div>
  );
  return to ? <Link to={to} className="block">{card}</Link> : card;
}

const QUICK_ACTIONS = [
  { icon: Tv, title: 'Configurează un ecran', desc: 'Adaugă un nou ecran TV sau display', to: '/screens', gradient: 'linear-gradient(135deg,#5b4fff,#7c3aed)' },
  { icon: Film, title: 'Încarcă conținut', desc: 'Video MP4, imagini JPG/PNG, max 500MB', to: '/content', gradient: 'linear-gradient(135deg,#0ea5e9,#6366f1)' },
  { icon: ListVideo, title: 'Creează un playlist', desc: 'Secvențe automate și programate', to: '/playlists', gradient: 'linear-gradient(135deg,#f59e0b,#ef4444)' },
];

export default function Dashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState({ screens: 0, online: 0, content: 0, playlists: 0 });
  const [recentScreens, setRecentScreens] = useState([]);
  const [loading, setLoading] = useState(true);
  const [plan, setPlan] = useState('trial');

  useEffect(() => {
    Promise.all([
      screensApi.list(),
      contentApi.list(),
      playlistsApi.list(),
    ]).then(([sRes, cRes, pRes]) => {
      const scr = sRes.data;
      setStats({
        screens:   scr.length,
        online:    scr.filter(s => s.status === 'online').length,
        content:   cRes.data.length,
        playlists: pRes.data.length,
      });
      setRecentScreens(scr.slice(0, 5));
    }).catch(console.error)
      .finally(() => setLoading(false));

    if (user?.org_plan) setPlan(user.org_plan);
  }, [user]);

  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Bună dimineața' : hour < 18 ? 'Bună ziua' : 'Bună seara';

  return (
    <div className="space-y-6 max-w-5xl">

      {/* Header */}
      <div className="flex items-start justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-black text-white">
            {greeting}, {user?.full_name?.split(' ')[0]} 👋
          </h1>
          <p className="text-sm mt-1" style={{ color: 'rgba(255,255,255,0.35)' }}>
            {user?.org_name} · {new Date().toLocaleDateString('ro-RO', { weekday: 'long', day: 'numeric', month: 'long' })}
          </p>
        </div>
        {plan === 'trial' && (
          <Link to="/billing" className="sd-btn text-sm font-semibold"
            style={{ background: 'rgba(245,158,11,0.12)', border: '1px solid rgba(245,158,11,0.2)', color: '#fbbf24', borderRadius: 14 }}>
            <Sparkles className="w-4 h-4" />
            Activează plan
          </Link>
        )}
      </div>

      {/* Trial banner */}
      {plan === 'trial' && (
        <div className="sd-card flex items-center gap-3"
          style={{ background: 'rgba(245,158,11,0.06)', borderColor: 'rgba(245,158,11,0.15)' }}>
          <AlertTriangle className="w-4 h-4 shrink-0" style={{ color: '#fbbf24' }} />
          <span className="text-sm" style={{ color: 'rgba(245,158,11,0.85)' }}>
            Ești în perioada de trial. &nbsp;
            <Link to="/billing" className="font-semibold underline" style={{ color: '#fbbf24' }}>
              Activează un abonament
            </Link>
            &nbsp;pentru a pune ecranele live.
          </span>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard icon={Tv}       label="Total ecrane"     value={stats.screens}   gradient="linear-gradient(135deg,#5b4fff,#7c3aed)" to="/screens" />
        <StatCard icon={Activity} label="Online acum"      value={stats.online}    gradient="linear-gradient(135deg,#10b981,#059669)" to="/screens" />
        <StatCard icon={Film}     label="Fișiere conținut" value={stats.content}   gradient="linear-gradient(135deg,#6366f1,#0ea5e9)" to="/content" />
        <StatCard icon={ListVideo} label="Playlisturi"     value={stats.playlists} gradient="linear-gradient(135deg,#f59e0b,#ef4444)" to="/playlists" />
      </div>

      {/* Ecrane recente */}
      <div className="sd-card">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-bold text-white">Ecrane recente</h2>
          <Link to="/screens" className="text-xs flex items-center gap-1 font-medium transition-colors"
            style={{ color: 'rgba(99,87,255,0.8)' }}>
            Vezi toate <ArrowRight className="w-3 h-3" />
          </Link>
        </div>
        {loading ? (
          <div className="text-center py-8 text-sm" style={{ color: 'rgba(255,255,255,0.2)' }}>Se încarcă...</div>
        ) : recentScreens.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-14 h-14 rounded-3xl flex items-center justify-center mx-auto mb-4"
              style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)' }}>
              <Tv className="w-6 h-6" style={{ color: 'rgba(255,255,255,0.2)' }} />
            </div>
            <p className="text-sm mb-4" style={{ color: 'rgba(255,255,255,0.35)' }}>Niciun ecran configurat încă</p>
            <Link to="/screens" className="sd-btn-primary text-xs px-4 py-2 inline-flex items-center gap-2">
              <Plus className="w-3.5 h-3.5" /> Adaugă primul ecran
            </Link>
          </div>
        ) : (
          <table className="sd-table">
            <thead>
              <tr>
                <th>Ecran</th>
                <th>Locație</th>
                <th>Status</th>
                <th>URL TV</th>
              </tr>
            </thead>
            <tbody>
              {recentScreens.map(s => (
                <tr key={s.id}>
                  <td className="font-semibold text-white">{s.name}</td>
                  <td style={{ color: 'rgba(255,255,255,0.45)' }}>{s.location_name || '—'}</td>
                  <td>
                    {s.status === 'online'
                      ? <span className="sd-badge-green"><Wifi className="w-3 h-3" /> Online</span>
                      : <span className="sd-badge-red"><WifiOff className="w-3 h-3" /> Offline</span>
                    }
                  </td>
                  <td>
                    <code className="text-xs px-2 py-0.5 rounded-lg" style={{ background: 'rgba(255,255,255,0.05)', color: 'rgba(255,255,255,0.4)' }}>
                      /tv/{s.slug}
                    </code>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Quick Actions */}
      <div>
        <h2 className="font-bold text-white mb-3 text-sm uppercase tracking-wider" style={{ color: 'rgba(255,255,255,0.3)' }}>
          Acțiuni rapide
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {QUICK_ACTIONS.map(item => (
            <Link key={item.to} to={item.to}
              className="sd-card group hover:scale-[1.01] transition-all duration-200"
              style={{ position: 'relative', overflow: 'hidden' }}>
              <div style={{
                position: 'absolute', top: -20, right: -20,
                width: 60, height: 60,
                background: item.gradient,
                borderRadius: '50%',
                filter: 'blur(24px)',
                opacity: 0.2,
                pointerEvents: 'none',
              }} />
              <div className="w-9 h-9 rounded-2xl flex items-center justify-center mb-3 shrink-0"
                style={{ background: item.gradient }}>
                <item.icon className="w-4 h-4 text-white" />
              </div>
              <div className="font-semibold text-white text-sm group-hover:text-violet-300 transition-colors">
                {item.title}
              </div>
              <div className="text-xs mt-1" style={{ color: 'rgba(255,255,255,0.35)' }}>{item.desc}</div>
            </Link>
          ))}
        </div>
      </div>

    </div>
  );
}
