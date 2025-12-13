import { AnalysisResult, FileUpload, AgentType } from "../types";

// Mock Data Generation
const generateMockResult = (): AnalysisResult => {
    return {
        roi: 1250000,
        fraudRiskScore: 42,
        providersProcessed: 1542,
        discrepanciesFound: 128,
        summary: "Analysis Complete: High ROI potential detected. 128 discrepancies found in 1,542 inspected provider records. Critical fraud flags in 'New York' region requiring immediate review.",
        timelineData: [
            { name: '00:00', value: 45, secondaryValue: 2 },
            { name: '04:00', value: 120, secondaryValue: 5 },
            { name: '08:00', value: 890, secondaryValue: 45 },
            { name: '12:00', value: 1200, secondaryValue: 88 },
            { name: '16:00', value: 1542, secondaryValue: 128 },
        ],
        riskDistribution: [
            { name: 'Low Risk', value: 1200 },
            { name: 'Medium Risk', value: 300 },
            { name: 'High Risk', value: 42 }
        ],
        agentLogs: [
            { agent: AgentType.ORCHESTRATOR, log: "Batch ingestion started: 1,542 records.", timestamp: new Date().toISOString() },
            { agent: AgentType.DOCUMENT, log: "OCR processing complete. 98.5% confidence.", timestamp: new Date().toISOString() },
            { agent: AgentType.VALIDATION, log: "NPI Registry cross-reference started.", timestamp: new Date().toISOString() },
            { agent: AgentType.VALIDATION, log: "15 license mismatches detected.", timestamp: new Date().toISOString() },
            { agent: AgentType.FRAUD, log: "Anomaly detected in billing cycle ID #9928.", timestamp: new Date().toISOString() },
            { agent: AgentType.BUSINESS, log: "ROI calculation updated based on fraud prevention.", timestamp: new Date().toISOString() },
            { agent: AgentType.ORCHESTRATOR, log: "Processing complete.", timestamp: new Date().toISOString() }
        ],
        records: [
            {
                id: "1",
                name: "Dr. Sarah Chen",
                npi: "1928374650",
                specialty: "Cardiology",
                riskScore: 12,
                decayProb: 0.05,
                status: "Verified",
                conflicts: [],
                lastUpdated: new Date().toISOString(),
                agentThoughts: [
                    { agentName: "Validation Agent", thought: "NPI confirmed in CMS Registry. Active status.", verdict: "pass", timestamp: new Date().toISOString() },
                    { agentName: "Fraud Detection", thought: "No abnormal billing patterns found in last 12 months.", verdict: "pass", timestamp: new Date().toISOString() }
                ]
            },
            {
                id: "2",
                name: "Dr. James Wilson",
                npi: "9988776655",
                specialty: "Dermatology",
                riskScore: 85,
                decayProb: 0.8,
                status: "Flagged",
                conflicts: ["License Expired", "Address Mismatch"],
                lastUpdated: new Date().toISOString(),
                agentThoughts: [
                    { agentName: "Validation Agent", thought: "CRITICAL: State License expired 45 days ago.", verdict: "fail", timestamp: new Date().toISOString() },
                    { agentName: "Document Parser", thought: "OCR mismatch: Uploaded PDF shows different practice address than registry.", verdict: "warn", timestamp: new Date().toISOString() },
                    { agentName: "Predictive Degradation", thought: "High probability of credential lapse spreading to other network participations.", verdict: "fail", timestamp: new Date().toISOString() }
                ]
            },
            {
                id: "3",
                name: "Dr. Emily Davis",
                npi: "1122334455",
                specialty: "Pediatrics",
                riskScore: 45,
                decayProb: 0.3,
                status: "Review",
                conflicts: ["DEA Number Verification Pending"],
                lastUpdated: new Date().toISOString(),
                agentThoughts: [
                    { agentName: "Validation Agent", thought: "Primary license valid. DEA registration query timed out.", verdict: "warn", timestamp: new Date().toISOString() },
                    { agentName: "Business Impact", thought: "Potential delayed reimbursement revenue if DEA not verified.", verdict: "neutral", timestamp: new Date().toISOString() }
                ]
            },
            {
                id: "4",
                name: "Dr. Michael Change",
                npi: "5566778899",
                specialty: "Surgery",
                riskScore: 92,
                decayProb: 0.95,
                status: "Flagged",
                conflicts: ["OIG Exclusion Match", "High Billing Anomaly"],
                lastUpdated: new Date().toISOString(),
                agentThoughts: [
                    { agentName: "Fraud Detection", thought: "ALERT: Name matches OIG exclusion list entry.", verdict: "fail", timestamp: new Date().toISOString() },
                    { agentName: "Fraud Detection", thought: "Billing frequency 400% above regional average.", verdict: "fail", timestamp: new Date().toISOString() },
                    { agentName: "Communicator", thought: "Drafted immediate suspension notice.", verdict: "neutral", timestamp: new Date().toISOString() }
                ]
            },
            {
                id: "5",
                name: "Dr. Linda Martinez",
                npi: "6677889900",
                specialty: "General Practice",
                riskScore: 5,
                decayProb: 0.01,
                status: "Verified",
                conflicts: [],
                lastUpdated: new Date().toISOString(),
                agentThoughts: [
                    { agentName: "Validation Agent", thought: "All credentials verified across 15 sources.", verdict: "pass", timestamp: new Date().toISOString() }
                ]
            }
        ]
    };
};

export const analyzeFilesWithAgents = async (files: FileUpload[]): Promise<AnalysisResult> => {
    console.log("Analyzing files (DEMO MODE):", files);

    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 500)); // Fast response for demo

    return generateMockResult();
};
