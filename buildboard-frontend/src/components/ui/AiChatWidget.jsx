import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { BrainCircuit, X, MessageSquare, Code2, Play, GitBranch, ChevronDown } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import api from '../../lib/api';
import { GlassCard, NeonButton, CyberInput, CyberDropdown, CyberDropdownItem } from './index';

export const AiChatWidget = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [prompt, setPrompt] = useState('');
  const [selectedRepo, setSelectedRepo] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  // Fetch user's repos to populate the dropdown
  const { data: repos } = useQuery({
    queryKey: ['my-repos'],
    queryFn: async () => {
      const res = await api.get('/repos/my');
      return res.data;
    },
    enabled: isOpen,
  });

  // Automatically select the first repo if available and none selected
  useEffect(() => {
    if (repos && repos.length > 0 && !selectedRepo) {
      setSelectedRepo(`${repos[0].owner.username}/${repos[0].slug}`);
    }
  }, [repos, selectedRepo]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!prompt.trim() || !selectedRepo) return;

    setIsProcessing(true);
    setResult(null);
    setError(null);

    try {
      const [owner, repo] = selectedRepo.split('/');
      const response = await api.post(`/ai/${owner}/${repo}/code-assistant`, { prompt });
      setResult(response.data);
      setPrompt(''); // Clear prompt on success
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'An error occurred while generating code.');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <>
      {/* Floating Action Button */}
      <div className="fixed bottom-6 right-6 z-50">
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => setIsOpen(true)}
          className="bg-[var(--brand-purple)] text-white p-4 rounded-full shadow-[0_0_20px_var(--brand-purple)] flex items-center justify-center hover:bg-purple-600 transition-colors"
        >
          <BrainCircuit size={24} />
        </motion.button>
      </div>

      {/* Chat Sidebar/Modal */}
      <AnimatePresence>
        {isOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsOpen(false)}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
            />
            <motion.div
              initial={{ x: '100%', opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: '100%', opacity: 0 }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed top-0 right-0 h-full w-full max-w-md bg-[var(--bg-main)] border-l border-[var(--brand-purple)] shadow-2xl z-50 flex flex-col"
            >
              <div className="p-4 border-b border-[var(--glass-border)] bg-black/40 flex items-center justify-between">
                <div className="flex items-center gap-2 text-[var(--brand-purple)] font-display font-bold">
                  <BrainCircuit size={20} />
                  Gemini Code Assistant
                </div>
                <button onClick={() => setIsOpen(false)} className="text-[var(--text-muted)] hover:text-white transition-colors">
                  <X size={20} />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-6 cyber-scrollbar">
                
                <div className="bg-[var(--bg-tertiary)] border border-[var(--glass-border)] rounded-lg p-4">
                  <label className="text-xs font-mono text-[var(--text-muted)] block mb-2">Target Repository</label>
                  <CyberDropdown
                    trigger={
                      <button 
                        type="button"
                        disabled={isProcessing}
                        className="w-full flex items-center justify-between bg-[#0a0a0f] border border-[var(--brand-purple)]/50 rounded p-2 text-sm font-mono text-white focus:border-[var(--brand-purple)] outline-none disabled:opacity-50"
                      >
                        <span>{selectedRepo || 'Select a repository...'}</span>
                        <ChevronDown size={16} className="text-[var(--brand-purple)]" />
                      </button>
                    }
                    className="w-[calc(100vw-3rem)] max-w-[calc(448px-3rem)]"
                  >
                    {repos?.map(r => (
                      <CyberDropdownItem
                        key={r._id}
                        onClick={() => setSelectedRepo(`${r.owner.username}/${r.slug}`)}
                      >
                        {r.owner.username}/{r.slug}
                      </CyberDropdownItem>
                    ))}
                    {(!repos || repos.length === 0) && (
                      <div className="px-3 py-2 text-sm text-[var(--text-muted)]">No repositories found.</div>
                    )}
                  </CyberDropdown>
                </div>

                <div className="flex-1 flex flex-col gap-4">
                  {/* Instructions */}
                  {!result && !isProcessing && !error && (
                    <div className="text-center text-[var(--text-muted)] mt-10 space-y-4">
                      <Code2 size={48} className="mx-auto opacity-20" />
                      <p className="text-sm font-mono">Ask Gemini to write code, build a feature, or fix a bug in your repository.</p>
                      <p className="text-xs font-mono opacity-60">The AI will create a new branch and open a Pull Request with the changes.</p>
                    </div>
                  )}

                  {/* Processing State */}
                  {isProcessing && (
                    <div className="flex-1 flex flex-col items-center justify-center text-[var(--brand-purple)] space-y-4">
                      <div className="w-10 h-10 border-4 border-[var(--brand-purple)] border-t-transparent rounded-full animate-spin" />
                      <span className="font-mono text-sm animate-pulse">GENERATING_CODE...</span>
                    </div>
                  )}

                  {/* Error State */}
                  {error && (
                    <GlassCard className="border-t-[var(--brand-danger)] p-4">
                      <p className="text-xs font-mono text-[var(--brand-danger)]">ERROR: {error}</p>
                    </GlassCard>
                  )}

                  {/* Success State */}
                  {result && (
                    <GlassCard className="border-t-[var(--brand-success)] p-5 space-y-4">
                      <div className="flex items-center gap-2 text-[var(--brand-success)] font-display font-bold">
                        <GitBranch size={18} />
                        Code Deployed!
                      </div>
                      <p className="text-sm text-[var(--text-main)] leading-relaxed">
                        Gemini successfully created branch <span className="font-mono text-[var(--brand-primary)] bg-black/40 px-1 rounded">{result.branch}</span> and opened a Pull Request.
                      </p>
                      
                      {result.pullRequest && selectedRepo && (
                        <Link 
                          to={`/${selectedRepo}/pulls/${result.pullRequest.number}`}
                          onClick={() => setIsOpen(false)}
                        >
                          <NeonButton variant="success" className="w-full mt-2 text-center flex items-center justify-center gap-2">
                            Review Pull Request #{result.pullRequest.number}
                          </NeonButton>
                        </Link>
                      )}
                    </GlassCard>
                  )}
                </div>
              </div>

              <div className="p-4 bg-black/40 border-t border-[var(--glass-border)]">
                <form onSubmit={handleSubmit} className="flex gap-2">
                  <input
                    type="text"
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    placeholder="e.g. Create a login page component..."
                    disabled={isProcessing || !selectedRepo}
                    className="flex-1 bg-[#0a0a0f] border border-[var(--glass-border)] rounded-lg px-4 py-3 text-sm font-mono text-white focus:border-[var(--brand-purple)] focus:ring-1 focus:ring-[var(--brand-purple)]/50 outline-none transition-all"
                  />
                  <NeonButton 
                    variant="ghost" 
                    type="submit" 
                    disabled={isProcessing || !prompt.trim() || !selectedRepo}
                    className="border-[var(--brand-purple)] text-[var(--brand-purple)] hover:bg-[var(--brand-purple)] hover:text-white"
                  >
                    <Play size={16} className={isProcessing ? "opacity-50" : ""} />
                  </NeonButton>
                </form>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
};
