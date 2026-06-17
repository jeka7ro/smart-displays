import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../contexts/AuthContext';
import { Eye, EyeOff } from 'lucide-react';
import { toast } from 'sonner';
import api from '../utils/api';

export const Login = () => {
  const [searchParams] = useSearchParams();
  const inviteCode = searchParams.get('invite');
  const { t } = useTranslation();

  const [isLogin, setIsLogin] = useState(!inviteCode);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [orgName, setOrgName] = useState('');
  const [invitationCode, setInvitationCode] = useState(inviteCode || '');
  const [loading, setLoading] = useState(false);
  const isOpenRegistration = true; // Hardcoded to true to allow public registration
  const [showPassword, setShowPassword] = useState(false);
  const [loginError, setLoginError] = useState('');
  const [inviteValid, setInviteValid] = useState(false);
  const [checkingInvite, setCheckingInvite] = useState(!!inviteCode);
  const [rememberMe, setRememberMe] = useState(false);
  
  const { login, register } = useAuth();
  const navigate = useNavigate();

  // Load remembered credentials
  useEffect(() => {
    const savedEmail = localStorage.getItem('remember_email');
    const savedPassword = localStorage.getItem('remember_password');
    if (savedEmail && savedPassword) {
      setEmail(savedEmail);
      setPassword(savedPassword);
      setRememberMe(true);
    }
  }, []);

  // Check if open registration is available (removed, now always open)

  // Validate invitation code from URL
  useEffect(() => {
    if (inviteCode) {
      const validateInvite = async () => {
        try {
          await api.get(`/invitations/validate/${inviteCode}`);
          setInviteValid(true);
          setIsLogin(false);
        } catch (error) {
          toast.error('Invalid or expired invitation code');
          setInviteValid(false);
        } finally {
          setCheckingInvite(false);
        }
      };
      validateInvite();
    }
  }, [inviteCode]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setLoginError('');

    try {
      if (isLogin) {
        await login(email, password);
        
        if (rememberMe) {
          localStorage.setItem('remember_email', email);
          localStorage.setItem('remember_password', password);
        } else {
          localStorage.removeItem('remember_email');
          localStorage.removeItem('remember_password');
        }
        
        toast.success('Login successful!');
      } else {
        await register(email, password, fullName, orgName, invitationCode || null);
        toast.success('Account created successfully!');
      }
      navigate('/dashboard');
    } catch (error) {
      const msg = error.response?.data?.detail || 'An error occurred';
      setLoginError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  const canRegister = isOpenRegistration || inviteValid || invitationCode;

  if (checkingInvite) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <div className="glass-card p-8 text-center">
          <div className="spinner w-8 h-8 mx-auto mb-4"></div>
          <p className="text-slate-600">Verifying invitation...</p>
        </div>
      </div>
    );
  }

  return (
    <div 
      className="min-h-screen w-full flex items-center justify-center p-6 relative overflow-hidden" 
      data-testid="login-page"
    >
      {/* Background Image Layer */}
      <div 
        className="fixed inset-0 z-0 bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: 'url("/images/restaurant_kiosk.png")', filter: 'blur(4px)', transform: 'scale(1.05)' }}
      >
      </div>
      <div className="fixed inset-0 z-0 bg-black/50"></div>

      <div className="w-full max-w-md relative z-10 transition-transform hover:scale-[1.01] duration-500">
        <div className="bg-slate-950/60 backdrop-blur-3xl border border-slate-600/50 rounded-[2.5rem] p-8" style={{ boxShadow: '0 30px 60px rgba(0,0,0,0.8), 0 0 0 1px rgba(255,255,255,0.15), inset 0 2px 20px rgba(255,255,255,0.05)' }}>
          <div className="flex justify-center items-center pt-2 mb-8">
            <img 
              src="/logo_cropped.png?v=3" 
              alt="Get App Smart Displays" 
              className="h-[60px] w-auto bg-white rounded-xl px-4 py-2 object-contain hover:scale-[1.02] transition-transform duration-300 shadow-lg"
            />
          </div>

          {/* Badge: First user registration */}
          {!isLogin && !inviteValid && isOpenRegistration && (
            <div className="mb-6 px-4 py-3 bg-white/10 backdrop-blur-md border border-white/20 rounded-xl flex items-center justify-center">
              <span className="text-sm text-white/90 font-medium tracking-wide">
                Profile Setup <strong className="text-white font-bold tracking-widest pl-1 uppercase">Admin</strong>
              </span>
            </div>
          )}

          {/* Badge: Valid invite */}
          {!isLogin && inviteValid && (
            <div className="mb-6 px-4 py-3 bg-emerald-500/10 backdrop-blur-md border border-emerald-500/20 rounded-xl flex items-center justify-center">
              <span className="text-sm text-emerald-400 font-medium">
                Invitation verified. Create your profile.
              </span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            {!isLogin && (
              <>
              <div>
                <label className="block text-xs font-bold tracking-widest uppercase text-slate-400 mb-2">
                  {t('register.fullName') || 'Numele Tău Complet'}
                </label>
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full bg-slate-900 border-slate-800 text-white rounded-xl px-4 py-3 border focus:border-white/50 focus:ring-1 focus:ring-white/50 outline-none transition-all placeholder:text-slate-600"
                  placeholder="John Doe"
                  required={!isLogin}
                  data-testid="fullname-input"
                />
              </div>
              
              <div>
                <label className="block text-xs font-bold tracking-widest uppercase text-slate-400 mb-2">
                  Company Name / Location
                </label>
                <input
                  type="text"
                  value={orgName}
                  onChange={(e) => setOrgName(e.target.value)}
                  className="w-full bg-slate-900 border-slate-800 text-white rounded-xl px-4 py-3 border focus:border-white/50 focus:ring-1 focus:ring-white/50 outline-none transition-all placeholder:text-slate-600"
                  placeholder="My Restaurant SRL"
                  required={!isLogin}
                  data-testid="orgname-input"
                />
              </div>
            </>
          )}

          <div>
              <label className="block text-xs font-bold tracking-widest uppercase text-slate-400 mb-2">
                {isLogin ? t('login.emailLabel') : t('register.email')}
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-slate-900 border-slate-800 text-white rounded-xl px-4 py-3 border focus:border-[#20b2aa] focus:ring-1 focus:ring-[#20b2aa] outline-none transition-all placeholder:text-slate-600"
                placeholder="admin@platform.com"
                required
                data-testid="email-input"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-xs font-bold tracking-widest uppercase text-slate-400">
                  {isLogin ? t('login.passwordLabel') : t('register.password')}
                </label>
                {isLogin && (
                  <Link
                    to="/forgot-password"
                    className="text-xs text-[#00ced1] hover:text-[#25c8cc] font-medium"
                  >
                    Forgot password?
                  </Link>
                )}
              </div>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-slate-900 border-slate-800 text-white rounded-xl px-4 py-3 pr-12 border focus:border-[#20b2aa] focus:ring-1 focus:ring-[#20b2aa] outline-none transition-all placeholder:text-slate-600"
                  placeholder="••••••••"
                  required
                  data-testid="password-input"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white transition-colors"
                  tabIndex={-1}
                  data-testid="toggle-password-visibility"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Remember Me */}
            {isLogin && (
              <div className="flex items-center mt-2 group cursor-pointer w-max" onClick={() => setRememberMe(!rememberMe)}>
                 <div className="relative flex items-center justify-center w-5 h-5 mr-3">
                    <input
                      type="checkbox"
                      checked={rememberMe}
                      readOnly
                      className="sr-only"
                    />
                    <div className={`w-full h-full rounded border transition-all ${rememberMe ? 'bg-[#20b2aa] border-[#20b2aa]' : 'bg-slate-900 border-slate-700 group-hover:border-slate-500'}`}>
                      {rememberMe && (
                        <svg className="w-full h-full text-white p-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                        </svg>
                      )}
                    </div>
                 </div>
                 <span className="text-sm font-medium text-slate-400 group-hover:text-white transition-colors">
                    Remember me
                 </span>
              </div>
            )}

            {/* Invitation code field removed */}

            {loginError && (
              <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-sm text-red-400 text-center font-medium">
                {loginError}
              </div>
            )}

            <button
              type="submit"
              disabled={loading || (!isLogin && !canRegister)}
              className="w-full bg-white text-slate-950 font-bold py-4 rounded-xl shadow-[0_0_20px_rgba(255,255,255,0.1)] hover:shadow-[0_0_30px_rgba(255,255,255,0.2)] transition-all flex items-center justify-center gap-3 mt-8 disabled:opacity-50 disabled:cursor-not-allowed hover:scale-[1.01] active:scale-[0.98]"
              data-testid="submit-button"
            >
              {loading ? (
                <div className="flex items-center justify-center gap-2">
                  <div className="spinner w-4 h-4 border-slate-950"></div>
                  {t(isLogin ? 'login.loading' : 'register.loading')}
                </div>
              ) : (
                <span className="text-sm tracking-widest uppercase">
                  {isLogin ? t('login.btnSignIn') : t('register.btnRegister')}
                </span>
              )}
            </button>
          </form>

          <div className="mt-8 text-center pt-6 border-t border-slate-800/50">
            {isLogin ? (
              <button
                onClick={() => setIsLogin(false)}
                className="text-slate-400 hover:text-white text-sm transition-colors"
                data-testid="toggle-auth-mode"
              >
                Don't have an account? Create one
              </button>
            ) : (
              <button
                onClick={() => setIsLogin(true)}
                className="text-slate-400 hover:text-white text-sm transition-colors"
                data-testid="toggle-auth-mode"
              >
                Already have an account? Sign in
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
