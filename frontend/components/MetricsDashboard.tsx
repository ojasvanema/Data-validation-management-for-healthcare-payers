import React from 'react';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, BarChart, Bar, Cell, Treemap, ReferenceLine } from 'recharts';
import GlassCard from './GlassCard';
import USHeatmap from './USHeatmap';
import { AnalysisResult } from '../types';
import { DollarSign, ShieldAlert, Users, AlertOctagon, TrendingUp, Map, ArrowRight, ExternalLink, Timer } from 'lucide-react';

interface MetricsDashboardProps {
  data: AnalysisResult | null;
  onViewDetails?: () => void;
}

import { useTheme } from './ThemeContext';
import { bulkApproveSafe } from '../services/apiService';
import { useState } from 'react';
import { CheckCircle } from 'lucide-react';

const BatchApproveButton = ({ onRefresh, pendingCount }: { onRefresh?: () => void, pendingCount: number }) => {
  const [status, setStatus] = useState<'idle' | 'pushing' | 'success'>('idle');

  const handleApprove = async () => {
    if (status !== 'idle') return;

    // Start "Pushing" state
    setStatus('pushing');

    try {
      // Artificial delay to show the "Pushing to DB" visual
      await new Promise(resolve => setTimeout(resolve, 1500));

      // Actual API call
      await bulkApproveSafe();

      // Show success
      setStatus('success');

      // Wait a bit on success before refreshing
      await new Promise(resolve => setTimeout(resolve, 1000));

      if (onRefresh && typeof onRefresh === 'function') {
        // onRefresh logic
      }
    } catch (e) {
      console.error("Bulk approve failed", e);
      setStatus('idle');
    } finally {
      if (status !== 'idle') {
        window.location.reload();
      }
    }
  };

  const isDisabled = (status !== 'idle' && status !== 'success') || (pendingCount === 0 && status === 'idle');

  return (
    <button
      onClick={handleApprove}
      disabled={isDisabled}
      className={`
        flex items-center gap-2 px-4 py-2 rounded-lg shadow-md transition-all 
        ${isDisabled && status === 'idle'
          ? 'bg-slate-200 dark:bg-slate-800 text-slate-400 dark:text-gray-500 cursor-not-allowed opacity-70'
          : status === 'success'
            ? 'bg-emerald-500 text-white'
            : 'bg-emerald-600 hover:bg-emerald-700 text-white animate-in fade-in zoom-in-95'}
      `}
    >
      {status === 'pushing' ? (
        <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
      ) : status === 'success' ? (
        <CheckCircle size={16} className="animate-bounce" />
      ) : (
        <CheckCircle size={16} />
      )}
      <span>
        {status === 'pushing' ? 'Pushing Verification to DB...' :
          status === 'success' ? 'Synced to Database!' :
            pendingCount > 0
              ? `Batch Approve ${pendingCount} Safe Records`
              : 'No Pending Safe Records to Approve'}
      </span>
    </button>
  );
};

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

      {/* Batch Approve Action */}
      {data && (
        <div className="lg:col-span-3 mb-2 flex justify-end">
          <BatchApproveButton
            onRefresh={onViewDetails}
            pendingCount={data.records.filter(r => r.status === 'Pending' && r.riskScore <= 35).length}
          />
        </div>
      )}

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

      {/* Predictive Degradation Agent — Full-Width Decay Forecast */}
      <GlassCard className="lg:col-span-3 p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-slate-900 dark:text-white flex items-center gap-2">
            <span className="w-2 h-6 bg-purple-500 rounded-sm"></span>
            Predictive Data Decay
          </h3>
          <span className="text-[10px] font-semibold text-purple-500 dark:text-purple-400 uppercase tracking-wider bg-purple-50 dark:bg-purple-500/10 px-2 py-1 rounded-full border border-purple-100 dark:border-purple-500/20">
            Degradation Agent
          </span>
        </div>
        {(() => {
          // Compute aggregate survival curve: S(t) = exp(-λ·t)
          // λ = -ln(1 - decayProb) / 90 for each provider (decayProb = P(fail in 90 days))
          const lambdas = data.records.map(r => {
            const dp = Math.min(Math.max(r.decayProb, 0.01), 0.99);
            return -Math.log(1 - dp) / 90;
          });
          const meanLambda = lambdas.reduce((a, b) => a + b, 0) / (lambdas.length || 1);

          // Generate S(t) curve points for 0..180 days
          const curveData = [];
          for (let t = 0; t <= 180; t += 10) {
            const survivalPct = Math.exp(-meanLambda * t) * 100;
            curveData.push({ day: t, survival: Math.round(survivalPct * 10) / 10 });
          }

          // Find "re-verify by" date where S(t) < 70%
          const reVerifyDay = curveData.find(p => p.survival < 70)?.day || 180;

          // Bucket counts
          const lowDecay = data.records.filter(r => r.decayProb < 0.3).length;
          const modDecay = data.records.filter(r => r.decayProb >= 0.3 && r.decayProb < 0.6).length;
          const highDecay = data.records.filter(r => r.decayProb >= 0.6).length;
          const avgDecay = data.records.length > 0
            ? (data.records.reduce((s, r) => s + r.decayProb, 0) / data.records.length * 100)
            : 0;

          // Future date for re-verify
          const reVerifyDate = new Date();
          reVerifyDate.setDate(reVerifyDate.getDate() + reVerifyDay);
          const reVerifyStr = reVerifyDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

          return (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Survival Curve */}
              <div className="lg:col-span-2">

                <ResponsiveContainer width="100%" height={220}>
                  <AreaChart data={curveData} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
                    <defs>
                      <linearGradient id="colorSurvival" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#a855f7" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#a855f7" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke={chartGridColor} />
                    <XAxis
                      dataKey="day"
                      stroke={chartAxisColor}
                      fontSize={11}
                      tickLine={false}
                      axisLine={false}
                      label={{ value: 'Days from now', position: 'insideBottom', offset: -2, fontSize: 10, fill: chartAxisColor }}
                    />
                    <YAxis
                      domain={[0, 100]}
                      stroke={chartAxisColor}
                      fontSize={11}
                      tickLine={false}
                      axisLine={false}
                      tickFormatter={(v: number) => `${v}%`}
                      label={{ value: 'Data Accuracy', angle: -90, position: 'insideLeft', offset: 10, fontSize: 10, fill: chartAxisColor }}
                    />
                    <Tooltip
                      contentStyle={{ backgroundColor: tooltipBg, borderColor: tooltipBorder, color: tooltipText, borderRadius: '8px', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                      formatter={(value: number) => [`${value.toFixed(1)}%`, 'Accuracy']}
                      labelFormatter={(label: number) => `Day ${label}`}
                    />
                    {/* 70% threshold reference line */}
                    <ReferenceLine y={70} stroke={isDark ? 'rgba(239,68,68,0.5)' : 'rgba(239,68,68,0.35)'} strokeDasharray="6 4" />
                    <Area
                      type="monotone"
                      dataKey="survival"
                      stroke="#a855f7"
                      strokeWidth={2.5}
                      fillOpacity={1}
                      fill="url(#colorSurvival)"
                      name="Data Accuracy"
                      dot={false}
                      activeDot={{ r: 4, fill: '#a855f7', stroke: '#fff', strokeWidth: 2 }}
                    />
                  </AreaChart>
                </ResponsiveContainer>

              </div>

              {/* Stats Panel */}
              <div className="flex flex-col gap-3">
                {/* Bucket Cards */}
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { label: 'Stable', count: lowDecay, color: 'emerald', icon: '✓' },
                    { label: 'At Risk', count: modDecay, color: 'amber', icon: '⚠' },
                    { label: 'Critical', count: highDecay, color: 'red', icon: '✗' },
                  ].map((b, i) => (
                    <div key={i} className={`text-center p-3 rounded-lg border bg-${b.color}-50 dark:bg-${b.color}-500/10 border-${b.color}-100 dark:border-${b.color}-500/20`}
                      style={{ backgroundColor: isDark ? `${['#064e3b', '#78350f', '#7f1d1d'][i]}22` : undefined, borderColor: isDark ? `${['#10b981', '#f59e0b', '#ef4444'][i]}33` : undefined }}>
                      <div className="text-2xl font-bold text-slate-900 dark:text-white">{b.count}</div>
                      <div className="text-[10px] uppercase tracking-wider" style={{ color: ['#10b981', '#f59e0b', '#ef4444'][i] }}>{b.icon} {b.label}</div>
                    </div>
                  ))}
                </div>

                {/* Avg Decay */}
                <div className="p-3 bg-purple-50 dark:bg-purple-500/10 rounded-lg border border-purple-100 dark:border-purple-500/20">
                  <div className="text-[10px] text-purple-600 dark:text-purple-400 font-semibold uppercase tracking-wider">Avg Decay Probability</div>
                  <div className="text-2xl font-bold text-purple-700 dark:text-purple-300">{avgDecay.toFixed(1)}%</div>
                  <div className="w-full h-1.5 bg-purple-200 dark:bg-purple-800/50 rounded-full mt-2 overflow-hidden">
                    <div className="h-full bg-purple-500 rounded-full" style={{ width: `${Math.min(avgDecay, 100)}%` }}></div>
                  </div>
                </div>

                {/* Next Action */}
                <div className="p-3 bg-slate-50 dark:bg-white/5 rounded-lg border border-slate-200 dark:border-white/10">
                  <div className="text-[10px] text-slate-500 dark:text-gray-500 font-semibold uppercase tracking-wider mb-1">Next Bulk Re-verification</div>
                  <div className="flex items-baseline gap-2">
                    <Timer size={14} className="text-purple-500" />
                    <span className="text-sm font-bold text-slate-900 dark:text-white">{reVerifyStr}</span>
                  </div>
                  <div className="text-[10px] text-slate-400 dark:text-gray-600 mt-1">
                    ~{reVerifyDay} days until accuracy drops below 70%
                  </div>
                </div>


              </div>
            </div>
          );
        })()}
      </GlassCard>

      {/* US Provider Heatmap */}
      <USHeatmap records={data.records} />

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