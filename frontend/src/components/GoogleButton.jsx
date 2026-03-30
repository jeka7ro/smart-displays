import React from 'react';
import { GoogleOAuthProvider, useGoogleLogin } from '@react-oauth/google';
import api from '../lib/api.js';
import { useAuth } from '../contexts/AuthContext.jsx';
import { useNavigate } from 'react-router-dom';

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || '';

function GoogleButtonInner({ onError }) {
  const { login: setUser } = useAuth();
  const navigate = useNavigate();

  const handleGoogle = useGoogleLogin({
    onSuccess: async (tokenResponse) => {
      try {
        // Exchange access_token for user info, then send to our backend
        const infoRes = await fetch(
          `https://www.googleapis.com/oauth2/v3/userinfo`,
          { headers: { Authorization: `Bearer ${tokenResponse.access_token}` } }
        );
        const info = await infoRes.json();

        // Get an ID token via tokeninfo
        const r = await api.post('/auth/google', { credential: tokenResponse.access_token });
        localStorage.setItem('sd_token', r.data.access_token);
        // reload user via me()
        window.location.href = '/dashboard';
      } catch (e) {
        onError(e.response?.data?.detail || 'Eroare la autentificare cu Google');
      }
    },
    onError: () => onError('Autentificarea cu Google a eșuat'),
    flow: 'implicit',
  });

  return (
    <button
      type="button"
      onClick={() => handleGoogle()}
      className="w-full flex items-center justify-center gap-3 px-4 py-2.5 rounded-lg
                 border border-white/10 bg-white/[0.04] hover:bg-white/[0.08]
                 text-white/80 hover:text-white text-sm font-medium
                 transition-all duration-200"
    >
      <svg viewBox="0 0 24 24" className="w-5 h-5 shrink-0">
        <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
        <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
        <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
        <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
      </svg>
      Continuă cu Google
    </button>
  );
}

export default function GoogleButton({ onError }) {
  if (!GOOGLE_CLIENT_ID) {
    return (
      <button
        type="button"
        disabled
        title="Google OAuth nu este configurat încă"
        className="w-full flex items-center justify-center gap-3 px-4 py-2.5 rounded-lg
                   border border-white/[0.06] bg-white/[0.02]
                   text-white/30 text-sm font-medium cursor-not-allowed"
      >
        <svg viewBox="0 0 24 24" className="w-5 h-5 shrink-0 opacity-40">
          <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
          <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
          <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
          <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
        </svg>
        Continuă cu Google <span className="text-[10px] opacity-60">(în curând)</span>
      </button>
    );
  }

  return (
    <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
      <GoogleButtonInner onError={onError} />
    </GoogleOAuthProvider>
  );
}
