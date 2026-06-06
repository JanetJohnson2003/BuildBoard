import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import api from '../lib/api';
import { 
  GlassCard, NeonButton, CyberInput, CyberBadge, CyberSkeleton 
} from '../components/ui';
import { Search, Filter, Globe, Star, GitFork, Terminal, Code2 } from 'lucide-react';
import { listVariants, itemVariants } from '../utils/animations';

const Explore = () => {
  const [filters, setFilters] = useState({ q: '', sort: 'stars', language: '' });

  const { data: repos = [], isLoading } = useQuery({
    queryKey: ['explore-repos', filters],
    queryFn: async () => {
      const { data } = await api.get('/repos/explore', { params: filters });
      return data;
    },
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-4 border-b border-[var(--glass-border)] pb-5 md:flex-row md:items-end relative">
        <div className="absolute bottom-0 left-0 right-0 h-[1px] bg-gradient-to-r from-[var(--brand-primary)] via-[var(--brand-purple)] to-transparent opacity-50" />
        <div>
          <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded text-xs font-mono font-medium bg-[var(--brand-primary)]/10 text-[var(--brand-primary)] mb-3">
            <Globe size={12} />
            GLOBAL_NETWORK_SEARCH
          </div>
          <h1 className="text-3xl font-display font-bold">Explore Nodes</h1>
          <p className="mt-1 text-sm text-[var(--text-muted)]">Discover public repositories, active sectors, and trending codebases.</p>
        </div>
        <Link to="/new" className="self-start md:self-auto">
          <NeonButton variant="primary">Deploy New Node</NeonButton>
        </Link>
      </div>

      <GlassCard className="p-4 border-t-[var(--brand-primary)]">
        <div className="flex flex-col md:flex-row gap-4 items-center">
          <div className="flex-1 w-full relative">
            <CyberInput 
              icon={Search} 
              placeholder="Search across all sectors..." 
              value={filters.q} 
              onChange={(e) => setFilters(c => ({ ...c, q: e.target.value }))} 
            />
          </div>
          <div className="flex gap-4 w-full md:w-auto">
            <div className="relative w-full md:w-48">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-[var(--text-muted)]">
                <Filter size={16} />
              </div>
              <select 
                className="w-full bg-[var(--bg-main)]/50 border border-[var(--glass-border)] rounded-lg pl-9 pr-4 py-3 text-sm focus:border-[var(--brand-primary)] focus:ring-1 focus:ring-[var(--brand-primary)]/50 outline-none transition-all appearance-none cursor-pointer"
                value={filters.sort} 
                onChange={(e) => setFilters(c => ({ ...c, sort: e.target.value }))}
              >
                <option value="stars">Most Starred</option>
                <option value="recent">Newest Scans</option>
                <option value="updated">Recently Updated</option>
                <option value="name">Alphabetical</option>
              </select>
            </div>
            <div className="relative w-full md:w-48">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-[var(--text-muted)]">
                <Code2 size={16} />
              </div>
              <input 
                className="w-full bg-[var(--bg-main)]/50 border border-[var(--glass-border)] rounded-lg pl-9 pr-4 py-3 text-sm focus:border-[var(--brand-primary)] focus:ring-1 focus:ring-[var(--brand-primary)]/50 outline-none transition-all placeholder:text-[var(--text-muted)]/50 font-mono"
                placeholder="Lang (e.g. Rust)" 
                value={filters.language} 
                onChange={(e) => setFilters(c => ({ ...c, language: e.target.value }))} 
              />
            </div>
          </div>
        </div>
      </GlassCard>

      <motion.div 
        variants={listVariants}
        initial="hidden"
        animate="visible"
        className="grid gap-4"
      >
        {isLoading ? (
          Array.from({ length: 4 }).map((_, i) => (
            <motion.div key={i} variants={itemVariants}>
              <GlassCard className="p-5">
                <CyberSkeleton className="h-6 w-1/3 mb-3" />
                <CyberSkeleton className="h-4 w-2/3 mb-4" />
                <div className="flex gap-2 mb-4">
                  <CyberSkeleton className="h-5 w-16 rounded-full" />
                  <CyberSkeleton className="h-5 w-20 rounded-full" />
                </div>
                <div className="flex gap-4 border-t border-[var(--glass-border)] pt-4 mt-4">
                  <CyberSkeleton className="h-4 w-20" />
                  <CyberSkeleton className="h-4 w-16" />
                  <CyberSkeleton className="h-4 w-16" />
                </div>
              </GlassCard>
            </motion.div>
          ))
        ) : repos.length ? repos.map((repo) => (
          <motion.div key={repo._id} variants={itemVariants}>
            <GlassCard interactive glowColor="var(--brand-primary)" className="p-5 group">
              <div className="flex flex-col md:flex-row justify-between gap-4">
                <div className="min-w-0 flex-1">
                  <Link to={`/${repo.owner?.username}/${repo.slug}`} className="flex items-center gap-2 group-hover:gap-3 transition-all">
                    <Book size={18} className="text-[var(--brand-primary)] group-hover:scale-110 transition-transform" />
                    <span className="text-xl font-display font-bold text-[var(--brand-primary)] group-hover:text-white transition-colors truncate">
                      <span className="opacity-60">{repo.owner?.username} / </span>
                      <span className="underline decoration-transparent group-hover:decoration-[var(--brand-primary)] underline-offset-4">{repo.name}</span>
                    </span>
                  </Link>
                  
                  <p className="mt-3 text-sm text-[var(--text-muted)] leading-relaxed line-clamp-2 max-w-3xl">
                    {repo.description || 'No operational data provided for this node.'}
                  </p>
                  
                  {repo.topics?.length > 0 && (
                    <div className="mt-4 flex flex-wrap gap-2">
                      {repo.topics.slice(0, 6).map((topic) => (
                        <CyberBadge key={topic} variant="primary" size="sm" className="bg-[var(--brand-primary)]/10 text-[var(--brand-primary)] border-[var(--brand-primary)]/30 lowercase">
                          #{topic}
                        </CyberBadge>
                      ))}
                    </div>
                  )}
                </div>
                
                <div className="flex flex-row md:flex-col shrink-0 gap-4 md:gap-2 text-xs font-mono text-[var(--text-muted)] md:items-end justify-start border-t md:border-t-0 md:border-l border-[var(--glass-border)] pt-4 md:pt-0 md:pl-4">
                  <div className="flex items-center gap-1.5 px-2 py-1 rounded bg-[var(--bg-tertiary)] border border-[var(--glass-border)]">
                    <Code2 size={14} className="text-[var(--text-main)]" />
                    <span>{repo.language || 'MIXED'}</span>
                  </div>
                  <div className="flex items-center gap-1.5 px-2 py-1 rounded bg-[var(--bg-tertiary)] border border-[var(--glass-border)] group-hover:border-[var(--brand-warning)]/50 transition-colors">
                    <Star size={14} className="group-hover:text-[var(--brand-warning)] transition-colors" />
                    <span className="group-hover:text-white transition-colors">{repo.starCount || 0}</span>
                  </div>
                  <div className="flex items-center gap-1.5 px-2 py-1 rounded bg-[var(--bg-tertiary)] border border-[var(--glass-border)] group-hover:border-[var(--brand-purple)]/50 transition-colors">
                    <GitFork size={14} className="group-hover:text-[var(--brand-purple)] transition-colors" />
                    <span className="group-hover:text-white transition-colors">{repo.forkCount || 0}</span>
                  </div>
                </div>
              </div>
            </GlassCard>
          </motion.div>
        )) : (
          <motion.div variants={itemVariants}>
            <GlassCard className="p-12 text-center flex flex-col items-center justify-center border-dashed border-[var(--glass-border)]">
              <Terminal size={48} className="text-[var(--text-muted)] opacity-30 mb-4" />
              <h3 className="text-xl font-bold mb-2">No Matching Nodes</h3>
              <p className="text-sm text-[var(--text-muted)]">Your search parameters yielded no results in the global network.</p>
            </GlassCard>
          </motion.div>
        )}
      </motion.div>
    </div>
  );
};

// Ensure Book is imported if not already in the lucide-react import
import { Book } from 'lucide-react';

export default Explore;
