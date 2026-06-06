import React from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import api from '../lib/api';
import { 
  GlassCard, 
  NeonButton, 
  CyberBadge, 
  CyberSkeleton, 
  AnimatedCounter 
} from '../components/ui';
import { ScrollReveal } from '../components/effects';
import { 
  Book, GitPullRequest, CircleDot, Bell, Activity, 
  TrendingUp, GitBranch, Terminal 
} from 'lucide-react';
import { listVariants, itemVariants } from '../utils/animations';
import { twMerge } from 'tailwind-merge';

const fetchDashboard = async () => {
  const { data } = await api.get('/platform/dashboard');
  return data;
};

const StatCard = ({ label, value, icon: Icon, colorClass, delay = 0 }) => (
  <ScrollReveal delay={delay}>
    <GlassCard interactive glowColor={colorClass} className="p-5 h-full border-t-[var(--card-glow)] flex flex-col justify-between group">
      <div className="flex justify-between items-start mb-4">
        <div className={twMerge("p-3 rounded-lg bg-[var(--card-glow)]/10 text-[var(--card-glow)] group-hover:scale-110 transition-transform")}>
          <Icon size={24} />
        </div>
      </div>
      <div>
        <div className="text-3xl font-display font-bold mb-1">
          <AnimatedCounter value={value ?? 0} />
        </div>
        <div className="text-xs font-mono text-[var(--text-muted)] uppercase tracking-wider">{label}</div>
      </div>
    </GlassCard>
  </ScrollReveal>
);

const ContributionGraph = ({ days = [] }) => {
  const dayMap = new Map(days.map((day) => [day.date, day.count]));
  const cells = Array.from({ length: 98 }, (_, index) => {
    const date = new Date();
    date.setDate(date.getDate() - (97 - index));
    const key = date.toISOString().slice(0, 10);
    const count = dayMap.get(key) || 0;
    const level = count > 8 ? 4 : count > 4 ? 3 : count > 1 ? 2 : count > 0 ? 1 : 0;
    return { key, count, level };
  });

  return (
    <div className="w-full overflow-x-auto cyber-scrollbar pb-2">
      <div className="grid grid-cols-[repeat(14,minmax(0,1fr))] gap-1.5 min-w-[500px]" aria-label="Contribution calendar">
        {cells.map((cell) => {
          const colors = [
            'bg-[var(--bg-tertiary)] border-[var(--border-main)]',
            'bg-[var(--brand-primary)]/20 border-[var(--brand-primary)]/30',
            'bg-[var(--brand-primary)]/40 border-[var(--brand-primary)]/50',
            'bg-[var(--brand-primary)]/70 border-[var(--brand-primary)]/80 shadow-[0_0_5px_rgba(0,212,255,0.4)]',
            'bg-[var(--brand-primary)] border-[var(--brand-primary)] shadow-[0_0_10px_rgba(0,212,255,0.8)]'
          ];
          return (
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", stiffness: 300, damping: 20 }}
              key={cell.key}
              title={`${cell.key}: ${cell.count} contributions`}
              className={twMerge(
                "h-4 rounded-sm border transition-all hover:scale-125 hover:z-10",
                colors[cell.level]
              )}
            />
          );
        })}
      </div>
    </div>
  );
};

const EmptyState = ({ title, action, to, icon: Icon = Terminal }) => (
  <div className="flex flex-col items-center justify-center py-10 px-4 text-center border border-dashed border-[var(--glass-border)] rounded-xl bg-[var(--bg-tertiary)]/50">
    <Icon size={32} className="text-[var(--text-muted)] mb-3 opacity-50" />
    <div className="text-sm font-medium text-[var(--text-main)] mb-1">{title}</div>
    {to && (
      <Link to={to} className="mt-3">
        <NeonButton variant="ghost" className="text-xs py-1.5 px-3">{action}</NeonButton>
      </Link>
    )}
  </div>
);

const Dashboard = () => {
  const { data, isLoading } = useQuery({
    queryKey: ['platform-dashboard'],
    queryFn: fetchDashboard,
  });

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center border-b border-[var(--glass-border)] pb-4">
          <div>
            <CyberSkeleton className="h-8 w-48 mb-2" />
            <CyberSkeleton className="h-4 w-96" />
          </div>
        </div>
        <div className="grid gap-4 md:grid-cols-4">
          {[1, 2, 3, 4].map((item) => <CyberSkeleton key={item} className="h-32 w-full rounded-xl" />)}
        </div>
        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_340px]">
          <div className="space-y-6">
            <CyberSkeleton className="h-96 w-full rounded-xl" />
            <div className="grid gap-6 md:grid-cols-2">
              <CyberSkeleton className="h-64 w-full rounded-xl" />
              <CyberSkeleton className="h-64 w-full rounded-xl" />
            </div>
          </div>
          <div className="space-y-6">
            <CyberSkeleton className="h-80 w-full rounded-xl" />
            <CyberSkeleton className="h-64 w-full rounded-xl" />
          </div>
        </div>
      </div>
    );
  }

  const repos = data?.recentRepositories || [];
  const issues = data?.assignedIssues || [];
  const prs = data?.pullRequests || [];
  const activity = data?.activityFeed || [];
  const trending = data?.trendingRepositories || [];
  const notifications = data?.notifications || [];

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-4 border-b border-[var(--glass-border)] pb-5 sm:flex-row sm:items-end relative">
        <div className="absolute bottom-0 left-0 right-0 h-[1px] bg-gradient-to-r from-[var(--brand-primary)] via-transparent to-transparent opacity-50" />
        <div>
          <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded text-xs font-mono font-medium bg-[var(--brand-success)]/10 text-[var(--brand-success)] mb-3">
            <div className="w-1.5 h-1.5 rounded-full bg-[var(--brand-success)] animate-pulse" />
            NEXUS_DASHBOARD_ONLINE
          </div>
          <h1 className="text-3xl font-display font-bold">Command Center</h1>
          <p className="mt-1 text-sm text-[var(--text-muted)]">Your BuildBoard+ cockpit for repositories, reviews, issues, and system activity.</p>
        </div>
        <div className="flex gap-3">
          <Link to="/explore">
            <NeonButton variant="secondary">Explore Nodes</NeonButton>
          </Link>
          <Link to="/new">
            <NeonButton variant="primary">Initialize Repo</NeonButton>
          </Link>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard delay={0.1} label="Repositories" value={data?.stats?.repositories} icon={Book} colorClass="var(--brand-primary)" />
        <StatCard delay={0.2} label="Assigned Issues" value={data?.stats?.assignedIssues} icon={CircleDot} colorClass="var(--brand-warning)" />
        <StatCard delay={0.3} label="Pull Requests" value={data?.stats?.pullRequests} icon={GitPullRequest} colorClass="var(--brand-purple)" />
        <StatCard delay={0.4} label="Unread Notifs" value={data?.stats?.unreadNotifications} icon={Bell} colorClass="var(--brand-success)" />
      </div>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_340px]">
        <motion.section 
          variants={listVariants}
          initial="hidden"
          animate="visible"
          className="space-y-6"
        >
          <motion.div variants={itemVariants}>
            <GlassCard className="p-5">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-2">
                  <Activity className="text-[var(--brand-primary)]" size={20} />
                  <h2 className="font-display font-bold text-lg">System Activity</h2>
                </div>
                <CyberBadge variant="primary" size="sm" glow>LIVE_STREAM</CyberBadge>
              </div>
              
              <div className="space-y-1">
                {activity.length ? activity.map((item, idx) => {
                  const repoUrl = item.repository ? `/${item.repository.owner?.username || item.user?.username}/${item.repository.slug}` : null;
                  const Wrapper = repoUrl ? Link : 'div';
                  
                  return (
                    <motion.div 
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: idx * 0.05 }}
                      key={item._id} 
                    >
                      <Wrapper
                        to={repoUrl}
                        className={`flex gap-4 p-3 rounded-lg hover:bg-[var(--glass-highlight)] transition-colors group ${repoUrl ? 'cursor-pointer block w-full' : ''}`}
                      >
                        <div className="relative">
                          <div className="h-10 w-10 shrink-0 rounded-full bg-[var(--bg-tertiary)] border border-[var(--glass-border)] flex items-center justify-center group-hover:border-[var(--brand-primary)] transition-colors overflow-hidden">
                            {item.user?.avatar ? (
                              <img src={item.user.avatar} className="w-full h-full object-cover" alt="" />
                            ) : (
                              <span className="text-xs font-bold text-[var(--brand-primary)]">{(item.user?.username || '?').charAt(0).toUpperCase()}</span>
                            )}
                          </div>
                          <div className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-[var(--bg-main)] flex items-center justify-center">
                            <div className="w-2.5 h-2.5 rounded-full bg-[var(--brand-success)]" />
                          </div>
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="text-sm text-[var(--text-main)]">
                            <span className="font-semibold text-[var(--brand-primary)]">{item.user?.username || 'Unknown_Entity'}</span>
                            <span className="text-[var(--text-muted)]"> {item.action.toLowerCase().replaceAll('_', ' ')}</span>
                          </div>
                          <div className={`truncate text-xs font-mono text-[var(--text-muted)] mt-0.5 ${repoUrl ? 'group-hover:text-[var(--brand-primary)] transition-colors' : ''}`}>
                            {item.repository?.name || item.details?.name || 'Platform_Event'}
                          </div>
                        </div>
                        <div className="text-[10px] font-mono text-[var(--text-muted)] opacity-50 group-hover:opacity-100 transition-opacity">
                          {new Date(item.createdAt || Date.now()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </div>
                      </Wrapper>
                    </motion.div>
                  );
                }) : <EmptyState title="No activity detected on this sector" action="Explore network" to="/explore" icon={Activity} />}
              </div>
            </GlassCard>
          </motion.div>

          <motion.div variants={itemVariants}>
            <GlassCard className="p-5">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-2">
                  <GitBranch className="text-[var(--brand-purple)]" size={20} />
                  <h2 className="font-display font-bold text-lg">Contribution Matrix</h2>
                </div>
                <div className="text-xs font-mono text-[var(--text-muted)]">T-98_DAYS</div>
              </div>
              <ContributionGraph days={data?.contributionGraph} />
            </GlassCard>
          </motion.div>

          <div className="grid gap-6 md:grid-cols-2">
            <motion.div variants={itemVariants}>
              <GlassCard className="p-5 h-full">
                <div className="flex items-center gap-2 mb-6">
                  <CircleDot className="text-[var(--brand-warning)]" size={20} />
                  <h2 className="font-display font-bold text-lg">Active Issues</h2>
                </div>
                <div className="space-y-2">
                  {issues.length ? issues.map((issue) => (
                    <Link to={`/issues/${issue._id}`} key={issue._id} className="block p-3 rounded-lg border border-[var(--glass-border)] bg-[var(--bg-tertiary)] hover:border-[var(--brand-warning)] hover:bg-[var(--glass-highlight)] transition-colors group">
                      <div className="text-sm font-medium text-[var(--text-main)] group-hover:text-[var(--brand-warning)] transition-colors truncate">{issue.title}</div>
                      <div className="mt-2 flex items-center justify-between">
                        <div className="text-xs font-mono text-[var(--text-muted)]">#{issue.number}</div>
                        <div className="flex gap-1">
                          <CyberBadge variant={issue.status === 'open' ? 'success' : 'neutral'} size="sm">{issue.status}</CyberBadge>
                        </div>
                      </div>
                    </Link>
                  )) : <EmptyState title="No assigned anomalies" icon={CircleDot} />}
                </div>
              </GlassCard>
            </motion.div>

            <motion.div variants={itemVariants}>
              <GlassCard className="p-5 h-full">
                <div className="flex items-center gap-2 mb-6">
                  <GitPullRequest className="text-[var(--brand-purple)]" size={20} />
                  <h2 className="font-display font-bold text-lg">Pending PRs</h2>
                </div>
                <div className="space-y-2">
                  {prs.length ? prs.map((pr) => (
                    <Link to={`/pulls/${pr._id}`} key={pr._id} className="block p-3 rounded-lg border border-[var(--glass-border)] bg-[var(--bg-tertiary)] hover:border-[var(--brand-purple)] hover:bg-[var(--glass-highlight)] transition-colors group">
                      <div className="text-sm font-medium text-[var(--text-main)] group-hover:text-[var(--brand-purple)] transition-colors truncate">{pr.title}</div>
                      <div className="mt-2 flex items-center justify-between">
                        <div className="text-xs font-mono text-[var(--text-muted)]">#{pr.number}</div>
                        <CyberBadge variant="purple" size="sm">{pr.reviewDecision || pr.status}</CyberBadge>
                      </div>
                    </Link>
                  )) : <EmptyState title="No pending merges" icon={GitPullRequest} />}
                </div>
              </GlassCard>
            </motion.div>
          </div>
        </motion.section>

        <motion.aside 
          variants={listVariants}
          initial="hidden"
          animate="visible"
          className="space-y-6"
        >
          <motion.div variants={itemVariants}>
            <GlassCard className="p-5">
              <div className="flex items-center justify-between mb-5">
                <div className="flex items-center gap-2">
                  <Book className="text-[var(--brand-primary)]" size={18} />
                  <h2 className="font-display font-bold">Your Nodes</h2>
                </div>
                <Link to="/new">
                  <NeonButton variant="ghost" className="p-1.5 h-auto text-xs"><Terminal size={14} /></NeonButton>
                </Link>
              </div>
              <div className="space-y-2">
                {repos.length ? repos.map((repo) => (
                  <Link key={repo._id} to={`/${repo.owner?.username}/${repo.slug}`} className="block p-3 rounded-lg border border-transparent hover:border-[var(--glass-border)] hover:bg-[var(--glass-highlight)] transition-all group">
                    <div className="truncate text-sm font-medium text-[var(--brand-primary)] group-hover:text-white transition-colors">
                      <span className="opacity-70 group-hover:opacity-100">{repo.owner?.username}/</span>{repo.name}
                    </div>
                    <div className="mt-2 flex items-center justify-between text-xs font-mono text-[var(--text-muted)]">
                      <CyberBadge variant="neutral" size="sm" className="text-[10px] py-0">{repo.visibility}</CyberBadge>
                      <span className="flex items-center gap-1"><span className="text-[var(--brand-warning)]">★</span> {repo.starCount}</span>
                    </div>
                  </Link>
                )) : <EmptyState title="No nodes initialized" action="Deploy first node" to="/new" icon={Book} />}
              </div>
            </GlassCard>
          </motion.div>

          <motion.div variants={itemVariants}>
            <GlassCard className="p-5 border-t-[var(--brand-success)]">
              <div className="flex items-center gap-2 mb-5">
                <Bell className="text-[var(--brand-success)]" size={18} />
                <h2 className="font-display font-bold">Comms Link</h2>
              </div>
              <div className="space-y-2">
                {notifications.length ? notifications.map((notification) => (
                  <div key={notification._id} className="p-3 rounded-lg border border-[var(--glass-border)] bg-[var(--bg-tertiary)] relative overflow-hidden">
                    {!notification.read && <div className="absolute left-0 top-0 bottom-0 w-1 bg-[var(--brand-success)] shadow-[0_0_10px_var(--brand-success)]" />}
                    <div className="text-sm font-medium text-[var(--text-main)] mb-1">{notification.title}</div>
                    <div className="text-xs text-[var(--text-muted)] leading-relaxed">{notification.message}</div>
                  </div>
                )) : <EmptyState title="Comms channel clear" icon={Bell} />}
              </div>
            </GlassCard>
          </motion.div>

          <motion.div variants={itemVariants}>
            <GlassCard className="p-5">
              <div className="flex items-center gap-2 mb-5">
                <TrendingUp className="text-[var(--brand-danger)]" size={18} />
                <h2 className="font-display font-bold">Trending Matrix</h2>
              </div>
              <div className="space-y-2">
                {trending.length ? trending.map((repo, idx) => (
                  <Link key={repo._id} to={`/${repo.owner?.username}/${repo.slug}`} className="flex items-center gap-3 p-2 rounded-lg hover:bg-[var(--glass-highlight)] transition-colors group">
                    <div className="text-lg font-display font-bold text-[var(--text-muted)] group-hover:text-[var(--brand-danger)] transition-colors w-6 text-center opacity-50">
                      {idx + 1}
                    </div>
                    <div className="min-w-0">
                      <div className="truncate text-sm font-medium text-[var(--text-main)] group-hover:text-[var(--brand-primary)] transition-colors">
                        {repo.owner?.username}/{repo.name}
                      </div>
                      <div className="text-xs font-mono text-[var(--text-muted)] mt-0.5 flex items-center gap-2">
                        <span>★ {repo.starCount}</span>
                        {repo.language && (
                          <>
                            <span>•</span>
                            <span>{repo.language}</span>
                          </>
                        )}
                      </div>
                    </div>
                  </Link>
                )) : <EmptyState title="Insufficient data" icon={TrendingUp} />}
              </div>
            </GlassCard>
          </motion.div>
        </motion.aside>
      </div>
    </div>
  );
};

export default Dashboard;
