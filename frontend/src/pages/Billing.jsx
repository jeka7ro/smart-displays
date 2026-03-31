import React, { useEffect, useState } from 'react';
import { billing as billingApi } from '../lib/api';
import { useAuth } from '../contexts/AuthContext';
import { CreditCard, CheckCircle, Zap, Tv, Crown, Calendar, ExternalLink, AlertTriangle, Loader } from 'lucide-react';
import { toast } from 'sonner';

const PLANS = [
  {
    key: 'day',
    name: '1 Zi',
    price: 1.00,
    vatPrice: 1.21,
    icon: Zap,
    gradient: 'linear-gradient(135deg, #475569, #334155)',
    glow: 'rgba(71,85,105,0.4)',
    features: ['1 display activ', 'Imagini & Video', 'Efecte vizuale', 'Suport email'],
  },
  {
    key: 'week',
    name: '1 Săptămână',
    price: 5.00,
    vatPrice: 6.05,
    icon: Tv,
    badge: '⭐ POPULAR',
    gradient: 'linear-gradient(135deg, #4f46e5, #7c3aed)',
    glow: 'rgba(99,87,255,0.4)',
    features: ['1 display activ', 'Video & Playlist', 'Efecte premium', 'Suport prioritar'],
  },
  {
    key: 'month',
    name: '1 Lună',
    price: 15.00,
    vatPrice: 18.15,
    icon: Crown,
    badge: '🏆 BEST VALUE',
    gradient: 'linear-gradient(135deg, #f59e0b, #ef4444)',
    glow: 'rgba(245,158,11,0.4)',
    features: ['1 display activ', 'Playlist configurabil', 'Toate efectele', 'Suport 24/7'],
  },
];

export default function Billing() {
  const { user } = useAuth();
  const [billingData, setBillingData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [paying, setPaying] = useState(null);

  const handleCheckout = async (planKey) => {
    setPaying(planKey);
    try {
      const res = await billingApi.checkout({ plan: planKey });
      if (res.data?.url) window.open(res.data.url, '_blank');
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Eroare la inițierea plății');
    } finally {
      setPaying(null);
    }
  };

  useEffect(() => {
    billingApi.get()
      .then(r => setBillingData(r.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const org      = billingData?.org;
  const history  = billingData?.history || [];
  const plan     = org?.plan || 'trial';
  const expires  = org?.plan_expires_at;
  const isExpired = expires && new Date(expires) < new Date();
  const daysLeft  = expires
    ? Math.max(0, Math.ceil((new Date(expires) - new Date()) / 86400000))
    : null;

  const planLabel = { trial: 'Trial', day: '1 Zi', week: '1 Săptămână', month: '1 Lună', enterprise: 'Enterprise' }[plan] || plan;

  return (
    <div className="space-y-7 animate-slide-up max-w-4xl">

      {/* Header */}
      <div>
        <h1 className="text-2xl font-black text-white flex items-center gap-2">
          <CreditCard className="w-6 h-6" style={{ color: '#818cf8' }} /> Abonament
        </h1>
        <p className="text-sm mt-1" style={{ color: 'rgba(255,255,255,0.35)' }}>Gestionează planul tău de acces</p>
      </div>

      {/* Plan curent */}
      <div className="sd-card" style={{
        background: 'rgba(99,87,255,0.06)',
        borderColor: 'rgba(99,87,255,0.2)',
      }}>
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl flex items-center justify-center"
            style={{ background: 'linear-gradient(135deg,#4f46e5,#7c3aed)' }}>
            <CreditCard className="w-5 h-5 text-white" />
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-3 flex-wrap">
              <span className="font-bold text-white">Plan curent:</span>
              <span className="px-3 py-1 rounded-full text-xs font-bold"
                style={{ background: 'rgba(99,87,255,0.2)', color: '#a5b4fc', border: '1px solid rgba(99,87,255,0.3)' }}>
                {planLabel}
              </span>
            </div>
            {plan === 'trial' && (
              <p className="text-sm mt-1" style={{ color: 'rgba(255,255,255,0.45)' }}>
                Trial activ. Activează un plan pentru a pune ecranele live.
              </p>
            )}
            {expires && !isExpired && (
              <p className="text-sm mt-1 flex items-center gap-1.5" style={{ color: 'rgba(255,255,255,0.45)' }}>
                <Calendar className="w-3.5 h-3.5" />
                Expiră în <strong className="text-white">{daysLeft} {daysLeft === 1 ? 'zi' : 'zile'}</strong>
                ({new Date(expires).toLocaleDateString('ro-RO')})
              </p>
            )}
            {isExpired && (
              <div className="flex items-center gap-2 text-sm mt-1" style={{ color: '#fbbf24' }}>
                <AlertTriangle className="w-3.5 h-3.5" /> Planul a expirat. Reînnoiește mai jos.
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Plans grid */}
      <div>
        <h2 className="font-bold text-white mb-1">Alege un plan</h2>
        <p className="text-xs mb-5" style={{ color: 'rgba(255,255,255,0.35)' }}>
          Prețurile includ TVA 21%. Activare în max 30 minute după confirmare.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {PLANS.map(p => {
            const Icon = p.icon;
            return (
              <div key={p.key} className="sd-card flex flex-col gap-5 relative hover:scale-[1.02] transition-all duration-200"
                style={{ overflow: 'hidden' }}>
                {/* Badge */}
                {p.badge && (
                  <div className="absolute -top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 px-3 py-1 rounded-full text-[10px] font-bold tracking-widest text-white shadow-lg"
                    style={{ background: p.gradient, whiteSpace: 'nowrap' }}>
                    {p.badge}
                  </div>
                )}

                {/* Background glow */}
                <div style={{
                  position: 'absolute', top: -30, right: -30, width: 100, height: 100,
                  borderRadius: '50%', filter: 'blur(32px)', opacity: 0.2,
                  background: p.glow, pointerEvents: 'none',
                }} />

                <div className="relative">
                  <div className="w-12 h-12 rounded-2xl flex items-center justify-center mb-4 shadow-lg"
                    style={{ background: p.gradient }}>
                    <Icon className="w-5 h-5 text-white" />
                  </div>
                  <div className="font-bold text-white text-lg">{p.name}</div>
                  <div className="flex items-baseline gap-1 mt-1">
                    <span className="text-4xl font-black text-white">{p.vatPrice.toFixed(2)}</span>
                    <span className="text-base" style={{ color: 'rgba(255,255,255,0.4)' }}>EUR</span>
                  </div>
                  <div className="text-xs mt-1" style={{ color: 'rgba(255,255,255,0.25)' }}>
                    {p.price.toFixed(2)} EUR + 21% TVA
                  </div>
                </div>

                <ul className="space-y-2 flex-1">
                  {p.features.map(f => (
                    <li key={f} className="flex items-center gap-2 text-sm" style={{ color: 'rgba(255,255,255,0.7)' }}>
                      <CheckCircle className="w-3.5 h-3.5 shrink-0" style={{ color: '#34d399' }} />
                      {f}
                    </li>
                  ))}
                </ul>

                <button
                  onClick={() => handleCheckout(p.key)}
                  disabled={paying === p.key}
                  className="sd-btn justify-center w-full font-bold text-white shadow-lg transition-all"
                  style={{
                    background: p.gradient,
                    borderRadius: 16,
                    opacity: paying === p.key ? 0.6 : 1,
                  }}>
                  {paying === p.key
                    ? <Loader className="w-4 h-4 animate-spin" />
                    : <><ExternalLink className="w-4 h-4" /> Plătește acum</>}
                </button>
              </div>
            );
          })}
        </div>
      </div>

      {/* After payment */}
      <div className="sd-card" style={{ borderStyle: 'dashed' }}>
        <h3 className="font-bold text-white mb-2 text-sm">📲 După plată</h3>
        <p className="text-xs leading-relaxed" style={{ color: 'rgba(255,255,255,0.45)' }}>
          Trimite-ne confirmarea plății pe{' '}
          <a href="https://wa.me/40757777712" target="_blank" rel="noreferrer"
            className="underline font-semibold" style={{ color: '#34d399' }}>WhatsApp</a>
          {' '}sau la{' '}
          <a href="mailto:contact@getapp.ro"
            className="underline font-semibold" style={{ color: '#818cf8' }}>contact@getapp.ro</a>
          {' '}și activăm planul tău în maximum <strong className="text-white">30 de minute</strong>.
        </p>
      </div>

      {/* Billing history */}
      {history.length > 0 && (
        <div className="sd-card">
          <h2 className="font-bold text-white mb-4 text-sm">Istoric plăți</h2>
          <table className="sd-table">
            <thead><tr><th>Plan</th><th>Sumă</th><th>Plătit la</th><th>Expiră la</th></tr></thead>
            <tbody>
              {history.map(h => (
                <tr key={h.id}>
                  <td className="font-semibold text-white capitalize">{h.plan}</td>
                  <td style={{ color: 'rgba(255,255,255,0.7)' }}>{h.amount_eur} EUR</td>
                  <td style={{ color: 'rgba(255,255,255,0.5)' }}>{h.paid_at ? new Date(h.paid_at).toLocaleDateString('ro-RO') : '—'}</td>
                  <td style={{ color: 'rgba(255,255,255,0.5)' }}>{h.expires_at ? new Date(h.expires_at).toLocaleDateString('ro-RO') : '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
