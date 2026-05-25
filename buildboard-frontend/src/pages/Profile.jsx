import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../context/AuthContext';
import api from '../lib/api';

const Icon = ({ children, size = 18 }) => (
  <svg viewBox="0 0 24 24" width={size} height={size} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    {children}
  </svg>
);
const EditIcon = () => <Icon size={14}><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" /><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4Z" /></Icon>;
const LocationIcon = () => <Icon size={14}><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7Z" /><circle cx="12" cy="9" r="2.5" /></Icon>;
const LinkIcon2 = () => <Icon size={14}><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" /><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" /></Icon>;
const StarIcon = () => <Icon size={14}><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" /></Icon>;
const ForkIcon = () => <Icon size={14}><circle cx="6" cy="6" r="2" /><circle cx="18" cy="6" r="2" /><circle cx="12" cy="18" r="2" /><path d="M6 8v2a2 2 0 0 0 2 2h4a2 2 0 0 0 2-2V8" /><path d="M12 12v4" /></Icon>;
const RepoIcon = () => <Icon size={14}><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" /><path d="M4 4.5A2.5 2.5 0 0 1 6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15Z" /></Icon>;
const CalendarIcon = () => <Icon size={14}><rect x="3" y="4" width="18" height="18" rx="2" ry="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" /></Icon>;

const ContributionGraph = ({ days = [] }) => {
  const dayMap = new Map(days.map((d) => [d.date, d.count]));
  const cells = Array.from({ length: 364 }, (_, i) => {
    const date = new Date();
    date.setDate(date.getDate() - (363 - i));
    const key = date.toISOString().slice(0, 10);
    const count = dayMap.get(key) || 0;
    const level = count > 8 ? 4 : count > 4 ? 3 : count > 1 ? 2 : count > 0 ? 1 : 0;
    return { key, count, level };
  });
  return (
    <div className="grid gap-1" style={{ gridTemplateColumns: 'repeat(52, minmax(0, 1fr))' }} aria-label="Contribution calendar">
      {cells.map((cell) => (
        <div key={cell.key} title={`${cell.key}: ${cell.count} contributions`}
          className={`h-3 rounded-sm border border-[var(--border-subtle)] contribution-${cell.level}`}
        />
      ))}
    </div>
  );
};

const Profile = () => {
  const { user, setUser } = useAuth();
  const queryClient = useQueryClient();
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({ name: '', bio: '', location: '', website: '', avatar: '' });

  const { data: profile } = useQuery({
    queryKey: ['my-profile'],
    queryFn: async () => {
      const { data } = await api.get('/auth/me');
      return data;
    },
  });

  const { data: repos = [] } = useQuery({
    queryKey: ['my-repos'],
    queryFn: async () => {
      const { data } = await api.get('/repos');
      return data;
    },
  });

  const { data: dashboard } = useQuery({
    queryKey: ['platform-dashboard'],
    queryFn: async () => {
      const { data } = await api.get('/platform/dashboard');
      return data;
    },
  });

  const updateProfile = useMutation({
    mutationFn: async (payload) => {
      const { data } = await api.put('/users/profile', payload);
      return data;
    },
    onSuccess: (data) => {
      setUser((prev) => ({ ...prev, ...data }));
      queryClient.invalidateQueries({ queryKey: ['my-profile'] });
      setEditing(false);
    },
  });

  const displayUser = profile || user;

  const startEdit = () => {
    setForm({
      name: displayUser?.name || '',
      bio: displayUser?.bio || '',
      location: displayUser?.location || '',
      website: displayUser?.website || '',
      avatar: displayUser?.avatar || '',
    });
    setEditing(true);
  };

  const handleAvatarChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setForm((prev) => ({ ...prev, avatar: reader.result }));
      };
      reader.readAsDataURL(file);
    }
  };

  const joinDate = displayUser?.createdAt
    ? new Date(displayUser.createdAt).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
    : null;

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-3 border-b border-[var(--border-main)] pb-4 md:flex-row md:items-end">
        <div>
          <h1 className="text-2xl font-semibold">Profile</h1>
          <p className="mt-1 text-sm text-[var(--text-muted)]">Your public BuildBoard+ profile</p>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[280px_minmax(0,1fr)]">
        {/* Left — avatar + bio */}
        <aside className="space-y-4">
          <div className="flex flex-col items-center gap-3 text-center lg:items-start lg:text-left">
            <div className="relative h-24 w-24 overflow-hidden rounded-full border-2 border-[var(--border-main)] bg-[var(--bg-subtle)] group">
              {(editing ? form.avatar : displayUser?.avatar)
                ? <img src={editing ? form.avatar : displayUser.avatar} alt="" className="h-full w-full object-cover" />
                : <span className="flex h-full w-full items-center justify-center text-3xl font-bold text-[var(--text-muted)]">{(displayUser?.username || 'B').slice(0, 1).toUpperCase()}</span>
              }
              {editing && (
                <label className="absolute inset-0 bg-black/50 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 cursor-pointer transition-opacity text-xs font-medium">
                  Change
                  <input type="file" accept="image/*" className="hidden" onChange={handleAvatarChange} />
                </label>
              )}
            </div>
            <div>
              <div className="text-xl font-semibold">{displayUser?.name || displayUser?.username}</div>
              <div className="text-sm text-[var(--text-muted)]">@{displayUser?.username}</div>
            </div>
          </div>

          {editing ? (
            <div className="space-y-3 rounded-lg border border-[var(--border-main)] p-4">
              <div>
                <label className="mb-1 block text-xs font-medium text-[var(--text-muted)]">Name</label>
                <input className="input-field w-full" value={form.name} onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))} />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-[var(--text-muted)]">Bio</label>
                <textarea className="input-field w-full resize-none" rows={3} value={form.bio} onChange={(e) => setForm((p) => ({ ...p, bio: e.target.value }))} />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-[var(--text-muted)]">Location</label>
                <input className="input-field w-full" value={form.location} onChange={(e) => setForm((p) => ({ ...p, location: e.target.value }))} />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-[var(--text-muted)]">Website</label>
                <input className="input-field w-full" type="url" value={form.website} onChange={(e) => setForm((p) => ({ ...p, website: e.target.value }))} />
              </div>
              <div className="flex gap-2">
                <button className="btn-primary flex-1 text-sm" onClick={() => updateProfile.mutate(form)} disabled={updateProfile.isPending}>
                  {updateProfile.isPending ? 'Saving…' : 'Save'}
                </button>
                <button className="btn-secondary flex-1 text-sm" onClick={() => setEditing(false)}>Cancel</button>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              {displayUser?.bio && <p className="text-sm">{displayUser.bio}</p>}
              <button className="btn-secondary w-full gap-1.5 text-sm" onClick={startEdit}>
                <EditIcon /> Edit profile
              </button>
              <div className="space-y-1.5 text-sm text-[var(--text-muted)]">
                {displayUser?.location && (
                  <div className="flex items-center gap-1.5"><LocationIcon />{displayUser.location}</div>
                )}
                {displayUser?.website && (
                  <div className="flex items-center gap-1.5"><LinkIcon2 />
                    <a href={displayUser.website} target="_blank" rel="noopener noreferrer" className="text-[var(--brand-primary)] hover:underline">{displayUser.website}</a>
                  </div>
                )}
                {joinDate && (
                  <div className="flex items-center gap-1.5"><CalendarIcon />Joined {joinDate}</div>
                )}
              </div>
            </div>
          )}

          {/* Stats */}
          <div className="grid grid-cols-2 gap-2">
            {[
              { label: 'Repositories', value: dashboard?.counts?.repositories ?? repos.length },
              { label: 'Issues', value: dashboard?.counts?.issues ?? 0 },
              { label: 'Pull Requests', value: dashboard?.counts?.pullRequests ?? 0 },
              { label: 'Stars', value: dashboard?.counts?.stars ?? 0 },
            ].map((stat) => (
              <div key={stat.label} className="panel p-3 text-center">
                <div className="text-lg font-semibold">{stat.value ?? 0}</div>
                <div className="text-xs text-[var(--text-muted)]">{stat.label}</div>
              </div>
            ))}
          </div>
        </aside>

        {/* Right — activity + repos */}
        <div className="space-y-6">
          {/* Contribution graph */}
          <div className="panel p-4">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-sm font-semibold">Contribution Activity</h2>
              <span className="text-xs text-[var(--text-muted)]">Last 52 weeks</span>
            </div>
            <div className="overflow-x-auto">
              <ContributionGraph days={dashboard?.contributionGraph || []} />
            </div>
          </div>

          {/* Repositories */}
          <div>
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-sm font-semibold">Repositories</h2>
              <Link to="/new" className="btn-primary text-xs">New</Link>
            </div>
            {repos.length === 0 ? (
              <div className="rounded-md border border-dashed border-[var(--border-main)] px-4 py-8 text-center">
                <div className="text-sm font-medium">No repositories yet</div>
                <Link to="/new" className="mt-2 inline-block text-sm text-[var(--brand-primary)] hover:underline">Create your first repository</Link>
              </div>
            ) : (
              <div className="space-y-3">
                {repos.slice(0, 10).map((repo) => (
                  <div key={repo._id} className="panel p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <Link to={`/${displayUser?.username}/${repo.slug}`} className="flex items-center gap-1.5 text-sm font-semibold text-[var(--brand-primary)] hover:underline">
                          <RepoIcon />{repo.slug}
                        </Link>
                        {repo.description && <p className="mt-1 text-xs text-[var(--text-muted)]">{repo.description}</p>}
                      </div>
                      <span className="shrink-0 rounded-full border border-[var(--border-main)] px-2 py-0.5 text-xs">{repo.visibility || 'public'}</span>
                    </div>
                    <div className="mt-2 flex gap-4 text-xs text-[var(--text-muted)]">
                      {repo.language && <span>{repo.language}</span>}
                      <span className="flex items-center gap-1"><StarIcon />{repo.stars || 0}</span>
                      <span className="flex items-center gap-1"><ForkIcon />{repo.forks || 0}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;
