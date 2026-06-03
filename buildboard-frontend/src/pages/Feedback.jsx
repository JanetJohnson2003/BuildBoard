import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import axios from 'axios';
import { GlassCard, NeonButton, CyberBadge, CyberSkeleton } from '../components/ui';
import { 
  MessageSquare, Trash2, CheckCircle2, Clock, Plus, X, 
  ChevronLeft, User as UserIcon, Calendar, AlertCircle, RefreshCw
} from 'lucide-react';
import { pageVariants, listVariants, itemVariants } from '../utils/animations';

function Feedback() {
  const { versionId } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    comment: '',
    status: 'pending'
  });

  const token = localStorage.getItem('token');
  const user = JSON.parse(localStorage.getItem('user') || '{}');

  // Fetch Feedback
  const { data: feedbackList, isLoading, error } = useQuery({
    queryKey: ['feedback', versionId],
    queryFn: async () => {
      const res = await axios.get(
        `/api/feedback/version/${versionId}`,
        {
          headers: { Authorization: token }
        }
      );
      return res.data;
    },
    enabled: !!versionId
  });

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  // Submit Feedback Mutation
  const submitMutation = useMutation({
    mutationFn: async () => {
      const res = await axios.post(
        `/api/feedback`,
        {
          versionId,
          comment: formData.comment,
          status: formData.status
        },
        {
          headers: {
            Authorization: token,
            'Content-Type': 'application/json'
          }
        }
      );
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['feedback', versionId]);
      setFormData({ comment: '', status: 'pending' });
      setShowForm(false);
    }
  });

  // Delete Feedback Mutation
  const deleteMutation = useMutation({
    mutationFn: async (feedbackId) => {
      await axios.delete(`/api/feedback/${feedbackId}`, {
        headers: { Authorization: token }
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['feedback', versionId]);
    }
  });

  // Resolve Feedback Mutation
  const resolveMutation = useMutation({
    mutationFn: async (feedbackId) => {
      await axios.put(
        `/api/feedback/${feedbackId}`,
        { status: 'resolved' },
        {
          headers: { Authorization: token }
        }
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['feedback', versionId]);
    }
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.comment.trim()) return;
    submitMutation.mutate();
  };

  const handleDelete = (feedbackId) => {
    if (window.confirm('Delete this feedback?')) {
      deleteMutation.mutate(feedbackId);
    }
  };

  const handleResolve = (feedbackId) => {
    resolveMutation.mutate(feedbackId);
  };

  if (isLoading) {
    return (
      <div className="p-8 max-w-4xl mx-auto space-y-6">
        <div className="flex items-center gap-4 mb-8">
          <CyberSkeleton className="w-10 h-10 rounded-lg" />
          <CyberSkeleton className="w-64 h-8" />
        </div>
        <div className="space-y-4">
          {[1, 2, 3].map(i => <CyberSkeleton key={i} className="h-32 rounded-xl" />)}
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
          <p className="text-sm font-mono text-[var(--text-muted)] mb-6">Failed to access feedback records.</p>
          <NeonButton variant="ghost" onClick={() => navigate(-1)}>RETURN</NeonButton>
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
      className="max-w-5xl mx-auto p-4 md:p-8 space-y-8"
    >
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[var(--glass-border)] pb-6">
        <div className="flex items-center gap-4">
          <button 
            onClick={() => navigate(-1)}
            className="w-10 h-10 rounded-lg bg-[var(--bg-tertiary)] border border-[var(--glass-border)] flex items-center justify-center text-[var(--text-muted)] hover:text-white hover:border-[var(--brand-primary)] transition-all group"
          >
            <ChevronLeft size={20} className="group-hover:-translate-x-1 transition-transform" />
          </button>
          <div>
            <h1 className="text-2xl md:text-3xl font-display font-bold flex items-center gap-3 text-white">
              <MessageSquare className="text-[var(--brand-purple)]" />
              BUILD_DIAGNOSTICS
            </h1>
            <p className="text-sm font-mono text-[var(--text-muted)] mt-1">
              Analyzing feedback for Build ID: <span className="text-[var(--brand-purple)] truncate max-w-[200px] inline-block align-bottom">{versionId}</span>
            </p>
          </div>
        </div>
        
        <NeonButton 
          variant={showForm ? 'ghost' : 'purple'}
          onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-2"
        >
          {showForm ? <><X size={16} /> ABORT_ENTRY</> : <><Plus size={16} /> NEW_DIAGNOSTIC</>}
        </NeonButton>
      </div>

      <AnimatePresence>
        {showForm && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <GlassCard className="p-6 md:p-8 border-t-[var(--brand-purple)] shadow-[0_10px_30px_rgba(157,78,221,0.1)] mb-8">
              <h2 className="text-xl font-display font-bold mb-6 flex items-center gap-2">
                <MessageSquare className="text-[var(--brand-purple)]" size={20} />
                INITIALIZE_FEEDBACK
              </h2>
              
              <div className="mb-6 space-y-2">
                <label className="text-xs font-mono text-[var(--text-muted)] pl-1 block uppercase tracking-wider">
                  Diagnostic Report
                </label>
                <textarea
                  name="comment"
                  value={formData.comment}
                  onChange={handleInputChange}
                  placeholder="Enter detailed feedback, bug reports, or feature requests for this build..."
                  className="w-full bg-[var(--bg-main)]/50 border border-[var(--glass-border)] rounded-lg p-4 text-sm font-mono text-[#c9d1d9] min-h-[120px] focus:border-[var(--brand-purple)] focus:ring-1 focus:ring-[var(--brand-purple)]/50 outline-none transition-all resize-y cyber-scrollbar leading-relaxed"
                  autoFocus
                />
              </div>

              <div className="mb-6 space-y-2">
                <label className="text-xs font-mono text-[var(--text-muted)] pl-1 block uppercase tracking-wider">
                  Status Designation
                </label>
                <div className="relative">
                  <select
                    name="status"
                    value={formData.status}
                    onChange={handleInputChange}
                    className="w-full md:w-64 bg-[var(--bg-main)]/50 border border-[var(--glass-border)] rounded-lg p-3 text-sm font-mono text-white focus:border-[var(--brand-purple)] outline-none appearance-none cursor-pointer"
                  >
                    <option value="pending">PENDING_REVIEW</option>
                    <option value="in_progress">IN_PROGRESS</option>
                    <option value="resolved">RESOLVED</option>
                  </select>
                  <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-[var(--text-muted)]">
                    ▼
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-[var(--glass-border)]">
                <NeonButton variant="ghost" onClick={() => setShowForm(false)}>
                  CANCEL
                </NeonButton>
                <NeonButton 
                  variant="purple" 
                  onClick={handleSubmit}
                  disabled={submitMutation.isPending || !formData.comment.trim()}
                >
                  {submitMutation.isPending ? 'TRANSMITTING...' : 'SUBMIT_DIAGNOSTIC'}
                </NeonButton>
              </div>
            </GlassCard>
          </motion.div>
        )}
      </AnimatePresence>

      <motion.div variants={listVariants} initial="hidden" animate="visible" className="space-y-4">
        {(!feedbackList || feedbackList.length === 0) ? (
          <GlassCard className="p-16 text-center flex flex-col items-center justify-center border-dashed">
            <MessageSquare size={64} className="text-[var(--text-muted)] opacity-20 mb-6" />
            <h3 className="text-2xl font-display font-bold mb-2">NO_DIAGNOSTICS_FOUND</h3>
            <p className="text-sm font-mono text-[var(--text-muted)] mb-8 max-w-md">
              There is currently no feedback for this build. Initialize a new diagnostic entry to provide insights.
            </p>
            <NeonButton variant="purple" onClick={() => setShowForm(true)} className="flex items-center gap-2">
              <Plus size={16} /> NEW_DIAGNOSTIC
            </NeonButton>
          </GlassCard>
        ) : (
          feedbackList.map((item) => (
            <motion.div key={item._id} variants={itemVariants}>
              <GlassCard className={`p-5 transition-all relative overflow-hidden group ${
                item.status === 'resolved' 
                  ? 'border-[var(--brand-success)]/30 bg-[var(--brand-success)]/5'
                  : item.status === 'in_progress'
                    ? 'border-[var(--brand-primary)]/30 bg-[var(--brand-primary)]/5'
                    : 'border-[var(--brand-warning)]/30 bg-[var(--brand-warning)]/5'
              }`}>
                {/* Background glow based on status */}
                <div className={`absolute top-0 right-0 w-32 h-32 blur-3xl rounded-full translate-x-1/2 -translate-y-1/2 opacity-20 pointer-events-none ${
                  item.status === 'resolved' ? 'bg-[var(--brand-success)]'
                    : item.status === 'in_progress' ? 'bg-[var(--brand-primary)]'
                    : 'bg-[var(--brand-warning)]'
                }`} />

                <div className="flex flex-col md:flex-row md:items-start justify-between gap-4 relative z-10">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="flex items-center gap-2 text-sm font-bold text-white bg-[var(--bg-tertiary)] px-3 py-1 rounded-full border border-[var(--glass-border)]">
                        <UserIcon size={14} className="text-[var(--brand-purple)]" />
                        {item.reviewerId?.name || 'ANONYMOUS_USER'}
                      </div>
                      <div className="flex items-center gap-1.5 text-xs font-mono text-[var(--text-muted)]">
                        <Calendar size={12} />
                        {new Date(item.createdAt).toLocaleString()}
                      </div>
                    </div>
                    
                    <p className="text-sm text-[var(--text-main)] leading-relaxed font-mono whitespace-pre-wrap pl-2 border-l-2 border-[var(--glass-border)]">
                      {item.comment}
                    </p>
                  </div>

                  <div className="flex flex-row md:flex-col items-center md:items-end justify-between md:justify-start gap-4 md:min-w-[140px]">
                    {item.status === 'resolved' ? (
                      <CyberBadge variant="success" className="flex items-center gap-1.5 font-mono shadow-[0_0_10px_rgba(0,255,136,0.3)]">
                        <CheckCircle2 size={12} /> RESOLVED
                      </CyberBadge>
                    ) : item.status === 'in_progress' ? (
                      <CyberBadge variant="primary" className="flex items-center gap-1.5 font-mono shadow-[0_0_10px_rgba(0,240,255,0.3)]">
                        <RefreshCw size={12} className="animate-spin-slow" /> IN_PROGRESS
                      </CyberBadge>
                    ) : (
                      <CyberBadge variant="warning" className="flex items-center gap-1.5 font-mono shadow-[0_0_10px_rgba(255,176,0,0.3)]">
                        <Clock size={12} /> PENDING
                      </CyberBadge>
                    )}

                    <div className="flex items-center gap-2">
                      {item.status !== 'resolved' && (
                        <button
                          onClick={() => handleResolve(item._id)}
                          disabled={resolveMutation.isPending}
                          title="Mark Resolved"
                          className="w-8 h-8 rounded bg-[var(--brand-success)]/10 text-[var(--brand-success)] border border-[var(--brand-success)]/30 flex items-center justify-center hover:bg-[var(--brand-success)] hover:text-white transition-colors"
                        >
                          <CheckCircle2 size={14} />
                        </button>
                      )}
                      <button
                        onClick={() => handleDelete(item._id)}
                        disabled={deleteMutation.isPending}
                        title="Delete Diagnostic"
                        className="w-8 h-8 rounded bg-[var(--brand-danger)]/10 text-[var(--brand-danger)] border border-[var(--brand-danger)]/30 flex items-center justify-center hover:bg-[var(--brand-danger)] hover:text-white transition-colors"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                </div>
              </GlassCard>
            </motion.div>
          ))
        )}
      </motion.div>
    </motion.div>
  );
}

export default Feedback;