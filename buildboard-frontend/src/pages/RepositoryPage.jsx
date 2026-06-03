import React, { useMemo, useState } from 'react';
import { Link, useParams, useSearchParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../lib/api';
import { GlassCard, NeonButton, CyberBadge, CyberSkeleton } from '../components/ui';
import { CodeTab } from '../components/repo/CodeTab';
import { IssuesTab } from '../components/repo/IssuesTab';
import { 
  PullRequestCards, ActionsTab, WikiTab, SecurityTab, 
  InsightsTab, ReleasesTab, DiscussionsTab, SnippetsTab, AiTab, WalkthroughsTab, SponsorshipTab, RiskRadarTab, GitGalaxyTab, SecretsTab
} from '../components/repo/OtherTabs';
import { 
  Book, Lock, Eye, GitFork, Star, Archive, 
  Terminal, ShieldCheck, Box, Settings
} from 'lucide-react';
import { pageVariants } from '../utils/animations';
import { SocialListModal } from '../components/repo/SocialListModal';

const tabs = ['Code', 'Issues', 'Pull Requests', 'Actions', 'Projects', 'Wiki', 'Security', 'Insights', 'Releases', 'Packages', 'Discussions', 'Snippets', 'Walkthroughs', 'Sponsorship', 'Risk Radar', 'Git Galaxy', 'AI', 'Secrets'];

const normalizeTab = (value) => tabs.find((tab) => tab.toLowerCase().replaceAll(' ', '-') === value) || 'Code';
const tabToParam = (tab) => tab.toLowerCase().replaceAll(' ', '-');

const useRepoQuery = () => {
  const { owner, repo } = useParams();
  return {
    owner,
    repo,
    repoQuery: useQuery({
      queryKey: ['repo', owner, repo],
      queryFn: async () => {
        const { data } = await api.get(`/repos/${owner}/${repo}`);
        return data;
      },
    }),
  };
};

const RepositoryPage = () => {
  const { owner, repo, repoQuery } = useRepoQuery();
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTab = normalizeTab(searchParams.get('tab') || 'code');
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const healthQuery = useQuery({
    queryKey: ['repo-health', owner, repo],
    queryFn: async () => {
      const { data } = await api.get(`/repos/${owner}/${repo}/health`);
      return data;
    },
    enabled: !!owner && !!repo
  });
  
  // Shared state for marking files for change
  const [issueModalOpen, setIssueModalOpen] = useState(false);
  const [selectedFileForIssue, setSelectedFileForIssue] = useState('');
  const [socialModal, setSocialModal] = useState({ isOpen: false, type: null });
  const [storyModalOpen, setStoryModalOpen] = useState(false);
  const [currentStoryIndex, setCurrentStoryIndex] = useState(0);

  const repoData = repoQuery.data;

  // Mutations for Watch, Fork, Star
  const toggleStar = useMutation({
    mutationFn: async () => {
      const { data } = await api.post(`/repos/${owner}/${repo}/star`);
      return data;
    },
    onSuccess: (data) => {
      queryClient.setQueryData(['repo', owner, repo], (old) => {
        if (!old) return old;
        return { ...old, isStarred: data.starred, starCount: data.starCount };
      });
    }
  });

  const toggleWatch = useMutation({
    mutationFn: async () => {
      const { data } = await api.post(`/repos/${owner}/${repo}/watch`);
      return data;
    },
    onSuccess: (data) => {
      queryClient.setQueryData(['repo', owner, repo], (old) => {
        if (!old) return old;
        return { ...old, isWatched: data.watching, watcherCount: data.watcherCount };
      });
    }
  });

  const forkRepo = useMutation({
    mutationFn: async () => {
      const { data } = await api.post(`/repos/${owner}/${repo}/fork`);
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries(['repo', owner, repo]);
      navigate(`/${data.owner.username}/${data.slug}`);
    },
    onError: (error) => {
      alert(error.response?.data?.message || 'Failed to fork repository');
    }
  });

  const tabContent = useMemo(() => {
    if (!repoData) return null;
    switch (activeTab) {
      case 'Issues':
        return <IssuesTab owner={owner} repo={repo} issueModalOpen={issueModalOpen} setIssueModalOpen={setIssueModalOpen} selectedFileForIssue={selectedFileForIssue} />;
      case 'Pull Requests':
        return <PullRequestCards owner={owner} repo={repo} />;
      case 'Actions':
        return <ActionsTab owner={owner} repo={repo} />;
      case 'Wiki':
        return <WikiTab owner={owner} repo={repo} />;
      case 'Security':
        return <SecurityTab owner={owner} repo={repo} />;
      case 'Insights':
        return <InsightsTab owner={owner} repo={repo} />;
      case 'Releases':
        return <ReleasesTab owner={owner} repo={repo} />;
      case 'Discussions':
        return <DiscussionsTab owner={owner} repo={repo} />;
      case 'Snippets':
        return <SnippetsTab owner={owner} repo={repo} />;
      case 'Walkthroughs':
        return <WalkthroughsTab owner={owner} repo={repo} />;
      case 'Sponsorship':
        return <SponsorshipTab owner={owner} repo={repo} />;
      case 'Risk Radar':
        return <RiskRadarTab owner={owner} repo={repo} />;
      case 'Git Galaxy':
        return <GitGalaxyTab owner={owner} repo={repo} />;
      case 'AI':
        return <AiTab owner={owner} repo={repo} />;
      case 'Secrets':
        return <SecretsTab owner={owner} repo={repo} />;
      case 'Projects':
        return (
          <GlassCard className="p-12 text-center flex flex-col items-center justify-center border-t-[var(--brand-primary)]">
            <Terminal size={48} className="text-[var(--text-muted)] opacity-30 mb-4" />
            <h3 className="text-xl font-bold mb-2">PROJECT_BOARDS_OFFLINE</h3>
            <p className="text-sm text-[var(--text-muted)] max-w-md font-mono">
              Project boards support backlog, todo, development, review, testing, and done columns through the ProjectBoard module, which is currently undergoing system upgrades.
            </p>
          </GlassCard>
        );
      case 'Packages':
        return (
          <GlassCard className="p-12 text-center flex flex-col items-center justify-center border-t-[var(--brand-primary)]">
            <Box size={48} className="text-[var(--text-muted)] opacity-30 mb-4" />
            <h3 className="text-xl font-bold mb-2">PACKAGE_REGISTRY</h3>
            <p className="text-sm text-[var(--text-muted)] max-w-md font-mono">
              Repository package metadata is ready on the repository schema for npm, Docker, Maven, NuGet, and generic artifacts. Connect your CI pipeline to initiate publishing.
            </p>
          </GlassCard>
        );
      default:
        return (
          <CodeTab 
            owner={owner} 
            repo={repo} 
            repoData={repoData} 
            setIssueModalOpen={setIssueModalOpen}
            setSelectedFileForIssue={setSelectedFileForIssue}
          />
        );
    }
  }, [activeTab, owner, repo, repoData, issueModalOpen, selectedFileForIssue]);

  if (repoQuery.isLoading) {
    return (
      <div className="space-y-6">
        <GlassCard className="p-6">
          <div className="flex gap-4">
            <CyberSkeleton className="w-12 h-12 rounded-lg" />
            <div className="space-y-2 flex-1">
              <CyberSkeleton className="w-64 h-6" />
              <CyberSkeleton className="w-1/2 h-4" />
            </div>
          </div>
        </GlassCard>
        <div className="flex gap-4">
          <CyberSkeleton className="w-full md:w-3/4 h-[500px]" />
          <CyberSkeleton className="hidden md:block w-1/4 h-[500px]" />
        </div>
      </div>
    );
  }

  if (repoQuery.error) {
    return (
      <GlassCard glowColor="var(--brand-danger)" className="p-12 text-center flex flex-col items-center justify-center border-[var(--brand-danger)]/50 bg-[var(--brand-danger)]/5">
        <ShieldCheck size={64} className="text-[var(--brand-danger)] mb-4" />
        <h2 className="text-2xl font-display font-bold text-white mb-2">ACCESS_DENIED</h2>
        <p className="text-sm font-mono text-[var(--text-muted)]">
          Repository not found or insufficient clearance level.
        </p>
        <Link to="/" className="mt-6">
          <NeonButton variant="primary">RETURN_TO_BASE</NeonButton>
        </Link>
      </GlassCard>
    );
  }

  return (
    <motion.div 
      variants={pageVariants}
      initial="initial"
      animate="animate"
      exit="exit"
      className="space-y-6 pb-20"
    >
      <GlassCard className="p-0 overflow-hidden border-t-4 border-t-[var(--brand-primary)]">
        <div className="p-6 md:p-8 relative">
          {/* Background Grid */}
          <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI0MCIgaGVpZ2h0PSI0MCI+CjxwYXRoIGQ9Ik0wIDBoNDB2NDBIMHoiIGZpbGw9Im5vbmUiLz4KPHBhdGggZD0iTTAgMTBoNDBNMTAgMHY0ME0wIDIwaDQwTTIwIDB2NDBNMCAzMGg0ME0zMCAwdjQwIiBzdHJva2U9InJnYmEoMjU1LDI1NSwyNTUsMC4wMykiIHN0cm9rZS13aWR0aD0iMSIvPgo8L3N2Zz4=')] opacity-50" />
          
          <div className="relative z-10 flex flex-col lg:flex-row justify-between gap-6 lg:items-start">
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-3 text-2xl md:text-3xl font-display font-bold mb-3">
                <Book size={28} className="text-[var(--brand-primary)]" />
                <Link to={`/${repoData.owner?.username}`} className="text-[var(--text-muted)] hover:text-white transition-colors">
                  {repoData.owner?.username}
                </Link>
                <span className="text-[var(--brand-primary)]">/</span>
                <span className="text-white drop-shadow-[0_0_8px_rgba(255,255,255,0.3)]">{repoData.name}</span>
                
                <div className="flex items-center gap-2 ml-2">
                  <CyberBadge variant={repoData.visibility === 'private' ? 'warning' : 'success'} size="md" className="uppercase font-bold tracking-wider">
                    {repoData.visibility === 'private' ? <Lock size={12} className="mr-1" /> : <Eye size={12} className="mr-1" />}
                    {repoData.visibility}
                  </CyberBadge>
                  {repoData.isArchived && (
                    <CyberBadge variant="danger" size="md">
                      <Archive size={12} className="mr-1" /> ARCHIVED
                    </CyberBadge>
                  )}
                  {repoData.isTemplate && (
                    <CyberBadge variant="purple" size="md">TEMPLATE</CyberBadge>
                  )}
                  {healthQuery.data && (
                    <CyberBadge 
                      variant={healthQuery.data.grade.startsWith('A') ? 'success' : healthQuery.data.grade.startsWith('B') ? 'warning' : 'danger'} 
                      size="md" 
                      className="ml-2 font-bold flex items-center gap-1 shadow-[0_0_10px_currentColor] border-currentColor text-currentColor"
                    >
                      Health: {healthQuery.data.grade}
                    </CyberBadge>
                  )}
                </div>
              </div>
              
              <p className="text-sm md:text-base font-mono text-[var(--text-muted)] max-w-3xl leading-relaxed mb-6">
                {repoData.description || 'No operational description provided.'}
              </p>

              {/* Repo Code Stories */}
              <div className="flex items-center gap-3">
                <span className="text-xs font-mono text-[var(--brand-purple)] font-bold tracking-widest uppercase">Repo Stories</span>
                <div className="flex gap-3">
                   {[1, 2, 3].map((idx) => (
                     <div 
                       key={idx} 
                       className="w-10 h-10 rounded-full border-2 border-[var(--brand-purple)] p-[2px] cursor-pointer hover:scale-110 transition-transform shadow-[0_0_10px_var(--brand-purple)]"
                       onClick={() => {
                         setCurrentStoryIndex(idx - 1);
                         setStoryModalOpen(true);
                       }}
                     >
                        <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=Story${idx}&backgroundColor=111`} alt="Story" className="w-full h-full rounded-full bg-black" />
                     </div>
                   ))}
                </div>
              </div>
            </div>
            
            <div className="flex flex-wrap items-center gap-3 shrink-0">
              <div className="flex rounded-md overflow-hidden border border-[var(--glass-border)] bg-[var(--bg-tertiary)] group hover:border-[var(--brand-primary)] transition-colors">
                <button 
                  className="flex items-center gap-2 text-xs py-2 px-3 hover:bg-white/5 transition-colors disabled:opacity-50"
                  onClick={() => toggleWatch.mutate()}
                  disabled={toggleWatch.isPending}
                >
                  <Eye size={14} className={repoData.isWatched ? 'text-[var(--brand-primary)]' : 'text-[var(--text-muted)]'} /> 
                  {repoData.isWatched ? 'Unwatch' : 'Watch'}
                </button>
                <button 
                  className="px-3 py-2 text-xs font-bold bg-black/20 hover:bg-black/40 border-l border-[var(--glass-border)] transition-colors"
                  onClick={() => setSocialModal({ isOpen: true, type: 'watchers' })}
                >
                  {repoData.watcherCount}
                </button>
              </div>

              <div className="flex rounded-md overflow-hidden border border-[var(--glass-border)] bg-[var(--bg-tertiary)] group hover:border-white transition-colors">
                <button 
                  className="flex items-center gap-2 text-xs py-2 px-3 hover:bg-white/5 transition-colors disabled:opacity-50"
                  onClick={() => forkRepo.mutate()}
                  disabled={forkRepo.isPending}
                >
                  <GitFork size={14} className="text-[var(--text-muted)] group-hover:text-white" /> Fork
                </button>
                <button 
                  className="px-3 py-2 text-xs font-bold bg-black/20 hover:bg-black/40 border-l border-[var(--glass-border)] transition-colors group-hover:text-white"
                  onClick={() => setSocialModal({ isOpen: true, type: 'forks' })}
                >
                  {repoData.forkCount}
                </button>
              </div>

              <div className="flex rounded-md overflow-hidden border border-[var(--glass-border)] bg-[var(--bg-tertiary)] group hover:border-[var(--brand-warning)] transition-colors">
                <button 
                  className="flex items-center gap-2 text-xs py-2 px-3 hover:bg-white/5 transition-colors disabled:opacity-50"
                  onClick={() => toggleStar.mutate()}
                  disabled={toggleStar.isPending}
                >
                  <Star size={14} className={repoData.isStarred ? 'text-[var(--brand-warning)] fill-[var(--brand-warning)]' : 'text-[var(--text-muted)] group-hover:text-[var(--brand-warning)] transition-colors'} /> 
                  {repoData.isStarred ? 'Unstar' : 'Star'}
                </button>
                <button 
                  className="px-3 py-2 text-xs font-bold bg-black/20 hover:bg-black/40 border-l border-[var(--glass-border)] transition-colors hover:text-[var(--brand-warning)]"
                  onClick={() => setSocialModal({ isOpen: true, type: 'stargazers' })}
                >
                  {repoData.starCount}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="px-2 md:px-6 bg-black/40 border-t border-[var(--glass-border)] overflow-x-auto cyber-scrollbar">
          <div className="flex gap-1 min-w-max">
            {tabs.map((tab) => {
              const isActive = activeTab === tab;
              return (
                <button
                  key={tab}
                  type="button"
                  onClick={() => setSearchParams({ tab: tabToParam(tab) })}
                  className={`
                    relative px-4 py-3 text-sm font-mono font-medium transition-colors
                    ${isActive ? 'text-[var(--brand-primary)]' : 'text-[var(--text-muted)] hover:text-white'}
                  `}
                >
                  {tab}
                  {isActive && (
                    <motion.div
                      layoutId="activeTabIndicator"
                      className="absolute bottom-0 left-0 right-0 h-0.5 bg-[var(--brand-primary)] shadow-[0_-2px_10px_var(--brand-primary)]"
                    />
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </GlassCard>

      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.2 }}
        >
          {tabContent}
        </motion.div>
      </AnimatePresence>

      {storyModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-md">
          <button onClick={() => setStoryModalOpen(false)} className="absolute top-6 right-6 text-white hover:text-[var(--brand-purple)] z-50">
            <X size={32} />
          </button>
          <div className="w-[400px] h-[700px] bg-[#111] rounded-2xl border border-[var(--brand-purple)]/30 overflow-hidden relative shadow-[0_0_50px_rgba(168,85,247,0.2)]">
             {/* Progress Bar */}
             <div className="absolute top-4 left-4 right-4 flex gap-1 z-20">
               {[1, 2, 3].map((idx) => (
                 <div key={idx} className="flex-1 h-1 bg-white/30 rounded-full overflow-hidden">
                   {currentStoryIndex >= idx - 1 && (
                     <motion.div 
                       initial={{ width: currentStoryIndex === idx - 1 ? '0%' : '100%' }}
                       animate={{ width: '100%' }}
                       transition={{ duration: currentStoryIndex === idx - 1 ? 5 : 0 }}
                       onAnimationComplete={() => {
                         if (currentStoryIndex === idx - 1) {
                           if (currentStoryIndex < 2) setCurrentStoryIndex(c => c + 1);
                           else setStoryModalOpen(false);
                         }
                       }}
                       className="h-full bg-white"
                     />
                   )}
                 </div>
               ))}
             </div>
             
             {/* Story Content */}
             <div className="absolute inset-0 z-10 flex flex-col p-6 pt-12">
               <div className="flex items-center gap-3 mb-8">
                  <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=Story${currentStoryIndex+1}&backgroundColor=111`} alt="Author" className="w-10 h-10 rounded-full border border-white" />
                  <div>
                    <h4 className="text-white font-bold text-sm">@dev_operative_{currentStoryIndex+1}</h4>
                    <p className="text-xs text-white/70">{currentStoryIndex+1} hour ago</p>
                  </div>
               </div>
               
               <div className="flex-1 flex flex-col justify-center">
                  <CyberBadge variant="purple" size="lg" className="w-fit mb-4">COMMIT {['a1b2c3d', 'f9e8d7c', 'b4a5d6e'][currentStoryIndex]}</CyberBadge>
                  <h2 className="text-2xl font-display font-bold text-white mb-6">
                    {['Refactored Auth Service for 10x Speed', 'Fixed Critical Vulnerability in API', 'Added Dark Mode Toggle'][currentStoryIndex]}
                  </h2>
                  <div className="bg-black/50 border border-[var(--glass-border)] rounded-lg p-4 font-mono text-sm text-[var(--brand-success)] overflow-hidden shadow-inner">
                    {currentStoryIndex === 0 && '+ 45 lines\n- 120 lines\n\nOptimized database queries...'}
                    {currentStoryIndex === 1 && '+ 12 lines\n- 4 lines\n\nPatched JWT token parsing logic...'}
                    {currentStoryIndex === 2 && '+ 230 lines\n- 15 lines\n\nImplemented CSS variables for themes...'}
                  </div>
               </div>
               
               <div className="mt-8 text-center text-[var(--brand-purple)] font-mono text-xs flex items-center justify-center gap-2">
                 <Sparkles size={14} /> AI Auto-Generated Summary
               </div>
             </div>
             
             {/* Navigation Controls */}
             <div className="absolute inset-0 z-30 flex">
               <div className="w-1/2 h-full" onClick={() => setCurrentStoryIndex(Math.max(0, currentStoryIndex - 1))} />
               <div className="w-1/2 h-full" onClick={() => { if(currentStoryIndex < 2) setCurrentStoryIndex(c => c + 1); else setStoryModalOpen(false); }} />
             </div>
          </div>
        </div>
      )}

      <SocialListModal 
        isOpen={socialModal.isOpen} 
        onClose={() => setSocialModal({ isOpen: false, type: null })} 
        type={socialModal.type} 
        owner={owner} 
        repo={repo} 
      />
    </motion.div>
  );
};

export default RepositoryPage;
