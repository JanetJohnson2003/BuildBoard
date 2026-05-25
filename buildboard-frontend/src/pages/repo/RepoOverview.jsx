import React, { useState, useRef, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useParams, Link } from 'react-router-dom';
import api from '../../lib/api';

const fetchRepoDetails = async (owner, repo) => {
  const { data } = await api.get(`/repos/${owner}/${repo}`);
  return data;
};

const AddFileDropdown = ({ owner, repo }) => {
  const [open, setOpen] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setOpen(!open)}
        className="btn-secondary text-sm flex items-center gap-1"
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 5v14"/><path d="M5 12h14"/></svg>
        Add file
        <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9"></polyline></svg>
      </button>

      {open && (
        <div className="absolute right-0 mt-1 w-48 rounded-md border border-[var(--border-main)] bg-[var(--bg-main)] shadow-lg z-50 overflow-hidden">
          <Link
            to={`/${owner}/${repo}/new/main`}
            className="flex items-center gap-2 px-4 py-2.5 text-sm text-[var(--text-main)] hover:bg-[var(--bg-subtle)] transition-colors"
            onClick={() => setOpen(false)}
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="12" y1="18" x2="12" y2="12"></line><line x1="9" y1="15" x2="15" y2="15"></line></svg>
            Create new file
          </Link>
          <Link
            to={`/${owner}/${repo}/upload/main`}
            className="flex items-center gap-2 px-4 py-2.5 text-sm text-[var(--text-main)] hover:bg-[var(--bg-subtle)] transition-colors border-t border-[var(--border-subtle)]"
            onClick={() => setOpen(false)}
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="17 8 12 3 7 8"></polyline><line x1="12" y1="3" x2="12" y2="15"></line></svg>
            Upload files
          </Link>
        </div>
      )}
    </div>
  );
};

const RepoOverview = () => {
  const { owner, repo } = useParams();

  const { data, isLoading, error } = useQuery({
    queryKey: ['repo', owner, repo],
    queryFn: () => fetchRepoDetails(owner, repo),
  });

  if (isLoading) {
    return (
      <div className="space-y-4 animate-pulse">
        <div className="h-8 bg-[var(--border-main)] rounded w-1/3"></div>
        <div className="h-32 bg-[var(--border-main)] rounded"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <h2 className="text-xl font-semibold mb-2">Repository not found</h2>
        <p className="text-[var(--text-muted)]">The repository {owner}/{repo} doesn't exist or you don't have permission to view it.</p>
      </div>
    );
  }

  const repository = data.repository;
  const recentCommit = data.recentCommit; // Assuming the backend returns the latest commit

  return (
    <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
      <div className="lg:col-span-3 space-y-4">
        {/* Branch/Tags selector and code buttons */}
        <div className="flex justify-between items-center mb-4">
          <button className="btn-secondary text-sm flex items-center gap-2">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="18" cy="18" r="3"></circle><circle cx="6" cy="6" r="3"></circle><path d="M13 6h3a2 2 0 0 1 2 2v7"></path><line x1="6" y1="9" x2="6" y2="21"></line></svg>
            {repository.defaultBranch}
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9"></polyline></svg>
          </button>
          
          <div className="flex gap-2">
            <AddFileDropdown owner={owner} repo={repo} />
            <button className="btn-primary text-sm flex items-center gap-2">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>
              Code
            </button>
          </div>
        </div>

        {/* File Explorer Panel */}
        <div className="panel border-[var(--border-main)] rounded-md overflow-hidden">
          <div className="panel-header flex justify-between items-center bg-[var(--bg-subtle)] text-sm">
            <div className="flex items-center gap-2 font-medium">
              <div className="w-5 h-5 rounded-full bg-[var(--text-main)] flex items-center justify-center text-[var(--bg-main)] text-[10px]">
                {owner.charAt(0).toUpperCase()}
              </div>
              <span className="truncate max-w-[200px]">{recentCommit?.author?.username || owner}</span>
              <span className="text-[var(--text-muted)] truncate max-w-[300px] ml-2">
                {recentCommit?.message || 'Initial commit'}
              </span>
            </div>
            <div className="text-[var(--text-muted)] flex gap-4">
              <span>{recentCommit?.sha?.substring(0, 7) || 'a1b2c3d'}</span>
              <span>1 hour ago</span>
            </div>
          </div>
          
          {/* File list */}
          <div className="divide-y divide-[var(--border-subtle)]">
            {repository.readme && (
              <div className="flex items-center gap-3 px-4 py-2 hover:bg-[var(--bg-subtle)] transition-colors cursor-pointer text-sm">
                <svg className="text-[var(--text-muted)]" xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg>
                <Link to={`/${owner}/${repo}/blob/main/README.md`} className="text-[var(--text-main)] hover:text-[var(--brand-primary)] hover:underline flex-1">README.md</Link>
                <span className="text-[var(--text-muted)] w-2/3 truncate">{recentCommit?.message || 'Initial commit'}</span>
                <span className="text-[var(--text-muted)] text-right w-24">1 hour ago</span>
              </div>
            )}
            {!repository.readme && (
              <div className="px-4 py-8 text-center text-[var(--text-muted)] text-sm">
                This repository is empty.
              </div>
            )}
          </div>
        </div>

        {/* README Panel */}
        {repository.readme && (
          <div className="panel border-[var(--border-main)] rounded-md overflow-hidden mt-6">
            <div className="border-b border-[var(--border-main)] px-4 py-3 bg-[var(--bg-subtle)] font-semibold flex items-center gap-2">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20"></path></svg>
              README.md
            </div>
            <div className="p-8 prose prose-slate dark:prose-invert max-w-none">
              {/* In a real app, use react-markdown here */}
              <pre className="font-sans whitespace-pre-wrap">{repository.readme}</pre>
            </div>
          </div>
        )}
      </div>

      <div className="space-y-6">
        <div>
          <h2 className="font-semibold mb-2 text-[var(--text-main)]">About</h2>
          <p className="text-[var(--text-muted)] text-sm mb-4">
            {repository.description || 'No description, website, or topics provided.'}
          </p>
          <div className="flex items-center gap-2 text-sm text-[var(--text-muted)]">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20"></path><path d="M2 12h20"></path></svg>
            {repository.visibility.charAt(0).toUpperCase() + repository.visibility.slice(1)} repository
          </div>
        </div>

        <div className="border-t border-[var(--border-subtle)] pt-4">
          <h3 className="font-semibold mb-3 text-sm text-[var(--text-main)]">Releases</h3>
          <p className="text-[var(--text-muted)] text-sm">No releases published</p>
        </div>
      </div>
    </div>
  );
};

export default RepoOverview;
