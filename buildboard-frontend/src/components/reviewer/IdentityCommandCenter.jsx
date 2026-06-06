import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../lib/api';
import { GlassCard, NeonButton, CyberBadge, CyberSkeleton, CyberInput } from '../ui';
import {
  Fingerprint, Radio, Ghost, Zap, KeyRound, Lock, Unlock, LogOut, Ban, Search,
} from 'lucide-react';

const FeaturePanel = ({ title, icon: Icon, color, children, onRun, running, runLabel = 'SCAN' }) => (
  <GlassCard className="p-4 border-t-2 flex flex-col" style={{ borderTopColor: color }}>
    <div className="flex items-center justify-between mb-3">
      <h4 className="font-display font-bold text-xs flex items-center gap-2">
        <Icon size={16} style={{ color }} />
        {title}
      </h4>
      {onRun && (
        <NeonButton variant="ghost" className="text-[10px] py-0.5 px-2" onClick={onRun} disabled={running}>
          {running ? '...' : runLabel}
        </NeonButton>
      )}
    </div>
    <div className="text-xs font-mono max-h-40 overflow-y-auto cyber-scrollbar">{children}</div>
  </GlassCard>
);

export const IdentityCommandCenter = ({ addLog }) => {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [selectedUserId, setSelectedUserId] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [quarantineHours, setQuarantineHours] = useState('24');
  const [lockReason, setLockReason] = useState('');

  const commandQuery = useQuery({
    queryKey: ['login-command', search, statusFilter],
    queryFn: async () =>
      (await api.get('/overseer/login-command', { params: { search, status: statusFilter } })).data,
  });

  const telemetryQuery = useQuery({
    queryKey: ['login-telemetry'],
    queryFn: async () => (await api.get('/overseer/login-telemetry')).data,
    enabled: false,
  });

  const ghostQuery = useQuery({
    queryKey: ['ghost-logins'],
    queryFn: async () => (await api.get('/overseer/ghost-logins')).data,
    enabled: false,
  });

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ['login-command'] });
  };

  const actionMutation = useMutation({
    mutationFn: async ({ method, url, body }) => {
      const config = { method, url, ...(body ? { data: body } : {}) };
      if (method === 'post') return (await api.post(url, body)).data;
      return (await api.get(url)).data;
    },
    onSuccess: (data) => {
      addLog?.('success', data.message || 'Action complete');
      invalidate();
      setNewPassword('');
    },
    onError: (err) => addLog?.('error', err.response?.data?.message || 'Action failed'),
  });

  const selectedUser = commandQuery.data?.users?.find((u) => u._id === selectedUserId);

  const runScan = (refetch, label) => {
    addLog?.('system', `Running ${label}...`);
    refetch().then(() => addLog?.('success', `${label} complete`));
  };

  return (
    <div className="p-4 space-y-4 overflow-y-auto cyber-scrollbar flex-1">
      <div className="flex items-center gap-2 text-xs font-mono text-[var(--brand-danger)] border border-[var(--brand-danger)]/30 rounded-lg px-3 py-2 bg-[var(--brand-danger)]/5">
        <Fingerprint size={14} />
        IDENTITY COMMAND — FULL LOGIN CONTROL (REVIEWER & ADMIN ONLY)
      </div>

      {commandQuery.data?.stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-center">
          {[
            ['TOTAL', commandQuery.data.stats.total, 'var(--brand-primary)'],
            ['LOCKED', commandQuery.data.stats.locked, 'var(--brand-warning)'],
            ['BANNED', commandQuery.data.stats.banned, 'var(--brand-danger)'],
            ['SESSIONS', commandQuery.data.stats.activeSessions, 'var(--brand-purple)'],
          ].map(([label, val, color]) => (
            <div key={label} className="p-2 rounded border border-[var(--glass-border)] bg-black/30">
              <div className="text-lg font-bold" style={{ color: `var(${color})` }}>{val}</div>
              <div className="text-[10px] text-[var(--text-muted)]">{label}</div>
            </div>
          ))}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <FeaturePanel
          title="LOGIN TELEMETRY GRID"
          icon={Radio}
          color="var(--brand-primary)"
          onRun={() => runScan(telemetryQuery.refetch, 'Telemetry Grid')}
          running={telemetryQuery.isFetching}
        >
          {telemetryQuery.data?.events?.slice(0, 6).map((e) => (
            <div key={e.id} className="py-1 border-b border-[var(--glass-border)]/50">
              <span className="text-white">@{e.username}</span>
              <span className="text-[var(--text-muted)]"> · {e.ip}</span>
              <CyberBadge variant={e.success ? 'success' : 'danger'} size="sm" className="ml-1">
                {e.accountStatus}
              </CyberBadge>
            </div>
          )) || <span className="text-[var(--text-muted)]">Live sign-in stream across the platform.</span>}
        </FeaturePanel>

        <FeaturePanel
          title="GHOST LOGIN DETECTOR"
          icon={Ghost}
          color="var(--brand-danger)"
          onRun={() => runScan(ghostQuery.refetch, 'Ghost Detector')}
          running={ghostQuery.isFetching}
        >
          {ghostQuery.data?.ghosts?.length ? ghostQuery.data.ghosts.slice(0, 5).map((g) => (
            <button
              key={g.userId}
              type="button"
              className="block w-full text-left py-1 hover:text-white"
              onClick={() => setSelectedUserId(g.userId)}
            >
              @{g.username} — <span className="text-[var(--brand-danger)]">{g.threat}</span>
            </button>
          )) : (
            <span className="text-[var(--text-muted)]">Detects IP hopping & credential spray.</span>
          )}
        </FeaturePanel>

        <FeaturePanel
          title="SESSION PURGE BEAM"
          icon={Zap}
          color="var(--brand-warning)"
        >
          <p className="text-[var(--text-muted)] mb-2">Terminate JWT sessions instantly.</p>
          <NeonButton
            variant="ghost"
            className="text-[10px] w-full mb-1"
            disabled={!selectedUserId || actionMutation.isPending}
            onClick={() =>
              actionMutation.mutate({
                method: 'post',
                url: '/overseer/session-purge',
                body: { userId: selectedUserId },
              })
            }
          >
            PURGE SELECTED
          </NeonButton>
          <NeonButton
            variant="ghost"
            className="text-[10px] w-full border-[var(--brand-danger)]/50 text-[var(--brand-danger)]"
            disabled={actionMutation.isPending}
            onClick={() => {
              if (window.confirm('Purge ALL developer sessions?')) {
                actionMutation.mutate({
                  method: 'post',
                  url: '/overseer/session-purge',
                  body: { scope: 'all_developers' },
                });
              }
            }}
          >
            PURGE ALL DEVELOPERS
          </NeonButton>
        </FeaturePanel>
      </div>

      <GlassCard className="p-4 border-t-2 border-t-[var(--brand-purple)]">
        <h4 className="font-display font-bold text-sm flex items-center gap-2 mb-3">
          <KeyRound size={16} className="text-[var(--brand-purple)]" />
          CREDENTIAL OVERRIDE VAULT
        </h4>
        <div className="flex flex-wrap gap-2">
          <CyberInput
            type="password"
            placeholder="New password (min 6)"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            className="flex-1 min-w-[160px] text-xs"
          />
          <NeonButton
            variant="primary"
            className="text-xs"
            disabled={!selectedUserId || newPassword.length < 6 || actionMutation.isPending}
            onClick={() =>
              actionMutation.mutate({
                method: 'post',
                url: '/overseer/credential-override',
                body: { userId: selectedUserId, newPassword, forceResetOnLogin: true },
              })
            }
          >
            OVERRIDE & LOGOUT
          </NeonButton>
        </div>
      </GlassCard>

      <GlassCard className="p-4 border-t-2 border-t-[var(--brand-warning)]">
        <h4 className="font-display font-bold text-sm mb-3">IDENTITY QUARANTINE FIELD</h4>
        <div className="flex flex-wrap gap-2 items-center">
          <CyberInput
            placeholder="Lock reason"
            value={lockReason}
            onChange={(e) => setLockReason(e.target.value)}
            className="flex-1 min-w-[140px] text-xs"
          />
          <CyberInput
            placeholder="Hours"
            value={quarantineHours}
            onChange={(e) => setQuarantineHours(e.target.value)}
            className="w-20 text-xs"
          />
          <NeonButton
            variant="ghost"
            className="text-xs border-[var(--brand-warning)]/50"
            disabled={!selectedUserId || actionMutation.isPending}
            onClick={() =>
              actionMutation.mutate({
                method: 'post',
                url: '/overseer/identity-quarantine',
                body: {
                  userId: selectedUserId,
                  hours: Number(quarantineHours) || 24,
                  reason: lockReason,
                },
              })
            }
          >
            QUARANTINE
          </NeonButton>
        </div>
      </GlassCard>

      <GlassCard className="p-0 overflow-hidden flex-1 flex flex-col min-h-[280px]">
        <div className="p-3 border-b border-[var(--glass-border)] flex flex-wrap gap-2 items-center bg-black/40">
          <Search size={14} className="text-[var(--text-muted)]" />
          <input
            className="flex-1 min-w-[120px] bg-transparent text-sm font-mono outline-none"
            placeholder="Search users..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <select
            className="bg-[var(--bg-tertiary)] border border-[var(--glass-border)] rounded px-2 py-1 text-xs font-mono"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="">ALL</option>
            <option value="active">ACTIVE</option>
            <option value="locked">LOCKED</option>
            <option value="banned">BANNED</option>
          </select>
        </div>

        {commandQuery.isLoading ? (
          <CyberSkeleton className="m-4 h-32" />
        ) : (
          <div className="overflow-y-auto cyber-scrollbar flex-1 divide-y divide-[var(--glass-border)]">
            {commandQuery.data?.users?.map((user) => (
              <div
                key={user._id}
                className={`p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2 cursor-pointer hover:bg-white/5 ${
                  selectedUserId === user._id ? 'bg-[var(--brand-primary)]/10' : ''
                }`}
                onClick={() => setSelectedUserId(user._id)}
              >
                <div>
                  <div className="font-mono text-sm text-white">
                    @{user.username}
                    <span className="text-[var(--text-muted)] ml-2">{user.role}</span>
                  </div>
                  <div className="text-[10px] text-[var(--text-muted)]">{user.email}</div>
                  <div className="flex gap-1 mt-1 flex-wrap">
                    {user.isBanned && <CyberBadge variant="danger" size="sm">BANNED</CyberBadge>}
                    {user.loginLocked && <CyberBadge variant="warning" size="sm">LOCKED</CyberBadge>}
                    {user.hasActiveSession && <CyberBadge variant="primary" size="sm">ONLINE</CyberBadge>}
                  </div>
                </div>
                <div className="flex gap-1 shrink-0" onClick={(e) => e.stopPropagation()}>
                  <button
                    type="button"
                    title="Lock login"
                    className="p-2 rounded border border-[var(--glass-border)] hover:border-[var(--brand-warning)]"
                    onClick={() =>
                      actionMutation.mutate({
                        method: 'post',
                        url: `/overseer/users/${user._id}/lock-login`,
                        body: { reason: lockReason || 'Overseer lock' },
                      })
                    }
                  >
                    <Lock size={14} className="text-[var(--brand-warning)]" />
                  </button>
                  <button
                    type="button"
                    title="Unlock login"
                    className="p-2 rounded border border-[var(--glass-border)] hover:border-[var(--brand-success)]"
                    onClick={() =>
                      actionMutation.mutate({
                        method: 'post',
                        url: `/overseer/users/${user._id}/unlock-login`,
                      })
                    }
                  >
                    <Unlock size={14} className="text-[var(--brand-success)]" />
                  </button>
                  <button
                    type="button"
                    title="Force logout"
                    className="p-2 rounded border border-[var(--glass-border)] hover:border-[var(--brand-primary)]"
                    onClick={() =>
                      actionMutation.mutate({
                        method: 'post',
                        url: `/overseer/users/${user._id}/force-logout`,
                      })
                    }
                  >
                    <LogOut size={14} className="text-[var(--brand-primary)]" />
                  </button>
                  <button
                    type="button"
                    title="Toggle ban"
                    className="p-2 rounded border border-[var(--glass-border)] hover:border-[var(--brand-danger)]"
                    onClick={() =>
                      actionMutation.mutate({
                        method: 'post',
                        url: `/overseer/users/${user._id}/toggle-ban`,
                      })
                    }
                  >
                    <Ban size={14} className="text-[var(--brand-danger)]" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {selectedUser && (
          <div className="p-2 border-t border-[var(--glass-border)] text-[10px] font-mono text-[var(--text-muted)] bg-black/50">
            TARGET: @{selectedUser.username} · Last active:{' '}
            {selectedUser.lastActive ? new Date(selectedUser.lastActive).toLocaleString() : 'never'}
          </div>
        )}
      </GlassCard>
    </div>
  );
};

export default IdentityCommandCenter;
