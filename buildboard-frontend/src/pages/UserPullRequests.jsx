import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../lib/api';
import { GlassCard, NeonButton, CyberSkeleton } from '../components/ui';
import { pageVariants, listVariants, itemVariants } from '../utils/animations';
import { GitPullRequest, GitMerge, XCircle, Search, Filter, Clock, GitBranch } from 'lucide-react';

const UserPullRequests = () => {
  const [filter, setFilter] = useState('open');
  const [search, setSearch] = useState('');
  const [showFilters, setShowFilters] = useState(false);

  const { data: prs = [], isLoading } = useQuery({
    queryKey: ['user-prs', filter],
    queryFn: async () => {
      const { data } = await api.get('/pullrequests', { params: { author: 'me', status: filter !== 'all' ? filter : undefined } });
      return Array.isArray(data) ? data : (data.pullRequests || []);
    },
  });

  const filtered = prs.filter((pr) =>
    !search || pr.title?.toLowerCase().includes(search.toLowerCase())
  );

  const getStatusConfig = (status) => {
    switch (status) {
      case 'open':
        return { icon: GitPullRequest, color: 'text-[var(--brand-success)]', bg: 'bg-[var(--brand-success)]/10', border: 'border-[var(--brand-success)]/30' };
      case 'merged':
        return { icon: GitMerge, color: 'text-[var(--brand-purple)]', bg: 'bg-[var(--brand-purple)]/10', border: 'border-[var(--brand-purple)]/30' };
      case 'closed':
        return { icon: XCircle, color: 'text-[var(--brand-danger)]', bg: 'bg-[var(--brand-danger)]/10', border: 'border-[var(--brand-danger)]/30' };
      default:
        return { icon: GitPullRequest, color: 'text-[var(--brand-success)]', bg: 'bg-[var(--brand-success)]/10', border: 'border-[var(--brand-success)]/30' };
    }
  };

  return (
    <motion.div 
      variants={pageVariants}
      initial="initial"
      animate="animate"
      exit="exit"
      className="max-w-7xl mx-auto py-8 px-4 space-y-8"
    >
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-[var(--glass-border)] pb-6">
        <div>
          <h1 className="text-3xl font-display font-bold flex items-center gap-3 text-white">
            <GitPullRequest className="text-[var(--brand-primary)]" size={32} />
            PULL_REQUESTS
          </h1>
          <p className="text-sm font-mono text-[var(--text-muted)] mt-2">
            Integration requests you've opened or been requested to review.
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          <NeonButton 
            variant="ghost" 
            onClick={() => setShowFilters(!showFilters)}
            className={`flex items-center gap-2 ${search ? 'text-[var(--brand-warning)] border-[var(--brand-warning)]/50' : ''}`}
          >
            <Filter size={16} /> 
            {showFilters ? 'HIDE_FILTERS' : 'SHOW_FILTERS'}
            {search && <span className="w-2 h-2 rounded-full bg-[var(--brand-warning)] ml-1 shadow-[0_0_8px_var(--brand-warning)] animate-pulse" />}
          </NeonButton>
        </div>
      </div>

      <AnimatePresence>
        {showFilters && (
          <motion.div 
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <GlassCard className="p-4 bg-[var(--bg-tertiary)]/50 border-dashed border-[var(--glass-border)] mb-6">
              <div className="flex flex-col md:flex-row gap-4 items-center">
                <div className="relative flex-1 w-full">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--brand-primary)]" size={16} />
                  <input
                    type="text"
                    placeholder="Search PR database..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="w-full bg-black/40 border border-[var(--glass-border)] rounded-lg py-2.5 pl-9 pr-4 text-sm font-mono text-white focus:border-[var(--brand-primary)] focus:ring-1 focus:ring-[var(--brand-primary)]/50 outline-none transition-all placeholder-[var(--text-muted)]"
                  />
                </div>
              </div>
            </GlassCard>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex gap-2 p-1 rounded-lg border border-[var(--glass-border)] bg-black/40 w-fit">
        {['open', 'merged', 'closed', 'all'].map((s) => (
          <button
            key={s}
            type="button"
            className={`rounded-md px-4 py-1.5 text-xs font-mono uppercase transition-all duration-300 ${
              filter === s 
                ? 'bg-[var(--brand-primary)]/20 text-[var(--brand-primary)] border border-[var(--brand-primary)]/50 shadow-[0_0_10px_rgba(56,189,248,0.2)]' 
                : 'text-[var(--text-muted)] hover:text-white hover:bg-white/5 border border-transparent'
            }`}
            onClick={() => setFilter(s)}
          >
            {s}
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="space-y-4">
          {[1, 2, 3, 4].map((i) => <CyberSkeleton key={i} className="h-24 rounded-lg" />)}
        </div>
      ) : filtered.length === 0 ? (
        <GlassCard className="p-16 text-center flex flex-col items-center justify-center border-dashed">
          <GitPullRequest size={48} className="text-[var(--text-muted)] opacity-20 mb-4" />
          <h3 className="text-xl font-display font-bold mb-2">NO_REQUESTS_FOUND</h3>
          <p className="text-sm font-mono text-[var(--text-muted)]">
            No pull requests match your current filter parameters.
          </p>
        </GlassCard>
      ) : (
        <motion.div variants={listVariants} initial="hidden" animate="visible" className="space-y-4">
          <AnimatePresence>
            {filtered.map((pr) => {
              const { icon: StatusIcon, color, bg, border } = getStatusConfig(pr.status);
              return (
                <motion.div 
                  key={pr._id} 
                  variants={itemVariants}
                  layout
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="group"
                >
                  <GlassCard className={`p-0 overflow-hidden border-l-4 transition-all duration-300 ${
                    pr.status === 'open' ? 'border-l-[var(--brand-success)]' : 
                    pr.status === 'merged' ? 'border-l-[var(--brand-purple)]' : 
                    'border-l-[var(--brand-danger)]'
                  } hover:border-[var(--brand-primary)]/50`}>
                    <div className="p-4 md:p-5 flex items-start gap-4">
                      <div className={`mt-0.5 shrink-0 ${color}`}>
                        <StatusIcon size={20} />
                      </div>
                      
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-3 mb-2">
                          <span className="text-base font-bold text-white group-hover:text-[var(--brand-primary)] transition-colors">
                            {pr.title}
                          </span>
                        </div>
                        
                        <div className="flex flex-wrap gap-4 text-xs font-mono text-[var(--text-muted)] items-center">
                          <span className="text-[var(--text-main)] font-bold">#{pr.number}</span>
                          
                          {pr.repository && (
                            <span className="flex items-center gap-1.5">
                              in 
                              <Link to={`/${pr.repository}`} className="text-[var(--brand-primary)] hover:underline">
                                {pr.repository}
                              </Link>
                            </span>
                          )}
                          
                          {pr.sourceBranch && pr.targetBranch && (
                            <span className="flex items-center gap-1.5 text-[var(--text-main)] border-l border-[var(--glass-border)] pl-4">
                              <GitBranch size={12} className="text-[var(--brand-primary)]" />
                              <span className="bg-black/40 px-1.5 py-0.5 rounded border border-[var(--glass-border)]">{pr.sourceBranch}</span>
                              <span className="text-[var(--text-muted)]">→</span>
                              <span className="bg-[var(--brand-primary)]/10 text-[var(--brand-primary)] px-1.5 py-0.5 rounded border border-[var(--brand-primary)]/30">{pr.targetBranch}</span>
                            </span>
                          )}

                          {pr.createdAt && (
                            <span className="flex items-center gap-1.5 border-l border-[var(--glass-border)] pl-4">
                              <Clock size={12} /> opened {new Date(pr.createdAt).toLocaleDateString()}
                            </span>
                          )}
                        </div>
                      </div>
                      
                      <div className={`shrink-0 rounded px-2.5 py-1 text-[10px] font-mono uppercase tracking-wider border ${border} ${bg} ${color}`}>
                        {pr.status || 'open'}
                      </div>
                    </div>
                  </GlassCard>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </motion.div>
      )}
    </motion.div>
  );
};

export default UserPullRequests;
