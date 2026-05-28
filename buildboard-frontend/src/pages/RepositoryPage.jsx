import React, { useMemo, useState } from 'react';
import { Link, useParams, useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../lib/api';
import { GlassCard, NeonButton, CyberBadge, CyberSkeleton } from '../components/ui';
import { CodeTab } from '../components/repo/CodeTab';
import { IssuesTab } from '../components/repo/IssuesTab';
import { 
  PullRequestCards, ActionsTab, WikiTab, InsightsTab, 
  SecurityTab, DiscussionsTab, ReleasesTab, AiTab 
} from '../components/repo/OtherTabs';
import { 
  Book, Lock, Eye, GitFork, Star, Archive, 
  Terminal, ShieldCheck, Box, Settings
} from 'lucide-react';
import { pageVariants } from '../utils/animations';

const tabs = ['Code', 'Issues', 'Pull Requests', 'Actions', 'Projects', 'Wiki', 'Security', 'Insights', 'Releases', 'Packages', 'Discussions', 'AI'];

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
  
  // Shared state for marking files for change
  const [issueModalOpen, setIssueModalOpen] = useState(false);
  const [selectedFileForIssue, setSelectedFileForIssue] = useState('');

  const repoData = repoQuery.data;

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
      case 'AI':
        return <AiTab owner={owner} repo={repo} />;
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
                </div>
              </div>
              
              <p className="text-sm md:text-base font-mono text-[var(--text-muted)] max-w-3xl leading-relaxed">
                {repoData.description || 'No operational description provided.'}
              </p>
            </div>
            
            <div className="flex flex-wrap items-center gap-3 shrink-0">
              <NeonButton variant="ghost" className="bg-[var(--bg-tertiary)] border-[var(--glass-border)] flex items-center gap-2 text-xs py-2 px-3">
                <Eye size={14} className="text-[var(--text-muted)]" /> Watch
                <span className="ml-1 bg-white/10 px-2 py-0.5 rounded-full text-white font-bold">{repoData.watcherCount}</span>
              </NeonButton>
              <NeonButton variant="ghost" className="bg-[var(--bg-tertiary)] border-[var(--glass-border)] flex items-center gap-2 text-xs py-2 px-3">
                <GitFork size={14} className="text-[var(--text-muted)]" /> Fork
                <span className="ml-1 bg-white/10 px-2 py-0.5 rounded-full text-white font-bold">{repoData.forkCount}</span>
              </NeonButton>
              <NeonButton variant="ghost" className="bg-[var(--bg-tertiary)] border-[var(--glass-border)] flex items-center gap-2 text-xs py-2 px-3 group">
                <Star size={14} className="text-[var(--text-muted)] group-hover:text-[var(--brand-warning)] transition-colors" /> Star
                <span className="ml-1 bg-white/10 px-2 py-0.5 rounded-full text-white font-bold group-hover:text-[var(--brand-warning)]">{repoData.starCount}</span>
              </NeonButton>
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
    </motion.div>
  );
};

export default RepositoryPage;
