import React, { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../lib/api';

const NewRepository = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({
    name: '',
    description: '',
    visibility: 'public',
    topics: '',
    readme: '',
    isTemplate: false,
  });

  const mutation = useMutation({
    mutationFn: async () => {
      const payload = {
        ...form,
        topics: form.topics.split(',').map((topic) => topic.trim()).filter(Boolean),
      };
      const { data } = await api.post('/repos', payload);
      return data;
    },
    onSuccess: (repo) => navigate(`/${repo.owner.username}/${repo.slug}`),
  });

  const update = (key, value) => setForm((current) => ({ ...current, [key]: value }));

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div className="border-b border-[var(--border-main)] pb-4">
        <h1 className="text-2xl font-semibold">Create a new repository</h1>
        <p className="mt-1 text-sm text-[var(--text-muted)]">Repositories include code, issues, pull requests, actions, wiki, discussions, releases, packages, and security insights.</p>
      </div>

      <form
        className="panel p-5"
        onSubmit={(event) => {
          event.preventDefault();
          mutation.mutate();
        }}
      >
        <div className="grid gap-5">
          <div>
            <label className="mb-1 block text-sm font-medium">Owner</label>
            <div className="rounded-md border border-[var(--border-main)] bg-[var(--bg-subtle)] px-3 py-2 text-sm">{user?.username || 'current-user'}</div>
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium">Repository name</label>
            <input className="input-field" value={form.name} onChange={(event) => update('name', event.target.value)} required />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium">Description</label>
            <textarea className="input-field min-h-24" value={form.description} onChange={(event) => update('description', event.target.value)} />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium">Visibility</label>
            <div className="grid gap-3 sm:grid-cols-3">
              {['public', 'private', 'internal'].map((visibility) => (
                <label key={visibility} className={`rounded-md border p-3 text-sm ${form.visibility === visibility ? 'border-[var(--brand-primary)] bg-[var(--bg-subtle)]' : 'border-[var(--border-main)]'}`}>
                  <input type="radio" className="mr-2" name="visibility" checked={form.visibility === visibility} onChange={() => update('visibility', visibility)} />
                  <span className="font-medium capitalize">{visibility}</span>
                  <span className="mt-1 block text-xs text-[var(--text-muted)]">
                    {visibility === 'public' ? 'Visible to everyone.' : visibility === 'private' ? 'Only invited members.' : 'Visible inside your organization.'}
                  </span>
                </label>
              ))}
            </div>
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium">Topics</label>
            <input className="input-field" placeholder="react, api, mca-project" value={form.topics} onChange={(event) => update('topics', event.target.value)} />
          </div>

          <label className="flex items-start gap-3 rounded-md border border-[var(--border-main)] p-3 text-sm">
            <input type="checkbox" checked={form.isTemplate} onChange={(event) => update('isTemplate', event.target.checked)} />
            <span>
              <span className="block font-medium">Mark as repository template</span>
              <span className="block text-xs text-[var(--text-muted)]">Other teams can create starter repositories from this structure.</span>
            </span>
          </label>

          <div>
            <label className="mb-1 block text-sm font-medium">README</label>
            <textarea className="input-field min-h-36 font-mono" placeholder={`# ${form.name || 'Repository'}\n\nProject overview...`} value={form.readme} onChange={(event) => update('readme', event.target.value)} />
          </div>

          {mutation.error && <div className="rounded-md border border-[var(--brand-danger)] bg-[var(--brand-danger)]/10 p-3 text-sm text-[var(--brand-danger)]">{mutation.error.response?.data?.message || 'Could not create repository'}</div>}

          <div className="flex justify-end gap-2 border-t border-[var(--border-main)] pt-4">
            <button type="button" className="btn-secondary" onClick={() => navigate('/')}>Cancel</button>
            <button type="submit" className="btn-primary" disabled={mutation.isPending}>{mutation.isPending ? 'Creating...' : 'Create repository'}</button>
          </div>
        </div>
      </form>
    </div>
  );
};

export default NewRepository;
