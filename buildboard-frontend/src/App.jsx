import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import AppLayout from './components/layout/AppLayout';
import { useAuth } from './context/AuthContext';
import Login from './pages/auth/Login';
import Register from './pages/auth/Register';
import Dashboard from './pages/Dashboard';
import Explore from './pages/Explore';
import Organizations from './pages/Organizations';
import Admin from './pages/Admin';
import NewRepo from './pages/repo/NewRepo';
import RepoLayout from './components/layout/RepoLayout';
import RepositoryPage from './pages/RepositoryPage';
import Profile from './pages/Profile';
import UserIssues from './pages/UserIssues';
import UserPullRequests from './pages/UserPullRequests';
import UserNotifications from './pages/UserNotifications';
import ReviewerDashboard from './pages/ReviewerDashboard';

const ProtectedRoute = ({ children }) => {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  return children;
};

const App = () => {
  return (
    <Routes>
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
        <Route index element={<Dashboard />} />
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
        </Route>
      </Route>
    </Routes>
  );
};

export default App;
