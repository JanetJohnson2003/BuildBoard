import React, { useState, useRef, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../../lib/api';
import { GlassCard, NeonButton, CyberInput, CyberBadge } from '../ui';
import { 
  Folder, File, FileText, Code2, ShieldAlert, GitBranch, Download, 
  Upload, Search, Edit2, Play, Plus, X, AlertTriangle, Terminal, Globe, Star, Activity
} from 'lucide-react';
import { IDEEditor } from '../ide/WebIDE';
import { itemVariants, listVariants } from '../../utils/animations';

const CodePreview = ({ file }) => {
  if (!file) return null;
  const content = file.content || '';
  const lines = content.split('\n');
  const ext = file.name.split('.').pop()?.toLowerCase();

  if (file.mimeType?.startsWith('image/') && file.encoding === 'base64') {
    return (
      <div className="p-4 flex justify-center bg-[var(--bg-main)]">
        <img src={`data:${file.mimeType};base64,${file.content}`} alt={file.name} className="max-h-[520px] rounded-md border border-[var(--glass-border)] object-contain shadow-[0_0_15px_rgba(0,212,255,0.1)]" />
      </div>
    );
  }

  if (ext === 'pdf') {
    return (
      <div className="p-12 text-center flex flex-col items-center justify-center bg-[var(--bg-main)]">
        <FileText size={48} className="text-[var(--text-muted)] opacity-30 mb-4" />
        <p className="text-sm text-[var(--text-muted)] font-mono">PDF preview unavailable. Please download the file to view its contents.</p>
      </div>
    );
  }

  return (
    <div className="overflow-auto bg-[#0a0a0f] text-[#a0aabf] p-4 cyber-scrollbar">
      <table className="w-full border-collapse font-mono text-[13px] leading-relaxed">
        <tbody>
          {lines.map((line, index) => (
            <tr key={`${index}-${line}`} className="hover:bg-white/5 transition-colors">
              <td className="w-12 select-none pr-4 text-right text-[var(--text-muted)]/50 border-r border-[var(--glass-border)]/30">{index + 1}</td>
              <td className="whitespace-pre pl-4 py-0.5">{line || ' '}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

const TimeTravelSlider = ({ owner, repo, filePath }) => {
  const [currentCommitIndex, setCurrentCommitIndex] = useState(0);
  const { data: history, isLoading } = useQuery({
    queryKey: ['file-history', owner, repo, filePath],
    queryFn: async () => (await api.get(`/repos/${owner}/${repo}/file/history`, { params: { path: filePath } })).data,
  });

  if (isLoading) return <div className="p-4 text-xs font-mono text-[var(--brand-primary)] animate-pulse">LOADING_TEMPORAL_DATA...</div>;
  if (!history || history.length === 0) return null;

  const commit = history[currentCommitIndex];

  return (
    <div className="p-4 bg-black/60 border-t border-[var(--glass-border)] flex flex-col gap-4 relative overflow-hidden">
       <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none">
          <Terminal size={64} />
       </div>
       <div className="flex justify-between items-center text-xs font-mono">
          <div className="flex items-center gap-2">
             <Activity size={14} className="text-[var(--brand-warning)] animate-pulse" />
             <span className="text-[var(--text-muted)] font-bold">TEMPORAL_PLAYBACK</span>
          </div>
          <CyberBadge variant="warning" size="sm">{commit.sha.substring(0, 7)}</CyberBadge>
       </div>
       <input 
         type="range" 
         min={0} 
         max={history.length - 1} 
         value={currentCommitIndex}
         onChange={(e) => setCurrentCommitIndex(parseInt(e.target.value))}
         className="w-full h-1 bg-[var(--glass-border)] rounded-lg appearance-none cursor-pointer accent-[var(--brand-warning)] relative z-10" 
         style={{ direction: 'rtl' }}
       />
       <div className="flex justify-between text-[10px] font-mono text-[var(--text-muted)]">
          <span>{new Date(commit.createdAt).toLocaleString()}</span>
          <span>{history.length} COMMITS</span>
       </div>
       <div className="text-[11px] font-mono text-[var(--text-main)] mt-2 bg-white/5 p-2 rounded border border-white/10">
         <span className="text-[var(--brand-primary)] font-bold">{commit.author?.username}</span>: {commit.message}
       </div>
    </div>
  );
};

export const CodeTab = ({ owner, repo, repoData, setIssueModalOpen, setSelectedFileForIssue }) => {
  const queryClient = useQueryClient();
  const [path, setPath] = useState('');
  const [selectedFile, setSelectedFile] = useState('');
  const [newFile, setNewFile] = useState({ path: '', content: '', message: 'Add file' });
  const [uploadFiles, setUploadFiles] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [showBranchProtectionBanner, setShowBranchProtectionBanner] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [isDragging, setIsDragging] = useState(false);
  const [isUploadMode, setIsUploadMode] = useState(false);
  const [isCreatingFile, setIsCreatingFile] = useState(false);
  const [commitMessage, setCommitMessage] = useState('Add files via upload');
  const [extendedDescription, setExtendedDescription] = useState('');

  const filesQuery = useQuery({
    queryKey: ['repo-files', owner, repo, path],
    queryFn: async () => {
      const { data } = await api.get(`/repos/${owner}/${repo}/files`, { params: { path } });
      return data;
    },
    enabled: !!owner && !!repo,
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
        branch: repoData.defaultBranch || 'main'
      })).data;
    },
    onSuccess: () => {
      setIsCreatingFile(false);
      queryClient.invalidateQueries({ queryKey: ['repo-files', owner, repo] });
      queryClient.invalidateQueries({ queryKey: ['repo-insights', owner, repo] });
      setSelectedFile(newFile.path);
      setNewFile({ path: '', content: '', message: 'Add file' });
    },
  });

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

  const downloadProject = async () => {
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

  const handleFileUpload = async (event) => {
    if (event) event.preventDefault();
    if (!uploadFiles || uploadFiles.length === 0) return;

    setIsUploading(true);
    try {
      const filesArray = Array.from(uploadFiles);
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
      <section className="space-y-6">
        {/* Branch Protection Banner */}
        <AnimatePresence>
          {showBranchProtectionBanner && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="overflow-hidden"
            >
              <GlassCard glowColor="var(--brand-warning)" className="p-4 flex items-center justify-between bg-[var(--brand-warning)]/10 border-[var(--brand-warning)]/30">
                <div className="flex items-center gap-3">
                  <ShieldAlert className="text-[var(--brand-warning)]" size={20} />
                  <span className="text-[var(--brand-warning)] text-sm font-mono font-bold">WARNING: MAIN_BRANCH_UNPROTECTED</span>
                </div>
                <div className="flex items-center gap-3">
                  <button className="text-xs font-mono text-[var(--text-muted)] hover:text-white transition-colors" onClick={() => setShowBranchProtectionBanner(false)}>
                    [DISMISS]
                  </button>
                  <NeonButton variant="ghost" className="border-[var(--brand-warning)] text-[var(--brand-warning)] hover:bg-[var(--brand-warning)]/10 py-1 px-3 text-xs">
                    ENABLE_PROTECTION
                  </NeonButton>
                </div>
              </GlassCard>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Upload Mode View */}
        {isUploadMode ? (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
            <GlassCard
              className={`p-10 flex flex-col items-center justify-center transition-all ${isDragging ? 'border-[var(--brand-primary)] bg-[var(--brand-primary)]/10 scale-[1.02]' : 'border-[var(--glass-border)]'}`}
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
              <div className="w-20 h-20 rounded-full bg-[var(--bg-tertiary)] flex items-center justify-center mb-6 border border-[var(--glass-border)] relative group">
                <div className="absolute inset-0 rounded-full border-2 border-[var(--brand-primary)]/30 scale-110 animate-[spin_4s_linear_infinite]" />
                <Upload size={32} className="text-[var(--brand-primary)]" />
              </div>
              <h2 className="text-2xl font-display font-bold mb-3 text-white">Initialize Data Transfer</h2>
              <p className="text-sm text-[var(--text-muted)] mb-6 font-mono">Drag objects to upload into sector memory.</p>
              
              <div className="flex items-center gap-4">
                <label>
                  <NeonButton variant="primary" as="span" className="cursor-pointer">
                    BROWSE_FILES
                  </NeonButton>
                  <input type="file" multiple className="hidden" onChange={(e) => setUploadFiles(prev => prev ? [...Array.from(prev), ...Array.from(e.target.files)] : e.target.files)} />
                </label>
                <label>
                  <NeonButton variant="ghost" as="span" className="cursor-pointer">
                    BROWSE_DIRECTORIES
                  </NeonButton>
                  <input type="file" webkitdirectory="true" directory="true" multiple className="hidden" onChange={(e) => setUploadFiles(e.target.files)} />
                </label>
              </div>

              {uploadFiles && uploadFiles.length > 0 && (
                <div className="mt-8 pt-6 border-t border-[var(--glass-border)] w-full text-center">
                  <CyberBadge variant="success" size="lg" className="animate-pulse">
                    {uploadFiles.length} OBJECT{uploadFiles.length !== 1 ? 'S' : ''} DETECTED
                  </CyberBadge>
                </div>
              )}
            </GlassCard>

            <GlassCard className="p-6 border-t-[var(--brand-success)]">
              <h3 className="font-display font-bold text-lg mb-4 flex items-center gap-2">
                <Terminal size={18} className="text-[var(--brand-success)]" /> Commit Protocol
              </h3>
              <div className="space-y-4">
                <CyberInput
                  placeholder="Commit message..."
                  value={commitMessage}
                  onChange={(e) => setCommitMessage(e.target.value)}
                  className="font-mono text-sm"
                />
                <textarea
                  placeholder="Extended operational details (optional)..."
                  value={extendedDescription}
                  onChange={(e) => setExtendedDescription(e.target.value)}
                  className="w-full bg-[var(--bg-main)]/50 border border-[var(--glass-border)] rounded-lg p-3 text-sm focus:border-[var(--brand-primary)] focus:ring-1 focus:ring-[var(--brand-primary)]/50 outline-none transition-all resize-none font-mono min-h-[100px]"
                />
                
                <div className="pt-4 flex gap-3 justify-end border-t border-[var(--glass-border)]">
                  <NeonButton variant="ghost" onClick={() => { setIsUploadMode(false); setUploadFiles(null); }}>
                    ABORT
                  </NeonButton>
                  <NeonButton variant="primary" onClick={handleFileUpload} disabled={isUploading || !uploadFiles || uploadFiles.length === 0}>
                    {isUploading ? 'EXECUTING...' : 'COMMIT_CHANGES'}
                  </NeonButton>
                </div>
              </div>
            </GlassCard>
          </motion.div>
        ) : isCreatingFile ? (
          <motion.div initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} className="flex flex-col min-h-[600px]">
            {/* Header Toolbar */}
            <div className="flex flex-col md:flex-row md:items-center justify-between mb-4 gap-4">
              <div className="flex items-center text-sm font-mono bg-[var(--bg-tertiary)] border border-[var(--glass-border)] rounded-lg p-1.5 overflow-x-auto cyber-scrollbar">
                <span className="text-[var(--brand-primary)] font-bold px-2 whitespace-nowrap">{repoData.name}</span>
                <span className="text-[var(--text-muted)]">/</span>
                <input
                  type="text"
                  className="bg-transparent border-none px-2 py-1 focus:outline-none text-[var(--text-main)] min-w-[200px]"
                  placeholder="filename.ext"
                  value={newFile.path}
                  onChange={(e) => setNewFile({ ...newFile, path: e.target.value })}
                  autoFocus
                />
              </div>
              <div className="flex items-center gap-3 shrink-0">
                <NeonButton variant="ghost" onClick={() => { setIsCreatingFile(false); setNewFile({ path: '', content: '', message: 'Add file' }); }}>
                  ABORT
                </NeonButton>
                <NeonButton 
                  variant="primary"
                  onClick={() => createFileMutation.mutate()}
                  disabled={!newFile.path || createFileMutation.isPending}
                >
                  {createFileMutation.isPending ? 'UPLOADING...' : 'COMMIT_FILE'}
                </NeonButton>
              </div>
            </div>

            {/* Editor Area */}
            <GlassCard className="flex-1 flex flex-col p-0 overflow-hidden">
              <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--glass-border)] bg-black/40">
                <div className="flex items-center gap-2">
                  <Code2 size={16} className="text-[var(--brand-primary)]" />
                  <span className="text-sm font-mono text-white">EDITOR_INTERFACE</span>
                </div>
                <div className="flex items-center gap-3 text-xs font-mono text-[var(--text-muted)]">
                  <span className="px-2 py-1 rounded bg-[var(--bg-main)] border border-[var(--glass-border)]">UTF-8</span>
                  <span className="px-2 py-1 rounded bg-[var(--bg-main)] border border-[var(--glass-border)]">SPACES: 2</span>
                </div>
              </div>

              <div className="flex-1 flex bg-[#0d1117] relative">
                {/* Line numbers placeholder */}
                <div className="w-12 border-r border-[#30363d] flex flex-col items-end py-4 px-2 text-[#6e7681] text-xs font-mono select-none bg-[#0a0a0f]">
                  {newFile.content.split('\n').map((_, i) => (
                    <div key={i} className="min-h-[21px]">{i + 1}</div>
                  ))}
                </div>
                <textarea
                  className="flex-1 p-4 bg-transparent text-[#c9d1d9] font-mono text-[13px] leading-[21px] focus:outline-none resize-none"
                  placeholder="// Enter code sequence here..."
                  value={newFile.content}
                  spellCheck="false"
                  onChange={(e) => setNewFile({ ...newFile, content: e.target.value })}
                />
              </div>
            </GlassCard>
          </motion.div>
        ) : (
          <motion.div variants={listVariants} initial="hidden" animate="visible" className="space-y-4">
            {/* File Browser Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-2">
              <div className="flex items-center gap-3 w-full md:w-auto">
                {/* Branch Selector */}
                <div className="relative group">
                  <div className="flex items-center gap-2 px-3 py-1.5 bg-[var(--brand-purple)]/10 border border-[var(--brand-purple)]/30 rounded-md text-sm text-[var(--brand-purple)] font-mono hover:bg-[var(--brand-purple)]/20 transition-colors cursor-pointer">
                    <GitBranch size={14} />
                    <span className="font-bold">{repoData.defaultBranch || 'main'}</span>
                  </div>
                </div>

                <div className="relative flex-1 md:w-64">
                  <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
                  <input
                    type="text"
                    placeholder="Find in files..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-9 pr-3 py-1.5 bg-[var(--bg-subtle)] border border-[var(--glass-border)] rounded-md text-sm font-mono focus:outline-none focus:border-[var(--brand-primary)]"
                  />
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                {selectedFile && (
                  <NeonButton variant="ghost" onClick={() => setSelectedFile('')} className="py-1.5 px-3">
                    BACK_TO_ROOT
                  </NeonButton>
                )}
                {!selectedFile && (
                  <>
                    <NeonButton variant="ghost" onClick={() => { setSelectedFile(''); setIsUploadMode(false); setIsCreatingFile(true); }} className="py-1.5 px-3 flex items-center gap-1.5 border-[var(--brand-primary)]/30 text-[var(--brand-primary)]">
                      <Plus size={14} /> NEW_FILE
                    </NeonButton>
                    <NeonButton variant="ghost" onClick={() => { setIsUploadMode(true); setIsCreatingFile(false); }} className="py-1.5 px-3 flex items-center gap-1.5 border-[var(--brand-purple)]/30 text-[var(--brand-purple)]">
                      <Upload size={14} /> UPLOAD
                    </NeonButton>
                    <NeonButton variant="ghost" onClick={downloadProject} className="py-1.5 px-3 flex items-center gap-1.5">
                      <Download size={14} /> CLONE
                    </NeonButton>
                  </>
                )}
              </div>
            </div>

            {/* File Content Area */}
            {selectedFile ? (
              <motion.div variants={itemVariants}>
                <GlassCard className="p-0 overflow-hidden border-t-[var(--brand-primary)]">
                  <div className="border-b border-[var(--glass-border)] p-3 flex flex-col md:flex-row md:items-center justify-between gap-3 bg-black/40">
                    <h3 className="font-mono font-bold text-sm text-[var(--text-main)] flex items-center gap-2 truncate">
                      <FileText size={16} className="text-[var(--brand-primary)]" />
                      {selectedFile}
                    </h3>
                    <div className="flex items-center gap-3 shrink-0">
                      <button 
                        className="text-xs font-mono flex items-center gap-1.5 text-[var(--brand-warning)] hover:text-white transition-colors bg-[var(--brand-warning)]/10 px-2 py-1 rounded border border-[var(--brand-warning)]/30"
                        onClick={() => {
                          setSelectedFileForIssue(selectedFile);
                          setIssueModalOpen(true);
                        }}
                      >
                        <AlertTriangle size={12} /> MARK_FOR_REVIEW
                      </button>
                      <button 
                        className="text-xs font-mono flex items-center gap-1.5 text-[var(--brand-primary)] hover:text-white transition-colors bg-[var(--brand-primary)]/10 px-2 py-1 rounded border border-[var(--brand-primary)]/30"
                        onClick={() => downloadFile(owner, repo, selectedFile)}
                      >
                        <Download size={12} /> DOWNLOAD
                      </button>
                    </div>
                  </div>


                  {(fileQuery.data?.mimeType?.startsWith('image/') || fileQuery.data?.name?.split('.').pop()?.toLowerCase() === 'pdf') ? (
                    <CodePreview file={fileQuery.data} />
                  ) : (
                    <div className="flex flex-col">
                      <IDEEditor 
                        file={fileQuery.data} 
                        owner={owner} 
                        repo={repo} 
                        branch={repoData.defaultBranch} 
                      />
                      <TimeTravelSlider owner={owner} repo={repo} filePath={selectedFile} />
                    </div>
                  )}
                </GlassCard>
              </motion.div>
            ) : (
              <motion.div variants={itemVariants}>
                <GlassCard className="p-0 overflow-hidden">
                  <div className="divide-y divide-[var(--glass-border)]">
                    {filteredEntries.length > 0 ? filteredEntries.map((entry) => (
                      <div
                        key={entry.path}
                        className="flex items-center justify-between p-3 hover:bg-white/5 transition-colors cursor-pointer group"
                        onClick={() => entry.type === 'directory' ? setPath(entry.path) : setSelectedFile(entry.path)}
                      >
                        <div className="flex items-center gap-3 flex-1 min-w-0">
                          {entry.type === 'directory' ? (
                            <Folder size={18} className="text-[var(--brand-purple)] group-hover:scale-110 transition-transform shrink-0 fill-[var(--brand-purple)]/20" />
                          ) : (
                            <File size={18} className="text-[var(--text-muted)] group-hover:text-[var(--brand-primary)] transition-colors shrink-0" />
                          )}
                          <span className="font-mono text-[13px] font-medium text-[var(--text-main)] group-hover:text-white transition-colors truncate">
                            {entry.name}
                          </span>
                        </div>
                        <div className="flex items-center gap-6 text-[11px] font-mono text-[var(--text-muted)] shrink-0 hidden md:flex">
                          <span className="truncate max-w-[200px] opacity-60">System commit auto-generated</span>
                          <span className="w-20 text-right opacity-80">1h ago</span>
                        </div>
                      </div>
                    )) : (
                      <div className="p-12 text-center flex flex-col items-center justify-center">
                        <Search size={32} className="text-[var(--text-muted)] opacity-30 mb-4" />
                        <p className="text-sm font-mono text-[var(--text-muted)]">
                          {filesQuery.isError
                            ? (filesQuery.error?.response?.data?.message || 'Failed to load files')
                            : searchQuery
                              ? 'NO_MATCHING_ENTITIES_FOUND'
                              : 'DIRECTORY_IS_EMPTY'}
                        </p>
                      </div>
                    )}
                  </div>
                </GlassCard>

                {/* Readme Section */}
                {filesQuery.data?.readme && !searchQuery && (
                  <motion.div variants={itemVariants} className="mt-6">
                    <GlassCard className="p-0 overflow-hidden border-l-4 border-l-[var(--brand-purple)]">
                      <div className="px-6 py-4 border-b border-[var(--glass-border)] bg-black/40 flex items-center gap-2">
                        <FileText size={16} className="text-[var(--brand-purple)]" />
                        <h3 className="font-display font-bold text-sm tracking-wide">README.md</h3>
                      </div>
                      <div className="p-6 prose prose-invert prose-sm max-w-none">
                        <pre className="whitespace-pre-wrap font-mono text-[13px] bg-transparent p-0 text-[var(--text-main)] leading-relaxed">
                          {filesQuery.data.readme.content}
                        </pre>
                      </div>
                    </GlassCard>
                  </motion.div>
                )}
              </motion.div>
            )}
          </motion.div>
        )}
      </section>

      {/* Right Sidebar */}
      <aside className="space-y-6 hidden xl:block">
        <GlassCard className="p-5 relative overflow-hidden group border-t-[var(--brand-primary)]">
          <div className="absolute top-0 right-0 p-3 opacity-20 group-hover:opacity-100 transition-opacity">
            <Terminal size={48} className="text-[var(--brand-primary)]" />
          </div>
          <h3 className="font-display font-bold text-sm tracking-widest mb-3 text-white">ABOUT_NODE</h3>
          <p className="text-sm text-[var(--text-muted)] mb-5 leading-relaxed relative z-10">
            {repoData.description || 'No operational description provided.'}
          </p>
          
          {repoData.website && (
            <a href={repoData.website} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-sm font-mono text-[var(--brand-primary)] hover:text-white transition-colors mb-5 truncate relative z-10">
              <Globe size={14} />
              {repoData.website.replace(/^https?:\/\//, '')}
            </a>
          )}
          
          <div className="space-y-3 font-mono text-[13px] text-[var(--text-muted)] relative z-10">
            <div className="flex items-center justify-between py-1 border-b border-[var(--glass-border)]">
              <span className="flex items-center gap-2"><Star size={14} className="text-[var(--brand-warning)]" /> Stars</span>
              <span className="text-white font-bold">{repoData.starCount || 0}</span>
            </div>
            <div className="flex items-center justify-between py-1 border-b border-[var(--glass-border)]">
              <span className="flex items-center gap-2"><Code2 size={14} className="text-[var(--brand-success)]" /> Watching</span>
              <span className="text-white font-bold">{repoData.watcherCount || 0}</span>
            </div>
            <div className="flex items-center justify-between py-1 border-b border-[var(--glass-border)]">
              <span className="flex items-center gap-2"><GitBranch size={14} className="text-[var(--brand-purple)]" /> Forks</span>
              <span className="text-white font-bold">{repoData.forkCount || 0}</span>
            </div>
          </div>
        </GlassCard>

        {/* Quick Add File */}
        {!selectedFile && !isCreatingFile && !isUploadMode && (
          <GlassCard className="p-5 bg-gradient-to-br from-[var(--bg-main)] to-[var(--bg-tertiary)] border-[var(--glass-border)]">
            <h3 className="font-display font-bold text-sm tracking-widest mb-4">QUICK_INJECT</h3>
            <form className="space-y-3" onSubmit={(event) => { event.preventDefault(); createFileMutation.mutate(); }}>
              <CyberInput
                placeholder="path/to/file.ext"
                value={newFile.path}
                onChange={(event) => setNewFile((current) => ({ ...current, path: event.target.value }))}
                className="font-mono text-xs"
              />
              <textarea
                className="w-full bg-[var(--bg-main)]/50 border border-[var(--glass-border)] rounded-lg p-3 text-xs font-mono min-h-[120px] focus:border-[var(--brand-primary)] focus:ring-1 focus:ring-[var(--brand-primary)]/50 outline-none transition-all resize-none"
                placeholder="// Quick edit contents..."
                value={newFile.content}
                onChange={(event) => setNewFile((current) => ({ ...current, content: event.target.value }))}
              />
              <NeonButton variant="primary" className="w-full text-xs" disabled={createFileMutation.isPending || !newFile.path}>
                {createFileMutation.isPending ? 'UPLOADING...' : 'COMMIT_INJECTION'}
              </NeonButton>
            </form>
          </GlassCard>
        )}
      </aside>
    </div>
  );
};
