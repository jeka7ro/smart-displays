import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext.jsx';
import { auth, locations, screens } from '../lib/api.js';
import { Tv, MapPin, CheckCircle, ArrowRight, Loader, MonitorPlay } from 'lucide-react';
import { toast } from 'sonner';

export default function Onboarding() {
  const { user, refreshUser } = useAuth();
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  
  // Data
  const [locationName, setLocationName] = useState('Locația mea principală');
  const [screenName, setScreenName] = useState('Ecran Vitrină');
  const [createdLocationId, setCreatedLocationId] = useState(null);
  const [generatedSlug, setGeneratedSlug] = useState('');

  // Daca e deja onboarded, skip
  useEffect(() => {
    if (user?.is_onboarded) navigate('/dashboard', { replace: true });
  }, [user, navigate]);

  const handleError = (err, fallback) => {
    const detail = err.response?.data?.detail;
    if (typeof detail === 'string') toast.error(detail);
    else if (Array.isArray(detail)) toast.error('Eroare: Date invalide sau lipsă.');
    else toast.error(fallback);
  };

  const doStep1 = async (e) => {
    e.preventDefault();
    if (!locationName.trim()) return toast.error('Adaugă un nume locației.');
    setLoading(true);
    try {
      const res = await locations.create({ name: locationName, address: '', city: '' });
      setCreatedLocationId(res.data.id);
      setStep(2);
    } catch (err) {
      handleError(err, 'Eroare la creare locație');
    } finally { setLoading(false); }
  };

  const doStep2 = async (e) => {
    e.preventDefault();
    if (!screenName.trim()) return toast.error('Adaugă un nume ecranului.');
    setLoading(true);
    try {
      const base = screenName.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
      const uniqueSlug = base ? `${base}-${Math.floor(Math.random() * 1000)}` : `ecran-${Math.floor(Math.random() * 10000)}`;
      
      const res = await screens.create({ name: screenName, slug: uniqueSlug, location_id: createdLocationId, resolution: '1920x1080' });
      setGeneratedSlug(res.data.slug);
      setStep(3);
    } catch (err) {
      handleError(err, 'Eroare generare ecran');
    } finally { setLoading(false); }
  };

  const doFinish = async () => {
    setLoading(true);
    try {
      await auth.onboarding();
      await refreshUser();
      navigate('/dashboard');
      toast.success('Gata! Meniul complet este activ.');
    } catch (err) {
      handleError(err, 'Eroare la finalizare');
    } finally { setLoading(false); }
  };

  if (!user || user.is_onboarded) return null;

  return (
    <div className="fixed inset-0 z-50 bg-surface-900 flex items-center justify-center p-4">
      {/* Background glow */}
      <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-brand-600/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-indigo-600/10 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-xl relative bg-surface-800 border border-white/[0.05] rounded-3xl shadow-2xl p-8 sm:p-12 animate-slide-up">
        
        {/* Progress header */}
        <div className="flex items-center justify-between mb-10">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-xl bg-brand-600/20 border border-brand-500/30 flex items-center justify-center">
              <Tv className="w-5 h-5 text-brand-400" />
            </div>
            <span className="font-bold text-white tracking-wide">GetApp Setup</span>
          </div>
          <div className="flex gap-2 text-sm text-white/40">
            <span className={step >= 1 ? 'text-brand-400 font-bold' : ''}>1</span> <span className="opacity-30">/</span>
            <span className={step >= 2 ? 'text-brand-400 font-bold' : ''}>2</span> <span className="opacity-30">/</span>
            <span className={step >= 3 ? 'text-brand-400 font-bold' : ''}>3</span>
          </div>
        </div>

        {/* Step 1: Location */}
        {step === 1 && (
          <form onSubmit={doStep1} className="space-y-6 animate-fade-in">
            <div className="text-center">
              <div className="w-16 h-16 bg-surface-700/50 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-white/5">
                <MapPin className="w-8 h-8 text-white/80" />
              </div>
              <h2 className="text-2xl font-black text-white mb-2">Adaugă prima locație</h2>
              <p className="text-white/50 text-sm max-w-md mx-auto">
                Fiecare ecran TV este asociat unei locații fizice. Așa vei putea urmări clar care ecrane sunt în care magazine sau birouri.
              </p>
            </div>
            <div className="pt-4">
              <label className="sd-label text-center block mb-3 text-white/50">Cum se numește locația?</label>
              <input 
                className="sd-input text-center text-xl font-bold py-4 bg-surface-900 border-white/10" 
                value={locationName} 
                onChange={e => setLocationName(e.target.value)} 
                autoFocus
              />
            </div>
            <button type="submit" disabled={loading} className="sd-btn-primary w-full justify-center py-4 text-lg font-bold mt-4">
              {loading ? <Loader className="w-5 h-5 animate-spin" /> : <>Continuă <ArrowRight className="w-5 h-5 ml-1" /></>}
            </button>
          </form>
        )}

        {/* Step 2: Screen */}
        {step === 2 && (
          <form onSubmit={doStep2} className="space-y-6 animate-fade-in">
             <div className="text-center">
              <div className="w-16 h-16 bg-surface-700/50 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-white/5">
                <MonitorPlay className="w-8 h-8 text-white/80" />
              </div>
              <h2 className="text-2xl font-black text-white mb-2">Configurează Ecranul</h2>
              <p className="text-white/50 text-sm max-w-md mx-auto">
                Apelează-l într-un mod prietenos. Pe acesta vei trimite imagini, oferte și reclame. Acesta fi asociat locației **{locationName}**.
              </p>
            </div>
            <div className="pt-4">
              <label className="sd-label text-center block mb-3 text-white/50">Numele ecranului tău</label>
              <input 
                className="sd-input text-center text-xl font-bold py-4 bg-surface-900 border-white/10" 
                value={screenName} 
                onChange={e => setScreenName(e.target.value)} 
                autoFocus
              />
            </div>
            <button type="submit" disabled={loading} className="sd-btn-primary w-full justify-center py-4 text-lg font-bold mt-4">
               {loading ? <Loader className="w-5 h-5 animate-spin" /> : <>Generează cod ecran <ArrowRight className="w-5 h-5 ml-1" /></>}
            </button>
          </form>
        )}

        {/* Step 3: Magic Code */}
        {step === 3 && (
          <div className="space-y-6 animate-fade-in text-center">
             <div className="w-20 h-20 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-4 border border-green-500/30">
                <CheckCircle className="w-10 h-10 text-green-400" />
             </div>
             <h2 className="text-3xl font-black text-white mb-2">Ecran creat cu succes!</h2>
             
             <div className="bg-surface-900 border border-white/5 p-6 rounded-2xl mt-8">
               <p className="text-white/50 text-sm font-medium uppercase tracking-wider mb-2">Acesta este codul și URL-ul tău:</p>
               <div className="flex flex-col gap-2 mb-4">
                 <div className="text-base text-white">Deschide browser-ul TV-ului și vizitează:</div>
                 <code className="bg-brand-500/10 text-brand-400 py-3 px-4 rounded-xl text-xl font-mono border border-brand-500/20">
                    displays.getapp.ro/tv/{generatedSlug}
                 </code>
               </div>
               <p className="text-white/40 text-xs">
                 Poți oricând găsi acest link în secțiunea de Ecrane.
               </p>
             </div>

             <button onClick={doFinish} disabled={loading} className="sd-btn-primary bg-white text-surface-900 w-full justify-center py-4 text-lg font-black mt-6 shadow-xl shadow-white/10 hover:shadow-white/20">
               {loading ? <Loader className="w-5 h-5 animate-spin" /> : 'Începe să folosești platforma'}
             </button>
          </div>
        )}

      </div>
    </div>
  );
}
