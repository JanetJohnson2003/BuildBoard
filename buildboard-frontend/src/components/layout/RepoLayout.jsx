import React from 'react';
import { Outlet, Link, useLocation, useParams } from 'react-router-dom';

const RepoLayout = () => {
  const { owner, repo } = useParams();
  const location = useLocation();

  const tabs = [
    { name: 'Code', path: `/${owner}/${repo}`, icon: 'code' },
    { name: 'Issues', path: `/${owner}/${repo}?tab=issues`, icon: 'issue' },
    { name: 'Pull Requests', path: `/${owner}/${repo}?tab=pull-requests`, icon: 'pr' },
    { name: 'Actions', path: `/${owner}/${repo}?tab=actions`, icon: 'play' },
    { name: 'Projects', path: `/${owner}/${repo}?tab=projects`, icon: 'project' },
    { name: 'Architecture', path: `/${owner}/${repo}/architecture`, icon: 'map' },
    { name: 'Security', path: `/${owner}/${repo}?tab=security`, icon: 'shield' },
    { name: 'Insights', path: `/${owner}/${repo}/analytics`, icon: 'graph' },
    { name: 'Comm-Link', path: `/${owner}/${repo}/chat`, icon: 'message' },
    { name: 'Settings', path: `/${owner}/${repo}?tab=settings`, icon: 'gear' },
  ];

  return (
    <div className="w-full">
      <div className="bg-[var(--bg-subtle)] border-b border-[var(--border-main)] pt-4 pb-0 px-6">
        <div className="flex items-center gap-2 mb-4">
          <svg className="text-[var(--text-muted)]" xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20"></path></svg>
          <Link to={`/${owner}`} className="text-xl text-[var(--brand-primary)] hover:underline">{owner}</Link>
          <span className="text-[var(--text-muted)] text-xl">/</span>
          <Link to={`/${owner}/${repo}`} className="text-xl font-semibold text-[var(--brand-primary)] hover:underline">{repo}</Link>
          <span className="ml-2 border border-[var(--border-main)] text-[var(--text-muted)] rounded-full px-2 py-0.5 text-xs font-medium">Public</span>
        </div>

        <nav className="flex gap-2 -mb-px overflow-x-auto">
          {tabs.map((tab) => {
            const isTabCode = tab.name === 'Code';
            const tabUrl = new URL(tab.path, window.location.origin);
            const expectedPath = tabUrl.pathname;
            const expectedSearch = tabUrl.search;
            
            let isActive = false;
            if (expectedSearch) {
              isActive = location.pathname === expectedPath && location.search.includes(expectedSearch);
            } else {
              isActive = location.pathname === expectedPath && (!location.search || isTabCode);
            }
            if (isTabCode && location.pathname === `/${owner}/${repo}` && !location.search) isActive = true;

            return (
              <Link
                key={tab.name}
                to={tab.path}
                className={`flex items-center gap-2 px-3 py-2 text-sm font-medium border-b-2 transition-colors ${
                  isActive 
                    ? 'border-[var(--brand-primary)] text-[var(--text-main)]' 
                    : 'border-transparent text-[var(--text-muted)] hover:text-[var(--text-main)] hover:border-[var(--border-subtle)]'
                }`}
              >
                {tab.name}
              </Link>
            );
          })}
        </nav>
      </div>
      
      <div className="max-w-7xl mx-auto py-6 px-4">
        <Outlet />
      </div>
    </div>
  );
};

export default RepoLayout;
