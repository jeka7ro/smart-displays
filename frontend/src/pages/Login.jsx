import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext.jsx';
import { Tv, Eye, EyeOff, AlertCircle } from 'lucide-react';
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
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl
                          bg-brand-600/20 border border-brand-500/30 mb-4">
            <Tv className="w-7 h-7 text-brand-400" />
          </div>
          <h1 className="text-2xl font-bold text-white">Smart Displays</h1>
          <p className="text-white/40 text-sm mt-1">Intră în contul tău</p>
        </div>

        <div className="sd-card space-y-4">
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
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60 transition-colors">
                  {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
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
