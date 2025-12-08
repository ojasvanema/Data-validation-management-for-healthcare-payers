import { GoogleGenAI, Type } from "@google/genai";
import { AnalysisResult, AgentType } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const analyzeFilesWithAgents = async (files: { name: string; type: string }[]): Promise<AnalysisResult> => {
  try {
    const fileList = files.map(f => `${f.name} (${f.type})`).join(', ');

    const prompt = `
      You are the "Main Orchestrator" of a healthcare provider validation system.
      The user has uploaded the following files: ${fileList}.

      Simulate the processing of these files by your team of AI agents:
      1. Multi-source Validation Agent (checks NPI registries)
      2. Document Parser Agent (reads PDFs/Images)
      3. Fraud Detection Agent (checks billing patterns)
      4. Predictive Degradation Agent (estimates data decay)

      Generate a realistic JSON response. 
      CRITICAL: You MUST generate a list of "records" (at least 5-8 items) representing individual providers found in the data.
      For each provider, invent specific "agentThoughts" that show how each agent reasoned about that specific person (e.g., "NPI matches registry", "Billing spike detected in Nov", "License PDF blur detected").
      
      Include mix of Validated, Flagged, and Review needed statuses.
    `;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            roi: { type: Type.NUMBER, description: "Total financial impact in USD" },
            fraudRiskScore: { type: Type.NUMBER, description: "Overall risk score 0-100" },
            providersProcessed: { type: Type.NUMBER },
            discrepanciesFound: { type: Type.NUMBER },
            summary: { type: Type.STRING, description: "Executive summary of findings" },
            timelineData: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  name: { type: Type.STRING },
                  value: { type: Type.NUMBER, description: "Valid Records" },
                  secondaryValue: { type: Type.NUMBER, description: "Issues Found" }
                }
              }
            },
            riskDistribution: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  name: { type: Type.STRING, description: "Risk Category (Low, Medium, High)" },
                  value: { type: Type.NUMBER, description: "Count" }
                }
              }
            },
            records: {
              type: Type.ARRAY,
              description: "Detailed list of individual provider records processed",
              items: {
                type: Type.OBJECT,
                properties: {
                  id: { type: Type.STRING },
                  name: { type: Type.STRING },
                  npi: { type: Type.STRING },
                  specialty: { type: Type.STRING },
                  riskScore: { type: Type.NUMBER },
                  decayProb: { type: Type.NUMBER, description: "Probability 0-1" },
                  status: { type: Type.STRING, enum: ["Verified", "Flagged", "Review"] },
                  conflicts: { type: Type.ARRAY, items: { type: Type.STRING } },
                  lastUpdated: { type: Type.STRING },
                  agentThoughts: {
                    type: Type.ARRAY,
                    items: {
                      type: Type.OBJECT,
                      properties: {
                        agentName: { type: Type.STRING },
                        thought: { type: Type.STRING },
                        verdict: { type: Type.STRING, enum: ["pass", "fail", "warn", "neutral"] },
                        timestamp: { type: Type.STRING }
                      }
                    }
                  }
                }
              }
            },
            agentLogs: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  agent: { type: Type.STRING, enum: Object.values(AgentType) },
                  log: { type: Type.STRING },
                  timestamp: { type: Type.STRING }
                }
              }
            }
          }
        }
      }
    });

    if (response.text) {
      return JSON.parse(response.text) as AnalysisResult;
    }
    
    throw new Error("Empty response from AI");

  } catch (error) {
    console.error("Analysis failed:", error);
    // Fallback mock data with records
    return {
      roi: 125000,
      fraudRiskScore: 42,
      providersProcessed: 150,
      discrepanciesFound: 12,
      summary: "Simulation (API Error): Detected 12 discrepancies in provider licenses. High ROI potential.",
      timelineData: [
        { name: 'Batch 1', value: 45, secondaryValue: 2 },
        { name: 'Batch 2', value: 50, secondaryValue: 5 },
        { name: 'Batch 3', value: 55, secondaryValue: 5 }
      ],
      riskDistribution: [
        { name: 'Low Risk', value: 100 },
        { name: 'Medium Risk', value: 35 },
        { name: 'High Risk', value: 15 }
      ],
      agentLogs: [
        { agent: AgentType.ORCHESTRATOR, log: "System initialized fallback mode.", timestamp: new Date().toISOString() }
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
            { agentName: "Validation Agent", thought: "NPI matches registry exactly. License active.", verdict: "pass", timestamp: new Date().toISOString() },
            { agentName: "Fraud Detection", thought: "Billing patterns consistent with peers.", verdict: "pass", timestamp: new Date().toISOString() }
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
            { agentName: "Validation Agent", thought: "State license expired 2 months ago. Address in file differs from registry.", verdict: "fail", timestamp: new Date().toISOString() },
            { agentName: "Document Parser", thought: "Uploaded PDF certificate appears to have altered dates.", verdict: "warn", timestamp: new Date().toISOString() },
            { agentName: "Predictive Degradation", thought: "High likelihood of contact info invalidity based on age of record.", verdict: "fail", timestamp: new Date().toISOString() }
          ]
        }
      ]
    };
  }
};