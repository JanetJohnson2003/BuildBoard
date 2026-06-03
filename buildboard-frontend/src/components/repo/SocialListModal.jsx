import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useQuery } from '@tanstack/react-query';
import { X, User as UserIcon, GitFork, Star, Eye } from 'lucide-react';
import { Link } from 'react-router-dom';
import api from '../../lib/api';
import { GlassCard, CyberSkeleton } from '../ui';

export const SocialListModal = ({ isOpen, onClose, type, owner, repo }) => {
  const { data, isLoading, error } = useQuery({
    queryKey: ['repo', owner, repo, type],
    queryFn: async () => {
      const { data } = await api.get(`/repos/${owner}/${repo}/${type}`);
      return data;
    },
    enabled: isOpen && !!type,
  });

  if (!isOpen) return null;

  const titles = {
    stargazers: { label: 'Stargazers', icon: <Star size={20} className="text-[var(--brand-warning)]" /> },
    watchers: { label: 'Watchers', icon: <Eye size={20} className="text-[var(--brand-primary)]" /> },
    forks: { label: 'Forks', icon: <GitFork size={20} className="text-white" /> },
  };

  const currentInfo = titles[type] || titles.stargazers;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 bg-black/60 backdrop-blur-sm"
          onClick={onClose}
        />
        
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="relative w-full max-w-md z-10"
        >
          <GlassCard className="p-0 overflow-hidden flex flex-col max-h-[80vh]">
            <div className="p-4 border-b border-[var(--glass-border)] flex items-center justify-between bg-[var(--bg-tertiary)]">
              <div className="flex items-center gap-2 font-display font-bold text-lg">
                {currentInfo.icon}
                {currentInfo.label}
              </div>
              <button
                onClick={onClose}
                className="p-1 rounded-md text-[var(--text-muted)] hover:text-white hover:bg-white/10 transition-colors"
              >
                <X size={20} />
              </button>
            </div>
            
            <div className="p-4 overflow-y-auto cyber-scrollbar flex-1">
              {isLoading ? (
                <div className="space-y-4">
                  {[1, 2, 3].map(i => (
                    <div key={i} className="flex items-center gap-3">
                      <CyberSkeleton className="w-10 h-10 rounded-full" />
                      <div className="space-y-2 flex-1">
                        <CyberSkeleton className="w-32 h-4" />
                        <CyberSkeleton className="w-24 h-3" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : error ? (
                <div className="text-center text-[var(--brand-danger)] py-8 font-mono text-sm">
                  Failed to load {currentInfo.label.toLowerCase()}.
                </div>
              ) : data && data.length === 0 ? (
                <div className="text-center text-[var(--text-muted)] py-8 font-mono text-sm">
                  No {currentInfo.label.toLowerCase()} yet.
                </div>
              ) : (
                <div className="space-y-3">
                  {data?.map(item => (
                    <div key={item._id} className="flex items-center justify-between p-3 rounded-lg border border-[var(--glass-border)] bg-black/20 hover:bg-black/40 transition-colors group">
                      {type === 'forks' ? (
                        <div className="flex flex-col">
                          <Link to={`/${item.owner.username}/${item.slug}`} className="font-bold text-white group-hover:text-[var(--brand-primary)] transition-colors">
                            {item.owner.username}/{item.name}
                          </Link>
                          <div className="text-xs text-[var(--text-muted)] mt-1 flex items-center gap-1">
                            <UserIcon size={12} />
                            {item.owner.username}
                          </div>
                        </div>
                      ) : (
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-[var(--bg-tertiary)] flex items-center justify-center overflow-hidden border border-[var(--glass-border)]">
                            {item.avatar ? (
                              <img src={item.avatar} alt={item.username} className="w-full h-full object-cover" />
                            ) : (
                              <UserIcon size={20} className="text-[var(--text-muted)]" />
                            )}
                          </div>
                          <div>
                            <Link to={`/${item.username}`} className="font-bold text-white group-hover:text-[var(--brand-primary)] transition-colors">
                              {item.username}
                            </Link>
                            {item.name && (
                              <div className="text-xs text-[var(--text-muted)]">{item.name}</div>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </GlassCard>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
