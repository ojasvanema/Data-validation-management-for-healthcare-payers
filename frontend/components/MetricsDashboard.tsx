import React from 'react';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, BarChart, Bar, Cell } from 'recharts';
import GlassCard from './GlassCard';
import { AnalysisResult } from '../types';
import { DollarSign, ShieldAlert, Users, AlertOctagon, TrendingUp } from 'lucide-react';

interface MetricsDashboardProps {
  data: AnalysisResult | null;
}

const MetricsDashboard: React.FC<MetricsDashboardProps> = ({ data }) => {
  if (!data) return (
    <div className="h-full flex flex-col items-center justify-center text-gray-500 space-y-4">
      <div className="p-4 bg-white/5 rounded-full">
         <TrendingUp size={48} className="text-emerald-900" />
      </div>
      <p className="text-lg">Run an orchestration to see live metrics</p>
    </div>
  );

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
      
      {/* KPIs */}
      <div className="lg:col-span-3 grid grid-cols-2 md:grid-cols-4 gap-4">
        <GlassCard className="p-4 flex flex-col items-center justify-center text-center border-emerald-500/20 bg-emerald-900/10">
            <DollarSign className="text-emerald-400 mb-2" size={24} />
            <span className="text-emerald-200/60 text-xs uppercase tracking-wider">Potential ROI</span>
            <span className="text-2xl font-bold text-white">${data.roi.toLocaleString()}</span>
        </GlassCard>
        <GlassCard className="p-4 flex flex-col items-center justify-center text-center border-red-500/20 bg-red-900/10">
            <ShieldAlert className="text-red-400 mb-2" size={24} />
            <span className="text-red-200/60 text-xs uppercase tracking-wider">Fraud Risk</span>
            <span className="text-2xl font-bold text-white">{data.fraudRiskScore}/100</span>
        </GlassCard>
        <GlassCard className="p-4 flex flex-col items-center justify-center text-center border-blue-500/20 bg-blue-900/10">
            <Users className="text-blue-400 mb-2" size={24} />
            <span className="text-blue-200/60 text-xs uppercase tracking-wider">Providers</span>
            <span className="text-2xl font-bold text-white">{data.providersProcessed}</span>
        </GlassCard>
        <GlassCard className="p-4 flex flex-col items-center justify-center text-center border-orange-500/20 bg-orange-900/10">
            <AlertOctagon className="text-orange-400 mb-2" size={24} />
            <span className="text-orange-200/60 text-xs uppercase tracking-wider">Discrepancies</span>
            <span className="text-2xl font-bold text-white">{data.discrepanciesFound}</span>
        </GlassCard>
      </div>

      {/* Main Graph */}
      <GlassCard className="lg:col-span-2 p-6 min-h-[300px]">
        <h3 className="text-lg font-semibold mb-6 text-white flex items-center gap-2">
          <span className="w-2 h-6 bg-emerald-500 rounded-sm"></span>
          Validation Throughput
        </h3>
        <ResponsiveContainer width="100%" height={250}>
          <AreaChart data={data.timelineData}>
            <defs>
              <linearGradient id="colorVal" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
              </linearGradient>
              <linearGradient id="colorIss" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.3}/>
                <stop offset="95%" stopColor="#f43f5e" stopOpacity={0}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
            <XAxis dataKey="name" stroke="rgba(255,255,255,0.3)" fontSize={12} tickLine={false} axisLine={false} />
            <YAxis stroke="rgba(255,255,255,0.3)" fontSize={12} tickLine={false} axisLine={false} />
            <Tooltip 
              contentStyle={{ backgroundColor: '#022c22', borderColor: '#064e3b', color: '#fff', borderRadius: '8px' }}
              itemStyle={{ color: '#fff' }}
            />
            <Area type="monotone" dataKey="value" stroke="#10b981" strokeWidth={2} fillOpacity={1} fill="url(#colorVal)" name="Valid Records" />
            <Area type="monotone" dataKey="secondaryValue" stroke="#f43f5e" strokeWidth={2} fillOpacity={1} fill="url(#colorIss)" name="Issues" />
          </AreaChart>
        </ResponsiveContainer>
      </GlassCard>

      {/* Risk Distribution */}
      <GlassCard className="p-6 min-h-[300px]">
        <h3 className="text-lg font-semibold mb-6 text-white flex items-center gap-2">
          <span className="w-2 h-6 bg-yellow-500 rounded-sm"></span>
          Risk Distribution
        </h3>
        <ResponsiveContainer width="100%" height={250}>
          <BarChart data={data.riskDistribution}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
            <XAxis dataKey="name" stroke="rgba(255,255,255,0.3)" fontSize={12} tickLine={false} axisLine={false} />
            <Tooltip
                cursor={{fill: 'rgba(255,255,255,0.05)'}}
                contentStyle={{ backgroundColor: '#022c22', borderColor: '#064e3b', color: '#fff', borderRadius: '8px' }}
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
        <h3 className="text-lg font-semibold mb-4 text-white sticky top-0 flex items-center gap-2">
            <span className="w-2 h-6 bg-blue-500 rounded-sm"></span>
            System Logs
        </h3>
        <div className="overflow-y-auto pr-2 space-y-2 custom-scrollbar">
            {data.agentLogs.map((log, idx) => (
                <div key={idx} className="flex gap-4 text-sm border-b border-white/5 pb-3 last:border-0 hover:bg-white/5 p-2 rounded transition-colors">
                    <span className="text-gray-500 font-mono text-xs w-24 shrink-0 pt-1">{new Date(log.timestamp).toLocaleTimeString()}</span>
                    <span className="text-emerald-400 font-bold w-32 shrink-0 pt-1">{log.agent}</span>
                    <span className="text-gray-300 leading-relaxed">{log.log}</span>
                </div>
            ))}
        </div>
      </GlassCard>
    </div>
  );
};

export default MetricsDashboard;