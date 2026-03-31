import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'sonner';
import { AuthProvider, useAuth } from './contexts/AuthContext.jsx';
import Layout from './components/Layout.jsx';

// Pages
import Login    from './pages/Login.jsx';
import Register from './pages/Register.jsx';
import Dashboard from './pages/Dashboard.jsx';
import Screens  from './pages/Screens.jsx';
import Content  from './pages/Content.jsx';
import Playlists from './pages/Playlists.jsx';
import Locations from './pages/Locations.jsx';
import Billing  from './pages/Billing.jsx';
import Onboarding from './pages/Onboarding.jsx';

function PrivateRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) return (
    <div className="min-h-screen bg-surface-900 flex items-center justify-center">
      <div className="w-8 h-8 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" />
    </div>
  );
  if (!user) return <Navigate to="/login" replace />;
  if (user && !user.is_onboarded && window.location.pathname !== '/onboarding') {
    return <Navigate to="/onboarding" replace />;
  }
  return children;
}

function PublicRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) return null;
  return user ? <Navigate to="/dashboard" replace /> : children;
}

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Toaster position="top-right" richColors theme="dark" />
        <Routes>
          {/* Public */}
          <Route path="/login"    element={<PublicRoute><Login /></PublicRoute>} />
          <Route path="/register" element={<PublicRoute><Register /></PublicRoute>} />

          {/* Protected */}
          <Route path="/onboarding" element={<PrivateRoute><Onboarding /></PrivateRoute>} />
          <Route path="/dashboard"  element={<PrivateRoute><Layout><Dashboard /></Layout></PrivateRoute>} />
          <Route path="/screens"    element={<PrivateRoute><Layout><Screens /></Layout></PrivateRoute>} />
          <Route path="/content"    element={<PrivateRoute><Layout><Content /></Layout></PrivateRoute>} />
          <Route path="/playlists"  element={<PrivateRoute><Layout><Playlists /></Layout></PrivateRoute>} />
          <Route path="/locations"  element={<PrivateRoute><Layout><Locations /></Layout></PrivateRoute>} />
          <Route path="/brands"     element={<PrivateRoute><Layout><Locations /></Layout></PrivateRoute>} />
          <Route path="/billing"    element={<PrivateRoute><Layout><Billing /></Layout></PrivateRoute>} />

          {/* Fallback */}
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
