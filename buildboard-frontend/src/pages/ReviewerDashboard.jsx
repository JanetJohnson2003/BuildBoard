import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import api from '../lib/api';

const ReviewerDashboard = () => {
  const [search, setSearch] = useState('');
  const [visibility, setVisibility] = useState('');
  const [page, setPage] = useState(1);

  const { data, isLoading, error } = useQuery({
    queryKey: ['reviewer-repos', search, visibility, page],
    queryFn: async () => {
      const { data } = await api.get('/admin/repos', {
        params: { search, visibility, page, limit: 20 }
      });
      return data;
    },
    keepPreviousData: true
  });

  if (isLoading && !data) {
    return (
      <div className="flex h-[calc(100vh-100px)] items-center justify-center">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-[var(--border-main)] border-t-[var(--brand-primary)]" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-lg border border-red-500/20 bg-red-500/10 p-6 text-center text-red-500">
        <h2 className="mb-2 text-xl font-semibold">Error Loading Dashboard</h2>
        <p>{error.response?.data?.message || error.message}</p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-8 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <h1 className="text-3xl font-bold text-[var(--text-main)]">Reviewer Dashboard</h1>
          <p className="mt-2 text-[var(--text-muted)]">Monitor and review all platform repositories.</p>
        </div>
        <div className="flex gap-4">
          <div className="flex flex-col gap-1">
            <label className="text-xs text-[var(--text-muted)]">Search</label>
            <input
              type="text"
              placeholder="Search repos..."
              className="rounded-md border border-[var(--border-main)] bg-[var(--bg-subtle)] px-3 py-2 text-sm focus:border-[var(--brand-primary)] focus:outline-none"
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-xs text-[var(--text-muted)]">Visibility</label>
            <select
              className="rounded-md border border-[var(--border-main)] bg-[var(--bg-subtle)] px-3 py-2 text-sm focus:border-[var(--brand-primary)] focus:outline-none"
              value={visibility}
              onChange={(e) => { setVisibility(e.target.value); setPage(1); }}
            >
              <option value="">All</option>
              <option value="public">Public</option>
              <option value="private">Private</option>
            </select>
          </div>
        </div>
      </div>

      <div className="overflow-hidden rounded-lg border border-[var(--border-main)] bg-[var(--bg-subtle)]/50 backdrop-blur-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-[var(--bg-subtle)] uppercase text-[var(--text-muted)]">
              <tr>
                <th className="px-6 py-4 font-medium">Repository</th>
                <th className="px-6 py-4 font-medium">Owner</th>
                <th className="px-6 py-4 font-medium">Visibility</th>
                <th className="px-6 py-4 font-medium">Stats</th>
                <th className="px-6 py-4 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border-main)]">
              {data?.repos?.map((repo) => (
                <tr key={repo._id} className="hover:bg-[var(--bg-main)]/50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="font-medium text-[var(--brand-primary)]">
                      <Link to={`/${repo.owner?.username || 'unknown'}/${repo.slug}`} className="hover:underline">
                        {repo.name}
                      </Link>
                    </div>
                    <div className="mt-1 text-xs text-[var(--text-muted)] max-w-xs truncate">
                      {repo.description || 'No description'}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <div className="h-6 w-6 overflow-hidden rounded-full bg-[var(--border-main)]">
                        {repo.owner?.avatar && (
                          <img src={repo.owner.avatar} alt="" className="h-full w-full object-cover" />
                        )}
                      </div>
                      <span>{repo.owner?.username || 'Unknown'}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                      repo.visibility === 'private' ? 'bg-amber-500/10 text-amber-500' : 'bg-green-500/10 text-green-500'
                    }`}>
                      {repo.visibility}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-[var(--text-muted)]">
                    <div className="flex items-center gap-4">
                      <span title="Stars" className="flex items-center gap-1">⭐ {repo.starCount}</span>
                      <span title="Forks" className="flex items-center gap-1">🌿 {repo.forkCount}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <Link
                      to={`/${repo.owner?.username || 'unknown'}/${repo.slug}`}
                      className="inline-flex items-center gap-1 rounded-md bg-[var(--brand-primary)]/10 px-3 py-1.5 text-xs font-medium text-[var(--brand-primary)] hover:bg-[var(--brand-primary)]/20 transition-colors"
                    >
                      Review Code
                    </Link>
                  </td>
                </tr>
              ))}
              {data?.repos?.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-[var(--text-muted)]">
                    No repositories found matching your criteria.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        {/* Pagination */}
        {data?.pages > 1 && (
          <div className="flex items-center justify-between border-t border-[var(--border-main)] px-6 py-3 bg-[var(--bg-main)]">
            <button
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
              className="rounded-md border border-[var(--border-main)] px-3 py-1 text-sm disabled:opacity-50 hover:bg-[var(--bg-subtle)]"
            >
              Previous
            </button>
            <span className="text-sm text-[var(--text-muted)]">
              Page {page} of {data.pages}
            </span>
            <button
              onClick={() => setPage(p => Math.min(data.pages, p + 1))}
              disabled={page === data.pages}
              className="rounded-md border border-[var(--border-main)] px-3 py-1 text-sm disabled:opacity-50 hover:bg-[var(--bg-subtle)]"
            >
              Next
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default ReviewerDashboard;
