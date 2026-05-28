import React, { useState, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, MessageSquare, AlertCircle } from 'lucide-react';
import { io } from 'socket.io-client';
import api from '../../lib/api';
import { useAuth } from '../../context/AuthContext';
import { GlassCard, CyberInput, CyberSkeleton } from '../../components/ui';
import { pageVariants, itemVariants, listVariants } from '../../utils/animations';

const SOCKET_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const RepoChat = () => {
  const { owner, repo } = useParams();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [newMessage, setNewMessage] = useState('');
  const [socket, setSocket] = useState(null);
  const messagesEndRef = useRef(null);

  const { data: repoDoc } = useQuery({
    queryKey: ['repo', owner, repo],
    queryFn: async () => {
      const res = await api.get(`/repos/${owner}/${repo}`);
      return res.data;
    }
  });

  const repoId = repoDoc?._id;

  const { data: messages = [], isLoading, error } = useQuery({
    queryKey: ['repo-chat', owner, repo],
    queryFn: async () => {
      const res = await api.get(`/repos/${owner}/${repo}/chat`);
      return res.data;
    },
    enabled: !!repoId
  });

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  useEffect(() => {
    if (!repoId || !user) return;

    const newSocket = io(SOCKET_URL, {
      withCredentials: true,
    });

    newSocket.on('connect', () => {
      newSocket.emit('user:online', user._id);
      newSocket.emit('repo:join', repoId);
    });

    newSocket.on('chat:message', (message) => {
      queryClient.setQueryData(['repo-chat', owner, repo], (old) => {
        if (!old) return [message];
        if (old.some(m => m._id === message._id)) return old;
        return [...old, message];
      });
    });

    setSocket(newSocket);

    return () => {
      newSocket.emit('repo:leave', repoId);
      newSocket.disconnect();
    };
  }, [repoId, user, owner, repo, queryClient]);

  const sendMessageMutation = useMutation({
    mutationFn: async (content) => {
      const res = await api.post(`/repos/${owner}/${repo}/chat`, { content });
      return res.data;
    },
    onSuccess: () => {
      setNewMessage('');
    }
  });

  const handleSend = (e) => {
    e.preventDefault();
    if (!newMessage.trim() || sendMessageMutation.isPending) return;
    sendMessageMutation.mutate(newMessage.trim());
  };

  if (isLoading) {
    return (
      <div className="flex flex-col h-[calc(100vh-200px)]">
        <div className="flex-1 space-y-4">
          {[1, 2, 3, 4, 5].map(i => (
            <CyberSkeleton key={i} className={`h-16 w-3/4 rounded-xl ${i % 2 === 0 ? 'ml-auto' : ''}`} />
          ))}
        </div>
        <CyberSkeleton className="h-14 mt-4 rounded-xl" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8 text-center border border-dashed border-[var(--brand-danger)]/30 rounded-xl bg-[var(--brand-danger)]/5">
        <AlertCircle className="mx-auto text-[var(--brand-danger)] mb-4" size={40} />
        <h3 className="text-lg font-bold text-[var(--brand-danger)]">Failed to load Comm-Link</h3>
        <p className="text-[var(--text-muted)]">{error.message}</p>
      </div>
    );
  }

  return (
    <motion.div 
      variants={pageVariants}
      initial="initial"
      animate="animate"
      exit="exit"
      className="flex flex-col h-[calc(100vh-200px)]"
    >
      <div className="mb-4">
        <h1 className="text-2xl font-display font-bold flex items-center gap-2">
          <MessageSquare className="text-[var(--brand-primary)]" />
          Nexus Comm-Link
        </h1>
        <p className="text-sm text-[var(--text-muted)] mt-1">Real-time collaboration channel for this repository.</p>
      </div>

      <GlassCard className="flex-1 flex flex-col p-0 overflow-hidden relative">
        <div className="flex-1 overflow-y-auto p-6 cyber-scrollbar space-y-4 relative z-10">
          {messages.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-[var(--text-muted)] opacity-50">
              <MessageSquare size={48} className="mb-4" />
              <p>Comm-Link established. Awaiting first transmission.</p>
            </div>
          ) : (
            <AnimatePresence initial={false}>
              {messages.map((msg) => {
                const isMe = msg.sender._id === user?._id;
                return (
                  <motion.div
                    key={msg._id}
                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}
                  >
                    <div className={`flex max-w-[80%] gap-3 ${isMe ? 'flex-row-reverse' : 'flex-row'}`}>
                      <div className="w-8 h-8 rounded-full overflow-hidden flex-shrink-0 border border-[var(--glass-border)]">
                        {msg.sender.avatar ? (
                          <img src={msg.sender.avatar} alt={msg.sender.username} className="w-full h-full object-cover" />
                        ) : (
                          <div className={`w-full h-full flex items-center justify-center text-xs font-bold ${isMe ? 'bg-[var(--brand-primary)] text-black' : 'bg-[var(--bg-tertiary)] text-[var(--brand-primary)]'}`}>
                            {msg.sender.username.charAt(0).toUpperCase()}
                          </div>
                        )}
                      </div>
                      
                      <div className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                        <span className="text-[10px] font-mono text-[var(--text-muted)] mb-1 px-1">
                          {msg.sender.username} • {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                        <div 
                          className={`px-4 py-2 rounded-2xl text-sm ${
                            isMe 
                              ? 'bg-[var(--brand-primary)]/20 text-[var(--brand-primary)] border border-[var(--brand-primary)]/30 rounded-tr-sm shadow-[0_0_15px_rgba(var(--brand-primary-rgb),0.1)]' 
                              : 'bg-[var(--bg-tertiary)] text-[var(--text-main)] border border-[var(--glass-border)] rounded-tl-sm'
                          }`}
                        >
                          {msg.content}
                        </div>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          )}
          <div ref={messagesEndRef} />
        </div>

        <div className="p-4 border-t border-[var(--glass-border)] bg-[var(--bg-tertiary)]/50 backdrop-blur-md relative z-10">
          <form onSubmit={handleSend} className="flex gap-3">
            <CyberInput 
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder="Transmit message to Comm-Link..."
              className="flex-1"
              autoComplete="off"
            />
            <button
              type="submit"
              disabled={!newMessage.trim() || sendMessageMutation.isPending}
              className="px-4 py-2 rounded-lg bg-[var(--brand-primary)] text-black font-bold flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed hover:bg-[var(--brand-primary)]/90 transition-colors shadow-[0_0_15px_var(--brand-primary)]"
            >
              <Send size={18} className={sendMessageMutation.isPending ? "animate-pulse" : ""} />
            </button>
          </form>
        </div>
      </GlassCard>
    </motion.div>
  );
};

export default RepoChat;
