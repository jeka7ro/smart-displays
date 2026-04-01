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
  const [loading, setLoading] = useState(false);
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

  const handleCheckout = async () => {
    setLoading(true);
    try {
      const res = await api.post('/billing/checkout', { plan: 'month', quantity: screenCount });
      if (res.data && res.data.url) {
        window.location.href = res.data.url;
      }
    } catch (error) {
      console.error('Checkout error', error);
      toast.error('Eroare la procesarea plății.');
    } finally {
      setLoading(false);
    }
  };

  const isTrial = stats.plan === 'trial' || stats.plan === 'none' || stats.plan === 'free';
  const pricePerMonth = 18.15;
  const totalPrice = (pricePerMonth * screenCount).toFixed(2);

  return (
    <DashboardLayout>
      <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-5xl mx-auto" data-testid="subscription-page">
        
        {/* Header Typography */}
        <div className="mb-10 text-center md:text-left">
          <h1 className="text-4xl md:text-5xl font-black tracking-tight text-slate-800 mb-3">
            {t('subscription.title')}
          </h1>
          <p className="text-xl text-slate-500 font-medium">
            {t('subscription.subtitle')}
          </p>
        </div>

        {/* Hero Banner & Status Info */}
        <div className="glass-card overflow-hidden mb-12 shadow-[0_20px_60px_-15px_rgba(0,0,0,0.1)]">
          <div className="h-64 md:h-80 w-full relative bg-slate-900 border-b border-slate-200/50">
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
          
          <div className="p-8 bg-white/50 backdrop-blur-3xl">
            <p className="text-slate-600 text-lg md:text-xl font-medium max-w-3xl leading-relaxed">
               {isTrial ? t('subscription.statusDescTrial') : t('subscription.statusDescActive')}
            </p>
          </div>
        </div>

        {/* Unified SaaS Recurring Plan */}
        <div className="mb-12">
          <h3 className="text-2xl font-bold text-slate-800 mb-6 tracking-tight">
            {t('subscription.planTitle')}
          </h3>
          
          <div className="glass-card p-1">
            <div className="bg-white/80 backdrop-blur-xl rounded-[22px] p-8 md:p-12 border border-white flex flex-col lg:flex-row gap-12 lg:items-center">
              
              <div className="flex-1">
                <div className="inline-block px-4 py-1.5 bg-slate-100 rounded-full text-xs font-bold tracking-widest uppercase text-slate-500 mb-6">
                  {t('subscription.planName')}
                </div>
                <h4 className="text-3xl font-black text-slate-800 mb-4">{t('subscription.planLimits')}</h4>
                <p className="text-slate-500 text-lg mb-8 leading-relaxed">
                  {t('subscription.planLimitsDesc')}
                </p>
                
                <div className="flex items-center gap-6 bg-slate-50/80 border border-slate-200 rounded-2xl p-2 max-w-xs shadow-inner">
                  <button 
                    onClick={() => setScreenCount(Math.max(1, screenCount - 1))}
                    className="p-4 bg-white hover:bg-slate-50 border border-slate-200 rounded-xl text-slate-600 transition-all active:scale-95 shadow-sm"
                  >
                    <Minus className="w-5 h-5"/>
                  </button>
                  <span className="flex-1 text-center font-black text-4xl text-slate-800 tracking-tighter">{screenCount}</span>
                  <button 
                    onClick={() => setScreenCount(screenCount + 1)}
                    className="p-4 bg-white hover:bg-slate-50 border border-slate-200 rounded-xl text-slate-600 transition-all active:scale-95 shadow-sm"
                  >
                    <Plus className="w-5 h-5"/>
                  </button>
                </div>
              </div>
              
              <div className="w-px h-64 bg-slate-200 hidden lg:block"></div>
              
              <div className="flex-1 flex flex-col items-start lg:items-center text-left lg:text-center">
                <span className="text-slate-400 font-medium mb-2 uppercase tracking-wide text-sm">{t('subscription.planDesc')}</span>
                <div className="flex items-baseline gap-2 mb-2">
                  <span className="text-6xl md:text-7xl font-black tracking-tighter text-slate-800">{totalPrice}</span>
                  <span className="text-2xl font-bold text-slate-400">€</span>
                </div>
                <span className="text-slate-500 font-medium mb-10 text-lg">
                  {screenCount === 1 ? t('subscription.totalTVA', { count: screenCount }) : t('subscription.totalTVAPlural', { count: screenCount })}
                </span>
                
                <button
                  onClick={handleCheckout}
                  disabled={loading}
                  className="w-full max-w-md py-5 rounded-2xl font-bold text-lg text-white bg-slate-900 hover:bg-black transition-all shadow-[0_10px_30px_rgba(0,0,0,0.15)] active:scale-95 disabled:opacity-70 disabled:active:scale-100"
                >
                  {loading ? t('subscription.btnProcessing') : t('subscription.btnSubscribe')}
                </button>
                
                <p className="text-xs font-bold uppercase tracking-widest text-slate-400 mt-6 text-center w-full">
                  {t('subscription.securePayment')}
                </p>
              </div>

            </div>
          </div>
        </div>
        
        {/* Enterprise Block no icons */}
        <div className="glass-card p-1">
          <div className="bg-slate-50/50 backdrop-blur-3xl rounded-[22px] p-8 md:p-12 border border-white text-center">
            <h4 className="text-2xl font-black tracking-tight text-slate-800 mb-4">{t('subscription.customTitle')}</h4>
            <p className="text-slate-500 text-lg max-w-2xl mx-auto mb-8 leading-relaxed">
              {t('subscription.customDesc')}
            </p>
            <div className="flex flex-col sm:flex-row justify-center gap-4">
              <a href="mailto:contact@getapp.ro" className="px-8 py-4 bg-slate-200 text-slate-800 rounded-2xl font-bold hover:bg-slate-300 transition-colors shadow-sm">
                {t('subscription.btnEmail')}
              </a>
              <a href="tel:+40" className="px-8 py-4 bg-white text-slate-800 border border-slate-200 rounded-2xl font-bold hover:bg-slate-50 hover:border-slate-300 transition-colors shadow-sm">
                {t('subscription.btnCall')}
              </a>
            </div>
          </div>
        </div>

      </div>
    </DashboardLayout>
  );
};
