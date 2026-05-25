import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import api from '../lib/api';

const Icon = ({ children, size = 16 }) => (
  <svg viewBox="0 0 24 24" width={size} height={size} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{children}</svg>
);
const IssueOpenIcon = () => <Icon><circle cx="12" cy="12" r="8" /><circle cx="12" cy="12" r="2" /></Icon>;
const IssueClosedIcon = () => <Icon><circle cx="12" cy="12" r="8" /><path d="m9 12 2 2 4-4" /></Icon>;

const statusColor = { open: 'text-green-500', closed: 'text-purple-500', 'in-progress': 'text-yellow-500' };

const UserIssues = () => {
  const [filter, setFilter] = useState('open');
  const [search, setSearch] = useState('');

  const { data: issues = [], isLoading } = useQuery({
    queryKey: ['user-issues', filter],
    queryFn: async () => {
      const { data } = await api.get('/issues', { params: { assignee: 'me', status: filter !== 'all' ? filter : undefined } });
      return Array.isArray(data) ? data : (data.issues || []);
    },
  });

  const filtered = issues.filter((i) =>
    !search || i.title?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-3 border-b border-[var(--border-main)] pb-4 md:flex-row md:items-end">
        <div>
          <h1 className="text-2xl font-semibold">Issues</h1>
          <p className="mt-1 text-sm text-[var(--text-muted)]">Issues assigned to you or created by you</p>
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
          {['open', 'closed', 'all'].map((s) => (
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
          <div className="text-sm font-medium">No issues found</div>
          <p className="mt-1 text-xs text-[var(--text-muted)]">Issues assigned to you will appear here</p>
        </div>
      ) : (
        <div className="panel divide-y divide-[var(--border-main)]">
          {filtered.map((issue) => (
            <div key={issue._id} className="flex items-start gap-3 p-4 hover:bg-[var(--bg-subtle)]">
              <span className={`mt-0.5 shrink-0 ${statusColor[issue.status] || 'text-green-500'}`}>
                {issue.status === 'closed' ? <IssueClosedIcon /> : <IssueOpenIcon />}
              </span>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-sm font-medium">{issue.title}</span>
                  {issue.labels?.map((label) => (
                    <span key={label} className="rounded-full border border-[var(--border-main)] px-2 py-0.5 text-xs">{label}</span>
                  ))}
                </div>
                <div className="mt-1 flex gap-3 text-xs text-[var(--text-muted)]">
                  {issue.repository && <span>in <Link to={`/${issue.repository}`} className="hover:underline">{issue.repository}</Link></span>}
                  <span>#{issue.number}</span>
                  {issue.createdAt && <span>opened {new Date(issue.createdAt).toLocaleDateString()}</span>}
                </div>
              </div>
              <span className={`shrink-0 rounded-full border border-[var(--border-main)] px-2 py-0.5 text-xs capitalize`}>{issue.status || 'open'}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default UserIssues;
