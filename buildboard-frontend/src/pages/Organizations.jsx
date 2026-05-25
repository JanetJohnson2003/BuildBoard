import React, { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import api from '../lib/api';

const Organizations = () => {
  const queryClient = useQueryClient();
  const [form, setForm] = useState({ name: '', description: '', visibility: 'public' });
  const { data: organizations = [], isLoading } = useQuery({
    queryKey: ['organizations'],
    queryFn: async () => (await api.get('/platform/organizations')).data,
  });
  const createOrg = useMutation({
    mutationFn: async () => (await api.post('/platform/organizations', form)).data,
    onSuccess: () => {
      setForm({ name: '', description: '', visibility: 'public' });
      queryClient.invalidateQueries({ queryKey: ['organizations'] });
    },
  });

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
      <section className="space-y-4">
        <div className="border-b border-[var(--border-main)] pb-4">
          <h1 className="text-2xl font-semibold">Organizations</h1>
          <p className="mt-1 text-sm text-[var(--text-muted)]">Manage teams, roles, repository permissions, dashboards, and enterprise controls.</p>
        </div>
        <div className="panel divide-y divide-[var(--border-main)]">
          {isLoading ? <div className="p-6 text-sm text-[var(--text-muted)]">Loading organizations...</div> : organizations.map((org) => (
            <div key={org._id} className="p-4">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <div className="font-semibold">{org.name}</div>
                  <div className="mt-1 text-sm text-[var(--text-muted)]">{org.description || org.slug}</div>
                </div>
                <span className="rounded-full border border-[var(--border-main)] px-2 py-0.5 text-xs">{org.visibility}</span>
              </div>
            </div>
          ))}
          {!isLoading && !organizations.length && <div className="p-8 text-center text-sm text-[var(--text-muted)]">No organizations yet.</div>}
        </div>
      </section>

      <aside className="panel h-fit p-4">
        <h2 className="mb-3 font-semibold">Create organization</h2>
        <form className="space-y-3" onSubmit={(event) => { event.preventDefault(); createOrg.mutate(); }}>
          <input className="input-field" placeholder="Organization name" value={form.name} onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))} required />
          <textarea className="input-field min-h-24" placeholder="Description" value={form.description} onChange={(event) => setForm((current) => ({ ...current, description: event.target.value }))} />
          <select className="input-field" value={form.visibility} onChange={(event) => setForm((current) => ({ ...current, visibility: event.target.value }))}>
            <option value="public">Public</option>
            <option value="private">Private</option>
          </select>
          <button className="btn-primary w-full" disabled={createOrg.isPending}>{createOrg.isPending ? 'Creating...' : 'Create organization'}</button>
        </form>
      </aside>
    </div>
  );
};

export default Organizations;
