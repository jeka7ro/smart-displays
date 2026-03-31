import React, { useState, useEffect } from 'react';
import { DashboardLayout } from '../components/DashboardLayout';
import { CreditCard, ShieldCheck, Tv, Plus, Minus, Mail, Phone } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import api from '../utils/api';
import { toast } from 'sonner';

export const Subscription = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [screenCount, setScreenCount] = useState(1);
  const [stats, setStats] = useState({ screens: 0 });

  useEffect(() => {
    // Încărcăm nr de ecrane și planul
    api.get('/dashboard/stats').then(res => {
      setStats({ 
        screens: res.data.screens_total || 0,
        plan: res.data.plan || 'trial'
      });
    }).catch(() => {});
  }, []);

  const handleCheckout = async (planType) => {
    setLoading(true);
    try {
      const res = await api.post('/billing/checkout', { plan: planType, quantity: screenCount });
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
        <div className={`glass-card p-8 mb-8 flex flex-col md:flex-row items-center justify-between gap-6 border-l-4 ${stats.plan === 'trial' || stats.plan === 'none' || stats.plan === 'free' ? 'border-l-amber-500' : 'border-l-emerald-500'}`}>
          <div className="flex items-start gap-4">
            <div className={`p-3 rounded-2xl ${stats.plan === 'trial' || stats.plan === 'none' || stats.plan === 'free' ? 'bg-amber-100' : 'bg-emerald-100'}`}>
              <ShieldCheck className={`w-8 h-8 ${stats.plan === 'trial' || stats.plan === 'none' || stats.plan === 'free' ? 'text-amber-600' : 'text-emerald-600'}`} />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-800">
                Status Cont: {stats.plan === 'trial' || stats.plan === 'none' || stats.plan === 'free' ? 'Versiune gratuită (Trial)' : 'Activ Premium'}
              </h2>
              <p className="text-slate-500 mt-1">
                {stats.plan === 'trial' || stats.plan === 'none' || stats.plan === 'free' 
                  ? 'Limita este 1 singur ecran (max 5 minute pe TV). Alegeți un plan de mai jos pentru a activa ecrane nelimitate.'
                  : 'Ecranele tale funcționează normal la pachet complet. Pentru a prelungi valabilitatea, alegeți un pachet nou.'}
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
          <h3 className="text-2xl font-bold text-slate-800 mb-6">
            Prelungește Abonamentul (Chirie)
          </h3>
          
          <div className="mb-8 flex flex-col md:flex-row items-center gap-4 bg-white/60 p-6 rounded-2xl border border-slate-200 shadow-sm max-w-2xl mx-auto md:mx-0">
            <div>
              <span className="font-bold text-slate-800 text-lg block">Selectează numărul de ecrane</span>
              <span className="text-slate-500 text-sm">Alege pentru câte ecrane dorești să achiți abonamentul</span>
            </div>
            <div className="md:ml-auto flex items-center gap-3 bg-white border border-slate-200 rounded-xl p-1 shadow-sm">
              <button 
                onClick={() => setScreenCount(Math.max(1, screenCount - 1))}
                className="p-3 hover:bg-slate-100 rounded-lg text-slate-600 transition-colors"
                title="Scade numar ecrane"
              >
                <Minus className="w-5 h-5"/>
              </button>
              <span className="w-16 text-center font-black text-2xl text-indigo-600">{screenCount}</span>
              <button 
                onClick={() => setScreenCount(screenCount + 1)}
                className="p-3 hover:bg-slate-100 rounded-lg text-slate-600 transition-colors"
                title="Adauga numar ecrane"
              >
                <Plus className="w-5 h-5"/>
              </button>
            </div>
          </div>
          
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
                
                <div className="mt-auto mb-8 flex flex-col items-start gap-1">
                  <span className="text-4xl font-extrabold text-slate-800">{(parseFloat(plan.price) * screenCount).toFixed(2)} €</span>
                  <span className="text-slate-400 text-sm font-medium">total pentru {screenCount} ecran{screenCount > 1 ? 'e' : ''} (TVA inclus)</span>
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
        
        <div className="mt-12 glass-card p-8 border flex flex-col items-center justify-center text-center">
          <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center mb-4">
            <Mail className="w-6 h-6 text-slate-600" />
          </div>
          <h4 className="text-xl font-bold text-slate-800 mb-2">Ai nevoie de un abonament personalizat?</h4>
          <p className="text-slate-500 mb-6 max-w-xl text-lg">
            Abonații corporate pot beneficia de facturare personalizată și contract B2B. Te rugăm să ne contactezi direct pentru ecrane nelimitate, SLA garantat și asistență dedicată.
          </p>
          <div className="flex flex-col sm:flex-row gap-4">
            <a href="mailto:contact@getapp.ro" className="flex items-center justify-center gap-2 px-6 py-3 bg-slate-800 text-white rounded-xl font-bold hover:bg-slate-700 transition-colors shadow-md">
              <Mail className="w-4 h-4" />
              Trimite Email
            </a>
            <a href="tel:+4" className="flex items-center justify-center gap-2 px-6 py-3 bg-white text-slate-800 border border-slate-200 rounded-xl font-bold hover:bg-slate-50 transition-colors shadow-sm">
              <Phone className="w-4 h-4" />
              Sună-ne
            </a>
          </div>
        </div>

        <div className="text-center mt-12 mb-8">
          <p className="text-sm text-slate-500 flex items-center justify-center gap-2 font-medium">
            <ShieldCheck className="w-4 h-4 text-emerald-500" />
            Plăți securizate prin Viva Wallet. Activarea se face automat după confirmarea plății.
          </p>
        </div>

      </div>
    </DashboardLayout>
  );
};
