import React, { createContext, useContext, useState, useEffect } from 'react';
import { auth as authApi } from '../lib/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser]       = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('sd_token');
    if (token) {
      authApi.me()
        .then(r => setUser(r.data))
        .catch(() => { localStorage.removeItem('sd_token'); localStorage.removeItem('sd_user'); })
        .finally(() => setLoading(false));
    } else setLoading(false);
  }, []);

  const login = async (email, password) => {
    const r = await authApi.login({ email, password });
    localStorage.setItem('sd_token', r.data.access_token);
    setUser(r.data.user);
    return r.data;
  };

  const register = async (data) => {
    const r = await authApi.register(data);
    localStorage.setItem('sd_token', r.data.access_token);
    setUser(r.data.user);
    return r.data;
  };

  const logout = () => {
    localStorage.removeItem('sd_token');
    localStorage.removeItem('sd_user');
    setUser(null);
  };

  const refreshUser = async () => {
    const r = await authApi.me();
    setUser(r.data);
    return r.data;
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
