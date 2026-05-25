import React from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import api from '../lib/api';

const fetchDashboard = async () => {
  const { data } = await api.get('/platform/dashboard');
  return data;
};

const StatCard = ({ label, value }) => (
  <div className="panel p-4">
    <div className="text-2xl font-semibold">{value ?? 0}</div>
    <div className="mt-1 text-sm text-[var(--text-muted)]">{label}</div>
  </div>
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
    <div className="grid grid-cols-[repeat(14,minmax(0,1fr))] gap-1" aria-label="Contribution calendar">
      {cells.map((cell) => (
        <div
          key={cell.key}
          title={`${cell.key}: ${cell.count} contributions`}
          className={`h-3 rounded-sm border border-[var(--border-subtle)] contribution-${cell.level}`}
        />
      ))}
    </div>
  );
};

const EmptyState = ({ title, action, to }) => (
  <div className="rounded-md border border-dashed border-[var(--border-main)] px-4 py-8 text-center">
    <div className="text-sm font-medium">{title}</div>
    {to && <Link to={to} className="mt-2 inline-block text-sm text-[var(--brand-primary)] hover:underline">{action}</Link>}
  </div>
);

const Dashboard = () => {
  const { data, isLoading } = useQuery({
    queryKey: ['platform-dashboard'],
    queryFn: fetchDashboard,
  });

  if (isLoading) {
    return (
      <div className="space-y-5">
        <div className="h-10 w-72 animate-pulse rounded-md bg-[var(--bg-subtle)]" />
        <div className="grid gap-4 md:grid-cols-4">
          {[1, 2, 3, 4].map((item) => <div key={item} className="h-24 animate-pulse rounded-md bg-[var(--bg-subtle)]" />)}
        </div>
        <div className="h-96 animate-pulse rounded-md bg-[var(--bg-subtle)]" />
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
      <div className="flex flex-col justify-between gap-3 border-b border-[var(--border-main)] pb-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-2xl font-semibold">Home</h1>
          <p className="mt-1 text-sm text-[var(--text-muted)]">Your BuildBoard+ development cockpit for repositories, reviews, issues, releases, and activity.</p>
        </div>
        <div className="flex gap-2">
          <Link to="/explore" className="btn-secondary">Explore</Link>
          <Link to="/new" className="btn-primary">New repository</Link>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <StatCard label="Recent repositories" value={data?.stats?.repositories} />
        <StatCard label="Assigned issues" value={data?.stats?.assignedIssues} />
        <StatCard label="Open pull requests" value={data?.stats?.pullRequests} />
        <StatCard label="Unread notifications" value={data?.stats?.unreadNotifications} />
      </div>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_340px]">
        <section className="space-y-6">
          <div className="panel">
            <div className="panel-header flex items-center justify-between">
              <h2 className="font-semibold">Activity feed</h2>
              <span className="text-xs text-[var(--text-muted)]">Live-ready via Socket.io</span>
            </div>
            <div className="divide-y divide-[var(--border-main)]">
              {activity.length ? activity.map((item) => (
                <div key={item._id} className="flex gap-3 p-4">
                  <div className="h-8 w-8 shrink-0 rounded-full bg-[var(--bg-subtle)]" />
                  <div className="min-w-0">
                    <div className="text-sm">
                      <span className="font-semibold">{item.user?.username || 'Someone'}</span>
                      <span className="text-[var(--text-muted)]"> {item.action.toLowerCase().replaceAll('_', ' ')}</span>
                    </div>
                    <div className="truncate text-xs text-[var(--text-muted)]">{item.repository?.name || item.details?.name || 'Platform event'}</div>
                  </div>
                </div>
              )) : <div className="p-4"><EmptyState title="No activity yet" action="Explore repositories" to="/explore" /></div>}
            </div>
          </div>

          <div className="panel p-4">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="font-semibold">Contribution graph</h2>
              <span className="text-xs text-[var(--text-muted)]">Last 14 weeks</span>
            </div>
            <ContributionGraph days={data?.contributionGraph} />
          </div>

          <div className="grid gap-6 xl:grid-cols-2">
            <div className="panel">
              <div className="panel-header"><h2 className="font-semibold">Assigned issues</h2></div>
              <div className="divide-y divide-[var(--border-main)]">
                {issues.length ? issues.map((issue) => (
                  <div key={issue._id} className="p-4">
                    <div className="text-sm font-medium">{issue.title}</div>
                    <div className="mt-1 text-xs text-[var(--text-muted)]">#{issue.number} {issue.status} {issue.priority}</div>
                  </div>
                )) : <div className="p-4"><EmptyState title="No assigned issues" /></div>}
              </div>
            </div>

            <div className="panel">
              <div className="panel-header"><h2 className="font-semibold">Pull requests</h2></div>
              <div className="divide-y divide-[var(--border-main)]">
                {prs.length ? prs.map((pr) => (
                  <div key={pr._id} className="p-4">
                    <div className="text-sm font-medium">{pr.title}</div>
                    <div className="mt-1 text-xs text-[var(--text-muted)]">#{pr.number} {pr.reviewDecision || pr.status}</div>
                  </div>
                )) : <div className="p-4"><EmptyState title="No open pull requests" /></div>}
              </div>
            </div>
          </div>
        </section>

        <aside className="space-y-6">
          <div className="panel p-4">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="font-semibold">Repositories</h2>
              <Link to="/new" className="btn-primary px-2 py-1 text-xs">New</Link>
            </div>
            <div className="space-y-3">
              {repos.length ? repos.map((repo) => (
                <Link key={repo._id} to={`/${repo.owner?.username}/${repo.slug}`} className="block rounded-md border border-transparent p-2 hover:border-[var(--border-main)] hover:bg-[var(--bg-subtle)]">
                  <div className="truncate text-sm font-semibold">{repo.owner?.username}/{repo.name}</div>
                  <div className="mt-1 flex gap-3 text-xs text-[var(--text-muted)]">
                    <span>{repo.visibility}</span>
                    <span>{repo.starCount} stars</span>
                  </div>
                </Link>
              )) : <EmptyState title="No repositories yet" action="Create your first repository" to="/new" />}
            </div>
          </div>

          <div className="panel p-4">
            <h2 className="mb-3 font-semibold">Notifications</h2>
            <div className="space-y-3">
              {notifications.length ? notifications.map((notification) => (
                <div key={notification._id} className="rounded-md bg-[var(--bg-subtle)] p-3">
                  <div className="text-sm font-medium">{notification.title}</div>
                  <div className="mt-1 text-xs text-[var(--text-muted)]">{notification.message}</div>
                </div>
              )) : <EmptyState title="Inbox is clear" />}
            </div>
          </div>

          <div className="panel p-4">
            <h2 className="mb-3 font-semibold">Trending repositories</h2>
            <div className="space-y-3">
              {trending.map((repo) => (
                <Link key={repo._id} to={`/${repo.owner?.username}/${repo.slug}`} className="block">
                  <div className="truncate text-sm font-semibold text-[var(--brand-primary)]">{repo.owner?.username}/{repo.name}</div>
                  <div className="text-xs text-[var(--text-muted)]">{repo.starCount} stars - {repo.language || 'Mixed'}</div>
                </Link>
              ))}
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
};

export default Dashboard;
