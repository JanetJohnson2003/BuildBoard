import React, { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../context/AuthContext';
import api from '../lib/api';

const Admin = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [formData, setFormData] = useState({ username: '', name: '', email: '', password: '', role: 'reviewer' });
  const [errorMsg, setErrorMsg] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleCreateUser = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrorMsg('');
    try {
      await api.post('/admin/users', formData);
      setShowCreateModal(false);
      setFormData({ username: '', name: '', email: '', password: '', role: 'reviewer' });
      queryClient.invalidateQueries(['admin-users']);
      queryClient.invalidateQueries(['admin-analytics']);
    } catch (err) {
      setErrorMsg(err.response?.data?.message || 'Failed to create user');
    } finally {
      setIsSubmitting(false);
    }
  };
  const analytics = useQuery({
    queryKey: ['admin-analytics'],
    queryFn: async () => (await api.get('/analytics/admin')).data,
    enabled: user?.role === 'admin',
  });
  const users = useQuery({
    queryKey: ['admin-users'],
    queryFn: async () => (await api.get('/admin/users', { params: { limit: 8 } })).data,
    enabled: user?.role === 'admin',
  });

  if (user?.role !== 'admin') {
    return (
      <div className="panel mx-auto max-w-2xl p-8 text-center">
        <h1 className="text-xl font-semibold">Admin access required</h1>
        <p className="mt-2 text-sm text-[var(--text-muted)]">This area is reserved for platform administrators with audit, security, and feature flag permissions.</p>
      </div>
    );
  }

  if (analytics.isLoading) {
    return <div className="h-96 animate-pulse rounded-md bg-[var(--bg-subtle)]" />;
  }

  const stats = analytics.data?.stats || {};

  return (
    <div className="space-y-6">
      <div className="border-b border-[var(--border-main)] pb-4">
        <h1 className="text-2xl font-semibold">Admin panel</h1>
        <p className="mt-1 text-sm text-[var(--text-muted)]">Platform operations for users, repositories, organizations, analytics, audit logs, security monitoring, and feature flags.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-5">
        {Object.entries(stats).map(([key, value]) => (
          <div key={key} className="panel p-4">
            <div className="text-2xl font-semibold">{value}</div>
            <div className="mt-1 text-xs uppercase text-[var(--text-muted)]">{key.replace(/([A-Z])/g, ' $1')}</div>
          </div>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="panel overflow-hidden">
          <div className="panel-header font-semibold flex items-center justify-between">
            <span>Recent users</span>
            <button 
              className="btn-primary py-1 px-3 text-xs" 
              onClick={() => setShowCreateModal(true)}
            >
              + Create User
            </button>
          </div>
          <div className="divide-y divide-[var(--border-main)]">
            {(users.data?.users || []).map((item) => (
              <div key={item._id} className="flex items-center justify-between p-4">
                <div>
                  <div className="font-medium">{item.name}</div>
                  <div className="text-xs text-[var(--text-muted)]">{item.email} - {item.role}</div>
                </div>
                <span className="rounded-full border border-[var(--border-main)] px-2 py-0.5 text-xs">{item.isBanned ? 'banned' : 'active'}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="panel overflow-hidden">
          <div className="panel-header font-semibold">Audit activity</div>
          <div className="divide-y divide-[var(--border-main)]">
            {(analytics.data?.recentActivity || []).slice(0, 8).map((item) => (
              <div key={item._id} className="p-4">
                <div className="font-medium">{item.action}</div>
                <div className="text-xs text-[var(--text-muted)]">{item.user?.username || 'system'} - {item.repository?.name || 'platform'}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Create User Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="panel w-full max-w-md p-6 relative">
            <button 
              className="absolute top-4 right-4 text-[var(--text-muted)] hover:text-white"
              onClick={() => setShowCreateModal(false)}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
            </button>
            <h2 className="text-lg font-semibold mb-4">Create New User</h2>
            
            {errorMsg && (
              <div className="mb-4 text-sm text-[var(--brand-danger)] bg-[var(--brand-danger)]/10 p-2 rounded">
                {errorMsg}
              </div>
            )}

            <form onSubmit={handleCreateUser} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Username</label>
                <input 
                  className="input-field" 
                  value={formData.username} 
                  onChange={(e) => setFormData({...formData, username: e.target.value})} 
                  required 
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Full Name</label>
                <input 
                  className="input-field" 
                  value={formData.name} 
                  onChange={(e) => setFormData({...formData, name: e.target.value})} 
                  required 
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Email</label>
                <input 
                  type="email" 
                  className="input-field" 
                  value={formData.email} 
                  onChange={(e) => setFormData({...formData, email: e.target.value})} 
                  required 
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Password</label>
                <input 
                  type="password" 
                  className="input-field" 
                  value={formData.password} 
                  onChange={(e) => setFormData({...formData, password: e.target.value})} 
                  required 
                  minLength="6"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Role</label>
                <select 
                  className="input-field" 
                  value={formData.role} 
                  onChange={(e) => setFormData({...formData, role: e.target.value})}
                >
                  <option value="developer">Developer</option>
                  <option value="reviewer">Reviewer</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
              <button 
                type="submit" 
                className="btn-primary w-full mt-4" 
                disabled={isSubmitting}
              >
                {isSubmitting ? 'Creating...' : 'Create User'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Admin;
