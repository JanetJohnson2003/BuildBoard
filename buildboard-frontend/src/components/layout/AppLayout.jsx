import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Link, NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import api from '../../lib/api';
import { pageTransition, sidebarTransition } from '../../utils/animations';
import { NeonButton, CyberDropdown, CyberDropdownItem, CyberInput } from '../ui';
import { 
  Menu, Search, Bot, Cloud, Plus, CircleDot, GitPullRequest, 
  Layout, Inbox, Book, Moon, Sun, User, Settings, LogOut, X, 
  Cpu, Zap, GitBranch, Home, ChevronRight
} from 'lucide-react';
import { twMerge } from 'tailwind-merge';

const pageTitles = {
  '/': 'Dashboard',
  '/explore': 'Explore',
  '/organizations': 'Organizations',
  '/admin': 'Admin',
  '/new': 'New Repository',
  '/profile': 'Profile',
  '/issues': 'Issues',
  '/pulls': 'Pull Requests',
  '/notifications': 'Notifications',
};

/* ──────────────── HeaderButton ──────────────── */
const HeaderButton = ({ label, children, active = false, badge = false, onClick, as: Component = 'button', to, className = '' }) => {
  const content = (
    <>
      <span className="relative grid place-items-center">
        {children}
        {badge && (
          <span className="absolute -right-1 -top-1 flex h-2.5 w-2.5 items-center justify-center">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[var(--brand-primary)] opacity-75"></span>
            <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-[var(--brand-primary)]"></span>
          </span>
        )}
      </span>
    </>
  );
  
  const baseClass = twMerge(
    'p-2 rounded-lg text-[var(--text-muted)] hover:text-[var(--text-main)] hover:bg-[var(--glass-highlight)] transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand-primary)]',
    active && 'text-[var(--brand-primary)] bg-[var(--brand-primary)]/10',
    className
  );

  if (Component === Link) {
    return (
      <Link to={to} className={baseClass} aria-label={label} title={label}>
        {content}
      </Link>
    );
  }
  return (
    <button type="button" className={baseClass} aria-label={label} title={label} onClick={onClick}>
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
        icon: <Book size={16} />,
        label: `${repo.owner?.username || 'owner'}/${repo.slug}`,
        description: repo.description,
        to: `/${repo.owner?.username}/${repo.slug}`,
      })),
      ...(data.issues || []).map((issue) => ({
        type: 'Issue',
        icon: <CircleDot size={16} />,
        label: `#${issue.number} ${issue.title}`,
        description: issue.status,
        to: '/issues',
      })),
      ...(data.pullRequests || []).map((pr) => ({
        type: 'Pull Request',
        icon: <GitPullRequest size={16} />,
        label: `#${pr.number} ${pr.title}`,
        description: pr.status,
        to: '/pulls',
      })),
      ...(data.users || []).map((user) => ({
        type: 'User',
        icon: <User size={16} />,
        label: user.username,
        description: user.name,
        to: '/profile',
      })),
      ...(data.organizations || []).map((org) => ({
        type: 'Organization',
        icon: <Layout size={16} />,
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
      if (event.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-start justify-center pt-[15vh] px-4 pointer-events-auto">
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />
      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: -20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: -20 }}
        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
        className="relative w-full max-w-2xl glass-panel shadow-[0_0_50px_rgba(0,212,255,0.15)] flex flex-col overflow-hidden"
      >
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-[var(--brand-primary)] via-[var(--brand-purple)] to-[var(--brand-success)] opacity-80" />
        
        <div className="flex items-center gap-3 p-4 border-b border-[var(--glass-border)]">
          <Search className="text-[var(--brand-primary)]" />
          <input 
            autoFocus 
            className="flex-1 bg-transparent text-lg text-[var(--text-main)] outline-none placeholder:text-[var(--text-muted)]" 
            placeholder="Search the nexus..." 
            value={query} 
            onChange={(e) => setQuery(e.target.value)} 
          />
          <div className="text-[10px] font-mono text-[var(--text-muted)] bg-[var(--bg-tertiary)] px-2 py-1 rounded border border-[var(--glass-border)]">ESC</div>
        </div>
        
        <div className="max-h-[60vh] overflow-y-auto cyber-scrollbar">
          {query.trim().length < 2 ? (
            <div className="py-12 flex flex-col items-center justify-center text-[var(--text-muted)]">
              <Zap size={32} className="mb-4 opacity-30" />
              <p>Initialize search by typing</p>
            </div>
          ) : isFetching ? (
            <div className="p-4 space-y-3">
              {[1,2,3,4].map((i) => (
                <div key={i} className="h-14 animate-[shimmer-neon_2s_infinite] bg-gradient-to-r from-[var(--bg-tertiary)] via-[rgba(0,212,255,0.05)] to-[var(--bg-tertiary)] rounded-lg" style={{ backgroundSize: '200% 100%' }} />
              ))}
            </div>
          ) : results.length ? (
            <div className="p-2 space-y-1">
              {results.map((result, idx) => (
                <button 
                  key={`${result.type}-${result.label}-${idx}`}
                  type="button"
                  className="flex w-full items-center justify-between rounded-lg p-3 text-left hover:bg-[var(--glass-highlight)] transition-colors group outline-none focus-visible:bg-[var(--glass-highlight)]"
                  onClick={() => { onClose(); navigate(result.to); }}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="p-2 bg-[var(--bg-tertiary)] text-[var(--text-muted)] rounded-md group-hover:text-[var(--brand-primary)] group-hover:bg-[var(--brand-primary)]/10 transition-colors">
                      {result.icon}
                    </div>
                    <div className="min-w-0">
                      <div className="truncate text-sm font-medium text-[var(--text-main)] group-hover:text-[var(--brand-primary)] transition-colors">{result.label}</div>
                      <div className="truncate text-xs text-[var(--text-muted)]">{result.description || result.type}</div>
                    </div>
                  </div>
                  <span className="shrink-0 text-[10px] font-mono tracking-wider uppercase text-[var(--brand-primary)] opacity-0 group-hover:opacity-100 transition-opacity">
                    JUMP_TO
                  </span>
                </button>
              ))}
            </div>
          ) : (
            <div className="py-12 text-center text-[var(--text-muted)]">
              <p>NO DATA FOUND IN NEXUS.</p>
            </div>
          )}
        </div>
      </motion.div>
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

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[60] bg-black/60 backdrop-blur-md" 
            onClick={onClose} 
          />
          <motion.div 
            variants={sidebarTransition}
            initial="hidden"
            animate="visible"
            exit="exit"
            className="fixed left-0 top-0 bottom-0 z-[60] w-[320px] max-w-[85vw] glass-panel border-l-0 rounded-l-none flex flex-col shadow-[20px_0_50px_rgba(0,0,0,0.5)]"
          >
            {/* Edge highlight */}
            <div className="absolute right-0 top-0 bottom-0 w-[1px] bg-gradient-to-b from-transparent via-[var(--brand-primary)] to-transparent opacity-50" />
            
            {/* Header */}
            <div className="flex items-center justify-between p-5 border-b border-[var(--glass-border)]">
              <Link to="/" onClick={onClose} className="flex items-center gap-3 group">
                <div className="grid h-10 w-10 place-items-center rounded-lg bg-gradient-to-br from-[var(--brand-primary)] to-[var(--brand-purple)] text-white font-display font-bold shadow-[0_0_15px_var(--brand-primary)] group-hover:shadow-[0_0_25px_var(--brand-primary)] transition-shadow">
                  BB
                </div>
                <div>
                  <div className="font-display font-bold tracking-widest text-[var(--text-main)]">BUILDBOARD<span className="text-[var(--brand-primary)]">+</span></div>
                  <div className="text-[10px] font-mono text-[var(--text-muted)]">NEXUS_TERMINAL_v2</div>
                </div>
              </Link>
              <button 
                type="button" 
                className="p-2 rounded-lg text-[var(--text-muted)] hover:text-[var(--brand-primary)] hover:bg-[var(--glass-highlight)] transition-colors" 
                onClick={onClose}
              >
                <X size={20} />
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto cyber-scrollbar p-4 flex flex-col gap-6">
              
              {/* Primary Navigation */}
              <div className="space-y-1">
                <div className="text-xs font-mono text-[var(--brand-primary)] mb-2 tracking-widest uppercase opacity-70">Core_Systems</div>
                <NavLink to="/" onClick={onClose} className={({isActive}) => `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${isActive ? 'bg-[var(--brand-primary)]/10 text-[var(--brand-primary)] shadow-[inset_2px_0_0_var(--brand-primary)]' : 'text-[var(--text-muted)] hover:text-[var(--text-main)] hover:bg-[var(--glass-highlight)]'}`}><Home size={18} /> Dashboard</NavLink>
                <NavLink to="/issues" onClick={onClose} className={({isActive}) => `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${isActive ? 'bg-[var(--brand-primary)]/10 text-[var(--brand-primary)] shadow-[inset_2px_0_0_var(--brand-primary)]' : 'text-[var(--text-muted)] hover:text-[var(--text-main)] hover:bg-[var(--glass-highlight)]'}`}><CircleDot size={18} /> Issues</NavLink>
                <NavLink to="/pulls" onClick={onClose} className={({isActive}) => `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${isActive ? 'bg-[var(--brand-primary)]/10 text-[var(--brand-primary)] shadow-[inset_2px_0_0_var(--brand-primary)]' : 'text-[var(--text-muted)] hover:text-[var(--text-main)] hover:bg-[var(--glass-highlight)]'}`}><GitPullRequest size={18} /> Pull Requests</NavLink>
                <NavLink to="/explore" onClick={onClose} className={({isActive}) => `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${isActive ? 'bg-[var(--brand-primary)]/10 text-[var(--brand-primary)] shadow-[inset_2px_0_0_var(--brand-primary)]' : 'text-[var(--text-muted)] hover:text-[var(--text-main)] hover:bg-[var(--glass-highlight)]'}`}><Book size={18} /> Repositories</NavLink>
                <NavLink to="/organizations" onClick={onClose} className={({isActive}) => `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${isActive ? 'bg-[var(--brand-primary)]/10 text-[var(--brand-primary)] shadow-[inset_2px_0_0_var(--brand-primary)]' : 'text-[var(--text-muted)] hover:text-[var(--text-main)] hover:bg-[var(--glass-highlight)]'}`}><Layout size={18} /> Projects</NavLink>
                {(user?.role === 'admin' || user?.role === 'reviewer') && (
                  <NavLink to="/reviewer" onClick={onClose} className={({isActive}) => `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${isActive ? 'bg-[var(--brand-purple)]/10 text-[var(--brand-purple)] shadow-[inset_2px_0_0_var(--brand-purple)]' : 'text-[var(--brand-purple)] opacity-80 hover:opacity-100 hover:bg-[var(--glass-highlight)]'}`}><Cpu size={18} /> Reviewer Terminal</NavLink>
                )}
              </div>

              {/* Repositories */}
              <div>
                <div className="flex items-center justify-between text-xs font-mono text-[var(--brand-primary)] mb-2 tracking-widest uppercase opacity-70">
                  <span>Recent_Nodes</span>
                  <button onClick={() => { onClose(); onOpenPalette(); }} className="hover:text-[var(--text-main)] transition-colors"><Search size={14}/></button>
                </div>
                <div className="space-y-1">
                  {topRepos.map((repo, idx) => (
                    <Link key={repo._id || repo.id} to={`/${user.username}/${repo.slug || repo.name}`} onClick={onClose} className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-[var(--glass-highlight)] group transition-colors">
                      <div className="w-5 h-5 rounded bg-[var(--bg-tertiary)] border border-[var(--glass-border)] flex items-center justify-center text-[var(--text-muted)] group-hover:text-[var(--brand-primary)] group-hover:border-[var(--brand-primary)] transition-colors">
                        <Book size={12} />
                      </div>
                      <span className="text-sm font-medium text-[var(--text-muted)] group-hover:text-[var(--text-main)] truncate">
                        {user.username}/<span className="text-[var(--text-main)]">{repo.name}</span>
                      </span>
                    </Link>
                  ))}
                  {topRepos.length === 0 && (
                    <div className="px-3 py-2 text-sm text-[var(--text-muted)] italic border border-dashed border-[var(--glass-border)] rounded-lg">No connected nodes.</div>
                  )}
                </div>
                {userRepos && userRepos.length > 5 && (
                  <Link to="/explore" onClick={onClose} className="mt-3 text-xs font-mono text-[var(--brand-primary)] hover:text-white px-3 flex items-center gap-1 transition-colors">
                    VIEW_ALL_NODES <ChevronRight size={14} />
                  </Link>
                )}
              </div>
            </div>
            
            {/* Footer */}
            <div className="p-4 border-t border-[var(--glass-border)]">
              <div className="flex items-center gap-3 px-3 py-2 rounded-lg bg-[var(--bg-tertiary)] border border-[var(--glass-border)]">
                <div className="w-2 h-2 rounded-full bg-[var(--brand-success)] animate-pulse shadow-[0_0_5px_var(--brand-success)]"></div>
                <span className="text-xs font-mono text-[var(--text-muted)]">SYSTEM_ONLINE</span>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

/* ──────────────── AppLayout ──────────────── */
const AppLayout = () => {
  const { user, logout } = useAuth();
  const { theme, toggleTheme, performanceMode, togglePerformanceMode } = useTheme();
  const location = useLocation();
  const [paletteOpen, setPaletteOpen] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const profileRef = useRef(null);

  const pageTitle = pageTitles[location.pathname] ||
    (location.pathname.split('/').filter(Boolean).length >= 2 ? 'Repository' : 'Dashboard');

  useEffect(() => {
    const openPalette = () => setPaletteOpen(true);
    window.addEventListener('buildboard:open-command-palette', openPalette);
    return () => window.removeEventListener('buildboard:open-command-palette', openPalette);
  }, []);

  // Handle outside click for profile dropdown
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (profileRef.current && !profileRef.current.contains(event.target)) {
        setProfileOpen(false);
      }
    };
    if (profileOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [profileOpen]);

  // Notification badge
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
    <div className="min-h-screen bg-[var(--bg-main)] text-[var(--text-main)] selection:bg-[var(--brand-primary)] selection:text-[#0a0a0f] flex flex-col">
      {/* Top Navbar */}
      <header className="sticky top-0 z-40 h-16 border-b border-[var(--glass-border)] bg-[var(--bg-main)]/80 backdrop-blur-xl">
        <div className="absolute bottom-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-[var(--brand-primary)] to-transparent opacity-20" />
        
        <div className="flex h-full items-center justify-between px-4 lg:px-6">
          
          <div className="flex items-center gap-4">
            <button 
              type="button" 
              className="p-2 rounded-lg text-[var(--text-muted)] hover:text-[var(--brand-primary)] hover:bg-[var(--brand-primary)]/10 transition-colors" 
              onClick={() => setSidebarOpen(true)}
            >
              <Menu size={20} />
            </button>

            <Link to="/" className="hidden lg:flex items-center gap-2 group">
              <div className="grid h-8 w-8 place-items-center rounded bg-gradient-to-br from-[var(--brand-primary)] to-[var(--brand-purple)] text-[#0a0a0f] font-display font-bold shadow-[0_0_10px_rgba(0,212,255,0.4)] group-hover:shadow-[0_0_20px_rgba(0,212,255,0.6)] transition-all">
                BB
              </div>
              <span className="font-display font-bold tracking-wide hidden xl:block">
                BUILDBOARD<span className="text-[var(--brand-primary)]">+</span>
              </span>
            </Link>
            
            <div className="h-5 w-px bg-[var(--glass-border)] hidden lg:block mx-2" />
            
            <h1 className="text-sm font-semibold text-[var(--text-main)] truncate max-w-[200px]">
              {pageTitle}
            </h1>
          </div>

          {/* Center Search (Large Screens) */}
          <div className="hidden md:flex flex-1 max-w-xl mx-4">
            <button 
              type="button" 
              className="w-full flex items-center justify-between gap-2 px-4 py-2 bg-[var(--bg-tertiary)] border border-[var(--glass-border)] hover:border-[var(--brand-primary)]/50 hover:shadow-[0_0_15px_rgba(0,212,255,0.1)] rounded-full text-sm text-[var(--text-muted)] transition-all group"
              onClick={() => setPaletteOpen(true)}
            >
              <div className="flex items-center gap-2">
                <Search size={16} className="group-hover:text-[var(--brand-primary)] transition-colors" />
                <span>Search nexus...</span>
              </div>
              <div className="flex items-center gap-1">
                <kbd className="hidden lg:inline-block px-1.5 py-0.5 text-[10px] font-mono bg-[var(--bg-main)] border border-[var(--glass-border)] rounded text-[var(--text-muted)]">CTRL</kbd>
                <kbd className="hidden lg:inline-block px-1.5 py-0.5 text-[10px] font-mono bg-[var(--bg-main)] border border-[var(--glass-border)] rounded text-[var(--text-muted)]">K</kbd>
              </div>
            </button>
          </div>

          <div className="flex items-center gap-1 sm:gap-2">
            <HeaderButton label="Search" className="md:hidden" onClick={() => setPaletteOpen(true)}>
              <Search size={20} />
            </HeaderButton>
            
            <HeaderButton label="New Node" className="hidden sm:flex" as={Link} to="/new">
              <Plus size={20} />
            </HeaderButton>

            <HeaderButton label="Issues" className="hidden lg:flex" as={Link} to="/issues">
              <CircleDot size={20} />
            </HeaderButton>

            <HeaderButton label="Pull Requests" className="hidden lg:flex" as={Link} to="/pulls">
              <GitPullRequest size={20} />
            </HeaderButton>

            <HeaderButton label="Inbox" badge={hasUnread} as={Link} to="/notifications">
              <Inbox size={20} />
            </HeaderButton>

            <div className="h-5 w-px bg-[var(--glass-border)] hidden sm:block mx-1" />

            <div className="relative" ref={profileRef}>
              <button
                className="ml-1 relative h-8 w-8 rounded-full overflow-hidden border border-[var(--glass-border)] hover:border-[var(--brand-primary)] hover:shadow-[0_0_10px_rgba(0,212,255,0.3)] transition-all outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand-primary)]"
                onClick={() => setProfileOpen(!profileOpen)}
              >
                {user?.avatar ? (
                  <img src={user.avatar} alt="Profile" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full bg-[var(--bg-tertiary)] flex items-center justify-center text-xs font-bold text-[var(--brand-primary)]">
                    {(user?.username || 'U').charAt(0).toUpperCase()}
                  </div>
                )}
              </button>

              <AnimatePresence>
                {profileOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 10, scale: 0.95 }}
                    transition={{ duration: 0.15 }}
                    className="absolute right-0 top-full mt-3 w-56 glass-panel border-t-[var(--brand-primary)] origin-top-right overflow-hidden shadow-2xl"
                  >
                    <div className="p-3 border-b border-[var(--glass-border)] bg-[var(--glass-highlight)]">
                      <div className="font-semibold text-sm truncate">{user?.name || user?.username}</div>
                      <div className="text-xs text-[var(--text-muted)] truncate">@{user?.username}</div>
                    </div>
                    
                    <div className="p-1">
                      <Link to="/profile" onClick={() => setProfileOpen(false)} className="flex items-center gap-2 px-3 py-2 text-sm rounded hover:bg-[var(--glass-highlight)] hover:text-[var(--brand-primary)] transition-colors">
                        <User size={16} /> Profile
                      </Link>
                      <Link to="/explore" onClick={() => setProfileOpen(false)} className="flex items-center gap-2 px-3 py-2 text-sm rounded hover:bg-[var(--glass-highlight)] hover:text-[var(--brand-primary)] transition-colors">
                        <Book size={16} /> Repositories
                      </Link>
                      <Link to="/organizations" onClick={() => setProfileOpen(false)} className="flex items-center gap-2 px-3 py-2 text-sm rounded hover:bg-[var(--glass-highlight)] hover:text-[var(--brand-primary)] transition-colors">
                        <Layout size={16} /> Organizations
                      </Link>
                    </div>

                    <div className="p-1 border-t border-[var(--glass-border)]">
                      <button onClick={toggleTheme} className="w-full flex items-center justify-between px-3 py-2 text-sm rounded hover:bg-[var(--glass-highlight)] transition-colors">
                        <span className="flex items-center gap-2">
                          {theme === 'dark' ? <Moon size={16} /> : <Sun size={16} />}
                          Theme
                        </span>
                        <span className="text-xs font-mono text-[var(--text-muted)] uppercase">{theme}</span>
                      </button>
                      <button onClick={togglePerformanceMode} className="w-full flex items-center justify-between px-3 py-2 text-sm rounded hover:bg-[var(--glass-highlight)] transition-colors">
                        <span className="flex items-center gap-2">
                          <Zap size={16} className={performanceMode ? 'text-[var(--brand-primary)]' : ''} />
                          Performance
                        </span>
                        <span className={twMerge("text-[10px] px-1.5 py-0.5 rounded font-mono uppercase border", performanceMode ? "bg-[var(--brand-primary)]/10 text-[var(--brand-primary)] border-[var(--brand-primary)]/30" : "bg-[var(--bg-tertiary)] text-[var(--text-muted)] border-[var(--glass-border)]")}>
                          {performanceMode ? 'MAX' : 'ECO'}
                        </span>
                      </button>
                      <Link to="/settings" onClick={() => setProfileOpen(false)} className="flex items-center gap-2 px-3 py-2 text-sm rounded hover:bg-[var(--glass-highlight)] transition-colors">
                        <Settings size={16} /> Settings
                      </Link>
                    </div>

                    <div className="p-1 border-t border-[var(--glass-border)]">
                      <button onClick={() => { setProfileOpen(false); logout(); }} className="w-full flex items-center gap-2 px-3 py-2 text-sm rounded hover:bg-[var(--brand-danger)]/10 text-[var(--brand-danger)] transition-colors">
                        <LogOut size={16} /> Sign out
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
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

      {/* Main Content Area */}
      <main className="flex-1 relative">
        <AnimatePresence mode="wait">
          <motion.div
            key={location.pathname}
            variants={pageTransition}
            initial="hidden"
            animate="visible"
            exit="exit"
            className="h-full"
          >
            <Outlet />
          </motion.div>
        </AnimatePresence>
      </main>

      <CommandPalette open={paletteOpen} onClose={() => setPaletteOpen(false)} />
    </div>
  );
};

export default AppLayout;

