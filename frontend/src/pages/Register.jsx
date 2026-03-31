import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext.jsx';
import { Tv, Eye, EyeOff, AlertCircle, CheckCircle } from 'lucide-react';
import PhoneField from '../components/PhoneField.jsx';
import GoogleButton from '../components/GoogleButton.jsx';

export default function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({
    is_company: false, org_name: '', first_name: '', last_name: '', email: '', phone: '', password: '', confirm: ''
  });
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handle = e => setForm(f => ({ ...f, [e.target.name]: e.target.value }));
  const handlePhone = val => {
    // Înlătură 0-ul dacă utilizatorul îl scrie imediat după codul de țară (ex: +40 072... -> +40 72...)
    if (val && val.startsWith('+40') && val.charAt(3) === '0') {
      val = '+40' + val.substring(4);
    }
    setForm(f => ({ ...f, phone: val || '' }));
  };

  const submit = async e => {
    e.preventDefault();
    if (form.password !== form.confirm) { setError('Parolele nu coincid'); return; }
    if (form.password.length < 6) { setError('Parola trebuie să aibă minim 6 caractere'); return; }
    setError(''); setLoading(true);
    try {
      const computedFullName = `${form.first_name} ${form.last_name}`.trim();
      const computedOrgName = form.is_company && form.org_name.trim() ? form.org_name : computedFullName;

      await register({ org_name: computedOrgName, full_name: computedFullName, email: form.email, phone: form.phone, password: form.password });
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.detail || 'Eroare la înregistrare. Încearcă din nou.');
    } finally { setLoading(false); }
  };

  const PERKS = [
    'Un ecran configurat în 5 minute',
    'Control complet conținut & efecte vizuale',
    'Playlisturi automate, programabile',
    'Funcționează pe orice Smart TV sau display',
  ];

  return (
    <div className="min-h-screen bg-surface-900 flex">
      {/* Left — branding panel */}
      <div className="hidden lg:flex flex-col justify-center px-14 py-16 w-[420px] shrink-0
                      bg-gradient-to-br from-brand-900/60 to-surface-900 border-r border-white/[0.06]">
        <div className="mb-10">
          <div className="mb-8 flex items-center gap-4">
            <div className="w-12 h-12 shrink-0 rounded-2xl bg-brand-600/20 border border-brand-500/30 flex items-center justify-center shadow-xl shadow-brand-500/20">
              <Tv className="w-6 h-6 text-brand-400" />
            </div>
            <div>
              <div className="text-2xl font-black text-white leading-none tracking-tight">GetApp</div>
              <div className="text-[10px] font-bold uppercase tracking-[0.25em] text-brand-400 mt-1">Smart Displays</div>
            </div>
          </div>
          <h2 className="text-3xl font-black text-white leading-snug mb-3">
            Gestionează ecranele<br />
            <span className="text-brand-400">de oriunde</span>
          </h2>
          <p className="text-white/50 text-sm leading-relaxed">
            Smart Displays îți permite să controlezi orice Smart TV sau ecran digital direct din browser.
          </p>
        </div>

        <ul className="space-y-4">
          {PERKS.map(p => (
            <li key={p} className="flex items-start gap-3 text-sm text-white/70">
              <CheckCircle className="w-4 h-4 text-green-400 mt-0.5 shrink-0" />
              {p}
            </li>
          ))}
        </ul>

        <div className="mt-auto pt-12 text-xs text-white/20">
          © {new Date().getFullYear()} GetApp · Smart Displays
        </div>
      </div>

      {/* Right — form */}
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-md">
          {/* Mobile logo */}
          <div className="lg:hidden flex flex-col items-center justify-center mb-8">
            <div className="w-14 h-14 rounded-2xl bg-brand-600/20 border border-brand-500/30 flex items-center justify-center shadow-xl shadow-brand-500/20 mb-3">
              <Tv className="w-7 h-7 text-brand-400" />
            </div>
            <div className="text-center">
              <div className="text-2xl font-black text-white leading-none tracking-tight">GetApp</div>
              <div className="text-[10px] font-bold uppercase tracking-[0.25em] text-brand-400 mt-1">Smart Displays</div>
            </div>
          </div>

          <form onSubmit={submit} className="space-y-4">
            {error && (
              <div className="flex items-center gap-2 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
                <AlertCircle className="w-4 h-4 shrink-0" /> {error}
              </div>
            )}

            <GoogleButton isRegister={true} onError={setError} />

            <div className="flex items-center gap-3 py-1 mb-2">
              <div className="flex-1 h-px bg-white/[0.06]" />
              <span className="text-xs text-white/25">sau cu email</span>
              <div className="flex-1 h-px bg-white/[0.06]" />
            </div>

            <label className="flex items-center gap-2 cursor-pointer pb-2 group w-fit">
              <input type="checkbox" name="is_company" checked={form.is_company}
                     onChange={(e) => setForm(f => ({ ...f, is_company: e.target.checked }))}
                     className="w-4 h-4 rounded border-white/10 bg-surface-900 text-brand-500 focus:ring-brand-500/50 transition-all checked:border-brand-500" />
              <span className="text-sm text-white/50 group-hover:text-white transition-colors">Înregistrez o companie (Persoană Juridică)</span>
            </label>

            {form.is_company && (
              <div className="animate-fade-in">
                <label className="sd-label">Numele companiei *</label>
                <input className="sd-input" name="org_name" value={form.org_name} onChange={handle} required={form.is_company} placeholder="Ex: SC Companie SRL" />
              </div>
            )}

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="sd-label">Nume *</label>
                <input className="sd-input" name="last_name" value={form.last_name} onChange={handle} required placeholder="Popescu" autoComplete="family-name" />
              </div>
              <div>
                <label className="sd-label">Prenume *</label>
                <input className="sd-input" name="first_name" value={form.first_name} onChange={handle} required placeholder="Ion" autoComplete="given-name" />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="sd-label">Adresă email *</label>
                <input
                  className="sd-input"
                  type="email"
                  name="email"
                  value={form.email}
                  onChange={handle}
                  required
                  placeholder="adresa@email.com"
                  autoComplete="email"
                />
              </div>

              <div>
                <label className="sd-label">Telefon internațional</label>
                <PhoneField value={form.phone} onChange={val => setForm(f => ({ ...f, phone: val }))} />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="sd-label">Parolă *</label>
                <div className="relative">
                  <input
                    className="sd-input pr-10"
                    type={showPw ? 'text' : 'password'}
                    name="password"
                    value={form.password}
                    onChange={handle}
                    required
                    placeholder="Minim 6 caractere"
                    autoComplete="new-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPw(s => !s)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60 transition-colors"
                  >
                    {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
              <div>
                <label className="sd-label">Confirmă parola *</label>
                <input
                  className="sd-input"
                  type="password"
                  name="confirm"
                  value={form.confirm}
                  onChange={handle}
                  required
                  placeholder="Repetă parola"
                  autoComplete="new-password"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="sd-btn-primary w-full justify-center py-3 mt-2 text-base"
            >
              {loading ? 'Se creează contul...' : 'Creează cont gratuit →'}
            </button>

            <p className="text-center text-sm text-white/40 pt-1">
              Ai deja cont?{' '}
              <Link to="/login" className="text-brand-400 hover:text-brand-300 font-medium">
                Autentifică-te
              </Link>
            </p>
          </form>

          <p className="text-center text-xs text-white/20 mt-8 lg:hidden">
            © {new Date().getFullYear()} GetApp · Smart Displays
          </p>
        </div>
      </div>
    </div>
  );
}
