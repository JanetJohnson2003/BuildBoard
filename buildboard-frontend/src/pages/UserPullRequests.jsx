import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '../lib/api';

const Icon = ({ children, size = 16 }) => (
  <svg viewBox="0 0 24 24" width={size} height={size} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{children}</svg>
);
const PRIcon = () => <Icon><circle cx="6" cy="6" r="2" /><circle cx="18" cy="18" r="2" /><path d="M6 8v8a2 2 0 0 0 2 2h6" /><path d="M18 16V6" /><path d="m15 9 3-3 3 3" /></Icon>;
const MergedIcon = () => <Icon><circle cx="6" cy="6" r="2" /><circle cx="18" cy="18" r="2" /><path d="M6 8v4a6 6 0 0 0 6 6h2" /><circle cx="18" cy="6" r="2" /><path d="M18 8v8" /></Icon>;

const statusColor = { open: 'text-green-500', merged: 'text-purple-500', closed: 'text-red-500' };

const UserPullRequests = () => {
  const [filter, setFilter] = useState('open');
  const [search, setSearch] = useState('');

  const { data: prs = [], isLoading } = useQuery({
    queryKey: ['user-prs', filter],
    queryFn: async () => {
      const { data } = await api.get('/pullrequests', { params: { author: 'me', status: filter !== 'all' ? filter : undefined } });
      return Array.isArray(data) ? data : (data.pullRequests || []);
    },
  });

  const filtered = prs.filter((pr) =>
    !search || pr.title?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-3 border-b border-[var(--border-main)] pb-4 md:flex-row md:items-end">
        <div>
          <h1 className="text-2xl font-semibold">Pull Requests</h1>
          <p className="mt-1 text-sm text-[var(--text-muted)]">Pull requests you've opened or been requested to review</p>
        </div>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <input
          className="input-field flex-1"
          placeholder="Filter by title…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <div className="flex gap-1 rounded-md border border-[var(--border-main)] p-1">
          {['open', 'merged', 'closed', 'all'].map((s) => (
            <button
              key={s}
              type="button"
              className={`rounded px-3 py-1 text-sm capitalize ${filter === s ? 'bg-[var(--bg-main)] font-semibold shadow-sm' : 'text-[var(--text-muted)] hover:text-[var(--text-main)]'}`}
              onClick={() => setFilter(s)}
            >{s}</button>
          ))}
        </div>
      </div>

      {isLoading ? (
        <div className="space-y-2">
          {[1,2,3,4].map((i) => <div key={i} className="h-16 animate-pulse rounded-md bg-[var(--bg-subtle)]" />)}
        </div>
      ) : filtered.length === 0 ? (
        <div className="rounded-md border border-dashed border-[var(--border-main)] px-4 py-12 text-center">
          <div className="text-sm font-medium">No pull requests found</div>
          <p className="mt-1 text-xs text-[var(--text-muted)]">Pull requests you open will appear here</p>
        </div>
      ) : (
        <div className="panel divide-y divide-[var(--border-main)]">
          {filtered.map((pr) => (
            <div key={pr._id} className="flex items-start gap-3 p-4 hover:bg-[var(--bg-subtle)]">
              <span className={`mt-0.5 shrink-0 ${statusColor[pr.status] || 'text-green-500'}`}>
                {pr.status === 'merged' ? <MergedIcon /> : <PRIcon />}
              </span>
              <div className="min-w-0 flex-1">
                <div className="text-sm font-medium">{pr.title}</div>
                <div className="mt-1 flex flex-wrap gap-3 text-xs text-[var(--text-muted)]">
                  <span>#{pr.number}</span>
                  {pr.repository && <span>in {pr.repository}</span>}
                  {pr.sourceBranch && pr.targetBranch && (
                    <span>{pr.sourceBranch} → {pr.targetBranch}</span>
                  )}
                  {pr.createdAt && <span>opened {new Date(pr.createdAt).toLocaleDateString()}</span>}
                </div>
              </div>
              <span className={`shrink-0 rounded-full border border-[var(--border-main)] px-2 py-0.5 text-xs capitalize`}>{pr.status || 'open'}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default UserPullRequests;
