
import axios from 'axios';
import { AnalysisResult, AgentType, ProviderRecord, AgentThought } from '../types';

const API_BASE_URL = 'http://localhost:8000';

interface BatchStatusResponse {
    batch_id: string;
    is_complete: boolean;
    progress: string;

    // Aggregate data
    roi: number;
    fraud_risk_score: number;
    risk_level: string;
    discrepancies_found: number;

    records: Array<{
        job_id: string;
        status: string;
        provider_data?: any; // filled if complete
        parsed_data?: any;
        validation_result?: {
            is_consistent: boolean;
            conflicts: Array<{ field: string; description: string; entry_value: string; document_value: string }>;
            npi_valid: boolean;
            oig_excluded: boolean;
        };
        fraud_analysis?: {
            risk_score: number;
            risk_level: string;
            flagged_patterns: string[];
        };
        degradation_prediction?: {
            decay_probability_curve: Array<{ [key: string]: number }>;
        };
        business_impact?: {
            estimated_savings: number;
            roi_multiplier: number;
        };
    }>;
}

// Helper to parse CSV simply (in real app, use PapaParse)
const parseCSV = (content: string): any[] => {
    const lines = content.trim().split('\n');
    const headers = lines[0].split(',').map(h => h.trim());

    const records = [];

    for (let i = 1; i < lines.length; i++) {
        const currentLine = lines[i].split(',');
        if (currentLine.length < headers.length) continue; // Skip empty lines

        const obj: any = {};
        for (let j = 0; j < headers.length; j++) {
            const header = headers[j];
            obj[header] = currentLine[j]?.trim();
        }

        // Map CSV fields to ProviderRecord format expected by backend
        // CSV: NPI,FirstName,LastName,Organization,Taxonomy,LicenseState,LicenseNumber,OIG_Exclusion
        // Backend: npi, first_name, last_name, organization_name, license_number, license_state
        records.push({
            npi: obj['NPI'],
            first_name: obj['FirstName'],
            last_name: obj['LastName'],
            organization_name: obj['Organization'],
            license_state: obj['LicenseState'],
            license_number: obj['LicenseNumber']
        });
    }
    return records;
};

export const startIngestion = async (files: any[]): Promise<string> => {
    // 1. Check for CSV and parse it
    const csvFile = files.find(f => f.name.endsWith('.csv'));

    let payload = [];

    if (csvFile && csvFile.content) {
        payload = parseCSV(csvFile.content);
    } else {
        // Fallback for demo if no CSV content, or just single file
        payload = [{
            npi: "1234567890",
            first_name: "John",
            last_name: "Doe (Fallback)",
            organization_name: "Demo Org"
        }];
    }

    // 2. Send Batch
    const response = await axios.post(`${API_BASE_URL}/ingest`, payload);
    return response.data.batch_id;
};

export const pollJobStatus = async (batchId: string): Promise<AnalysisResult | null> => {
    try {
        const response = await axios.get<BatchStatusResponse>(`${API_BASE_URL}/status/${batchId}`);
        const data = response.data;

        if (!data.is_complete) return null; // Wait until WHOLE batch is done

        // Transform Backend Batch Data to Frontend Type
        const transformedResult: AnalysisResult = {
            roi: data.roi,
            fraudRiskScore: data.fraud_risk_score,
            providersProcessed: data.records.length,
            discrepanciesFound: data.discrepancies_found,
            summary: `Batch Analysis Complete. Risk Level: ${data.risk_level}. Processed ${data.records.length} records.`,

            // Generate aggregate timeline/risk data from individual records
            timelineData: [
                { name: "Valid", value: data.records.filter(r => r.fraud_analysis?.risk_level === 'LOW').length },
                { name: "Flagged", value: data.records.filter(r => r.fraud_analysis?.risk_level !== 'LOW').length }
            ],

            riskDistribution: [
                { name: "Low", value: data.records.filter(r => r.fraud_analysis?.risk_level === 'LOW').length },
                { name: "Medium", value: data.records.filter(r => r.fraud_analysis?.risk_level === 'MEDIUM').length },
                { name: "High", value: data.records.filter(r => r.fraud_analysis?.risk_level === 'HIGH').length }
            ],

            agentLogs: [],

            // Map the full list of records
            records: data.records.map(r => ({
                id: r.job_id,
                name: `${r.provider_data?.first_name || 'Unknown'} ${r.provider_data?.last_name || ''}`,
                npi: r.provider_data?.npi || 'N/A',
                specialty: "General Practice",
                status: r.validation_result?.oig_excluded ? 'Flagged' : (r.fraud_analysis?.risk_level === 'HIGH' ? 'Review' : 'Verified'),
                riskScore: r.fraud_analysis?.risk_score || 0,
                decayProb: r.degradation_prediction?.decay_probability_curve ? (1 - Object.values(r.degradation_prediction.decay_probability_curve[0])[0]) : 0,
                conflicts: r.validation_result?.conflicts?.map(c => `${c.description} (${c.field}: ${c.entry_value} vs ${c.document_value})`) || [],
                lastUpdated: new Date().toISOString(),
                agentThoughts: [
                    { agentName: 'Validation Agent', thought: `Registry Check: ${r.validation_result?.npi_valid ? 'Valid' : 'Invalid'}. OIG Check: ${r.validation_result?.oig_excluded ? 'HIT' : 'Clean'}.`, verdict: r.validation_result?.npi_valid ? 'pass' : 'fail', timestamp: new Date().toISOString() },
                    { agentName: 'Fraud Detector', thought: `Risk Score: ${r.fraud_analysis?.risk_score}. Patterns: ${r.fraud_analysis?.flagged_patterns?.join(', ') || 'None'}.`, verdict: r.fraud_analysis?.risk_level === 'HIGH' ? 'fail' : 'pass', timestamp: new Date().toISOString() },
                    { agentName: 'Business Impact', thought: `Savings: $${r.business_impact?.estimated_savings}. ROI: ${r.business_impact?.roi_multiplier}x.`, verdict: 'pass', timestamp: new Date().toISOString() }
                ]
            }))
        };

        return transformedResult;

    } catch (e) {
        console.error("Polling error", e);
        return null; // Keep polling if error (or handle properly)
    }
};
