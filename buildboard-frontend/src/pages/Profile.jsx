import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import api from '../lib/api';
import { 
  GlassCard, NeonButton, CyberInput, CyberBadge, 
  CyberSkeleton, AnimatedCounter 
} from '../components/ui';
import { ScrollReveal } from '../components/effects';
import { 
  User, MapPin, Link as LinkIcon, Calendar, 
  Star, GitFork, Book, Edit2, Check, X, Camera 
} from 'lucide-react';
import { listVariants, itemVariants } from '../utils/animations';
import { twMerge } from 'tailwind-merge';

const ContributionGraph = ({ days = [] }) => {
  const dayMap = new Map(days.map((d) => [d.date, d.count]));
  const cells = Array.from({ length: 364 }, (_, i) => {
    const date = new Date();
    date.setDate(date.getDate() - (363 - i));
    const key = date.toISOString().slice(0, 10);
    const count = dayMap.get(key) || 0;
    const level = count > 8 ? 4 : count > 4 ? 3 : count > 1 ? 2 : count > 0 ? 1 : 0;
    return { key, count, level };
  });

  return (
    <div className="w-full overflow-x-auto cyber-scrollbar pb-2">
      <div className="grid gap-1 min-w-[750px]" style={{ gridTemplateColumns: 'repeat(52, minmax(0, 1fr))' }} aria-label="Contribution calendar">
        {cells.map((cell) => {
          const colors = [
            'bg-[var(--bg-tertiary)] border-[var(--border-main)] opacity-30',
            'bg-[var(--brand-primary)]/30 border-[var(--brand-primary)]/40',
            'bg-[var(--brand-primary)]/60 border-[var(--brand-primary)]/70',
            'bg-[var(--brand-primary)] border-[var(--brand-primary)] shadow-[0_0_8px_rgba(0,212,255,0.6)]',
            'bg-white border-white shadow-[0_0_12px_rgba(255,255,255,0.9)]'
          ];
          
          return (
            <motion.div 
              key={cell.key} 
              initial={{ opacity: 0, scale: 0 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: Math.random() * 0.5 }}
              title={`${cell.key}: ${cell.count} modifications`}
              className={twMerge(
                "h-3 w-3 rounded-sm border transition-all hover:scale-150 hover:z-10",
                colors[cell.level]
              )}
            />
          );
        })}
      </div>
    </div>
  );
};

const Profile = () => {
  const { user, setUser } = useAuth();
  const queryClient = useQueryClient();
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({ name: '', bio: '', location: '', website: '', avatar: '' });

  const { data: profile, isLoading: profileLoading } = useQuery({
    queryKey: ['my-profile'],
    queryFn: async () => {
      const { data } = await api.get('/auth/me');
      return data;
    },
  });

  const { data: repos = [], isLoading: reposLoading } = useQuery({
    queryKey: ['my-repos'],
    queryFn: async () => {
      const { data } = await api.get('/repos');
      return data;
    },
  });

  const { data: dashboard } = useQuery({
    queryKey: ['platform-dashboard'],
    queryFn: async () => {
      const { data } = await api.get('/platform/dashboard');
      return data;
    },
  });

  const updateProfile = useMutation({
    mutationFn: async (payload) => {
      const { data } = await api.put('/users/profile', payload);
      return data;
    },
    onSuccess: (data) => {
      setUser((prev) => ({ ...prev, ...data }));
      queryClient.invalidateQueries({ queryKey: ['my-profile'] });
      setEditing(false);
    },
  });

  const displayUser = profile || user;

  const startEdit = () => {
    setForm({
      name: displayUser?.name || '',
      bio: displayUser?.bio || '',
      location: displayUser?.location || '',
      website: displayUser?.website || '',
      avatar: displayUser?.avatar || '',
    });
    setEditing(true);
  };

  const handleAvatarChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setForm((prev) => ({ ...prev, avatar: reader.result }));
      };
      reader.readAsDataURL(file);
    }
  };

  const joinDate = displayUser?.createdAt
    ? new Date(displayUser.createdAt).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
    : null;

  if (profileLoading || reposLoading) {
    return (
      <div className="space-y-6">
        <div className="border-b border-[var(--glass-border)] pb-4">
          <CyberSkeleton className="h-8 w-48 mb-2" />
          <CyberSkeleton className="h-4 w-72" />
        </div>
        <div className="grid gap-6 lg:grid-cols-[300px_minmax(0,1fr)]">
          <div className="space-y-4">
            <CyberSkeleton className="h-32 w-32 rounded-full" />
            <CyberSkeleton className="h-6 w-48" />
            <CyberSkeleton className="h-4 w-32" />
            <CyberSkeleton className="h-24 w-full" />
          </div>
          <div className="space-y-6">
            <CyberSkeleton className="h-48 w-full" />
            <div className="grid gap-4">
              <CyberSkeleton className="h-32 w-full" />
              <CyberSkeleton className="h-32 w-full" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-4 border-b border-[var(--glass-border)] pb-5 md:flex-row md:items-end relative">
        <div className="absolute bottom-0 left-0 right-0 h-[1px] bg-gradient-to-r from-[var(--brand-purple)] via-transparent to-transparent opacity-50" />
        <div>
          <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded text-xs font-mono font-medium bg-[var(--brand-purple)]/10 text-[var(--brand-purple)] mb-3">
            <User size={12} />
            OPERATIVE_PROFILE
          </div>
          <h1 className="text-3xl font-display font-bold">Identity Node</h1>
          <p className="mt-1 text-sm text-[var(--text-muted)]">Public profile and operational parameters</p>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[320px_minmax(0,1fr)]">
        {/* Left Column — Avatar + Bio + Edit Form */}
        <motion.aside 
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="space-y-6"
        >
          <GlassCard className="p-6 border-t-[var(--brand-purple)] text-center relative overflow-hidden">
            <div className="absolute top-0 right-0 p-4">
              {!editing && (
                <button onClick={startEdit} className="p-2 rounded-full bg-[var(--bg-main)]/50 hover:bg-[var(--brand-primary)]/20 text-[var(--text-muted)] hover:text-[var(--brand-primary)] transition-colors border border-[var(--glass-border)] hover:border-[var(--brand-primary)]/50">
                  <Edit2 size={16} />
                </button>
              )}
            </div>

            <div className="relative mx-auto h-32 w-32 mb-6 group">
              <div className="absolute inset-0 rounded-full border-2 border-[var(--brand-purple)]/30 scale-110 animate-[spin_10s_linear_infinite]" />
              <div className="absolute inset-0 rounded-full border-2 border-dashed border-[var(--brand-primary)]/50 scale-105 animate-[spin_15s_linear_infinite_reverse]" />
              
              <div className="relative h-full w-full overflow-hidden rounded-full border-4 border-[#0a0a0f] bg-[var(--bg-tertiary)] flex items-center justify-center">
                {(editing ? form.avatar : displayUser?.avatar) ? (
                  <img src={editing ? form.avatar : displayUser.avatar} alt="Avatar" className="h-full w-full object-cover" />
                ) : (
                  <span className="text-4xl font-display font-bold text-[var(--text-muted)]">
                    {(displayUser?.username || 'O').slice(0, 1).toUpperCase()}
                  </span>
                )}
                
                {editing && (
                  <label className="absolute inset-0 bg-black/60 backdrop-blur-sm flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 cursor-pointer transition-all text-xs font-mono text-white">
                    <Camera size={20} className="mb-1" />
                    UPLOAD
                    <input type="file" accept="image/*" className="hidden" onChange={handleAvatarChange} />
                  </label>
                )}
              </div>
            </div>

            <AnimatePresence mode="wait">
              {editing ? (
                <motion.div
                  key="editing"
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="space-y-4 text-left"
                >
                  <CyberInput
                    icon={User}
                    label="Public Identity"
                    value={form.name}
                    onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
                  />
                  <div className="space-y-1">
                    <label className="text-xs font-mono text-[var(--text-muted)] pl-1 block">Bio / Designation</label>
                    <textarea 
                      className="w-full bg-[var(--bg-main)]/50 border border-[var(--glass-border)] rounded-lg p-3 text-sm focus:border-[var(--brand-primary)] focus:ring-1 focus:ring-[var(--brand-primary)]/50 outline-none transition-all resize-none font-mono placeholder:text-[var(--text-muted)]/50"
                      rows={3} 
                      value={form.bio} 
                      onChange={(e) => setForm((p) => ({ ...p, bio: e.target.value }))}
                      placeholder="Enter operational status..."
                    />
                  </div>
                  <CyberInput
                    icon={MapPin}
                    label="Sector Location"
                    value={form.location}
                    onChange={(e) => setForm((p) => ({ ...p, location: e.target.value }))}
                  />
                  <CyberInput
                    icon={LinkIcon}
                    label="External Comms"
                    type="url"
                    value={form.website}
                    onChange={(e) => setForm((p) => ({ ...p, website: e.target.value }))}
                  />
                  <div className="flex gap-3 pt-2">
                    <NeonButton 
                      variant="primary" 
                      className="flex-1" 
                      onClick={() => updateProfile.mutate(form)} 
                      disabled={updateProfile.isPending}
                    >
                      {updateProfile.isPending ? 'UPLOADING...' : <><Check size={16} /> SAVE</>}
                    </NeonButton>
                    <NeonButton 
                      variant="ghost" 
                      className="flex-1" 
                      onClick={() => setEditing(false)}
                    >
                      <X size={16} /> ABORT
                    </NeonButton>
                  </div>
                </motion.div>
              ) : (
                <motion.div
                  key="viewing"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                >
                  <h2 className="text-2xl font-display font-bold text-white">
                    {displayUser?.name || displayUser?.username}
                  </h2>
                  <p className="text-sm font-mono text-[var(--brand-primary)] mb-4">
                    @{displayUser?.username}
                  </p>
                  
                  {displayUser?.bio && (
                    <div className="p-4 rounded-xl bg-[var(--bg-main)]/50 border border-[var(--glass-border)] mb-4">
                      <p className="text-sm text-[var(--text-muted)] italic">"{displayUser.bio}"</p>
                    </div>
                  )}

                  <div className="space-y-3 text-sm font-mono text-left mt-6">
                    {displayUser?.location && (
                      <div className="flex items-center gap-3 text-[var(--text-muted)]">
                        <MapPin size={16} className="text-[var(--brand-primary)]" /> {displayUser.location}
                      </div>
                    )}
                    {displayUser?.website && (
                      <div className="flex items-center gap-3 text-[var(--text-muted)]">
                        <LinkIcon size={16} className="text-[var(--brand-primary)]" />
                        <a href={displayUser.website} target="_blank" rel="noopener noreferrer" className="hover:text-white hover:underline transition-colors truncate">
                          {displayUser.website.replace(/^https?:\/\//, '')}
                        </a>
                      </div>
                    )}
                    {joinDate && (
                      <div className="flex items-center gap-3 text-[var(--text-muted)]">
                        <Calendar size={16} className="text-[var(--brand-primary)]" /> Initiated {joinDate}
                      </div>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </GlassCard>

          {/* Stats Summary */}
          <div className="grid grid-cols-2 gap-3">
            {[
              { label: 'NODES', value: dashboard?.counts?.repositories ?? repos.length, color: 'var(--brand-primary)' },
              { label: 'ANOMALIES', value: dashboard?.counts?.issues ?? 0, color: 'var(--brand-warning)' },
              { label: 'MERGES', value: dashboard?.counts?.pullRequests ?? 0, color: 'var(--brand-purple)' },
              { label: 'STARS', value: dashboard?.counts?.stars ?? 0, color: 'var(--brand-success)' },
            ].map((stat, idx) => (
              <ScrollReveal delay={idx * 0.1} key={stat.label}>
                <GlassCard interactive glowColor={stat.color} className="p-4 text-center">
                  <div className="text-3xl font-display font-bold text-white mb-1">
                    <AnimatedCounter value={stat.value ?? 0} />
                  </div>
                  <div className="text-xs font-mono text-[var(--text-muted)]">{stat.label}</div>
                </GlassCard>
              </ScrollReveal>
            ))}
          </div>
        </motion.aside>

        {/* Right Column — Activity + Repos */}
        <motion.div 
          variants={listVariants}
          initial="hidden"
          animate="visible"
          className="space-y-6"
        >
          {/* Contribution Graph */}
          <motion.div variants={itemVariants}>
            <GlassCard className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="font-display font-bold text-lg flex items-center gap-2">
                  <Activity size={18} className="text-[var(--brand-success)]" /> Activity Matrix
                </h2>
                <CyberBadge variant="neutral" size="sm">T-365_DAYS</CyberBadge>
              </div>
              <ContributionGraph days={dashboard?.contributionGraph || []} />
            </GlassCard>
          </motion.div>

          {/* Repositories */}
          <motion.div variants={itemVariants}>
            <div className="flex justify-between items-center mb-4 px-1">
              <h2 className="font-display font-bold text-lg flex items-center gap-2">
                <Book size={18} className="text-[var(--brand-primary)]" /> Active Nodes
              </h2>
              <Link to="/new">
                <NeonButton variant="primary" className="py-1.5 px-3 text-xs">INITIALIZE NODE</NeonButton>
              </Link>
            </div>

            {repos.length === 0 ? (
              <GlassCard className="p-10 text-center flex flex-col items-center">
                <Book size={48} className="text-[var(--text-muted)] opacity-50 mb-4" />
                <h3 className="text-lg font-bold mb-2">No Active Nodes Detected</h3>
                <p className="text-sm text-[var(--text-muted)] mb-6">You have not initialized any repositories in this sector.</p>
                <Link to="/new">
                  <NeonButton variant="primary">Deploy First Node</NeonButton>
                </Link>
              </GlassCard>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2">
                {repos.slice(0, 10).map((repo, idx) => (
                  <motion.div
                    key={repo._id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.05 }}
                  >
                    <GlassCard interactive glowColor="var(--brand-primary)" className="p-5 h-full flex flex-col group">
                      <div className="flex justify-between items-start mb-3">
                        <Link to={`/${displayUser?.username}/${repo.slug}`} className="text-base font-bold text-[var(--brand-primary)] group-hover:text-white transition-colors truncate pr-2 hover:underline">
                          {repo.name}
                        </Link>
                        <CyberBadge variant={repo.visibility === 'private' ? 'warning' : 'success'} size="sm" className="px-1.5 py-0.5 text-[10px]">
                          {repo.visibility || 'PUBLIC'}
                        </CyberBadge>
                      </div>
                      
                      {repo.description && (
                        <p className="text-sm text-[var(--text-muted)] mb-4 flex-1 line-clamp-2">
                          {repo.description}
                        </p>
                      )}
                      
                      <div className="flex items-center gap-4 text-xs font-mono text-[var(--text-muted)] mt-auto pt-4 border-t border-[var(--glass-border)]">
                        {repo.language && (
                          <span className="flex items-center gap-1.5">
                            <span className="w-2 h-2 rounded-full bg-[var(--brand-primary)]" />
                            {repo.language}
                          </span>
                        )}
                        <span className="flex items-center gap-1 group-hover:text-[var(--brand-warning)] transition-colors">
                          <Star size={14} /> {repo.stars || 0}
                        </span>
                        <span className="flex items-center gap-1 group-hover:text-[var(--brand-purple)] transition-colors">
                          <GitFork size={14} /> {repo.forks || 0}
                        </span>
                      </div>
                    </GlassCard>
                  </motion.div>
                ))}
              </div>
            )}
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
};

// Ensure Activity icon is imported
import { Activity } from 'lucide-react';

export default Profile;
