import React, { useState } from 'react';
import { Navigate, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import api from '../lib/api';
import { GlassCard, NeonButton, CyberBadge, CyberSkeleton, CyberInput } from '../components/ui';
import { pageVariants } from '../utils/animations';
import {
  Crown, Eye, Power, Users, Trash2, Radio, Activity, ArrowUpCircle,
  Wifi, AlertOctagon, History, Fingerprint, Cpu, Zap, LogIn,
} from 'lucide-react';

const GodPanel = ({ title, icon: Icon, color, children, action }) => (
  <GlassCard className="p-4 border-t-2 flex flex-col h-full min-h-[200px]" style={{ borderTopColor: color }}>
    <div className="flex items-center justify-between mb-3">
      <h3 className="font-display font-bold text-xs flex items-center gap-2">
        <Icon size={16} style={{ color }} />
        {title}
      </h3>
      {action}
    </div>
    <div className="flex-1 text-xs font-mono overflow-y-auto cyber-scrollbar">{children}</div>
  </GlassCard>
);

const GodMode = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [log, setLog] = useState([]);
  const [targetUserId, setTargetUserId] = useState('');
  const [broadcast, setBroadcast] = useState({ title: '', message: '' });
  const [annihilate, setAnnihilate] = useState({ owner: '', repo: '' });
  const [genesis, setGenesis] = useState({ username: '', name: '', email: '', password: '', role: 'developer' });
  const [ascension, setAscension] = useState({ userId: '', role: 'reviewer' });
  const [override, setOverride] = useState({ userId: '', newPassword: '', role: '' });

  const addLog = (type, msg) => setLog((p) => [...p.slice(-20), { type, msg }]);

  const overview = useQuery({
    queryKey: ['god-overview'],
    queryFn: async () => (await api.get('/godmode/overview')).data,
    enabled: user?.role === 'admin',
  });

  const entropy = useQuery({
    queryKey: ['god-entropy'],
    queryFn: async () => (await api.get('/godmode/entropy-scan')).data,
    enabled: false,
  });

  const sessions = useQuery({
    queryKey: ['god-sessions'],
    queryFn: async () => (await api.get('/godmode/session-omniscience')).data,
    enabled: false,
  });

  const users = useQuery({
    queryKey: ['god-users-list'],
    queryFn: async () => (await api.get('/admin/users', { params: { limit: 50 } })).data,
    enabled: user?.role === 'admin',
  });

  const mutate = useMutation({
    mutationFn: async ({ method, url, data }) => {
      if (method === 'get') return (await api.get(url, { params: data })).data;
      return (await api.post(url, data)).data;
    },
    onSuccess: (data) => {
      addLog('success', data.message || 'God action complete');
      queryClient.invalidateQueries(['god-overview']);
      queryClient.invalidateQueries(['god-users-list']);
    },
    onError: (err) => addLog('error', err.response?.data?.message || 'Failed'),
  });

  if (user?.role !== 'admin') {
    return <Navigate to="/dashboard" replace />;
  }

  const userList = users.data?.users || [];

  const enterMirror = async (userId) => {
    try {
      const adminToken = localStorage.getItem('token');
      const adminRefresh = localStorage.getItem('refreshToken');
      const adminUser = localStorage.getItem('user');
      localStorage.setItem('god_backup_token', adminToken);
      localStorage.setItem('god_backup_refresh', adminRefresh);
      localStorage.setItem('god_backup_user', adminUser);

      const { data } = await api.post(`/godmode/mirror/${userId}`);
      localStorage.setItem('token', data.token);
      localStorage.setItem('refreshToken', data.refreshToken);
      localStorage.setItem('user', JSON.stringify(data.user));
      addLog('success', `Mirroring @${data.user.username} — reload to apply`);
      window.location.href = '/dashboard';
    } catch (err) {
      addLog('error', err.response?.data?.message || 'Mirror failed');
    }
  };

  return (
    <motion.div variants={pageVariants} initial="initial" animate="animate" className="max-w-7xl mx-auto py-8 px-4 space-y-6">
      <div className="border-b border-[var(--glass-border)] pb-6">
        <h1 className="text-3xl font-display font-bold flex items-center gap-3 text-white">
          <Crown className="text-[var(--brand-danger)]" size={32} />
          GOD_MODE
        </h1>
        <p className="text-sm font-mono text-[var(--text-muted)] mt-2">
          Administrator-only omnipotence. Full control over all users, reviewers, sessions, and platform state.
        </p>
        <div className="flex flex-wrap gap-2 mt-4">
          <Link to="/reviewer"><NeonButton variant="ghost" className="text-xs py-1 px-2"><Cpu size={14} /> Reviewer Terminal</NeonButton></Link>
          <Link to="/admin"><NeonButton variant="ghost" className="text-xs py-1 px-2"><Users size={14} /> Admin Panel</NeonButton></Link>
        </div>
      </div>

      {overview.data && (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
          {Object.entries(overview.data.stats || {}).map(([k, v]) => (
            <div key={k} className="p-3 rounded border border-[var(--brand-danger)]/30 bg-black/40 text-center">
              <div className="text-xl font-bold text-[var(--brand-danger)]">{v}</div>
              <div className="text-[10px] text-[var(--text-muted)] uppercase">{k}</div>
            </div>
          ))}
        </div>
      )}

      <GlassCard className="p-3 border border-[var(--brand-danger)]/40">
        <label className="text-[10px] font-mono text-[var(--text-muted)] uppercase">God Target User</label>
        <select
          className="w-full mt-1 bg-[var(--bg-tertiary)] border border-[var(--glass-border)] rounded-lg p-2 text-sm font-mono text-white"
          value={targetUserId}
          onChange={(e) => {
            setTargetUserId(e.target.value);
            setAscension((a) => ({ ...a, userId: e.target.value }));
            setOverride((o) => ({ ...o, userId: e.target.value }));
          }}
        >
          <option value="">Select operative...</option>
          {userList.map((u) => (
            <option key={u._id} value={u._id}>
              @{u.username} ({u.role}) {u.isBanned ? '[BANNED]' : ''} {u.loginLocked ? '[LOCKED]' : ''}
            </option>
          ))}
        </select>
      </GlassCard>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        <GodPanel title="1. USER MIRROR" icon={Eye} color="var(--brand-primary)" action={
          <NeonButton variant="ghost" className="text-[10px] py-0.5" disabled={!targetUserId} onClick={() => enterMirror(targetUserId)}>
            <LogIn size={12} /> ENTER AS USER
          </NeonButton>
        }>
          <p className="text-[var(--text-muted)]">Assume any identity. Admin session backed up as god_backup_*.</p>
        </GodPanel>

        <GodPanel title="2. KILL SWITCH" icon={Power} color="var(--brand-danger)" action={
          <div className="flex gap-1">
            <NeonButton variant="ghost" className="text-[10px]" onClick={() => mutate.mutate({ url: '/godmode/kill-switch', data: { enabled: true } })}>ON</NeonButton>
            <NeonButton variant="ghost" className="text-[10px]" onClick={() => mutate.mutate({ url: '/godmode/kill-switch', data: { enabled: false } })}>OFF</NeonButton>
          </div>
        }>
          <p className="text-[var(--text-muted)]">Blocks all non-admin logins platform-wide.</p>
          {overview.data?.platform?.loginLockdown && <CyberBadge variant="danger">LOCKDOWN ACTIVE</CyberBadge>}
        </GodPanel>

        <GodPanel title="3. MASS ROLE ASSIGN" icon={Users} color="var(--brand-purple)" action={
          <NeonButton variant="ghost" className="text-[10px]" disabled={!targetUserId || !ascension.role} onClick={() =>
            mutate.mutate({ url: '/godmode/mass-role-assign', data: { assignments: [{ userId: targetUserId, role: ascension.role }] } })
          }>ASSIGN</NeonButton>
        }>
          <select className="w-full mt-2 bg-black/40 border rounded p-1 text-xs" value={ascension.role} onChange={(e) => setAscension({ ...ascension, role: e.target.value })}>
            <option value="developer">developer</option>
            <option value="reviewer">reviewer</option>
            <option value="admin">admin</option>
          </select>
        </GodPanel>

        <GodPanel title="4. REPO ANNIHILATION" icon={Trash2} color="var(--brand-danger)" action={
          <NeonButton variant="ghost" className="text-[10px]" onClick={() => mutate.mutate({ url: '/godmode/repo-annihilation', data: annihilate })}>DESTROY</NeonButton>
        }>
          <CyberInput placeholder="owner" value={annihilate.owner} onChange={(e) => setAnnihilate({ ...annihilate, owner: e.target.value })} className="mb-1 text-xs" />
          <CyberInput placeholder="repo slug" value={annihilate.repo} onChange={(e) => setAnnihilate({ ...annihilate, repo: e.target.value })} className="text-xs" />
        </GodPanel>

        <GodPanel title="5. OMNICHANNEL BROADCAST" icon={Radio} color="var(--brand-warning)" action={
          <NeonButton variant="ghost" className="text-[10px]" onClick={() => mutate.mutate({ url: '/godmode/broadcast', data: broadcast })}>SEND</NeonButton>
        }>
          <CyberInput placeholder="Title" value={broadcast.title} onChange={(e) => setBroadcast({ ...broadcast, title: e.target.value })} className="mb-1 text-xs" />
          <textarea className="w-full bg-black/40 border rounded p-2 text-xs min-h-[60px]" placeholder="Message" value={broadcast.message} onChange={(e) => setBroadcast({ ...broadcast, message: e.target.value })} />
        </GodPanel>

        <GodPanel title="6. ENTROPY SCAN" icon={Activity} color="var(--brand-success)" action={
          <NeonButton variant="ghost" className="text-[10px]" onClick={() => { entropy.refetch(); addLog('system', 'Entropy scan...'); }}>SCAN</NeonButton>
        }>
          {entropy.data ? (
            <div>
              <div className="text-white">Score: {entropy.data.entropyScore} ({entropy.data.stability})</div>
              <div className="text-[var(--text-muted)]">Commits 24h: {entropy.data.commits24h}</div>
            </div>
          ) : <span className="text-[var(--text-muted)]">Platform health & chaos index.</span>}
        </GodPanel>

        <GodPanel title="7. ASCENSION PROTOCOL" icon={ArrowUpCircle} color="var(--brand-primary)" action={
          <NeonButton variant="ghost" className="text-[10px]" disabled={!targetUserId} onClick={() => mutate.mutate({ url: '/godmode/ascension', data: { userId: targetUserId, role: ascension.role, grantGodClearance: true } })}>ASCEND</NeonButton>
        }>
          Promote anyone to admin/reviewer/developer with full clearance restore.
        </GodPanel>

        <GodPanel title="8. SESSION OMNISCIENCE" icon={Wifi} color="var(--brand-purple)" action={
          <NeonButton variant="ghost" className="text-[10px]" onClick={() => sessions.refetch()}>REVEAL</NeonButton>
        }>
          {sessions.data?.sessions?.slice(0, 5).map((s) => (
            <div key={s._id} className="py-0.5 text-white">@{s.username} <span className="text-[var(--text-muted)]">{s.role}</span></div>
          )) || <span className="text-[var(--text-muted)]">All active JWT sessions.</span>}
          {sessions.data && <div className="mt-1 text-[var(--brand-primary)]">Active: {sessions.data.activeCount}</div>}
        </GodPanel>

        <GodPanel title="9. EMERGENCY LOCKDOWN" icon={AlertOctagon} color="var(--brand-danger)" action={
          <NeonButton variant="ghost" className="text-[10px] border-[var(--brand-danger)]" onClick={() => {
            if (window.confirm('LOCK ALL non-admin users and purge sessions?')) {
              mutate.mutate({ url: '/godmode/emergency-lockdown', data: {} });
            }
          }}>EXECUTE</NeonButton>
        }>
          Lock every non-admin + kill switch + session purge in one strike.
        </GodPanel>

        <GodPanel title="10. TIMELINE SOVEREIGNTY" icon={History} color="var(--brand-warning)" action={
          <div className="flex gap-1">
            <NeonButton variant="ghost" className="text-[10px]" onClick={() => mutate.mutate({ method: 'get', url: '/godmode/timeline-sovereignty', data: { action: 'export', limit: 100 } })}>EXPORT</NeonButton>
            <NeonButton variant="ghost" className="text-[10px]" onClick={() => {
              if (window.confirm('Purge logs older than 90 days?')) {
                mutate.mutate({ method: 'get', url: '/godmode/timeline-sovereignty', data: { action: 'purge', olderThanDays: 90 } });
              }
            }}>PURGE</NeonButton>
          </div>
        }>
          Export or purge platform activity logs.
        </GodPanel>
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        <GlassCard className="p-4 border-t-2 border-t-[var(--brand-danger)]">
          <h3 className="font-display font-bold text-sm flex items-center gap-2 mb-3">
            <Fingerprint size={16} className="text-[var(--brand-danger)]" />
            GOD IDENTITY OVERRIDE
          </h3>
          <p className="text-[10px] text-[var(--text-muted)] mb-3">Full control over ANY user including reviewers (admin-only).</p>
          <div className="space-y-2">
            <CyberInput type="password" placeholder="New password (optional)" value={override.newPassword} onChange={(e) => setOverride({ ...override, newPassword: e.target.value })} className="text-xs" />
            <select className="w-full bg-black/40 border rounded p-2 text-xs" value={override.role} onChange={(e) => setOverride({ ...override, role: e.target.value })}>
              <option value="">Keep role</option>
              <option value="developer">developer</option>
              <option value="reviewer">reviewer</option>
              <option value="admin">admin</option>
            </select>
            <div className="flex flex-wrap gap-2">
              <NeonButton variant="ghost" className="text-[10px]" disabled={!targetUserId} onClick={() => mutate.mutate({ url: '/godmode/identity-override', data: { userId: targetUserId, loginLocked: true } })}>LOCK</NeonButton>
              <NeonButton variant="ghost" className="text-[10px]" disabled={!targetUserId} onClick={() => mutate.mutate({ url: '/godmode/identity-override', data: { userId: targetUserId, loginLocked: false } })}>UNLOCK</NeonButton>
              <NeonButton variant="ghost" className="text-[10px]" disabled={!targetUserId} onClick={() => mutate.mutate({ url: '/godmode/identity-override', data: { userId: targetUserId, isBanned: true } })}>BAN</NeonButton>
              <NeonButton variant="ghost" className="text-[10px]" disabled={!targetUserId} onClick={() => mutate.mutate({ url: '/godmode/identity-override', data: { userId: targetUserId, isBanned: false } })}>UNBAN</NeonButton>
              <NeonButton variant="primary" className="text-[10px]" disabled={!targetUserId || override.newPassword.length < 6} onClick={() => mutate.mutate({ url: '/godmode/identity-override', data: { userId: targetUserId, newPassword: override.newPassword, role: override.role || undefined } })}>REWRITE</NeonButton>
            </div>
          </div>
        </GlassCard>

        <GlassCard className="p-4 border-t-2 border-t-[var(--brand-primary)]">
          <h3 className="font-display font-bold text-sm flex items-center gap-2 mb-3">
            <Zap size={16} /> USER GENESIS
          </h3>
          <div className="grid grid-cols-2 gap-2">
            <CyberInput placeholder="username" value={genesis.username} onChange={(e) => setGenesis({ ...genesis, username: e.target.value })} className="text-xs" />
            <CyberInput placeholder="name" value={genesis.name} onChange={(e) => setGenesis({ ...genesis, name: e.target.value })} className="text-xs" />
            <CyberInput placeholder="email" value={genesis.email} onChange={(e) => setGenesis({ ...genesis, email: e.target.value })} className="text-xs" />
            <CyberInput type="password" placeholder="password" value={genesis.password} onChange={(e) => setGenesis({ ...genesis, password: e.target.value })} className="text-xs" />
          </div>
          <select className="w-full mt-2 bg-black/40 border rounded p-2 text-xs" value={genesis.role} onChange={(e) => setGenesis({ ...genesis, role: e.target.value })}>
            <option value="developer">developer</option>
            <option value="reviewer">reviewer</option>
            <option value="admin">admin</option>
          </select>
          <NeonButton variant="primary" className="w-full mt-3 text-xs" onClick={() => mutate.mutate({ url: '/godmode/user-genesis', data: genesis })}>CREATE BEING</NeonButton>
        </GlassCard>
      </div>

      <GlassCard className="p-4 max-h-40 overflow-y-auto cyber-scrollbar font-mono text-xs">
        {log.map((l, i) => (
          <div key={i} className={l.type === 'error' ? 'text-[var(--brand-danger)]' : l.type === 'success' ? 'text-[var(--brand-success)]' : 'text-[var(--text-muted)]'}>
            [{l.type}] {l.msg}
          </div>
        ))}
      </GlassCard>
    </motion.div>
  );
};

export default GodMode;
