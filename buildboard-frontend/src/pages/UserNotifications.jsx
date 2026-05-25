import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../lib/api';

const Icon = ({ children, size = 16 }) => (
  <svg viewBox="0 0 24 24" width={size} height={size} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{children}</svg>
);
const BellIcon = () => <Icon size={20}><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" /><path d="M13.73 21a2 2 0 0 1-3.46 0" /></Icon>;
const CheckIcon = () => <Icon size={14}><path d="m5 12 5 5L20 7" /></Icon>;
const IssueIcon = () => <Icon size={14}><circle cx="12" cy="12" r="8" /><circle cx="12" cy="12" r="2" /></Icon>;
const PRIcon = () => <Icon size={14}><circle cx="6" cy="6" r="2" /><circle cx="18" cy="18" r="2" /><path d="M6 8v8a2 2 0 0 0 2 2h6" /></Icon>;

const typeIcon = { issue: <IssueIcon />, pull_request: <PRIcon />, mention: <BellIcon /> };

const UserNotifications = () => {
  const queryClient = useQueryClient();
  const [filter, setFilter] = useState('unread');

  const { data: notifications = [], isLoading } = useQuery({
    queryKey: ['notifications', filter],
    queryFn: async () => {
      const { data } = await api.get('/notifications', { params: filter === 'unread' ? { unread: true } : {} });
      return Array.isArray(data) ? data : (data.notifications || []);
    },
  });

  const markRead = useMutation({
    mutationFn: async (id) => api.put(`/notifications/${id}/read`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['notifications'] }),
  });

  const markAllRead = useMutation({
    mutationFn: async () => api.put('/notifications/read-all'),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['notifications'] }),
  });

  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-3 border-b border-[var(--border-main)] pb-4 md:flex-row md:items-end">
        <div>
          <h1 className="text-2xl font-semibold">Notifications</h1>
          <p className="mt-1 text-sm text-[var(--text-muted)]">
            {unreadCount > 0 ? `${unreadCount} unread notification${unreadCount !== 1 ? 's' : ''}` : 'You\'re all caught up'}
          </p>
        </div>
        {unreadCount > 0 && (
          <button className="btn-secondary self-start gap-1.5 text-sm md:self-auto" onClick={() => markAllRead.mutate()} disabled={markAllRead.isPending}>
            <CheckIcon /> Mark all as read
          </button>
        )}
      </div>

      <div className="flex gap-1 rounded-md border border-[var(--border-main)] p-1 w-fit">
        {['unread', 'all'].map((s) => (
          <button
            key={s}
            type="button"
            className={`rounded px-3 py-1 text-sm capitalize ${filter === s ? 'bg-[var(--bg-main)] font-semibold shadow-sm' : 'text-[var(--text-muted)] hover:text-[var(--text-main)]'}`}
            onClick={() => setFilter(s)}
          >{s}</button>
        ))}
      </div>

      {isLoading ? (
        <div className="space-y-2">
          {[1,2,3,4].map((i) => <div key={i} className="h-14 animate-pulse rounded-md bg-[var(--bg-subtle)]" />)}
        </div>
      ) : notifications.length === 0 ? (
        <div className="rounded-md border border-dashed border-[var(--border-main)] px-4 py-12 text-center">
          <div className="mb-3 flex justify-center text-[var(--text-muted)]"><BellIcon /></div>
          <div className="text-sm font-medium">No notifications</div>
          <p className="mt-1 text-xs text-[var(--text-muted)]">
            {filter === 'unread' ? 'You\'re all caught up! Switch to All to see history.' : 'Nothing yet — activity will show up here.'}
          </p>
        </div>
      ) : (
        <div className="panel divide-y divide-[var(--border-main)]">
          {notifications.map((n) => (
            <div key={n._id} className={`flex items-start gap-3 p-4 ${!n.read ? 'bg-[var(--bg-subtle)]' : ''} hover:bg-[var(--bg-subtle)] transition-colors`}>
              {!n.read && <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-[var(--brand-primary)]" />}
              <span className="mt-0.5 shrink-0 text-[var(--text-muted)]">{typeIcon[n.type] || <BellIcon />}</span>
              <div className="min-w-0 flex-1">
                <div className="text-sm">{n.message || n.title || 'New notification'}</div>
                {n.createdAt && (
                  <div className="mt-0.5 text-xs text-[var(--text-muted)]">{new Date(n.createdAt).toLocaleString()}</div>
                )}
              </div>
              {!n.read && (
                <button
                  type="button"
                  className="btn-secondary shrink-0 gap-1 px-2 py-1 text-xs"
                  onClick={() => markRead.mutate(n._id)}
                  title="Mark as read"
                ><CheckIcon /></button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default UserNotifications;
