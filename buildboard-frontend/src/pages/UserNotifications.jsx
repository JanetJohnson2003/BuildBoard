import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../lib/api';
import { GlassCard, NeonButton, CyberSkeleton } from '../components/ui';
import { pageVariants, listVariants, itemVariants } from '../utils/animations';
import { Bell, Check, CircleDot, GitPullRequest, AtSign, CheckCircle2 } from 'lucide-react';

const UserNotifications = () => {
  const queryClient = useQueryClient();
  const [filter, setFilter] = useState('unread');

  const { data: notifications = [], isLoading } = useQuery({
    queryKey: ['notifications', filter],
    queryFn: async () => {
      const { data } = await api.get('/notifications', { params: filter === 'unread' ? { unread: true } : {} });
      return Array.isArray(data) ? data : (data.notifications || []);
    },
  });

  const markRead = useMutation({
    mutationFn: async (id) => api.put(`/notifications/${id}/read`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['notifications'] }),
  });

  const markAllRead = useMutation({
    mutationFn: async () => api.put('/notifications/read-all'),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['notifications'] }),
  });

  const unreadCount = notifications.filter((n) => !n.read).length;

  const getTypeConfig = (type) => {
    switch (type) {
      case 'issue':
        return { icon: CircleDot, color: 'text-[var(--brand-success)]' };
      case 'pull_request':
        return { icon: GitPullRequest, color: 'text-[var(--brand-purple)]' };
      case 'mention':
        return { icon: AtSign, color: 'text-[var(--brand-warning)]' };
      default:
        return { icon: Bell, color: 'text-[var(--brand-primary)]' };
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
            <Bell className="text-[var(--brand-primary)]" size={32} />
            COMMUNICATIONS
          </h1>
          <p className="text-sm font-mono text-[var(--text-muted)] mt-2">
            {unreadCount > 0 
              ? `YOU HAVE ${unreadCount} UNREAD ${unreadCount !== 1 ? 'MESSAGES' : 'MESSAGE'}` 
              : 'ALL COMMUNICATIONS PROCESSED'}
          </p>
        </div>
        {unreadCount > 0 && (
          <NeonButton 
            variant="ghost" 
            onClick={() => markAllRead.mutate()} 
            disabled={markAllRead.isPending}
            className="flex items-center gap-2 self-start md:self-auto border-[var(--brand-success)]/50 text-[var(--brand-success)] hover:bg-[var(--brand-success)]/10"
          >
            <CheckCircle2 size={16} /> 
            ACKNOWLEDGE_ALL
          </NeonButton>
        )}
      </div>

      <div className="flex gap-2 p-1 rounded-lg border border-[var(--glass-border)] bg-black/40 w-fit">
        {['unread', 'all'].map((s) => (
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
          {[1, 2, 3, 4].map((i) => <CyberSkeleton key={i} className="h-20 rounded-lg" />)}
        </div>
      ) : notifications.length === 0 ? (
        <GlassCard className="p-16 text-center flex flex-col items-center justify-center border-dashed">
          <Bell size={48} className="text-[var(--text-muted)] opacity-20 mb-4" />
          <h3 className="text-xl font-display font-bold mb-2">NO_NEW_DATA</h3>
          <p className="text-sm font-mono text-[var(--text-muted)]">
            {filter === 'unread' ? 'System indicates no unread communications. Switch to ALL to view history.' : 'No communication history found.'}
          </p>
        </GlassCard>
      ) : (
        <motion.div variants={listVariants} initial="hidden" animate="visible" className="space-y-3">
          <AnimatePresence>
            {notifications.map((n) => {
              const { icon: TypeIcon, color } = getTypeConfig(n.type);
              return (
                <motion.div 
                  key={n._id} 
                  variants={itemVariants}
                  layout
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="group"
                >
                  <GlassCard className={`p-0 overflow-hidden border-l-4 transition-all duration-300 ${
                    !n.read 
                      ? 'border-l-[var(--brand-primary)] bg-[var(--brand-primary)]/5' 
                      : 'border-l-[var(--glass-border)] opacity-70 hover:opacity-100'
                  } hover:border-[var(--brand-primary)]/50`}>
                    <div className="p-4 flex items-start gap-4">
                      
                      <div className="relative shrink-0 mt-1">
                        <TypeIcon size={18} className={color} />
                        {!n.read && (
                          <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-[var(--brand-primary)] shadow-[0_0_8px_var(--brand-primary)] animate-pulse" />
                        )}
                      </div>
                      
                      <div className="min-w-0 flex-1">
                        <div className={`text-sm ${!n.read ? 'text-white font-medium' : 'text-[var(--text-main)]'} mb-1`}>
                          {n.message || n.title || 'New system notification'}
                        </div>
                        {n.createdAt && (
                          <div className="text-[10px] font-mono text-[var(--text-muted)] uppercase tracking-wider">
                            {new Date(n.createdAt).toLocaleString()}
                          </div>
                        )}
                      </div>
                      
                      {!n.read && (
                        <button
                          type="button"
                          className="shrink-0 p-2 rounded-lg border border-[var(--glass-border)] text-[var(--text-muted)] hover:text-[var(--brand-success)] hover:border-[var(--brand-success)]/50 hover:bg-[var(--brand-success)]/10 transition-all"
                          onClick={() => markRead.mutate(n._id)}
                          title="Acknowledge Message"
                        >
                          <Check size={16} />
                        </button>
                      )}
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

export default UserNotifications;
