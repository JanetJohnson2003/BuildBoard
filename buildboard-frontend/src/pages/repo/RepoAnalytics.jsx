import React, { useMemo } from 'react';
import { useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer,
  BarChart, Bar, PieChart, Pie, Cell, Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis
} from 'recharts';
import api from '../../lib/api';
import { GlassCard, CyberSkeleton, CyberBadge, AnimatedCounter } from '../../components/ui';
import { pageVariants, itemVariants, listVariants } from '../../utils/animations';
import { Activity, Users, GitMerge, AlertCircle, HeartPulse, Zap } from 'lucide-react';
import { twMerge } from 'tailwind-merge';

const COLORS = ['var(--brand-primary)', 'var(--brand-purple)', 'var(--brand-success)', 'var(--brand-warning)', 'var(--brand-danger)'];

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-[var(--bg-tertiary)]/90 backdrop-blur-md border border-[var(--glass-border)] p-3 rounded-lg shadow-xl shadow-black/50">
        <p className="font-mono text-xs text-[var(--text-muted)] mb-2">{label}</p>
        {payload.map((entry, index) => (
          <div key={`item-${index}`} className="flex items-center gap-2 text-sm font-medium">
            <div className="w-2 h-2 rounded-full shadow-[0_0_5px_currentColor]" style={{ backgroundColor: entry.color, color: entry.color }} />
            <span className="text-[var(--text-main)]">{entry.name}:</span>
            <span style={{ color: entry.color }}>{entry.value}</span>
          </div>
        ))}
      </div>
    );
  }
  return null;
};

const MetricCard = ({ title, value, icon: Icon, color, subValue, delay }) => (
  <motion.div variants={itemVariants} transition={{ delay }}>
    <GlassCard className="p-5 h-full relative overflow-hidden group">
      <div className={twMerge("absolute -right-4 -top-4 w-24 h-24 rounded-full blur-[40px] opacity-20 group-hover:opacity-40 transition-opacity", color)} />
      <div className="flex justify-between items-start mb-4">
        <div className="text-sm font-mono text-[var(--text-muted)] uppercase tracking-wider">{title}</div>
        <Icon size={20} className={twMerge("opacity-80", color.replace('bg-', 'text-'))} />
      </div>
      <div className="text-3xl font-display font-bold mb-2">
        <AnimatedCounter value={value} />
      </div>
      {subValue && (
        <div className="text-xs font-medium text-[var(--text-muted)]">{subValue}</div>
      )}
    </GlassCard>
  </motion.div>
);

const RepoAnalytics = () => {
  const { owner, repo } = useParams();

  const { data, isLoading, error } = useQuery({
    queryKey: ['repo-analytics', owner, repo],
    queryFn: async () => {
      const res = await api.get(`/analytics/repo/${owner}/${repo}`);
      return res.data;
    }
  });

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[1, 2, 3].map(i => <CyberSkeleton key={i} className="h-32 rounded-xl" />)}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <CyberSkeleton className="h-[400px] rounded-xl" />
          <CyberSkeleton className="h-[400px] rounded-xl" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8 text-center border border-dashed border-[var(--brand-danger)]/30 rounded-xl bg-[var(--brand-danger)]/5">
        <AlertCircle className="mx-auto text-[var(--brand-danger)] mb-4" size={40} />
        <h3 className="text-lg font-bold text-[var(--brand-danger)]">Failed to load telemetry</h3>
        <p className="text-[var(--text-muted)]">{error.message}</p>
      </div>
    );
  }

  const { commitsOverTime, contributorStats, issueStats, prStats, healthScore } = data;

  // Format data for charts
  const commitData = commitsOverTime.map(c => ({
    date: c._id,
    commits: c.count
  }));

  const issueData = issueStats.map(s => ({
    name: s._id.toUpperCase(),
    value: s.count
  }));

  const prData = prStats.map(s => ({
    name: s._id.toUpperCase(),
    value: s.count
  }));

  // Health radar data
  const radarData = [
    { subject: 'Resolution Rate', A: healthScore.issueResolutionRate, fullMark: 100 },
    { subject: 'Merge Rate', A: healthScore.prMergeRate, fullMark: 100 },
    { subject: 'Activity', A: healthScore.activityScore, fullMark: 100 },
    { subject: 'Overall Health', A: healthScore.overall, fullMark: 100 },
  ];

  return (
    <motion.div 
      variants={pageVariants}
      initial="initial"
      animate="animate"
      exit="exit"
      className="space-y-6"
    >
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-display font-bold">Telemetric Insights</h1>
          <p className="text-sm text-[var(--text-muted)] mt-1">Deep analysis of repository activity and health.</p>
        </div>
        <div className="flex items-center gap-3">
          <CyberBadge variant={healthScore.overall > 80 ? 'success' : healthScore.overall > 50 ? 'warning' : 'danger'} glow>
            HEALTH_INDEX: {healthScore.overall}%
          </CyberBadge>
        </div>
      </div>

      <motion.div variants={listVariants} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard 
          title="Health Score" 
          value={healthScore.overall} 
          icon={HeartPulse} 
          color="bg-[var(--brand-success)]" 
          subValue="Aggregate repository status"
          delay={0.1}
        />
        <MetricCard 
          title="Total Contributors" 
          value={contributorStats.length} 
          icon={Users} 
          color="bg-[var(--brand-primary)]" 
          subValue="Active in the last 30 days"
          delay={0.2}
        />
        <MetricCard 
          title="Issue Resolution" 
          value={healthScore.issueResolutionRate} 
          icon={Activity} 
          color="bg-[var(--brand-warning)]" 
          subValue="Percentage of closed issues"
          delay={0.3}
        />
        <MetricCard 
          title="PR Merge Rate" 
          value={healthScore.prMergeRate} 
          icon={GitMerge} 
          color="bg-[var(--brand-purple)]" 
          subValue="Percentage of merged PRs"
          delay={0.4}
        />
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <GlassCard className="col-span-1 lg:col-span-2 p-5 flex flex-col min-h-[400px]">
          <h2 className="text-lg font-display font-bold mb-6 flex items-center gap-2">
            <Zap size={18} className="text-[var(--brand-primary)]" />
            Commit Velocity (30 Days)
          </h2>
          <div className="flex-1 min-h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={commitData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorCommits" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="var(--brand-primary)" stopOpacity={0.5}/>
                    <stop offset="95%" stopColor="var(--brand-primary)" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--glass-border)" vertical={false} />
                <XAxis dataKey="date" stroke="var(--text-muted)" fontSize={12} tickLine={false} axisLine={false} minTickGap={30} />
                <YAxis stroke="var(--text-muted)" fontSize={12} tickLine={false} axisLine={false} />
                <RechartsTooltip content={<CustomTooltip />} />
                <Area type="monotone" dataKey="commits" name="Commits" stroke="var(--brand-primary)" strokeWidth={3} fillOpacity={1} fill="url(#colorCommits)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </GlassCard>

        <GlassCard className="p-5 flex flex-col">
          <h2 className="text-lg font-display font-bold mb-6 flex items-center gap-2">
            <HeartPulse size={18} className="text-[var(--brand-success)]" />
            Health Matrix
          </h2>
          <div className="flex-1 min-h-[300px] flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart cx="50%" cy="50%" outerRadius="70%" data={radarData}>
                <PolarGrid stroke="var(--glass-border)" />
                <PolarAngleAxis dataKey="subject" tick={{ fill: 'var(--text-muted)', fontSize: 11 }} />
                <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />
                <Radar name="Repo" dataKey="A" stroke="var(--brand-success)" fill="var(--brand-success)" fillOpacity={0.3} strokeWidth={2} />
                <RechartsTooltip content={<CustomTooltip />} />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </GlassCard>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <GlassCard className="p-5 flex flex-col">
          <h2 className="text-lg font-display font-bold mb-6">Issue Distribution</h2>
          <div className="flex-1 min-h-[250px]">
            {issueData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={issueData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                    stroke="none"
                  >
                    {issueData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <RechartsTooltip content={<CustomTooltip />} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-[var(--text-muted)] text-sm">No issue data available</div>
            )}
          </div>
          <div className="flex justify-center gap-4 mt-4">
            {issueData.map((entry, index) => (
              <div key={`legend-${index}`} className="flex items-center gap-2 text-xs font-mono">
                <div className="w-3 h-3 rounded-sm" style={{ backgroundColor: COLORS[index % COLORS.length] }} />
                <span>{entry.name} ({entry.value})</span>
              </div>
            ))}
          </div>
        </GlassCard>

        <GlassCard className="p-5 flex flex-col">
          <h2 className="text-lg font-display font-bold mb-6">Pull Request Status</h2>
          <div className="flex-1 min-h-[250px]">
            {prData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={prData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                    stroke="none"
                  >
                    {prData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={[COLORS[1], COLORS[2], COLORS[0]][index % 3]} />
                    ))}
                  </Pie>
                  <RechartsTooltip content={<CustomTooltip />} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-[var(--text-muted)] text-sm">No PR data available</div>
            )}
          </div>
          <div className="flex justify-center gap-4 mt-4">
            {prData.map((entry, index) => (
              <div key={`legend-${index}`} className="flex items-center gap-2 text-xs font-mono">
                <div className="w-3 h-3 rounded-sm" style={{ backgroundColor: [COLORS[1], COLORS[2], COLORS[0]][index % 3] }} />
                <span>{entry.name} ({entry.value})</span>
              </div>
            ))}
          </div>
        </GlassCard>

        <GlassCard className="p-5 flex flex-col">
          <h2 className="text-lg font-display font-bold mb-6">Top Contributors</h2>
          <div className="flex-1 overflow-y-auto cyber-scrollbar pr-2 space-y-3">
            {contributorStats.length > 0 ? contributorStats.map((contributor, idx) => (
              <div key={contributor.username} className="flex items-center justify-between p-3 rounded-lg bg-[var(--bg-tertiary)] border border-[var(--glass-border)]">
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <div className="w-8 h-8 rounded-full overflow-hidden border border-[var(--brand-primary)]/50">
                      {contributor.avatar ? (
                        <img src={contributor.avatar} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full bg-[var(--brand-primary)]/20 flex items-center justify-center text-xs font-bold text-[var(--brand-primary)]">
                          {contributor.username.charAt(0).toUpperCase()}
                        </div>
                      )}
                    </div>
                    {idx === 0 && <div className="absolute -top-1 -right-1 text-[10px] w-4 h-4 bg-[var(--brand-warning)] text-black font-bold rounded-full flex items-center justify-center">1</div>}
                  </div>
                  <div>
                    <div className="text-sm font-medium">{contributor.username}</div>
                    <div className="text-xs font-mono text-[var(--text-muted)]">{contributor.name || 'Unknown'}</div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-lg font-display font-bold text-[var(--brand-primary)]">{contributor.commits}</div>
                  <div className="text-[10px] font-mono text-[var(--text-muted)] uppercase">Commits</div>
                </div>
              </div>
            )) : (
              <div className="h-full flex items-center justify-center text-[var(--text-muted)] text-sm">No contributors yet</div>
            )}
          </div>
        </GlassCard>
      </div>
    </motion.div>
  );
};

export default RepoAnalytics;
