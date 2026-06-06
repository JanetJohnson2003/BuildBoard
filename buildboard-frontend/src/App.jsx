import React, { useEffect, Suspense, lazy } from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import Lenis from 'lenis';

import AppLayout from './components/layout/AppLayout';
import { useAuth } from './context/AuthContext';
import { CursorGlow } from './components/effects/CursorGlow';
import { HolographicLoader, AiChatWidget } from './components/ui';
import Landing from './pages/Landing';
import Login from './pages/Login';
import Register from './pages/Register';
import ForgotPassword from './pages/auth/ForgotPassword';
import ResetPassword from './pages/auth/ResetPassword';
import Dashboard from './pages/Dashboard';
import Explore from './pages/Explore';
import Organizations from './pages/Organizations';
import NewRepo from './pages/repo/NewRepo';
import RepoLayout from './components/layout/RepoLayout';
import Profile from './pages/Profile';
import UserIssues from './pages/UserIssues';
import UserPullRequests from './pages/UserPullRequests';
import UserNotifications from './pages/UserNotifications';

// Lazy loaded heavy pages
const RepositoryPage = lazy(() => import('./pages/RepositoryPage'));
const Admin = lazy(() => import('./pages/Admin'));
const ReviewerDashboard = lazy(() => import('./pages/ReviewerDashboard'));
const GodMode = lazy(() => import('./pages/GodMode'));
const Settings = lazy(() => import('./pages/Settings'));
const Notepad = lazy(() => import('./pages/Notepad'));
const RepoAnalytics = lazy(() => import('./pages/repo/RepoAnalytics'));
const RepoArchitecture = lazy(() => import('./pages/repo/RepoArchitecture'));
const RepoChat = lazy(() => import('./pages/repo/RepoChat'));

const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();
  const location = useLocation();
  
  if (loading) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-[var(--bg-main)]">
        <HolographicLoader text="AUTHENTICATING..." />
      </div>
    );
  }
  
  if (!user) return <Navigate to="/login" replace />;
  return (
    <>
      {children}
      {!location.pathname.startsWith('/notepad') && <AiChatWidget />}
    </>
  );
};

const App = () => {
  const location = useLocation();

  // Smooth scrolling setup
  useEffect(() => {
    const lenis = new Lenis({
      duration: 1.2,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      orientation: 'vertical',
      gestureOrientation: 'vertical',
      smoothWheel: true,
      wheelMultiplier: 1,
      smoothTouch: false,
      touchMultiplier: 2,
    });

    function raf(time) {
      lenis.raf(time);
      requestAnimationFrame(raf);
    }
    
    requestAnimationFrame(raf);
    
    return () => lenis.destroy();
  }, []);

  return (
    <>
      <CursorGlow />
      <Suspense fallback={
        <div className="flex h-screen w-full items-center justify-center bg-[var(--bg-main)]">
          <HolographicLoader />
        </div>
      }>
        <AnimatePresence mode="wait">
          <Routes location={location} key={location.pathname}>
            <Route path="/" element={<Landing />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/reset-password/:token" element={<ResetPassword />} />
            <Route
              path="/"
              element={
                <ProtectedRoute>
                  <AppLayout />
                </ProtectedRoute>
              }
            >
              <Route path="dashboard" element={<Dashboard />} />
              <Route path="new" element={<NewRepo />} />
              <Route path="explore" element={<Explore />} />
              <Route path="organizations" element={<Organizations />} />
              <Route path="admin" element={<Admin />} />
              <Route path="godmode" element={<GodMode />} />
              <Route path="reviewer" element={<ReviewerDashboard />} />
              <Route path="profile" element={<Profile />} />
              <Route path="settings" element={<Settings />} />
              <Route path="notepad" element={<Notepad />} />
              <Route path="issues" element={<UserIssues />} />
              <Route path="pulls" element={<UserPullRequests />} />
              <Route path="notifications" element={<UserNotifications />} />

              {/* Repo routes */}
              <Route path=":owner/:repo" element={<RepoLayout />}>
                <Route index element={<RepositoryPage />} />
                <Route path="analytics" element={<RepoAnalytics />} />
                <Route path="architecture" element={<RepoArchitecture />} />
                <Route path="chat" element={<RepoChat />} />
              </Route>
            </Route>
          </Routes>
        </AnimatePresence>
      </Suspense>
    </>
  );
};

export default App;
