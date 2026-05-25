import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Link, NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import api from '../../lib/api';

const navItems = [
  { to: '/', label: 'Home' },
  { to: '/explore', label: 'Explore' },
  { to: '/organizations', label: 'Organizations' },
  { to: '/admin', label: 'Admin' },
];

const pageTitles = {
  '/': 'Dashboard',
  '/explore': 'Explore',
  '/organizations': 'Organizations',
  '/admin': 'Admin',
  '/new': 'New repository',
  '/profile': 'Profile',
  '/issues': 'Issues',
  '/pulls': 'Pull Requests',
  '/notifications': 'Notifications',
};

/* ──────────────── Icons ──────────────── */
const Icon = ({ children, size = 18 }) => (
  <svg viewBox="0 0 24 24" width={size} height={size} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    {children}
  </svg>
);
const MenuIcon       = () => <Icon><path d="M4 7h16" /><path d="M4 12h16" /><path d="M4 17h16" /></Icon>;
const SearchIcon     = () => <Icon size={17}><circle cx="11" cy="11" r="7" /><path d="m21 21-4.3-4.3" /></Icon>;
const ChevronIcon    = () => <Icon size={13}><path d="m6 9 6 6 6-6" /></Icon>;
const BotIcon        = () => <Icon><rect x="6" y="8" width="12" height="10" rx="3" /><path d="M12 4v4" /><path d="M9 13h.01" /><path d="M15 13h.01" /><path d="M9 18v2" /><path d="M15 18v2" /></Icon>;
const CloudIcon      = () => <Icon><path d="M17.5 19H8a5 5 0 1 1 1.4-9.8A6 6 0 0 1 21 12.5" /><path d="M16 16l3-3 3 3" /><path d="M19 13v8" /></Icon>;
const PlusIcon       = () => <Icon><path d="M12 5v14" /><path d="M5 12h14" /></Icon>;
const IssueIcon      = () => <Icon><circle cx="12" cy="12" r="8" /><circle cx="12" cy="12" r="2" /></Icon>;
const PullRequestIcon= () => <Icon><circle cx="6" cy="6" r="2" /><circle cx="18" cy="18" r="2" /><path d="M6 8v8a2 2 0 0 0 2 2h6" /><path d="M18 16V6" /><path d="m15 9 3-3 3 3" /></Icon>;
const ProjectIcon    = () => <Icon><rect x="5" y="4" width="14" height="16" rx="2" /><path d="M8 8h8" /><path d="M8 12h8" /><path d="M8 16h5" /></Icon>;
const InboxIcon      = () => <Icon><path d="M4 5h16l-2 9H6L4 5Z" /><path d="M6 14v4h12v-4" /><path d="M9 14a3 3 0 0 0 6 0" /></Icon>;
const BookIcon       = () => <Icon><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" /><path d="M4 4.5A2.5 2.5 0 0 1 6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15Z" /></Icon>;
const MoonIcon       = () => <Icon><path d="M21 12.8A8.5 8.5 0 1 1 11.2 3 6.5 6.5 0 0 0 21 12.8Z" /></Icon>;
const SunIcon        = () => <Icon><circle cx="12" cy="12" r="4" /><path d="M12 2v2" /><path d="M12 20v2" /><path d="M4.9 4.9l1.4 1.4" /><path d="m17.7 17.7 1.4 1.4" /><path d="M2 12h2" /><path d="M20 12h2" /><path d="m6.3 17.7-1.4 1.4" /><path d="m19.1 4.9-1.4 1.4" /></Icon>;
const UserIcon       = () => <Icon size={14}><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" /></Icon>;
const SettingsIcon   = () => <Icon size={14}><path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z" /><circle cx="12" cy="12" r="3" /></Icon>;
const LogOutIcon     = () => <Icon size={14}><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" /><polyline points="16 17 21 12 16 7" /><line x1="21" y1="12" x2="9" y2="12" /></Icon>;
const SendIcon       = () => <Icon size={15}><path d="m22 2-7 20-4-9-9-4Z" /><path d="M22 2 11 13" /></Icon>;
const XIcon          = () => <Icon size={16}><path d="M18 6 6 18" /><path d="m6 6 12 12" /></Icon>;

/* ──────────────── HeaderButton ──────────────── */
const HeaderButton = ({ label, children, dropdown = false, active = false, badge = false, onClick, as: Component = 'button', to, className = '' }) => {
  const buttonClassName = `header-button ${active ? 'header-button-active' : ''} ${className}`;
  const content = (
    <>
      <span className="relative grid place-items-center">
        {children}
        {badge && <span className="absolute -right-1 -top-1 h-2.5 w-2.5 rounded-full border-2 border-[var(--bg-subtle)] bg-[var(--brand-primary)]" />}
      </span>
      {dropdown && <ChevronIcon />}
    </>
  );
  if (Component === Link) {
    return (
      <Link to={to} className={buttonClassName} aria-label={label} title={label}>
        {content}
      </Link>
    );
  }
  return (
    <button type="button" className={buttonClassName} aria-label={label} title={label} onClick={onClick}>
      {content}
    </button>
  );
};

/* ──────────────── Command Palette ──────────────── */
const CommandPalette = ({ open, onClose }) => {
  const [query, setQuery] = useState('');
  const navigate = useNavigate();

  const { data, isFetching } = useQuery({
    queryKey: ['command-search', query],
    queryFn: async () => {
      const { data } = await api.get('/platform/search', { params: { q: query } });
      return data;
    },
    enabled: open && query.trim().length > 1,
  });

  const results = useMemo(() => {
    if (!data) return [];
    return [
      ...(data.repositories || []).map((repo) => ({
        type: 'Repository',
        label: `${repo.owner?.username || 'owner'}/${repo.slug}`,
        description: repo.description,
        to: `/${repo.owner?.username}/${repo.slug}`,
      })),
      ...(data.issues || []).map((issue) => ({
        type: 'Issue',
        label: `#${issue.number} ${issue.title}`,
        description: issue.status,
        to: '/issues',
      })),
      ...(data.pullRequests || []).map((pr) => ({
        type: 'Pull request',
        label: `#${pr.number} ${pr.title}`,
        description: pr.status,
        to: '/pulls',
      })),
      ...(data.users || []).map((user) => ({
        type: 'User',
        label: user.username,
        description: user.name,
        to: '/profile',
      })),
      ...(data.organizations || []).map((org) => ({
        type: 'Organization',
        label: org.slug,
        description: org.name,
        to: '/organizations',
      })),
    ].slice(0, 12);
  }, [data]);

  useEffect(() => {
    const onKeyDown = (event) => {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault();
        if (open) onClose();
        if (!open) window.dispatchEvent(new CustomEvent('buildboard:open-command-palette'));
      }
      if (event.key === '/') {
        const tagName = document.activeElement?.tagName?.toLowerCase();
        if (!['input', 'textarea', 'select'].includes(tagName)) {
          event.preventDefault();
          if (!open) window.dispatchEvent(new CustomEvent('buildboard:open-command-palette'));
        }
      }
      if (event.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/40 px-4 py-20" onMouseDown={onClose}>
      <div className="mx-auto max-w-2xl overflow-hidden rounded-lg border border-[var(--border-main)] bg-[var(--bg-main)] shadow-2xl" onMouseDown={(e) => e.stopPropagation()}>
        <div className="flex items-center gap-2 border-b border-[var(--border-main)] px-4 py-3">
          <SearchIcon />
          <input autoFocus className="w-full bg-transparent text-sm outline-none" placeholder="Search users, repos, issues, pull requests…" value={query} onChange={(e) => setQuery(e.target.value)} />
          <button type="button" className="btn-secondary px-2 py-1 text-xs" onClick={onClose}>Esc</button>
        </div>
        <div className="max-h-[420px] overflow-y-auto p-2">
          {query.trim().length < 2 ? (
            <div className="px-3 py-10 text-center text-sm text-[var(--text-muted)]">Type at least two characters to search BuildBoard+.</div>
          ) : isFetching ? (
            <div className="space-y-2 p-3">{[1,2,3,4].map((i) => <div key={i} className="h-10 animate-pulse rounded-md bg-[var(--bg-subtle)]" />)}</div>
          ) : results.length ? (
            <div className="space-y-1">
              {results.map((result, idx) => (
                <button key={`${result.type}-${result.label}-${idx}`} type="button"
                  className="flex w-full items-center justify-between rounded-md px-3 py-2 text-left hover:bg-[var(--bg-subtle)]"
                  onClick={() => { onClose(); navigate(result.to); }}
                >
                  <span className="min-w-0">
                    <span className="block truncate text-sm font-medium">{result.label}</span>
                    <span className="block truncate text-xs text-[var(--text-muted)]">{result.description || result.type}</span>
                  </span>
                  <span className="ml-3 shrink-0 rounded-full border border-[var(--border-main)] px-2 py-0.5 text-xs text-[var(--text-muted)]">{result.type}</span>
                </button>
              ))}
            </div>
          ) : (
            <div className="px-3 py-10 text-center text-sm text-[var(--text-muted)]">No results found.</div>
          )}
        </div>
      </div>
    </div>
  );
};


/* ──────────────── Profile Dropdown ──────────────── */
const ProfileDropdown = ({ user, onClose, onLogout }) => {
  const navigate = useNavigate();
  const dropdownRef = useRef(null);

  useEffect(() => {
    const handler = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) onClose();
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [onClose]);

  const go = (to) => { onClose(); navigate(to); };

  return (
    <div ref={dropdownRef} className="absolute right-0 top-full z-50 mt-2 w-64 overflow-hidden rounded-lg border border-[var(--border-main)] bg-[var(--bg-main)] shadow-2xl">
      {/* User info */}
      <div className="border-b border-[var(--border-main)] px-4 py-3">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 shrink-0 overflow-hidden rounded-full border border-[var(--border-main)] bg-[var(--bg-subtle)]">
            {user?.avatar
              ? <img src={user.avatar} alt="" className="h-full w-full object-cover" />
              : <span className="flex h-full w-full items-center justify-center text-sm font-bold">{(user?.username || 'B').slice(0,1).toUpperCase()}</span>
            }
          </div>
          <div className="min-w-0">
            <div className="truncate text-sm font-semibold">{user?.name || user?.username}</div>
            <div className="truncate text-xs text-[var(--text-muted)]">@{user?.username}</div>
          </div>
        </div>
      </div>

      {/* Menu items */}
      <div className="py-1">
        <button type="button" className="flex w-full items-center gap-2.5 px-4 py-2 text-sm hover:bg-[var(--bg-subtle)]" onClick={() => go('/profile')}>
          <UserIcon /> Your profile
        </button>
        <button type="button" className="flex w-full items-center gap-2.5 px-4 py-2 text-sm hover:bg-[var(--bg-subtle)]" onClick={() => go('/explore')}>
          <span className="opacity-70"><BookIcon /></span> Your repositories
        </button>
        <button type="button" className="flex w-full items-center gap-2.5 px-4 py-2 text-sm hover:bg-[var(--bg-subtle)]" onClick={() => go('/organizations')}>
          <span className="opacity-70"><ProjectIcon /></span> Your organizations
        </button>
        <button type="button" className="flex w-full items-center gap-2.5 px-4 py-2 text-sm hover:bg-[var(--bg-subtle)]" onClick={() => go('/issues')}>
          <span className="opacity-70"><IssueIcon /></span> Your issues
        </button>
        <button type="button" className="flex w-full items-center gap-2.5 px-4 py-2 text-sm hover:bg-[var(--bg-subtle)]" onClick={() => go('/pulls')}>
          <span className="opacity-70"><PullRequestIcon /></span> Your pull requests
        </button>
        {(user?.role === 'admin' || user?.role === 'reviewer') && (
          <button type="button" className="flex w-full items-center gap-2.5 px-4 py-2 text-sm text-[var(--brand-primary)] hover:bg-[var(--bg-subtle)]" onClick={() => go('/reviewer')}>
            <span className="opacity-70"><ProjectIcon /></span> Reviewer Dashboard
          </button>
        )}
      </div>

      <div className="border-t border-[var(--border-main)] py-1">
        <button type="button" className="flex w-full items-center gap-2.5 px-4 py-2 text-sm hover:bg-[var(--bg-subtle)]" onClick={() => { onClose(); /* TODO: settings page */ }}>
          <SettingsIcon /> Settings
        </button>
      </div>

      <div className="border-t border-[var(--border-main)] py-1">
        <button type="button" className="flex w-full items-center gap-2.5 px-4 py-2 text-sm text-red-500 hover:bg-[var(--bg-subtle)]" onClick={onLogout}>
          <LogOutIcon /> Sign out
        </button>
      </div>
    </div>
  );
};

/* ──────────────── Global Sidebar ──────────────── */
const GlobalSidebar = ({ open, onClose, user, onOpenPalette }) => {
  const { data: userRepos } = useQuery({
    queryKey: ['user-repos', user?.username],
    queryFn: async () => {
      if (!user?.username) return [];
      const { data } = await api.get(`/users/${user.username}/repos`);
      return Array.isArray(data) ? data : data.repositories || [];
    },
    enabled: !!user?.username && open,
  });

  const topRepos = (userRepos || []).slice(0, 5);

  if (!open) return null;

  return (
    <>
      <div className="fixed inset-0 z-[60] bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="fixed left-0 top-0 z-[60] h-full w-[320px] max-w-full bg-[#0d1117] border-r border-[#30363d] flex flex-col overflow-y-auto text-sm text-[#c9d1d9] shadow-2xl transition-transform duration-300">
        {/* Header */}
        <div className="flex items-center justify-between p-4 mb-2">
          <Link to="/" onClick={onClose} className="text-white hover:text-gray-300">
            <svg viewBox="0 0 24 24" width="32" height="32" fill="currentColor"><path d="M12 2C6.477 2 2 6.477 2 12c0 4.42 2.865 8.166 6.839 9.489.5.092.682-.217.682-.482 0-.237-.008-.866-.013-1.699-2.782.603-3.369-1.34-3.369-1.34-.454-1.156-1.11-1.462-1.11-1.462-.908-.62.069-.608.069-.608 1.003.07 1.531 1.03 1.531 1.03.892 1.529 2.341 1.087 2.91.831.092-.646.35-1.086.636-1.336-2.22-.253-4.555-1.11-4.555-4.943 0-1.091.39-1.984 1.029-2.683-.103-.253-.446-1.27.098-2.647 0 0 .84-.269 2.75 1.025A9.578 9.578 0 0112 6.836c.85.004 1.705.114 2.504.336 1.909-1.294 2.747-1.025 2.747-1.025.546 1.377.203 2.394.1 2.647.64.699 1.028 1.592 1.028 2.683 0 3.842-2.339 4.687-4.566 4.935.359.309.678.919.678 1.852 0 1.336-.012 2.415-.012 2.743 0 .267.18.578.688.48C19.138 20.161 22 16.416 22 12c0-5.523-4.477-10-10-10z"/></svg>
          </Link>
          <button type="button" className="text-gray-400 hover:text-white p-1 rounded hover:bg-[#21262d]" onClick={onClose}><XIcon /></button>
        </div>

        {/* Links */}
        <div className="flex-1 overflow-y-auto px-3 pb-6">
          <nav className="space-y-0.5 mb-4 font-semibold">
            <Link to="/" onClick={onClose} className="flex items-center gap-3 px-2 py-2 rounded hover:bg-[#161b22] text-[#c9d1d9]"><Icon size={16}><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></Icon>Home</Link>
            <Link to="/issues" onClick={onClose} className="flex items-center gap-3 px-2 py-2 rounded hover:bg-[#161b22] text-[#c9d1d9]"><IssueIcon />All issues</Link>
            <Link to="/pulls" onClick={onClose} className="flex items-center gap-3 px-2 py-2 rounded hover:bg-[#161b22] text-[#c9d1d9]"><PullRequestIcon />All pull requests</Link>
            <Link to="/explore" onClick={onClose} className="flex items-center gap-3 px-2 py-2 rounded hover:bg-[#161b22] text-[#c9d1d9]"><BookIcon />All repositories</Link>
            <Link to="/organizations" onClick={onClose} className="flex items-center gap-3 px-2 py-2 rounded hover:bg-[#161b22] text-[#c9d1d9]"><ProjectIcon />Projects</Link>
            {(user?.role === 'admin' || user?.role === 'reviewer') && (
              <Link to="/reviewer" onClick={onClose} className="flex items-center gap-3 px-2 py-2 rounded hover:bg-[#161b22] text-[#58a6ff]"><ProjectIcon />Reviewer Dashboard</Link>
            )}
            <Link to="/discussions" onClick={onClose} className="flex items-center gap-3 px-2 py-2 rounded hover:bg-[#161b22] text-[#c9d1d9]"><Icon size={16}><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></Icon>Discussions</Link>
            <Link to="/codespaces" onClick={onClose} className="flex items-center gap-3 px-2 py-2 rounded hover:bg-[#161b22] text-[#c9d1d9]"><Icon size={16}><rect x="2" y="3" width="20" height="14" rx="2" ry="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/></Icon>Codespaces</Link>
          </nav>
          
          <div className="border-t border-[#30363d] my-3"></div>
          
          <nav className="space-y-0.5 mb-4 font-semibold">
            <Link to="/explore" onClick={onClose} className="flex items-center gap-3 px-2 py-2 rounded hover:bg-[#161b22] text-[#c9d1d9]"><Icon size={16}><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></Icon>Explore</Link>
            <Link to="/marketplace" onClick={onClose} className="flex items-center gap-3 px-2 py-2 rounded hover:bg-[#161b22] text-[#c9d1d9]"><Icon size={16}><path d="M20 21H4a2 2 0 0 1-2-2V9a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2z"/><path d="M6 7V5a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v2"/></Icon>Marketplace</Link>
            <Link to="/mcp" onClick={onClose} className="flex items-center gap-3 px-2 py-2 rounded hover:bg-[#161b22] text-[#c9d1d9]"><Icon size={16}><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/><polyline points="3.27 6.96 12 12.01 20.73 6.96"/><line x1="12" y1="22.08" x2="12" y2="12"/></Icon>MCP registry</Link>
          </nav>

          <div className="border-t border-[#30363d] my-4"></div>

          <div className="px-2">
            <div className="flex items-center justify-between text-[13px] text-[#8b949e] mb-2 font-semibold">
              Top repositories
              <button type="button" className="hover:text-white p-1 rounded hover:bg-[#21262d]" onClick={() => { onClose(); onOpenPalette(); }}><SearchIcon size={14}/></button>
            </div>
            <div className="space-y-0.5 mt-3 font-semibold">
              {topRepos.map((repo, idx) => {
                const gradients = [
                  "from-pink-500 to-violet-500",
                  "from-orange-400 to-pink-500",
                  "from-fuchsia-500 to-purple-600",
                  "from-pink-400 to-rose-500",
                  "from-indigo-500 to-blue-600",
                ];
                const gradient = gradients[idx % gradients.length];
                return (
                  <Link key={repo._id || repo.id} to={`/${user.username}/${repo.slug || repo.name}`} onClick={onClose} className="flex items-center gap-2.5 px-2 py-2 rounded hover:bg-[#161b22] text-[13px] text-[#c9d1d9]">
                    <div className={`w-[18px] h-[18px] rounded-full bg-gradient-to-tr ${gradient} shrink-0 border border-white/10`}></div>
                    {user.username}/{repo.name}
                  </Link>
                );
              })}
              {topRepos.length === 0 && (
                <div className="text-[#8b949e] px-2 py-1 text-[13px]">No repositories found.</div>
              )}
            </div>
            {userRepos && userRepos.length > 5 ? (
              <Link to="/explore" onClick={onClose} className="text-xs text-[#8b949e] hover:text-[#58a6ff] px-2 mt-4 font-semibold block">Show more</Link>
            ) : (
              <button type="button" className="text-xs text-[#8b949e] hover:text-[#58a6ff] px-2 mt-4 font-semibold">Show more</button>
            )}
          </div>
        </div>
      </div>
    </>
  );
};

/* ──────────────── AppLayout ──────────────── */
const AppLayout = () => {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const location = useLocation();
  const [paletteOpen, setPaletteOpen]   = useState(false);
  const [sidebarOpen, setSidebarOpen]   = useState(false);
  const [profileOpen, setProfileOpen]   = useState(false);

  const pageTitle = pageTitles[location.pathname] ||
    (location.pathname.split('/').filter(Boolean).length >= 2 ? 'Repository' : 'Dashboard');

  useEffect(() => {
    const openPalette = () => setPaletteOpen(true);
    window.addEventListener('buildboard:open-command-palette', openPalette);
    return () => window.removeEventListener('buildboard:open-command-palette', openPalette);
  }, []);

  // Notification badge — fetch unread count
  const { data: notifData } = useQuery({
    queryKey: ['notif-count'],
    queryFn: async () => {
      const { data } = await api.get('/notifications', { params: { unread: true } });
      const list = Array.isArray(data) ? data : (data.notifications || []);
      return list.length;
    },
    refetchInterval: 60_000,
  });
  const hasUnread = (notifData || 0) > 0;

  return (
    <div className="min-h-screen bg-[var(--bg-main)] text-[var(--text-main)]">
      <header className="sticky top-0 z-40 border-b border-[var(--border-main)] bg-[var(--bg-subtle)]">
        <div className="flex h-16 items-center gap-3 px-4">
          {/* Hamburger */}
          <button type="button" className="header-button" aria-label="Open navigation menu" onClick={() => setSidebarOpen((o) => !o)}>
            <MenuIcon />
          </button>

          {/* Logo */}
          <Link to="/" className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-[var(--text-main)] text-sm font-bold text-[var(--bg-main)]" aria-label="BuildBoard+ home" title="BuildBoard+">
            B
          </Link>

          {/* Page title */}
          <Link to="/" className="hidden max-w-[180px] truncate text-base font-semibold sm:block">
            {pageTitle}
          </Link>

          {/* Search bar (large screens) */}
          <button type="button" className="github-search ml-auto hidden min-w-[260px] max-w-[520px] flex-1 items-center gap-2 rounded-md border border-[var(--border-main)] bg-[var(--bg-main)] px-3 py-2 text-left text-sm text-[var(--text-muted)] lg:flex" onClick={() => setPaletteOpen(true)}>
            <SearchIcon />
            <span className="truncate">Type <kbd>/</kbd> to search</span>
          </button>

          {/* Right-side actions */}
          <div className="ml-auto flex min-w-0 items-center gap-2 lg:ml-0">
            {/* Search (mobile) */}
            <button type="button" className="header-button lg:hidden" aria-label="Search" title="Search" onClick={() => setPaletteOpen(true)}>
              <SearchIcon />
            </button>
            {/* Agent Workspace → Organizations */}
            <HeaderButton label="Agent workspace" dropdown className="hide-until-sm" as={Link} to="/organizations">
              <CloudIcon />
            </HeaderButton>

            <span className="mx-1 hidden h-6 w-px bg-[var(--border-main)] md:block" />

            {/* Create new → /new */}
            <HeaderButton label="Create new" dropdown as={Link} to="/new">
              <PlusIcon />
            </HeaderButton>

            {/* Issues → /issues */}
            <HeaderButton label="Issues" className="hide-until-sm" as={Link} to="/issues">
              <IssueIcon />
            </HeaderButton>

            {/* Pull Requests → /pulls */}
            <HeaderButton label="Pull requests" className="hide-until-sm" as={Link} to="/pulls">
              <PullRequestIcon />
            </HeaderButton>

            {/* Projects → /organizations */}
            <HeaderButton label="Projects" as={Link} to="/organizations" className="hide-until-md">
              <ProjectIcon />
            </HeaderButton>

            {/* Repositories → /explore */}
            <HeaderButton label="Repositories" as={Link} to="/explore" className="hide-until-md">
              <BookIcon />
            </HeaderButton>

            {/* Inbox → /notifications */}
            <HeaderButton label="Inbox" badge={hasUnread} className="hide-until-sm" as={Link} to="/notifications">
              <InboxIcon />
            </HeaderButton>

            {/* Theme toggle */}
            <HeaderButton label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'} onClick={toggleTheme}>
              {theme === 'dark' ? <SunIcon /> : <MoonIcon />}
            </HeaderButton>

            {/* Profile avatar → dropdown (NOT logout) */}
            <div className="relative">
              <button
                type="button"
                className="relative grid h-9 w-9 shrink-0 place-items-center overflow-hidden rounded-full border border-[var(--border-main)] bg-[var(--bg-main)] text-sm font-semibold ring-2 ring-transparent transition-all hover:ring-[var(--brand-primary)]"
                onClick={() => setProfileOpen((o) => !o)}
                aria-label="Account menu"
                title={`${user?.username || 'Account'} — open profile menu`}
              >
                <span className="absolute right-0 top-0 h-2.5 w-2.5 rounded-full border-2 border-[var(--bg-subtle)] bg-[var(--brand-primary)]" />
                {user?.avatar
                  ? <img src={user.avatar} alt="" className="h-full w-full object-cover" />
                  : <span>{(user?.username || 'B').slice(0,1).toUpperCase()}</span>
                }
              </button>
              {profileOpen && (
                <ProfileDropdown user={user} onClose={() => setProfileOpen(false)} onLogout={logout} />
              )}
            </div>
          </div>
        </div>
      </header>

      <GlobalSidebar 
        open={sidebarOpen} 
        onClose={() => setSidebarOpen(false)} 
        user={user} 
        onOpenPalette={() => setPaletteOpen(true)}
      />

      <div className="mx-auto grid max-w-screen-2xl grid-cols-1">
        <main className="min-w-0 px-4 py-6 lg:px-8">
          <Outlet />
        </main>
      </div>

      <CommandPalette open={paletteOpen} onClose={() => setPaletteOpen(false)} />
    </div>
  );
};

export default AppLayout;
