import React, { useEffect, Suspense, lazy } from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import Lenis from 'lenis';

import AppLayout from './components/layout/AppLayout';
import { useAuth } from './context/AuthContext';
import { CursorGlow } from './components/effects/CursorGlow';
import { HolographicLoader } from './components/ui';
import Landing from './pages/Landing';
import Login from './pages/auth/Login';
import Register from './pages/auth/Register';
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
const RepoAnalytics = lazy(() => import('./pages/repo/RepoAnalytics'));
const RepoChat = lazy(() => import('./pages/repo/RepoChat'));

const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();
  
  if (loading) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-[var(--bg-main)]">
        <HolographicLoader text="AUTHENTICATING..." />
      </div>
    );
  }
  
  if (!user) return <Navigate to="/login" replace />;
  return children;
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
              <Route path="reviewer" element={<ReviewerDashboard />} />
              <Route path="profile" element={<Profile />} />
              <Route path="issues" element={<UserIssues />} />
              <Route path="pulls" element={<UserPullRequests />} />
              <Route path="notifications" element={<UserNotifications />} />

              {/* Repo routes */}
              <Route path=":owner/:repo" element={<RepoLayout />}>
                <Route index element={<RepositoryPage />} />
                <Route path="analytics" element={<RepoAnalytics />} />
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
