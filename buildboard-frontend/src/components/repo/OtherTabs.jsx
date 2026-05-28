import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import api from '../../lib/api';
import { GlassCard, NeonButton, CyberInput, CyberBadge } from '../ui';
import { 
  GitPullRequest, Activity, ShieldAlert, Users, 
  Lightbulb, Tag, MessageSquare, BrainCircuit,
  CheckCircle2, AlertTriangle, FileText, Play,
  BarChart3, Cpu, Sparkles, GitBranch, Code2
} from 'lucide-react';
import { listVariants, itemVariants } from '../../utils/animations';
import { ScrollReveal } from "../effects/ScrollReveal";

export const PullRequestCards = ({ owner, repo }) => {
  const { data, isLoading } = useQuery({
    queryKey: ['repo-prs', owner, repo],
    queryFn: async () => {
      const { data } = await api.get(`/pullrequests/${owner}/${repo}`, { params: { status: 'all' } });
      return data;
    },
  });

  if (isLoading) {
    return (
      <GlassCard className="p-12 text-center flex items-center justify-center">
        <div className="animate-pulse flex items-center gap-3">
          <div className="w-5 h-5 rounded-full border-2 border-[var(--brand-primary)] border-t-transparent animate-spin" />
          <span className="font-mono text-sm text-[var(--brand-primary)]">FETCHING_MERGE_REQUESTS...</span>
        </div>
      </GlassCard>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-[var(--bg-tertiary)] border border-[var(--glass-border)] rounded-lg p-4">
        <div className="flex gap-6">
          <div className="flex items-center gap-2 text-[var(--text-main)] font-semibold cursor-pointer hover:text-white transition-colors">
            <GitPullRequest size={18} />
            {data?.openCount || 0} Open
          </div>
          <div className="flex items-center gap-2 text-[var(--text-muted)] cursor-pointer hover:text-white transition-colors">
            <CheckCircle2 size={18} />
            {data?.mergedCount || 0} Merged
          </div>
        </div>
      </div>

      <motion.div variants={listVariants} initial="hidden" animate="visible">
        <GlassCard className="p-0 overflow-hidden divide-y divide-[var(--glass-border)]">
          {(data?.pullRequests || []).map((pr) => (
            <motion.div key={pr._id} variants={itemVariants}>
              <div className="p-4 hover:bg-white/5 transition-colors group">
                <div className="flex items-start gap-3">
                  <div className="pt-1">
                    {pr.status === 'merged' ? (
                      <GitBranch size={18} className="text-[var(--brand-purple)]" />
                    ) : pr.status === 'closed' ? (
                      <AlertTriangle size={18} className="text-[var(--brand-warning)]" />
                    ) : (
                      <GitPullRequest size={18} className="text-[var(--brand-success)]" />
                    )}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2 mb-1">
                      <span className="font-display font-bold text-base text-[var(--text-main)] group-hover:text-[var(--brand-primary)] transition-colors cursor-pointer">
                        {pr.title}
                      </span>
                      
                      <CyberBadge variant="neutral" size="sm" className="font-mono">#{pr.number}</CyberBadge>
                      {pr.isDraft && <CyberBadge variant="warning" size="sm">DRAFT</CyberBadge>}
                      {pr.reviewDecision && (
                        <CyberBadge variant={pr.reviewDecision === 'APPROVED' ? 'success' : 'warning'} size="sm">
                          {pr.reviewDecision}
                        </CyberBadge>
                      )}
                    </div>
                    
                    <div className="flex items-center gap-4 text-xs font-mono text-[var(--text-muted)]">
                      <div className="flex items-center gap-2">
                        <span className="text-[var(--brand-primary)]">{pr.sourceBranch?.name}</span>
                        <span>into</span>
                        <span className="text-[var(--brand-primary)]">{pr.targetBranch?.name}</span>
                      </div>
                      
                      {pr.commentCount > 0 && (
                        <span className="flex items-center gap-1.5 ml-auto">
                          <MessageSquare size={12} />
                          {pr.commentCount}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
          
          {(!data?.pullRequests || data.pullRequests.length === 0) && (
            <div className="p-12 text-center flex flex-col items-center justify-center">
              <GitPullRequest size={48} className="text-[var(--text-muted)] opacity-30 mb-4" />
              <h3 className="text-xl font-bold mb-2">NO_MERGE_REQUESTS</h3>
              <p className="text-sm text-[var(--text-muted)] font-mono">No pull requests have been initiated in this sector.</p>
            </div>
          )}
        </GlassCard>
      </motion.div>
    </div>
  );
};

export const ActionsTab = ({ owner, repo }) => {
  const queryClient = useQueryClient();
  const [workflow, setWorkflow] = useState({
    name: 'Build and test',
    yaml: 'name: Build and test\non: [push, pull_request]\njobs:\n  test:\n    runs-on: ubuntu-latest\n    steps:\n      - npm install\n      - npm test',
  });

  const workflows = useQuery({
    queryKey: ['repo-workflows', owner, repo],
    queryFn: async () => (await api.get(`/repos/${owner}/${repo}/workflows`)).data,
  });

  const runs = useQuery({
    queryKey: ['repo-workflow-runs', owner, repo],
    queryFn: async () => (await api.get(`/repos/${owner}/${repo}/workflow-runs`)).data,
  });

  const createWorkflow = useMutation({
    mutationFn: async () => (await api.post(`/repos/${owner}/${repo}/workflows`, workflow)).data,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['repo-workflows', owner, repo] }),
  });

  const runWorkflow = useMutation({
    mutationFn: async (id) => (await api.post(`/repos/${owner}/${repo}/workflows/${id}/runs`, {})).data,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['repo-workflow-runs', owner, repo] }),
  });

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_420px]">
      <motion.div variants={listVariants} initial="hidden" animate="visible" className="space-y-6">
        <GlassCard className="p-0 overflow-hidden border-t-[var(--brand-purple)]">
          <div className="border-b border-[var(--glass-border)] px-6 py-4 bg-black/40 flex items-center gap-2">
            <Activity size={18} className="text-[var(--brand-purple)]" />
            <h3 className="font-display font-bold">Automation History</h3>
          </div>
          <div className="divide-y divide-[var(--glass-border)]">
            {(runs.data || []).map((run, idx) => (
              <motion.div key={run._id} variants={itemVariants} className="flex items-center justify-between p-4 hover:bg-white/5 transition-colors">
                <div className="flex items-start gap-3">
                  <div className="pt-0.5">
                    {run.conclusion === 'success' ? (
                      <CheckCircle2 size={16} className="text-[var(--brand-success)]" />
                    ) : run.conclusion === 'failure' ? (
                      <AlertTriangle size={16} className="text-[var(--brand-warning)]" />
                    ) : (
                      <div className="w-4 h-4 rounded-full border-2 border-[var(--brand-primary)] border-t-transparent animate-spin" />
                    )}
                  </div>
                  <div>
                    <div className="font-display font-bold text-sm">{run.workflow?.name || 'Workflow'} <span className="text-[var(--text-muted)]">#{run.runNumber}</span></div>
                    <div className="text-xs font-mono text-[var(--text-muted)] flex items-center gap-2 mt-1">
                      <span className="flex items-center gap-1"><GitBranch size={12} /> {run.branch}</span>
                      <span>•</span>
                      <span className="uppercase">{run.status}</span>
                      <span>•</span>
                      <span className="uppercase text-[var(--brand-primary)]">{run.conclusion || 'PENDING'}</span>
                    </div>
                  </div>
                </div>
                <CyberBadge variant="neutral" size="sm" className="hidden sm:inline-flex">
                  {run.actor?.username || 'SYSTEM'}
                </CyberBadge>
              </motion.div>
            ))}
            {!runs.data?.length && (
              <div className="p-12 text-center">
                <Cpu size={48} className="text-[var(--text-muted)] opacity-30 mb-4 mx-auto" />
                <p className="text-sm font-mono text-[var(--text-muted)]">No automated sequences have been executed.</p>
              </div>
            )}
          </div>
        </GlassCard>
      </motion.div>

      <aside className="space-y-6">
        <GlassCard className="p-5">
          <h3 className="font-display font-bold mb-4 flex items-center gap-2">
            <Cpu size={16} className="text-[var(--brand-primary)]" />
            Active Workflows
          </h3>
          <div className="space-y-3">
            {(workflows.data || []).map((item) => (
              <div key={item._id} className="rounded-lg border border-[var(--glass-border)] bg-[var(--bg-main)]/50 p-4 hover:border-[var(--brand-primary)]/50 transition-colors group">
                <div className="font-bold text-[var(--text-main)] group-hover:text-white transition-colors">{item.name}</div>
                <div className="mt-1 text-xs font-mono text-[var(--text-muted)] bg-[var(--bg-tertiary)] px-2 py-1 rounded inline-block">{item.path}</div>
                <NeonButton 
                  variant="ghost" 
                  className="mt-4 w-full flex items-center gap-2 justify-center border-[var(--glass-border)]"
                  onClick={() => runWorkflow.mutate(item._id)}
                  disabled={runWorkflow.isPending}
                >
                  <Play size={14} /> {runWorkflow.isPending ? 'INITIATING...' : 'EXECUTE SEQUENCE'}
                </NeonButton>
              </div>
            ))}
            {!workflows.data?.length && (
              <p className="text-xs font-mono text-[var(--text-muted)] text-center py-4">No workflows defined.</p>
            )}
          </div>
        </GlassCard>

        <GlassCard className="p-5 bg-gradient-to-br from-[var(--bg-main)] to-[var(--bg-tertiary)]">
          <h3 className="font-display font-bold mb-4 flex items-center gap-2">
            <Edit2 size={16} className="text-[var(--brand-warning)]" />
            Define Sequence
          </h3>
          <form onSubmit={(event) => { event.preventDefault(); createWorkflow.mutate(); }} className="space-y-4">
            <CyberInput 
              value={workflow.name} 
              onChange={(event) => setWorkflow((current) => ({ ...current, name: event.target.value }))} 
              placeholder="Sequence Designation"
            />
            <div className="space-y-1">
              <label className="text-xs font-mono text-[var(--text-muted)] pl-1 block">YAML Configuration</label>
              <textarea 
                className="w-full bg-[#0a0a0f] border border-[var(--glass-border)] rounded-lg p-3 text-xs font-mono text-[var(--brand-primary)] min-h-[200px] focus:border-[var(--brand-primary)] focus:ring-1 focus:ring-[var(--brand-primary)]/50 outline-none transition-all resize-none cyber-scrollbar" 
                value={workflow.yaml} 
                onChange={(event) => setWorkflow((current) => ({ ...current, yaml: event.target.value }))} 
                spellCheck="false"
              />
            </div>
            <NeonButton variant="primary" className="w-full" disabled={createWorkflow.isPending}>
              {createWorkflow.isPending ? 'UPLOADING...' : 'DEPLOY_SEQUENCE'}
            </NeonButton>
          </form>
        </GlassCard>
      </aside>
    </div>
  );
};

export const WikiTab = ({ owner, repo }) => {
  const queryClient = useQueryClient();
  const [page, setPage] = useState({ slug: 'home', title: 'Home', content: '# Home\n\nBuildBoard+ documentation.' });
  const pages = useQuery({
    queryKey: ['repo-wiki', owner, repo],
    queryFn: async () => (await api.get(`/repos/${owner}/${repo}/wiki`)).data,
  });
  const savePage = useMutation({
    mutationFn: async () => (await api.put(`/repos/${owner}/${repo}/wiki/${page.slug}`, page)).data,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['repo-wiki', owner, repo] }),
  });

  return (
    <div className="grid gap-6 lg:grid-cols-[280px_minmax(0,1fr)]">
      <GlassCard className="p-0 overflow-hidden h-fit border-t-[var(--brand-primary)]">
        <div className="border-b border-[var(--glass-border)] px-4 py-3 bg-black/40 flex items-center gap-2">
          <FileText size={16} className="text-[var(--brand-primary)]" />
          <h3 className="font-display font-bold text-sm">INDEX</h3>
        </div>
        <div className="divide-y divide-[var(--glass-border)]">
          {(pages.data || []).map((item) => (
            <button 
              key={item._id} 
              type="button" 
              className={`block w-full px-4 py-3 text-left text-sm font-mono transition-colors ${page.slug === item.slug ? 'bg-[var(--brand-primary)]/10 text-[var(--brand-primary)] border-l-2 border-l-[var(--brand-primary)]' : 'hover:bg-white/5 text-[var(--text-main)] border-l-2 border-l-transparent'}`}
              onClick={() => setPage({ slug: item.slug, title: item.title, content: item.content })}
            >
              {item.title}
            </button>
          ))}
          {!pages.data?.length && <div className="p-4 text-xs font-mono text-[var(--text-muted)] text-center">Empty Index</div>}
        </div>
      </GlassCard>
      
      <GlassCard className="p-6">
        <form onSubmit={(event) => { event.preventDefault(); savePage.mutate(); }} className="space-y-4">
          <div className="flex items-center gap-2 mb-2 text-[var(--brand-primary)] text-sm font-mono">
            <Edit2 size={16} />
            <span>EDIT_DOCUMENT</span>
          </div>
          <div className="grid gap-4 md:grid-cols-[200px_1fr]">
            <CyberInput 
              label="Slug"
              value={page.slug} 
              onChange={(event) => setPage((current) => ({ ...current, slug: event.target.value }))} 
              className="font-mono text-sm"
            />
            <CyberInput 
              label="Title"
              value={page.title} 
              onChange={(event) => setPage((current) => ({ ...current, title: event.target.value }))} 
            />
          </div>
          <div className="space-y-1">
            <label className="text-xs font-mono text-[var(--text-muted)] pl-1 block">Markdown Content</label>
            <textarea 
              className="w-full bg-[#0a0a0f] border border-[var(--glass-border)] rounded-lg p-4 text-sm font-mono text-[#c9d1d9] min-h-[400px] focus:border-[var(--brand-primary)] focus:ring-1 focus:ring-[var(--brand-primary)]/50 outline-none transition-all resize-y cyber-scrollbar leading-relaxed"
              value={page.content} 
              onChange={(event) => setPage((current) => ({ ...current, content: event.target.value }))} 
              spellCheck="false"
            />
          </div>
          <div className="flex justify-end pt-2">
            <NeonButton variant="primary" type="submit" disabled={savePage.isPending}>
              {savePage.isPending ? 'SAVING...' : 'SAVE_DOCUMENT'}
            </NeonButton>
          </div>
        </form>
      </GlassCard>
    </div>
  );
};

export const SimpleListTab = ({ title, icon: Icon, queryKey, queryFn, empty, render, glowColor = "var(--brand-primary)" }) => {
  const { data, isLoading } = useQuery({ queryKey, queryFn });
  
  if (isLoading) {
    return (
      <GlassCard className="p-12 text-center flex items-center justify-center">
        <div className="animate-pulse flex items-center gap-3">
          <div className="w-5 h-5 rounded-full border-2 border-[var(--brand-primary)] border-t-transparent animate-spin" />
          <span className="font-mono text-sm text-[var(--brand-primary)]">ACCESSING_DATA...</span>
        </div>
      </GlassCard>
    );
  }

  const items = Array.isArray(data) ? data : [];
  
  return (
    <GlassCard className="p-0 overflow-hidden" glowColor={glowColor}>
      <div className="border-b border-[var(--glass-border)] px-6 py-4 bg-black/40 flex items-center gap-2">
        {Icon && <Icon size={18} style={{ color: glowColor }} />}
        <h3 className="font-display font-bold uppercase tracking-wider">{title}</h3>
      </div>
      <div className="divide-y divide-[var(--glass-border)]">
        {items.map((item, idx) => (
          <motion.div key={item._id || idx} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.05 }}>
            {render(item)}
          </motion.div>
        ))}
        {!items.length && (
          <div className="p-12 text-center flex flex-col items-center justify-center">
            {Icon && <Icon size={48} className="text-[var(--text-muted)] opacity-30 mb-4" />}
            <p className="text-sm font-mono text-[var(--text-muted)]">{empty}</p>
          </div>
        )}
      </div>
    </GlassCard>
  );
};

export const InsightsTab = ({ owner, repo }) => {
  const { data, isLoading } = useQuery({
    queryKey: ['repo-insights', owner, repo],
    queryFn: async () => (await api.get(`/repos/${owner}/${repo}/insights`)).data,
  });
  
  if (isLoading) return (
    <GlassCard className="p-12 text-center flex items-center justify-center">
      <div className="animate-pulse flex items-center gap-3">
        <div className="w-5 h-5 rounded-full border-2 border-[var(--brand-primary)] border-t-transparent animate-spin" />
        <span className="font-mono text-sm text-[var(--brand-primary)]">ANALYZING_TELEMETRY...</span>
      </div>
    </GlassCard>
  );

  const summary = data?.summary || {};
  
  return (
    <div className="space-y-6">
      <div className="grid gap-4 grid-cols-2 md:grid-cols-5">
        {Object.entries(summary).map(([key, value], idx) => (
          <ScrollReveal delay={idx * 0.1} key={key}>
            <GlassCard className="p-4 text-center h-full flex flex-col justify-center border-t-[var(--brand-primary)]">
              <div className="text-3xl font-display font-bold text-white mb-1">{value}</div>
              <div className="text-[10px] font-mono tracking-widest uppercase text-[var(--brand-primary)]">{key.replace(/([A-Z])/g, ' $1')}</div>
            </GlassCard>
          </ScrollReveal>
        ))}
      </div>
      
      <div className="grid gap-6 lg:grid-cols-2">
        <ScrollReveal delay={0.2}>
          <GlassCard className="p-6 h-full">
            <h3 className="font-display font-bold mb-6 flex items-center gap-2">
              <Users size={18} className="text-[var(--brand-purple)]" />
              TOP_OPERATIVES
            </h3>
            <div className="space-y-4">
              {(data?.contributors || []).map((contributor, idx) => (
                <div key={contributor.username} className="flex items-center justify-between p-3 rounded-lg bg-[var(--bg-main)]/50 border border-[var(--glass-border)]">
                  <div className="flex items-center gap-3">
                    <span className="text-[var(--brand-purple)] font-mono text-sm">0{idx + 1}</span>
                    <span className="font-bold text-[var(--text-main)]">@{contributor.username}</span>
                  </div>
                  <CyberBadge variant="purple" size="sm" className="font-mono">{contributor.commits} COMMITS</CyberBadge>
                </div>
              ))}
              {(!data?.contributors || data.contributors.length === 0) && (
                <p className="text-xs font-mono text-[var(--text-muted)] text-center py-4">No data available.</p>
              )}
            </div>
          </GlassCard>
        </ScrollReveal>
        
        <ScrollReveal delay={0.3}>
          <GlassCard className="p-6 h-full">
            <h3 className="font-display font-bold mb-6 flex items-center gap-2">
              <Activity size={18} className="text-[var(--brand-success)]" />
              SYSTEM_HEALTH
            </h3>
            <div className="space-y-5">
              {Object.entries(data?.health || {}).map(([key, value]) => (
                <div key={key}>
                  <div className="mb-2 flex justify-between text-xs font-mono">
                    <span className="text-[var(--text-main)] uppercase">{key}</span>
                    <span className="text-[var(--brand-success)]">{value}%</span>
                  </div>
                  <div className="h-1.5 rounded-full bg-[var(--bg-subtle)] overflow-hidden">
                    <motion.div 
                      initial={{ width: 0 }} 
                      animate={{ width: `${value}%` }} 
                      transition={{ duration: 1, ease: "easeOut" }}
                      className="h-full bg-[var(--brand-success)] shadow-[0_0_10px_var(--brand-success)]" 
                    />
                  </div>
                </div>
              ))}
              {(!data?.health || Object.keys(data.health).length === 0) && (
                <p className="text-xs font-mono text-[var(--text-muted)] text-center py-4">No health metrics available.</p>
              )}
            </div>
          </GlassCard>
        </ScrollReveal>
      </div>
    </div>
  );
};

export const SecurityTab = ({ owner, repo }) => {
  const { data, isLoading } = useQuery({
    queryKey: ['repo-security', owner, repo],
    queryFn: async () => (await api.get(`/repos/${owner}/${repo}/security`)).data,
  });
  
  if (isLoading) return (
    <GlassCard className="p-12 text-center flex items-center justify-center">
      <div className="animate-pulse flex items-center gap-3">
        <div className="w-5 h-5 rounded-full border-2 border-[var(--brand-warning)] border-t-transparent animate-spin" />
        <span className="font-mono text-sm text-[var(--brand-warning)]">SCANNING_VULNERABILITIES...</span>
      </div>
    </GlassCard>
  );

  return (
    <div className="space-y-6">
      <div className="grid gap-4 grid-cols-2 md:grid-cols-4">
        {[
          { key: 'critical', color: 'var(--brand-danger)' }, 
          { key: 'high', color: '#ff7b00' }, 
          { key: 'medium', color: 'var(--brand-warning)' }, 
          { key: 'low', color: 'var(--brand-primary)' }
        ].map(({ key, color }, idx) => (
          <ScrollReveal delay={idx * 0.1} key={key}>
            <GlassCard className="p-4 text-center h-full flex flex-col justify-center" style={{ borderTopColor: color }}>
              <div className="text-4xl font-display font-bold mb-1" style={{ color }}>{data?.counts?.[key] || 0}</div>
              <div className="text-[10px] font-mono tracking-widest uppercase text-[var(--text-muted)]">{key} ALERTS</div>
            </GlassCard>
          </ScrollReveal>
        ))}
      </div>
      
      <SimpleListTab
        title="Security Alerts"
        icon={ShieldAlert}
        glowColor="var(--brand-warning)"
        queryKey={['repo-security-alerts-local', owner, repo, data?.alerts?.length]}
        queryFn={async () => data?.alerts || []}
        empty="SYSTEM SECURE. No open security vulnerabilities."
        render={(alert) => (
          <div className="p-4 hover:bg-white/5 transition-colors">
            <div className="flex items-center gap-3">
              <ShieldAlert size={16} className={
                alert.severity === 'critical' ? 'text-[var(--brand-danger)]' : 
                alert.severity === 'high' ? 'text-[#ff7b00]' : 
                alert.severity === 'medium' ? 'text-[var(--brand-warning)]' : 'text-[var(--brand-primary)]'
              } />
              <div className="font-bold text-[var(--text-main)]">{alert.title}</div>
            </div>
            <div className="mt-2 ml-7 flex items-center gap-3 text-xs font-mono text-[var(--text-muted)]">
              <span className="px-2 py-0.5 rounded bg-[var(--bg-tertiary)] border border-[var(--glass-border)] uppercase">{alert.type}</span>
              <span className="uppercase">{alert.severity}</span>
              <span>•</span>
              <span className="uppercase text-[var(--brand-primary)]">{alert.status}</span>
            </div>
          </div>
        )}
      />
    </div>
  );
};

export const DiscussionsTab = ({ owner, repo }) => (
  <SimpleListTab
    title="Communications Network"
    icon={MessageSquare}
    glowColor="var(--brand-primary)"
    queryKey={['repo-discussions', owner, repo]}
    queryFn={async () => (await api.get(`/repos/${owner}/${repo}/discussions`)).data}
    empty="No active communications found."
    render={(discussion) => (
      <div className="p-5 hover:bg-white/5 transition-colors group">
        <div className="font-display font-bold text-lg text-[var(--text-main)] group-hover:text-[var(--brand-primary)] transition-colors mb-2">
          {discussion.title}
        </div>
        <div className="flex items-center gap-4 text-xs font-mono text-[var(--text-muted)]">
          <CyberBadge variant="primary" size="sm" className="lowercase border-dashed">{discussion.category}</CyberBadge>
          <span className="flex items-center gap-1.5"><MessageSquare size={12} /> {discussion.commentCount} REPLIES</span>
          <span className="flex items-center gap-1.5"><Lightbulb size={12} /> {discussion.upvotes?.length || 0} UPVOTES</span>
        </div>
      </div>
    )}
  />
);

export const ReleasesTab = ({ owner, repo }) => (
  <SimpleListTab
    title="Deployment Packages"
    icon={Tag}
    glowColor="var(--brand-success)"
    queryKey={['repo-releases', owner, repo]}
    queryFn={async () => (await api.get(`/repos/${owner}/${repo}/releases`)).data}
    empty="No stable deployments published."
    render={(release) => (
      <div className="p-5 hover:bg-white/5 transition-colors group">
        <div className="flex items-center gap-3 mb-2">
          <Tag size={16} className="text-[var(--brand-success)]" />
          <div className="font-display font-bold text-lg text-[var(--text-main)] group-hover:text-white transition-colors">
            {release.title}
          </div>
          {release.isPrerelease ? (
            <CyberBadge variant="warning" size="sm">PRE-RELEASE</CyberBadge>
          ) : (
            <CyberBadge variant="success" size="sm">STABLE</CyberBadge>
          )}
        </div>
        <div className="flex items-center gap-4 text-xs font-mono text-[var(--text-muted)] ml-7">
          <span className="text-[var(--brand-primary)] font-bold">{release.tagName}</span>
          <span>•</span>
          <span>{release.assets?.length || 0} ASSETS INCLUDED</span>
        </div>
      </div>
    )}
  />
);

export const AiTab = ({ owner, repo }) => {
  const { data, isLoading } = useQuery({
    queryKey: ['repo-ai', owner, repo],
    queryFn: async () => (await api.get(`/ai/${owner}/${repo}/assistant`)).data,
  });
  
  if (isLoading) return (
    <GlassCard className="p-12 text-center flex items-center justify-center border-t-[var(--brand-purple)]">
      <div className="flex flex-col items-center gap-4">
        <BrainCircuit size={48} className="text-[var(--brand-purple)] animate-pulse" />
        <span className="font-mono text-sm text-[var(--brand-purple)] tracking-widest">SYNTHESIZING_INTELLIGENCE...</span>
      </div>
    </GlassCard>
  );

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <motion.div variants={itemVariants} initial="hidden" animate="visible">
        <GlassCard className="p-6 h-full border-t-[var(--brand-purple)]">
          <h3 className="font-display font-bold mb-4 flex items-center gap-2">
            <Sparkles size={18} className="text-[var(--brand-purple)]" />
            SYNTHESIS: RECENT_COMMITS
          </h3>
          <div className="p-4 rounded-lg bg-[var(--bg-main)]/50 border border-[var(--glass-border)]">
            <pre className="whitespace-pre-wrap font-mono text-xs text-[var(--text-muted)] leading-relaxed font-medium">
              {data?.commitSummary || 'No recent commit data available for synthesis.'}
            </pre>
          </div>
        </GlassCard>
      </motion.div>
      
      <motion.div variants={itemVariants} initial="hidden" animate="visible">
        <GlassCard className="p-6 h-full border-t-[var(--brand-primary)]">
          <h3 className="font-display font-bold mb-4 flex items-center gap-2">
            <FileText size={18} className="text-[var(--brand-primary)]" />
            GENERATED_RELEASE_NOTES
          </h3>
          <div className="p-4 rounded-lg bg-[var(--bg-main)]/50 border border-[var(--glass-border)] prose prose-invert prose-sm max-w-none">
            <p className="text-sm text-[var(--text-main)] leading-relaxed">
              {data?.releaseNotes || 'Insufficient data to generate release notes.'}
            </p>
          </div>
        </GlassCard>
      </motion.div>
      
      <motion.div variants={itemVariants} initial="hidden" animate="visible">
        <GlassCard className="p-6 h-full border-t-[var(--brand-success)] relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
            <BarChart3 size={64} className="text-[var(--brand-success)]" />
          </div>
          <h3 className="font-display font-bold mb-6 flex items-center gap-2 relative z-10">
            <Activity size={18} className="text-[var(--brand-success)]" />
            PROJECT_HEALTH_SCORE
          </h3>
          <div className="flex flex-col items-center justify-center py-6 relative z-10">
            <div className="text-7xl font-display font-bold text-[var(--brand-success)] mb-6 drop-shadow-[0_0_15px_rgba(0,255,136,0.5)]">
              {data?.projectHealthScore || 'N/A'}
            </div>
            <div className="p-4 rounded-lg bg-[var(--brand-success)]/10 border border-[var(--brand-success)]/30 max-w-md text-center">
              <p className="text-sm font-mono text-[var(--brand-success)]">
                {data?.sprintAnalysis?.recommendation || 'No recommendation available.'}
              </p>
            </div>
          </div>
        </GlassCard>
      </motion.div>
      
      <motion.div variants={itemVariants} initial="hidden" animate="visible">
        <GlassCard className="p-6 h-full border-t-[var(--brand-warning)]">
          <h3 className="font-display font-bold mb-4 flex items-center gap-2">
            <Code2 size={18} className="text-[var(--brand-warning)]" />
            DOCUMENTATION_SCAFFOLDING
          </h3>
          <div className="max-h-[300px] overflow-auto cyber-scrollbar rounded-lg border border-[var(--glass-border)] bg-[#0a0a0f]">
            <pre className="p-4 whitespace-pre-wrap font-mono text-xs text-[#a0aabf] leading-relaxed">
              {data?.documentationGenerator || 'No documentation could be generated.'}
            </pre>
          </div>
        </GlassCard>
      </motion.div>
    </div>
  );
};
