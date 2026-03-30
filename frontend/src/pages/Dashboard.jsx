import React, { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { screens as screensApi, content as contentApi, playlists as playlistsApi } from '../lib/api';
import { Tv, Film, ListVideo, Activity, Wifi, WifiOff, AlertTriangle, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';

function StatCard({ icon: Icon, label, value, color = 'brand', to }) {
  const colors = {
    brand: 'bg-brand-600/15 text-brand-400 border-brand-500/20',
    green: 'bg-green-500/15 text-green-400 border-green-500/20',
    amber: 'bg-amber-500/15 text-amber-400 border-amber-500/20',
    purple: 'bg-purple-500/15 text-purple-400 border-purple-500/20',
  };
  const content = (
    <div className="sd-card flex items-center gap-4 hover:border-white/10 transition-colors">
      <div className={`w-12 h-12 rounded-xl border flex items-center justify-center shrink-0 ${colors[color]}`}>
        <Icon className="w-5 h-5" />
      </div>
      <div>
        <div className="text-2xl font-bold text-white">{value ?? '—'}</div>
        <div className="text-xs text-white/40 font-medium mt-0.5">{label}</div>
      </div>
      {to && <ArrowRight className="w-4 h-4 text-white/20 ml-auto" />}
    </div>
  );
  return to ? <Link to={to}>{content}</Link> : content;
}

export default function Dashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState({ screens: 0, online: 0, content: 0, playlists: 0 });
  const [recentScreens, setRecentScreens] = useState([]);
  const [loading, setLoading] = useState(true);
  const [plan, setPlan] = useState('trial');
  const [planExpires, setPlanExpires] = useState(null);

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

    // Plan info (from user context updated by AuthProvider)
    if (user?.org_plan) {
      setPlan(user.org_plan);
      setPlanExpires(user.org_plan_expires_at);
    }
  }, [user]);

  const planBadge = {
    trial:    { label: 'Trial', cls: 'sd-badge-yellow' },
    day:      { label: '1 Zi', cls: 'sd-badge-blue' },
    week:     { label: '1 Săptămână', cls: 'sd-badge-blue' },
    month:    { label: '1 Lună', cls: 'sd-badge-green' },
    enterprise: { label: 'Enterprise', cls: 'sd-badge-green' },
  }[plan] || { label: plan, cls: 'sd-badge-blue' };

  return (
    <div className="space-y-6 animate-slide-up">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">
            Bună, {user?.full_name?.split(' ')[0]} 👋
          </h1>
          <p className="text-white/40 text-sm mt-1">{user?.org_name}</p>
        </div>
        <span className={planBadge.cls}>{planBadge.label}</span>
      </div>

      {/* Trial warning */}
      {plan === 'trial' && (
        <div className="flex items-center gap-3 p-4 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-300 text-sm">
          <AlertTriangle className="w-4 h-4 shrink-0" />
          <span>Ești în perioada de trial. <Link to="/billing" className="underline font-medium">Activează un abonament</Link> pentru a-ți pune ecranele live.</span>
        </div>
      )}

      {/* Stats grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={Tv}       label="Total ecrane"    value={stats.screens}   color="brand"  to="/screens" />
        <StatCard icon={Activity} label="Online acum"     value={stats.online}    color="green"  to="/screens" />
        <StatCard icon={Film}     label="Fișiere conținut" value={stats.content}  color="purple" to="/content" />
        <StatCard icon={ListVideo} label="Playlisturi"    value={stats.playlists} color="amber"  to="/playlists" />
      </div>

      {/* Recent screens */}
      <div className="sd-card">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold text-white">Ecrane recente</h2>
          <Link to="/screens" className="text-xs text-brand-400 hover:text-brand-300 flex items-center gap-1">
            Vezi toate <ArrowRight className="w-3 h-3" />
          </Link>
        </div>
        {loading ? (
          <div className="text-center py-8 text-white/30 text-sm">Se încarcă...</div>
        ) : recentScreens.length === 0 ? (
          <div className="text-center py-10">
            <Tv className="w-8 h-8 text-white/20 mx-auto mb-3" />
            <p className="text-white/40 text-sm mb-3">Nu ai niciun ecran configurat</p>
            <Link to="/screens" className="sd-btn-primary text-xs px-3 py-1.5">Adaugă primul ecran</Link>
          </div>
        ) : (
          <table className="sd-table">
            <thead>
              <tr>
                <th>Ecran</th>
                <th>Locație</th>
                <th>Status</th>
                <th>Slug (URL)</th>
              </tr>
            </thead>
            <tbody>
              {recentScreens.map(s => (
                <tr key={s.id}>
                  <td className="font-medium text-white">{s.name}</td>
                  <td className="text-white/50">{s.location_name || '—'}</td>
                  <td>
                    {s.status === 'online'
                      ? <span className="sd-badge-green"><Wifi className="w-3 h-3" /> Online</span>
                      : <span className="sd-badge-red"><WifiOff className="w-3 h-3" /> Offline</span>
                    }
                  </td>
                  <td>
                    <code className="text-xs bg-surface-700 px-2 py-0.5 rounded text-white/50">/tv/{s.slug}</code>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Quick help */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[
          { icon: '📺', title: 'Configurează un ecran', desc: 'Adaugă slug-ul și conectează-l la conținut', to: '/screens' },
          { icon: '🎬', title: 'Încarcă conținut', desc: 'Video MP4, imagini JPG/PNG până la 500MB', to: '/content' },
          { icon: '📋', title: 'Creează un playlist', desc: 'Combină mai multe fișiere într-o secvență', to: '/playlists' },
        ].map(item => (
          <Link key={item.to} to={item.to}
            className="sd-card hover:border-white/10 transition-all cursor-pointer group">
            <div className="text-2xl mb-2">{item.icon}</div>
            <div className="font-medium text-white text-sm group-hover:text-brand-400 transition-colors">{item.title}</div>
            <div className="text-xs text-white/40 mt-1">{item.desc}</div>
          </Link>
        ))}
      </div>
    </div>
  );
}
