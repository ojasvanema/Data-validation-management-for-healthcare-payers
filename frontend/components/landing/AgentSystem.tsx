import React from 'react';
import { FileText, ShieldCheck, Siren, TrendingUp, DollarSign, Mail, PieChart, Activity } from 'lucide-react';
import { Agent } from '../types';

const agents: Agent[] = [
    {
        id: 'parser',
        title: 'Parser Agent',
        role: 'The Gatekeeper',
        description: 'Digitizes and structures raw input from PDFs, images, and CSVs using OCR.',
        icon: FileText
    },
    {
        id: 'validation',
        title: 'Validation Agent',
        role: 'Compliance Officer',
        description: 'Cross-references NPIs and licenses against NPPES and OIG registries.',
        icon: ShieldCheck
    },
    {
        id: 'fraud',
        title: 'Fraud Detection',
        role: 'Security Analyst',
        description: 'Scans for geographic impossibilities, address mismatches, and aliases.',
        icon: Siren
    },
    {
        id: 'predictive',
        title: 'Predictive Agent',
        role: 'The Forecaster',
        description: 'Generates degradation probability curves to predict data obsolescence.',
        icon: TrendingUp
    },
    {
        id: 'business',
        title: 'Business Agent',
        role: 'The Strategist',
        description: 'Calculates ROI by comparing validation costs against potential fraud loss.',
        icon: DollarSign
    },
    {
        id: 'communication',
        title: 'Comms Agent',
        role: 'The Liaison',
        description: 'Drafts emails to providers and queues notifications for manual review.',
        icon: Mail
    },
    {
        id: 'visualization',
        title: 'Visual Agent',
        role: 'The Presenter',
        description: 'Synthesizes complex outputs into intuitive Data Explorer charts.',
        icon: PieChart
    }
];

const AgentCard: React.FC<{ agent: Agent, index: number }> = ({ agent, index }) => (
    <div className={`group relative p-6 rounded-xl border border-white/10 bg-white/[0.02] hover:bg-white/[0.04] transition-all duration-300 hover:border-emerald-500/30 overflow-hidden ${index === 0 || index === 6 ? 'md:col-span-2' : ''}`}>
        <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/0 via-transparent to-transparent opacity-0 group-hover:opacity-10 transition-opacity duration-500"></div>
        <div className="relative z-10">
            <div className="w-12 h-12 rounded-lg bg-neutral-900 border border-white/10 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
                <agent.icon className="w-6 h-6 text-emerald-500" />
            </div>
            <h3 className="text-xl font-bold text-white mb-1 font-mono">{agent.title}</h3>
            <div className="text-xs uppercase tracking-wider text-emerald-400 mb-3">{agent.role}</div>
            <p className="text-gray-400 text-sm leading-relaxed">{agent.description}</p>
        </div>
        
        {/* Decorative corner */}
        <div className="absolute top-0 right-0 w-16 h-16 bg-gradient-to-bl from-emerald-500/5 to-transparent -mr-8 -mt-8 rounded-full blur-xl group-hover:bg-emerald-500/20 transition-all duration-500"></div>
    </div>
);

const AgentSystem: React.FC = () => {
  return (
    <section id="agents" className="py-24 relative">
        <div className="max-w-7xl mx-auto px-6">
            <div className="mb-16 text-center">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-mono mb-6">
                    <Activity className="w-3 h-3" />
                    <span>LANGGRAPH ORCHESTRATION</span>
                </div>
                <h2 className="text-3xl md:text-5xl font-bold text-white mb-6">The 7-Agent Architecture</h2>
                <p className="text-gray-400 max-w-2xl mx-auto text-lg">
                    A collective of specialized autonomous agents working in concert to ensure absolute data integrity.
                </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                {agents.map((agent, i) => (
                    <AgentCard key={agent.id} agent={agent} index={i} />
                ))}
            </div>
        </div>
    </section>
  );
};

export default AgentSystem;