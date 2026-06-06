import React, { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Editor } from '@monaco-editor/react';
import { 
  Files, Search, GitBranch, Play, Bug, LayoutGrid, Settings as SettingsIcon, 
  ChevronRight, ChevronDown, Plus, X, MessageSquare, Terminal as TerminalIcon, 
  MoreHorizontal, PlayCircle, SplitSquareHorizontal, PanelBottom, AlertTriangle,
  FilePlus, FolderPlus, RefreshCw, Copy, Folder, FolderOpen, Save, CircleX
} from 'lucide-react';
import api from '../lib/api';
import { useAuth } from '../context/AuthContext';
import { Terminal } from 'xterm';
import { FitAddon } from '@xterm/addon-fit';
import 'xterm/css/xterm.css';

const Notepad = () => {
  const { user } = useAuth();
  const [nodes, setNodes] = useState([]);
  const [activeFileId, setActiveFileId] = useState(null);
  const [openedFiles, setOpenedFiles] = useState([]);
  const [isExecuting, setIsExecuting] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  
  // Layout States
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [rightSidebarOpen, setRightSidebarOpen] = useState(true);
  const [bottomPanelOpen, setBottomPanelOpen] = useState(true);
  
  // Tab States
  const [activeBottomTab, setActiveBottomTab] = useState('TERMINAL');

  // File Creation States
  const [hoveredNodeId, setHoveredNodeId] = useState(null);
  const [creatingNode, setCreatingNode] = useState(null);
  const [creatingName, setCreatingName] = useState('');
  const [activeActivity, setActiveActivity] = useState('EXPLORER'); // EXPLORER, SEARCH, SCM, RUN, DEBUG
  const [activeMenu, setActiveMenu] = useState(null); // File, Edit, View, Run, Terminal
  
  // Content States
  const [chatInput, setChatInput] = useState('');
  const [chatMessages, setChatMessages] = useState([
    { role: 'assistant', text: 'Welcome to BuildBoard AI Copilot. How can I assist you with your code today?' }
  ]);
  
  // AI Settings States
  const [aiProvider, setAiProvider] = useState(() => localStorage.getItem('bb_ai_provider') || 'gemini');
  const [aiApiKey, setAiApiKey] = useState(() => localStorage.getItem('bb_ai_key') || '');
  const [showAiSettings, setShowAiSettings] = useState(false);

  const [cursorPosition, setCursorPosition] = useState({ ln: 1, col: 1 });
  const [markerCount, setMarkerCount] = useState({ errors: 0, warnings: 0 });
  const [mockOutputLines, setMockOutputLines] = useState(['IDE Initialized.']);

  const editorRef = useRef(null);
  const terminalRef = useRef(null);
  const xtermRef = useRef(null);
  const fitAddonRef = useRef(null);

  const files = nodes.filter(n => n.type === 'file');
  const activeFile = files.find(f => f.id === activeFileId);

  // Close menus when clicking outside
  useEffect(() => {
    const handleClickOutside = () => setActiveMenu(null);
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, []);

  // Initialize Terminal
  useEffect(() => {
    if (bottomPanelOpen && activeBottomTab === 'TERMINAL' && terminalRef.current && !xtermRef.current) {
      try {
        const term = new Terminal({
          theme: { background: '#1e1e1e' },
          fontFamily: "'Consolas', 'Courier New', monospace",
          fontSize: 14,
          cursorBlink: true
        });
        const fitAddon = new FitAddon();
        term.loadAddon(fitAddon);
        term.open(terminalRef.current);
        
        xtermRef.current = term;
        fitAddonRef.current = fitAddon;
        
        try { fitAddon.fit(); } catch (e) { console.warn('xterm fit failed', e); }
        
        const prompt = () => {
          term.write('\r\n\x1b[32muser@buildboard\x1b[0m:\x1b[34m~\x1b[0m$ ');
        };
        
        // Expose prompt to window so other functions can call it
        window.printTerminalPrompt = prompt;
        
        term.writeln('\x1b[36mBuildBoard+ WebIDE Terminal Initialized.\x1b[0m');
        term.writeln('Type "help" to see available commands.');
        prompt();

        let commandBuffer = '';
        term.onData(e => {
          switch (e) {
            case '\r': // Enter
              const cmd = commandBuffer.trim();
              commandBuffer = '';
              if (cmd === 'clear') {
                term.clear();
                prompt();
              } else if (cmd === 'help') {
                term.writeln('\r\nAvailable commands:');
                term.writeln('  help  - show this help message');
                term.writeln('  clear - clear the terminal');
                term.writeln('  echo  - print arguments');
                term.writeln('  run   - run the currently active file');
                prompt();
              } else if (cmd.startsWith('echo ')) {
                term.writeln('\r\n' + cmd.substring(5));
                prompt();
              } else if (cmd === 'run') {
                 term.writeln(''); // new line before running
                 window.dispatchEvent(new CustomEvent('terminal-run-code'));
              } else if (cmd.length > 0) {
                term.writeln(`\r\nbuildboard: command not found: ${cmd}`);
                prompt();
              } else {
                prompt();
              }
              break;
            case '\u007F': // Backspace (DEL)
              if (commandBuffer.length > 0) {
                commandBuffer = commandBuffer.slice(0, -1);
                term.write('\b \b');
              }
              break;
            default: // Printable characters
              if (e >= String.fromCharCode(0x20) && e <= String.fromCharCode(0x7E) || e >= '\u00a0') {
                commandBuffer += e;
                term.write(e);
              }
          }
        });
      } catch (err) {
        console.error('Terminal initialization failed:', err);
      }
    }
    
    if (bottomPanelOpen && activeBottomTab === 'TERMINAL' && fitAddonRef.current) {
      setTimeout(() => {
        try { fitAddonRef.current.fit(); } catch (e) {}
      }, 100);
    }
  }, [bottomPanelOpen, activeBottomTab]);

  // Handle Resize
  useEffect(() => {
    const handleResize = () => {
      if (fitAddonRef.current) fitAddonRef.current.fit();
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Fetch Repositories on Mount
  useEffect(() => {
    if (!user) return;
    const fetchRepos = async () => {
      try {
        setMockOutputLines(prev => [...prev, 'Fetching repositories...']);
        const { data } = await api.get('/repos/my');
        const repos = Array.isArray(data) ? data : (data.repositories || []);
        const repoNodes = repos.map(repo => ({
          id: `repo_${repo.slug}`,
          name: repo.name,
          slug: repo.slug,
          owner: repo.owner.username,
          type: 'folder',
          parentId: null,
          isOpen: false,
          isLoaded: false
        }));
        setNodes(repoNodes);
        setMockOutputLines(prev => [...prev, `Found ${repoNodes.length} repositories.`]);
      } catch (err) {
        console.error('Failed to fetch repos', err);
        setMockOutputLines(prev => [...prev, '[ERROR] Failed to fetch repositories.']);
      }
    };
    fetchRepos();
  }, [user]);

  const handleEditorDidMount = (editor, monaco) => {
    editorRef.current = editor;
    
    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyS, () => {
      handleSaveFile();
    });
    
    editor.onDidChangeCursorPosition((e) => {
      setCursorPosition({ ln: e.position.lineNumber, col: e.position.column });
    });
    
    monaco.editor.onDidChangeMarkers(() => {
      const markers = monaco.editor.getModelMarkers({});
      const errors = markers.filter(m => m.severity === monaco.MarkerSeverity.Error).length;
      const warnings = markers.filter(m => m.severity === monaco.MarkerSeverity.Warning).length;
      setMarkerCount({ errors, warnings });
    });
  };

  const handleFileContentChange = (value) => {
    setNodes(nodes.map(n => n.id === activeFileId ? { ...n, content: value, isDirty: true } : n));
  };

  const handleSaveFile = async () => {
    if (!activeFile) return;
    setIsSaving(true);
    try {
      await api.put(`/repos/${activeFile.owner}/${activeFile.repoSlug}/file`, {
        path: activeFile.path,
        content: activeFile.content,
        message: `Update ${activeFile.name} from WebIDE`
      });
      setNodes(nodes.map(n => n.id === activeFileId ? { ...n, isDirty: false } : n));
      
      const msg = `Saved ${activeFile.path}`;
      if (xtermRef.current) xtermRef.current.writeln(`\x1b[32m[${new Date().toLocaleTimeString()}] ${msg}\x1b[0m`);
      setMockOutputLines(prev => [...prev, `[${new Date().toLocaleTimeString()}] ${msg}`]);
    } catch (err) {
      const errM = err.response?.data?.message || err.message;
      if (xtermRef.current) xtermRef.current.writeln(`\x1b[31m[ERROR] Failed to save file: ${errM}\x1b[0m`);
      setMockOutputLines(prev => [...prev, `[ERROR] Failed to save file: ${errM}`]);
    } finally {
      setIsSaving(false);
    }
  };

  const handleRunCode = async () => {
    if (!activeFile || (activeFile.language !== 'javascript' && activeFile.language !== 'python')) {
      if (xtermRef.current) {
        xtermRef.current.writeln('\x1b[31m[ERROR] Cannot execute this file type. Please run a JavaScript or Python file.\x1b[0m');
        if (window.printTerminalPrompt) window.printTerminalPrompt();
      }
      setActiveBottomTab('TERMINAL');
      setBottomPanelOpen(true);
      return;
    }

    setIsExecuting(true);
    setActiveBottomTab('TERMINAL');
    setBottomPanelOpen(true);

    if (xtermRef.current) {
      xtermRef.current.writeln('');
      xtermRef.current.writeln(`\x1b[33m> Executing ${activeFile.name}...\x1b[0m`);
    }

    try {
      const response = await api.post('/platform/execute', {
        code: activeFile.content,
        language: activeFile.language
      });
      
      const { stdout, stderr } = response.data;
      if (xtermRef.current) {
        if (stderr) {
          stderr.split('\n').forEach(l => xtermRef.current.writeln(`\x1b[31m${l}\x1b[0m`));
        } else {
          stdout.split('\n').forEach(l => xtermRef.current.writeln(l));
        }
        xtermRef.current.writeln(`\x1b[90m[Process exited]\x1b[0m`);
        if (window.printTerminalPrompt) window.printTerminalPrompt();
      }
    } catch (err) {
      if (xtermRef.current) {
        xtermRef.current.writeln(`\x1b[31m[EXECUTION FAILED] ${err.response?.data?.message || err.message}\x1b[0m`);
        if (window.printTerminalPrompt) window.printTerminalPrompt();
      }
    } finally {
      setIsExecuting(false);
    }
  };

  useEffect(() => {
    const handleTerminalRun = () => handleRunCode();
    window.addEventListener('terminal-run-code', handleTerminalRun);
    return () => window.removeEventListener('terminal-run-code', handleTerminalRun);
  }, [activeFile, handleRunCode]);

  const openFile = async (node) => {
    if (node.type !== 'file') return;
    
    if (!openedFiles.includes(node.id)) {
      setOpenedFiles([...openedFiles, node.id]);
    }
    setActiveFileId(node.id);

    if (node.content === undefined) {
      setMockOutputLines(prev => [...prev, `Loading file ${node.path}...`]);
      try {
        const { data } = await api.get(`/repos/${node.owner}/${node.repoSlug}/file?path=${node.path}`);
        setNodes(prev => prev.map(n => n.id === node.id ? { ...n, content: data.content || '', language: languageFromFile(data.name) } : n));
        setMockOutputLines(prev => [...prev, `Loaded ${node.path}.`]);
      } catch (err) {
        console.error('Failed to load file content', err);
        setMockOutputLines(prev => [...prev, `[ERROR] Failed to load ${node.path}.`]);
      }
    }
  };

  const closeFile = (e, id) => {
    e.stopPropagation();
    const newOpened = openedFiles.filter(fid => fid !== id);
    setOpenedFiles(newOpened);
    if (activeFileId === id) {
      setActiveFileId(newOpened.length > 0 ? newOpened[newOpened.length - 1] : null);
    }
  };

  const toggleFolder = async (node) => {
    if (node.type !== 'folder') return;
    setNodes(prev => prev.map(n => n.id === node.id ? { ...n, isOpen: !n.isOpen } : n));

    if (!node.isLoaded) {
      setMockOutputLines(prev => [...prev, `Fetching tree for ${node.name}...`]);
      try {
        let repoSlug = node.repoSlug || node.slug;
        let owner = node.owner;
        let pathQuery = node.path || '';
        
        const { data } = await api.get(`/repos/${owner}/${repoSlug}/files?path=${pathQuery}`);
        
        const newNodes = (data.entries || []).map(entry => ({
          id: `${repoSlug}:${entry.path}`,
          name: entry.name,
          path: entry.path,
          type: entry.type === 'directory' ? 'folder' : 'file',
          repoSlug: repoSlug,
          owner: owner,
          parentId: node.id,
          isOpen: false,
          isLoaded: false
        }));

        setNodes(prev => {
          const updatedPrev = prev.map(n => n.id === node.id ? { ...n, isLoaded: true } : n);
          const existingIds = new Set(updatedPrev.map(n => n.id));
          const filteredNew = newNodes.filter(n => !existingIds.has(n.id));
          return [...updatedPrev, ...filteredNew];
        });
      } catch (err) {
        console.error('Failed to fetch folder contents', err);
        setMockOutputLines(prev => [...prev, `[ERROR] Failed to fetch tree for ${node.name}.`]);
      }
    }
  };

  const handleChatSubmit = async (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (!chatInput.trim()) return;
      
      const msg = chatInput.trim();
      setChatInput('');
      setChatMessages(prev => [...prev, { role: 'user', text: msg }]);

      try {
        const repoOwner = activeFile?.owner || user?.username;
        const repoName = activeFile?.repoSlug;

        if (!repoName) {
           setChatMessages(prev => [...prev, { role: 'assistant', text: 'Please open a file from a repository first so I have context!' }]);
           return;
        }

        setChatMessages(prev => [...prev, { role: 'assistant', text: '...' }]);
        
        const { data } = await api.post(`/ai/${repoOwner}/${repoName}/ide-chat`, { 
          prompt: msg,
          activeFile: activeFile?.name,
          activeContent: activeFile?.content,
          provider: aiProvider,
          apiKey: aiApiKey
        });
        
        setChatMessages(prev => {
          const updated = [...prev];
          updated.pop();
          updated.push({ role: 'assistant', text: data.text });
          return updated;
        });
      } catch (err) {
        setChatMessages(prev => {
          const updated = [...prev];
          updated.pop();
          updated.push({ role: 'assistant', text: `Error: ${err.response?.data?.message || err.message}` });
          return updated;
        });
      }
    }
  };

  const toggleMenu = (e, menuName) => {
    e.stopPropagation();
    setActiveMenu(activeMenu === menuName ? null : menuName);
  };

  const languageFromFile = (filename) => {
    const ext = filename.split('.').pop().toLowerCase();
    const map = {
      'js': 'javascript',
      'jsx': 'javascript',
      'py': 'python',
      'md': 'markdown',
      'json': 'json',
      'html': 'html',
      'css': 'css'
    };
    return map[ext] || 'plaintext';
  };



  const handleCreateSubmit = async (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (!creatingName.trim()) {
        setCreatingNode(null);
        setCreatingName('');
        return;
      }
      
      const parentNode = nodes.find(n => n.id === creatingNode.parentId);
      if (!parentNode) return;
      
      const repoSlug = parentNode.repoSlug || parentNode.slug;
      const owner = parentNode.owner;
      const parentPath = parentNode.path ? `${parentNode.path}/` : '';
      const newName = creatingName.trim();
      let targetPath = `${parentPath}${newName}`;
      
      if (creatingNode.type === 'folder') {
        targetPath = `${targetPath}/.gitkeep`; 
      }

      try {
        setMockOutputLines(prev => [...prev, `Creating ${creatingNode.type} ${newName}...`]);
        await api.put(`/repos/${owner}/${repoSlug}/file`, {
          path: targetPath,
          content: '',
          message: `Create ${creatingNode.type} ${newName}`
        });
        
        const newLocalNode = {
          id: `${repoSlug}:${targetPath}`,
          name: newName,
          path: creatingNode.type === 'folder' ? `${parentPath}${newName}` : targetPath,
          type: creatingNode.type,
          repoSlug,
          owner,
          parentId: parentNode.id,
          isOpen: false,
          isLoaded: false
        };
        
        setNodes(prev => [...prev, newLocalNode]);
        if (!parentNode.isOpen) {
          setNodes(prev => prev.map(n => n.id === parentNode.id ? { ...n, isOpen: true } : n));
        }

        setMockOutputLines(prev => [...prev, `Successfully created ${newName}.`]);
      } catch (err) {
        console.error('Failed to create', err);
        setMockOutputLines(prev => [...prev, `[ERROR] Failed to create ${newName}.`]);
      } finally {
        setCreatingNode(null);
        setCreatingName('');
      }
    } else if (e.key === 'Escape') {
      setCreatingNode(null);
      setCreatingName('');
    }
  };

  const renderTree = (parentId, level) => {
    return nodes
      .filter(n => n.parentId === parentId)
      .sort((a, b) => {
        if (a.type !== b.type) return a.type === 'folder' ? -1 : 1;
        return a.name.localeCompare(b.name);
      })
      .map(node => (
        <div key={node.id}>
          <div
            onMouseEnter={() => setHoveredNodeId(node.id)}
            onMouseLeave={() => setHoveredNodeId(null)}
            onClick={() => node.type === 'folder' ? toggleFolder(node) : openFile(node)}
            className={`flex items-center justify-between py-0.5 cursor-pointer hover:bg-[#37373d] ${activeFileId === node.id && node.type === 'file' ? 'bg-[#37373d] text-white' : 'text-[#cccccc]'}`}
            style={{ paddingLeft: `${level * 12}px` }}
          >
            <div className="flex items-center overflow-hidden flex-1">
              {node.type === 'folder' ? (
                <>
                  <div className="w-4 flex justify-center shrink-0">
                    {node.isOpen ? <ChevronDown size={14} className="text-gray-400" /> : <ChevronRight size={14} className="text-gray-400" />}
                  </div>
                  {node.isOpen ? <FolderOpen size={14} className="mr-1.5 text-blue-300 shrink-0" /> : <Folder size={14} className="mr-1.5 text-blue-300 shrink-0" />}
                  <span className="text-sm truncate">{node.name}</span>
                </>
              ) : (
                <>
                  <div className="w-4 flex justify-center text-xs ml-1 shrink-0">
                    {node.language === 'javascript' && <span className="text-yellow-400 font-bold">JS</span>}
                    {node.language === 'python' && <span className="text-blue-400 font-bold">PY</span>}
                    {node.language === 'markdown' && <span className="text-blue-300 font-bold">i</span>}
                  </div>
                  <span className="text-sm truncate ml-1">{node.name}</span>
                </>
              )}
            </div>

            {node.type === 'folder' && hoveredNodeId === node.id && (
              <div className="flex items-center pr-2 gap-1 shrink-0">
                <FilePlus size={14} className="text-gray-400 hover:text-white" onClick={(e) => { e.stopPropagation(); setCreatingNode({ parentId: node.id, type: 'file' }); setNodes(prev => prev.map(n => n.id === node.id ? { ...n, isOpen: true } : n)); }} />
                <FolderPlus size={14} className="text-gray-400 hover:text-white" onClick={(e) => { e.stopPropagation(); setCreatingNode({ parentId: node.id, type: 'folder' }); setNodes(prev => prev.map(n => n.id === node.id ? { ...n, isOpen: true } : n)); }} />
              </div>
            )}
          </div>
          {node.type === 'folder' && node.isOpen && (
            <div>
              {creatingNode?.parentId === node.id && (
                 <div className="flex items-center py-0.5" style={{ paddingLeft: `${(level + 1) * 12}px` }}>
                   <div className="w-4 flex justify-center shrink-0 ml-1">
                      {creatingNode.type === 'folder' ? <Folder size={14} className="text-blue-300" /> : <FilePlus size={14} className="text-gray-400" />}
                   </div>
                   <input
                     autoFocus
                     type="text"
                     value={creatingName}
                     onChange={e => setCreatingName(e.target.value)}
                     onKeyDown={handleCreateSubmit}
                     onBlur={() => { setCreatingNode(null); setCreatingName(''); }}
                     className="ml-1.5 bg-[#3c3c3c] text-[#cccccc] text-xs px-1 rounded outline-none border border-[#007acc] w-32"
                   />
                 </div>
              )}
              {renderTree(node.id, level + 1)}
            </div>
          )}
        </div>
      ));
  };

  const renderDropdown = (menuName, items) => {
    if (activeMenu !== menuName) return null;
    return (
      <div className="absolute top-full left-0 mt-1 w-48 bg-[#252526] border border-[#454545] shadow-lg rounded py-1 z-50 text-[#cccccc] text-xs">
        {items.map((item, i) => {
          if (item === 'DIVIDER') return <div key={i} className="border-t border-[#454545] my-1"></div>;
          return (
            <div 
              key={i} 
              className="px-4 py-1.5 hover:bg-[#007acc] hover:text-white cursor-pointer flex justify-between"
              onClick={() => { setActiveMenu(null); item.action(); }}
            >
              <span>{item.label}</span>
              {item.shortcut && <span className="text-gray-500">{item.shortcut}</span>}
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <div className="h-[calc(100vh-60px)] w-full flex flex-col font-sans overflow-hidden bg-[var(--bg-main)] text-[var(--text-main)]">
      
      {/* Top Menu Bar */}
      <div className="h-8 flex items-center justify-between px-2 text-[13px] border-b border-[var(--border-main)] glass-panel rounded-none shadow-none z-10">
        <div className="flex items-center gap-4">
          <div className="flex gap-2 text-[var(--text-muted)] ml-2">
            
            <div className="relative">
              <span onClick={(e) => toggleMenu(e, 'File')} className={`hover:text-[var(--text-accent)] hover:bg-white/5 px-1.5 py-0.5 rounded cursor-pointer transition-colors ${activeMenu === 'File' ? 'bg-white/10 text-white neon-text' : ''}`}>File</span>
              {renderDropdown('File', [
                { label: 'New File', action: () => alert('Use the file explorer to create files') },
                { label: 'Save', shortcut: 'Ctrl+S', action: handleSaveFile },
                'DIVIDER',
                { label: 'Close Editor', action: () => { if (activeFile) closeFile(new Event('click'), activeFile.id); } }
              ])}
            </div>

            <div className="relative">
              <span onClick={(e) => toggleMenu(e, 'Edit')} className={`hover:bg-white/10 px-1.5 py-0.5 rounded cursor-pointer ${activeMenu === 'Edit' ? 'bg-white/10 text-white' : ''}`}>Edit</span>
              {renderDropdown('Edit', [
                { label: 'Undo', shortcut: 'Ctrl+Z', action: () => editorRef.current?.trigger('source', 'undo', null) },
                { label: 'Redo', shortcut: 'Ctrl+Y', action: () => editorRef.current?.trigger('source', 'redo', null) },
                'DIVIDER',
                { label: 'Find', shortcut: 'Ctrl+F', action: () => editorRef.current?.trigger('source', 'actions.find', null) }
              ])}
            </div>

            <div className="relative">
              <span onClick={(e) => toggleMenu(e, 'View')} className={`hover:bg-white/10 px-1.5 py-0.5 rounded cursor-pointer ${activeMenu === 'View' ? 'bg-white/10 text-white' : ''}`}>View</span>
              {renderDropdown('View', [
                { label: 'Toggle Primary Sidebar', action: () => setSidebarOpen(!sidebarOpen) },
                { label: 'Toggle Bottom Panel', action: () => setBottomPanelOpen(!bottomPanelOpen) },
                { label: 'Toggle Chat Panel', action: () => setRightSidebarOpen(!rightSidebarOpen) }
              ])}
            </div>

            <div className="relative">
              <span onClick={(e) => toggleMenu(e, 'Run')} className={`hover:bg-white/10 px-1.5 py-0.5 rounded cursor-pointer ${activeMenu === 'Run' ? 'bg-white/10 text-white' : ''}`}>Run</span>
              {renderDropdown('Run', [
                { label: 'Run Code', action: handleRunCode }
              ])}
            </div>

            <div className="relative">
              <span onClick={(e) => toggleMenu(e, 'Terminal')} className={`hover:bg-white/10 px-1.5 py-0.5 rounded cursor-pointer ${activeMenu === 'Terminal' ? 'bg-white/10 text-white' : ''}`}>Terminal</span>
              {renderDropdown('Terminal', [
                { label: 'New Terminal', action: () => { setBottomPanelOpen(true); setActiveBottomTab('TERMINAL'); } },
                { label: 'Clear Terminal', action: () => xtermRef.current?.clear() }
              ])}
            </div>

          </div>
        </div>
        
        {/* Removed Search Bar */}
        <div className="flex-1"></div>

        <div className="flex items-center gap-3 pr-2">
          {!user && (
            <div className="flex items-center gap-2">
              <button onClick={() => window.location.href='/login'} className="bg-[var(--brand-primary)] text-black px-3 py-0.5 rounded text-xs font-bold hover:shadow-[0_0_10px_var(--brand-primary)] transition-shadow">Sign In</button>
            </div>
          )}
          <div className="flex gap-3 text-[var(--text-muted)]">
            <LayoutGrid size={16} className="cursor-pointer hover:text-white" onClick={() => { setSidebarOpen(!sidebarOpen); setActiveActivity('EXPLORER'); }} />
            <PanelBottom size={16} className={`cursor-pointer hover:text-white ${bottomPanelOpen ? 'text-white' : ''}`} onClick={() => setBottomPanelOpen(!bottomPanelOpen)} />
            <SplitSquareHorizontal size={16} className={`cursor-pointer hover:text-white ${rightSidebarOpen ? 'text-white' : ''}`} onClick={() => setRightSidebarOpen(!rightSidebarOpen)} />
          </div>
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* Removed Activity Bar */}

        {/* Primary Sidebar (Explorer) */}
        {sidebarOpen && (
          <div className="w-64 border-r border-[var(--border-main)] flex flex-col bg-[var(--bg-subtle)] z-0">
            <div className="h-9 flex items-center px-4 text-xs font-semibold tracking-wider text-[var(--text-muted)] uppercase">
              {activeActivity}
            </div>
            
            <div className="flex-1 overflow-y-auto cyber-scrollbar">
              {activeActivity === 'EXPLORER' && (
                <div className="flex flex-col mt-1 pb-4">
                  {renderTree(null, 1)}
                  {nodes.length === 0 && <div className="text-xs text-gray-500 px-4 mt-2">No repositories found.</div>}
                </div>
              )}

              {activeActivity === 'SEARCH' && (
                <div className="p-4 flex flex-col gap-2">
                  <input 
                    type="text" 
                    placeholder="Search" 
                    className="w-full bg-[#3c3c3c] text-[#cccccc] text-xs p-1.5 rounded outline-none border border-[#3c3c3c] focus:border-[#007acc]"
                  />
                  <div className="text-xs text-gray-500 mt-2">Search functionality requires backend indexing support. Mock panel preview only.</div>
                </div>
              )}

              {activeActivity === 'SCM' && (
                <div className="p-4 flex flex-col gap-4">
                  <div className="text-xs text-gray-300 font-semibold border-b border-[#3c3c3c] pb-2">
                    Source Control
                  </div>
                  {activeFile ? (
                    <>
                      <div className="text-xs text-gray-400">
                        Repository: <span className="text-white ml-1">{activeFile.repoSlug}</span>
                      </div>
                      <div className="text-xs text-gray-400">
                        Current Branch: <span className="text-[#007acc] ml-1">main</span>
                      </div>
                      <input 
                        type="text" 
                        placeholder="Message (Ctrl+Enter to commit on 'main')" 
                        className="w-full bg-[#3c3c3c] text-[#cccccc] text-xs p-1.5 rounded outline-none border border-[#3c3c3c] focus:border-[#007acc] mt-2 h-16 resize-none"
                      />
                      <button className="w-full py-1.5 mt-2 bg-[#007acc] text-white text-xs rounded hover:bg-[#005f9e]">Commit</button>
                    </>
                  ) : (
                    <div className="text-xs text-gray-500">Open a file from a repository to see Source Control options.</div>
                  )}
                </div>
              )}

              {activeActivity === 'RUN' && (
                <div className="p-4 flex flex-col gap-4">
                  <div className="text-xs text-gray-300 font-semibold">Run & Debug</div>
                  <button onClick={handleRunCode} className="w-full py-1.5 bg-[#007acc] text-white text-xs rounded hover:bg-[#005f9e] flex items-center justify-center gap-1">
                    <Play size={14} /> Run Active File
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Main Editor Area */}
        <div className="flex-1 flex flex-col min-w-0 bg-[var(--bg-main)]">
          {/* Tabs */}
          <div className="flex h-9 bg-[var(--bg-subtle)] overflow-x-auto cyber-scrollbar">
            {openedFiles.map(id => {
              const file = files.find(f => f.id === id);
              if (!file) return null;
              const isActive = activeFileId === id;
              return (
                <div 
                  key={id} 
                  onClick={() => openFile(file)}
                  className={`flex items-center h-full px-3 text-sm min-w-[120px] max-w-[200px] border-r border-[var(--border-main)] cursor-pointer group transition-colors ${isActive ? 'bg-[var(--bg-main)] text-white border-t-2 border-t-[var(--brand-primary)]' : 'text-[var(--text-muted)] hover:bg-[var(--bg-tertiary)]'}`}
                >
                  {file.language === 'javascript' && <span className="text-yellow-400 mr-2 font-bold text-xs">JS</span>}
                  {file.language === 'python' && <span className="text-blue-400 mr-2 font-bold text-xs">PY</span>}
                  {file.language === 'markdown' && <span className="text-blue-300 mr-2 font-bold text-xs">i</span>}
                  <span className="truncate flex-1">{file.name} {file.isDirty ? '•' : ''}</span>
                  <div 
                    onClick={(e) => closeFile(e, id)} 
                    className={`ml-2 p-0.5 rounded hover:bg-white/10 ${isActive ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}
                  >
                    <X size={14} />
                  </div>
                </div>
              );
            })}
          </div>

          {/* Breadcrumbs & Run Button */}
          <div className="h-7 flex items-center justify-between px-4 text-xs text-[var(--text-muted)] border-b border-[var(--border-main)] shadow-sm">
            <div className="flex items-center gap-1">
              <span>{activeFile?.repoSlug || 'WORKSPACE'}</span>
              <ChevronRight size={14} />
              <span>{activeFile?.path || 'No file open'}</span>
            </div>
            
            <div className="flex items-center gap-3">
              {activeFile && (
                <button onClick={handleSaveFile} disabled={isSaving} className="flex items-center gap-1 hover:text-white transition-colors mr-2">
                  <Save size={14} />
                  {isSaving ? 'Saving...' : 'Save'}
                </button>
              )}
              <button onClick={handleRunCode} disabled={isExecuting} className="flex items-center gap-1 hover:text-white text-green-400 transition-colors">
                <PlayCircle size={14} />
                {isExecuting ? 'Running...' : 'Run Code'}
              </button>
              <MoreHorizontal size={14} className="hover:text-white cursor-pointer" />
            </div>
          </div>

          {/* Monaco Editor */}
          <div className="flex-1 relative">
            {activeFile ? (
              <Editor
                height="100%"
                language={activeFile.language}
                theme="vs-dark"
                value={activeFile.content}
                onChange={handleFileContentChange}
                onMount={handleEditorDidMount}
                options={{
                  minimap: { enabled: true, scale: 0.75 },
                  fontSize: 14,
                  fontFamily: "'Consolas', 'Courier New', monospace",
                  wordWrap: 'on',
                  padding: { top: 16 },
                  scrollbar: {
                    verticalScrollbarSize: 10,
                    horizontalScrollbarSize: 10,
                  }
                }}
              />
            ) : (
              <div className="flex-1 flex items-center justify-center text-gray-500 h-full">
                <div className="text-center">
                  <PlayCircle size={64} className="mx-auto mb-4 opacity-20" />
                  <p className="text-xl font-light">Select a file to edit</p>
                </div>
              </div>
            )}
          </div>

          {/* Bottom Panel */}
          <div className="border-t border-[var(--border-main)] flex-col bg-[var(--bg-tertiary)]" style={{ display: bottomPanelOpen ? 'flex' : 'none', height: '35%', minHeight: '200px' }}>
            <div className="flex h-9 border-b border-[var(--border-main)] px-4 gap-6">
              {['PROBLEMS', 'OUTPUT', 'DEBUG CONSOLE', 'TERMINAL', 'PORTS'].map(tab => (
                <button 
                  key={tab}
                  onClick={() => setActiveBottomTab(tab)}
                  className={`text-xs tracking-wider transition-colors border-b-2 ${activeBottomTab === tab ? 'text-white border-[var(--brand-primary)] neon-text' : 'text-[var(--text-muted)] border-transparent hover:text-[var(--text-main)]'}`}
                >
                  {tab}
                </button>
              ))}
              
              <div className="flex-1 flex justify-end items-center gap-2 text-gray-400">
                <span className="flex items-center gap-1 text-xs px-2 py-0.5 hover:bg-white/10 rounded cursor-pointer"><Plus size={14} /></span>
                <span className="flex items-center gap-1 text-xs px-2 py-0.5 hover:bg-white/10 rounded cursor-pointer" onClick={() => setActiveBottomTab('TERMINAL')}><TerminalIcon size={14} /> Terminal</span>
                <X size={14} className="hover:text-white cursor-pointer ml-2" onClick={() => setBottomPanelOpen(false)} />
              </div>
            </div>
            
            <div className="flex-1 overflow-hidden p-2 relative">
              <div ref={terminalRef} className="w-full h-full" style={{ display: activeBottomTab === 'TERMINAL' ? 'block' : 'none' }} />
              
              {activeBottomTab === 'OUTPUT' && (
                <div className="w-full h-full overflow-y-auto font-mono text-[13px] p-2 text-[#cccccc]">
                  {mockOutputLines.map((line, i) => (
                    <div key={i} className={line.includes('[ERROR]') ? 'text-red-400' : ''}>{line}</div>
                  ))}
                </div>
              )}

              {activeBottomTab === 'PROBLEMS' && (
                <div className="w-full h-full overflow-y-auto font-sans text-[13px] p-2 text-[#cccccc]">
                  {markerCount.errors === 0 && markerCount.warnings === 0 ? (
                    <div className="text-gray-500 italic mt-2 ml-2">No problems have been detected in the workspace.</div>
                  ) : (
                    <div className="mt-2 ml-2">
                      <div className="flex items-center gap-2 mb-2">
                        <CircleX size={14} className="text-red-400" />
                        <span>{markerCount.errors} errors, {markerCount.warnings} warnings in {activeFile?.name}</span>
                      </div>
                      <div className="text-xs text-gray-500 ml-5">Check the editor squiggly lines for exact locations.</div>
                    </div>
                  )}
                </div>
              )}

              {['DEBUG CONSOLE', 'PORTS'].includes(activeBottomTab) && (
                <div className="text-gray-500 italic p-2 font-mono text-sm">No output for {activeBottomTab}. Feature coming soon.</div>
              )}
            </div>
          </div>
        </div>

        {/* Secondary Sidebar (Chat/AI) */}
        {rightSidebarOpen && (
          <div className="w-[300px] border-l border-[var(--border-main)] flex flex-col bg-[var(--bg-subtle)] z-0">
            <div className="flex items-center justify-between px-4 h-9 border-b border-[var(--border-main)] text-xs font-medium text-[var(--text-muted)]">
              <div className="flex gap-4 h-full pt-2">
                <span className="text-white border-b-2 border-[var(--brand-purple)] pb-[7px] neon-text">CHAT</span>
                <span className="text-gray-500 hover:text-gray-300 cursor-pointer">...</span>
              </div>
              <div className="flex gap-2">
                <Plus size={14} className="hover:text-white cursor-pointer" onClick={() => setChatMessages([{ role: 'assistant', text: 'New conversation started. How can I assist?' }])} />
                <SettingsIcon size={14} className={`cursor-pointer transition-colors ${showAiSettings ? 'text-[var(--brand-primary)]' : 'hover:text-white'}`} onClick={() => setShowAiSettings(!showAiSettings)} />
              </div>
            </div>
            
            <div className="flex-1 p-4 flex flex-col">
              {showAiSettings && (
                <div className="mb-4 p-3 bg-black/40 border border-[var(--border-main)] rounded-lg">
                  <div className="text-xs font-semibold text-[var(--text-main)] mb-2">AI Provider Settings</div>
                  <select 
                    value={aiProvider}
                    onChange={(e) => { setAiProvider(e.target.value); localStorage.setItem('bb_ai_provider', e.target.value); }}
                    className="w-full bg-[var(--bg-tertiary)] border border-[var(--border-subtle)] text-xs text-[var(--text-main)] rounded p-1 mb-2 outline-none focus:border-[var(--brand-primary)]"
                  >
                    <option value="gemini">Google Gemini</option>
                    <option value="chatgpt">OpenAI ChatGPT</option>
                  </select>
                  <input 
                    type="password"
                    placeholder="Enter API Key..."
                    value={aiApiKey}
                    onChange={(e) => { setAiApiKey(e.target.value); localStorage.setItem('bb_ai_key', e.target.value); }}
                    className="w-full bg-[var(--bg-tertiary)] border border-[var(--border-subtle)] text-xs text-[var(--text-main)] rounded p-1 outline-none focus:border-[var(--brand-primary)]"
                  />
                  <div className="text-[10px] text-[var(--text-muted)] mt-1 text-right">Stored locally in browser</div>
                </div>
              )}

              <div className="text-xs font-semibold text-gray-400 mb-2 tracking-wider">SESSIONS</div>
              
              <div className="flex-1 overflow-y-auto mb-4 flex flex-col gap-4">
                {chatMessages.map((msg, i) => (
                  <div key={i} className={`flex gap-2 text-sm ${msg.role === 'user' ? 'text-white' : 'text-gray-300'}`}>
                    {msg.role === 'assistant' ? <MessageSquare size={16} className="mt-0.5 text-[#007acc] shrink-0" /> : <TerminalIcon size={16} className="mt-0.5 text-gray-500 shrink-0" />}
                    <div className="flex-1 whitespace-pre-wrap">
                      {msg.text}
                    </div>
                  </div>
                ))}
              </div>
              
              <div className="mt-auto">
                <div className="glass-panel p-2 flex flex-col neon-border focus-within:shadow-[0_0_15px_rgba(168,85,247,0.3)] transition-all">
                  <textarea 
                    value={chatInput}
                    onChange={(e) => setChatInput(e.target.value)}
                    onKeyDown={handleChatSubmit}
                    placeholder="Ask AI to write code..." 
                    className="bg-transparent border-none outline-none text-sm text-white resize-none h-16 w-full cyber-scrollbar"
                  />
                  <div className="flex justify-between items-center mt-2 pt-2 border-t border-[var(--border-muted)] text-xs text-[var(--text-muted)]">
                    <div className="flex gap-2">
                      <Plus size={14} className="hover:text-white cursor-pointer" />
                      <span>Auto</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Status Bar */}
      <div className="h-6 flex items-center justify-between px-2 text-[11px] bg-[var(--brand-primary)] text-black font-semibold">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1 cursor-pointer hover:bg-black/20 px-1 rounded transition-colors">
            <GitBranch size={12} />
            <span>{activeFile?.repoSlug ? 'main' : 'BuildBoard+'}</span>
          </div>
          <div className="flex items-center gap-1 cursor-pointer hover:bg-black/20 px-1 rounded transition-colors" onClick={() => { setBottomPanelOpen(true); setActiveBottomTab('PROBLEMS'); }}>
            <CircleX size={12} className={markerCount.errors > 0 ? "text-red-700" : ""} /> {markerCount.errors} <AlertTriangle size={12} className={`ml-1 ${markerCount.warnings > 0 ? 'text-yellow-700' : ''}`} /> {markerCount.warnings}
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          <span className="cursor-pointer hover:bg-white/20 px-1 rounded">Ln {cursorPosition.ln}, Col {cursorPosition.col}</span>
          <span className="cursor-pointer hover:bg-white/20 px-1 rounded">Spaces: 2</span>
          <span className="cursor-pointer hover:bg-white/20 px-1 rounded">UTF-8</span>
          <span className="cursor-pointer hover:bg-white/20 px-1 rounded">CRLF</span>
          <span className="cursor-pointer hover:bg-white/20 px-1 rounded">{activeFile?.language || 'Plain Text'}</span>
          <span className="cursor-pointer hover:bg-white/20 px-1 rounded">Prettier</span>
        </div>
      </div>
    </div>
  );
};

export default Notepad;
