import React, { useState, useEffect } from 'react';
import Editor from '@monaco-editor/react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Play, Save, Terminal as TerminalIcon, XCircle, CheckCircle2, Workflow, Code2 } from 'lucide-react';
import api from '../../lib/api';
import { NeonButton, GlassCard } from '../ui';
import { useAuth } from '../../context/AuthContext';
import { io } from 'socket.io-client';
import mermaid from 'mermaid';

const SOCKET_URL = import.meta.env.VITE_API_URL ? import.meta.env.VITE_API_URL.replace('/api', '') : '';

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
  const { user } = useAuth();
  const [socket, setSocket] = useState(null);
  const [activeUsers, setActiveUsers] = useState([]);
  const [roomId, setRoomId] = useState('');
  const [flowchartCode, setFlowchartCode] = useState('');
  const [isGeneratingFlow, setIsGeneratingFlow] = useState(false);
  const [generatedTests, setGeneratedTests] = useState('');
  const [isGeneratingTests, setIsGeneratingTests] = useState(false);
  const [isAutoFixing, setIsAutoFixing] = useState(false);

  useEffect(() => {
    mermaid.initialize({ startOnLoad: true, theme: 'dark' });
  }, []);

  useEffect(() => {
    setCode(file?.content || '');
    setIsModified(false);
    setTerminalOutput('');
  }, [file]);

  useEffect(() => {
    if (!file || !user) return;
    const newSocket = io(SOCKET_URL);
    const id = `ide-${owner}-${repo}-${branch || 'main'}-${file.path}`;
    setRoomId(id);

    newSocket.emit('ide:join', { roomId: id, username: user.username });

    newSocket.on('ide:users', (users) => {
      setActiveUsers(users.filter(u => u !== user.username));
    });

    newSocket.on('ide:update', ({ content, username }) => {
      if (username !== user.username) {
        setCode(content);
        setIsModified(true);
      }
    });

    setSocket(newSocket);

    return () => {
      newSocket.emit('ide:leave', { roomId: id });
      newSocket.disconnect();
    };
  }, [file, owner, repo, branch, user]);

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
    if (socket && roomId) {
      socket.emit('ide:change', { roomId, content: value, username: user?.username });
    }
  };

  const handleExplain = async () => {
    setIsGeneratingFlow(true);
    setFlowchartCode('');
    try {
      const res = await api.post(`/ai/${owner}/${repo}/flowchart`, { code });
      setFlowchartCode(res.data.mermaid);
      // Wait for React to render the div, then init mermaid
      setTimeout(() => {
        mermaid.contentLoaded();
      }, 100);
    } catch (e) {
      setTerminalOutput(`[AI ERROR]\n${e.response?.data?.message || e.message}`);
    } finally {
      setIsGeneratingFlow(false);
    }
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

  const handleGenerateTests = async () => {
    setIsGeneratingTests(true);
    setGeneratedTests('');
    try {
      const res = await api.post(`/ai/${owner}/${repo}/generate-tests`, {
        code,
        language
      });
      setGeneratedTests(res.data.testCode);
    } catch (e) {
      alert('Failed to generate tests');
    } finally {
      setIsGeneratingTests(false);
    }
  };

  const handleAutoFix = async () => {
    setIsAutoFixing(true);
    try {
      const res = await api.post(`/ai/${owner}/${repo}/auto-fix`, {
        code,
        language,
        errorMessage: terminalOutput
      });
      setCode(res.data.fixedCode);
      setIsModified(true);
      setTerminalOutput(prev => prev + '\n\n[SYSTEM] Code automatically patched by AI Auto-Fixer.');
    } catch (e) {
      alert('Failed to auto-fix code');
    } finally {
      setIsAutoFixing(false);
    }
  };

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
          {activeUsers.length > 0 && (
            <div className="flex items-center gap-2 ml-4">
               <span className="text-xs font-mono text-[var(--brand-success)]">Nexus Collab Active:</span>
               <div className="flex -space-x-2">
                 {activeUsers.map(u => (
                   <img key={u} src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${u}`} className="w-6 h-6 rounded-full border border-[#2d2d2d]" title={u} alt={u} />
                 ))}
               </div>
            </div>
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
          
          <NeonButton 
            variant="ghost" 
            className="py-1 px-3 text-xs flex items-center gap-1 border-[var(--brand-purple)]/30 text-[var(--brand-purple)]"
            onClick={handleExplain}
            disabled={isGeneratingFlow}
          >
            {isGeneratingFlow ? 'GENERATING...' : <><Workflow size={12} /> EXPLAIN_WITH_AI</>}
          </NeonButton>
          
          <NeonButton 
            variant="ghost" 
            className="py-1 px-3 text-xs flex items-center gap-1 border-[var(--brand-warning)]/30 text-[var(--brand-warning)]"
            onClick={handleGenerateTests}
            disabled={isGeneratingTests || !code}
          >
            {isGeneratingTests ? 'GENERATING...' : <><Code2 size={12} /> GENERATE TESTS</>}
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
      <div className="flex-1 relative flex">
        <div className={(flowchartCode || generatedTests) ? "w-1/2 border-r border-[#3c3c3c]" : "w-full"}>
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
        {flowchartCode && (
          <div className="w-1/2 bg-[#1e1e1e] p-4 overflow-auto flex flex-col items-center">
            <div className="flex w-full justify-between items-center mb-4 border-b border-[#3c3c3c] pb-2">
              <span className="text-[var(--brand-purple)] font-bold text-sm flex items-center gap-2"><Workflow size={14} /> AI Flowchart</span>
              <button onClick={() => setFlowchartCode('')} className="text-gray-500 hover:text-white">
                <XCircle size={14} />
              </button>
            </div>
            <div className="mermaid">
              {flowchartCode}
            </div>
          </div>
        )}
        {generatedTests && (
          <div className="w-1/2 bg-[#1e1e1e] flex flex-col border-l border-[#3c3c3c]">
            <div className="flex w-full justify-between items-center px-4 py-2 border-b border-[#3c3c3c]">
              <span className="text-[var(--brand-warning)] font-bold text-sm flex items-center gap-2"><Code2 size={14} /> Generated Tests</span>
              <button onClick={() => setGeneratedTests('')} className="text-gray-500 hover:text-white">
                <XCircle size={14} />
              </button>
            </div>
            <div className="flex-1">
              <Editor
                height="100%"
                language={language}
                theme="vs-dark"
                value={generatedTests}
                options={{
                  readOnly: true,
                  minimap: { enabled: false },
                  fontSize: 14,
                  fontFamily: 'JetBrains Mono, Fira Code, monospace',
                  scrollBeyondLastLine: false,
                }}
              />
            </div>
          </div>
        )}
      </div>

      {/* Terminal Area */}
      <div className="h-48 border-t border-[#3c3c3c] bg-[#1e1e1e] flex flex-col">
        <div className="px-3 py-1.5 bg-[#252526] border-b border-[#3c3c3c] flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 text-xs font-mono text-gray-300">
              <TerminalIcon size={12} className="text-[var(--brand-primary)]" />
              NEXUS_TERMINAL_OUTPUT
            </div>
            {(terminalOutput.includes('[ERROR]') || terminalOutput.includes('[SYSTEM ERROR]') || terminalOutput.toLowerCase().includes('error') || terminalOutput.toLowerCase().includes('exception')) && (
              <NeonButton 
                variant="danger" 
                size="sm" 
                className="py-0.5 px-2 text-[10px] animate-pulse"
                onClick={handleAutoFix}
                disabled={isAutoFixing}
              >
                {isAutoFixing ? 'PATCHING...' : 'AUTO-FIX WITH AI'}
              </NeonButton>
            )}
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
