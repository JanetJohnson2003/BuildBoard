import React, { useMemo, useState, useRef, useEffect } from 'react';
import { Link, useParams, useSearchParams } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import api from '../lib/api';

const tabs = ['Code', 'Issues', 'Pull Requests', 'Actions', 'Projects', 'Wiki', 'Security', 'Insights', 'Releases', 'Packages', 'Discussions', 'AI'];

const normalizeTab = (value) => tabs.find((tab) => tab.toLowerCase().replaceAll(' ', '-') === value) || 'Code';
const tabToParam = (tab) => tab.toLowerCase().replaceAll(' ', '-');

const RepoBadge = ({ children, className = '' }) => (
  <span className={`rounded-full border border-[var(--border-main)] px-2 py-0.5 text-xs text-[var(--text-muted)] ${className}`}>{children}</span>
);

const CreateIssueModal = ({ owner, repo, defaultTitle = '', defaultDescription = '', onClose, onSuccess }) => {
  const [title, setTitle] = useState(defaultTitle);
  const [description, setDescription] = useState(defaultDescription);
  const [assignee, setAssignee] = useState('');
  
  // Fetch users for assignee dropdown
  const { data: users } = useQuery({
    queryKey: ['all-users'],
    queryFn: async () => (await api.get('/admin/users')).data.users || [],
  });

  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: async () => {
      return (await api.post(`/issues/${owner}/${repo}`, {
        title,
        body: description,
        assignees: assignee ? [assignee] : [],
        labels: [] // Labels must be ObjectIds, not strings
      })).data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['repo-issues', owner, repo] });
      onSuccess();
      onClose();
    }
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
      <div className="w-full max-w-lg rounded-lg border border-[var(--border-main)] bg-[var(--bg-main)] shadow-2xl">
        <div className="border-b border-[var(--border-main)] px-6 py-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold">Create New Issue</h2>
          <button onClick={onClose} className="text-[var(--text-muted)] hover:text-[var(--text-main)]">✕</button>
        </div>
        <div className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Title</label>
            <input
              type="text"
              className="w-full rounded-md border border-[var(--border-main)] bg-[var(--bg-subtle)] px-3 py-2 text-sm focus:border-[var(--brand-primary)] focus:outline-none"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Issue title"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Description</label>
            <textarea
              className="w-full min-h-[120px] rounded-md border border-[var(--border-main)] bg-[var(--bg-subtle)] px-3 py-2 text-sm focus:border-[var(--brand-primary)] focus:outline-none"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe the issue..."
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Assign To (Optional)</label>
            <select
              className="w-full rounded-md border border-[var(--border-main)] bg-[var(--bg-subtle)] px-3 py-2 text-sm focus:border-[var(--brand-primary)] focus:outline-none"
              value={assignee}
              onChange={(e) => setAssignee(e.target.value)}
            >
              <option value="">Unassigned</option>
              {users?.map(u => (
                <option key={u._id} value={u._id}>{u.username} ({u.role})</option>
              ))}
            </select>
          </div>
        </div>
        <div className="border-t border-[var(--border-main)] px-6 py-4 flex justify-end gap-3 bg-[var(--bg-subtle)] rounded-b-lg">
          <button onClick={onClose} className="px-4 py-2 text-sm font-medium hover:underline text-[var(--text-muted)]">Cancel</button>
          <button
            onClick={() => mutation.mutate()}
            disabled={!title || mutation.isPending}
            className="rounded-md bg-[var(--brand-success)] px-4 py-2 text-sm font-medium text-white hover:bg-[var(--brand-success)]/90 disabled:opacity-50"
          >
            {mutation.isPending ? 'Submitting...' : 'Submit Issue'}
          </button>
        </div>
      </div>
    </div>
  );
};

const useRepoQuery = () => {
  const { owner, repo } = useParams();
  return {
    owner,
    repo,
    repoQuery: useQuery({
      queryKey: ['repo', owner, repo],
      queryFn: async () => {
        const { data } = await api.get(`/repos/${owner}/${repo}`);
        return data;
      },
    }),
  };
};

const CodePreview = ({ file }) => {
  if (!file) return null;
  const content = file.content || '';
  const lines = content.split('\n');
  const ext = file.name.split('.').pop()?.toLowerCase();

  if (file.mimeType?.startsWith('image/') && file.encoding === 'base64') {
    return <img src={`data:${file.mimeType};base64,${file.content}`} alt={file.name} className="max-h-[520px] rounded-md border border-[var(--border-main)] object-contain" />;
  }

  if (ext === 'pdf') {
    return <div className="p-6 text-sm text-[var(--text-muted)]">PDF preview is available through the file download endpoint.</div>;
  }

  return (
    <div className="overflow-auto rounded-b-md bg-[var(--bg-main)]">
      <table className="w-full border-collapse font-mono text-xs">
        <tbody>
          {lines.map((line, index) => (
            <tr key={`${index}-${line}`}>
              <td className="w-12 select-none border-r border-[var(--border-main)] bg-[var(--bg-subtle)] px-3 py-0.5 text-right text-[var(--text-muted)]">{index + 1}</td>
              <td className="whitespace-pre px-3 py-0.5">{line || ' '}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

const downloadFile = async (owner, repo, filePath) => {
  const response = await api.get(`/repos/${owner}/${repo}/file/download`, {
    params: { path: filePath },
    responseType: 'blob',
  });
  const url = window.URL.createObjectURL(new Blob([response.data]));
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', filePath.split('/').pop());
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(url);
};

const downloadProject = async (owner, repo) => {
  const response = await api.get(`/repos/${owner}/${repo}/download`, {
    responseType: 'blob',
  });
  const url = window.URL.createObjectURL(new Blob([response.data]));
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', `${repo}.zip`);
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(url);
};

const CodeTab = ({ owner, repo, repoData }) => {
  const queryClient = useQueryClient();
  const [path, setPath] = useState('');
  const [selectedFile, setSelectedFile] = useState('');
  const [newFile, setNewFile] = useState({ path: '', content: '', message: 'Add file' });
  const [uploadFiles, setUploadFiles] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [showBranchProtectionBanner, setShowBranchProtectionBanner] = useState(true);
  const [showAddFileDropdown, setShowAddFileDropdown] = useState(false);
  const [showCodeDropdown, setShowCodeDropdown] = useState(false);
  const [showBranchDropdown, setShowBranchDropdown] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isDragging, setIsDragging] = useState(false);
  const [isUploadMode, setIsUploadMode] = useState(false);
  const [isCreatingFile, setIsCreatingFile] = useState(false);
  const [commitMessage, setCommitMessage] = useState('Add files via upload');
  const [extendedDescription, setExtendedDescription] = useState('');
  
  // Issue Modal State
  const [issueModalOpen, setIssueModalOpen] = useState(false);

  const branchRef = useRef(null);
  const addFileRef = useRef(null);
  const codeRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (branchRef.current && !branchRef.current.contains(e.target)) setShowBranchDropdown(false);
      if (addFileRef.current && !addFileRef.current.contains(e.target)) setShowAddFileDropdown(false);
      if (codeRef.current && !codeRef.current.contains(e.target)) setShowCodeDropdown(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const filesQuery = useQuery({
    queryKey: ['repo-files', owner, repo, path],
    queryFn: async () => {
      const { data } = await api.get(`/repos/${owner}/${repo}/files`, { params: { path } });
      return data;
    },
  });

  const fileQuery = useQuery({
    queryKey: ['repo-file', owner, repo, selectedFile],
    queryFn: async () => {
      const { data } = await api.get(`/repos/${owner}/${repo}/file`, { params: { path: selectedFile } });
      return data;
    },
    enabled: !!selectedFile,
  });

  const createFileMutation = useMutation({
    mutationFn: async () => {
      return (await api.put(`/repos/${owner}/${repo}/file`, {
        path: newFile.path,
        content: newFile.content,
        message: newFile.message || `Create ${newFile.path}`,
        branch: branchRef.current?.value || 'main'
      })).data;
    },
    onSuccess: () => {
      setIsCreatingFile(false);
      queryClient.invalidateQueries({ queryKey: ['repo-files', owner, repo] });
      queryClient.invalidateQueries({ queryKey: ['repo-insights', owner, repo] });
      setSelectedFile(newFile.path);
    },
  });

  const getFilesFromDataTransferItems = async (items) => {
    const files = [];
    const readEntry = async (entry, currentPath = '') => {
      if (entry.isFile) {
        return new Promise((resolve) => {
          entry.file((file) => {
            Object.defineProperty(file, 'customPath', { value: currentPath + file.name });
            resolve([file]);
          });
        });
      } else if (entry.isDirectory) {
        const dirReader = entry.createReader();
        const entries = await new Promise((resolve) => {
          dirReader.readEntries((results) => resolve(results));
        });
        const nestedFiles = await Promise.all(
          entries.map((childEntry) => readEntry(childEntry, currentPath + entry.name + '/'))
        );
        return nestedFiles.flat();
      }
      return [];
    };

    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      if (item.kind === 'file') {
        const entry = item.webkitGetAsEntry();
        if (entry) {
          const entryFiles = await readEntry(entry);
          files.push(...entryFiles);
        }
      }
    }
    return files;
  };

  const handleFileUpload = async (event, droppedFiles = null) => {
    if (event) event.preventDefault();
    const filesToUpload = droppedFiles || uploadFiles;
    if (!filesToUpload || filesToUpload.length === 0) return;

    setIsUploading(true);
    try {
      const filesArray = Array.from(filesToUpload);
      const filesData = await Promise.all(
        filesArray.map(async (file) => {
          const content = await file.text();
          const filePath = file.customPath || file.webkitRelativePath || file.name;
          return {
            path: path ? `${path}/${filePath}` : filePath,
            content,
            mimeType: file.type || 'text/plain',
          };
        })
      );

      await api.post(`/repos/${owner}/${repo}/upload`, {
        files: filesData,
        message: commitMessage || `Upload ${filesArray.length} file${filesArray.length > 1 ? 's' : ''}`,
        description: extendedDescription,
      });

      queryClient.invalidateQueries({ queryKey: ['repo-files', owner, repo] });
      setUploadFiles(null);
      setIsUploadMode(false);
      setCommitMessage('Add files via upload');
      setExtendedDescription('');
    } catch (error) {
      console.error('Upload failed:', error);
    } finally {
      setIsUploading(false);
    }
  };

  const entries = filesQuery.data?.entries || [];
  const filteredEntries = searchQuery
    ? entries.filter(entry => entry.name.toLowerCase().includes(searchQuery.toLowerCase()))
    : entries;

  return (
    <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
      <section className="space-y-4">
        {/* Branch Protection Banner */}
        {showBranchProtectionBanner && (
          <div className="bg-[#1f6feb] border border-[#1f6feb] rounded-md p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <svg className="w-5 h-5 text-white" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
              </svg>
              <span className="text-white text-sm font-medium">Your main branch isn't protected</span>
            </div>
            <div className="flex items-center gap-2">
              <button className="text-white text-sm hover:underline" onClick={() => setShowBranchProtectionBanner(false)}>Dismiss</button>
              <button className="bg-white text-[#1f6feb] px-3 py-1 rounded-md text-sm font-medium hover:bg-gray-100">Protect this branch</button>
            </div>
          </div>
        )}

        {/* Upload Mode View */}
        {isUploadMode ? (
          <div className="space-y-6">
            <div 
              className={`border ${isDragging ? 'border-dashed border-[var(--brand-primary)] bg-[var(--brand-primary)]/5' : 'border-[var(--border-main)] bg-[var(--bg-main)]'} rounded-md relative transition-colors h-64 flex flex-col items-center justify-center`}
              onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
              onDragLeave={(e) => { e.preventDefault(); setIsDragging(false); }}
              onDrop={async (e) => {
                e.preventDefault();
                setIsDragging(false);
                if (e.dataTransfer.items) {
                  const files = await getFilesFromDataTransferItems(e.dataTransfer.items);
                  setUploadFiles(prev => prev ? [...prev, ...files] : files);
                }
              }}
            >
              <svg className="w-12 h-12 text-[var(--text-muted)] mb-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                <polyline points="14 2 14 8 20 8"></polyline>
              </svg>
              <h2 className="text-xl font-semibold mb-2">Drag files here to add them to your repository</h2>
              <p className="text-sm text-[var(--text-muted)]">
                Or <label className="text-[var(--brand-primary)] hover:underline cursor-pointer">
                  choose your files
                  <input type="file" multiple className="hidden" onChange={(e) => setUploadFiles(prev => prev ? [...Array.from(prev), ...Array.from(e.target.files)] : e.target.files)} />
                </label>
              </p>
              {uploadFiles && uploadFiles.length > 0 && (
                <div className="mt-4 text-sm text-[var(--brand-success)] font-medium">
                  {uploadFiles.length} file{uploadFiles.length !== 1 ? 's' : ''} staged for upload
                </div>
              )}
            </div>

            <div className="border border-[var(--border-main)] rounded-md bg-[var(--bg-main)] p-4">
              <h3 className="font-semibold mb-4">Commit changes</h3>
              <div className="space-y-4">
                <input
                  type="text"
                  placeholder="Add files via upload"
                  value={commitMessage}
                  onChange={(e) => setCommitMessage(e.target.value)}
                  className="w-full px-3 py-2 bg-[var(--bg-subtle)] border border-[var(--border-main)] rounded-md focus:outline-none focus:border-[var(--brand-primary)] text-sm"
                />
                <textarea
                  placeholder="Add an optional extended description..."
                  value={extendedDescription}
                  onChange={(e) => setExtendedDescription(e.target.value)}
                  className="w-full px-3 py-2 bg-[var(--bg-subtle)] border border-[var(--border-main)] rounded-md focus:outline-none focus:border-[var(--brand-primary)] text-sm h-24 resize-none"
                />
                <div className="flex flex-col gap-2 pt-2 border-t border-[var(--border-main)]">
                  <label className="flex items-center gap-2 text-sm cursor-pointer">
                    <input type="radio" name="commit-target" defaultChecked className="accent-[var(--brand-primary)]" />
                    <span>Commit directly to the <span className="font-mono bg-[var(--bg-subtle)] px-1 rounded text-xs">main</span> branch.</span>
                  </label>
                  <label className="flex items-center gap-2 text-sm text-[var(--text-muted)] cursor-not-allowed">
                    <input type="radio" name="commit-target" disabled className="accent-[var(--brand-primary)]" />
                    <span>Create a <strong>new branch</strong> for this commit and start a pull request.</span>
                  </label>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                className="px-4 py-2 bg-[var(--brand-success)] text-white rounded-md text-sm font-medium hover:bg-[var(--brand-success)]/90 disabled:opacity-50 disabled:cursor-not-allowed"
                onClick={handleFileUpload}
                disabled={isUploading || !uploadFiles || uploadFiles.length === 0}
              >
                {isUploading ? 'Committing...' : 'Commit changes'}
              </button>
              <button
                className="px-4 py-2 bg-[var(--bg-subtle)] border border-[var(--border-main)] rounded-md text-sm font-medium hover:bg-[var(--bg-main)]"
                onClick={() => { setIsUploadMode(false); setUploadFiles(null); }}
              >
                Cancel
              </button>
            </div>
          </div>
        ) : isCreatingFile ? (
          <div className="flex flex-col h-[calc(100vh-160px)]">
            {/* Header Toolbar */}
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center text-sm">
                <span className="text-[var(--brand-primary)] font-medium">{repoData.name}</span>
                <span className="text-[var(--text-muted)] mx-2">/</span>
                <input
                  type="text"
                  className="bg-transparent border border-[var(--border-main)] rounded px-2 py-1 text-sm focus:outline-none focus:border-[var(--brand-primary)] focus:ring-1 focus:ring-[var(--brand-primary)] w-64"
                  placeholder="Name your file..."
                  value={newFile.path}
                  onChange={(e) => setNewFile({ ...newFile, path: e.target.value })}
                />
                <span className="text-[var(--text-muted)] mx-2">in</span>
                <span className="font-mono bg-[var(--bg-subtle)] border border-[var(--border-main)] px-1.5 py-0.5 rounded text-xs text-[var(--brand-primary)]">
                  main
                </span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  className="px-3 py-1.5 bg-[var(--bg-subtle)] border border-[var(--border-main)] rounded-md text-sm font-medium hover:bg-[var(--bg-main)]"
                  onClick={() => { setIsCreatingFile(false); setNewFile({ path: '', content: '', message: 'Add file' }); }}
                >
                  Cancel changes
                </button>
                <button
                  className="px-3 py-1.5 bg-[var(--brand-success)] text-white rounded-md text-sm font-medium hover:bg-[var(--brand-success)]/90 disabled:opacity-50 disabled:cursor-not-allowed"
                  onClick={() => {
                    createFileMutation.mutate();
                  }}
                  disabled={!newFile.path || createFileMutation.isPending}
                >
                  {createFileMutation.isPending ? 'Committing...' : 'Commit changes...'}
                </button>
              </div>
            </div>

            {/* Editor Area */}
            <div className="flex-1 flex flex-col border border-[var(--border-main)] rounded-md bg-[var(--bg-main)] overflow-hidden">
              {/* Editor Header */}
              <div className="flex items-center justify-between px-4 py-2 border-b border-[var(--border-main)] bg-[var(--bg-subtle)]">
                <div className="flex bg-[var(--bg-main)] rounded-md overflow-hidden border border-[var(--border-main)]">
                  <button className="px-3 py-1 text-sm font-medium bg-[var(--bg-subtle)] text-white border-r border-[var(--border-main)]">Edit</button>
                  <button className="px-3 py-1 text-sm font-medium text-[var(--text-muted)] hover:text-white transition-colors">Preview</button>
                </div>
                <div className="flex items-center gap-2">
                  <select className="bg-transparent border border-[var(--border-main)] rounded px-2 py-1 text-xs text-[var(--text-muted)] focus:outline-none cursor-pointer">
                    <option>Spaces</option>
                    <option>Tabs</option>
                  </select>
                  <select className="bg-transparent border border-[var(--border-main)] rounded px-2 py-1 text-xs text-[var(--text-muted)] focus:outline-none cursor-pointer">
                    <option>2</option>
                    <option>4</option>
                    <option>8</option>
                  </select>
                  <select className="bg-transparent border border-[var(--border-main)] rounded px-2 py-1 text-xs text-[var(--text-muted)] focus:outline-none cursor-pointer">
                    <option>No wrap</option>
                    <option>Soft wrap</option>
                  </select>
                </div>
              </div>

              {/* Editor Body */}
              <div className="flex-1 flex bg-[#0d1117]">
                <div className="w-12 border-r border-[#30363d] flex flex-col items-end py-4 px-2 text-[#6e7681] text-xs font-mono select-none bg-[#0d1117]">
                  {newFile.content.split('\n').map((_, i) => (
                    <div key={i} className="min-h-[20px]">{i + 1}</div>
                  ))}
                </div>
                <textarea
                  className="flex-1 p-4 bg-[#0d1117] text-[#c9d1d9] font-mono text-sm focus:outline-none resize-none leading-[20px]"
                  placeholder="Enter file contents here"
                  value={newFile.content}
                  spellCheck="false"
                  onChange={(e) => setNewFile({ ...newFile, content: e.target.value })}
                />
              </div>

              {/* Editor Footer */}
              <div className="px-4 py-2 border-t border-[var(--border-main)] text-xs text-[var(--text-muted)] bg-[var(--bg-main)]">
                Use <kbd className="bg-[var(--bg-subtle)] border border-[var(--border-main)] rounded px-1">Control</kbd> + <kbd className="bg-[var(--bg-subtle)] border border-[var(--border-main)] rounded px-1">Shift</kbd> + <kbd className="bg-[var(--bg-subtle)] border border-[var(--border-main)] rounded px-1">m</kbd> to toggle the <kbd className="bg-[var(--bg-subtle)] border border-[var(--border-main)] rounded px-1">tab</kbd> key moving focus. Alternatively, use <kbd className="bg-[var(--bg-subtle)] border border-[var(--border-main)] rounded px-1">esc</kbd> then <kbd className="bg-[var(--bg-subtle)] border border-[var(--border-main)] rounded px-1">tab</kbd> to move to the next interactive element on the page.
              </div>
            </div>
          </div>
        ) : (
          <>
            {/* File Browser Header */}
            <div 
              className={`border ${isDragging ? 'border-dashed border-[var(--brand-primary)] bg-[var(--brand-primary)]/5' : 'border-[var(--border-main)] bg-[var(--bg-main)]'} rounded-md relative transition-colors`}
              onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
              onDragLeave={(e) => { e.preventDefault(); setIsDragging(false); }}
              onDrop={async (e) => {
                e.preventDefault();
                setIsDragging(false);
                if (e.dataTransfer.items) {
                  const files = await getFilesFromDataTransferItems(e.dataTransfer.items);
                  setUploadFiles(files);
                  setIsUploadMode(true);
                }
              }}
            >
              {isDragging && (
                <div className="absolute inset-0 z-50 flex items-center justify-center bg-[var(--bg-main)]/80 backdrop-blur-sm rounded-md pointer-events-none">
                  <div className="text-center">
                    <svg className="w-12 h-12 mx-auto text-[var(--brand-primary)] mb-2" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="17 8 12 3 7 8"></polyline><line x1="12" y1="3" x2="12" y2="15"></line></svg>
                    <p className="font-medium text-lg text-[var(--brand-primary)]">Drop files or folders here</p>
                  </div>
                </div>
              )}
              <div className="border-b border-[var(--border-main)] p-3 flex items-center justify-between gap-4">
                <div className="flex items-center gap-3 flex-1">
                  {/* Branch Selector */}
                  <div className="relative" ref={branchRef}>
                    <button
                      className="flex items-center gap-2 px-3 py-1.5 bg-[var(--bg-subtle)] border border-[var(--border-main)] rounded-md text-sm hover:bg-[var(--bg-subtle)]"
                      onClick={() => { setShowBranchDropdown(prev => !prev); setShowAddFileDropdown(false); setShowCodeDropdown(false); }}
                    >
                      <svg className="w-4 h-4 text-[var(--text-muted)]" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <line x1="6" y1="3" x2="6" y2="15"></line>
                        <circle cx="18" cy="6" r="3"></circle>
                        <circle cx="6" cy="18" r="3"></circle>
                      </svg>
                      <span className="font-medium">{repoData.defaultBranch || 'main'}</span>
                      <svg className="w-3 h-3 text-[var(--text-muted)]" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <polyline points="6 9 12 15 18 9"></polyline>
                      </svg>
                    </button>
                    {showBranchDropdown && (
                      <div className="absolute top-full left-0 mt-1 bg-[var(--bg-main)] border border-[var(--border-main)] rounded-md shadow-lg z-50 min-w-[200px]">
                        <div className="p-2 text-xs text-[var(--text-muted)] border-b border-[var(--border-main)]">Branches</div>
                        <button className="w-full px-3 py-2 text-left text-sm hover:bg-[var(--bg-subtle)] font-medium" onClick={() => setShowBranchDropdown(false)}>{repoData.defaultBranch || 'main'}</button>
                        <div className="p-2 text-xs text-[var(--text-muted)] border-t border-[var(--border-main)]">0 Tags</div>
                      </div>
                    )}
                  </div>

                  {/* Go to File Search */}
                  <div className="flex-1 max-w-md">
                    <input
                      type="text"
                      placeholder="Go to file"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full px-3 py-1.5 bg-[var(--bg-subtle)] border border-[var(--border-main)] rounded-md text-sm focus:outline-none focus:border-[var(--brand-primary)]"
                    />
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {/* Add File Dropdown */}
                  <div className="relative" ref={addFileRef}>
                    <button
                      className="flex items-center gap-2 px-3 py-1.5 bg-[var(--brand-success)] text-white rounded-md text-sm font-medium hover:bg-[var(--brand-success)]/90"
                      onClick={() => setShowAddFileDropdown(!showAddFileDropdown)}
                    >
                      <svg className="w-4 h-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <line x1="12" y1="5" x2="12" y2="19"></line>
                        <line x1="5" y1="12" x2="19" y2="12"></line>
                      </svg>
                      Add file
                      <svg className="w-3 h-3" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <polyline points="6 9 12 15 18 9"></polyline>
                      </svg>
                    </button>
                    {showAddFileDropdown && (
                      <div className="absolute top-full right-0 mt-1 bg-[var(--bg-main)] border border-[var(--border-main)] rounded-md shadow-lg z-10 min-w-[180px]">
                        <button
                          className="w-full px-4 py-2 text-left text-sm hover:bg-[var(--bg-subtle)] flex items-center gap-2"
                          onClick={() => { setShowAddFileDropdown(false); setSelectedFile(''); setIsUploadMode(false); setIsCreatingFile(true); }}
                        >
                          <svg className="w-4 h-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                            <polyline points="14 2 14 8 20 8"></polyline>
                            <line x1="12" y1="18" x2="12" y2="12"></line>
                            <line x1="9" y1="15" x2="15" y2="15"></line>
                          </svg>
                          Create new file
                        </button>
                        <button
                          className="w-full px-4 py-2 text-left text-sm hover:bg-[var(--bg-subtle)] flex items-center gap-2 cursor-pointer"
                          onClick={() => { setShowAddFileDropdown(false); setIsUploadMode(true); setIsCreatingFile(false); }}
                        >
                          <svg className="w-4 h-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                            <polyline points="17 8 12 3 7 8"></polyline>
                            <line x1="12" y1="3" x2="12" y2="15"></line>
                          </svg>
                          Upload files
                        </button>
                        <label className="w-full px-4 py-2 text-left text-sm hover:bg-[var(--bg-subtle)] flex items-center gap-2 cursor-pointer border-t border-[var(--border-main)]">
                          <svg className="w-4 h-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"></path>
                            <line x1="12" y1="11" x2="12" y2="17"></line>
                            <line x1="9" y1="14" x2="15" y2="14"></line>
                          </svg>
                          Upload folder
                          <input type="file" webkitdirectory="true" directory="true" multiple className="hidden" onChange={(e) => { setUploadFiles(e.target.files); setShowAddFileDropdown(false); setIsUploadMode(true); setIsCreatingFile(false); }} />
                        </label>
                      </div>
                    )}
                  </div>

                  {/* Code Dropdown */}
                  <div className="relative" ref={codeRef}>
                    <button
                      className="flex items-center gap-2 px-3 py-1.5 bg-[var(--brand-primary)] text-white rounded-md text-sm font-medium hover:bg-[var(--brand-primary)]/90"
                      onClick={() => setShowCodeDropdown(!showCodeDropdown)}
                    >
                      Code
                      <svg className="w-3 h-3" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <polyline points="6 9 12 15 18 9"></polyline>
                      </svg>
                    </button>
                    {showCodeDropdown && (
                      <div className="absolute top-full right-0 mt-1 bg-[var(--bg-main)] border border-[var(--border-main)] rounded-md shadow-lg z-10 min-w-[180px]">
                        <button
                          className="w-full px-4 py-2 text-left text-sm hover:bg-[var(--bg-subtle)] flex items-center gap-2"
                          onClick={() => { setShowCodeDropdown(false); downloadProject(owner, repo); }}
                        >
                          <svg className="w-4 h-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                            <polyline points="17 8 12 3 7 8"></polyline>
                            <line x1="12" y1="3" x2="12" y2="15"></line>
                          </svg>
                          Download ZIP
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* File List */}
              <div className="divide-y divide-[var(--border-main)]">
                {filteredEntries.length ? filteredEntries.map((entry) => (
                  <button
                    key={entry.path}
                    type="button"
                    className="flex w-full items-center px-4 py-2 text-left text-sm hover:bg-[var(--bg-subtle)]"
                    onClick={() => entry.type === 'directory' ? setPath(entry.path) : setSelectedFile(entry.path)}
                  >
                    <div className="flex items-center gap-2 flex-1 min-w-0">
                      {entry.type === 'directory' ? (
                        <svg className="w-4 h-4 text-[var(--text-muted)] shrink-0" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
                          <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/>
                        </svg>
                      ) : (
                        <svg className="w-4 h-4 text-[var(--text-muted)] shrink-0" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                          <polyline points="14 2 14 8 20 8"></polyline>
                        </svg>
                      )}
                      <span className="font-medium truncate">{entry.name}</span>
                    </div>
                    <div className="flex items-center gap-4 ml-4 shrink-0">
                      <span className="text-xs text-[var(--text-muted)] max-w-[200px] truncate">Latest commit</span>
                      <span className="text-xs text-[var(--text-muted)]">1 hour ago</span>
                    </div>
                  </button>
                )) : (
                  <div className="p-8 text-center text-sm text-[var(--text-muted)]">
                    {searchQuery ? 'No files found matching your search.' : 'This directory is empty.'}
                  </div>
                )}
              </div>
            </div>

            {/* File Preview or README */}
            {selectedFile ? (
              <div className="border border-[var(--border-main)] rounded-md overflow-hidden bg-[var(--bg-main)]">
                <div className="border-b border-[var(--border-main)] p-3 flex items-center justify-between">
                  <h3 className="truncate font-semibold text-sm">{selectedFile}</h3>
                  <div className="flex gap-4 items-center">
                    <button className="text-sm font-medium text-amber-500 hover:text-amber-400 hover:underline" onClick={() => setIssueModalOpen(true)}>
                      <span className="flex items-center gap-1"><svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path><line x1="12" y1="9" x2="12" y2="13"></line><line x1="12" y1="17" x2="12.01" y2="17"></line></svg> Mark for Change</span>
                    </button>
                    <button className="text-sm text-[var(--brand-primary)] hover:underline" onClick={() => downloadFile(owner, repo, selectedFile)}>Download</button>
                  </div>
                </div>
                <CodePreview file={fileQuery.data} />
              </div>
            ) : filesQuery.data?.readme ? (
              <div className="border border-[var(--border-main)] rounded-md overflow-hidden bg-[var(--bg-main)]">
                <div className="border-b border-[var(--border-main)] p-3 font-semibold text-sm">README.md</div>
                <div className="p-4 text-sm whitespace-pre-wrap">{filesQuery.data.readme.content}</div>
              </div>
            ) : null}
          </>
        )}
      </section>

      {/* Right Sidebar */}
      <aside className="space-y-4">
        {/* About Section */}
        <div className="border border-[var(--border-main)] rounded-md p-4 bg-[var(--bg-main)]">
          <h3 className="font-semibold text-sm mb-2">About</h3>
          <p className="text-sm text-[var(--text-muted)] mb-3">{repoData.description || 'No description provided.'}</p>
          {repoData.website && (
            <a href={repoData.website} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-sm text-[var(--brand-primary)] hover:underline mb-3">
              <svg className="w-4 h-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"></path>
                <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"></path>
              </svg>
              {repoData.website}
            </a>
          )}
          <div className="flex items-center gap-4 text-sm text-[var(--text-muted)]">
            <span className="flex items-center gap-1">
              <svg className="w-4 h-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon>
              </svg>
              {repoData.starCount} stars
            </span>
            <span className="flex items-center gap-1">
              <svg className="w-4 h-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                <circle cx="12" cy="12" r="3"></circle>
              </svg>
              {repoData.watcherCount} watching
            </span>
            <span className="flex items-center gap-1">
              <svg className="w-4 h-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="6" y1="3" x2="6" y2="15"></line>
                <circle cx="18" cy="6" r="3"></circle>
                <circle cx="6" cy="18" r="3"></circle>
              </svg>
              {repoData.forkCount} forks
            </span>
          </div>
        </div>

        {/* Releases Section */}
        <div className="border border-[var(--border-main)] rounded-md p-4 bg-[var(--bg-main)]">
          <h3 className="font-semibold text-sm mb-2">Releases</h3>
          <p className="text-sm text-[var(--text-muted)] mb-2">No releases published</p>
          <a href="#" className="text-sm text-[var(--brand-primary)] hover:underline">Create a new release</a>
        </div>



        {/* Packages Section */}
        <div className="border border-[var(--border-main)] rounded-md p-4 bg-[var(--bg-main)]">
          <h3 className="font-semibold text-sm mb-2">Packages</h3>
          <p className="text-sm text-[var(--text-muted)]">No packages published</p>
        </div>

        {/* Add or Update File (Collapsible) */}
        {!selectedFile && (
          <div className="border border-[var(--border-main)] rounded-md p-4 bg-[var(--bg-main)]">
            <h3 className="font-semibold text-sm mb-3">Add or update file</h3>
            <form className="space-y-3" onSubmit={(event) => { event.preventDefault(); createFileMutation.mutate(); }}>
              <input
                className="w-full px-3 py-2 bg-[var(--bg-subtle)] border border-[var(--border-main)] rounded-md text-sm focus:outline-none focus:border-[var(--brand-primary)]"
                placeholder="File path"
                value={newFile.path}
                onChange={(event) => setNewFile((current) => ({ ...current, path: event.target.value }))}
              />
              <textarea
                className="w-full px-3 py-2 bg-[var(--bg-subtle)] border border-[var(--border-main)] rounded-md text-sm font-mono min-h-36 focus:outline-none focus:border-[var(--brand-primary)]"
                placeholder="File content"
                value={newFile.content}
                onChange={(event) => setNewFile((current) => ({ ...current, content: event.target.value }))}
              />
              <input
                className="w-full px-3 py-2 bg-[var(--bg-subtle)] border border-[var(--border-main)] rounded-md text-sm focus:outline-none focus:border-[var(--brand-primary)]"
                placeholder="Commit message"
                value={newFile.message}
                onChange={(event) => setNewFile((current) => ({ ...current, message: event.target.value }))}
              />
              <button className="w-full bg-[var(--brand-primary)] text-white px-3 py-2 rounded-md text-sm font-medium hover:bg-[var(--brand-primary)]/90" disabled={createFileMutation.isPending}>
                {createFileMutation.isPending ? 'Committing...' : 'Commit file'}
              </button>
            </form>
          </div>
        )}
      </aside>
      
      {issueModalOpen && (
        <CreateIssueModal
          owner={owner}
          repo={repo}
          defaultTitle={`Marked for change: ${selectedFile}`}
          defaultDescription={`Please review and update the file: \`${selectedFile}\`.\n\nChanges requested by reviewer.`}
          onClose={() => setIssueModalOpen(false)}
          onSuccess={() => {}}
        />
      )}
    </div>
  );
};

const IssueCards = ({ owner, repo }) => {
  const queryClient = useQueryClient();
  const [modalOpen, setModalOpen] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ['repo-issues', owner, repo],
    queryFn: async () => {
      const { data } = await api.get(`/issues/${owner}/${repo}`, { params: { status: 'all' } });
      return data;
    },
  });

  if (isLoading) return <div className="panel p-6 text-sm text-[var(--text-muted)]">Loading issues...</div>;

  return (
    <div className="panel overflow-hidden">
      <div className="panel-header flex items-center justify-between">
        <div className="flex items-center gap-4">
          <h3 className="font-semibold">Issues</h3>
          <span className="text-xs text-[var(--text-muted)]">{data?.openCount || 0} open / {data?.closedCount || 0} closed</span>
        </div>
        <button
          onClick={() => setModalOpen(true)}
          className="rounded-md bg-[var(--brand-success)] px-3 py-1 text-xs font-medium text-white hover:bg-[var(--brand-success)]/90"
        >
          New Issue
        </button>
      </div>
      <div className="divide-y divide-[var(--border-main)]">
        {(data?.issues || []).map((issue) => {
          const isMarkedForChange = issue.title.includes('Marked for change');
          return (
            <div key={issue._id} className={`p-4 ${isMarkedForChange ? 'bg-amber-500/5' : ''}`}>
              <div className="flex flex-wrap items-center gap-2">
                <span className={`h-2.5 w-2.5 rounded-full ${issue.status === 'closed' ? 'bg-[var(--text-muted)]' : 'bg-[var(--brand-success)]'}`} />
                <span className="font-medium">{issue.title}</span>
                <RepoBadge>#{issue.number}</RepoBadge>
                <RepoBadge>{issue.status.replace('_', ' ')}</RepoBadge>
                {issue.priority && <RepoBadge>{issue.priority}</RepoBadge>}
                {isMarkedForChange && (
                  <RepoBadge className="border-amber-500/30 text-amber-500 bg-amber-500/10">Action Required</RepoBadge>
                )}
                {issue.assignee && (
                  <span className="ml-auto flex items-center gap-1 text-xs text-[var(--text-muted)]">
                    Assignee: <span className="font-medium text-[var(--text-main)]">@{issue.assignee.username}</span>
                  </span>
                )}
              </div>
              <div className="mt-2 text-xs text-[var(--text-muted)]">
                Opened by {issue.author?.username || 'unknown'} - {issue.commentCount} comments
              </div>
            </div>
          );
        })}
        {!data?.issues?.length && <div className="p-8 text-center text-sm text-[var(--text-muted)]">No issues yet.</div>}
      </div>

      {modalOpen && (
        <CreateIssueModal
          owner={owner}
          repo={repo}
          onClose={() => setModalOpen(false)}
          onSuccess={() => queryClient.invalidateQueries({ queryKey: ['repo-issues', owner, repo] })}
        />
      )}
    </div>
  );
};

const PullRequestCards = ({ owner, repo }) => {
  const { data, isLoading } = useQuery({
    queryKey: ['repo-prs', owner, repo],
    queryFn: async () => {
      const { data } = await api.get(`/pullrequests/${owner}/${repo}`, { params: { status: 'all' } });
      return data;
    },
  });

  if (isLoading) return <div className="panel p-6 text-sm text-[var(--text-muted)]">Loading pull requests...</div>;

  return (
    <div className="panel overflow-hidden">
      <div className="panel-header flex items-center justify-between">
        <h3 className="font-semibold">Pull requests</h3>
        <span className="text-xs text-[var(--text-muted)]">{data?.openCount || 0} open / {data?.mergedCount || 0} merged</span>
      </div>
      <div className="divide-y divide-[var(--border-main)]">
        {(data?.pullRequests || []).map((pr) => (
          <div key={pr._id} className="p-4">
            <div className="flex flex-wrap items-center gap-2">
              <span className={`h-2.5 w-2.5 rounded-full ${pr.status === 'merged' ? 'bg-[var(--brand-primary)]' : pr.status === 'closed' ? 'bg-[var(--text-muted)]' : 'bg-[var(--brand-success)]'}`} />
              <span className="font-medium">{pr.title}</span>
              <RepoBadge>#{pr.number}</RepoBadge>
              {pr.isDraft && <RepoBadge>draft</RepoBadge>}
              <RepoBadge>{pr.reviewDecision || pr.status}</RepoBadge>
            </div>
            <div className="mt-2 text-xs text-[var(--text-muted)]">{pr.sourceBranch?.name} into {pr.targetBranch?.name} - {pr.commentCount} comments</div>
          </div>
        ))}
        {!data?.pullRequests?.length && <div className="p-8 text-center text-sm text-[var(--text-muted)]">No pull requests yet.</div>}
      </div>
    </div>
  );
};

const ActionsTab = ({ owner, repo }) => {
  const queryClient = useQueryClient();
  const [workflow, setWorkflow] = useState({
    name: 'Build and test',
    yaml: 'name: Build and test\non: [push, pull_request]\njobs:\n  test:\n    runs-on: ubuntu-latest\n    steps:\n      - npm install\n      - npm test',
  });

  const workflows = useQuery({
    queryKey: ['repo-workflows', owner, repo],
    queryFn: async () => (await api.get(`/repos/${owner}/${repo}/workflows`)).data,
  });

  const runs = useQuery({
    queryKey: ['repo-workflow-runs', owner, repo],
    queryFn: async () => (await api.get(`/repos/${owner}/${repo}/workflow-runs`)).data,
  });

  const createWorkflow = useMutation({
    mutationFn: async () => (await api.post(`/repos/${owner}/${repo}/workflows`, workflow)).data,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['repo-workflows', owner, repo] }),
  });

  const runWorkflow = useMutation({
    mutationFn: async (id) => (await api.post(`/repos/${owner}/${repo}/workflows/${id}/runs`, {})).data,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['repo-workflow-runs', owner, repo] }),
  });

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_420px]">
      <div className="panel overflow-hidden">
        <div className="panel-header font-semibold">Workflow history</div>
        <div className="divide-y divide-[var(--border-main)]">
          {(runs.data || []).map((run) => (
            <div key={run._id} className="flex items-center justify-between p-4">
              <div>
                <div className="font-medium">{run.workflow?.name || 'Workflow'} #{run.runNumber}</div>
                <div className="text-xs text-[var(--text-muted)]">{run.branch} - {run.status} - {run.conclusion || 'pending'}</div>
              </div>
              <RepoBadge>{run.actor?.username || 'system'}</RepoBadge>
            </div>
          ))}
          {!runs.data?.length && <div className="p-8 text-center text-sm text-[var(--text-muted)]">No workflow runs yet.</div>}
        </div>
      </div>

      <aside className="space-y-4">
        <div className="panel p-4">
          <h3 className="mb-3 font-semibold">Workflows</h3>
          <div className="space-y-2">
            {(workflows.data || []).map((item) => (
              <div key={item._id} className="rounded-md border border-[var(--border-main)] p-3">
                <div className="font-medium">{item.name}</div>
                <div className="mt-1 text-xs text-[var(--text-muted)]">{item.path}</div>
                <button className="btn-secondary mt-3 w-full text-xs" type="button" onClick={() => runWorkflow.mutate(item._id)}>Run workflow</button>
              </div>
            ))}
          </div>
        </div>
        <form className="panel p-4" onSubmit={(event) => { event.preventDefault(); createWorkflow.mutate(); }}>
          <h3 className="mb-3 font-semibold">YAML editor</h3>
          <input className="input-field mb-3" value={workflow.name} onChange={(event) => setWorkflow((current) => ({ ...current, name: event.target.value }))} />
          <textarea className="input-field min-h-56 font-mono" value={workflow.yaml} onChange={(event) => setWorkflow((current) => ({ ...current, yaml: event.target.value }))} />
          <button className="btn-primary mt-3 w-full" disabled={createWorkflow.isPending}>Save workflow</button>
        </form>
      </aside>
    </div>
  );
};

const WikiTab = ({ owner, repo }) => {
  const queryClient = useQueryClient();
  const [page, setPage] = useState({ slug: 'home', title: 'Home', content: '# Home\n\nBuildBoard+ documentation.' });
  const pages = useQuery({
    queryKey: ['repo-wiki', owner, repo],
    queryFn: async () => (await api.get(`/repos/${owner}/${repo}/wiki`)).data,
  });
  const savePage = useMutation({
    mutationFn: async () => (await api.put(`/repos/${owner}/${repo}/wiki/${page.slug}`, page)).data,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['repo-wiki', owner, repo] }),
  });

  return (
    <div className="grid gap-6 lg:grid-cols-[280px_minmax(0,1fr)]">
      <aside className="panel overflow-hidden">
        <div className="panel-header font-semibold">Pages</div>
        <div className="divide-y divide-[var(--border-main)]">
          {(pages.data || []).map((item) => (
            <button key={item._id} type="button" className="block w-full px-4 py-3 text-left text-sm hover:bg-[var(--bg-subtle)]" onClick={() => setPage({ slug: item.slug, title: item.title, content: item.content })}>
              {item.title}
            </button>
          ))}
          {!pages.data?.length && <div className="p-4 text-sm text-[var(--text-muted)]">No wiki pages yet.</div>}
        </div>
      </aside>
      <form className="panel p-4" onSubmit={(event) => { event.preventDefault(); savePage.mutate(); }}>
        <div className="grid gap-3 md:grid-cols-[180px_1fr]">
          <input className="input-field" value={page.slug} onChange={(event) => setPage((current) => ({ ...current, slug: event.target.value }))} />
          <input className="input-field" value={page.title} onChange={(event) => setPage((current) => ({ ...current, title: event.target.value }))} />
        </div>
        <textarea className="input-field mt-3 min-h-96 font-mono" value={page.content} onChange={(event) => setPage((current) => ({ ...current, content: event.target.value }))} />
        <button className="btn-primary mt-3">Save wiki page</button>
      </form>
    </div>
  );
};

const SimpleListTab = ({ title, queryKey, queryFn, empty, render }) => {
  const { data, isLoading } = useQuery({ queryKey, queryFn });
  if (isLoading) return <div className="panel p-6 text-sm text-[var(--text-muted)]">Loading {title.toLowerCase()}...</div>;
  const items = Array.isArray(data) ? data : [];
  return (
    <div className="panel overflow-hidden">
      <div className="panel-header font-semibold">{title}</div>
      <div className="divide-y divide-[var(--border-main)]">
        {items.map(render)}
        {!items.length && <div className="p-8 text-center text-sm text-[var(--text-muted)]">{empty}</div>}
      </div>
    </div>
  );
};

const InsightsTab = ({ owner, repo }) => {
  const { data, isLoading } = useQuery({
    queryKey: ['repo-insights', owner, repo],
    queryFn: async () => (await api.get(`/repos/${owner}/${repo}/insights`)).data,
  });
  if (isLoading) return <div className="panel p-6 text-sm text-[var(--text-muted)]">Loading insights...</div>;

  const summary = data?.summary || {};
  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-5">
        {Object.entries(summary).map(([key, value]) => (
          <div key={key} className="panel p-4">
            <div className="text-2xl font-semibold">{value}</div>
            <div className="mt-1 text-xs uppercase text-[var(--text-muted)]">{key.replace(/([A-Z])/g, ' $1')}</div>
          </div>
        ))}
      </div>
      <div className="grid gap-6 lg:grid-cols-2">
        <div className="panel p-4">
          <h3 className="mb-3 font-semibold">Top contributors</h3>
          <div className="space-y-3">
            {(data?.contributors || []).map((contributor) => (
              <div key={contributor.username} className="flex items-center justify-between">
                <span className="font-medium">{contributor.username}</span>
                <RepoBadge>{contributor.commits} commits</RepoBadge>
              </div>
            ))}
          </div>
        </div>
        <div className="panel p-4">
          <h3 className="mb-3 font-semibold">Health signals</h3>
          {Object.entries(data?.health || {}).map(([key, value]) => (
            <div key={key} className="mb-3">
              <div className="mb-1 flex justify-between text-sm"><span>{key}</span><span>{value}%</span></div>
              <div className="h-2 rounded-full bg-[var(--bg-subtle)]"><div className="h-2 rounded-full bg-[var(--brand-success)]" style={{ width: `${value}%` }} /></div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

const SecurityTab = ({ owner, repo }) => {
  const { data, isLoading } = useQuery({
    queryKey: ['repo-security', owner, repo],
    queryFn: async () => (await api.get(`/repos/${owner}/${repo}/security`)).data,
  });
  if (isLoading) return <div className="panel p-6 text-sm text-[var(--text-muted)]">Loading security dashboard...</div>;
  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-4">
        {['critical', 'high', 'medium', 'low'].map((severity) => (
          <div key={severity} className="panel p-4">
            <div className="text-2xl font-semibold">{data?.counts?.[severity] || 0}</div>
            <div className="text-sm capitalize text-[var(--text-muted)]">{severity} alerts</div>
          </div>
        ))}
      </div>
      <SimpleListTab
        title="Security alerts"
        queryKey={['repo-security-alerts-local', owner, repo, data?.alerts?.length]}
        queryFn={async () => data?.alerts || []}
        empty="No open security alerts."
        render={(alert) => (
          <div key={alert._id} className="p-4">
            <div className="font-medium">{alert.title}</div>
            <div className="mt-1 text-xs text-[var(--text-muted)]">{alert.type} - {alert.severity} - {alert.status}</div>
          </div>
        )}
      />
    </div>
  );
};

const DiscussionsTab = ({ owner, repo }) => (
  <SimpleListTab
    title="Discussions"
    queryKey={['repo-discussions', owner, repo]}
    queryFn={async () => (await api.get(`/repos/${owner}/${repo}/discussions`)).data}
    empty="No discussions yet."
    render={(discussion) => (
      <div key={discussion._id} className="p-4">
        <div className="font-medium">{discussion.title}</div>
        <div className="mt-1 text-xs text-[var(--text-muted)]">{discussion.category} - {discussion.commentCount} replies - {discussion.upvotes?.length || 0} upvotes</div>
      </div>
    )}
  />
);

const ReleasesTab = ({ owner, repo }) => (
  <SimpleListTab
    title="Releases"
    queryKey={['repo-releases', owner, repo]}
    queryFn={async () => (await api.get(`/repos/${owner}/${repo}/releases`)).data}
    empty="No releases published."
    render={(release) => (
      <div key={release._id} className="p-4">
        <div className="font-medium">{release.title}</div>
        <div className="mt-1 text-xs text-[var(--text-muted)]">{release.tagName} - {release.isPrerelease ? 'pre-release' : 'stable'} - {release.assets?.length || 0} assets</div>
      </div>
    )}
  />
);

const AiTab = ({ owner, repo }) => {
  const { data, isLoading } = useQuery({
    queryKey: ['repo-ai', owner, repo],
    queryFn: async () => (await api.get(`/ai/${owner}/${repo}/assistant`)).data,
  });
  if (isLoading) return <div className="panel p-6 text-sm text-[var(--text-muted)]">Generating repository intelligence...</div>;
  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <div className="panel p-4">
        <h3 className="mb-3 font-semibold">Commit summary</h3>
        <pre className="whitespace-pre-wrap text-sm text-[var(--text-muted)]">{data?.commitSummary}</pre>
      </div>
      <div className="panel p-4">
        <h3 className="mb-3 font-semibold">Release notes</h3>
        <p className="text-sm text-[var(--text-muted)]">{data?.releaseNotes}</p>
      </div>
      <div className="panel p-4">
        <h3 className="mb-3 font-semibold">Project health score</h3>
        <div className="text-4xl font-semibold">{data?.projectHealthScore}</div>
        <p className="mt-2 text-sm text-[var(--text-muted)]">{data?.sprintAnalysis?.recommendation}</p>
      </div>
      <div className="panel p-4">
        <h3 className="mb-3 font-semibold">Documentation starter</h3>
        <pre className="max-h-80 overflow-auto whitespace-pre-wrap rounded-md bg-[var(--bg-subtle)] p-3 text-xs">{data?.documentationGenerator}</pre>
      </div>
    </div>
  );
};

const RepositoryPage = () => {
  const { owner, repo, repoQuery } = useRepoQuery();
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTab = normalizeTab(searchParams.get('tab') || 'code');

  const repoData = repoQuery.data;

  const tabContent = useMemo(() => {
    if (!repoData) return null;
    switch (activeTab) {
      case 'Issues':
        return <IssueCards owner={owner} repo={repo} />;
      case 'Pull Requests':
        return <PullRequestCards owner={owner} repo={repo} />;
      case 'Actions':
        return <ActionsTab owner={owner} repo={repo} />;
      case 'Wiki':
        return <WikiTab owner={owner} repo={repo} />;
      case 'Security':
        return <SecurityTab owner={owner} repo={repo} />;
      case 'Insights':
        return <InsightsTab owner={owner} repo={repo} />;
      case 'Releases':
        return <ReleasesTab owner={owner} repo={repo} />;
      case 'Discussions':
        return <DiscussionsTab owner={owner} repo={repo} />;
      case 'AI':
        return <AiTab owner={owner} repo={repo} />;
      case 'Projects':
        return <div className="panel p-8 text-sm text-[var(--text-muted)]">Project boards support backlog, todo, development, review, testing, and done columns through the ProjectBoard model.</div>;
      case 'Packages':
        return <div className="panel p-8 text-sm text-[var(--text-muted)]">Repository package metadata is ready on the repository schema for npm, Docker, Maven, NuGet, and generic artifacts.</div>;
      default:
        return <CodeTab owner={owner} repo={repo} repoData={repoData} />;
    }
  }, [activeTab, owner, repo, repoData]);

  if (repoQuery.isLoading) {
    return <div className="h-96 animate-pulse rounded-md bg-[var(--bg-subtle)]" />;
  }

  if (repoQuery.error) {
    return <div className="panel p-8 text-center text-sm text-[var(--brand-danger)]">Repository not found or access denied.</div>;
  }

  return (
    <div className="space-y-5">
      <div className="border-b border-[var(--border-main)] pb-4">
        <div className="flex flex-col justify-between gap-3 md:flex-row md:items-start">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2 text-xl">
              <Link to="/" className="text-[var(--brand-primary)] hover:underline">{repoData.owner?.username}</Link>
              <span className="text-[var(--text-muted)]">/</span>
              <span className="font-semibold">{repoData.name}</span>
              <RepoBadge>{repoData.visibility}</RepoBadge>
              {repoData.isArchived && <RepoBadge>archived</RepoBadge>}
              {repoData.isTemplate && <RepoBadge>template</RepoBadge>}
            </div>
            <p className="mt-2 max-w-3xl text-sm text-[var(--text-muted)]">{repoData.description || 'No description provided.'}</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button className="btn-secondary text-sm" type="button">Watch {repoData.watcherCount}</button>
            <button className="btn-secondary text-sm" type="button">Fork {repoData.forkCount}</button>
            <button className="btn-secondary text-sm" type="button">Star {repoData.starCount}</button>
          </div>
        </div>

        <div className="mt-4 flex gap-2 overflow-x-auto">
          {tabs.map((tab) => (
            <button
              key={tab}
              type="button"
              onClick={() => setSearchParams({ tab: tabToParam(tab) })}
              className={`shrink-0 border-b-2 px-3 py-2 text-sm font-medium ${activeTab === tab ? 'border-[var(--brand-warning)] text-[var(--text-main)]' : 'border-transparent text-[var(--text-muted)] hover:text-[var(--text-main)]'}`}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      {tabContent}
    </div>
  );
};

export default RepositoryPage;
