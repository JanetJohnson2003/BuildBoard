import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import api from '../../lib/api';
import { GlassCard, NeonButton, CyberInput, CyberBadge } from '../ui';
import { 
  GitPullRequest, Activity, ShieldAlert, Users, 
  Lightbulb, Tag, MessageSquare, BrainCircuit,
  CheckCircle2, AlertTriangle, FileText, Play,
  BarChart3, Cpu, Sparkles, GitBranch, Code2, Edit2, Mic, Square, CreditCard, Heart
} from 'lucide-react';
import { listVariants, itemVariants } from '../../utils/animations';
import { ScrollReveal } from "../effects/ScrollReveal";
import ReactFlow, { Background, Controls, applyNodeChanges, applyEdgeChanges, addEdge } from 'reactflow';
import 'reactflow/dist/style.css';

const PRItem = ({ pr, owner, repo }) => {
  const [expanded, setExpanded] = useState(false);
  const [isReviewing, setIsReviewing] = useState(false);
  const [reviewResult, setReviewResult] = useState(null);
  const [persona, setPersona] = useState('Strict Security Auditor');
  const [isRecording, setIsRecording] = useState(false);
  const [audioUrl, setAudioUrl] = useState(null);
  const [predictionResult, setPredictionResult] = useState(null);
  const queryClient = useQueryClient();

  const toggleRecord = (e) => {
    e.stopPropagation();
    if (isRecording) {
      setIsRecording(false);
      setAudioUrl('https://actions.google.com/sounds/v1/alarms/beep_short.ogg');
    } else {
      setIsRecording(true);
      setAudioUrl(null);
    }
  };

  const handleReview = async (e) => {
    e.stopPropagation();
    setIsReviewing(true);
    setReviewResult(null);
    try {
      const res = await api.post(`/ai/${owner}/${repo}/pulls/${pr.number}/ai-review`, { persona });
      setReviewResult(res.data.comment);
      // Invalidate PR queries to update comment count
      queryClient.invalidateQueries({ queryKey: ['repo-prs', owner, repo] });
    } catch (e) {
      setReviewResult({ error: e.response?.data?.message || e.message || 'Failed to generate review' });
    } finally {
      setIsReviewing(false);
    }
  };

  return (
    <motion.div variants={itemVariants} className="group">
      <div 
        className="p-4 hover:bg-white/5 transition-colors cursor-pointer"
        onClick={() => setExpanded(!expanded)}
      >
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
              <span className="font-display font-bold text-base text-[var(--text-main)] group-hover:text-[var(--brand-primary)] transition-colors">
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

      {expanded && (
        <div className="px-11 pb-4 bg-black/20 border-t border-[var(--glass-border)]">
          <div className="mt-4 p-4 border border-[var(--brand-purple)]/30 rounded-lg bg-[var(--bg-tertiary)] space-y-4">
            <div className="flex items-center gap-2 text-sm font-display font-bold text-[var(--brand-purple)]">
              <BrainCircuit size={16} />
              AI Code Review Persona
            </div>
            
            <div className="flex items-center gap-3">
              <select 
                className="flex-1 bg-[#0a0a0f] border border-[var(--glass-border)] rounded p-2 text-sm font-mono text-white focus:border-[var(--brand-purple)] outline-none"
                value={persona}
                onChange={(e) => setPersona(e.target.value)}
                disabled={isReviewing}
                onClick={e => e.stopPropagation()}
              >
                <option value="Strict Security Auditor">Strict Security Auditor</option>
                <option value="Performance Guru">Performance Guru</option>
                <option value="Friendly Mentor">Friendly Mentor</option>
                <option value="Nitpicky Linter">Nitpicky Linter</option>
              </select>
              <NeonButton 
                variant="primary" 
                size="sm" 
                onClick={handleReview}
                disabled={isReviewing || pr.status !== 'open'}
              >
                {isReviewing ? 'Analyzing...' : 'Generate Review'}
              </NeonButton>
            </div>

            <div className="flex items-center gap-3 pt-3 border-t border-[var(--brand-purple)]/30">
              <NeonButton 
                variant={isRecording ? 'danger' : 'secondary'} 
                size="sm" 
                onClick={toggleRecord}
              >
                {isRecording ? <><Square size={14} className="mr-1 inline-block" /> STOP_RECORDING</> : <><Mic size={14} className="mr-1 inline-block" /> VOICE_REVIEW</>}
              </NeonButton>
              {isRecording && <span className="text-[var(--brand-danger)] animate-pulse font-mono text-xs font-bold">REC O</span>}
              {audioUrl && (
                <div className="flex items-center gap-2 bg-[#0a0a0f] p-1 px-2 rounded-full border border-[var(--glass-border)]">
                   <audio controls src={audioUrl} className="h-6 w-48" />
                   <NeonButton variant="primary" size="sm" onClick={(e) => { e.stopPropagation(); setAudioUrl(null); }}>ATTACH</NeonButton>
                </div>
              )}
            </div>

            {reviewResult && (
              <div className="mt-4 pt-4 border-t border-[var(--glass-border)]">
                {reviewResult.error ? (
                  <div className="text-[var(--brand-danger)] text-sm font-mono">{reviewResult.error}</div>
                ) : (
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-xs text-[var(--text-muted)]">
                      <img src={reviewResult.author?.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${reviewResult.author?.username}`} alt="AI" className="w-5 h-5 rounded-full" />
                      <span>Posted by {reviewResult.author?.username} (AI Persona)</span>
                    </div>
                    <div className="text-sm text-[var(--text-main)] whitespace-pre-wrap font-mono bg-black/30 p-3 rounded border border-[var(--glass-border)]">
                      {reviewResult.content}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Smart Pre-Flight PR Predictor */}
          <div className="mt-4 p-4 border border-[var(--brand-primary)]/30 rounded-lg bg-[var(--bg-tertiary)] space-y-4">
            <div className="flex items-center gap-2 text-sm font-display font-bold text-[var(--brand-primary)]">
              <Sparkles size={16} />
              Smart Pre-Flight PR Predictor
            </div>
            
            <div className="flex items-center gap-3">
              <NeonButton 
                variant="primary" 
                size="sm" 
                onClick={async (e) => {
                  e.stopPropagation();
                  setPredictionResult({ loading: true });
                  try {
                    const res = await api.post(`/ai/${owner}/${repo}/predict-pr`, { branch: pr.sourceBranch?.name || pr.sourceBranch, targetBranch: pr.targetBranch?.name || pr.targetBranch });
                    setPredictionResult({ data: res.data, loading: false });
                  } catch (e) {
                    setPredictionResult({ error: 'Failed to generate prediction', loading: false });
                  }
                }}
                disabled={predictionResult?.loading}
              >
                {predictionResult?.loading ? 'Predicting...' : 'Predict CI/CD Success'}
              </NeonButton>
            </div>

            {predictionResult?.error && (
              <div className="mt-4 text-[var(--brand-danger)] text-sm font-mono">{predictionResult.error}</div>
            )}

            {predictionResult?.data && !predictionResult?.loading && (
              <div className="mt-4 pt-4 border-t border-[var(--glass-border)] grid grid-cols-2 gap-4">
                <GlassCard className="p-3 bg-black/30">
                   <h4 className="text-xs font-bold text-[var(--text-muted)]">Build Pass Probability</h4>
                   <div className="text-2xl font-mono text-[var(--brand-success)]">{predictionResult.data.buildPassProbability}%</div>
                </GlassCard>
                <GlassCard className="p-3 bg-black/30">
                   <h4 className="text-xs font-bold text-[var(--text-muted)]">Test Pass Probability</h4>
                   <div className="text-2xl font-mono text-[var(--brand-success)]">{predictionResult.data.testPassProbability}%</div>
                </GlassCard>
                <GlassCard className="p-3 bg-black/30">
                   <h4 className="text-xs font-bold text-[var(--text-muted)]">Conflict Risk</h4>
                   <div className={`text-2xl font-mono ${predictionResult.data.mergeConflictRisk === 'High' ? 'text-[var(--brand-danger)]' : 'text-[var(--brand-warning)]'}`}>{predictionResult.data.mergeConflictRisk}</div>
                </GlassCard>
                <GlassCard className="p-3 bg-black/30">
                   <h4 className="text-xs font-bold text-[var(--text-muted)]">Est. Review Time</h4>
                   <div className="text-2xl font-mono text-white">{predictionResult.data.estimatedReviewTime}</div>
                </GlassCard>
                <div className="col-span-2 mt-2">
                   <h4 className="text-xs font-bold text-[var(--brand-primary)] mb-2">AI Suggestions:</h4>
                   <ul className="list-disc pl-5 space-y-1">
                     {predictionResult.data.suggestions?.map((s, i) => (
                       <li key={i} className="text-sm text-gray-300">{s}</li>
                     ))}
                   </ul>
                </div>
              </div>
            )}
          </div>

        </div>
      )}
    </motion.div>
  );
};

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
            <PRItem key={pr._id} pr={pr} owner={owner} repo={repo} />
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

const initialNodes = [
  { id: '1', type: 'input', data: { label: 'on: push/pr' }, position: { x: 250, y: 25 }, className: 'bg-black/50 text-white border border-[var(--brand-primary)] rounded px-4 py-2 font-mono text-xs' },
  { id: '2', data: { label: 'npm install' }, position: { x: 250, y: 125 }, className: 'bg-black/50 text-white border border-[var(--glass-border)] rounded px-4 py-2 font-mono text-xs' },
  { id: '3', type: 'output', data: { label: 'npm test' }, position: { x: 250, y: 225 }, className: 'bg-black/50 text-white border border-[var(--glass-border)] rounded px-4 py-2 font-mono text-xs' },
];

const initialEdges = [
  { id: 'e1-2', source: '1', target: '2', animated: true, style: { stroke: 'var(--brand-primary)' } },
  { id: 'e2-3', source: '2', target: '3', animated: true, style: { stroke: 'var(--brand-primary)' } },
];

export const ActionsTab = ({ owner, repo }) => {
  const queryClient = useQueryClient();
  const [workflow, setWorkflow] = useState({
    name: 'Build and test',
    yaml: 'name: Build and test\non: [push, pull_request]\njobs:\n  test:\n    runs-on: ubuntu-latest\n    steps:\n      - npm install\n      - npm test',
  });

  const [nodes, setNodes] = useState(initialNodes);
  const [edges, setEdges] = useState(initialEdges);

  const onNodesChange = React.useCallback((changes) => setNodes((nds) => applyNodeChanges(changes, nds)), []);
  const onEdgesChange = React.useCallback((changes) => setEdges((eds) => applyEdgeChanges(changes, eds)), []);
  const onConnect = React.useCallback((params) => setEdges((eds) => addEdge(params, eds)), []);

  // Update YAML when nodes change
  React.useEffect(() => {
    const steps = nodes.filter(n => n.id !== '1').map(n => `      - ${n.data.label}`).join('\n');
    const generatedYaml = `name: ${workflow.name}\non: [push, pull_request]\njobs:\n  test:\n    runs-on: ubuntu-latest\n    steps:\n${steps}`;
    setWorkflow(curr => ({ ...curr, yaml: generatedYaml }));
  }, [nodes, workflow.name]);

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

        {/* Visual Workflow Builder */}
        <GlassCard className="p-0 overflow-hidden border-t-[var(--brand-warning)]">
          <div className="border-b border-[var(--glass-border)] px-6 py-4 bg-black/40 flex justify-between items-center">
            <div className="flex items-center gap-2">
              <Edit2 size={18} className="text-[var(--brand-warning)]" />
              <h3 className="font-display font-bold">Visual CI/CD Builder</h3>
            </div>
            <NeonButton variant="primary" onClick={() => createWorkflow.mutate()} disabled={createWorkflow.isPending} className="py-1 px-3 text-xs">
               {createWorkflow.isPending ? 'SAVING...' : 'SAVE WORKFLOW'}
            </NeonButton>
          </div>
          <div className="h-[400px] w-full bg-[#0a0a0f]">
            <ReactFlow
              nodes={nodes}
              edges={edges}
              onNodesChange={onNodesChange}
              onEdgesChange={onEdgesChange}
              onConnect={onConnect}
              fitView
              className="react-flow-cyber"
            >
              <Background color="#fff" gap={16} opacity={0.05} />
              <Controls className="bg-black/50 border border-[var(--glass-border)] fill-white" />
            </ReactFlow>
          </div>
          <div className="p-4 border-t border-[var(--glass-border)] bg-black/40">
            <details>
               <summary className="text-xs font-mono text-[var(--text-muted)] cursor-pointer hover:text-white">View Generated YAML</summary>
               <pre className="mt-2 text-[10px] font-mono text-[var(--brand-primary)] whitespace-pre-wrap">{workflow.yaml}</pre>
            </details>
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

export const SimpleListTab = ({ title, icon: Icon, queryKey, queryFn, empty, render, glowColor = "var(--brand-primary)", headerRight }) => {
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
      <div className="border-b border-[var(--glass-border)] px-6 py-4 bg-black/40 flex items-center justify-between">
        <div className="flex items-center gap-2">
          {Icon && <Icon size={18} style={{ color: glowColor }} />}
          <h3 className="font-display font-bold uppercase tracking-wider">{title}</h3>
        </div>
        {headerRight && <div>{headerRight}</div>}
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

      <ScrollReveal delay={0.4}>
        <GlassCard className="p-6">
          <h3 className="font-display font-bold mb-6 flex items-center gap-2">
            <Activity size={18} className="text-[var(--brand-warning)]" />
            DEVELOPER_VELOCITY_HEATMAP
          </h3>
          <div className="flex gap-8">
            <div className="w-2/3">
              <div className="text-xs font-mono text-[var(--text-muted)] mb-4 flex justify-between">
                <span>Commits over Time (Simulated)</span>
                <span className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded bg-black/50 border border-[var(--glass-border)]"></span> Low
                  <span className="w-2 h-2 rounded bg-[var(--brand-warning)] opacity-50"></span> Med
                  <span className="w-2 h-2 rounded bg-[var(--brand-warning)] shadow-[0_0_8px_var(--brand-warning)]"></span> High
                </span>
              </div>
              <div className="flex gap-2">
                <div className="flex flex-col justify-between text-[10px] font-mono text-[var(--text-muted)] py-1">
                  <span>Mon</span><span>Wed</span><span>Fri</span><span>Sun</span>
                </div>
                <div className="flex-1 grid grid-cols-[repeat(24,1fr)] gap-1">
                  {[...Array(7)].map((_, dayIdx) => (
                    [...Array(24)].map((_, hourIdx) => {
                      const intensity = Math.random();
                      return (
                        <div 
                          key={`${dayIdx}-${hourIdx}`} 
                          className={`w-full aspect-square rounded-sm ${intensity > 0.8 ? 'bg-[var(--brand-warning)] shadow-[0_0_5px_var(--brand-warning)]' : intensity > 0.4 ? 'bg-[var(--brand-warning)]/50' : 'bg-black/40 border border-[var(--glass-border)]'}`}
                          title={`Day ${dayIdx}, Hour ${hourIdx}`}
                        />
                      );
                    })
                  ))}
                </div>
              </div>
              <div className="flex justify-between text-[10px] font-mono text-[var(--text-muted)] mt-2 ml-8">
                <span>00:00</span><span>06:00</span><span>12:00</span><span>18:00</span><span>23:59</span>
              </div>
            </div>

            <div className="w-1/3 flex flex-col justify-center gap-6 border-l border-[var(--glass-border)] pl-8">
               <div className="space-y-1">
                 <h4 className="text-xs font-mono text-[var(--text-muted)]">Avg PR Time-to-Merge</h4>
                 <div className="text-3xl font-display font-bold text-[var(--brand-warning)]">4h 12m</div>
               </div>
               <div className="space-y-1">
                 <h4 className="text-xs font-mono text-[var(--text-muted)]">Lines of Code Added (30d)</h4>
                 <div className="text-3xl font-display font-bold text-[var(--brand-success)]">+12,408</div>
               </div>
               <div className="space-y-1">
                 <h4 className="text-xs font-mono text-[var(--text-muted)]">Lines of Code Deleted (30d)</h4>
                 <div className="text-3xl font-display font-bold text-[var(--brand-danger)]">-4,210</div>
               </div>
            </div>
          </div>
        </GlassCard>
      </ScrollReveal>
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

export const DiscussionsTab = ({ owner, repo }) => {
  const [isCreating, setIsCreating] = useState(false);
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [category, setCategory] = useState('general');
  const queryClient = useQueryClient();

  const createDiscussion = useMutation({
    mutationFn: async () => (await api.post(`/repos/${owner}/${repo}/discussions`, { title, body, category })).data,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['repo-discussions', owner, repo] });
      setIsCreating(false);
      setTitle('');
      setBody('');
      setCategory('general');
    },
  });

  if (isCreating) {
    return (
      <GlassCard className="p-6 border-t-[var(--brand-primary)]">
        <h3 className="font-display font-bold mb-4 flex items-center gap-2">
          <MessageSquare size={18} className="text-[var(--brand-primary)]" />
          START_NEW_COMMUNICATION
        </h3>
        <form onSubmit={(e) => { e.preventDefault(); createDiscussion.mutate(); }} className="space-y-4">
          <CyberInput 
            label="Title"
            value={title} 
            onChange={(e) => setTitle(e.target.value)} 
            placeholder="What is this discussion about?"
            required
          />
          <div className="space-y-1">
            <label className="text-xs font-mono text-[var(--text-muted)] pl-1 block">Category</label>
            <select 
              className="w-full bg-[#0a0a0f] border border-[var(--glass-border)] rounded-lg p-3 text-sm font-mono text-white focus:border-[var(--brand-primary)] outline-none transition-all"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
            >
              <option value="general">General</option>
              <option value="ideas">Ideas</option>
              <option value="qna">Q&A</option>
              <option value="showandtell">Show & Tell</option>
            </select>
          </div>
          <div className="space-y-1">
            <label className="text-xs font-mono text-[var(--text-muted)] pl-1 block">Message body</label>
            <textarea 
              className="w-full bg-[#0a0a0f] border border-[var(--glass-border)] rounded-lg p-4 text-sm font-mono text-[#c9d1d9] min-h-[200px] focus:border-[var(--brand-primary)] focus:ring-1 focus:ring-[var(--brand-primary)]/50 outline-none transition-all resize-y cyber-scrollbar"
              value={body} 
              onChange={(e) => setBody(e.target.value)} 
              placeholder="Provide details here..."
            />
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <NeonButton variant="ghost" type="button" onClick={() => setIsCreating(false)}>
              CANCEL
            </NeonButton>
            <NeonButton variant="primary" type="submit" disabled={createDiscussion.isPending || !title.trim()}>
              {createDiscussion.isPending ? 'TRANSMITTING...' : 'START_DISCUSSION'}
            </NeonButton>
          </div>
        </form>
      </GlassCard>
    );
  }

  return (
    <SimpleListTab
      title="Communications Network"
      icon={MessageSquare}
      glowColor="var(--brand-primary)"
      queryKey={['repo-discussions', owner, repo]}
      queryFn={async () => (await api.get(`/repos/${owner}/${repo}/discussions`)).data}
      empty="No active communications found."
      headerRight={
        <NeonButton variant="primary" size="sm" onClick={() => setIsCreating(true)}>
          START_DISCUSSION
        </NeonButton>
      }
      render={(discussion) => (
        <div className="p-5 hover:bg-white/5 transition-colors group cursor-pointer">
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
};

const ReleaseSlideshowModal = ({ owner, repo, release, onClose }) => {
  const [currentSlide, setCurrentSlide] = useState(0);
  
  const { data, isLoading, error } = useQuery({
    queryKey: ['release-slideshow', owner, repo, release.tagName],
    queryFn: async () => (await api.post(`/ai/${owner}/${repo}/releases/${release.tagName}/slideshow`)).data,
    refetchOnWindowFocus: false,
  });

  if (isLoading) {
    return (
      <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 backdrop-blur-md">
        <div className="text-center animate-pulse flex flex-col items-center">
           <BrainCircuit size={64} className="text-[var(--brand-primary)] mb-4 animate-[spin_3s_linear_infinite]" />
           <h2 className="text-2xl font-display font-bold text-white">GENERATING_SLIDESHOW...</h2>
        </div>
      </div>
    );
  }

  if (error) {
    return (
       <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 backdrop-blur-md">
         <GlassCard className="p-8 max-w-lg w-full text-center">
            <AlertTriangle size={48} className="text-[var(--brand-danger)] mx-auto mb-4" />
            <h2 className="text-xl font-display font-bold mb-4">GENERATION_FAILED</h2>
            <p className="text-sm font-mono text-[var(--text-muted)] mb-6">{error?.response?.data?.message || error.message}</p>
            <NeonButton variant="primary" onClick={onClose}>CLOSE</NeonButton>
         </GlassCard>
       </div>
    );
  }

  const slides = data?.slides || [];

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/95 backdrop-blur-xl">
      <button className="absolute top-6 right-6 text-[var(--text-muted)] hover:text-white transition-colors" onClick={onClose}>
        <span className="font-mono text-sm">[ ESC ]</span>
      </button>

      <div className="w-full max-w-5xl px-8 flex items-center justify-between">
        <button 
          className="p-4 bg-white/5 hover:bg-white/10 rounded-full transition-colors disabled:opacity-30"
          onClick={() => setCurrentSlide(s => Math.max(0, s - 1))}
          disabled={currentSlide === 0}
        >
          <span className="font-bold text-xl">{'<'}</span>
        </button>

        <motion.div 
          key={currentSlide}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          className="flex-1 px-12 text-center"
        >
          {slides[currentSlide] && (
            <div className="space-y-8">
              <h2 className="text-5xl md:text-6xl font-display font-black text-transparent bg-clip-text bg-gradient-to-r from-[var(--brand-primary)] to-[var(--brand-purple)]">
                {slides[currentSlide].title}
              </h2>
              <div className="text-xl md:text-2xl font-mono text-[#a0aabf] leading-relaxed max-w-3xl mx-auto whitespace-pre-wrap">
                {slides[currentSlide].content}
              </div>
            </div>
          )}
        </motion.div>

        <button 
          className="p-4 bg-white/5 hover:bg-white/10 rounded-full transition-colors disabled:opacity-30"
          onClick={() => setCurrentSlide(s => Math.min(slides.length - 1, s + 1))}
          disabled={currentSlide === slides.length - 1}
        >
          <span className="font-bold text-xl">{'>'}</span>
        </button>
      </div>

      <div className="absolute bottom-8 left-0 right-0 flex justify-center gap-3">
        {slides.map((_, i) => (
          <button 
            key={i} 
            className={`w-3 h-3 rounded-full transition-all ${i === currentSlide ? 'bg-[var(--brand-primary)] scale-125 shadow-[0_0_10px_var(--brand-primary)]' : 'bg-white/20'}`}
            onClick={() => setCurrentSlide(i)}
          />
        ))}
      </div>
    </div>
  );
};

export const ReleasesTab = ({ owner, repo }) => {
  const [slideshowRelease, setSlideshowRelease] = useState(null);
  
  const { data: releases, isLoading } = useQuery({
    queryKey: ['repo-releases', owner, repo],
    queryFn: async () => (await api.get(`/repos/${owner}/${repo}/releases`)).data,
  });

  if (isLoading) return <div className="p-12 text-center font-mono text-[var(--brand-primary)] animate-pulse">LOADING_RELEASES...</div>;

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 mb-4 border-b border-[var(--glass-border)] pb-4">
        <Tag className="text-[var(--brand-success)]" />
        <h2 className="text-xl font-display font-bold">DEPLOYMENT_PACKAGES</h2>
      </div>
      
      {(!releases || releases.length === 0) ? (
        <GlassCard className="p-12 text-center text-[var(--text-muted)] font-mono">NO_STABLE_DEPLOYMENTS_FOUND</GlassCard>
      ) : (
        releases.map((release) => (
          <GlassCard key={release._id || release.tagName} className="p-5 hover:border-[var(--brand-success)] transition-colors group">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3 mb-2">
                <Tag size={16} className="text-[var(--brand-success)]" />
                <div className="font-display font-bold text-lg text-[var(--text-main)] group-hover:text-white transition-colors">
                  {release.title || release.name || release.tagName}
                </div>
                {release.isPrerelease ? (
                  <CyberBadge variant="warning" size="sm">PRE-RELEASE</CyberBadge>
                ) : (
                  <CyberBadge variant="success" size="sm">STABLE</CyberBadge>
                )}
              </div>
              <NeonButton variant="secondary" onClick={() => setSlideshowRelease(release)} className="py-1 px-3 text-xs">
                <Play size={14} className="mr-1 inline-block" /> PLAY_SLIDESHOW
              </NeonButton>
            </div>
            <div className="flex items-center gap-4 text-xs font-mono text-[var(--text-muted)] ml-7 mt-2">
              <span className="text-[var(--brand-primary)] font-bold">{release.tagName}</span>
              <span>•</span>
              <span>{release.assets?.length || 0} ASSETS INCLUDED</span>
            </div>
          </GlassCard>
        ))
      )}

      {slideshowRelease && (
        <ReleaseSlideshowModal 
          owner={owner} 
          repo={repo} 
          release={slideshowRelease} 
          onClose={() => setSlideshowRelease(null)} 
        />
      )}
    </div>
  );
};

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

export const SnippetsTab = ({ owner, repo }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [code, setCode] = useState('');
  const [language, setLanguage] = useState('javascript');
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['repo-snippets', owner, repo],
    queryFn: async () => {
      const { data } = await api.get(`/repos/${owner}/${repo}/snippets`);
      return data;
    },
  });

  const mutation = useMutation({
    mutationFn: async () => {
      await api.post(`/repos/${owner}/${repo}/snippets`, { title, description, code, language });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['repo-snippets', owner, repo] });
      setIsModalOpen(false);
      setTitle('');
      setDescription('');
      setCode('');
      setLanguage('javascript');
    }
  });

  if (isLoading) {
    return (
      <GlassCard className="p-12 text-center flex items-center justify-center">
        <div className="animate-pulse flex items-center gap-3">
          <div className="w-5 h-5 rounded-full border-2 border-[var(--brand-primary)] border-t-transparent animate-spin" />
          <span className="font-mono text-sm text-[var(--brand-primary)]">LOADING_SNIPPETS...</span>
        </div>
      </GlassCard>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center bg-[var(--bg-tertiary)] border border-[var(--glass-border)] rounded-lg p-4">
        <h3 className="text-lg font-display font-bold flex items-center gap-2">
          <Code2 className="text-[var(--brand-primary)]" />
          SMART_SNIPPET_VAULT
        </h3>
        <NeonButton variant="primary" onClick={() => setIsModalOpen(true)} className="py-1.5 px-4 text-xs flex items-center gap-1.5">
          <Plus size={14} /> NEW_SNIPPET
        </NeonButton>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {(data || []).map((snippet) => (
          <GlassCard key={snippet._id} className="p-4 flex flex-col gap-3 group">
            <div className="flex justify-between items-start">
              <div>
                <h4 className="font-display font-bold text-white group-hover:text-[var(--brand-primary)] transition-colors">{snippet.title}</h4>
                <p className="text-xs text-[var(--text-muted)] mt-1">{snippet.description}</p>
              </div>
              <CyberBadge variant="neutral" size="sm">{snippet.language}</CyberBadge>
            </div>
            
            <div className="relative mt-2">
              <pre className="bg-[#0a0a0f] p-3 rounded text-xs font-mono text-[var(--text-main)] overflow-x-auto border border-[var(--glass-border)] max-h-48 overflow-y-auto cyber-scrollbar">
                {snippet.code}
              </pre>
              <button 
                className="absolute top-2 right-2 p-1.5 bg-[var(--bg-tertiary)] hover:bg-white/10 rounded border border-[var(--glass-border)] transition-colors opacity-0 group-hover:opacity-100"
                onClick={() => {
                  navigator.clipboard.writeText(snippet.code);
                  alert('Copied to clipboard!');
                }}
              >
                <Code2 size={14} className="text-[var(--text-muted)]" />
              </button>
            </div>
            
            <div className="flex items-center gap-2 text-[10px] font-mono text-[var(--text-muted)] mt-auto pt-2 border-t border-[var(--glass-border)]">
              <img src={snippet.author?.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${snippet.author?.username}`} className="w-4 h-4 rounded-full" alt="author" />
              <span>Added by {snippet.author?.username}</span>
            </div>
          </GlassCard>
        ))}
      </div>
      
      {data?.length === 0 && (
        <div className="p-12 text-center flex flex-col items-center justify-center border border-dashed border-[var(--glass-border)] rounded-lg">
          <Code2 size={48} className="text-[var(--text-muted)] opacity-30 mb-4" />
          <h3 className="text-xl font-bold mb-2">VAULT_EMPTY</h3>
          <p className="text-sm text-[var(--text-muted)] font-mono">Store frequently used code snippets for your team.</p>
        </div>
      )}

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setIsModalOpen(false)} />
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="relative w-full max-w-2xl">
            <GlassCard className="p-0 overflow-hidden border-t-[var(--brand-primary)]">
              <div className="p-6 space-y-4">
                <h2 className="text-xl font-display font-bold mb-4">SAVE_SNIPPET</h2>
                
                <input 
                  placeholder="Snippet Title" 
                  value={title} onChange={e => setTitle(e.target.value)}
                  className="w-full bg-black/40 border border-[var(--glass-border)] rounded p-2 text-sm font-mono text-white focus:border-[var(--brand-primary)] outline-none"
                />
                <input 
                  placeholder="Short description (optional)" 
                  value={description} onChange={e => setDescription(e.target.value)}
                  className="w-full bg-black/40 border border-[var(--glass-border)] rounded p-2 text-sm font-mono text-[var(--text-muted)] outline-none"
                />
                <input 
                  placeholder="Language (e.g. javascript, python)" 
                  value={language} onChange={e => setLanguage(e.target.value)}
                  className="w-full bg-black/40 border border-[var(--glass-border)] rounded p-2 text-sm font-mono text-[var(--text-muted)] outline-none"
                />
                <textarea 
                  placeholder="Paste code here..." 
                  value={code} onChange={e => setCode(e.target.value)}
                  className="w-full bg-[#0a0a0f] border border-[var(--glass-border)] rounded p-3 min-h-[200px] text-sm font-mono text-white focus:border-[var(--brand-primary)] outline-none resize-y"
                />
              </div>
              <div className="border-t border-[var(--glass-border)] px-6 py-4 flex justify-end gap-3 bg-black/20">
                <NeonButton variant="ghost" onClick={() => setIsModalOpen(false)}>CANCEL</NeonButton>
                <NeonButton variant="primary" onClick={() => mutation.mutate()} disabled={!title || !code || mutation.isPending}>
                  {mutation.isPending ? 'SAVING...' : 'SAVE_TO_VAULT'}
                </NeonButton>
              </div>
            </GlassCard>
          </motion.div>
        </div>
      )}
    </div>
  );
};

export const WalkthroughsTab = ({ owner, repo }) => {
  const storageKey = `buildboard-walkthroughs-${owner}-${repo}`;
  const [walkthroughs, setWalkthroughs] = useState(() => JSON.parse(localStorage.getItem(storageKey)) || []);
  const [isCreating, setIsCreating] = useState(false);
  const [newWalkthrough, setNewWalkthrough] = useState({ id: Date.now(), title: '', description: '', steps: [] });
  const [newStep, setNewStep] = useState({ file: '', line: '', content: '', description: '' });
  const [playing, setPlaying] = useState(null);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);

  const save = (data) => {
    setWalkthroughs(data);
    localStorage.setItem(storageKey, JSON.stringify(data));
  };

  const handleAddStep = () => {
    if (!newStep.file || !newStep.description) return;
    setNewWalkthrough(prev => ({ ...prev, steps: [...prev.steps, { ...newStep, id: Date.now() }] }));
    setNewStep({ file: '', line: '', content: '', description: '' });
  };

  const handleSaveWalkthrough = () => {
    if (!newWalkthrough.title) return;
    save([...walkthroughs, newWalkthrough]);
    setIsCreating(false);
    setNewWalkthrough({ id: Date.now(), title: '', description: '', steps: [] });
  };

  if (playing) {
    const step = playing.steps[currentStepIndex];
    if (!step) return null;
    return (
      <div className="space-y-6">
        <GlassCard className="p-6 border-l-4 border-l-[var(--brand-primary)] bg-gradient-to-r from-[var(--bg-tertiary)] to-[var(--bg-main)]">
           <div className="flex justify-between items-center mb-6">
              <div>
                 <h2 className="text-2xl font-display font-bold text-white">{playing.title}</h2>
                 <p className="text-[var(--brand-primary)] font-mono text-sm mt-1">STEP {currentStepIndex + 1} OF {playing.steps.length}</p>
              </div>
              <NeonButton variant="ghost" onClick={() => setPlaying(null)}>EXIT_WALKTHROUGH</NeonButton>
           </div>
           
           <div className="grid lg:grid-cols-[1fr_300px] gap-6">
              <div className="bg-[#0a0a0f] border border-[var(--glass-border)] rounded-lg overflow-hidden">
                 <div className="bg-white/5 px-4 py-2 border-b border-[var(--glass-border)] font-mono text-xs flex gap-2 items-center">
                    <FileText size={14} className="text-[var(--brand-warning)]" />
                    <span className="text-white">{step.file}</span>
                    {step.line && <span className="text-[var(--text-muted)]">LINE: {step.line}</span>}
                 </div>
                 <div className="p-4 overflow-x-auto">
                    <pre className="text-sm font-mono text-[var(--brand-primary)]">{step.content || '// Code snippet not provided'}</pre>
                 </div>
              </div>
              <div className="space-y-4">
                 <div className="p-4 bg-white/5 rounded-lg border border-[var(--brand-primary)]/30 text-sm leading-relaxed text-white">
                    {step.description}
                 </div>
                 <div className="flex gap-2 justify-between mt-auto">
                    <NeonButton 
                      variant="secondary" 
                      disabled={currentStepIndex === 0} 
                      onClick={() => setCurrentStepIndex(i => i - 1)}
                    >PREV</NeonButton>
                    <NeonButton 
                      variant="primary" 
                      disabled={currentStepIndex === playing.steps.length - 1} 
                      onClick={() => setCurrentStepIndex(i => i + 1)}
                    >NEXT</NeonButton>
                 </div>
              </div>
           </div>
        </GlassCard>
      </div>
    );
  }

  if (isCreating) {
    return (
      <GlassCard className="p-6 space-y-6">
        <div className="flex items-center gap-2 mb-6 border-b border-[var(--glass-border)] pb-4">
          <Edit2 className="text-[var(--brand-warning)]" />
          <h2 className="text-xl font-display font-bold">CREATE_WALKTHROUGH</h2>
        </div>
        
        <div className="space-y-4">
          <CyberInput placeholder="Walkthrough Title" value={newWalkthrough.title} onChange={e => setNewWalkthrough({...newWalkthrough, title: e.target.value})} />
          <CyberInput placeholder="Description" value={newWalkthrough.description} onChange={e => setNewWalkthrough({...newWalkthrough, description: e.target.value})} />
        </div>

        <div className="mt-8 p-4 bg-black/40 border border-[var(--glass-border)] rounded-lg">
          <h3 className="font-mono text-sm text-[var(--brand-primary)] mb-4">Steps ({newWalkthrough.steps.length})</h3>
          <div className="space-y-2 mb-4">
            {newWalkthrough.steps.map((s, i) => (
              <div key={s.id} className="p-2 bg-white/5 rounded text-xs font-mono border border-[var(--glass-border)]">
                 <span className="text-[var(--brand-warning)] mr-2">{i+1}.</span>
                 {s.file} {s.line && `L${s.line}`} - {s.description}
              </div>
            ))}
          </div>
          <div className="space-y-3 p-4 bg-[var(--bg-tertiary)] rounded border border-dashed border-[var(--glass-border)]">
             <div className="grid grid-cols-2 gap-3">
               <CyberInput placeholder="File Path" value={newStep.file} onChange={e => setNewStep({...newStep, file: e.target.value})} />
               <CyberInput placeholder="Line Number" value={newStep.line} onChange={e => setNewStep({...newStep, line: e.target.value})} />
             </div>
             <textarea 
                placeholder="Code Snippet" 
                className="w-full bg-[#0a0a0f] border border-[var(--glass-border)] rounded-lg p-3 text-xs font-mono focus:border-[var(--brand-primary)] outline-none"
                value={newStep.content} onChange={e => setNewStep({...newStep, content: e.target.value})} 
             />
             <textarea 
                placeholder="Explanation for this step" 
                className="w-full bg-[#0a0a0f] border border-[var(--glass-border)] rounded-lg p-3 text-xs focus:border-[var(--brand-primary)] outline-none"
                value={newStep.description} onChange={e => setNewStep({...newStep, description: e.target.value})} 
             />
             <NeonButton variant="ghost" className="w-full" onClick={handleAddStep}>ADD_STEP</NeonButton>
          </div>
        </div>

        <div className="flex gap-3 justify-end pt-4">
           <NeonButton variant="ghost" onClick={() => setIsCreating(false)}>CANCEL</NeonButton>
           <NeonButton variant="primary" onClick={handleSaveWalkthrough}>SAVE_WALKTHROUGH</NeonButton>
        </div>
      </GlassCard>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-4 border-b border-[var(--glass-border)] pb-4">
        <div className="flex items-center gap-2">
          <Play className="text-[var(--brand-primary)]" />
          <h2 className="text-xl font-display font-bold">INTERACTIVE_WALKTHROUGHS</h2>
        </div>
        <NeonButton variant="primary" onClick={() => setIsCreating(true)} className="py-1 px-3 text-xs">
          <Plus size={14} className="mr-1 inline-block" /> NEW_WALKTHROUGH
        </NeonButton>
      </div>

      {walkthroughs.length === 0 ? (
        <GlassCard className="p-12 text-center text-[var(--text-muted)] font-mono">NO_WALKTHROUGHS_FOUND</GlassCard>
      ) : (
        walkthroughs.map(w => (
          <GlassCard key={w.id} className="p-5 hover:border-[var(--brand-primary)] transition-colors group flex justify-between items-center">
             <div>
                <h3 className="font-display font-bold text-lg text-[var(--text-main)] group-hover:text-white">{w.title}</h3>
                <p className="text-sm text-[var(--text-muted)] mt-1">{w.description}</p>
                <p className="text-xs font-mono text-[var(--brand-warning)] mt-2">{w.steps.length} STEPS</p>
             </div>
             <NeonButton variant="secondary" onClick={() => { setPlaying(w); setCurrentStepIndex(0); }}>
               <Play size={16} className="mr-2" /> PLAY
             </NeonButton>
          </GlassCard>
        ))
      )}
    </div>
  );
};

export const SponsorshipTab = ({ owner, repo }) => {
  const [isSubscribed, setIsSubscribed] = useState(false);
  const tiers = [
    { name: 'Supporter', price: 5, benefits: ['Profile Badge', 'Priority Issue Triage'] },
    { name: 'Sponsor', price: 20, benefits: ['Supporter Benefits', 'Access to Sponsor-only Branches', 'Private Q&A'] },
    { name: 'Enterprise', price: 100, benefits: ['Sponsor Benefits', '1hr Consulting/Month', 'Logo in README'] }
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3 border-b border-[var(--glass-border)] pb-4">
        <Heart className="text-[var(--brand-danger)]" />
        <h2 className="text-xl font-display font-bold">SPONSOR & SUBSCRIBE</h2>
      </div>
      
      <p className="text-sm text-[var(--text-muted)] max-w-2xl">
        Support the developers of this repository by subscribing to a tier. Gain exclusive access to premium branches, priority issue triage, and more!
      </p>

      <div className="grid md:grid-cols-3 gap-6 mt-8">
        {tiers.map(tier => (
          <GlassCard key={tier.name} className="p-6 border-t-4 border-t-[var(--brand-primary)] flex flex-col group hover:border-[var(--brand-primary)] transition-colors">
             <h3 className="text-xl font-bold mb-2 text-white">{tier.name}</h3>
             <div className="text-3xl font-mono text-[var(--brand-success)] mb-6">
                ${tier.price} <span className="text-sm text-[var(--text-muted)]">/ mo</span>
             </div>
             
             <ul className="space-y-3 mb-8 flex-1">
               {tier.benefits.map(b => (
                 <li key={b} className="text-sm text-gray-300 flex items-start gap-2">
                    <CheckCircle2 size={16} className="text-[var(--brand-primary)] shrink-0 mt-0.5" />
                    {b}
                 </li>
               ))}
             </ul>
             
             <NeonButton 
               variant={tier.name === 'Sponsor' ? 'primary' : 'secondary'} 
               className="w-full flex items-center justify-center gap-2"
               onClick={() => {
                 alert(`Simulated Stripe Checkout for ${tier.name} tier at $${tier.price}/mo`);
                 setIsSubscribed(true);
               }}
             >
               <CreditCard size={16} /> SUBSCRIBE
             </NeonButton>
          </GlassCard>
        ))}
      </div>
      
      {isSubscribed && (
        <GlassCard className="mt-8 p-6 border-l-4 border-l-[var(--brand-success)] bg-green-500/10">
           <h3 className="text-lg font-bold text-[var(--brand-success)]">🎉 Thank you for subscribing!</h3>
           <p className="text-sm text-gray-300 mt-2">You now have access to exclusive features on this repository.</p>
        </GlassCard>
      )}
    </div>
  );
};

export const RiskRadarTab = ({ owner, repo }) => {
  const { data, isLoading, error } = useQuery({
    queryKey: ['dependency-health', owner, repo],
    queryFn: async () => {
      const res = await api.get(`/repos/${owner}/${repo}/health/dependencies`);
      return res.data;
    }
  });

  if (isLoading) return <div className="p-12 text-center font-mono">SCANNING_DEPENDENCIES...</div>;
  if (error) return <div className="p-12 text-center font-mono text-[var(--brand-danger)]">ERROR_FETCHING_DEPENDENCIES</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3 border-b border-[var(--glass-border)] pb-4">
        <ShieldAlert className="text-[var(--brand-warning)]" />
        <h2 className="text-xl font-display font-bold">DEPENDENCY RISK RADAR</h2>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
         <GlassCard className="p-6 flex flex-col items-center justify-center border-t-4 border-t-[var(--brand-warning)]">
            <h3 className="font-mono text-[var(--text-muted)] mb-2">OVERALL RISK SCORE</h3>
            <div className={`text-6xl font-bold font-display ${data.overallRiskScore > 70 ? 'text-[var(--brand-danger)]' : data.overallRiskScore > 30 ? 'text-[var(--brand-warning)]' : 'text-[var(--brand-success)]'}`}>
               {data.overallRiskScore}
            </div>
            <p className="text-sm mt-4 text-center text-[var(--text-muted)]">
               Scores above 70 indicate critical vulnerabilities or heavily outdated packages.
            </p>
         </GlassCard>

         <div className="space-y-3">
            {data.dependencies.map(dep => (
               <div key={dep.name} className={`p-4 border rounded-lg bg-[#0a0a0f] ${dep.riskScore > 70 ? 'border-[var(--brand-danger)]/50' : dep.riskScore > 30 ? 'border-[var(--brand-warning)]/50' : 'border-[var(--brand-success)]/50'}`}>
                  <div className="flex justify-between items-center mb-2">
                     <span className="font-bold text-white font-mono">{dep.name} <span className="text-xs text-[var(--text-muted)]">v{dep.version}</span></span>
                     <CyberBadge variant={dep.riskScore > 70 ? 'danger' : dep.riskScore > 30 ? 'warning' : 'success'} size="sm">
                        {dep.status.toUpperCase()}
                     </CyberBadge>
                  </div>
                  <div className="flex justify-between items-center text-xs font-mono">
                     <span className="text-[var(--text-muted)]">Risk: {dep.riskScore}/100</span>
                     {dep.cve && <span className="text-[var(--brand-danger)]">{dep.cve}</span>}
                  </div>
               </div>
            ))}
         </div>
      </div>
    </div>
  );
};

import { Canvas } from '@react-three/fiber';
import { OrbitControls, Stars, Text } from '@react-three/drei';

const GalaxyNode = ({ position, name, isDir, onClick }) => {
  return (
    <group position={position} onClick={onClick}>
      <mesh>
        <sphereGeometry args={[isDir ? 1.5 : 0.5, 32, 32]} />
        <meshStandardMaterial color={isDir ? '#FFB800' : '#8B5CF6'} emissive={isDir ? '#FFB800' : '#8B5CF6'} emissiveIntensity={0.5} />
      </mesh>
      <Text position={[0, isDir ? 2 : 1, 0]} fontSize={0.5} color="white" anchorX="center" anchorY="middle">
        {name}
      </Text>
    </group>
  );
};

export const GitGalaxyTab = ({ owner, repo }) => {
  const nodes = [
    { id: 'root', name: repo, isDir: true, position: [0, 0, 0] },
    { id: 'src', name: 'src', isDir: true, position: [5, 2, -5] },
    { id: 'public', name: 'public', isDir: true, position: [-5, -2, 5] },
    { id: 'index.js', name: 'index.js', isDir: false, position: [7, 3, -6] },
    { id: 'App.jsx', name: 'App.jsx', isDir: false, position: [6, 1, -4] },
    { id: 'logo.png', name: 'logo.png', isDir: false, position: [-6, -3, 6] },
    { id: 'package.json', name: 'package.json', isDir: false, position: [0, 2, 2] },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3 border-b border-[var(--glass-border)] pb-4">
        <Sparkles className="text-[var(--brand-purple)]" />
        <h2 className="text-xl font-display font-bold">GIT GALAXY (3D EXPLORER)</h2>
      </div>

      <div className="h-[600px] w-full rounded-xl overflow-hidden border border-[var(--brand-primary)]/30 relative bg-black">
         <div className="absolute top-4 left-4 z-10 bg-black/50 p-3 rounded backdrop-blur border border-[var(--glass-border)]">
           <h3 className="text-sm font-bold font-mono text-[var(--brand-primary)]">GALAXY NAVIGATION</h3>
           <p className="text-xs text-gray-400 mt-1">Drag to rotate • Scroll to zoom</p>
         </div>
         <Canvas camera={{ position: [0, 5, 15], fov: 60 }}>
            <color attach="background" args={['#050505']} />
            <ambientLight intensity={0.5} />
            <pointLight position={[10, 10, 10]} intensity={1} />
            <Stars radius={100} depth={50} count={5000} factor={4} saturation={0} fade speed={1} />
            
            {nodes.map(node => (
              <GalaxyNode 
                key={node.id} 
                name={node.name} 
                isDir={node.isDir} 
                position={node.position} 
                onClick={(e) => {
                  e.stopPropagation();
                  alert(`Navigating to ${node.name} in Galaxy mode is coming soon!`);
                }}
              />
            ))}
            
            <OrbitControls enablePan={true} enableZoom={true} enableRotate={true} />
         </Canvas>
      </div>
    </div>
  );
};

export const SecretsTab = ({ owner, repo }) => {
  const [secrets, setSecrets] = useState([
    { key: 'DATABASE_URL', value: 'postgresql://admin:password123@localhost:5432/db', hidden: true },
    { key: 'API_KEY', value: 'sk-12345abcdef', hidden: true },
    { key: 'JWT_SECRET', value: 'supersecret', hidden: true }
  ]);
  const [newKey, setNewKey] = useState('');
  const [newValue, setNewValue] = useState('');
  const [isAuditing, setIsAuditing] = useState(false);
  const [auditResult, setAuditResult] = useState(null);

  const handleAddSecret = () => {
    if (!newKey || !newValue) return;
    setSecrets([...secrets, { key: newKey, value: newValue, hidden: true }]);
    setNewKey('');
    setNewValue('');
  };

  const removeSecret = (index) => {
    setSecrets(secrets.filter((_, i) => i !== index));
  };

  const toggleHidden = (index) => {
    const newSecrets = [...secrets];
    newSecrets[index].hidden = !newSecrets[index].hidden;
    setSecrets(newSecrets);
  };

  const handleAudit = async () => {
    setIsAuditing(true);
    try {
      const res = await api.post(`/ai/${owner}/${repo}/audit-secrets`, { secrets });
      setAuditResult(res.data);
    } catch (e) {
      alert('Failed to audit secrets');
    } finally {
      setIsAuditing(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-[var(--bg-tertiary)] border border-[var(--glass-border)] rounded-lg p-4">
        <div className="flex items-center gap-2 text-[var(--text-main)] font-semibold">
          <Lock size={18} className="text-[var(--brand-danger)]" />
          Environment Secrets Vault
        </div>
        
        <NeonButton 
          variant="danger" 
          onClick={handleAudit} 
          disabled={isAuditing || secrets.length === 0}
          className="flex items-center gap-2"
        >
          {isAuditing ? 'AUDITING...' : <><ShieldCheck size={14} /> AUDIT SECRETS WITH AI</>}
        </NeonButton>
      </div>

      {auditResult && (
        <ScrollReveal>
          <GlassCard className="p-6 border-t-4 border-t-[var(--brand-danger)]">
             <div className="flex justify-between items-center mb-4">
               <h3 className="font-display font-bold text-[var(--brand-danger)] flex items-center gap-2">
                 <AlertTriangle size={18} />
                 AI Security Audit Report
               </h3>
               <div className="text-2xl font-mono font-bold text-white">Score: <span className={auditResult.score > 80 ? 'text-[var(--brand-success)]' : 'text-[var(--brand-danger)]'}>{auditResult.score}/100</span></div>
             </div>
             
             <p className="text-sm font-mono text-[var(--text-muted)] mb-6">{auditResult.summary}</p>
             
             <div className="space-y-3">
               {auditResult.vulnerabilities?.map((vuln, i) => (
                 <div key={i} className="p-3 bg-black/40 border border-[var(--brand-danger)]/50 rounded flex items-start gap-3">
                   <AlertCircle size={16} className="text-[var(--brand-danger)] mt-0.5 shrink-0" />
                   <div>
                     <div className="flex items-center gap-2 mb-1">
                       <span className="font-bold text-white text-sm font-mono">{vuln.key}</span>
                       <CyberBadge variant={vuln.severity === 'Critical' || vuln.severity === 'High' ? 'danger' : 'warning'} size="sm">{vuln.severity}</CyberBadge>
                     </div>
                     <p className="text-xs text-gray-300">{vuln.issue}</p>
                   </div>
                 </div>
               ))}
             </div>
          </GlassCard>
        </ScrollReveal>
      )}

      <ScrollReveal delay={0.1}>
        <GlassCard className="p-6">
          <div className="grid grid-cols-[1fr,1.5fr,auto] gap-4 mb-6">
            <CyberInput placeholder="KEY (e.g. API_TOKEN)" value={newKey} onChange={(e) => setNewKey(e.target.value.toUpperCase())} />
            <CyberInput placeholder="VALUE (e.g. sk-...)" value={newValue} onChange={(e) => setNewValue(e.target.value)} type="password" />
            <NeonButton variant="primary" onClick={handleAddSecret} disabled={!newKey || !newValue} className="h-[42px] mt-6">
              ADD SECRET
            </NeonButton>
          </div>

          <div className="space-y-2">
            {secrets.map((secret, idx) => (
              <div key={idx} className="flex items-center gap-4 p-3 bg-black/20 border border-[var(--glass-border)] rounded hover:bg-black/40 transition-colors">
                <div className="w-1/3 font-mono text-sm font-bold text-[var(--brand-purple)]">{secret.key}</div>
                <div className="flex-1 font-mono text-sm text-gray-400">
                  {secret.hidden ? '••••••••••••••••••••' : secret.value}
                </div>
                <div className="flex items-center gap-2">
                  <button onClick={() => toggleHidden(idx)} className="text-gray-500 hover:text-white transition-colors">
                    {secret.hidden ? <Eye size={16} /> : <EyeOff size={16} />}
                  </button>
                  <button onClick={() => removeSecret(idx)} className="text-[var(--brand-danger)] hover:text-red-400 transition-colors ml-2">
                    <X size={16} />
                  </button>
                </div>
              </div>
            ))}
            {secrets.length === 0 && (
              <div className="text-center p-8 text-sm font-mono text-[var(--text-muted)]">
                No secrets stored in this environment vault.
              </div>
            )}
          </div>
        </GlassCard>
      </ScrollReveal>
    </div>
  );
};
