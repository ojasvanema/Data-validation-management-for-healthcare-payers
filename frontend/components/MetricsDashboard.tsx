import React from 'react';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, BarChart, Bar, Cell, Treemap } from 'recharts';
import GlassCard from './GlassCard';
import { AnalysisResult } from '../types';
import { DollarSign, ShieldAlert, Users, AlertOctagon, TrendingUp, Map, ArrowRight, ExternalLink } from 'lucide-react';

interface MetricsDashboardProps {
  data: AnalysisResult | null;
  onViewDetails?: () => void;
}

import { useTheme } from './ThemeContext';

const MetricsDashboard: React.FC<MetricsDashboardProps> = ({ data, onViewDetails }) => {
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  if (!data) return (
    <div className="h-full flex flex-col items-center justify-center text-slate-400 dark:text-gray-500 space-y-4">
      <div className="p-4 bg-slate-100 dark:bg-white/5 rounded-full">
        <TrendingUp size={48} className="text-emerald-600 dark:text-emerald-900" />
      </div>
      <p className="text-lg">Run an orchestration to see live metrics</p>
    </div>
  );

  const chartGridColor = isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)';
  const chartAxisColor = isDark ? 'rgba(255,255,255,0.3)' : 'rgba(0,0,0,0.4)';
  const tooltipBg = isDark ? '#022c22' : '#ffffff';
  const tooltipBorder = isDark ? '#064e3b' : '#e2e8f0';
  const tooltipText = isDark ? '#fff' : '#0f172a';

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-in fade-in slide-in-from-bottom-4 duration-700 pb-8">

      {/* Header with Action */}
      <div className="lg:col-span-3 flex items-center justify-between mb-2">
        <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Analysis Overview</h2>
        {onViewDetails && (
          <button
            onClick={onViewDetails}
            className="group flex items-center gap-2 px-4 py-2 bg-emerald-50 dark:bg-emerald-500/10 hover:bg-emerald-100 dark:hover:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/20 rounded-lg transition-all"
          >
            <span>Deep Dive Analysis</span>
            <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
          </button>
        )}
      </div>

      {/* KPIs */}
      <div className="lg:col-span-3 grid grid-cols-2 md:grid-cols-4 gap-4">
        <GlassCard className="p-4 flex flex-col items-center justify-center text-center border-emerald-200 dark:border-emerald-500/20 bg-emerald-50 dark:bg-emerald-900/10 shadow-sm dark:shadow-none">
          <DollarSign className="text-emerald-600 dark:text-emerald-400 mb-2" size={24} />
          <span className="text-emerald-700/60 dark:text-emerald-200/60 text-xs uppercase tracking-wider">Potential ROI</span>
          <span className="text-2xl font-bold text-slate-900 dark:text-white">${data.roi.toLocaleString()}</span>
        </GlassCard>
        <GlassCard className="p-4 flex flex-col items-center justify-center text-center border-red-200 dark:border-red-500/20 bg-red-50 dark:bg-red-900/10 shadow-sm dark:shadow-none">
          <ShieldAlert className="text-red-500 dark:text-red-400 mb-2" size={24} />
          <span className="text-red-700/60 dark:text-red-200/60 text-xs uppercase tracking-wider">Fraud Risk</span>
          <span className="text-2xl font-bold text-slate-900 dark:text-white">{data.fraudRiskScore}/100</span>
        </GlassCard>
        <GlassCard className="p-4 flex flex-col items-center justify-center text-center border-blue-200 dark:border-blue-500/20 bg-blue-50 dark:bg-blue-900/10 shadow-sm dark:shadow-none">
          <Users className="text-blue-500 dark:text-blue-400 mb-2" size={24} />
          <span className="text-blue-700/60 dark:text-blue-200/60 text-xs uppercase tracking-wider">Providers</span>
          <span className="text-2xl font-bold text-slate-900 dark:text-white">{data.providersProcessed}</span>
        </GlassCard>
        <GlassCard className="p-4 flex flex-col items-center justify-center text-center border-orange-200 dark:border-orange-500/20 bg-orange-50 dark:bg-orange-900/10 shadow-sm dark:shadow-none">
          <AlertOctagon className="text-orange-500 dark:text-orange-400 mb-2" size={24} />
          <span className="text-orange-700/60 dark:text-orange-200/60 text-xs uppercase tracking-wider">Discrepancies</span>
          <span className="text-2xl font-bold text-slate-900 dark:text-white">{data.discrepanciesFound}</span>
        </GlassCard>
      </div>

      {/* Main Graph */}
      <GlassCard className="lg:col-span-2 p-6 min-h-[300px]">
        <h3 className="text-lg font-semibold mb-6 text-slate-900 dark:text-white flex items-center gap-2">
          <span className="w-2 h-6 bg-emerald-500 rounded-sm"></span>
          Validation Throughput
        </h3>
        <ResponsiveContainer width="100%" height={250}>
          <AreaChart data={data.timelineData}>
            <defs>
              <linearGradient id="colorVal" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="colorIss" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#f43f5e" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke={chartGridColor} />
            <XAxis dataKey="name" stroke={chartAxisColor} fontSize={12} tickLine={false} axisLine={false} />
            <YAxis stroke={chartAxisColor} fontSize={12} tickLine={false} axisLine={false} />
            <Tooltip
              contentStyle={{ backgroundColor: tooltipBg, borderColor: tooltipBorder, color: tooltipText, borderRadius: '8px', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
              itemStyle={{ color: tooltipText }}
            />
            <Area type="monotone" dataKey="value" stroke="#10b981" strokeWidth={2} fillOpacity={1} fill="url(#colorVal)" name="Valid Records" />
            <Area type="monotone" dataKey="secondaryValue" stroke="#f43f5e" strokeWidth={2} fillOpacity={1} fill="url(#colorIss)" name="Issues" />
          </AreaChart>
        </ResponsiveContainer>
      </GlassCard>

      {/* Risk Distribution */}
      <GlassCard className="p-6 min-h-[300px]">
        <h3 className="text-lg font-semibold mb-6 text-slate-900 dark:text-white flex items-center gap-2">
          <span className="w-2 h-6 bg-yellow-500 rounded-sm"></span>
          Risk Distribution
        </h3>
        <ResponsiveContainer width="100%" height={250}>
          <BarChart data={data.riskDistribution}>
            <CartesianGrid strokeDasharray="3 3" stroke={chartGridColor} vertical={false} />
            <XAxis dataKey="name" stroke={chartAxisColor} fontSize={12} tickLine={false} axisLine={false} />
            <Tooltip
              cursor={{ fill: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)' }}
              contentStyle={{ backgroundColor: tooltipBg, borderColor: tooltipBorder, color: tooltipText, borderRadius: '8px', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
            />
            <Bar dataKey="value" radius={[4, 4, 0, 0]}>
              {data.riskDistribution.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={['#10b981', '#f59e0b', '#ef4444'][index % 3]} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </GlassCard>

      {/* Agent Logs (Scrollable) */}
      <GlassCard className="lg:col-span-3 p-6 max-h-[300px] overflow-hidden flex flex-col">
        <h3 className="text-lg font-semibold mb-4 text-slate-900 dark:text-white sticky top-0 flex items-center gap-2">
          <span className="w-2 h-6 bg-blue-500 rounded-sm"></span>
          System Logs
        </h3>
        <div className="overflow-y-auto pr-2 space-y-2 custom-scrollbar">
          {data.agentLogs.map((log, idx) => (
            <div key={idx} className="flex gap-4 text-sm border-b border-slate-100 dark:border-white/5 pb-3 last:border-0 hover:bg-slate-50 dark:hover:bg-white/5 p-2 rounded transition-colors">
              <span className="text-slate-400 dark:text-gray-500 font-mono text-xs w-24 shrink-0 pt-1">{new Date(log.timestamp).toLocaleTimeString()}</span>
              <span className="text-emerald-600 dark:text-emerald-400 font-bold w-32 shrink-0 pt-1">{log.agent}</span>
              <span className="text-slate-600 dark:text-gray-300 leading-relaxed">{log.log}</span>
            </div>
          ))}
        </div>
      </GlassCard>
    </div>
  );
};

export default MetricsDashboard;