import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import api from '../../lib/api';

const newRepoSchema = z.object({
  name: z.string().min(1, 'Repository name is required').regex(/^[a-zA-Z0-9-_]+$/, 'Name can only contain alphanumeric characters, hyphens, and underscores'),
  description: z.string().optional(),
  visibility: z.enum(['public', 'private']),
  initReadme: z.boolean().default(true),
});

const NewRepo = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [errorMsg, setErrorMsg] = useState('');

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(newRepoSchema),
    defaultValues: {
      visibility: 'public',
      initReadme: true,
    }
  });

  const onSubmit = async (data) => {
    try {
      setErrorMsg('');
      const response = await api.post('/repos', {
        name: data.name,
        description: data.description,
        visibility: data.visibility,
        readme: data.initReadme ? `# ${data.name}\n\nA new BuildBoard+ repository.` : '',
      });
      navigate(`/${user.username}/${response.data.repository.name}`);
    } catch (err) {
      setErrorMsg(err.response?.data?.message || 'Failed to create repository.');
    }
  };

  return (
    <div className="max-w-3xl mx-auto py-8 px-4">
      <div className="border-b border-[var(--border-main)] pb-4 mb-6">
        <h1 className="text-2xl font-semibold">Create a new repository</h1>
        <p className="text-[var(--text-muted)] text-sm mt-1">A repository contains all project files, including the revision history.</p>
      </div>

      {errorMsg && (
        <div className="mb-4 bg-[var(--brand-danger)]/10 border border-[var(--brand-danger)]/20 text-[var(--brand-danger)] px-4 py-3 rounded relative" role="alert">
          <span className="block sm:inline text-sm">{errorMsg}</span>
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <div>
          <label className="block font-semibold mb-2 text-sm">Repository name *</label>
          <div className="flex items-center gap-2">
            <span className="text-lg font-medium">{user?.username}</span>
            <span className="text-lg text-[var(--text-muted)]">/</span>
            <input
              type="text"
              {...register('name')}
              className={`input-field max-w-sm ${errors.name ? 'border-[var(--brand-danger)] focus:ring-[var(--brand-danger)]' : ''}`}
            />
          </div>
          {errors.name && <p className="mt-1 text-sm text-[var(--brand-danger)]">{errors.name.message}</p>}
          <p className="text-xs text-[var(--text-muted)] mt-2">
            Great repository names are short and memorable.
          </p>
        </div>

        <div>
          <label className="block font-semibold mb-2 text-sm">Description <span className="text-[var(--text-muted)] font-normal">(optional)</span></label>
          <input
            type="text"
            {...register('description')}
            className="input-field max-w-2xl"
          />
        </div>

        <div className="border-t border-[var(--border-main)] pt-6">
          <label className="block font-semibold mb-3 text-sm">Visibility</label>
          <div className="space-y-3">
            <label className="flex items-start gap-3 cursor-pointer">
              <input type="radio" value="public" {...register('visibility')} className="mt-1" />
              <div>
                <div className="flex items-center gap-2">
                  <svg className="text-[var(--text-muted)]" xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20"></path></svg>
                  <span className="font-semibold text-sm">Public</span>
                </div>
                <p className="text-xs text-[var(--text-muted)] mt-0.5">Anyone on the internet can see this repository. You choose who can commit.</p>
              </div>
            </label>
            <label className="flex items-start gap-3 cursor-pointer">
              <input type="radio" value="private" {...register('visibility')} className="mt-1" />
              <div>
                <div className="flex items-center gap-2">
                  <svg className="text-[var(--text-muted)]" xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg>
                  <span className="font-semibold text-sm">Private</span>
                </div>
                <p className="text-xs text-[var(--text-muted)] mt-0.5">You choose who can see and commit to this repository.</p>
              </div>
            </label>
          </div>
        </div>

        <div className="border-t border-[var(--border-main)] pt-6">
          <label className="block font-semibold mb-3 text-sm">Initialize this repository with:</label>
          <label className="flex items-start gap-3 cursor-pointer">
            <input type="checkbox" {...register('initReadme')} className="mt-1" />
            <div>
              <span className="font-semibold text-sm">Add a README file</span>
              <p className="text-xs text-[var(--text-muted)] mt-0.5">This is where you can write a long description for your project.</p>
            </div>
          </label>
        </div>

        <div className="border-t border-[var(--border-main)] pt-6 flex justify-end">
          <button
            type="submit"
            disabled={isSubmitting}
            className="btn-primary py-2 px-6 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? 'Creating...' : 'Create repository'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default NewRepo;
