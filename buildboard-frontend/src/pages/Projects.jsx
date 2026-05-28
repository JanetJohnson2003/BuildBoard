import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import axios from 'axios';
import { GlassCard, NeonButton, CyberInput, CyberBadge, CyberSkeleton, CyberModal } from '../components/ui';
import { 
  FolderGit2, Search, Filter, Plus, Calendar, Clock, Share2, 
  Settings, ChevronRight, AlertCircle, FileText, X, Rocket
} from 'lucide-react';
import { pageVariants, listVariants, itemVariants } from '../utils/animations';
import ShareModal from '../components/ShareModal';

function Projects() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  
  const [searchQuery, setSearchQuery] = useState('');
  const [filterDate, setFilterDate] = useState('all');
  const [showFilters, setShowFilters] = useState(false);
  
  // Create Project State
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newProject, setNewProject] = useState({ title: '', description: '' });
  const [createError, setCreateError] = useState('');

  // Share Modal State
  const [showShareModal, setShowShareModal] = useState(false);
  const [selectedProjectId, setSelectedProjectId] = useState(null);

  const token = localStorage.getItem('token');
  const user = JSON.parse(localStorage.getItem('user') || '{}');

  const { data: projects = [], isLoading, error } = useQuery({
    queryKey: ['projects'],
    queryFn: async () => {
      const res = await axios.get('http://localhost:5000/api/projects', {
        headers: { Authorization: token }
      });
      return res.data;
    },
    enabled: !!token
  });

  const createMutation = useMutation({
    mutationFn: async (data) => {
      const res = await axios.post('http://localhost:5000/api/projects', data, {
        headers: { Authorization: token }
      });
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['projects']);
      setShowCreateModal(false);
      setNewProject({ title: '', description: '' });
      setCreateError('');
    },
    onError: (err) => {
      setCreateError(err.response?.data?.message || 'Failed to create project');
    }
  });

  const filteredProjects = useMemo(() => {
    let filtered = projects;

    if (searchQuery.trim()) {
      filtered = filtered.filter(p =>
        p.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.description?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    if (filterDate !== 'all') {
      const now = new Date();
      filtered = filtered.filter(p => {
        const createdDate = new Date(p.createdAt);
        let daysAgo = 0;
        if (filterDate === 'week') daysAgo = 7;
        else if (filterDate === 'month') daysAgo = 30;
        else if (filterDate === 'year') daysAgo = 365;
        const cutoffDate = new Date(now.getTime() - daysAgo * 24 * 60 * 60 * 1000);
        return createdDate >= cutoffDate;
      });
    }

    return filtered;
  }, [projects, searchQuery, filterDate]);

  if (!token || !user?.id) {
    return (
      <div className="flex items-center justify-center min-h-[60vh] p-8">
        <GlassCard glowColor="var(--brand-danger)" className="p-12 text-center max-w-md border-[var(--brand-danger)]/50 bg-[var(--brand-danger)]/5">
          <AlertCircle size={48} className="text-[var(--brand-danger)] mx-auto mb-4" />
          <h2 className="text-xl font-display font-bold text-white mb-2">ACCESS_DENIED</h2>
          <p className="text-sm font-mono text-[var(--text-muted)] mb-6">Authentication required to view this sector.</p>
          <NeonButton variant="ghost" onClick={() => navigate('/login')}>AUTHENTICATE</NeonButton>
        </GlassCard>
      </div>
    );
  }

  const hasActiveFilters = searchQuery || filterDate !== 'all';

  return (
    <motion.div 
      variants={pageVariants}
      initial="initial"
      animate="animate"
      exit="exit"
      className="max-w-7xl mx-auto p-4 md:p-8 space-y-8"
    >
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-[var(--glass-border)] pb-6">
        <div>
          <h1 className="text-2xl md:text-3xl font-display font-bold flex items-center gap-3 text-white">
            <FolderGit2 className="text-[var(--brand-primary)]" />
            MY_PROJECTS
          </h1>
          <p className="text-sm font-mono text-[var(--text-muted)] mt-1">
            Manage your deployed sectors and version history.
          </p>
        </div>
        
        <div className="flex flex-wrap items-center gap-3">
          <NeonButton 
            variant="ghost" 
            onClick={() => setShowFilters(!showFilters)}
            className={`flex items-center gap-2 ${hasActiveFilters ? 'text-[var(--brand-warning)] border-[var(--brand-warning)]/50' : ''}`}
          >
            <Filter size={16} /> 
            {showFilters ? 'HIDE_FILTERS' : 'SHOW_FILTERS'}
            {hasActiveFilters && <span className="w-2 h-2 rounded-full bg-[var(--brand-warning)] ml-1 shadow-[0_0_8px_var(--brand-warning)] animate-pulse" />}
          </NeonButton>
          
          <NeonButton 
            variant="primary" 
            className="flex items-center gap-2"
            onClick={() => setShowCreateModal(true)}
          >
            <Plus size={16} /> INITIALIZE_PROJECT
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
            <GlassCard className="p-4 md:p-6 bg-[var(--bg-tertiary)]/50 border-dashed border-[var(--glass-border)]">
              <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-end">
                <div className="md:col-span-6 lg:col-span-8">
                  <label className="block text-[10px] font-mono text-[var(--text-muted)] mb-1.5 uppercase">Search Database</label>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--brand-primary)]" size={16} />
                    <input
                      type="text"
                      placeholder="Enter sector ID or designation..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full bg-black/40 border border-[var(--glass-border)] rounded-lg py-2.5 pl-9 pr-4 text-sm font-mono text-white focus:border-[var(--brand-primary)] focus:ring-1 focus:ring-[var(--brand-primary)]/50 outline-none transition-all placeholder-[var(--text-muted)]"
                    />
                  </div>
                </div>
                
                <div className="md:col-span-4 lg:col-span-3">
                  <label className="block text-[10px] font-mono text-[var(--text-muted)] mb-1.5 uppercase">Timeframe</label>
                  <select
                    value={filterDate}
                    onChange={(e) => setFilterDate(e.target.value)}
                    className="w-full bg-black/40 border border-[var(--glass-border)] rounded-lg py-2.5 px-3 text-sm font-mono text-white focus:border-[var(--brand-primary)] focus:ring-1 focus:ring-[var(--brand-primary)]/50 outline-none transition-all appearance-none cursor-pointer"
                  >
                    <option value="all">ALL_TIME</option>
                    <option value="week">PAST_7_DAYS</option>
                    <option value="month">PAST_30_DAYS</option>
                    <option value="year">PAST_YEAR</option>
                  </select>
                </div>
                
                <div className="md:col-span-2 lg:col-span-1 flex justify-end">
                  <button 
                    onClick={() => { setSearchQuery(''); setFilterDate('all'); }}
                    className="h-10 px-3 w-full md:w-auto rounded-lg border border-[var(--brand-danger)]/50 text-[var(--brand-danger)] hover:bg-[var(--brand-danger)]/10 text-xs font-mono transition-colors"
                  >
                    RESET
                  </button>
                </div>
              </div>
            </GlassCard>
          </motion.div>
        )}
      </AnimatePresence>

      {isLoading ? (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3, 4, 5, 6].map(i => <CyberSkeleton key={i} className="h-[280px] rounded-xl" />)}
        </div>
      ) : error ? (
        <GlassCard glowColor="var(--brand-danger)" className="p-8 text-center border-[var(--brand-danger)]/30">
          <AlertCircle size={32} className="text-[var(--brand-danger)] mx-auto mb-4" />
          <p className="text-[var(--text-main)] font-mono text-sm mb-4">Error accessing project database: {error.message}</p>
          <NeonButton onClick={() => queryClient.invalidateQueries(['projects'])}>RETRY_CONNECTION</NeonButton>
        </GlassCard>
      ) : (
        <motion.div variants={listVariants} initial="hidden" animate="visible">
          {filteredProjects.length === 0 ? (
            <GlassCard className="p-16 text-center flex flex-col items-center justify-center border-dashed">
              <FolderGit2 size={64} className="text-[var(--text-muted)] opacity-20 mb-6" />
              <h3 className="text-2xl font-display font-bold mb-2">NO_SECTORS_FOUND</h3>
              <p className="text-sm font-mono text-[var(--text-muted)] mb-8 max-w-md">
                {projects.length === 0 
                  ? "Your sector registry is currently empty. Initialize a new project to begin operations." 
                  : "No projects match your current filter parameters."}
              </p>
              {projects.length === 0 && (
                <NeonButton variant="primary" onClick={() => setShowCreateModal(true)}>
                  INITIALIZE_PROJECT
                </NeonButton>
              )}
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
                    <GlassCard className="h-full flex flex-col p-0 overflow-hidden group hover:border-[var(--brand-primary)]/40 transition-colors">
                      <div className="p-5 border-b border-[var(--glass-border)] bg-black/30 relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-[var(--brand-primary)]/10 blur-3xl rounded-full translate-x-1/2 -translate-y-1/2 group-hover:bg-[var(--brand-primary)]/20 transition-colors" />
                        
                        <div className="flex justify-between items-start mb-3 relative z-10">
                          <h3 className="font-display font-bold text-lg text-white group-hover:text-[var(--brand-primary)] transition-colors truncate">
                            {project.title}
                          </h3>
                          <CyberBadge variant="primary" size="sm" className="font-mono ml-2 shrink-0">OWNER</CyberBadge>
                        </div>
                        
                        <div className="flex flex-col gap-1.5 text-xs font-mono text-[var(--text-muted)] relative z-10">
                          <div className="flex items-center justify-between">
                            <span className="flex items-center gap-2">
                              <Calendar size={12} className="text-[var(--brand-purple)]" />
                              {new Date(project.createdAt).toLocaleDateString()}
                            </span>
                            {project.sharedWith?.length > 0 && (
                              <span className="flex items-center gap-1.5 text-[var(--brand-warning)]" title={`Shared with ${project.sharedWith.length} operatives`}>
                                <Share2 size={12} />
                                {project.sharedWith.length}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="p-5 flex-1">
                        <h4 className="text-[10px] font-mono uppercase tracking-widest text-[var(--text-muted)] mb-2">Sector Brief</h4>
                        <p className="text-sm text-[var(--text-main)] line-clamp-3 leading-relaxed">
                          {project.description || 'No operational description provided.'}
                        </p>
                      </div>

                      <div className="p-4 border-t border-[var(--glass-border)] bg-[var(--bg-tertiary)] flex gap-3 mt-auto">
                        <button
                          className="flex-1 bg-black/40 hover:bg-[var(--brand-primary)]/10 border border-[var(--glass-border)] hover:border-[var(--brand-primary)]/50 text-white rounded-lg py-2 px-3 text-xs font-mono flex items-center justify-center gap-2 transition-all"
                          onClick={() => navigate(`/versions/${project._id}`)}
                        >
                          <Settings size={14} className="text-[var(--brand-primary)]" /> MANAGE
                        </button>
                        <button
                          className="bg-black/40 hover:bg-[var(--brand-warning)]/10 border border-[var(--glass-border)] hover:border-[var(--brand-warning)]/50 text-white rounded-lg py-2 px-3 text-xs font-mono flex items-center justify-center transition-all"
                          onClick={() => {
                            setSelectedProjectId(project._id);
                            setShowShareModal(true);
                          }}
                          title="Share Project"
                        >
                          <Share2 size={16} className="text-[var(--brand-warning)]" />
                        </button>
                      </div>
                    </GlassCard>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          )}
        </motion.div>
      )}

      {/* CREATE PROJECT MODAL */}
      <AnimatePresence>
        {showCreateModal && (
          <CyberModal 
            title="INITIALIZE_NEW_SECTOR" 
            onClose={() => setShowCreateModal(false)}
            icon={<Rocket className="text-[var(--brand-success)]" />}
          >
            <div className="space-y-4 font-mono">
              {createError && (
                <div className="p-3 bg-[var(--brand-danger)]/10 border border-[var(--brand-danger)]/50 rounded-lg text-xs text-[var(--brand-danger)]">
                  {createError}
                </div>
              )}
              
              <div>
                <label className="block text-[10px] text-[var(--text-muted)] uppercase mb-2">Sector Designation (Title) *</label>
                <CyberInput 
                  placeholder="e.g. Project Apollo" 
                  value={newProject.title}
                  onChange={(e) => setNewProject({ ...newProject, title: e.target.value })}
                  autoFocus
                />
              </div>
              
              <div>
                <label className="block text-[10px] text-[var(--text-muted)] uppercase mb-2">Operational Brief (Description)</label>
                <textarea
                  className="w-full bg-[var(--bg-tertiary)] border border-[var(--glass-border)] rounded-lg p-3 text-sm text-white focus:border-[var(--brand-primary)] focus:ring-1 focus:ring-[var(--brand-primary)]/50 outline-none transition-all placeholder-[var(--text-muted)] resize-none"
                  rows={4}
                  placeholder="Enter project specifications..."
                  value={newProject.description}
                  onChange={(e) => setNewProject({ ...newProject, description: e.target.value })}
                />
              </div>

              <div className="pt-4 flex gap-3">
                <button 
                  className="flex-1 py-2.5 rounded-lg border border-[var(--glass-border)] hover:bg-white/5 text-[var(--text-muted)] hover:text-white transition-colors text-sm uppercase tracking-wider"
                  onClick={() => setShowCreateModal(false)}
                >
                  ABORT
                </button>
                <NeonButton 
                  variant="primary" 
                  className="flex-1"
                  onClick={() => {
                    if (!newProject.title.trim()) {
                      setCreateError('Sector Designation is required.');
                      return;
                    }
                    createMutation.mutate(newProject);
                  }}
                  disabled={createMutation.isPending}
                >
                  {createMutation.isPending ? 'INITIALIZING...' : 'INITIALIZE'}
                </NeonButton>
              </div>
            </div>
          </CyberModal>
        )}
      </AnimatePresence>

      {/* SHARE MODAL - Assuming ShareModal still works or handles its own UI */}
      {showShareModal && (
        <ShareModal
          projectId={selectedProjectId}
          onClose={() => {
            setShowShareModal(false);
            setSelectedProjectId(null);
          }}
          onShare={() => {
            queryClient.invalidateQueries(['projects']);
          }}
        />
      )}
    </motion.div>
  );
}

export default Projects;