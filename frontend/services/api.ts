import { AnalysisResult, FileUpload } from "../types";

const API_BASE_URL = "http://localhost:8000";

export const analyzeFilesWithAgents = async (files: FileUpload[]): Promise<AnalysisResult> => {
    if (files.length === 0) {
        throw new Error("No files provided");
    }

    // 1. Prepare Payload
    // For demo, we just take the name of the first file to simulate ingestion
    // In a real app, we'd upload the file to an endpoint (e.g. /upload)
    const providerData = {
        first_name: "Test",
        last_name: "Doctor",
        npi: "1881761864", // Default valid NPI for demo flow
        raw_data: {
            file_path: files[0].name // Pass filename, backend might try to look it up if it was uploaded
        }
    };

    // 2. Start Job
    const ingestResponse = await fetch(`${API_BASE_URL}/ingest`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(providerData)
    });

    if (!ingestResponse.ok) {
        throw new Error(`Ingest failed: ${ingestResponse.statusText}`);
    }

    const { job_id } = await ingestResponse.json();

    // 3. Poll for Status
    return new Promise((resolve, reject) => {
        const interval = setInterval(async () => {
            try {
                const statusResponse = await fetch(`${API_BASE_URL}/status/${job_id}`);
                const data = await statusResponse.json();

                if (data.status === "completed") {
                    clearInterval(interval);
                    resolve(mapBackendResponse(data));
                } else if (data.status === "error") {
                    clearInterval(interval);
                    reject(new Error("Job failed on backend"));
                }
                // If "processing", continue waiting...
            } catch (err) {
                clearInterval(interval);
                reject(err);
            }
        }, 1000); // Poll every 1s
    });
};

// Mapper: Backend State -> Frontend AnalysisResult
const mapBackendResponse = (data: any): AnalysisResult => {
    const v = data.validation_result || {};
    const f = data.fraud_analysis || {};
    const b = data.business_impact || {};

    // Construct a single record for the dashboard
    const record = {
        id: data.job_id,
        name: "Dr. Test Doctor", // Backend should eventually return this
        npi: "1881761864",
        specialty: "General Practice",
        riskScore: f.risk_score || 0,
        decayProb: 0.1,
        state: "NY",
        status: (v.npi_valid ? "Verified" : "Flagged") as "Verified" | "Flagged",
        conflicts: v.is_consistent ? [] : ["Data Mismatch"],
        lastUpdated: new Date().toISOString(),
        agentThoughts: [
            {
                agentName: "Validation Agent",
                thought: v.details || "Validation check complete.",
                verdict: (v.npi_valid ? "pass" : "fail") as "pass" | "fail",
                timestamp: new Date().toISOString()
            },
            {
                agentName: "Fraud Agent",
                thought: `Risk Level: ${f.risk_level}`,
                verdict: (f.risk_level === "HIGH" ? "fail" : "pass") as "pass" | "fail",
                timestamp: new Date().toISOString()
            }
        ]
    };

    return {
        roi: b.estimated_savings || 0,
        fraudRiskScore: f.risk_score || 0,
        providersProcessed: 1,
        discrepanciesFound: v.npi_valid ? 0 : 1,
        summary: b.notes || "Analysis complete.",
        timelineData: [
            { name: 'Current', value: 1, secondaryValue: v.npi_valid ? 0 : 1 }
        ],
        riskDistribution: [
            { name: 'Calculated Risk', value: f.risk_score || 0 }
        ],
        records: [record],
        agentLogs: []
    };
};
