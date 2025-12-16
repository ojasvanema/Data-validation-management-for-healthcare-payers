import React from 'react';
import GlassCard from './GlassCard';
import { AgentStatus, AgentType } from '../types';
import { AGENT_ICONS } from '../constants';
import { Loader2, CheckCircle2, AlertTriangle, PlayCircle } from 'lucide-react';

interface AgentDashboardProps {
  agents: AgentStatus[];
}

const AgentDashboard: React.FC<AgentDashboardProps> = ({ agents }) => {
  const orchestrator = agents.find(a => a.id === AgentType.ORCHESTRATOR);
  const workerAgents = agents.filter(a => a.id !== AgentType.ORCHESTRATOR);

  return (
    <div className="flex flex-col gap-6 h-full">
      {/* Main Orchestrator Section */}
      <GlassCard className="p-6 border-emerald-500/20 bg-emerald-950/20 shadow-[0_0_30px_rgba(16,185,129,0.1)]">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-4">
            <div className={`p-3 rounded-full transition-colors duration-500 ${orchestrator?.status === 'processing' ? 'bg-emerald-500/20' : 'bg-white/5'}`}>
              {orchestrator && React.createElement(AGENT_ICONS[orchestrator.icon], {
                size: 32,
                className: orchestrator.status === 'processing' ? "text-emerald-300 animate-pulse" : "text-gray-400"
              })}
            </div>
            <div>
              <h3 className="text-xl font-bold text-white">{orchestrator?.name}</h3>
              <p className="text-emerald-200/70 text-sm">{orchestrator?.description}</p>
            </div>
          </div>
          <div className={`px-4 py-1 rounded-full text-sm font-mono border transition-all duration-300
            ${orchestrator?.status === 'processing'
              ? 'bg-emerald-500/10 border-emerald-500/50 text-emerald-300 animate-pulse'
              : 'bg-black/20 border-white/5 text-gray-500'}`
          }>
            {orchestrator?.message}
          </div>
        </div>
        <div className="w-full h-1 bg-white/5 rounded-full overflow-hidden">
          <div className={`h-full bg-emerald-400 transition-all duration-1000 ease-out ${orchestrator?.status === 'processing' ? 'w-full animate-progress' : 'w-0'}`} />
        </div>
      </GlassCard>

      {/* Worker Agents Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-4 flex-grow overflow-y-auto pr-1">
        {workerAgents.map((agent) => {
          const Icon = AGENT_ICONS[agent.icon];
          const isActive = agent.status !== 'idle';

          return (
            <GlassCard
              key={agent.id}
              className={`p-4 flex flex-col justify-between transition-all duration-500
                ${isActive ? 'opacity-100' : 'opacity-40 grayscale hover:opacity-60'}
              `}
              hoverEffect={isActive}
            >
              <div className="flex justify-between items-start mb-2">
                <div className={`p-2 rounded-lg transition-colors duration-300 ${agent.status === 'processing' ? 'bg-emerald-500/20' : 'bg-white/5'}`}>
                  <Icon size={20} className={agent.status === 'processing' ? 'text-emerald-300 animate-pulse' : agent.status === 'completed' ? 'text-emerald-400' : 'text-gray-400'} />
                </div>
                {agent.status === 'processing' && <Loader2 size={16} className="animate-spin text-emerald-400" />}
                {agent.status === 'completed' && <CheckCircle2 size={16} className="text-emerald-400" />}
                {agent.status === 'error' && <AlertTriangle size={16} className="text-red-400" />}
                {agent.status === 'idle' && <PlayCircle size={16} className="text-gray-600" />}
              </div>

              <div>
                <h4 className={`font-semibold mb-1 ${isActive ? 'text-white' : 'text-gray-400'}`}>{agent.name}</h4>
                <p className="text-xs text-gray-400 mb-3 line-clamp-2">{agent.description}</p>
                <div className={`text-xs font-mono p-2 rounded border transition-all duration-300 truncate
                   ${isActive ? 'bg-black/20 border-white/10 text-gray-300' : 'bg-transparent border-transparent text-gray-600'}
                `}>
                  {agent.message}
                </div>
              </div>
            </GlassCard>
          );
        })}
      </div>
    </div>
  );
};

export default AgentDashboard;