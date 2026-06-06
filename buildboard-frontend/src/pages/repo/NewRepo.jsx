import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '../../context/AuthContext';
import api from '../../lib/api';
import { GlassCard, NeonButton, CyberInput } from '../../components/ui';
import { pageVariants, itemVariants, listVariants } from '../../utils/animations';
import { Database, Shield, ShieldAlert, FileText, AlertCircle } from 'lucide-react';

const newRepoSchema = z.object({
  name: z.string().min(1, 'Repository designation is required').regex(/^[a-zA-Z0-9-_]+$/, 'Designation can only contain alphanumeric characters, hyphens, and underscores'),
  description: z.string().optional(),
  visibility: z.enum(['public', 'private']),
  initReadme: z.boolean().default(true),
});

const NewRepo = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [errorMsg, setErrorMsg] = useState('');

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(newRepoSchema),
    defaultValues: {
      visibility: 'public',
      initReadme: true,
    }
  });

  const visibilityValue = watch('visibility');
  const nameValue = watch('name');

  const onSubmit = async (data) => {
    try {
      setErrorMsg('');
      const response = await api.post('/repos', {
        name: data.name,
        description: data.description,
        visibility: data.visibility,
        readme: data.initReadme ? `# ${data.name}\n\nOperational guidelines for sector ${data.name}.` : '',
      });
      navigate(`/${user.username}/${response.data.slug}`);
    } catch (err) {
      setErrorMsg(err.response?.data?.message || 'Failed to initialize sector.');
    }
  };

  return (
    <motion.div 
      variants={pageVariants}
      initial="initial"
      animate="animate"
      exit="exit"
      className="max-w-4xl mx-auto py-8 px-4"
    >
      <div className="border-b border-[var(--glass-border)] pb-6 mb-8 flex items-end justify-between">
        <div>
          <h1 className="text-3xl font-display font-bold flex items-center gap-3 text-white">
            <Database className="text-[var(--brand-primary)]" size={32} />
            INITIALIZE_SECTOR
          </h1>
          <p className="text-sm font-mono text-[var(--text-muted)] mt-2">
            Establish a new repository for your project files and revision history.
          </p>
        </div>
      </div>

      {errorMsg && (
        <motion.div 
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8 p-4 bg-[var(--brand-danger)]/10 border border-[var(--brand-danger)]/50 rounded-lg text-sm font-mono text-[var(--brand-danger)] flex items-start gap-3"
        >
          <AlertCircle size={18} className="shrink-0 mt-0.5" />
          <span>{errorMsg}</span>
        </motion.div>
      )}

      <form onSubmit={handleSubmit(onSubmit)}>
        <motion.div variants={listVariants} initial="hidden" animate="visible" className="space-y-8">
          
          <motion.div variants={itemVariants}>
            <GlassCard className="p-6 md:p-8 border-t-2 border-t-[var(--brand-primary)]">
              <h2 className="text-xs font-mono uppercase tracking-widest text-[var(--brand-primary)] mb-6">1. Core Metadata</h2>
              
              <div className="space-y-6">
                <div>
                  <label className="block text-xs font-mono text-[var(--text-muted)] uppercase mb-3">Sector Designation (Name) *</label>
                  <div className="flex items-center gap-3 bg-[var(--bg-tertiary)]/50 p-2 rounded-lg border border-[var(--glass-border)] focus-within:border-[var(--brand-primary)] focus-within:ring-1 focus-within:ring-[var(--brand-primary)]/50 transition-all">
                    <span className="text-base font-display font-bold text-white px-3 shrink-0 flex items-center gap-2">
                      {user?.username} <span className="text-[var(--brand-primary)]">/</span>
                    </span>
                    <input
                      type="text"
                      {...register('name')}
                      placeholder="e.g. project-apollo"
                      className="w-full bg-transparent border-none outline-none text-white font-mono text-base placeholder-[var(--text-muted)] py-1"
                      autoFocus
                    />
                  </div>
                  {errors.name && (
                    <p className="mt-2 text-xs font-mono text-[var(--brand-danger)] flex items-center gap-1">
                      <AlertCircle size={12} /> {errors.name.message}
                    </p>
                  )}
                  {nameValue && !errors.name && (
                    <p className="mt-2 text-xs font-mono text-[var(--brand-success)]">
                      Directory /<span className="text-white">{user?.username}/{nameValue}</span> will be created.
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-mono text-[var(--text-muted)] uppercase mb-3">Operational Brief (Description)</label>
                  <CyberInput
                    {...register('description')}
                    placeholder="Short description of this sector's purpose (optional)"
                  />
                </div>
              </div>
            </GlassCard>
          </motion.div>

          <motion.div variants={itemVariants}>
            <GlassCard className="p-6 md:p-8 border-t-2 border-t-[var(--brand-purple)]">
              <h2 className="text-xs font-mono uppercase tracking-widest text-[var(--brand-purple)] mb-6">2. Access Controls</h2>
              
              <div className="space-y-4">
                <label 
                  className={`flex items-start gap-4 p-4 rounded-lg border cursor-pointer transition-all ${
                    visibilityValue === 'public' 
                      ? 'bg-[var(--brand-success)]/10 border-[var(--brand-success)]/50 shadow-[0_0_15px_rgba(16,185,129,0.1)]' 
                      : 'bg-[var(--bg-tertiary)] border-[var(--glass-border)] hover:border-[var(--brand-success)]/30'
                  }`}
                >
                  <input type="radio" value="public" {...register('visibility')} className="mt-1 sr-only" />
                  <div className={`w-5 h-5 rounded-full border flex items-center justify-center shrink-0 mt-0.5 ${
                    visibilityValue === 'public' ? 'border-[var(--brand-success)]' : 'border-[var(--text-muted)]'
                  }`}>
                    {visibilityValue === 'public' && <div className="w-2.5 h-2.5 rounded-full bg-[var(--brand-success)]" />}
                  </div>
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <Shield className={visibilityValue === 'public' ? 'text-[var(--brand-success)]' : 'text-[var(--text-muted)]'} size={18} />
                      <span className={`font-display font-bold ${visibilityValue === 'public' ? 'text-white' : 'text-[var(--text-main)]'}`}>PUBLIC SECTOR</span>
                    </div>
                    <p className="text-xs font-mono text-[var(--text-muted)] leading-relaxed">
                      Anyone on the external network can see this repository. You control commit privileges.
                    </p>
                  </div>
                </label>

                <label 
                  className={`flex items-start gap-4 p-4 rounded-lg border cursor-pointer transition-all ${
                    visibilityValue === 'private' 
                      ? 'bg-[var(--brand-danger)]/10 border-[var(--brand-danger)]/50 shadow-[0_0_15px_rgba(239,68,68,0.1)]' 
                      : 'bg-[var(--bg-tertiary)] border-[var(--glass-border)] hover:border-[var(--brand-danger)]/30'
                  }`}
                >
                  <input type="radio" value="private" {...register('visibility')} className="mt-1 sr-only" />
                  <div className={`w-5 h-5 rounded-full border flex items-center justify-center shrink-0 mt-0.5 ${
                    visibilityValue === 'private' ? 'border-[var(--brand-danger)]' : 'border-[var(--text-muted)]'
                  }`}>
                    {visibilityValue === 'private' && <div className="w-2.5 h-2.5 rounded-full bg-[var(--brand-danger)]" />}
                  </div>
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <ShieldAlert className={visibilityValue === 'private' ? 'text-[var(--brand-danger)]' : 'text-[var(--text-muted)]'} size={18} />
                      <span className={`font-display font-bold ${visibilityValue === 'private' ? 'text-white' : 'text-[var(--text-main)]'}`}>PRIVATE SECTOR</span>
                    </div>
                    <p className="text-xs font-mono text-[var(--text-muted)] leading-relaxed">
                      Strict access control. Only authorized operatives can view or commit to this repository.
                    </p>
                  </div>
                </label>
              </div>
            </GlassCard>
          </motion.div>

          <motion.div variants={itemVariants}>
            <GlassCard className="p-6 md:p-8 border-t-2 border-t-[var(--brand-warning)]">
              <h2 className="text-xs font-mono uppercase tracking-widest text-[var(--brand-warning)] mb-6">3. Initialization Parameters</h2>
              
              <label className="flex items-start gap-4 p-4 rounded-lg bg-[var(--bg-tertiary)] border border-[var(--glass-border)] hover:border-[var(--brand-warning)]/30 cursor-pointer transition-all group">
                <div className="relative flex items-center justify-center mt-1">
                  <input 
                    type="checkbox" 
                    {...register('initReadme')} 
                    className="w-5 h-5 opacity-0 absolute cursor-pointer z-10" 
                  />
                  <div className={`w-5 h-5 rounded border flex items-center justify-center ${
                    watch('initReadme') ? 'bg-[var(--brand-warning)] border-[var(--brand-warning)]' : 'border-[var(--text-muted)] group-hover:border-[var(--brand-warning)]/50'
                  }`}>
                    {watch('initReadme') && (
                      <svg viewBox="0 0 14 14" fill="none" className="w-3.5 h-3.5 text-black">
                        <path d="M3 8L6 11L11 3.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    )}
                  </div>
                </div>
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <FileText className={watch('initReadme') ? 'text-[var(--brand-warning)]' : 'text-[var(--text-muted)]'} size={18} />
                    <span className={`font-display font-bold ${watch('initReadme') ? 'text-white' : 'text-[var(--text-main)]'}`}>GENERATE README.MD</span>
                  </div>
                  <p className="text-xs font-mono text-[var(--text-muted)] leading-relaxed">
                    Automatically create a README file containing project specifications.
                  </p>
                </div>
              </label>
            </GlassCard>
          </motion.div>

          <motion.div variants={itemVariants} className="flex justify-end pt-4">
            <NeonButton
              variant="primary"
              type="submit"
              disabled={isSubmitting}
              className={`w-full md:w-auto min-w-[240px] ${isSubmitting ? 'opacity-50' : ''}`}
            >
              {isSubmitting ? 'INITIALIZING_SECTOR...' : 'INITIALIZE_SECTOR'}
            </NeonButton>
          </motion.div>
          
        </motion.div>
      </form>
    </motion.div>
  );
};

export default NewRepo;
