import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../../lib/api';
import { GlassCard, NeonButton, CyberInput, CyberBadge } from '../ui';
import {
  AlertCircle, CheckCircle2, MessageSquare, Plus, X, User as UserIcon, AlertTriangle, DollarSign
} from 'lucide-react';
import { listVariants, itemVariants } from '../../utils/animations';

export const CreateIssueModal = ({ owner, repo, defaultTitle = '', defaultDescription = '', onClose, onSuccess }) => {
  const [title, setTitle] = useState(defaultTitle);
  const [description, setDescription] = useState(defaultDescription);
  const [assignee, setAssignee] = useState('');
  
  const { data: users } = useQuery({
    queryKey: ['all-users'],
    queryFn: async () => (await api.get('/admin/users')).data.users || [],
  });

  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: async () => {
      return (await api.post(`/issues/${owner}/${repo}`, {
        title,
        body: description,
        assignees: assignee ? [assignee] : [],
        labels: []
      })).data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['repo-issues', owner, repo] });
      onSuccess();
      onClose();
    }
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      
      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="relative w-full max-w-2xl"
      >
        <GlassCard className="p-0 overflow-hidden border-t-[var(--brand-warning)] shadow-2xl shadow-[var(--brand-warning)]/10">
          <div className="border-b border-[var(--glass-border)] px-6 py-4 flex items-center justify-between bg-black/40">
            <h2 className="text-xl font-display font-bold flex items-center gap-2">
              <AlertTriangle className="text-[var(--brand-warning)]" />
              REPORT_ANOMALY
            </h2>
            <button onClick={onClose} className="text-[var(--text-muted)] hover:text-white transition-colors">
              <X size={20} />
            </button>
          </div>
          
          <div className="p-6 space-y-5">
            <CyberInput
              label="Anomaly Designation"
              placeholder="Brief description of the issue..."
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
            
            <div className="space-y-1">
              <label className="text-xs font-mono text-[var(--text-muted)] pl-1 block">Diagnostic Details</label>
              <textarea
                className="w-full min-h-[160px] bg-[var(--bg-main)]/50 border border-[var(--glass-border)] rounded-lg p-3 text-sm focus:border-[var(--brand-primary)] focus:ring-1 focus:ring-[var(--brand-primary)]/50 outline-none transition-all resize-none font-mono placeholder:text-[var(--text-muted)]/50"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Provide comprehensive details, steps to reproduce, or requested changes..."
              />
            </div>
            
            <div className="space-y-1">
              <label className="text-xs font-mono text-[var(--text-muted)] pl-1 block">Assign Operative (Optional)</label>
              <select
                className="w-full bg-[var(--bg-main)]/50 border border-[var(--glass-border)] rounded-lg p-3 text-sm focus:border-[var(--brand-primary)] focus:ring-1 focus:ring-[var(--brand-primary)]/50 outline-none transition-all appearance-none cursor-pointer text-[var(--text-main)]"
                value={assignee}
                onChange={(e) => setAssignee(e.target.value)}
              >
                <option value="">-- UNASSIGNED --</option>
                {users?.map(u => (
                  <option key={u._id} value={u._id}>{u.username} ({u.role})</option>
                ))}
              </select>
            </div>
          </div>
          
          <div className="border-t border-[var(--glass-border)] px-6 py-4 flex justify-end gap-3 bg-black/20">
            <NeonButton variant="ghost" onClick={onClose}>
              ABORT
            </NeonButton>
            <NeonButton
              variant="primary"
              onClick={() => mutation.mutate()}
              disabled={!title || mutation.isPending}
            >
              {mutation.isPending ? 'TRANSMITTING...' : 'SUBMIT_REPORT'}
            </NeonButton>
          </div>
        </GlassCard>
      </motion.div>
    </div>
  );
};

export const FundIssueModal = ({ issue, owner, repo, onClose, onSuccess }) => {
  const [amount, setAmount] = useState(issue.bountyAmount || 0);
  const queryClient = useQueryClient();
  const [isFunding, setIsFunding] = useState(false);

  const handleFund = async () => {
    setIsFunding(true);
    try {
      await api.put(`/issues/${owner}/${repo}/${issue.number}`, { bountyAmount: Number(amount) });
      queryClient.invalidateQueries({ queryKey: ['repo-issues', owner, repo] });
      onSuccess();
      onClose();
    } catch (err) {
      alert('Failed to set bounty');
    } finally {
      setIsFunding(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      
      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="relative w-full max-w-md"
      >
        <GlassCard className="p-0 overflow-hidden border-t-[var(--brand-success)] shadow-2xl shadow-[var(--brand-success)]/10">
          <div className="border-b border-[var(--glass-border)] px-6 py-4 flex items-center justify-between bg-black/40">
            <h2 className="text-xl font-display font-bold flex items-center gap-2">
              <DollarSign className="text-[var(--brand-success)]" />
              FUND_BOUNTY
            </h2>
            <button onClick={onClose} className="text-[var(--text-muted)] hover:text-white transition-colors">
              <X size={20} />
            </button>
          </div>
          
          <div className="p-6 space-y-5">
            <p className="text-sm text-[var(--text-muted)]">Attach a monetary bounty to incentivize developers to solve this issue: <strong className="text-white">{issue.title}</strong></p>
            <div className="relative">
              <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" size={16} />
              <input
                type="number"
                min="0"
                className="w-full bg-[var(--bg-main)]/50 border border-[var(--glass-border)] rounded-lg p-3 pl-9 text-lg font-mono text-[var(--brand-success)] focus:border-[var(--brand-success)] focus:ring-1 focus:ring-[var(--brand-success)]/50 outline-none transition-all"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
              />
            </div>
            <div className="text-xs text-[var(--brand-warning)] flex items-center gap-1">
               <AlertTriangle size={12} /> Powered by Stripe (Simulated)
            </div>
          </div>
          
          <div className="border-t border-[var(--glass-border)] px-6 py-4 flex justify-end gap-3 bg-black/20">
            <NeonButton variant="ghost" onClick={onClose}>
              CANCEL
            </NeonButton>
            <NeonButton
              variant="primary"
              className="bg-[var(--brand-success)]/20 text-[var(--brand-success)] border-[var(--brand-success)] hover:bg-[var(--brand-success)]/40"
              onClick={handleFund}
              disabled={isFunding || !amount}
            >
              {isFunding ? 'PROCESSING...' : 'FUND_ISSUE'}
            </NeonButton>
          </div>
        </GlassCard>
      </motion.div>
    </div>
  );
};

export const IssuesTab = ({ owner, repo, issueModalOpen, setIssueModalOpen, selectedFileForIssue }) => {
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['repo-issues', owner, repo],
    queryFn: async () => {
      const { data } = await api.get(`/issues/${owner}/${repo}`, { params: { status: 'all' } });
      return data;
    },
  });

  const [bountyIssue, setBountyIssue] = useState(null);

  const handleSetBounty = (e, issue) => {
    e.stopPropagation();
    setBountyIssue(issue);
  };

  const totalBounty = data?.issues?.reduce((acc, issue) => acc + (issue.bountyAmount || 0), 0) || 0;

  if (isLoading) {
    return (
      <GlassCard className="p-12 text-center flex items-center justify-center">
        <div className="animate-pulse flex items-center gap-3">
          <div className="w-5 h-5 rounded-full border-2 border-[var(--brand-primary)] border-t-transparent animate-spin" />
          <span className="font-mono text-sm text-[var(--brand-primary)]">SCANNING_FOR_ANOMALIES...</span>
        </div>
      </GlassCard>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-[var(--bg-tertiary)] border border-[var(--glass-border)] rounded-lg p-4">
        <div className="flex gap-6">
          <div className="flex items-center gap-2 text-[var(--text-main)] font-semibold cursor-pointer hover:text-white transition-colors">
            <AlertCircle size={18} />
            {data?.openCount || 0} Open
          </div>
          <div className="flex items-center gap-2 text-[var(--text-muted)] cursor-pointer hover:text-white transition-colors">
            <CheckCircle2 size={18} />
            {data?.closedCount || 0} Closed
          </div>
          {totalBounty > 0 && (
            <div className="flex items-center gap-2 text-[var(--brand-success)] font-mono font-bold cursor-help" title="Total Active Bounties">
              <DollarSign size={18} />
              {totalBounty} Active Bounties
            </div>
          )}
        </div>
        
        <NeonButton variant="primary" onClick={() => setIssueModalOpen(true)} className="py-1.5 px-4 text-xs flex items-center gap-1.5">
          <Plus size={14} /> NEW_ANOMALY
        </NeonButton>
      </div>

      <motion.div variants={listVariants} initial="hidden" animate="visible">
        <GlassCard className="p-0 overflow-hidden divide-y divide-[var(--glass-border)]">
          {(data?.issues || []).map((issue) => {
            const isMarkedForChange = issue.title.includes('Marked for change');
            return (
              <motion.div key={issue._id} variants={itemVariants}>
                <div className={`p-4 hover:bg-white/5 transition-colors group relative ${isMarkedForChange ? 'bg-[var(--brand-warning)]/5' : ''}`}>
                  {isMarkedForChange && (
                    <div className="absolute left-0 top-0 bottom-0 w-1 bg-[var(--brand-warning)] opacity-50" />
                  )}
                  
                  <div className="flex items-start gap-3">
                    <div className="pt-1">
                      {issue.status === 'closed' ? (
                        <CheckCircle2 size={18} className="text-[var(--brand-purple)]" />
                      ) : (
                        <AlertCircle size={18} className="text-[var(--brand-success)]" />
                      )}
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2 mb-1">
                        <span className="font-display font-bold text-base text-[var(--text-main)] group-hover:text-[var(--brand-primary)] transition-colors cursor-pointer">
                          {issue.title}
                        </span>
                        
                        {issue.priority && (
                          <CyberBadge variant="neutral" size="sm" className="lowercase border-dashed">
                            {issue.priority}
                          </CyberBadge>
                        )}
                        {isMarkedForChange && (
                          <CyberBadge variant="warning" size="sm" className="uppercase">
                            ACTION_REQUIRED
                          </CyberBadge>
                        )}

                        <div className="ml-auto flex items-center gap-2">
                          {issue.bountyAmount > 0 && (
                            <CyberBadge variant="success" size="sm" className="flex items-center gap-1 font-mono text-[var(--brand-success)] border-[var(--brand-success)] shadow-[0_0_10px_var(--brand-success)]">
                              <DollarSign size={12} />
                              {issue.bountyAmount}
                            </CyberBadge>
                          )}
                          <button 
                            onClick={(e) => handleSetBounty(e, issue)}
                            className="opacity-0 group-hover:opacity-100 transition-opacity text-xs font-mono text-[var(--brand-primary)] hover:underline border border-[var(--brand-primary)]/30 rounded px-2 py-0.5"
                          >
                            Set Bounty
                          </button>
                        </div>
                      </div>
                      
                      <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-xs font-mono text-[var(--text-muted)]">
                        <span>#{issue.number} opened by <span className="text-[var(--text-main)]">@{issue.author?.username || 'unknown'}</span></span>
                        
                        {issue.assignee && (
                          <span className="flex items-center gap-1">
                            <UserIcon size={12} />
                            Assigned: <span className="text-[var(--text-main)]">@{issue.assignee.username}</span>
                          </span>
                        )}
                        
                        {issue.commentCount > 0 && (
                          <span className="flex items-center gap-1.5">
                            <MessageSquare size={12} />
                            {issue.commentCount}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            );
          })}
          
          {(!data?.issues || data.issues.length === 0) && (
            <div className="p-12 text-center flex flex-col items-center justify-center">
              <CheckCircle2 size={48} className="text-[var(--text-muted)] opacity-30 mb-4" />
              <h3 className="text-xl font-bold mb-2">SYSTEM_NOMINAL</h3>
              <p className="text-sm text-[var(--text-muted)] font-mono">No anomalies detected in this sector.</p>
            </div>
          )}
        </GlassCard>
      </motion.div>

      <AnimatePresence>
        {issueModalOpen && (
          <CreateIssueModal
            owner={owner}
            repo={repo}
            defaultTitle={selectedFileForIssue ? `Marked for change: ${selectedFileForIssue}` : ''}
            defaultDescription={selectedFileForIssue ? `Please review and update the file: \`${selectedFileForIssue}\`.\n\nChanges requested by reviewer.` : ''}
            onClose={() => setIssueModalOpen(false)}
            onSuccess={() => queryClient.invalidateQueries({ queryKey: ['repo-issues', owner, repo] })}
          />
        )}
      </AnimatePresence>
      <AnimatePresence>
        {bountyIssue && (
          <FundIssueModal
            owner={owner}
            repo={repo}
            issue={bountyIssue}
            onClose={() => setBountyIssue(null)}
            onSuccess={() => {}}
          />
        )}
      </AnimatePresence>
    </div>
  );
};
