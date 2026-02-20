export enum AgentType {
  ORCHESTRATOR = 'ORCHESTRATOR',
  VALIDATION = 'VALIDATION',
  DOCUMENT = 'DOCUMENT',
  FRAUD = 'FRAUD',
  DEGRADATION = 'DEGRADATION',
  BUSINESS = 'BUSINESS',
  COMMUNICATOR = 'COMMUNICATOR',
  GRAPHICAL = 'GRAPHICAL'
}

export interface AgentStatus {
  id: AgentType;
  name: string;
  description: string;
  status: 'idle' | 'processing' | 'completed' | 'error';
  message: string;
  icon: string;
}

export interface ChartDataPoint {
  name: string;
  value: number;
  secondaryValue?: number;
}

export interface AgentThought {
  agentName: string;
  thought: string;
  verdict: 'pass' | 'fail' | 'warn' | 'neutral';
  timestamp: string;
}

export interface ProviderRecord {
  id: string;
  name: string;
  npi: string;
  specialty: string;
  riskScore: number; // 0-100
  decayProb: number; // 0-1
  status: 'Verified' | 'Flagged' | 'Review' | 'Pending';
  conflicts: string[];
  agentThoughts: AgentThought[];
  lastUpdated: string;
  state: string; // US State Code (e.g., 'NY', 'CA')
  complaints?: Complaint[];
  locations: {
    address: string;
    updated: string;
  }[];
  contact_numbers: {
    number: string;
    type: string;
  }[];
}

export interface Complaint {
  field: string;
  value: string;
  date: string;
  notes: string;
}

export interface AnalysisResult {
  roi: number;
  fraudRiskScore: number; // 0-100
  providersProcessed: number;
  discrepanciesFound: number;
  timelineData: ChartDataPoint[];
  riskDistribution: ChartDataPoint[];
  records: ProviderRecord[]; // Added detailed records
  agentLogs: {
    agent: AgentType;
    log: string;
    timestamp: string;
  }[];
  summary: string;
}

export interface HistoryItem {
  id: string;
  timestamp: Date;
  summary: string;
  result: AnalysisResult;
}

export interface FileUpload {
  name: string;
  type: string;
  size: number;
  content?: string; // Base64 for images/PDFs if needed in full implementation, usually processed differently
  file?: File; // Actual file object for upload
}