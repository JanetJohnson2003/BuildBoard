import React, { useState, useEffect } from 'react';
import Editor from '@monaco-editor/react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Play, Save, Terminal as TerminalIcon, XCircle, CheckCircle2 } from 'lucide-react';
import api from '../../lib/api';
import { NeonButton } from '../ui';

const languageByExtension = {
  js: 'javascript',
  jsx: 'javascript',
  ts: 'typescript',
  tsx: 'typescript',
  py: 'python',
  java: 'java',
  php: 'php',
  c: 'c',
  cpp: 'cpp',
  cs: 'csharp',
  go: 'go',
  rs: 'rust',
  md: 'markdown',
  json: 'json',
  html: 'html',
  css: 'css',
};

export const IDEEditor = ({ file, owner, repo, branch, onSaveSuccess }) => {
  const [code, setCode] = useState(file?.content || '');
  const [isModified, setIsModified] = useState(false);
  const [terminalOutput, setTerminalOutput] = useState('');
  const [isRunning, setIsRunning] = useState(false);
  const queryClient = useQueryClient();

  useEffect(() => {
    setCode(file?.content || '');
    setIsModified(false);
    setTerminalOutput('');
  }, [file]);

  const ext = file?.name?.split('.').pop()?.toLowerCase();
  const language = languageByExtension[ext] || 'plaintext';

  const saveMutation = useMutation({
    mutationFn: async () => {
      const res = await api.put(`/repos/${owner}/${repo}/file`, {
        path: file.path,
        content: code,
        message: `Update ${file.name} via WebIDE`,
        branch: branch || 'main'
      });
      return res.data;
    },
    onSuccess: () => {
      setIsModified(false);
      queryClient.invalidateQueries({ queryKey: ['repo-file', owner, repo, file.path] });
      queryClient.invalidateQueries({ queryKey: ['repo-files', owner, repo] });
      if (onSaveSuccess) onSaveSuccess();
    }
  });

  const runMutation = useMutation({
    mutationFn: async () => {
      const res = await api.post(`/repos/${owner}/${repo}/run`, {
        code,
        language
      });
      return res.data;
    },
    onSuccess: (data) => {
      let output = '';
      if (data.stdout) output += `${data.stdout}\n`;
      if (data.stderr) output += `[ERROR]\n${data.stderr}`;
      setTerminalOutput(output || 'Process exited with code 0 (No output)');
    },
    onError: (err) => {
      setTerminalOutput(`[SYSTEM ERROR]\n${err.response?.data?.message || err.message}`);
    }
  });

  const handleEditorChange = (value) => {
    setCode(value);
    setIsModified(value !== file?.content);
  };

  const handleRun = () => {
    setTerminalOutput('Executing code in secure container...');
    runMutation.mutate();
  };

  if (!file) return null;

  if (file.mimeType?.startsWith('image/') || ext === 'pdf') {
    return (
      <div className="p-12 text-center flex flex-col items-center justify-center bg-[var(--bg-main)]">
        <p className="text-sm text-[var(--text-muted)] font-mono">Binary/Image files cannot be edited in WebIDE.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-[700px] border-t border-[var(--glass-border)] bg-[#1e1e1e]">
      {/* IDE Toolbar */}
      <div className="flex items-center justify-between px-4 py-2 bg-[#2d2d2d] border-b border-[#3c3c3c]">
        <div className="flex items-center gap-3">
          <span className="text-xs font-mono text-gray-300 flex items-center gap-2">
            Language: <span className="text-[var(--brand-primary)] font-bold">{language}</span>
          </span>
          {isModified && (
            <span className="text-xs font-mono text-[var(--brand-warning)] flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-[var(--brand-warning)] animate-pulse" /> Unsaved Changes
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <NeonButton 
            variant="ghost" 
            className={`py-1 px-3 text-xs flex items-center gap-1 border-[var(--brand-success)]/30 ${isModified ? 'text-[var(--brand-success)]' : 'text-gray-500'}`}
            onClick={() => saveMutation.mutate()}
            disabled={!isModified || saveMutation.isPending}
          >
            {saveMutation.isPending ? 'SAVING...' : <><Save size={12} /> SAVE_FILE</>}
          </NeonButton>
          
          {(language === 'javascript' || language === 'typescript' || language === 'python') && (
            <NeonButton 
              variant="primary" 
              className="py-1 px-3 text-xs flex items-center gap-1 bg-[var(--brand-primary)] text-black font-bold"
              onClick={handleRun}
              disabled={runMutation.isPending}
            >
              {runMutation.isPending ? 'EXECUTING...' : <><Play size={12} /> RUN_CODE</>}
            </NeonButton>
          )}
        </div>
      </div>

      {/* Editor Space */}
      <div className="flex-1 relative">
        <Editor
          height="100%"
          language={language}
          theme="vs-dark"
          value={code}
          onChange={handleEditorChange}
          options={{
            minimap: { enabled: false },
            fontSize: 14,
            fontFamily: 'JetBrains Mono, Fira Code, monospace',
            scrollBeyondLastLine: false,
            smoothScrolling: true,
            cursorBlinking: 'smooth',
            cursorSmoothCaretAnimation: true,
            formatOnPaste: true,
          }}
          loading={<div className="h-full flex items-center justify-center text-gray-400 font-mono text-sm">INITIALIZING_MONACO_ENGINE...</div>}
        />
      </div>

      {/* Terminal Area */}
      <div className="h-48 border-t border-[#3c3c3c] bg-[#1e1e1e] flex flex-col">
        <div className="px-3 py-1.5 bg-[#252526] border-b border-[#3c3c3c] flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs font-mono text-gray-300">
            <TerminalIcon size={12} className="text-[var(--brand-primary)]" />
            NEXUS_TERMINAL_OUTPUT
          </div>
          {terminalOutput && (
            <button onClick={() => setTerminalOutput('')} className="text-gray-500 hover:text-white transition-colors">
              <XCircle size={14} />
            </button>
          )}
        </div>
        <div className="flex-1 p-3 overflow-y-auto cyber-scrollbar font-mono text-[13px] text-gray-300 whitespace-pre-wrap">
          {terminalOutput ? (
             <span className={terminalOutput.includes('[ERROR]') || terminalOutput.includes('[SYSTEM ERROR]') ? 'text-red-400' : 'text-gray-300'}>
               {terminalOutput}
             </span>
          ) : (
            <span className="text-gray-600 italic">No execution output. Awaiting RUN command...</span>
          )}
        </div>
      </div>
    </div>
  );
};
