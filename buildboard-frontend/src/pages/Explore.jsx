import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import api from '../lib/api';

const Explore = () => {
  const [filters, setFilters] = useState({ q: '', sort: 'stars', language: '' });

  const { data: repos = [], isLoading } = useQuery({
    queryKey: ['explore-repos', filters],
    queryFn: async () => {
      const { data } = await api.get('/repos/explore', { params: filters });
      return data;
    },
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-3 border-b border-[var(--border-main)] pb-4 md:flex-row md:items-end">
        <div>
          <h1 className="text-2xl font-semibold">Explore BuildBoard+</h1>
          <p className="mt-1 text-sm text-[var(--text-muted)]">Discover public repositories, templates, topics, releases, and active teams.</p>
        </div>
        <Link to="/new" className="btn-primary self-start md:self-auto">New repository</Link>
      </div>

      <div className="panel p-4">
        <div className="grid gap-3 md:grid-cols-[1fr_160px_160px]">
          <input className="input-field" placeholder="Search repositories" value={filters.q} onChange={(event) => setFilters((current) => ({ ...current, q: event.target.value }))} />
          <select className="input-field" value={filters.sort} onChange={(event) => setFilters((current) => ({ ...current, sort: event.target.value }))}>
            <option value="stars">Most starred</option>
            <option value="recent">Newest</option>
            <option value="updated">Recently updated</option>
            <option value="name">Name</option>
          </select>
          <input className="input-field" placeholder="Language" value={filters.language} onChange={(event) => setFilters((current) => ({ ...current, language: event.target.value }))} />
        </div>
      </div>

      <div className="panel divide-y divide-[var(--border-main)]">
        {isLoading ? (
          <div className="space-y-3 p-4">
            {[1, 2, 3, 4].map((item) => <div key={item} className="h-20 animate-pulse rounded-md bg-[var(--bg-subtle)]" />)}
          </div>
        ) : repos.length ? repos.map((repo) => (
          <div key={repo._id} className="p-4">
            <div className="flex flex-col justify-between gap-3 md:flex-row">
              <div className="min-w-0">
                <Link to={`/${repo.owner?.username}/${repo.slug}`} className="text-lg font-semibold text-[var(--brand-primary)] hover:underline">
                  {repo.owner?.username}/{repo.name}
                </Link>
                <p className="mt-1 line-clamp-2 text-sm text-[var(--text-muted)]">{repo.description || 'No description provided.'}</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {(repo.topics || []).slice(0, 6).map((topic) => (
                    <span key={topic} className="rounded-full bg-[var(--bg-subtle)] px-2 py-0.5 text-xs text-[var(--brand-primary)]">{topic}</span>
                  ))}
                </div>
              </div>
              <div className="flex shrink-0 gap-4 text-sm text-[var(--text-muted)] md:justify-end">
                <span>{repo.language || 'Mixed'}</span>
                <span>{repo.starCount} stars</span>
                <span>{repo.forkCount} forks</span>
              </div>
            </div>
          </div>
        )) : (
          <div className="p-12 text-center text-sm text-[var(--text-muted)]">No repositories matched your filters.</div>
        )}
      </div>
    </div>
  );
};

export default Explore;
