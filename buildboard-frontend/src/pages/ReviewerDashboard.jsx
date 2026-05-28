import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import api from '../lib/api';
import { GlassCard, CyberBadge, CyberInput, CyberSkeleton } from '../components/ui';
import { pageVariants, listVariants, itemVariants } from '../utils/animations';
import { Eye, Search, Filter, ShieldCheck, GitBranch, Star, Lock, Globe, ChevronLeft, ChevronRight, TerminalSquare } from 'lucide-react';

const ReviewerDashboard = () => {
  const [search, setSearch] = useState('');
  const [visibility, setVisibility] = useState('');
  const [page, setPage] = useState(1);

  const { data, isLoading, error } = useQuery({
    queryKey: ['reviewer-repos', search, visibility, page],
    queryFn: async () => {
      const { data } = await api.get('/admin/repos', {
        params: { search, visibility, page, limit: 20 }
      });
      return data;
    },
    keepPreviousData: true
  });

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
      className="max-w-7xl mx-auto py-8 px-4 space-y-6"
    >
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 border-b border-[var(--glass-border)] pb-6">
        <div>
          <h1 className="text-3xl font-display font-bold flex items-center gap-3 text-white">
            <Eye className="text-[var(--brand-primary)]" size={32} />
            OVERSEER_DASHBOARD
          </h1>
          <p className="text-sm font-mono text-[var(--text-muted)] mt-2">
            Global repository surveillance, code review metrics, and sector anomaly detection.
          </p>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" size={16} />
            <input
              type="text"
              placeholder="SEARCH_DATABANKS..."
              className="w-full bg-[var(--bg-tertiary)] border border-[var(--glass-border)] rounded-lg py-2.5 pl-10 pr-4 text-sm font-mono text-white focus:border-[var(--brand-primary)] focus:ring-1 focus:ring-[var(--brand-primary)]/50 outline-none transition-all placeholder:text-[var(--text-muted)]/50"
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            />
          </div>
          
          <div className="relative w-full sm:w-48">
            <Filter className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" size={16} />
            <select
              className="w-full bg-[var(--bg-tertiary)] border border-[var(--glass-border)] rounded-lg py-2.5 pl-10 pr-4 text-sm font-mono text-white focus:border-[var(--brand-primary)] focus:ring-1 focus:ring-[var(--brand-primary)]/50 outline-none transition-all appearance-none cursor-pointer"
              value={visibility}
              onChange={(e) => { setVisibility(e.target.value); setPage(1); }}
            >
              <option value="">ALL_CLEARANCE</option>
              <option value="public">GLOBAL (Public)</option>
              <option value="private">RESTRICTED (Private)</option>
            </select>
          </div>
        </div>
      </div>

      <GlassCard className="p-0 overflow-hidden border-t-2 border-t-[var(--brand-secondary)]">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-black/60 border-b border-[var(--glass-border)] text-[10px] font-mono uppercase tracking-widest text-[var(--text-muted)]">
                <th className="px-6 py-4 font-medium">Repository_Ident</th>
                <th className="px-6 py-4 font-medium">Owner_Id</th>
                <th className="px-6 py-4 font-medium">Clearance</th>
                <th className="px-6 py-4 font-medium">Metrics</th>
                <th className="px-6 py-4 font-medium text-right">Action</th>
              </tr>
            </thead>
            
            <tbody className="divide-y divide-[var(--glass-border)]">
              {isLoading && !data ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i}>
                    <td colSpan={5} className="px-6 py-4"><CyberSkeleton className="h-12 w-full rounded" /></td>
                  </tr>
                ))
              ) : data?.repos?.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-12 py-16 text-center">
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
                          <span className="font-display font-bold text-lg text-[var(--brand-primary)] group-hover:text-white transition-colors group-hover:shadow-[0_0_10px_var(--brand-primary)] relative">
                            {repo.name}
                          </span>
                          <span className="mt-1 text-xs font-mono text-[var(--text-muted)] max-w-[250px] truncate group-hover:text-[var(--text-main)] transition-colors">
                            {repo.description || 'No descriptor module attached'}
                          </span>
                        </Link>
                      </td>
                      
                      <td className="px-6 py-5">
                        <div className="flex items-center gap-3">
                          <div className="h-8 w-8 rounded overflow-hidden border border-[var(--glass-border)] bg-black/50 p-0.5">
                            {repo.owner?.avatar ? (
                              <img src={repo.owner.avatar} alt="" className="h-full w-full object-cover rounded-sm" />
                            ) : (
                              <div className="h-full w-full bg-[var(--bg-main)] flex items-center justify-center text-xs text-[var(--brand-primary)] font-display font-bold rounded-sm">
                                {repo.owner?.username?.charAt(0).toUpperCase() || '?'}
                              </div>
                            )}
                          </div>
                          <span className="font-mono text-sm text-white group-hover:text-[var(--brand-secondary)] transition-colors">
                            {repo.owner?.username || 'Unknown_Entity'}
                          </span>
                        </div>
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
                        <Link
                          to={`/${repo.owner?.username || 'unknown'}/${repo.slug}`}
                          className="inline-flex items-center gap-2 rounded bg-[var(--brand-primary)]/10 px-4 py-2 text-xs font-mono font-bold text-[var(--brand-primary)] border border-[var(--brand-primary)]/30 hover:bg-[var(--brand-primary)]/20 hover:border-[var(--brand-primary)] transition-all hover:shadow-[0_0_15px_var(--brand-primary)_inset]"
                        >
                          <Eye size={14} />
                          INSPECT
                        </Link>
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
          <div className="border-t border-[var(--glass-border)] px-6 py-4 bg-black/40 flex items-center justify-between">
            <button
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
              className="flex items-center gap-1 text-xs font-mono uppercase tracking-widest px-3 py-1.5 rounded border border-[var(--glass-border)] text-[var(--text-main)] hover:bg-white/5 hover:border-[var(--brand-primary)] disabled:opacity-30 disabled:hover:border-[var(--glass-border)] disabled:hover:bg-transparent transition-all"
            >
              <ChevronLeft size={14} /> PREV
            </button>
            
            <div className="text-xs font-mono text-[var(--text-muted)] flex items-center gap-2">
              SECTOR <span className="text-[var(--brand-primary)] font-bold">{page}</span> OF <span className="text-white font-bold">{data.pages}</span>
            </div>
            
            <button
              onClick={() => setPage(p => Math.min(data.pages, p + 1))}
              disabled={page === data.pages}
              className="flex items-center gap-1 text-xs font-mono uppercase tracking-widest px-3 py-1.5 rounded border border-[var(--glass-border)] text-[var(--text-main)] hover:bg-white/5 hover:border-[var(--brand-primary)] disabled:opacity-30 disabled:hover:border-[var(--glass-border)] disabled:hover:bg-transparent transition-all"
            >
              NEXT <ChevronRight size={14} />
            </button>
          </div>
        )}
      </GlassCard>
    </motion.div>
  );
};

export default ReviewerDashboard;
