import React, { useEffect, useState } from 'react';
import { billing, billing as billingApi } from '../lib/api';
import { useAuth } from '../contexts/AuthContext';
import { CreditCard, CheckCircle, Zap, Tv, Crown, Calendar, ExternalLink, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';

const PLANS = [
  {
    key: 'day', name: '1 Zi', price: 1.00, vatPrice: 1.21, icon: Zap,
    color: 'from-slate-600 to-slate-700', borderColor: 'border-slate-600/30',
    features: ['1 display activ', 'Imagini & Video', 'Efecte vizuale', 'Suport email'],
  },
  {
    key: 'week', name: '1 Săptămână', price: 5.00, vatPrice: 6.05, icon: Tv, badge: 'POPULAR',
    color: 'from-indigo-600 to-violet-700', borderColor: 'border-indigo-500/30',
    features: ['1 display activ', 'Video & Playlist', 'Efecte premium', 'Suport prioritar'],
  },
  {
    key: 'month', name: '1 Lună', price: 15.00, vatPrice: 18.15, icon: Crown, badge: 'BEST VALUE',
    color: 'from-amber-500 to-orange-600', borderColor: 'border-amber-500/30',
    features: ['1 display activ', 'Playlist configurabil', 'Toate efectele', 'Suport 24/7'],
  },
];

// Payment links — replace with real Viva Wallet links
const VIVA_LINKS = {
  day:   'https://www.vivapayments.com/web/checkout?ref=PLACEHOLDER_1ZI',
  week:  'https://www.vivapayments.com/web/checkout?ref=PLACEHOLDER_1SAP',
  month: 'https://www.vivapayments.com/web/checkout?ref=PLACEHOLDER_1LUNA',
};

export default function Billing() {
  const { user, refreshUser } = useAuth();
  const [billingData, setBillingData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    billingApi.get()
      .then(r => setBillingData(r.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const org = billingData?.org;
  const history = billingData?.history || [];
  const plan = org?.plan || 'trial';
  const expires = org?.plan_expires_at;

  const isExpired = expires && new Date(expires) < new Date();
  const daysLeft = expires
    ? Math.max(0, Math.ceil((new Date(expires) - new Date()) / 86400000))
    : null;

  const planBadge = {
    trial:    { label: 'Trial', cls: 'sd-badge-yellow' },
    day:      { label: '1 Zi', cls: 'sd-badge-blue' },
    week:     { label: '1 Săptămână', cls: 'sd-badge-blue' },
    month:    { label: '1 Lună', cls: 'sd-badge-green' },
    enterprise: { label: 'Enterprise', cls: 'sd-badge-green' },
  }[plan] || { label: plan, cls: 'sd-badge-blue' };

  return (
    <div className="space-y-6 animate-slide-up">
      <div>
        <h1 className="text-xl font-bold text-white flex items-center gap-2"><CreditCard className="w-5 h-5 text-brand-400" />Abonament</h1>
        <p className="text-white/40 text-sm mt-0.5">Gestionează planul tău de acces</p>
      </div>

      {/* Current plan status */}
      <div className="sd-card border border-brand-500/20 bg-brand-600/5">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-brand-600/20 border border-brand-500/30 flex items-center justify-center">
            <CreditCard className="w-5 h-5 text-brand-400" />
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-white">Plan curent:</span>
              <span className={planBadge.cls}>{planBadge.label}</span>
            </div>
            {plan === 'trial' && (
              <p className="text-sm text-white/50 mt-1">Trial activ. Activează un plan pentru a pune ecranele live.</p>
            )}
            {expires && !isExpired && (
              <p className="text-sm text-white/50 mt-1 flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5" />
                Expiră în <strong className="text-white">{daysLeft} {daysLeft === 1 ? 'zi' : 'zile'}</strong>
                ({new Date(expires).toLocaleDateString('ro-RO')})
              </p>
            )}
            {isExpired && (
              <div className="flex items-center gap-2 text-amber-400 text-sm mt-1">
                <AlertTriangle className="w-3.5 h-3.5" /> Planul a expirat. Reînnoiește mai jos.
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Plans */}
      <div>
        <h2 className="font-semibold text-white mb-3">Activează un plan</h2>
        <p className="text-xs text-white/40 mb-4">
          Prețurile afișate includ TVA 21%. După plată, contactează-ne pe WhatsApp sau email pentru activare în max 30 minute.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {PLANS.map(p => {
            const Icon = p.icon;
            return (
              <div key={p.key} className={`sd-card border ${p.borderColor} flex flex-col gap-4 relative`}>
                {p.badge && (
                  <div className={`absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full text-[10px] font-bold tracking-widest bg-gradient-to-r ${p.color} text-white shadow`}>
                    {p.badge}
                  </div>
                )}
                <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${p.color} flex items-center justify-center shadow-lg`}>
                  <Icon className="w-5 h-5 text-white" />
                </div>
                <div>
                  <div className="font-bold text-white text-lg">{p.name}</div>
                  <div className="text-3xl font-black text-white mt-1">{p.vatPrice.toFixed(2)} <span className="text-base text-white/50">EUR</span></div>
                  <div className="text-xs text-white/30 mt-0.5">{p.price.toFixed(2)} EUR + 21% TVA</div>
                </div>
                <ul className="space-y-1.5 flex-1">
                  {p.features.map(f => (
                    <li key={f} className="flex items-center gap-2 text-sm text-white/70">
                      <CheckCircle className="w-3.5 h-3.5 text-green-400 shrink-0" />{f}
                    </li>
                  ))}
                </ul>
                <a href={VIVA_LINKS[p.key]} target="_blank" rel="noopener noreferrer"
                  className={`sd-btn bg-gradient-to-r ${p.color} text-white justify-center shadow-lg hover:opacity-90 w-full`}>
                  <ExternalLink className="w-4 h-4" /> Plătește acum
                </a>
              </div>
            );
          })}
        </div>
      </div>

      {/* After payment */}
      <div className="sd-card border-dashed border-white/10">
        <h3 className="font-medium text-white mb-2 text-sm">📲 După plată</h3>
        <p className="text-xs text-white/50 leading-relaxed">
          Trimite-ne confirmarea plății pe{' '}
          <a href="https://wa.me/40757777712" target="_blank" rel="noreferrer" className="text-green-400 underline">WhatsApp</a>{' '}
          sau la{' '}
          <a href="mailto:contact@getapp.ro" className="text-brand-400 underline">contact@getapp.ro</a>{' '}
          și activăm planul tău în maximum 30 de minute.
        </p>
      </div>

      {/* Billing history */}
      {history.length > 0 && (
        <div className="sd-card">
          <h2 className="font-semibold text-white mb-4 text-sm">Istoric plăți</h2>
          <table className="sd-table">
            <thead><tr><th>Plan</th><th>Sumă</th><th>Plătit la</th><th>Expiră la</th></tr></thead>
            <tbody>
              {history.map(h => (
                <tr key={h.id}>
                  <td className="font-medium text-white capitalize">{h.plan}</td>
                  <td className="text-white/70">{h.amount_eur} EUR</td>
                  <td className="text-white/50">{h.paid_at ? new Date(h.paid_at).toLocaleDateString('ro-RO') : '—'}</td>
                  <td className="text-white/50">{h.expires_at ? new Date(h.expires_at).toLocaleDateString('ro-RO') : '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
