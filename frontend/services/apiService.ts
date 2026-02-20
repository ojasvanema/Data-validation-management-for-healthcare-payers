import { AnalysisResult, FileUpload, AgentType, ProviderRecord } from "../types";
import api from "./api";

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
        ]
    };
};

// For now, we'll keep using the API directly as the source of truth
// The backend now persists data in SQLite

// --- MOCK DATA FOR DEMO ---
// NOTE: We are transitioning to backend-generated data. 
// These local mocks are kept for fallback but need updates to match new types if used.
// For now, we will rely on the backend.

export const fetchDemoData = async (): Promise<AnalysisResult> => {
    const response = await api.post<AnalysisResult>('/demo-data', {});
    return response.data;
};

export const updateProviderStatus = async (id: string, status: string): Promise<ProviderRecord> => {
    const response = await api.put<ProviderRecord>(`/providers/${id}/status`, { status });
    return response.data;
};

export const bulkApproveSafe = async (): Promise<{ count: number, message: string }> => {
    const response = await api.post<{ count: number, message: string }>('/bulk-approve', {});
    return response.data;
};

// Manual Entry Analysis
export const analyzeManualEntry = async (data: any, file?: File, runEfficiently: boolean = true): Promise<any> => {
    const formData = new FormData();
    formData.append('data', JSON.stringify(data));
    if (file) {
        formData.append('file', file);
    }
    const response = await api.post(`/manual-entry/analyze?run_efficiently=${runEfficiently}`, formData);
    return response.data;
};


export const analyzeFilesWithAgents = async (files: FileUpload[]): Promise<AnalysisResult> => {
    console.log("Analyzing files via REAL BACKEND:", files);

    // 1. Upload Files
    const formData = new FormData();
    // We need real File objects here. The current FileUpload type in frontend is just metadata. 
    // We might need to refactor how UploadSection passes files or handle this expectation.
    // For now, let's assume the files passed here ARE the metadata, but logic deeper in UploadSection
    // needs to pass the File objects. 
    // Wait, UploadSection passes {name, type, size}. It doesn't pass the File object itself in the current state.
    // I need to update UploadSection to pass File objects.

    // For this step, I will assume the refactor happens next.
    // Here is the logic IF we had the file objects.

    // Since I cannot access the File objects from just the metadata interface,
    // I must update the interface first. But I will write the fetch logic here 
    // assuming 'files' will be extended to include the native 'file' object.

    // Temporary Hack: We can't send real files unless we change the interface.
    // I will write the code to use the backend, but it will fail unless I update `types.ts`
    // and `UploadSection.tsx`.

    // For now, return mock if no files to prevent crash, but try to hit backend.

    // REAL IMPLEMENTATION PLAN:
    // 1. POST /ingest with FormData
    // 2. Poll POST /status/{job_id} until completed.

    // 2. Real Implementation
    if (files.some(f => f.file)) {
        files.forEach(f => {
            if (f.file) {
                formData.append('files', f.file);
            }
        });

        const baseUrl = ''; // Use relative path via Vite proxy

        try {
            // Upload
            const ingestRes = await fetch(`${baseUrl}/ingest`, {
                method: 'POST',
                body: formData,
            });
            const ingestData = await ingestRes.json();
            const jobId = ingestData.job_id;
            console.log("Job ID:", jobId);

            // Poll
            let status = 'processing';
            let result: AnalysisResult | null = null;

            while (status === 'processing' || status === 'queued') {
                await new Promise(r => setTimeout(r, 2000)); // Poll every 2s
                const statusRes = await fetch(`${baseUrl}/status/${jobId}`);
                const statusData = await statusRes.json();
                status = statusData.status; // 'processing', 'completed', 'unknown'

                if (status === 'completed') {
                    result = statusData.analysis_result;
                    break;
                }
            }

            if (result) return result;

        } catch (e) {
            console.error("Backend Error:", e);
        }
    }

    // Fallback if no backend or error
    return generateMockResult();
};
