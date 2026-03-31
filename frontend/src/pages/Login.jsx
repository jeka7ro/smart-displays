import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext.jsx';
import { Tv, Eye, EyeOff, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import GoogleButton from '../components/GoogleButton.jsx';

export default function Login() {
  const { login } = useAuth();
  const navigate   = useNavigate();
  const [form, setForm]     = useState({ email: '', password: '' });
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError]   = useState('');

  const handle = e => setForm(f => ({ ...f, [e.target.name]: e.target.value }));

  const submit = async e => {
    e.preventDefault();
    setError(''); setLoading(true);
    try {
      await login(form.email, form.password);
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.detail || 'Email sau parolă incorectă');
    } finally { setLoading(false); }
  };

  return (
    <div className="min-h-screen bg-surface-900 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background glow */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[500px] h-[500px]
                      bg-brand-600/10 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-sm relative">
        <div className="sd-card space-y-4">

          {/* Logo */}
          <div className="flex flex-col items-center justify-center mb-8">
            <div className="w-14 h-14 rounded-2xl bg-brand-600/20 border border-brand-500/30 flex items-center justify-center shadow-xl shadow-brand-500/20 mb-3">
              <Tv className="w-7 h-7 text-brand-400" />
            </div>
            <div className="text-center">
              <div className="text-2xl font-black text-white leading-none tracking-tight">GetApp</div>
              <div className="text-[10px] font-bold uppercase tracking-[0.25em] text-brand-400 mt-1">Smart Displays</div>
            </div>
          </div>

          {error && (
            <div className="flex items-center gap-2 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
              <AlertCircle className="w-4 h-4 shrink-0" />
              {error}
            </div>
          )}

          {/* Google button */}
          <GoogleButton onError={setError} />

          {/* Divider */}
          <div className="flex items-center gap-3">
            <div className="flex-1 h-px bg-white/[0.06]" />
            <span className="text-xs text-white/25">sau cu email</span>
            <div className="flex-1 h-px bg-white/[0.06]" />
          </div>

          <form onSubmit={submit} className="space-y-4">
            <div>
              <label className="sd-label">Email</label>
              <input className="sd-input" type="email" name="email"
                     value={form.email} onChange={handle} required
                     placeholder="adresa@email.com" autoComplete="email" />
            </div>

            <div>
              <label className="sd-label">Parolă</label>
              <div className="relative">
                <input className="sd-input pr-10" type={showPw ? 'text' : 'password'}
                       name="password" value={form.password} onChange={handle}
                       required placeholder="Parola ta" autoComplete="current-password" />
                <button type="button" onClick={() => setShowPw(s => !s)}
                  title={showPw ? "Ascunde parola" : "Vizualizează parola"}
                  className="absolute right-3 top-1/2 -translate-y-1/2 bg-surface-800 p-1.5 rounded-md border border-white/5 text-brand-400 hover:text-brand-300 hover:bg-surface-700 transition-all flex items-center justify-center">
                  {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>

              {/* Memory and Recover */}
              <div className="flex items-center justify-between mt-3 text-sm">
                <label className="flex items-center gap-2 cursor-pointer group">
                  <input type="checkbox" className="w-4 h-4 rounded border-white/10 bg-surface-900 
                                                  text-brand-500 focus:ring-brand-500/50 focus:ring-offset-surface-800 
                                                  transition-all checked:border-brand-500" defaultChecked />
                  <span className="text-white/60 group-hover:text-white transition-colors">Ține-mă minte</span>
                </label>
                
                <button type="button" onClick={() => toast.info('Funcționalitatea de recuperare parolă va fi disponibilă în curând.')} 
                        className="text-brand-400 hover:text-brand-300 transition-colors bg-transparent border-0 p-0 text-sm">
                  Ai uitat parola?
                </button>
              </div>
            </div>

            <button type="submit" disabled={loading}
              className="sd-btn-primary w-full justify-center py-2.5">
              {loading ? 'Se conectează...' : 'Intră în cont'}
            </button>
          </form>

          <p className="text-center text-sm text-white/40">
            Nu ai cont?{' '}
            <Link to="/register" className="text-brand-400 hover:text-brand-300 font-medium">
              Creează cont gratuit
            </Link>
          </p>
        </div>

        <p className="text-center text-xs text-white/20 mt-6">
          © {new Date().getFullYear()} GetApp · Smart Displays
        </p>
      </div>
    </div>
  );
}
