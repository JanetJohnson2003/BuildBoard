import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import axios from 'axios';
import { GlassCard, NeonButton, CyberInput, CyberBadge, CyberSkeleton } from '../components/ui';
import { 
  Share2, Search, ChevronLeft, Calendar, User as UserIcon, AlertCircle, FileText, ArrowRight
} from 'lucide-react';
import { pageVariants, listVariants, itemVariants } from '../utils/animations';

function SharedProjects() {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  
  const token = localStorage.getItem('token');
  const user = JSON.parse(localStorage.getItem('user') || '{}');

  const { data: projects = [], isLoading, error } = useQuery({
    queryKey: ['sharedProjects'],
    queryFn: async () => {
      const res = await axios.get('/api/projects/shared/', {
        headers: { Authorization: token }
      });
      return res.data;
    },
    enabled: !!token
  });

  const filteredProjects = useMemo(() => {
    return projects.filter(p =>
      p.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.description?.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [projects, searchQuery]);

  if (!token || !user?.id) {
    return (
      <div className="flex items-center justify-center min-h-[60vh] p-8">
        <GlassCard glowColor="var(--brand-danger)" className="p-12 text-center max-w-md border-[var(--brand-danger)]/50 bg-[var(--brand-danger)]/5">
          <AlertCircle size={48} className="text-[var(--brand-danger)] mx-auto mb-4" />
          <h2 className="text-xl font-display font-bold text-white mb-2">ACCESS_DENIED</h2>
          <p className="text-sm font-mono text-[var(--text-muted)] mb-6">Authentication required to view shared projects.</p>
          <NeonButton variant="ghost" onClick={() => navigate('/login')}>AUTHENTICATE</NeonButton>
        </GlassCard>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="p-8 max-w-7xl mx-auto space-y-6">
        <div className="flex items-center gap-4 mb-8">
          <CyberSkeleton className="w-10 h-10 rounded-lg" />
          <CyberSkeleton className="w-64 h-8" />
        </div>
        <CyberSkeleton className="w-full max-w-md h-12 mb-8 rounded-lg" />
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map(i => <CyberSkeleton key={i} className="h-48 rounded-xl" />)}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[60vh] p-8">
        <GlassCard glowColor="var(--brand-danger)" className="p-12 text-center max-w-md border-[var(--brand-danger)]/50 bg-[var(--brand-danger)]/5">
          <AlertCircle size={48} className="text-[var(--brand-danger)] mx-auto mb-4" />
          <h2 className="text-xl font-display font-bold text-white mb-2">SYSTEM_ERROR</h2>
          <p className="text-sm font-mono text-[var(--text-muted)] mb-6">Failed to retrieve shared projects matrix.</p>
          <NeonButton variant="primary" onClick={() => navigate('/projects')}>RETURN</NeonButton>
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
      className="max-w-7xl mx-auto p-4 md:p-8 space-y-8"
    >
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[var(--glass-border)] pb-6">
        <div className="flex items-center gap-4">
          <button 
            onClick={() => navigate('/projects')}
            className="w-10 h-10 rounded-lg bg-[var(--bg-tertiary)] border border-[var(--glass-border)] flex items-center justify-center text-[var(--text-muted)] hover:text-white hover:border-[var(--brand-primary)] transition-all group shrink-0"
          >
            <ChevronLeft size={20} className="group-hover:-translate-x-1 transition-transform" />
          </button>
          <div>
            <h1 className="text-2xl md:text-3xl font-display font-bold flex items-center gap-3 text-white">
              <Share2 className="text-[var(--brand-primary)]" />
              SHARED_WITH_ME
            </h1>
            <p className="text-sm font-mono text-[var(--text-muted)] mt-1">
              Projects delegated to your clearance level.
            </p>
          </div>
        </div>
      </div>

      <div className="max-w-md">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--brand-primary)]" size={18} />
          <input
            type="text"
            placeholder="SCAN SHARED PROJECTS..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-[var(--bg-tertiary)] border border-[var(--glass-border)] rounded-lg py-3 pl-10 pr-4 text-sm font-mono text-white focus:border-[var(--brand-primary)] focus:ring-1 focus:ring-[var(--brand-primary)]/50 outline-none transition-all placeholder-[var(--text-muted)]"
          />
        </div>
      </div>

      <motion.div variants={listVariants} initial="hidden" animate="visible">
        {filteredProjects.length === 0 ? (
          <GlassCard className="p-16 text-center flex flex-col items-center justify-center border-dashed">
            <Share2 size={64} className="text-[var(--text-muted)] opacity-20 mb-6" />
            <h3 className="text-2xl font-display font-bold mb-2">NO_MATCHES_FOUND</h3>
            <p className="text-sm font-mono text-[var(--text-muted)] mb-8 max-w-md">
              {projects.length === 0 
                ? "No projects have been shared with your operative account." 
                : "No shared projects match your current scan parameters."}
            </p>
          </GlassCard>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            <AnimatePresence>
              {filteredProjects.map((project) => (
                <motion.div 
                  key={project._id} 
                  variants={itemVariants}
                  layout
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  transition={{ duration: 0.2 }}
                >
                  <GlassCard className="h-full flex flex-col p-0 overflow-hidden group hover:border-[var(--brand-primary)]/50 transition-colors">
                    <div className="p-5 border-b border-[var(--glass-border)] bg-black/40 relative overflow-hidden">
                      <div className="absolute top-0 right-0 w-24 h-24 bg-[var(--brand-primary)]/5 blur-2xl rounded-full translate-x-1/2 -translate-y-1/2" />
                      
                      <div className="flex justify-between items-start mb-2 relative z-10">
                        <h3 className="font-display font-bold text-lg text-white group-hover:text-[var(--brand-primary)] transition-colors truncate">
                          {project.title}
                        </h3>
                        <CyberBadge variant="primary" size="sm" className="font-mono ml-2 shrink-0">SHARED</CyberBadge>
                      </div>
                      
                      <div className="flex flex-col gap-1.5 mt-4 text-xs font-mono text-[var(--text-muted)] relative z-10">
                        <div className="flex items-center gap-2">
                          <UserIcon size={14} className="text-[var(--brand-warning)] shrink-0" />
                          <span className="truncate">{project.createdBy?.name || 'UNKNOWN_OWNER'}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Calendar size={14} className="text-[var(--brand-purple)] shrink-0" />
                          <span>{new Date(project.createdAt).toLocaleDateString()}</span>
                        </div>
                      </div>
                    </div>

                    <div className="p-5 flex-1">
                      <h4 className="text-[10px] font-mono uppercase tracking-widest text-[var(--text-muted)] mb-2">Project Brief</h4>
                      <p className="text-sm text-[var(--text-main)] line-clamp-3 leading-relaxed">
                        {project.description || 'No project description provided.'}
                      </p>
                    </div>

                    <div className="p-4 border-t border-[var(--glass-border)] bg-black/20 mt-auto">
                      <NeonButton 
                        variant="primary" 
                        className="w-full py-2 text-xs flex justify-center items-center gap-2"
                        onClick={() => navigate(`/versions/${project._id}`)}
                      >
                        <FileText size={14} /> ACCESS_VERSIONS <ArrowRight size={14} />
                      </NeonButton>
                    </div>
                  </GlassCard>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </motion.div>
    </motion.div>
  );
}

export default SharedProjects;