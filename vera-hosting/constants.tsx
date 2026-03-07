import React from 'react';
import { AgentType, AgentStatus } from './types';
import { 
  ShieldCheck, 
  FileText, 
  Siren, 
  TrendingDown, 
  DollarSign, 
  MessageSquare, 
  PieChart, 
  BrainCircuit,
  Database,
  Search
} from 'lucide-react';

export const INITIAL_AGENTS: AgentStatus[] = [
  {
    id: AgentType.ORCHESTRATOR,
    name: 'Main Orchestrator',
    description: 'Prioritizes data & dispatches tasks',
    status: 'idle',
    message: 'Waiting for input...',
    icon: 'BrainCircuit'
  },
  {
    id: AgentType.VALIDATION,
    name: 'Multi-source Validation',
    description: 'Cross-references 15+ sources (NPI, etc.)',
    status: 'idle',
    message: 'Standing by',
    icon: 'ShieldCheck'
  },
  {
    id: AgentType.DOCUMENT,
    name: 'Document Parser',
    description: 'Extracts data from unstructured PDFs/images',
    status: 'idle',
    message: 'Standing by',
    icon: 'FileText'
  },
  {
    id: AgentType.FRAUD,
    name: 'Fraud Detection',
    description: 'Flags suspicious billing & licenses',
    status: 'idle',
    message: 'Standing by',
    icon: 'Siren'
  },
  {
    id: AgentType.DEGRADATION,
    name: 'Predictive Degradation',
    description: 'Predicts data accuracy decay',
    status: 'idle',
    message: 'Standing by',
    icon: 'TrendingDown'
  },
  {
    id: AgentType.BUSINESS,
    name: 'Business Impact',
    description: 'Calculates financial value & ROI',
    status: 'idle',
    message: 'Standing by',
    icon: 'DollarSign'
  },
  {
    id: AgentType.COMMUNICATOR,
    name: 'Communicator',
    description: 'Automates provider outreach',
    status: 'idle',
    message: 'Standing by',
    icon: 'MessageSquare'
  },
  {
    id: AgentType.GRAPHICAL,
    name: 'Graphical',
    description: 'Visualizes heatmaps & coverage',
    status: 'idle',
    message: 'Standing by',
    icon: 'PieChart'
  }
];

export const MOCK_CHART_DATA = [
  { name: 'Jan', value: 400, secondaryValue: 240 },
  { name: 'Feb', value: 300, secondaryValue: 139 },
  { name: 'Mar', value: 200, secondaryValue: 980 },
  { name: 'Apr', value: 278, secondaryValue: 390 },
  { name: 'May', value: 189, secondaryValue: 480 },
];

export const AGENT_ICONS: Record<string, React.FC<any>> = {
  BrainCircuit,
  ShieldCheck,
  FileText,
  Siren,
  TrendingDown,
  DollarSign,
  MessageSquare,
  PieChart,
  Database,
  Search
};