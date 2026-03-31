import React, { useState, useEffect } from 'react';
import { DashboardLayout } from '../components/DashboardLayout';
import { CreditCard, Calendar, ShieldCheck, Tv, Zap } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import api from '../utils/api';
import { toast } from 'sonner';

export const Subscription = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState({ screens: 0 });

  useEffect(() => {
    // Încărcăm nr de ecrane pentru a afișa estimativ
    api.get('/dashboard/stats').then(res => {
      setStats({ screens: res.data.screens_total || 0 });
    }).catch(() => {});
  }, []);

  const handleCheckout = async (planType) => {
    setLoading(true);
    try {
      const res = await api.post('/billing/checkout', { plan: planType });
      if (res.data && res.data.url) {
        // Redirecționează către Viva Wallet
        window.location.href = res.data.url;
      }
    } catch (error) {
      console.error('Checkout error', error);
      toast.error('Eroare la procesarea plății. Vă rugăm încercați din nou.');
    } finally {
      setLoading(false);
    }
  };

  const plans = [
    { id: 'day', name: 'Abonament 1 Zi', price: '1.21 €', desc: 'Acces complet timp de 24 ore', color: 'indigo' },
    { id: 'week', name: 'Abonament 1 Săptămână', price: '6.05 €', desc: 'Acces complet timp de 7 zile', color: 'purple' },
    { id: 'month', name: 'Abonament 1 Lună', price: '18.15 €', desc: 'Acces complet timp de 30 zile', color: 'emerald', popular: true }
  ];

  return (
    <DashboardLayout>
      <div className="animate-in" data-testid="subscription-page">
        <div className="mb-8 flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg">
            <CreditCard className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-4xl md:text-5xl font-bold text-slate-800 mb-2">
              Abonamentul Meu
            </h1>
            <p className="text-slate-500 text-lg">
              Plătește chiria și gestionează accesul la rețeaua ta de ecrane
            </p>
          </div>
        </div>

        {/* Status Card */}
        <div className="glass-card p-8 mb-8 flex flex-col md:flex-row items-center justify-between gap-6 border-l-4 border-l-emerald-500">
          <div className="flex items-start gap-4">
            <div className="p-3 bg-emerald-100 rounded-2xl">
              <ShieldCheck className="w-8 h-8 text-emerald-600" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-800">Status Cont: Activ</h2>
              <p className="text-slate-500 mt-1">
                Ecranele tale funcționează normal. Pentru a prelungi valabilitatea, alege un pachet.
              </p>
            </div>
          </div>
          <div className="text-center bg-white/60 p-4 rounded-xl shadow-sm border border-slate-200 min-w-[150px]">
            <p className="text-sm font-medium text-slate-500">Ecrane înregistrate</p>
            <p className="text-3xl font-bold text-slate-800 flex items-center justify-center gap-2 mt-1">
              <Tv className="w-6 h-6 text-indigo-500" />
              {stats.screens}
            </p>
          </div>
        </div>

        {/* Pricing Table */}
        <div className="mb-6">
          <h3 className="text-2xl font-bold text-slate-800 mb-6 flex items-center gap-2">
            <Zap className="w-6 h-6 text-amber-500" />
            Prelungește Abonamentul (Chirie)
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {plans.map(plan => (
              <div 
                key={plan.id}
                className={`glass-card p-6 relative flex flex-col ${plan.popular ? 'border-2 border-emerald-400 shadow-xl shadow-emerald-100/50 scale-105 z-10' : 'border border-slate-200'}`}
              >
                {plan.popular && (
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-gradient-to-r from-emerald-500 to-teal-500 text-white text-xs font-bold px-4 py-1 rounded-full shadow-md uppercase tracking-wider">
                    Recomandat
                  </div>
                )}
                
                <h4 className="text-xl font-bold text-slate-800 mb-2">{plan.name}</h4>
                <p className="text-slate-500 text-sm mb-6">{plan.desc}</p>
                
                <div className="mt-auto mb-8">
                  <span className="text-4xl font-extrabold text-slate-800">{plan.price}</span>
                  <span className="text-slate-500 text-sm ml-1">/ ecran</span>
                </div>
                
                <button
                  onClick={() => handleCheckout(plan.id)}
                  disabled={loading}
                  className={`w-full py-3 rounded-xl font-bold text-white transition-all shadow-md hover:shadow-lg focus:ring-4 ${
                    plan.popular 
                      ? 'bg-gradient-to-r from-emerald-500 to-teal-500 hover:opacity-90 focus:ring-emerald-200' 
                      : `bg-${plan.color}-600 hover:bg-${plan.color}-700 focus:ring-${plan.color}-200`
                  }`}
                >
                  {loading ? 'Se procesează...' : 'Plătește Acum'}
                </button>
              </div>
            ))}
          </div>
        </div>
        
        <div className="text-center mt-8">
          <p className="text-sm text-slate-500 flex items-center justify-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-500" />
            Plăți securizate prin Viva Wallet. Activarea se face automat după confirmarea plății.
          </p>
        </div>

      </div>
    </DashboardLayout>
  );
};
