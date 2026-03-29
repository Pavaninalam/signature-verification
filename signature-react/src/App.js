/**
 * App.js
 * Root component — defines all client-side routes.
 *
 * Flow:
 *   1. SplashScreen is shown first (showSplash = true)
 *   2. User clicks "Verify Signature" → showSplash = false
 *   3. Main app (BrowserRouter + Routes) becomes visible
 */
import React, { useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';

// Splash screen (shown before the app)
import SplashScreen from './pages/SplashScreen';

// Public pages
import Landing        from './pages/Landing';
import Login          from './pages/Login';
import Register       from './pages/Register';
import ForgotPassword from './pages/ForgotPassword';

// User pages (protected)
import UserHome from './pages/user/UserHome';
import Predict  from './pages/user/Predict';
import Train    from './pages/user/Train';

// Admin pages
import AdminLogin  from './pages/admin/AdminLogin';
import AdminHome   from './pages/admin/AdminHome';
import ManageUsers from './pages/admin/ManageUsers';

// ── Route guards ──────────────────────────────────────────────────────────────
function UserRoute({ children }) {
  return localStorage.getItem('token')
    ? children
    : <Navigate to="/login" replace />;
}

function AdminRoute({ children }) {
  return localStorage.getItem('adminToken')
    ? children
    : <Navigate to="/admin/login" replace />;
}

// ── Main App ──────────────────────────────────────────────────────────────────
export default function App() {
  // true  → show full-screen splash
  // false → show the actual application
  const [showSplash, setShowSplash] = useState(true);

  return (
    <>
      {/* Splash is rendered on top via position:fixed — always in DOM during
          the fade-out transition, then replaced by the app below */}
      {showSplash && (
        <SplashScreen onEnter={() => setShowSplash(false)} />
      )}

      {/* Main app — rendered underneath; becomes visible after splash fades */}
      <BrowserRouter>
        <Routes>
          {/* Public */}
          <Route path="/"                element={<Landing />} />
          <Route path="/login"           element={<Login />} />
          <Route path="/register"        element={<Register />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />

          {/* User (protected) */}
          <Route path="/user/home"    element={<UserRoute><UserHome /></UserRoute>} />
          <Route path="/user/predict" element={<UserRoute><Predict /></UserRoute>} />
          <Route path="/user/train"   element={<UserRoute><Train /></UserRoute>} />

          {/* Admin */}
          <Route path="/admin/login"  element={<AdminLogin />} />
          <Route path="/admin/home"   element={<AdminRoute><AdminHome /></AdminRoute>} />
          <Route path="/admin/users"  element={<AdminRoute><ManageUsers /></AdminRoute>} />

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </>
  );
}
