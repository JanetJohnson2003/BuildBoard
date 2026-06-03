import React, { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import api from '../lib/api';
import { GlassCard, NeonButton, CyberInput, CyberBadge, CyberModal, CyberSkeleton } from '../components/ui';
import { pageVariants, listVariants, itemVariants } from '../utils/animations';
import { Link } from 'react-router-dom';
import { ShieldAlert, Users, Activity, Shield, Plus, ShieldCheck, UserPlus, Server, ActivitySquare, Crown } from 'lucide-react';

const Admin = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [formData, setFormData] = useState({ username: '', name: '', email: '', password: '', role: 'reviewer' });
  const [errorMsg, setErrorMsg] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Broadcast state
  const [broadcastMsg, setBroadcastMsg] = useState('');
  const [broadcastSeverity, setBroadcastSeverity] = useState('info');
  const [isBroadcasting, setIsBroadcasting] = useState(false);

  const handleBroadcast = async (e) => {
    e.preventDefault();
    if (!broadcastMsg.trim()) return;
    setIsBroadcasting(true);
    try {
      await api.post('/admin/broadcast', { message: broadcastMsg, severity: broadcastSeverity });
      setBroadcastMsg('');
    } catch (err) {
      console.error('Failed to transmit broadcast', err);
    } finally {
      setIsBroadcasting(false);
    }
  };

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
      setErrorMsg(err.response?.data?.message || 'Failed to initialize operative');
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
      <div className="flex items-center justify-center min-h-[60vh] p-8">
        <GlassCard glowColor="var(--brand-danger)" className="p-12 text-center max-w-md border-[var(--brand-danger)]/50 bg-[var(--brand-danger)]/5">
          <ShieldAlert size={48} className="text-[var(--brand-danger)] mx-auto mb-4" />
          <h2 className="text-xl font-display font-bold text-white mb-2">RESTRICTED_AREA</h2>
          <p className="text-sm font-mono text-[var(--text-muted)] mb-6">
            Level 5 authorization required. This sector is reserved for platform administrators with audit, security, and overriding permissions.
          </p>
        </GlassCard>
      </div>
    );
  }

  const stats = analytics.data?.stats || {};

  return (
    <motion.div 
      variants={pageVariants}
      initial="initial"
      animate="animate"
      exit="exit"
      className="max-w-7xl mx-auto py-8 px-4 space-y-8"
    >
      <div className="border-b border-[var(--glass-border)] pb-6 mb-8">
        <h1 className="text-3xl font-display font-bold flex items-center gap-3 text-white">
          <ShieldCheck className="text-[var(--brand-danger)]" size={32} />
          ADMINISTRATIVE_COMMAND
        </h1>
        <p className="text-sm font-mono text-[var(--text-muted)] mt-2">
          Global platform operations for personnel, sectors, syndicates, and telemetry monitoring.
        </p>
        <Link to="/godmode" className="inline-block mt-4">
          <NeonButton variant="primary" className="text-xs flex items-center gap-2 border-[var(--brand-danger)] bg-[var(--brand-danger)]/10 text-[var(--brand-danger)] hover:bg-[var(--brand-danger)]/20">
            <Crown size={14} /> ENTER_GOD_MODE
          </NeonButton>
        </Link>
      </div>

      {analytics.isLoading ? (
        <div className="grid gap-4 md:grid-cols-3 lg:grid-cols-5">
          {[1, 2, 3, 4, 5].map((i) => <CyberSkeleton key={i} className="h-28 rounded-lg" />)}
        </div>
      ) : (
        <motion.div variants={listVariants} initial="hidden" animate="visible" className="grid gap-4 md:grid-cols-3 lg:grid-cols-5">
          {Object.entries(stats).map(([key, value]) => (
            <motion.div key={key} variants={itemVariants}>
              <GlassCard className="p-5 flex flex-col justify-center items-center text-center group hover:border-[var(--brand-danger)]/50 transition-colors">
                <div className="text-3xl font-display font-bold text-white group-hover:text-[var(--brand-danger)] transition-colors">
                  {value}
                </div>
                <div className="mt-2 text-[10px] font-mono uppercase tracking-widest text-[var(--text-muted)]">
                  {key.replace(/([A-Z])/g, ' $1').trim()}
                </div>
              </GlassCard>
            </motion.div>
          ))}
        </motion.div>
      )}

      <div className="grid gap-6 lg:grid-cols-2">
        
        {/* Users Panel */}
        <GlassCard className="p-0 overflow-hidden border-t-2 border-t-[var(--brand-primary)] flex flex-col h-[500px]">
          <div className="p-5 border-b border-[var(--glass-border)] flex items-center justify-between bg-black/40">
            <h2 className="text-sm font-mono uppercase tracking-widest text-[var(--brand-primary)] flex items-center gap-2">
              <Users size={16} /> OPERATIVE_REGISTRY
            </h2>
            <NeonButton 
              variant="primary" 
              size="sm"
              onClick={() => setShowCreateModal(true)}
              className="py-1 px-3 text-xs flex items-center gap-1"
            >
              <UserPlus size={14} /> INITIALIZE_USER
            </NeonButton>
          </div>
          
          <div className="overflow-y-auto flex-1">
            {users.isLoading ? (
              <div className="p-4 space-y-3">
                {[1, 2, 3, 4].map((i) => <CyberSkeleton key={i} className="h-16 rounded-md" />)}
              </div>
            ) : (
              <div className="divide-y divide-[var(--glass-border)]">
                {(users.data?.users || []).map((item) => (
                  <div key={item._id} className="p-4 flex items-center justify-between hover:bg-[var(--bg-tertiary)]/50 transition-colors">
                    <div>
                      <div className="font-display font-bold text-white text-sm mb-1">{item.name}</div>
                      <div className="text-xs font-mono text-[var(--text-muted)] flex items-center gap-2">
                        <span>{item.email}</span>
                        <span className="text-[var(--glass-border)]">|</span>
                        <span className={item.role === 'admin' ? 'text-[var(--brand-danger)]' : 'text-[var(--brand-primary)]'}>
                          {item.role.toUpperCase()}
                        </span>
                      </div>
                    </div>
                    <CyberBadge 
                      variant={item.isBanned ? 'danger' : 'success'} 
                      size="sm"
                    >
                      {item.isBanned ? 'RESTRICTED' : 'ACTIVE'}
                    </CyberBadge>
                  </div>
                ))}
              </div>
            )}
          </div>
        </GlassCard>

        {/* Audit Panel */}
        <GlassCard className="p-0 overflow-hidden border-t-2 border-t-[var(--brand-warning)] flex flex-col h-[500px]">
          <div className="p-5 border-b border-[var(--glass-border)] bg-black/40">
            <h2 className="text-sm font-mono uppercase tracking-widest text-[var(--brand-warning)] flex items-center gap-2">
              <ActivitySquare size={16} /> AUDIT_TELEMETRY
            </h2>
          </div>
          
          <div className="overflow-y-auto flex-1">
            {analytics.isLoading ? (
              <div className="p-4 space-y-3">
                {[1, 2, 3, 4].map((i) => <CyberSkeleton key={i} className="h-16 rounded-md" />)}
              </div>
            ) : (
              <div className="divide-y divide-[var(--glass-border)]">
                {(analytics.data?.recentActivity || []).slice(0, 10).map((item) => (
                  <div key={item._id} className="p-4 hover:bg-[var(--bg-tertiary)]/50 transition-colors">
                    <div className="font-mono text-sm text-[var(--text-main)] mb-1.5 flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-[var(--brand-warning)] shadow-[0_0_8px_var(--brand-warning)]" />
                      {item.action}
                    </div>
                    <div className="text-xs font-mono text-[var(--text-muted)] flex flex-wrap gap-2 items-center">
                      <span className="bg-black/40 px-1.5 py-0.5 rounded border border-[var(--glass-border)] text-white">
                        {item.user?.username || 'SYSTEM'}
                      </span>
                      <span>@</span>
                      <span className="text-[var(--brand-primary)]">
                        {item.repository?.name || 'GLOBAL_PLATFORM'}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </GlassCard>
      </div>

      {/* BROADCAST HUB */}
      <GlassCard className="p-0 overflow-hidden border-t-2 border-t-[var(--brand-danger)]">
        <div className="p-5 border-b border-[var(--glass-border)] bg-black/40">
          <h2 className="text-sm font-mono uppercase tracking-widest text-[var(--brand-danger)] flex items-center gap-2">
            <ShieldAlert size={16} /> SYSTEM_BROADCAST_HUB
          </h2>
          <p className="text-xs text-[var(--text-muted)] mt-2">Transmit a global holographic overlay to all active operatives.</p>
        </div>
        <div className="p-6">
          <form onSubmit={handleBroadcast} className="flex gap-4 items-end flex-col sm:flex-row">
            <div className="flex-1 w-full">
              <label className="block text-[10px] text-[var(--text-muted)] uppercase mb-2">Transmission Payload (Message)</label>
              <CyberInput 
                value={broadcastMsg}
                onChange={(e) => setBroadcastMsg(e.target.value)}
                placeholder="Enter emergency broadcast message..."
                required
              />
            </div>
            <div className="w-full sm:w-48">
              <label className="block text-[10px] text-[var(--text-muted)] uppercase mb-2">Severity Level</label>
              <select 
                className="w-full bg-[var(--bg-tertiary)] border border-[var(--glass-border)] rounded-lg p-3 text-sm text-white focus:border-[var(--brand-danger)] focus:ring-1 focus:ring-[var(--brand-danger)]/50 outline-none transition-all appearance-none cursor-pointer"
                value={broadcastSeverity} 
                onChange={(e) => setBroadcastSeverity(e.target.value)}
              >
                <option value="info">INFO (Blue)</option>
                <option value="warning">WARNING (Yellow)</option>
                <option value="critical">CRITICAL (Red)</option>
              </select>
            </div>
            <NeonButton 
              type="submit" 
              variant="primary" 
              className="w-full sm:w-auto px-8 border-[var(--brand-danger)] bg-[var(--brand-danger)]/10 text-[var(--brand-danger)] hover:bg-[var(--brand-danger)]/20"
              disabled={isBroadcasting || !broadcastMsg.trim()}
            >
              {isBroadcasting ? 'TRANSMITTING...' : 'TRANSMIT'}
            </NeonButton>
          </form>
        </div>
      </GlassCard>

      {/* Create User Modal */}
      <AnimatePresence>
        {showCreateModal && (
          <CyberModal
            title="INITIALIZE_OPERATIVE"
            onClose={() => setShowCreateModal(false)}
            icon={<UserPlus className="text-[var(--brand-primary)]" />}
          >
            <form onSubmit={handleCreateUser} className="space-y-4 font-mono">
              {errorMsg && (
                <div className="p-3 bg-[var(--brand-danger)]/10 border border-[var(--brand-danger)]/50 rounded-lg text-xs text-[var(--brand-danger)] flex items-start gap-2">
                  <ShieldAlert size={14} className="shrink-0 mt-0.5" />
                  {errorMsg}
                </div>
              )}
              
              <div>
                <label className="block text-[10px] text-[var(--text-muted)] uppercase mb-2">Designation (Username)</label>
                <CyberInput 
                  value={formData.username} 
                  onChange={(e) => setFormData({...formData, username: e.target.value})} 
                  required 
                  autoFocus
                />
              </div>
              
              <div>
                <label className="block text-[10px] text-[var(--text-muted)] uppercase mb-2">Ident (Full Name)</label>
                <CyberInput 
                  value={formData.name} 
                  onChange={(e) => setFormData({...formData, name: e.target.value})} 
                  required 
                />
              </div>
              
              <div>
                <label className="block text-[10px] text-[var(--text-muted)] uppercase mb-2">Commlink (Email)</label>
                <CyberInput 
                  type="email" 
                  value={formData.email} 
                  onChange={(e) => setFormData({...formData, email: e.target.value})} 
                  required 
                />
              </div>
              
              <div>
                <label className="block text-[10px] text-[var(--text-muted)] uppercase mb-2">Passkey</label>
                <CyberInput 
                  type="password" 
                  value={formData.password} 
                  onChange={(e) => setFormData({...formData, password: e.target.value})} 
                  required 
                  minLength="6"
                />
              </div>
              
              <div>
                <label className="block text-[10px] text-[var(--text-muted)] uppercase mb-2">Clearance Level (Role)</label>
                <select 
                  className="w-full bg-[var(--bg-tertiary)] border border-[var(--glass-border)] rounded-lg p-3 text-sm text-white focus:border-[var(--brand-primary)] focus:ring-1 focus:ring-[var(--brand-primary)]/50 outline-none transition-all appearance-none cursor-pointer"
                  value={formData.role} 
                  onChange={(e) => setFormData({...formData, role: e.target.value})}
                >
                  <option value="developer">L1 - DEVELOPER</option>
                  <option value="reviewer">L2 - REVIEWER</option>
                  <option value="admin">L5 - ADMINISTRATOR</option>
                </select>
              </div>
              
              <div className="pt-4 flex gap-3">
                <button 
                  type="button"
                  className="flex-1 py-2.5 rounded-lg border border-[var(--glass-border)] hover:bg-white/5 text-[var(--text-muted)] hover:text-white transition-colors text-sm uppercase tracking-wider"
                  onClick={() => setShowCreateModal(false)}
                >
                  ABORT
                </button>
                <NeonButton 
                  type="submit" 
                  variant="primary" 
                  className="flex-1"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? 'PROCESSING...' : 'INITIALIZE'}
                </NeonButton>
              </div>
            </form>
          </CyberModal>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default Admin;
