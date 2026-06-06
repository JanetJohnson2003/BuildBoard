import React, { useState, useRef, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link, useNavigate, Navigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../lib/api';
import { useAuth } from '../context/AuthContext';
import { GlassCard, CyberBadge, CyberSkeleton } from '../components/ui';
import { OverseerArsenal } from '../components/reviewer/OverseerArsenal';
import { IdentityCommandCenter } from '../components/reviewer/IdentityCommandCenter';
import { pageVariants, itemVariants } from '../utils/animations';
import { Eye, ShieldCheck, GitBranch, Star, Lock, Globe, ChevronLeft, ChevronRight, TerminalSquare, Terminal, CheckCircle, AlertTriangle, AlertOctagon, Zap, Fingerprint } from 'lucide-react';

const ReviewerDashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [visibility, setVisibility] = useState('');
  const [page, setPage] = useState(1);
  const [command, setCommand] = useState('');
  const [activeTab, setActiveTab] = useState('repos');
  const [logs, setLogs] = useState([
    { type: 'system', message: 'NEXUS OVERSEER TERMINAL v2.1 ONLINE' },
    { type: 'system', message: 'Establishing secure connection to global databanks...' },
    { type: 'success', message: 'Connection established. Clearance level: REVIEWER' },
    { type: 'info', message: 'Type "help" for a list of available commands.' }
  ]);
  const logEndRef = useRef(null);

  const { data, isLoading, error } = useQuery({
    queryKey: ['reviewer-repos', search, visibility, page],
    queryFn: async () => {
      const { data } = await api.get('/admin/repos', {
        params: { search, visibility, page, limit: 10 }
      });
      return data;
    },
    keepPreviousData: true
  });

  const { data: flaggedData, isLoading: flaggedLoading } = useQuery({
    queryKey: ['reviewer-flagged-feedback'],
    queryFn: async () => {
      const { data } = await api.get('/admin/moderation/feedback');
      return data;
    }
  });

  useEffect(() => {
    logEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [logs]);

  const addLog = (type, message) => {
    setLogs(prev => [...prev, { type, message }]);
  };

  const handleCommand = (e) => {
    e.preventDefault();
    if (!command.trim()) return;
    
    addLog('user', `> ${command}`);
    const args = command.trim().toLowerCase().split(' ');
    const cmd = args[0];
    
    switch (cmd) {
      case 'help':
        addLog('info', 'AVAILABLE COMMANDS:');
        addLog('info', '  search <query>    - Search repositories by name/desc');
        addLog('info', '  filter <type>     - Filter by visibility (public/private/clear)');
        addLog('info', '  inspect <repo>    - Jump to repository (e.g. user/repo)');
        addLog('info', '  tab <name>        - Switch tab (repos/moderation/arsenal/identity)');
        addLog('info', '  clear             - Clear terminal logs');
        addLog('info', '  reset             - Reset all search/filters');
        break;
      case 'clear':
        setLogs([]);
        break;
      case 'tab':
        if (['repos', 'moderation', 'arsenal', 'identity'].includes(args[1])) {
          setActiveTab(args[1]);
          addLog('system', `Switched view to: ${args[1].toUpperCase()}`);
        } else {
          addLog('error', 'Syntax error: tab requires repos, moderation, arsenal, or identity');
        }
        break;
      case 'search':
        if (args.length > 1) {
          const query = args.slice(1).join(' ');
          setSearch(query);
          setPage(1);
          setActiveTab('repos');
          addLog('system', `Executing query: SEARCH "${query}"`);
        } else {
          addLog('error', 'Syntax error: search <query> required');
        }
        break;
      case 'filter':
        if (args[1] === 'public' || args[1] === 'private') {
          setVisibility(args[1]);
          setPage(1);
          setActiveTab('repos');
          addLog('system', `Applying clearance filter: ${args[1].toUpperCase()}`);
        } else if (args[1] === 'clear') {
          setVisibility('');
          setPage(1);
          addLog('system', 'Clearance filters removed.');
        } else {
          addLog('error', 'Syntax error: filter requires "public", "private", or "clear"');
        }
        break;
      case 'reset':
        setSearch('');
        setVisibility('');
        setPage(1);
        addLog('success', 'All parameters reset to default.');
        break;
      case 'inspect':
        if (args[1]) {
          addLog('system', `Attempting override access to ${args[1]}...`);
          setTimeout(() => {
            navigate(`/${args[1]}`);
          }, 600);
        } else {
          addLog('error', 'Syntax error: inspect requires <owner>/<repo>');
        }
        break;
      default:
        addLog('error', `Command not recognized: ${cmd}. Type "help" for options.`);
    }
    
    setCommand('');
  };

  const getLogIcon = (type) => {
    switch (type) {
      case 'system': return <Terminal size={14} className="text-[var(--brand-primary)]" />;
      case 'success': return <CheckCircle size={14} className="text-[var(--brand-success)]" />;
      case 'error': return <AlertTriangle size={14} className="text-[var(--brand-danger)]" />;
      case 'info': return <ShieldCheck size={14} className="text-[var(--brand-purple)]" />;
      default: return <ChevronRight size={14} className="text-[var(--text-muted)]" />;
    }
  };

  if (user && user.role !== 'admin' && user.role !== 'reviewer') {
    return <Navigate to="/dashboard" replace />;
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[60vh] p-8">
        <GlassCard glowColor="var(--brand-danger)" className="p-8 text-center border-[var(--brand-danger)]/50 max-w-md">
          <ShieldCheck className="text-[var(--brand-danger)] mx-auto mb-4" size={48} />
          <h2 className="text-xl font-display font-bold text-white mb-2">TELEMETRY_ERROR</h2>
          <p className="text-sm font-mono text-[var(--brand-danger)]">
            {error.response?.data?.message || error.message}
          </p>
        </GlassCard>
      </div>
    );
  }

  return (
    <motion.div 
      variants={pageVariants}
      initial="initial"
      animate="animate"
      exit="exit"
      className="max-w-7xl mx-auto py-8 px-4 flex flex-col h-[calc(100vh-64px)] gap-6"
    >
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 border-b border-[var(--glass-border)] pb-4 shrink-0">
        <div>
          <h1 className="text-3xl font-display font-bold flex items-center gap-3 text-white">
            <Eye className="text-[var(--brand-primary)]" size={32} />
            OVERSEER_TERMINAL
          </h1>
          <p className="text-sm font-mono text-[var(--text-muted)] mt-2">
            Global repository surveillance and content moderation terminal.
          </p>
        </div>
        
        <div className="flex items-center gap-2 bg-[var(--bg-tertiary)] p-1 rounded-lg border border-[var(--glass-border)]">
          <button 
            onClick={() => setActiveTab('repos')}
            className={`px-4 py-2 rounded text-sm font-mono transition-colors ${activeTab === 'repos' ? 'bg-[var(--brand-primary)]/20 text-[var(--brand-primary)] shadow-[0_0_10px_rgba(0,212,255,0.2)]' : 'text-[var(--text-muted)] hover:text-white'}`}
          >
            GLOBAL_REPOS
          </button>
          <button 
            onClick={() => setActiveTab('moderation')}
            className={`px-4 py-2 rounded text-sm font-mono flex items-center gap-2 transition-colors ${activeTab === 'moderation' ? 'bg-[var(--brand-danger)]/20 text-[var(--brand-danger)] shadow-[0_0_10px_rgba(255,51,102,0.2)]' : 'text-[var(--text-muted)] hover:text-white'}`}
          >
            MODERATION
            {flaggedData?.length > 0 && (
              <span className="w-2 h-2 rounded-full bg-[var(--brand-danger)] animate-pulse" />
            )}
          </button>
          <button 
            onClick={() => setActiveTab('arsenal')}
            className={`px-4 py-2 rounded text-sm font-mono flex items-center gap-2 transition-colors ${activeTab === 'arsenal' ? 'bg-[var(--brand-purple)]/20 text-[var(--brand-purple)] shadow-[0_0_10px_rgba(139,92,246,0.3)]' : 'text-[var(--text-muted)] hover:text-white'}`}
          >
            <Zap size={14} />
            ARSENAL
          </button>
          <button 
            onClick={() => setActiveTab('identity')}
            className={`px-4 py-2 rounded text-sm font-mono flex items-center gap-2 transition-colors ${activeTab === 'identity' ? 'bg-[var(--brand-danger)]/20 text-[var(--brand-danger)] shadow-[0_0_10px_rgba(255,51,102,0.3)]' : 'text-[var(--text-muted)] hover:text-white'}`}
          >
            <Fingerprint size={14} />
            IDENTITY
          </button>
        </div>
      </div>

      {activeTab === 'arsenal' ? (
        <GlassCard className="flex-1 flex flex-col p-0 overflow-hidden border-t-2 border-t-[var(--brand-purple)] min-h-0">
          <OverseerArsenal addLog={addLog} />
        </GlassCard>
      ) : activeTab === 'identity' ? (
        <GlassCard className="flex-1 flex flex-col p-0 overflow-hidden border-t-2 border-t-[var(--brand-danger)] min-h-0">
          <IdentityCommandCenter addLog={addLog} />
        </GlassCard>
      ) : (
      <div className="flex flex-col lg:flex-row gap-6 flex-1 min-h-0">
        
        {/* CLI Panel (Left/Top) */}
        <div className="w-full lg:w-1/3 flex flex-col gap-4">
          <GlassCard className="flex-1 flex flex-col p-0 border border-[var(--brand-primary)]/30 overflow-hidden shadow-[0_0_20px_rgba(0,212,255,0.1)] h-64 lg:h-auto">
            <div className="bg-[var(--brand-primary)]/10 border-b border-[var(--brand-primary)]/30 px-4 py-2 flex items-center gap-2 shrink-0">
              <Terminal size={16} className="text-[var(--brand-primary)]" />
              <span className="text-xs font-mono font-bold text-[var(--brand-primary)] tracking-widest">NEXUS_CLI</span>
            </div>
            
            <div className="flex-1 overflow-y-auto cyber-scrollbar p-4 space-y-2 bg-black/40">
              {logs.map((log, i) => (
                <div key={i} className="flex items-start gap-2 text-sm font-mono break-all">
                  <span className="mt-0.5 shrink-0">{getLogIcon(log.type)}</span>
                  <span className={`
                    ${log.type === 'system' ? 'text-[var(--brand-primary)]' : ''}
                    ${log.type === 'success' ? 'text-[var(--brand-success)]' : ''}
                    ${log.type === 'error' ? 'text-[var(--brand-danger)]' : ''}
                    ${log.type === 'info' ? 'text-[var(--text-muted)]' : ''}
                    ${log.type === 'user' ? 'text-white' : ''}
                  `}>
                    {log.message}
                  </span>
                </div>
              ))}
              <div ref={logEndRef} />
            </div>
            
            <form onSubmit={handleCommand} className="p-3 border-t border-[var(--brand-primary)]/30 bg-black/60 flex items-center gap-2 shrink-0">
              <span className="text-[var(--brand-primary)] font-mono font-bold">{'>'}</span>
              <input 
                type="text" 
                value={command}
                onChange={(e) => setCommand(e.target.value)}
                placeholder="Enter command..."
                className="flex-1 bg-transparent text-white font-mono text-sm outline-none placeholder:text-[var(--text-muted)]/50"
                autoFocus
              />
            </form>
          </GlassCard>
        </div>

        {/* Data Panel (Right/Bottom) */}
        <div className="w-full lg:w-2/3 flex flex-col h-full overflow-hidden">
          <GlassCard className="p-0 overflow-hidden border-t-2 border-t-[var(--brand-secondary)] flex-1 flex flex-col">
            
            {activeTab === 'repos' && (
              <>
                <div className="overflow-x-auto flex-1 cyber-scrollbar">
                  <table className="w-full text-left border-collapse">
                    <thead className="sticky top-0 z-10">
                      <tr className="bg-[#0a0a0f] border-b border-[var(--glass-border)] text-[10px] font-mono uppercase tracking-widest text-[var(--text-muted)]">
                        <th className="px-6 py-4 font-medium">Repository_Ident</th>
                        <th className="px-6 py-4 font-medium">Clearance</th>
                        <th className="px-6 py-4 font-medium">Metrics</th>
                        <th className="px-6 py-4 font-medium text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[var(--glass-border)]">
                      {isLoading && !data ? (
                        Array.from({ length: 5 }).map((_, i) => (
                          <tr key={i}>
                            <td colSpan={4} className="px-6 py-4"><CyberSkeleton className="h-12 w-full rounded" /></td>
                          </tr>
                        ))
                      ) : data?.repos?.length === 0 ? (
                        <tr>
                          <td colSpan={4} className="px-12 py-16 text-center">
                            <TerminalSquare size={48} className="mx-auto mb-4 text-[var(--text-muted)] opacity-50" />
                            <h3 className="text-lg font-display font-bold text-white mb-2">NO_MATCHES_FOUND</h3>
                            <p className="text-sm font-mono text-[var(--text-muted)]">Adjust your search parameters to locate target repositories.</p>
                          </td>
                        </tr>
                      ) : (
                        <AnimatePresence>
                          {data?.repos?.map((repo, i) => (
                            <motion.tr 
                              key={repo._id} 
                              variants={itemVariants}
                              initial="hidden"
                              animate="visible"
                              custom={i}
                              className="hover:bg-[var(--bg-tertiary)]/50 transition-colors group"
                            >
                              <td className="px-6 py-5">
                                <Link to={`/${repo.owner?.username || 'unknown'}/${repo.slug}`} className="inline-flex flex-col">
                                  <div className="flex items-center gap-2">
                                    <span className="font-display font-bold text-base text-[var(--brand-primary)] group-hover:text-white transition-colors group-hover:shadow-[0_0_10px_var(--brand-primary)] relative">
                                      {repo.name}
                                    </span>
                                    <span className="text-xs text-[var(--text-muted)]">by {repo.owner?.username}</span>
                                  </div>
                                  <span className="mt-1 text-xs font-mono text-[var(--text-muted)] max-w-[250px] truncate group-hover:text-[var(--text-main)] transition-colors">
                                    {repo.description || 'No descriptor module attached'}
                                  </span>
                                </Link>
                              </td>
                              
                              <td className="px-6 py-5">
                                <CyberBadge 
                                  variant={repo.visibility === 'private' ? 'warning' : 'success'} 
                                  size="sm"
                                  icon={repo.visibility === 'private' ? <Lock size={12}/> : <Globe size={12}/>}
                                >
                                  {repo.visibility.toUpperCase()}
                                </CyberBadge>
                              </td>
                              
                              <td className="px-6 py-5">
                                <div className="flex items-center gap-4 text-xs font-mono text-[var(--text-muted)]">
                                  <span className="flex items-center gap-1.5 px-2 py-1 bg-black/40 rounded border border-[var(--glass-border)] group-hover:border-[var(--brand-warning)]/50 transition-colors">
                                    <Star size={12} className="text-[var(--brand-warning)]" />
                                    {repo.starCount}
                                  </span>
                                  <span className="flex items-center gap-1.5 px-2 py-1 bg-black/40 rounded border border-[var(--glass-border)] group-hover:border-[var(--brand-success)]/50 transition-colors">
                                    <GitBranch size={12} className="text-[var(--brand-success)]" />
                                    {repo.forkCount}
                                  </span>
                                </div>
                              </td>
                              
                              <td className="px-6 py-5 text-right">
                                <div className="flex items-center justify-end gap-2">
                                  <Link
                                    to={`/${repo.owner?.username || 'unknown'}/${repo.slug}`}
                                    className="inline-flex items-center gap-2 rounded bg-[var(--brand-primary)]/10 px-4 py-2 text-xs font-mono font-bold text-[var(--brand-primary)] border border-[var(--brand-primary)]/30 hover:bg-[var(--brand-primary)]/20 hover:border-[var(--brand-primary)] transition-all hover:shadow-[0_0_15px_var(--brand-primary)_inset]"
                                  >
                                    <Eye size={14} />
                                    INSPECT
                                  </Link>
                                  <Link
                                    to={`/${repo.owner?.username || 'unknown'}/${repo.slug}?tab=pull-requests`}
                                    className="inline-flex items-center gap-2 rounded bg-[var(--brand-success)]/10 px-4 py-2 text-xs font-mono font-bold text-[var(--brand-success)] border border-[var(--brand-success)]/30 hover:bg-[var(--brand-success)]/20 hover:border-[var(--brand-success)] transition-all hover:shadow-[0_0_15px_var(--brand-success)_inset]"
                                  >
                                    <ShieldCheck size={14} />
                                    REVIEW
                                  </Link>
                                  <Link
                                    to={`/${repo.owner?.username || 'unknown'}/${repo.slug}?tab=issues`}
                                    className="inline-flex items-center gap-2 rounded bg-[var(--brand-warning)]/10 px-4 py-2 text-xs font-mono font-bold text-[var(--brand-warning)] border border-[var(--brand-warning)]/30 hover:bg-[var(--brand-warning)]/20 hover:border-[var(--brand-warning)] transition-all hover:shadow-[0_0_15px_var(--brand-warning)_inset]"
                                  >
                                    <AlertTriangle size={14} />
                                    REPORT ISSUE
                                  </Link>
                                </div>
                              </td>
                            </motion.tr>
                          ))}
                        </AnimatePresence>
                      )}
                    </tbody>
                  </table>
                </div>
                
                {/* Pagination Console */}
                {data?.pages > 1 && (
                  <div className="border-t border-[var(--glass-border)] px-6 py-4 bg-black/40 flex items-center justify-between shrink-0">
                    <button
                      onClick={() => setPage(p => Math.max(1, p - 1))}
                      disabled={page === 1}
                      className="flex items-center gap-1 text-xs font-mono uppercase tracking-widest px-3 py-1.5 rounded border border-[var(--glass-border)] text-[var(--text-main)] hover:bg-white/5 hover:border-[var(--brand-primary)] disabled:opacity-30 disabled:hover:border-[var(--glass-border)] transition-all"
                    >
                      <ChevronLeft size={14} /> PREV
                    </button>
                    
                    <div className="text-xs font-mono text-[var(--text-muted)] flex items-center gap-2">
                      SECTOR <span className="text-[var(--brand-primary)] font-bold">{page}</span> OF <span className="text-white font-bold">{data.pages}</span>
                    </div>
                    
                    <button
                      onClick={() => setPage(p => Math.min(data.pages, p + 1))}
                      disabled={page === data.pages}
                      className="flex items-center gap-1 text-xs font-mono uppercase tracking-widest px-3 py-1.5 rounded border border-[var(--glass-border)] text-[var(--text-main)] hover:bg-white/5 hover:border-[var(--brand-primary)] disabled:opacity-30 disabled:hover:border-[var(--glass-border)] transition-all"
                    >
                      NEXT <ChevronRight size={14} />
                    </button>
                  </div>
                )}
              </>
            )}

            {activeTab === 'moderation' && (
              <div className="overflow-x-auto flex-1 cyber-scrollbar p-6">
                {flaggedLoading ? (
                  <CyberSkeleton className="h-24 w-full rounded-lg mb-4" />
                ) : !flaggedData || flaggedData.length === 0 ? (
                  <div className="text-center py-16">
                    <ShieldCheck size={48} className="mx-auto mb-4 text-[var(--brand-success)] opacity-50" />
                    <h3 className="text-lg font-display font-bold text-white mb-2">MODERATION_QUEUE_CLEAR</h3>
                    <p className="text-sm font-mono text-[var(--text-muted)]">No flagged anomalies detected in the network.</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {flaggedData.map((feedback) => (
                      <div key={feedback._id} className="p-4 rounded-lg bg-[var(--bg-tertiary)] border border-[var(--brand-danger)]/30 hover:border-[var(--brand-danger)] transition-colors">
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-2 text-sm font-mono text-[var(--text-muted)]">
                            <AlertOctagon size={16} className="text-[var(--brand-danger)]" />
                            FLAGGED_FEEDBACK #{feedback._id.slice(-6)}
                          </div>
                          <span className="text-xs text-[var(--brand-danger)]">{new Date(feedback.createdAt).toLocaleDateString()}</span>
                        </div>
                        <div className="text-white text-sm mb-3 font-medium bg-black/40 p-3 rounded">{feedback.comment}</div>
                        <div className="text-xs font-mono text-[var(--brand-warning)] mb-4">Reason: {feedback.flagReason}</div>
                        
                        <div className="flex items-center justify-end gap-3 pt-3 border-t border-[var(--brand-danger)]/30">
                          <button
                            onClick={async () => {
                              if (window.confirm('Confirm deletion of flagged feedback?')) {
                                try {
                                  await api.delete(`/admin/feedback/${feedback._id}`);
                                  addLog('success', `Feedback #${feedback._id.slice(-6)} deleted.`);
                                  // We should trigger a refetch here ideally, but for now we'll just log it
                                } catch (err) {
                                  addLog('error', `Failed to delete feedback: ${err.message}`);
                                }
                              }
                            }}
                            className="px-3 py-1.5 text-xs font-mono font-bold bg-[var(--brand-danger)]/10 text-[var(--brand-danger)] hover:bg-[var(--brand-danger)] hover:text-white rounded border border-[var(--brand-danger)]/50 transition-colors"
                          >
                            DELETE_RECORD
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </GlassCard>
        </div>
      </div>
      )}
    </motion.div>
  );
};

export default ReviewerDashboard;
