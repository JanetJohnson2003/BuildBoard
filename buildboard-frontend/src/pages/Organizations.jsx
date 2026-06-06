import React, { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import api from '../lib/api';
import { GlassCard, NeonButton, CyberInput, CyberBadge, CyberSkeleton } from '../components/ui';
import { pageVariants, listVariants, itemVariants } from '../utils/animations';
import { Building2, Plus, Globe, Lock, Shield, Server, Users } from 'lucide-react';

const Organizations = () => {
  const queryClient = useQueryClient();
  const [form, setForm] = useState({ name: '', description: '', visibility: 'public' });
  
  const { data: organizations = [], isLoading } = useQuery({
    queryKey: ['organizations'],
    queryFn: async () => (await api.get('/platform/organizations')).data,
  });

  const createOrg = useMutation({
    mutationFn: async () => (await api.post('/platform/organizations', form)).data,
    onSuccess: () => {
      setForm({ name: '', description: '', visibility: 'public' });
      queryClient.invalidateQueries({ queryKey: ['organizations'] });
    },
  });

  return (
    <motion.div 
      variants={pageVariants}
      initial="initial"
      animate="animate"
      exit="exit"
      className="max-w-7xl mx-auto py-8 px-4 space-y-8"
    >
      <div className="border-b border-[var(--glass-border)] pb-6 mb-8">
        <h1 className="text-3xl font-display font-bold flex items-center gap-3 text-white">
          <Building2 className="text-[var(--brand-primary)]" size={32} />
          SYNDICATE_OPERATIONS
        </h1>
        <p className="text-sm font-mono text-[var(--text-muted)] mt-2">
          Manage operational teams, repository clearance levels, sector permissions, and enterprise controls.
        </p>
      </div>

      <div className="grid gap-8 lg:grid-cols-[1fr_380px]">
        
        {/* Organizations List */}
        <section className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-display font-bold flex items-center gap-2 text-white">
              <Users size={20} className="text-[var(--brand-primary)]" />
              ACTIVE_SYNDICATES
            </h2>
            <CyberBadge variant="primary" size="sm">{organizations.length} FOUND</CyberBadge>
          </div>
          
          <GlassCard className="p-0 overflow-hidden border-t-2 border-t-[var(--brand-primary)]">
            {isLoading ? (
              <div className="p-6 space-y-4">
                {[1, 2, 3].map((i) => <CyberSkeleton key={i} className="h-20 rounded-lg" />)}
              </div>
            ) : organizations.length > 0 ? (
              <motion.div variants={listVariants} initial="hidden" animate="visible" className="divide-y divide-[var(--glass-border)]">
                {organizations.map((org) => (
                  <motion.div key={org._id} variants={itemVariants} className="p-5 hover:bg-[var(--bg-tertiary)]/50 transition-colors group">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-start gap-4">
                        <div className="mt-1 p-2 bg-black/40 rounded border border-[var(--glass-border)] text-[var(--brand-primary)] group-hover:border-[var(--brand-primary)]/50 group-hover:shadow-[0_0_10px_var(--brand-primary)] transition-all">
                          <Server size={24} />
                        </div>
                        <div>
                          <h3 className="text-lg font-display font-bold text-white group-hover:text-[var(--brand-primary)] transition-colors">
                            {org.name}
                          </h3>
                          <div className="mt-1 text-sm text-[var(--text-muted)] max-w-xl">
                            {org.description || <span className="italic opacity-50">No descriptor provided</span>}
                          </div>
                          <div className="mt-3 flex items-center gap-4 text-xs font-mono text-[var(--text-muted)]">
                            <span className="flex items-center gap-1">
                              <Shield size={12} className="text-[var(--brand-warning)]" /> Clearance: Standard
                            </span>
                            <span className="text-[var(--glass-border)]">|</span>
                            <span className="uppercase tracking-widest">{org.slug}</span>
                          </div>
                        </div>
                      </div>
                      
                      <CyberBadge 
                        variant={org.visibility === 'public' ? 'success' : 'warning'} 
                        icon={org.visibility === 'public' ? <Globe size={12} /> : <Lock size={12} />}
                      >
                        {org.visibility.toUpperCase()}
                      </CyberBadge>
                    </div>
                  </motion.div>
                ))}
              </motion.div>
            ) : (
              <div className="p-12 text-center flex flex-col items-center">
                <div className="p-4 bg-black/40 rounded-full border border-[var(--glass-border)] mb-4 text-[var(--text-muted)]">
                  <Building2 size={32} />
                </div>
                <h3 className="text-lg font-display font-bold text-white mb-2">NO_SYNDICATES_FOUND</h3>
                <p className="text-sm text-[var(--text-muted)] max-w-md">
                  You are not currently affiliated with any syndicates. Initialize a new one to begin collaborative operations.
                </p>
              </div>
            )}
          </GlassCard>
        </section>

        {/* Create Organization Form */}
        <aside>
          <GlassCard className="sticky top-6 border-t-2 border-t-[var(--brand-secondary)] p-6">
            <h2 className="text-lg font-display font-bold text-white mb-1 flex items-center gap-2">
              <Plus size={20} className="text-[var(--brand-secondary)]" />
              INITIALIZE_SYNDICATE
            </h2>
            <p className="text-xs font-mono text-[var(--text-muted)] mb-6">Register a new collaborative entity.</p>
            
            <form 
              className="space-y-5 font-mono" 
              onSubmit={(event) => { event.preventDefault(); createOrg.mutate(); }}
            >
              <div>
                <label className="block text-[10px] text-[var(--text-muted)] uppercase mb-2">Designation</label>
                <CyberInput 
                  placeholder="Syndicate Name" 
                  value={form.name} 
                  onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))} 
                  required 
                />
              </div>
              
              <div>
                <label className="block text-[10px] text-[var(--text-muted)] uppercase mb-2">Mission Parameters (Optional)</label>
                <textarea 
                  className="w-full bg-[var(--bg-tertiary)] border border-[var(--glass-border)] rounded-lg p-3 text-sm text-white focus:border-[var(--brand-primary)] focus:ring-1 focus:ring-[var(--brand-primary)]/50 outline-none transition-all min-h-[100px] resize-y" 
                  placeholder="Describe the syndicate's purpose..." 
                  value={form.description} 
                  onChange={(event) => setForm((current) => ({ ...current, description: event.target.value }))} 
                />
              </div>
              
              <div>
                <label className="block text-[10px] text-[var(--text-muted)] uppercase mb-2">Visibility Protocol</label>
                <div className="relative">
                  <select 
                    className="w-full bg-[var(--bg-tertiary)] border border-[var(--glass-border)] rounded-lg p-3 text-sm text-white focus:border-[var(--brand-primary)] focus:ring-1 focus:ring-[var(--brand-primary)]/50 outline-none transition-all appearance-none cursor-pointer pl-10" 
                    value={form.visibility} 
                    onChange={(event) => setForm((current) => ({ ...current, visibility: event.target.value }))}
                  >
                    <option value="public">GLOBAL (Public)</option>
                    <option value="private">RESTRICTED (Private)</option>
                  </select>
                  <div className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)] pointer-events-none">
                    {form.visibility === 'public' ? <Globe size={16} /> : <Lock size={16} />}
                  </div>
                </div>
              </div>
              
              <NeonButton 
                variant="secondary" 
                className="w-full mt-2" 
                disabled={createOrg.isPending}
                type="submit"
              >
                {createOrg.isPending ? 'INITIALIZING...' : 'EXECUTE_CREATION'}
              </NeonButton>
            </form>
          </GlassCard>
        </aside>

      </div>
    </motion.div>
  );
};

export default Organizations;
