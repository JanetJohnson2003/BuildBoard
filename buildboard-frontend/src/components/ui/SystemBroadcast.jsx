import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { io } from 'socket.io-client';
import { AlertTriangle, Info, ShieldAlert, X } from 'lucide-react';

const SystemBroadcast = () => {
  const [announcement, setAnnouncement] = useState(null);

  useEffect(() => {
    // Initialize socket connection
    const socketURL = import.meta.env.VITE_API_URL?.replace('/api', '') || '';
    const socket = io(socketURL, {
      withCredentials: true
    });

    socket.on('connect', () => {
      console.log('📡 SystemBroadcast connected to socket');
    });

    socket.on('system:announcement', (data) => {
      console.log('🚨 Received System Announcement:', data);
      setAnnouncement(data);

      // Auto-dismiss after 15 seconds unless it's critical
      if (data.severity !== 'critical') {
        setTimeout(() => {
          setAnnouncement(null);
        }, 15000);
      }
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  if (!announcement) return null;

  const severityConfig = {
    info: {
      color: 'var(--brand-primary)',
      icon: Info,
      bg: 'bg-[var(--brand-primary)]/10',
      border: 'border-[var(--brand-primary)]'
    },
    warning: {
      color: 'var(--brand-warning)',
      icon: AlertTriangle,
      bg: 'bg-[var(--brand-warning)]/10',
      border: 'border-[var(--brand-warning)]'
    },
    critical: {
      color: 'var(--brand-danger)',
      icon: ShieldAlert,
      bg: 'bg-[var(--brand-danger)]/10',
      border: 'border-[var(--brand-danger)]'
    }
  };

  const config = severityConfig[announcement.severity] || severityConfig.info;
  const Icon = config.icon;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ y: -100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: -100, opacity: 0 }}
        transition={{ type: 'spring', damping: 15, stiffness: 200 }}
        className="fixed top-0 left-0 right-0 z-[9999] p-4 pointer-events-none flex justify-center"
      >
        <div 
          className={`pointer-events-auto max-w-4xl w-full ${config.bg} border-2 ${config.border} rounded-xl shadow-[0_0_50px_rgba(0,0,0,0.5)] backdrop-blur-md overflow-hidden relative group`}
        >
          {/* Scanline effect */}
          <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.05)_1px,transparent_1px)] bg-[length:100%_4px] opacity-20 pointer-events-none"></div>
          
          <div className="p-6 flex items-start gap-5 relative z-10">
            <div className={`p-3 rounded-lg flex-shrink-0`} style={{ backgroundColor: 'rgba(0,0,0,0.3)', color: config.color, border: `1px solid ${config.color}` }}>
              <Icon size={32} />
            </div>
            
            <div className="flex-1 pt-1">
              <div className="flex items-center gap-3 mb-1">
                <span className="text-xs font-mono font-bold tracking-widest uppercase" style={{ color: config.color }}>
                  SYSTEM OVERRIDE // {announcement.severity}
                </span>
                <span className="text-[10px] text-[var(--text-muted)] font-mono">
                  {new Date(announcement.timestamp).toLocaleTimeString()}
                </span>
              </div>
              <h2 className="text-xl md:text-2xl font-display font-bold text-white tracking-wide">
                {announcement.message}
              </h2>
            </div>
            
            <button 
              onClick={() => setAnnouncement(null)}
              className="p-2 text-[var(--text-muted)] hover:text-white transition-colors"
            >
              <X size={24} />
            </button>
          </div>
          
          {/* Animated bottom bar */}
          <motion.div 
            initial={{ width: 0 }}
            animate={{ width: '100%' }}
            transition={{ duration: announcement.severity === 'critical' ? 0 : 15, ease: 'linear' }}
            className="absolute bottom-0 left-0 h-1"
            style={{ backgroundColor: config.color }}
          />
        </div>
      </motion.div>
    </AnimatePresence>
  );
};

export default SystemBroadcast;
