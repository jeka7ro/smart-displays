import React, { useState, useEffect } from 'react';
import { DashboardLayout } from '../components/DashboardLayout';
import { Plus, Minus } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useTranslation } from 'react-i18next';
import api from '../utils/api';
import { toast } from 'sonner';

export const Subscription = () => {
  const { user } = useAuth();
  const { t } = useTranslation();
  const [loadingId, setLoadingId] = useState(null);
  const [screenCount, setScreenCount] = useState(1);
  const [stats, setStats] = useState({ screens: 0, plan: 'none' });

  useEffect(() => {
    api.get('/dashboard/stats').then(res => {
      setStats({ 
        screens: res.data.screens_total || 0,
        plan: res.data.plan || 'trial'
      });
    }).catch(() => {});
  }, []);

  const handleCheckout = async (planType) => {
    setLoadingId(planType);
    try {
      const res = await api.post('/billing/checkout', { plan: planType, quantity: screenCount });
      if (res.data && res.data.url) {
        window.location.href = res.data.url;
      }
    } catch (error) {
      console.error('Checkout error', error);
      toast.error('Eroare la procesarea plății.');
    } finally {
      setLoadingId(null);
    }
  };

  const isTrial = stats.plan === 'trial' || stats.plan === 'none' || stats.plan === 'free';

  const plans = [
    { id: 'day', name: t('subscription.planDayName'), desc: t('subscription.planDayDesc'), price: 1.21 },
    { id: 'week', name: t('subscription.planWeekName'), desc: t('subscription.planWeekDesc'), price: 6.05, savings: '-28%' },
    { id: 'month', name: t('subscription.planMonthName'), desc: t('subscription.planMonthDesc'), price: 18.15, popular: true, savings: '-50%' }
  ];

  return (
    <DashboardLayout>
      <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-6xl mx-auto" data-testid="subscription-page">
        
        {/* Header Typography */}
        <div className="mb-6 text-center md:text-left">
          <h1 className="text-3xl md:text-4xl font-black tracking-tight text-slate-800 mb-2">
            {t('subscription.title')}
          </h1>
          <p className="text-lg text-slate-500 font-medium">
            {t('subscription.subtitle')}
          </p>
        </div>

        {/* Hero Banner & Status Info */}
        <div className="glass-card overflow-hidden mb-12 shadow-[0_20px_60px_-15px_rgba(0,0,0,0.1)]">
          <div className="h-48 md:h-64 w-full relative bg-slate-900 border-b border-slate-200/50">
            <img 
              src="/images/hero_premium.png" 
              alt="Premium Platform" 
              className="w-full h-full object-cover opacity-90"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-slate-900/60 to-transparent"></div>
            
            <div className="absolute bottom-6 left-8 right-8 flex flex-col md:flex-row md:items-end justify-between gap-4">
              <div>
                <p className="text-white/70 text-sm font-bold tracking-widest uppercase mb-1">{t('subscription.status')}</p>
                <div className="flex items-center gap-3">
                  <div className={`w-3 h-3 rounded-full shadow-[0_0_10px_rgba(255,255,255,0.5)] ${isTrial ? 'bg-amber-400' : 'bg-emerald-400'}`}></div>
                  <h2 className="text-2xl font-bold text-white">
                    {isTrial ? t('subscription.statusTrial') : t('subscription.statusActive')}
                  </h2>
                </div>
              </div>
              
              <div className="bg-white/10 backdrop-blur-md border border-white/20 px-6 py-3 rounded-2xl text-center">
                <p className="text-white/80 text-xs font-bold uppercase tracking-wider mb-1">
                  {stats.screens === 1 ? t('subscription.screensRegistered') : t('subscription.screensRegisteredPlural')}
                </p>
                <p className="text-3xl font-black text-white">{stats.screens}</p>
              </div>
            </div>
          </div>
          
          <div className="p-6 bg-white/50 backdrop-blur-3xl">
            <p className="text-slate-600 text-lg font-medium max-w-3xl leading-relaxed">
               {isTrial ? t('subscription.statusDescTrial') : t('subscription.statusDescActive')}
            </p>
          </div>
        </div>

        {/* Control & Plans Grid */}
        <div className="mb-12">
          
          {/* Universal Screen Setup */}
          <div className="flex flex-col md:flex-row items-center justify-between gap-6 mb-8 bg-white/60 backdrop-blur-2xl border border-slate-200/60 p-6 rounded-3xl shadow-sm">
            <div>
               <h3 className="text-2xl font-black text-slate-800 tracking-tight">
                  {t('subscription.planTitle')}
               </h3>
               <p className="text-slate-500 font-medium">
                  {t('subscription.extendLabel')}
               </p>
            </div>
            
            <div className="flex items-center gap-4">
              <span className="font-bold text-slate-500 uppercase tracking-widest text-xs hidden sm:block">
                 {t('subscription.selectScreens')}
              </span>
              <div className="flex items-center gap-4 bg-slate-100/80 border border-slate-200/80 rounded-[1.25rem] p-1.5 shadow-inner min-w-[160px]">
                <button 
                  onClick={() => setScreenCount(Math.max(1, screenCount - 1))}
                  className="w-12 h-12 flex items-center justify-center bg-white hover:bg-slate-50 border border-slate-200 rounded-[1rem] text-slate-600 transition-all active:scale-95 shadow-sm"
                >
                  <Minus className="w-5 h-5"/>
                </button>
                <span className="flex-1 text-center font-black text-2xl text-slate-800 tracking-tighter">
                  {screenCount}
                </span>
                <button 
                  onClick={() => setScreenCount(screenCount + 1)}
                  className="w-12 h-12 flex items-center justify-center bg-white hover:bg-slate-50 border border-slate-200 rounded-[1rem] text-slate-600 transition-all active:scale-95 shadow-sm"
                >
                  <Plus className="w-5 h-5"/>
                </button>
              </div>
            </div>
          </div>

          {/* Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {plans.map((plan) => (
              <div 
                key={plan.id}
                className={`flex flex-col relative overflow-hidden transition-all duration-300 ${
                  plan.popular 
                    ? 'bg-white/60 backdrop-blur-3xl border-2 border-emerald-400 shadow-[0_20px_40px_-10px_rgba(16,185,129,0.15)] rounded-[2rem] md:-translate-y-2' 
                    : 'glass-card border border-white/60'
                } p-8`}
              >
                {plan.popular && (
                  <div className="absolute top-0 inset-x-0 h-1.5 bg-gradient-to-r from-emerald-400 to-teal-400"></div>
                )}
                
                <div className="flex justify-between items-start mb-2">
                  <h4 className="text-2xl font-black text-slate-800">{plan.name}</h4>
                  {plan.savings && (
                    <span className="bg-emerald-100 text-emerald-700 text-xs font-bold px-3 py-1 rounded-full border border-emerald-200 shadow-sm animate-in zoom-in duration-300">
                      {plan.savings}
                    </span>
                  )}
                </div>
                <p className="text-slate-500 font-medium mb-8 flex-1">{plan.desc}</p>
                
                <div className="mb-8">
                  <div className="flex items-baseline gap-1 mb-1">
                    <span className="text-5xl font-black tracking-tighter text-slate-800">
                      {(plan.price * screenCount).toFixed(2)}
                    </span>
                    <span className="text-xl font-bold text-slate-400">€</span>
                  </div>
                  <span className="text-slate-400 font-medium text-sm">
                    {screenCount === 1 ? t('subscription.totalTVA', { count: screenCount }) : t('subscription.totalTVAPlural', { count: screenCount })}
                  </span>
                </div>

                <button
                  onClick={() => handleCheckout(plan.id)}
                  disabled={loadingId !== null}
                  className={`w-full py-4 rounded-2xl font-bold text-white transition-all overflow-hidden relative group disabled:opacity-70 disabled:active:scale-100 ${
                     plan.popular
                       ? 'bg-gradient-to-r from-emerald-500 to-teal-500 hover:shadow-[0_10px_25px_rgba(16,185,129,0.4)] hover:opacity-90 active:scale-[0.98]'
                       : 'bg-slate-900/80 backdrop-blur-xl border border-white/10 hover:bg-black shadow-[0_10px_30px_rgba(0,0,0,0.3)] inset-shadow-white/20 active:scale-[0.98]'
                  }`}
                >
                  <span className="relative z-10 tracking-wide">
                     {loadingId === plan.id ? t('subscription.btnProcessing') : t('subscription.btnSubscribe')}
                  </span>
                  {!plan.popular && (
                    <div className="absolute inset-0 bg-white/10 blur-md transform translate-y-full group-hover:translate-y-0 transition-transform duration-300"></div>
                  )}
                </button>
                <p className="text-[11px] text-center font-bold uppercase tracking-wider text-slate-400 mt-4 leading-relaxed">
                  Plan Recurent. <br/>Anulare oricând din cont.
                </p>
                
              </div>
            ))}
          </div>

        </div>
        
        {/* Enterprise Block */}
        <div className="mt-16 mb-8 relative rounded-[2rem] overflow-hidden p-1">
          <div className="absolute inset-0 bg-gradient-to-br from-slate-800 via-slate-900 to-black rounded-[2rem]"></div>
          
          <div className="relative bg-[#0B0F19]/60 backdrop-blur-3xl rounded-[1.8rem] p-8 md:p-12 border border-white/10 text-center shadow-[inset_0_1px_0_rgba(255,255,255,0.1)]">
            <div className="absolute -top-24 -right-24 w-64 h-64 bg-emerald-500/20 rounded-full blur-[80px] pointer-events-none"></div>
            <div className="absolute -bottom-24 -left-24 w-64 h-64 bg-indigo-500/20 rounded-full blur-[80px] pointer-events-none"></div>
            
            <h4 className="text-3xl font-black tracking-tight text-white mb-4 relative z-10">{t('subscription.customTitle')}</h4>
            <p className="text-slate-300 text-lg max-w-2xl mx-auto mb-8 leading-relaxed relative z-10 font-medium">
              {t('subscription.customDesc')}
            </p>
            <div className="flex flex-col sm:flex-row justify-center gap-5 relative z-10">
              <a href="mailto:contact@getapp.ro" className="px-8 py-4 bg-white/10 backdrop-blur-md border border-white/20 text-white rounded-2xl font-bold hover:bg-white/20 transition-all shadow-[0_4px_20px_rgba(0,0,0,0.3)] hover:scale-[1.02] active:scale-95">
                {t('subscription.btnEmail')}
              </a>
              <a href="tel:+40" className="px-8 py-4 bg-white text-slate-900 rounded-2xl font-bold hover:bg-slate-100 transition-all shadow-[0_4px_20px_rgba(255,255,255,0.1)] hover:scale-[1.02] active:scale-95">
                {t('subscription.btnCall')}
              </a>
            </div>
          </div>
        </div>

      </div>
    </DashboardLayout>
  );
};
