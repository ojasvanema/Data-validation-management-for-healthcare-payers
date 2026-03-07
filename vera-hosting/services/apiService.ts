import { AnalysisResult, FileUpload, AgentType, ProviderRecord } from "../types";
import api from "./api";

// Initial Dataset Generation
const generateInitialResult = (): AnalysisResult => {
    return {
        roi: 1250000,
        fraudRiskScore: 42,
        providersProcessed: 1542,
        discrepanciesFound: 128,
        summary: `EXECUTIVE INTELLIGENCE BRIEF
============================
Processing Volume: 1,542 Provider Records
Timestamp: ${new Date().toISOString().split('T')[0]}

KEY FINDINGS & FINANCIAL IMPACT
• Total Identified Discrepancies: 128
• High-Risk Providers (Suggested Suspension): 42
• Projected Revenue Protection (ROI): $1,250,000

RISK VECTOR ANALYSIS
1. License Expirations: 15 critical violations detected across 3 state registries (CA, FL, TX)
2. Disciplinary Actions: 4 matching entries in OIG exclusion database
3. Predictive Decay: 12% of currently valid records show >60% probability of degradation within 90 days due to approaching credential renewal dates.

RECOMMENDED ACTIONS
[URGENT] Isolate 42 high-risk profiles from billing cycle ID #9928.
[AUTO] Initiated automated outreach for 86 medium-risk profiles requiring updated documentation.
[REVIEW] Schedule batch re-verification for 180 records approaching decay threshold on ${new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]}.`,
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
        records: Array.from({ length: 100 }).map((_, i) => {
            const templates: ProviderRecord[] = [
                {
                    id: "1",
                    name: "Dr. Sarah Chen",
                    npi: "1928374650",
                    specialty: "Cardiology",
                    riskScore: 12,
                    decayProb: 0.05,
                    status: "Verified",
                    state: "NY",
                    conflicts: [],
                    lastUpdated: new Date().toISOString(),
                    agentThoughts: [
                        { agentName: "Parser Agent", thought: "Ingesting document. Extracting entities and structuring query for validation.", verdict: "pass", timestamp: new Date().toISOString() },
                        { agentName: "Validation Agent", thought: "NPI confirmed in CMS Registry. Active status.", verdict: "pass", timestamp: new Date().toISOString() },
                        { agentName: "Validation Agent", thought: "Reachability check passed. Phone number active.", verdict: "pass", timestamp: new Date().toISOString() },
                        { agentName: "Risk Scoring", thought: "Aggregated analysis complete. Trust Score: 95/100. Calculated Risk Score: 5/100.", verdict: "pass", timestamp: new Date().toISOString() },
                        { agentName: "Predictive Degradation", thought: "Predictive modeling complete. Decay probability assessed based on 0 risk factors.", verdict: "neutral", timestamp: new Date().toISOString() },
                        { agentName: "Interpretation Agent", thought: "LOW RISK: Data verified against authoritative sources. Standard validation cycle approved.", verdict: "pass", timestamp: new Date().toISOString() },
                        { agentName: "Business & ROI", thought: "Calculated potential cost savings of $250.00 based on risk profile mitigation.", verdict: "pass", timestamp: new Date().toISOString() },
                        { agentName: "Communicator", thought: "Standard notification protocol.", verdict: "neutral", timestamp: new Date().toISOString() }
                    ],
                    complaints: [],
                    locations: [],
                    contact_numbers: []
                },
                {
                    id: "2",
                    name: "Dr. James Wilson",
                    npi: "9988776655",
                    specialty: "Dermatology",
                    riskScore: 85,
                    decayProb: 0.8,
                    status: "Flagged",
                    state: "CA",
                    conflicts: ["License Expired", "Address Mismatch", "Patient Complaint"],
                    lastUpdated: new Date().toISOString(),
                    agentThoughts: [
                        { agentName: "Parser Agent", thought: "Ingesting document. Extracting entities and structuring query for validation.", verdict: "pass", timestamp: new Date().toISOString() },
                        { agentName: "Validation Agent", thought: "CRITICAL: State License expired 45 days ago.", verdict: "fail", timestamp: new Date().toISOString() },
                        { agentName: "Validation Agent", thought: "OCR mismatch: Uploaded PDF shows different practice address than registry.", verdict: "warn", timestamp: new Date().toISOString() },
                        { agentName: "Discrepancy Analysis", thought: "MATCH FOUND: 1 member complaint(s) corroborated by validation findings (Fields: address).", verdict: "fail", timestamp: new Date().toISOString() },
                        { agentName: "Risk Scoring", thought: "Aggregated analysis complete. Trust Score: 15/100. Calculated Risk Score: 85/100.", verdict: "fail", timestamp: new Date().toISOString() },
                        { agentName: "Predictive Degradation", thought: "Predictive modeling complete. Decay probability assessed based on 3 risk factors.", verdict: "fail", timestamp: new Date().toISOString() },
                        { agentName: "Interpretation Agent", thought: "CRITICAL RISK: High likelihood of fraud or data obsolescence. Immediate suspension or manual override recommended.", verdict: "fail", timestamp: new Date().toISOString() },
                        { agentName: "Business & ROI", thought: "Calculated potential cost savings of $4,250.00 based on risk profile mitigation.", verdict: "pass", timestamp: new Date().toISOString() },
                        { agentName: "Communicator", thought: "Drafted automated query to provider regarding discrepancies. Included complaint context in draft.", verdict: "neutral", timestamp: new Date().toISOString() }
                    ],
                    complaints: [
                        { field: "address", value: "Practice closed at this location", date: "2023-10-15", notes: "Member went to appointment but door was locked." }
                    ],
                    locations: [],
                    contact_numbers: []
                },
                {
                    id: "3",
                    name: "Dr. Emily Davis",
                    npi: "1122334455",
                    specialty: "Pediatrics",
                    riskScore: 45,
                    decayProb: 0.3,
                    status: "Review",
                    state: "TX",
                    conflicts: ["DEA Number Verification Pending"],
                    lastUpdated: new Date().toISOString(),
                    agentThoughts: [
                        { agentName: "Validation Agent", thought: "Primary license valid. DEA registration query timed out.", verdict: "warn", timestamp: new Date().toISOString() },
                        { agentName: "Business Impact", thought: "Potential delayed reimbursement revenue if DEA not verified.", verdict: "neutral", timestamp: new Date().toISOString() }
                    ],
                    complaints: [],
                    locations: [],
                    contact_numbers: []
                },
                {
                    id: "4",
                    name: "Dr. Michael Change",
                    npi: "5566778899",
                    specialty: "Surgery",
                    riskScore: 92,
                    decayProb: 0.95,
                    status: "Flagged",
                    state: "FL",
                    conflicts: ["OIG Exclusion Match", "High Billing Anomaly"],
                    lastUpdated: new Date().toISOString(),
                    agentThoughts: [
                        { agentName: "Fraud Detection", thought: "ALERT: Name matches OIG exclusion list entry.", verdict: "fail", timestamp: new Date().toISOString() },
                        { agentName: "Fraud Detection", thought: "Billing frequency 400% above regional average.", verdict: "fail", timestamp: new Date().toISOString() },
                        { agentName: "Communicator", thought: "Drafted immediate suspension notice.", verdict: "neutral", timestamp: new Date().toISOString() }
                    ],
                    complaints: [],
                    locations: [],
                    contact_numbers: []
                },
                {
                    id: "5",
                    name: "Dr. Linda Martinez",
                    npi: "6677889900",
                    specialty: "General Practice",
                    riskScore: 5,
                    decayProb: 0.01,
                    status: "Verified",
                    state: "WA",
                    conflicts: [],
                    lastUpdated: new Date().toISOString(),
                    agentThoughts: [
                        { agentName: "Validation Agent", thought: "All credentials verified across 15 sources.", verdict: "pass", timestamp: new Date().toISOString() }
                    ],
                    complaints: [],
                    locations: [],
                    contact_numbers: []
                }
            ];

            const firstNames = ["James", "Maria", "Michael", "Sarah", "Robert", "Jennifer", "William", "Jessica", "David", "Emily", "Richard", "Amanda", "Joseph", "Melissa", "Thomas", "Deborah", "Charles", "Stephanie", "Christopher", "Rebecca"];
            const lastNames = ["Smith", "Johnson", "Williams", "Brown", "Jones", "Garcia", "Miller", "Davis", "Rodriguez", "Martinez", "Hernandez", "Lopez", "Gonzales", "Wilson", "Anderson", "Thomas", "Taylor", "Moore", "Jackson", "Martin"];
            const states = ["NY", "CA", "TX", "FL", "WA", "IL", "PA", "OH", "GA", "NC", "MI", "NJ", "VA", "CO", "MA"];

            const template = templates[i % templates.length];
            const firstName = firstNames[(i + template.name.length) % firstNames.length];
            const lastName = lastNames[(Math.floor(i / firstNames.length) + template.name.length) % lastNames.length];

            let riskScore = template.riskScore;
            if (template.status === 'Verified') riskScore = Math.floor(Math.random() * 25);
            else if (template.status === 'Review') riskScore = Math.floor(Math.random() * 30) + 35;
            else if (template.status === 'Flagged') riskScore = Math.floor(Math.random() * 20) + 80;

            let decayProb = template.decayProb;
            if (template.status === 'Verified') decayProb = Math.max(0.01, Math.random() * 0.1);
            else if (template.status === 'Review') decayProb = 0.2 + Math.random() * 0.3;
            else if (template.status === 'Flagged') decayProb = 0.7 + Math.random() * 0.25;

            return {
                ...template,
                id: (i + 1).toString(),
                name: `Dr. ${firstName} ${lastName}`,
                npi: ((parseInt(template.npi.replace(/\D/g, '')) + i * 137) % 10000000000).toString().padStart(10, '0'),
                riskScore,
                decayProb,
                state: states[i % states.length]
            };
        })
    };
};

// For now, we'll keep using the API directly as the source of truth
// The backend now persists data in SQLite

// --- LOCAL CACHE DATA ---
// These local data sets are used to power the static version of the site without a backend.

export const fetchBatchData = async (): Promise<AnalysisResult> => {
    // Simulate network latency
    await new Promise(r => setTimeout(r, 1200));
    return generateInitialResult();
};

export const updateProviderStatus = async (id: string, status: string): Promise<ProviderRecord> => {
    await new Promise(r => setTimeout(r, 300)); // Simulate quick DB update
    // Generate a record just to satisfy the return type
    const baseResult = generateInitialResult();
    const record = baseResult.records[0];
    return { ...record, id, status } as any;
};

export const bulkApproveSafe = async (): Promise<{ count: number, message: string }> => {
    await new Promise(r => setTimeout(r, 800));
    return { count: 12, message: "Providers approved safely." };
};

// Manual Entry Analysis
export const analyzeManualEntry = async (data: any, file?: File, runEfficiently: boolean = true): Promise<any> => {
    try {
        await new Promise(r => setTimeout(r, runEfficiently ? 1500 : 3500));

        // Return a formatted result for manual entry
        return {
            id: "manual-" + Date.now(),
            name: data.name || "Dr. Analyzed User",
            npi: data.npi || "0000000000",
            specialty: "Analysis Complete",
            riskScore: 42,
            decayProb: 0.1,
            status: "Review",
            state: "NY",
            conflicts: ["Data consistency check flagged"],
            lastUpdated: new Date().toISOString(),
            agentThoughts: [
                { agentName: "Parser Agent", thought: "Ingesting submitted form and extracted variables.", verdict: "pass", timestamp: new Date().toISOString() },
                { agentName: "VERA Core", thought: "Analyzing NPI and entity validity across risk vectors.", verdict: "warn", timestamp: new Date().toISOString() }
            ],
            complaints: [],
            locations: [],
            contact_numbers: []
        };
    } catch (error) {
        console.error("Error analyzing manual entry:", error);
        throw error;
    }
};

export const sendEmailReport = async (providerData: any, toEmail?: string): Promise<any> => {
    try {
        await new Promise(r => setTimeout(r, 1000));
        return { status: "success", message: `Email report sent to ${toEmail || "provider@example.com"}` };
    } catch (error) {
        console.error("Error sending email report:", error);
        throw error;
    }
};

export const analyzeFilesWithAgents = async (files: FileUpload[]): Promise<AnalysisResult> => {
    await new Promise(r => setTimeout(r, 2000));
    return generateInitialResult();
};
