import React from 'react';
import './App.css';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { ProtectedRoute } from './components/ProtectedRoute';
import { Toaster } from './components/ui/sonner';

// Pages
import { Login } from './pages/Login';
import { Dashboard } from './pages/Dashboard';
import { Locations } from './pages/Locations';
import { Screens } from './pages/Screens';
import { ScreenDesigner } from './pages/ScreenDesigner';
import { Content } from './pages/Content';
import { Playlists } from './pages/Playlists';
import { ScreenSync } from './pages/ScreenSync';
import { DisplayScreen } from './pages/DisplayScreen';
import { Invitations } from './pages/Invitations';
import { Users } from './pages/Users';
import ActivityLogs from './pages/ActivityLogs';
import { LivePreviewDashboard } from './pages/LivePreviewDashboard';
import { ForgotPassword } from './pages/ForgotPassword';
import { ResetPassword } from './pages/ResetPassword';
import { ShortLinkRedirect } from './components/ShortLinkRedirect';
import { HappyHour } from './pages/HappyHour';
import { Billing } from './pages/Billing';
import { Subscription } from './pages/Subscription';

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Public routes */}
          <Route path="/login" element={<Login />} />
          <Route path="/s/:slug" element={<ShortLinkRedirect />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password" element={<ResetPassword />} />
          <Route path="/display/:slug" element={<DisplayScreen />} />
          <Route path="/tv/:slug" element={<DisplayScreen />} />

          {/* Protected routes */}
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/subscription"
            element={
              <ProtectedRoute>
                <Subscription />
              </ProtectedRoute>
            }
          />
          <Route
            path="/live-preview"
            element={
              <ProtectedRoute>
                <LivePreviewDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/locations"
            element={
              <ProtectedRoute>
                <Locations />
              </ProtectedRoute>
            }
          />
          <Route
            path="/screens"
            element={
              <ProtectedRoute>
                <Screens />
              </ProtectedRoute>
            }
          />
          <Route
            path="/screens/:screenId/design"
            element={
              <ProtectedRoute>
                <ScreenDesigner />
              </ProtectedRoute>
            }
          />
          <Route
            path="/content"
            element={
              <ProtectedRoute>
                <Content />
              </ProtectedRoute>
            }
          />
          <Route
            path="/playlists"
            element={
              <ProtectedRoute>
                <Playlists />
              </ProtectedRoute>
            }
          />
          <Route
            path="/happy-hour"
            element={
              <ProtectedRoute>
                <HappyHour />
              </ProtectedRoute>
            }
          />
          <Route
            path="/screen-sync"
            element={
              <ProtectedRoute>
                <ScreenSync />
              </ProtectedRoute>
            }
          />
          <Route
            path="/invitations"
            element={
              <ProtectedRoute>
                <Invitations />
              </ProtectedRoute>
            }
          />
          <Route
            path="/users"
            element={
              <ProtectedRoute>
                <Users />
              </ProtectedRoute>
            }
          />
          <Route
            path="/activity-logs"
            element={
              <ProtectedRoute>
                <ActivityLogs />
              </ProtectedRoute>
            }
          />
          <Route
            path="/billing"
            element={
              <ProtectedRoute>
                <Billing />
              </ProtectedRoute>
            }
          />

          {/* Redirect root to dashboard */}
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
        </Routes>
        <Toaster position="top-right" />
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
