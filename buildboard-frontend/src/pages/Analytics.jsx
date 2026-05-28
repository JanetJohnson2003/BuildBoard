import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import axios from 'axios';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, Cell 
} from 'recharts';
import { GlassCard, NeonButton, CyberSkeleton } from '../components/ui';
import { 
  BarChart3, FolderGit2, Package, MessageSquare, Users, 
  Activity, ChevronLeft, AlertCircle, Trophy, Star
} from 'lucide-react';
import { pageVariants, listVariants, itemVariants } from '../utils/animations';

function Analytics() {
  const navigate = useNavigate();
  const token = localStorage.getItem('token');
  const user = JSON.parse(localStorage.getItem('user') || '{}');

  const { data: stats, isLoading, error } = useQuery({
    queryKey: ['analyticsDashboard'],
    queryFn: async () => {
      const res = await axios.get('http://localhost:5000/api/analytics/dashboard', {
        headers: { Authorization: token }
      });
      return res.data;
    },
    enabled: !!token
  });

  if (!token || !user?.id) {
    return (
      <div className="flex items-center justify-center min-h-[60vh] p-8">
        <GlassCard glowColor="var(--brand-danger)" className="p-12 text-center max-w-md border-[var(--brand-danger)]/50 bg-[var(--brand-danger)]/5">
          <AlertCircle size={48} className="text-[var(--brand-danger)] mx-auto mb-4" />
          <h2 className="text-xl font-display font-bold text-white mb-2">ACCESS_DENIED</h2>
          <p className="text-sm font-mono text-[var(--text-muted)] mb-6">Unauthorized access to analytics matrix.</p>
          <NeonButton variant="ghost" onClick={() => navigate('/login')}>AUTHENTICATE</NeonButton>
        </GlassCard>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="p-8 max-w-7xl mx-auto space-y-6">
        <div className="flex items-center gap-4 mb-8">
          <CyberSkeleton className="w-10 h-10 rounded-lg" />
          <CyberSkeleton className="w-64 h-8" />
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6 mb-8">
          {[1, 2, 3, 4].map(i => <CyberSkeleton key={i} className="h-32 rounded-xl" />)}
        </div>
        <div className="grid gap-6 md:grid-cols-2">
          {[1, 2].map(i => <CyberSkeleton key={i} className="h-[400px] rounded-xl" />)}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[60vh] p-8">
        <GlassCard glowColor="var(--brand-danger)" className="p-12 text-center max-w-md border-[var(--brand-danger)]/50 bg-[var(--brand-danger)]/5">
          <AlertCircle size={48} className="text-[var(--brand-danger)] mx-auto mb-4" />
          <h2 className="text-xl font-display font-bold text-white mb-2">SYSTEM_ERROR</h2>
          <p className="text-sm font-mono text-[var(--text-muted)] mb-6">Failed to retrieve telemetry data.</p>
          <NeonButton variant="primary" onClick={() => navigate('/dashboard')}>RETURN_TO_DASHBOARD</NeonButton>
        </GlassCard>
      </div>
    );
  }

  const StatCard = ({ title, value, icon: Icon, colorClass, gradientClass }) => (
    <GlassCard className={`p-6 relative overflow-hidden group border-${colorClass}/30 hover:border-${colorClass}`}>
      <div className={`absolute top-0 right-0 w-32 h-32 blur-3xl rounded-full translate-x-1/2 -translate-y-1/2 opacity-20 group-hover:opacity-40 transition-opacity ${gradientClass}`} />
      <div className="relative z-10 flex flex-col h-full justify-between gap-4">
        <div className={`w-12 h-12 rounded-lg bg-${colorClass}/10 flex items-center justify-center text-${colorClass} border border-${colorClass}/20`}>
          <Icon size={24} />
        </div>
        <div>
          <h3 className="text-xs font-mono uppercase tracking-widest text-[var(--text-muted)] mb-1">{title}</h3>
          <p className="text-3xl font-display font-bold text-white">{value}</p>
        </div>
      </div>
    </GlassCard>
  );

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-black/90 border border-[var(--glass-border)] p-3 rounded-lg shadow-[0_0_15px_rgba(0,0,0,0.5)] backdrop-blur-md">
          <p className="text-xs font-mono text-[var(--text-muted)] mb-1">{label}</p>
          <p className="text-sm font-bold text-[var(--brand-primary)]">
            {payload[0].value} <span className="text-[var(--text-muted)] font-normal text-xs">{payload[0].name}</span>
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <motion.div 
      variants={pageVariants}
      initial="initial"
      animate="animate"
      exit="exit"
      className="max-w-7xl mx-auto p-4 md:p-8 space-y-8"
    >
      <div className="flex items-center gap-4 border-b border-[var(--glass-border)] pb-6">
        <button 
          onClick={() => navigate('/dashboard')}
          className="w-10 h-10 rounded-lg bg-[var(--bg-tertiary)] border border-[var(--glass-border)] flex items-center justify-center text-[var(--text-muted)] hover:text-white hover:border-[var(--brand-primary)] transition-all group"
        >
          <ChevronLeft size={20} className="group-hover:-translate-x-1 transition-transform" />
        </button>
        <div>
          <h1 className="text-2xl md:text-3xl font-display font-bold flex items-center gap-3 text-white">
            <BarChart3 className="text-[var(--brand-primary)]" />
            TELEMETRY_DASHBOARD
          </h1>
          <p className="text-sm font-mono text-[var(--text-muted)] mt-1">
            Global system analytics and performance metrics.
          </p>
        </div>
      </div>

      <motion.div 
        variants={listVariants}
        initial="hidden"
        animate="visible"
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6"
      >
        <motion.div variants={itemVariants}>
          <StatCard 
            title="Total Projects" 
            value={stats?.projects || 0} 
            icon={FolderGit2} 
            colorClass="[var(--brand-primary)]" 
            gradientClass="bg-[var(--brand-primary)]"
          />
        </motion.div>
        <motion.div variants={itemVariants}>
          <StatCard 
            title="Total Versions" 
            value={stats?.versions || 0} 
            icon={Package} 
            colorClass="[var(--brand-success)]" 
            gradientClass="bg-[var(--brand-success)]"
          />
        </motion.div>
        <motion.div variants={itemVariants}>
          <StatCard 
            title="Total Diagnostics" 
            value={stats?.feedback || 0} 
            icon={MessageSquare} 
            colorClass="[var(--brand-warning)]" 
            gradientClass="bg-[var(--brand-warning)]"
          />
        </motion.div>
        <motion.div variants={itemVariants}>
          <StatCard 
            title="Active Operatives" 
            value={stats?.users || 0} 
            icon={Users} 
            colorClass="[var(--brand-purple)]" 
            gradientClass="bg-[var(--brand-purple)]"
          />
        </motion.div>
      </motion.div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {/* Most Commented Projects Chart */}
        <motion.div variants={itemVariants} className="lg:col-span-2">
          <GlassCard className="h-full flex flex-col p-6">
            <h2 className="text-lg font-display font-bold flex items-center gap-2 mb-6">
              <Star className="text-[var(--brand-primary)]" size={18} />
              HIGH_ACTIVITY_PROJECTS
            </h2>
            <div className="flex-1 min-h-[300px] w-full">
              {stats?.mostCommentedProjects?.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={stats.mostCommentedProjects} margin={{ top: 10, right: 10, left: -20, bottom: 20 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                    <XAxis 
                      dataKey="title" 
                      tick={{ fill: 'var(--text-muted)', fontSize: 12, fontFamily: 'monospace' }}
                      axisLine={{ stroke: 'rgba(255,255,255,0.1)' }}
                      tickLine={false}
                      angle={-45}
                      textAnchor="end"
                      height={60}
                    />
                    <YAxis 
                      tick={{ fill: 'var(--text-muted)', fontSize: 12, fontFamily: 'monospace' }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <RechartsTooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(0,240,255,0.05)' }} />
                    <Bar dataKey="commentCount" name="Comments" radius={[4, 4, 0, 0]}>
                      {stats.mostCommentedProjects.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={`hsl(${190 + index * 10}, 100%, 50%)`} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex h-full items-center justify-center text-[var(--text-muted)] font-mono text-sm">
                  NO_DATA_AVAILABLE
                </div>
              )}
            </div>
          </GlassCard>
        </motion.div>

        {/* Top Reviewers */}
        <motion.div variants={itemVariants}>
          <GlassCard className="h-full p-6">
            <h2 className="text-lg font-display font-bold flex items-center gap-2 mb-6">
              <Trophy className="text-[var(--brand-warning)]" size={18} />
              TOP_OPERATIVES
            </h2>
            {stats?.topReviewers?.length > 0 ? (
              <div className="space-y-4">
                {stats.topReviewers.map((reviewer, index) => (
                  <div key={index} className="flex items-center gap-4 bg-[var(--bg-tertiary)] p-3 rounded-lg border border-[var(--glass-border)]">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center font-display font-bold text-sm ${
                      index === 0 ? 'bg-[var(--brand-warning)]/20 text-[var(--brand-warning)] border border-[var(--brand-warning)]/30' :
                      index === 1 ? 'bg-[#9ca3af]/20 text-[#9ca3af] border border-[#9ca3af]/30' :
                      index === 2 ? 'bg-[#b45309]/20 text-[#b45309] border border-[#b45309]/30' :
                      'bg-[var(--bg-main)] text-[var(--text-muted)] border border-[var(--glass-border)]'
                    }`}>
                      {index + 1}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-sm text-white truncate">{reviewer.name}</p>
                      <p className="text-xs font-mono text-[var(--text-muted)]">{reviewer.feedbackCount} Diagnostics</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex h-full items-center justify-center text-[var(--text-muted)] font-mono text-sm">
                NO_DATA_AVAILABLE
              </div>
            )}
          </GlassCard>
        </motion.div>

        {/* Recent Activities */}
        <motion.div variants={itemVariants} className="lg:col-span-3">
          <GlassCard className="p-6">
            <h2 className="text-lg font-display font-bold flex items-center gap-2 mb-6">
              <Activity className="text-[var(--brand-success)]" size={18} />
              SYSTEM_ACTIVITY_LOG
            </h2>
            
            {stats?.recentActivities?.length > 0 ? (
              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                {stats.recentActivities.slice(0, 9).map((activity, index) => (
                  <div key={index} className="flex items-start gap-3 bg-[var(--bg-tertiary)] p-4 rounded-lg border border-[var(--glass-border)] hover:border-[var(--brand-primary)]/50 transition-colors">
                    <div className="w-2 h-2 rounded-full bg-[var(--brand-success)] mt-1.5 shrink-0 shadow-[0_0_8px_var(--brand-success)]" />
                    <div>
                      <p className="text-sm font-bold text-[var(--text-main)] mb-1 leading-tight">{activity.title}</p>
                      <p className="text-[10px] font-mono text-[var(--text-muted)] uppercase">
                        {new Date(activity.date).toLocaleString()}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-[var(--text-muted)] font-mono text-sm border border-dashed border-[var(--glass-border)] rounded-lg bg-[var(--bg-tertiary)]/50">
                NO_RECENT_ACTIVITY
              </div>
            )}
          </GlassCard>
        </motion.div>
      </div>
    </motion.div>
  );
}

export default Analytics;