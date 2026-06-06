import React, { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import api from '../../lib/api';
import { GlassCard, NeonButton, CyberBadge, CyberSkeleton, CyberInput } from '../ui';
import {
  Brain, GitFork, Radar, Shield, Atom, Zap, ChevronRight,
} from 'lucide-react';

const FeaturePanel = ({ title, icon: Icon, color, children, onRun, running, runLabel = 'ACTIVATE' }) => (
  <GlassCard className={`p-5 border-t-2 flex flex-col h-full`} style={{ borderTopColor: color }}>
    <div className="flex items-center justify-between mb-4">
      <h3 className="font-display font-bold text-sm flex items-center gap-2">
        <Icon size={18} style={{ color }} />
        {title}
      </h3>
      <NeonButton variant="ghost" className="text-xs py-1 px-2" onClick={onRun} disabled={running}>
        {running ? 'SCANNING...' : runLabel}
      </NeonButton>
    </div>
    <div className="flex-1 overflow-y-auto cyber-scrollbar text-sm font-mono">{children}</div>
  </GlassCard>
);

export const OverseerArsenal = ({ addLog }) => {
  const [oracleForm, setOracleForm] = useState({
    owner: '',
    repo: '',
    sourceBranch: 'feature',
    targetBranch: 'main',
  });

  const neuralQuery = useQuery({
    queryKey: ['overseer-neural'],
    queryFn: async () => (await api.get('/overseer/neural-scan')).data,
    enabled: false,
  });

  const shadowQuery = useQuery({
    queryKey: ['overseer-shadow'],
    queryFn: async () => (await api.get('/overseer/shadow-forks')).data,
    enabled: false,
  });

  const velocityQuery = useQuery({
    queryKey: ['overseer-velocity'],
    queryFn: async () => (await api.get('/overseer/velocity-radar')).data,
    enabled: false,
  });

  const trustQuery = useQuery({
    queryKey: ['overseer-trust'],
    queryFn: async () => (await api.get('/overseer/trust-lens')).data,
    enabled: false,
  });

  const mergeMutation = useMutation({
    mutationFn: async () =>
      (await api.post('/overseer/merge-oracle', oracleForm)).data,
    onSuccess: (data) => {
      addLog?.('success', `Merge Oracle: ${data.recommendation} (${data.mergeProbability}% safe)`);
    },
    onError: (err) => {
      addLog?.('error', err.response?.data?.message || 'Merge oracle failed');
    },
  });

  const runWithLog = (refetch, label) => {
    addLog?.('system', `Initializing ${label}...`);
    refetch().then(() => addLog?.('success', `${label} complete.`)).catch((e) => {
      addLog?.('error', e.response?.data?.message || `${label} failed`);
    });
  };

  return (
    <div className="p-4 space-y-4 overflow-y-auto cyber-scrollbar flex-1">
      <div className="flex items-center gap-2 text-xs font-mono text-[var(--brand-purple)] border border-[var(--brand-purple)]/30 rounded-lg px-3 py-2 bg-[var(--brand-purple)]/5">
        <Zap size={14} />
        CLASSIFIED ARSENAL — REVIEWER & ADMIN CLEARANCE ONLY
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 min-h-0">
        <FeaturePanel
          title="NEURAL ANOMALY SCANNER"
          icon={Brain}
          color="var(--brand-danger)"
          onRun={() => runWithLog(neuralQuery.refetch, 'Neural Scan')}
          running={neuralQuery.isFetching}
        >
          {neuralQuery.isFetching && <CyberSkeleton className="h-24 w-full" />}
          {neuralQuery.data && (
            <div className="space-y-2">
              <p className="text-[var(--text-muted)]">
                Scanned {neuralQuery.data.totalScanned} nodes — {neuralQuery.data.anomalyCount} anomalies
              </p>
              {neuralQuery.data.anomalies?.length ? neuralQuery.data.anomalies.map((a) => (
                <div key={a.repoId} className="p-2 rounded border border-[var(--brand-danger)]/30 bg-black/30">
                  <div className="flex justify-between">
                    <span className="text-white">{a.owner}/{a.slug}</span>
                    <CyberBadge variant="danger" size="sm">N{a.neuralScore}</CyberBadge>
                  </div>
                  {a.signals?.map((s) => (
                    <div key={s.code} className="text-[10px] text-[var(--brand-warning)] mt-1">
                      {s.code}: {s.detail}
                    </div>
                  ))}
                </div>
              )) : (
                <p className="text-[var(--brand-success)]">No neural anomalies detected.</p>
              )}
            </div>
          )}
          {!neuralQuery.data && !neuralQuery.isFetching && (
            <p className="text-[var(--text-muted)]">Detects ghost repos, fork farms, commit bursts, and security clusters.</p>
          )}
        </FeaturePanel>

        <FeaturePanel
          title="SHADOW FORK MATRIX"
          icon={GitFork}
          color="var(--brand-warning)"
          onRun={() => runWithLog(shadowQuery.refetch, 'Shadow Fork Matrix')}
          running={shadowQuery.isFetching}
        >
          {shadowQuery.isFetching && <CyberSkeleton className="h-24 w-full" />}
          {shadowQuery.data && (
            <div className="space-y-3">
              <p className="text-[var(--text-muted)]">ID: {shadowQuery.data.matrixId}</p>
              {shadowQuery.data.shadowNodes?.map((n) => (
                <div key={n.slug} className="p-2 rounded border border-[var(--brand-warning)]/30">
                  <span className="text-white font-bold">{n.slug}</span>
                  <span className="text-[var(--text-muted)]"> — {n.cloneCount} clones / {n.distinctOwners} owners</span>
                  <CyberBadge variant={n.risk === 'high' ? 'danger' : 'warning'} size="sm" className="ml-2">{n.risk}</CyberBadge>
                </div>
              ))}
              {shadowQuery.data.forkWebs?.slice(0, 5).map((w, i) => (
                <div key={i} className="text-[10px] text-[var(--text-muted)]">
                  Web: {w.sourceName} → {w.forks.length} forks
                </div>
              ))}
            </div>
          )}
          {!shadowQuery.data && !shadowQuery.isFetching && (
            <p className="text-[var(--text-muted)]">Maps duplicate repo slugs and fork webs across the platform.</p>
          )}
        </FeaturePanel>

        <FeaturePanel
          title="CONTRIBUTOR VELOCITY RADAR"
          icon={Radar}
          color="var(--brand-primary)"
          onRun={() => runWithLog(velocityQuery.refetch, 'Velocity Radar')}
          running={velocityQuery.isFetching}
        >
          {velocityQuery.isFetching && <CyberSkeleton className="h-24 w-full" />}
          {velocityQuery.data && (
            <div className="space-y-2">
              {velocityQuery.data.blips?.length ? velocityQuery.data.blips.map((b) => (
                <div key={b.username} className="flex justify-between items-center p-2 rounded bg-black/30 border border-[var(--glass-border)]">
                  <span className="text-white">@{b.username}</span>
                  <div className="flex items-center gap-2">
                    <span className="text-[var(--text-muted)]">{b.commits7d}c/7d</span>
                    <CyberBadge
                      variant={b.threatLevel === 'critical' ? 'danger' : b.threatLevel === 'elevated' ? 'warning' : 'primary'}
                      size="sm"
                    >
                      {b.signature}
                    </CyberBadge>
                  </div>
                </div>
              )) : (
                <p className="text-[var(--brand-success)]">All contributors within nominal velocity.</p>
              )}
            </div>
          )}
          {!velocityQuery.data && !velocityQuery.isFetching && (
            <p className="text-[var(--text-muted)]">Flags bot-storm patterns and abnormal commit velocity spikes.</p>
          )}
        </FeaturePanel>

        <FeaturePanel
          title="ZERO-TRUST SESSION LENS"
          icon={Shield}
          color="var(--brand-success)"
          onRun={() => runWithLog(trustQuery.refetch, 'Trust Lens')}
          running={trustQuery.isFetching}
        >
          {trustQuery.isFetching && <CyberSkeleton className="h-24 w-full" />}
          {trustQuery.data && (
            <div className="space-y-2">
              <p className="text-[var(--text-muted)]">
                Quarantine: {trustQuery.data.quarantineCount} · Lens {trustQuery.data.lensVersion}
              </p>
              {trustQuery.data.profiles?.slice(0, 8).map((p) => (
                <div key={p.userId} className="flex justify-between p-2 rounded border border-[var(--glass-border)]">
                  <span className="text-white">@{p.username}</span>
                  <div className="flex items-center gap-2">
                    <span className={p.trustScore < 50 ? 'text-[var(--brand-danger)]' : 'text-[var(--brand-success)]'}>
                      {p.trustScore}
                    </span>
                    <CyberBadge variant={p.clearance === 'quarantine' ? 'danger' : 'neutral'} size="sm">
                      {p.clearance}
                    </CyberBadge>
                  </div>
                </div>
              ))}
            </div>
          )}
          {!trustQuery.data && !trustQuery.isFetching && (
            <p className="text-[var(--text-muted)]">24h activity trust scoring with quarantine clearance levels.</p>
          )}
        </FeaturePanel>
      </div>

      <GlassCard className="p-5 border-t-2 border-t-[var(--brand-purple)]">
        <h3 className="font-display font-bold text-sm flex items-center gap-2 mb-4">
          <Atom size={18} className="text-[var(--brand-purple)]" />
          QUANTUM MERGE ORACLE
        </h3>
        <p className="text-xs font-mono text-[var(--text-muted)] mb-4">
          Simulates merge wave-collapse between two branches without touching production state.
        </p>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
          <CyberInput placeholder="owner" value={oracleForm.owner} onChange={(e) => setOracleForm((f) => ({ ...f, owner: e.target.value }))} className="text-xs" />
          <CyberInput placeholder="repo slug" value={oracleForm.repo} onChange={(e) => setOracleForm((f) => ({ ...f, repo: e.target.value }))} className="text-xs" />
          <CyberInput placeholder="source branch" value={oracleForm.sourceBranch} onChange={(e) => setOracleForm((f) => ({ ...f, sourceBranch: e.target.value }))} className="text-xs" />
          <CyberInput placeholder="target branch" value={oracleForm.targetBranch} onChange={(e) => setOracleForm((f) => ({ ...f, targetBranch: e.target.value }))} className="text-xs" />
        </div>
        <NeonButton
          variant="primary"
          className="text-xs"
          onClick={() => mergeMutation.mutate()}
          disabled={mergeMutation.isPending || !oracleForm.owner || !oracleForm.repo}
        >
          {mergeMutation.isPending ? 'COLLAPSING WAVEFORM...' : 'RUN ORACLE'}
        </NeonButton>

        {mergeMutation.data && (
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="mt-4 p-4 rounded-lg bg-black/40 border border-[var(--brand-purple)]/40">
            <div className="flex flex-wrap gap-3 mb-3">
              <CyberBadge variant="purple">{mergeMutation.data.recommendation}</CyberBadge>
              <span className="text-[var(--brand-primary)]">Merge prob: {mergeMutation.data.mergeProbability}%</span>
              <span className="text-[var(--brand-danger)]">Conflict: {mergeMutation.data.conflictScore}%</span>
            </div>
            {mergeMutation.data.conflictFiles?.map((c) => (
              <div key={c.path} className="text-[10px] text-[var(--text-muted)] flex items-center gap-1">
                <ChevronRight size={10} />
                {c.path} ({c.conflictType}, {c.divergencePercent}%)
              </div>
            ))}
          </motion.div>
        )}
      </GlassCard>
    </div>
  );
};

export default OverseerArsenal;
