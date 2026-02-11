import React, { useEffect, useState, useRef } from 'react';
import GlassCard from './GlassCard';
import { AgentStatus, AgentType } from '../types';
import { AGENT_ICONS } from '../constants';
import { Loader2, Terminal, MessageSquare, Bot } from 'lucide-react';

interface AgentDashboardProps {
  agents: AgentStatus[];
}

interface ChatMessage {
  id: string;
  agentId: AgentType;
  message: string;
  timestamp: number;
}

const AgentDashboard: React.FC<AgentDashboardProps> = ({ agents }) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Monitor agent status changes to trigger messages
  useEffect(() => {
    agents.forEach(agent => {
      if (agent.status === 'processing' || agent.status === 'completed') {
        const lastMsg = messages[messages.length - 1];
        // simple de-dupe to avoid spamming the same message
        if (!lastMsg || lastMsg.message !== agent.message) {

          // Don't show "Standing by" or "Cycle finished" as chat
          if (agent.message !== 'Standing by' && agent.message !== 'Cycle finished.') {
            setMessages(prev => [...prev, {
              id: Date.now().toString() + Math.random(),
              agentId: agent.id,
              message: agent.message,
              timestamp: Date.now()
            }]);
          }
        }
      }
    });
  }, [agents]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const activeAgents = agents.filter(a => a.status === 'processing');

  return (
    <div className="flex flex-col gap-4 h-full">
      {/* Live Agent Conversation Log */}
      <GlassCard className="flex-1 border-slate-200 dark:border-emerald-500/20 bg-white/80 dark:bg-[#050505]/80 flex flex-col p-0 overflow-hidden shadow-sm dark:shadow-none">
        <div className="p-4 border-b border-slate-100 dark:border-white/10 bg-slate-50 dark:bg-white/5 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Terminal size={16} className="text-emerald-600 dark:text-emerald-400" />
            <h3 className="font-bold text-sm text-slate-900 dark:text-white">Agent Communication Channel</h3>
          </div>
          <div className="flex items-center gap-2">
            {activeAgents.length > 0 && (
              <span className="flex items-center gap-1.5 text-xs text-emerald-600 dark:text-emerald-400 animate-pulse">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                Live
              </span>
            )}
          </div>
        </div>

        <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar">
          {messages.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-slate-400 dark:text-gray-600 opacity-50">
              <Bot size={48} className="mb-2" />
              <p className="text-sm">Waiting for agent activity...</p>
            </div>
          ) : (
            messages.map((msg) => {
              const agent = agents.find(a => a.id === msg.agentId);
              const Icon = agent ? AGENT_ICONS[agent.icon] : MessageSquare;

              return (
                <div key={msg.id} className="flex gap-3 animate-in fade-in slide-in-from-left-2 duration-300">
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 border
                                ${agent?.id === AgentType.ORCHESTRATOR
                      ? 'bg-emerald-50 border-emerald-200 text-emerald-700 dark:bg-emerald-500/20 dark:border-emerald-500/30 dark:text-emerald-300'
                      : 'bg-blue-50 border-blue-200 text-blue-700 dark:bg-blue-500/20 dark:border-blue-500/30 dark:text-blue-300'}
                            `}>
                    <Icon size={16} />
                  </div>
                  <div className="flex flex-col max-w-[85%]">
                    <div className="flex items-baseline gap-2 mb-0.5">
                      <span className={`text-xs font-bold ${agent?.id === AgentType.ORCHESTRATOR ? 'text-emerald-700 dark:text-emerald-400' : 'text-blue-700 dark:text-blue-400'}`}>
                        {agent?.name}
                      </span>
                      <span className="text-[10px] text-slate-400 dark:text-gray-600 font-mono">
                        {new Date(msg.timestamp).toLocaleTimeString([], { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                      </span>
                    </div>
                    <div className="text-sm text-slate-700 dark:text-gray-300 bg-slate-50 dark:bg-white/5 px-3 py-2 rounded-r-lg rounded-bl-lg border border-slate-200 dark:border-white/5 shadow-sm dark:shadow-none">
                      {msg.message}
                    </div>
                  </div>
                </div>
              );
            })
          )}

          {activeAgents.length > 0 && (
            <div className="flex gap-3 opacity-50">
              <div className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-gray-800 flex items-center justify-center shrink-0">
                <Loader2 size={16} className="animate-spin text-slate-400 dark:text-gray-400" />
              </div>
              <div className="flex items-center gap-1 h-8">
                <span className="w-1.5 h-1.5 bg-slate-400 dark:bg-gray-600 rounded-full animate-bounce [animation-delay:-0.3s]"></span>
                <span className="w-1.5 h-1.5 bg-slate-400 dark:bg-gray-600 rounded-full animate-bounce [animation-delay:-0.15s]"></span>
                <span className="w-1.5 h-1.5 bg-slate-400 dark:bg-gray-600 rounded-full animate-bounce"></span>
              </div>
            </div>
          )}
        </div>
      </GlassCard>

      {/* Mini Status Grid */}
      <div className="grid grid-cols-5 gap-2 h-20">
        {agents.map((agent) => {
          const Icon = AGENT_ICONS[agent.icon];
          const isActive = agent.status === 'processing';
          const isCompleted = agent.status === 'completed';

          return (
            <GlassCard
              key={agent.id}
              className={`p-0 flex flex-col items-center justify-center gap-1 transition-all duration-300 shadow-sm dark:shadow-none
                        ${isActive
                  ? 'bg-emerald-50 border-emerald-200 dark:bg-emerald-500/10 dark:border-emerald-500/30'
                  : isCompleted
                    ? 'bg-white border-slate-200 dark:bg-white/5 dark:border-white/10'
                    : 'opacity-50 grayscale bg-slate-100 dark:bg-transparent'}
                    `}
            >
              <Icon size={16} className={isActive ? 'text-emerald-600 dark:text-emerald-400 animate-pulse' : isCompleted ? 'text-emerald-600 dark:text-emerald-500' : 'text-slate-400 dark:text-gray-500'} />
              <span className="text-[9px] font-medium text-slate-500 dark:text-gray-400 truncate w-full text-center px-1">{agent.name.split(' ')[0]}</span>
            </GlassCard>
          )
        })}
      </div>
    </div>
  );
};

export default AgentDashboard;