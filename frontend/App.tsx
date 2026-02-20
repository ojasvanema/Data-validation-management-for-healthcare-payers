import React, { useState, useEffect } from 'react';
import { INITIAL_AGENTS } from './constants';
import { AgentStatus, AnalysisResult, FileUpload, AgentType, HistoryItem } from './types';
import UploadSection from './components/UploadSection';
import AgentDashboard from './components/AgentDashboard';
import MetricsDashboard from './components/MetricsDashboard';
import RecordsExplorer from './components/RecordsExplorer';
import { analyzeFilesWithAgents } from './services/apiService';
import api from './services/api';
import { Activity, LayoutDashboard, History, PlusCircle, ChevronRight, ChevronLeft, Leaf, Database, LogOut, ShieldCheck, PlayCircle } from 'lucide-react';
import GlassCard from './components/GlassCard';
import { ThemeProvider } from './components/ThemeContext';

import LandingPage from './components/LandingPage';
import LoginTransition from './components/LoginTransition';
import Sidebar from './components/Sidebar';
import ManualEntryExplorer from './components/ManualEntryExplorer';

type ViewType = 'landing' | 'login' | 'home' | 'dashboard' | 'explorer' | 'manual';

function AppContent() {
    console.log("AppContent rendering...");
    const [agents, setAgents] = useState<AgentStatus[]>(INITIAL_AGENTS);
    const [isProcessing, setIsProcessing] = useState(false);
    const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
    const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);
    const [history, setHistory] = useState<HistoryItem[]>([]);

    const [view, setView] = useState<ViewType>(() => {
        const hash = window.location.hash.replace('#', '');
        if (['landing', 'login', 'home', 'dashboard', 'explorer', 'manual'].includes(hash)) {
            return hash as ViewType;
        }
        return 'landing';
    });

    useEffect(() => {
        window.location.hash = view;
    }, [view]);

    useEffect(() => {
        const handleHashChange = () => {
            const hash = window.location.hash.replace('#', '');
            if (['landing', 'login', 'home', 'dashboard', 'explorer', 'manual'].includes(hash)) {
                setView(hash as ViewType);
            }
        };
        window.addEventListener('hashchange', handleHashChange);
        return () => window.removeEventListener('hashchange', handleHashChange);
    }, []);

    // Function to simulate agent activity step-by-step
    const simulateAgentActivity = async (finalResult: AnalysisResult, runEfficiently: boolean = false) => {
        const d = (ms: number) => delay(runEfficiently ? Math.max(50, ms / 10) : ms);

        // 1. Activate Orchestrator & Parser
        updateAgent(AgentType.ORCHESTRATOR, 'processing', 'Dispatching tasks to specialized agents...');
        await d(500);
        updateAgent(AgentType.DOCUMENT, 'processing', 'Parser Agent: Ingesting documents and extracting entities...');
        await d(1200);
        updateAgent(AgentType.DOCUMENT, 'completed', 'Parser Agent: Extraction complete. Structured query ready.');

        // 2. Validation & Complaint
        updateAgent(AgentType.VALIDATION, 'processing', 'Validation Agent: Querying NPPES, Geocoder, and VERA...');
        await d(1000);
        updateAgent(AgentType.VALIDATION, 'processing', 'VERA: Analyzing risk dimensions (Identity, Reachability, Reputation)...');
        await d(1000);
        updateAgent(AgentType.VALIDATION, 'processing', 'Discrepancy Analysis: Cross-referencing member feedback...');
        await d(800);
        updateAgent(AgentType.VALIDATION, 'completed', 'Validation Complete. Risk scores assigned.');

        // 3. Fraud Detection (simulated as part of validation/risk)
        updateAgent(AgentType.FRAUD, 'processing', 'Fraud Agent: checking exclusion lists...');
        await d(800);
        updateAgent(AgentType.FRAUD, 'completed', 'Fraud Analysis Complete.');

        // 4. Business & Degradation
        updateAgent(AgentType.BUSINESS, 'processing', 'ROI Agent: Calculating cost savings and prevention value...');
        updateAgent(AgentType.DEGRADATION, 'processing', 'Predictive Agent: Assessing data decay velocity...');
        await d(1000);

        updateAgent(AgentType.BUSINESS, 'completed', 'ROI Calculation finalized.');
        updateAgent(AgentType.DEGRADATION, 'completed', 'Degradation report generated.');

        // 5. Communicator
        updateAgent(AgentType.COMMUNICATOR, 'processing', 'Communicator: Drafted notifications for flagged records.');
        await d(500);
        updateAgent(AgentType.COMMUNICATOR, 'completed', 'Notifications queued.');

        // 6. Finalize Orchestrator
        updateAgent(AgentType.ORCHESTRATOR, 'completed', 'Orchestration complete.');

        // Set other idle agents to complete or idle
        setAgents(prev => prev.map(a =>
            a.status === 'idle' && a.id !== AgentType.ORCHESTRATOR ? { ...a, status: 'completed', message: 'Cycle finished.' } : a
        ));

        setAnalysisResult(finalResult);

        // Add to History
        const newHistoryItem: HistoryItem = {
            id: Date.now().toString(),
            timestamp: new Date(),
            summary: `Processed ${finalResult.providersProcessed} providers with $${finalResult.roi.toLocaleString()} ROI`,
            result: finalResult
        };
        setHistory(prev => [newHistoryItem, ...prev]);

        setIsProcessing(false);
    };

    const updateAgent = (id: AgentType, status: AgentStatus['status'], message: string) => {
        setAgents(prev => prev.map(a => a.id === id ? { ...a, status, message } : a));
    };

    const delay = (ms: number) => new Promise(res => setTimeout(res, ms));

    const handleFilesSelected = async (files: FileUpload[]) => {
        setIsProcessing(true);
        setAnalysisResult(null);
        setView('dashboard');

        // Reset agents to idle
        setAgents(INITIAL_AGENTS.map(a => ({ ...a, status: 'idle', message: 'Standing by' })));

        try {
            // Call Gemini Service
            updateAgent(AgentType.ORCHESTRATOR, 'processing', 'Analyzing file structure...');
            const result = await analyzeFilesWithAgents(files);

            // Run the visual simulation using the real data from Gemini
            await simulateAgentActivity(result);

        } catch (error) {
            console.error(error);
            setIsProcessing(false);
            updateAgent(AgentType.ORCHESTRATOR, 'error', 'Orchestration failed.');
        }
    };

    const loadHistoryItem = (item: HistoryItem) => {
        setAnalysisResult(item.result);
        setView('dashboard');
        // Set agents to completed state for static view
        setAgents(INITIAL_AGENTS.map(a => ({ ...a, status: 'completed', message: 'Historical run loaded.' })));
    };

    const resetToHome = () => {
        setView('home');
        setAnalysisResult(null);
        setAgents(INITIAL_AGENTS.map(a => ({ ...a, status: 'idle', message: 'Standing by' })));
    };

    const loadHistoricalData = async (runEfficiently: boolean = true) => {
        setIsProcessing(true);
        setView('dashboard');
        setAgents(INITIAL_AGENTS.map(a => ({ ...a, status: 'idle', message: 'Standing by' })));

        // Simulate processing for visual effect
        updateAgent(AgentType.ORCHESTRATOR, 'processing', 'Initiating demo sequence...');

        try {
            const response = await api.post<AnalysisResult>(`/historical-data?run_efficiently=${runEfficiently}`, {});
            await simulateAgentActivity(response.data, runEfficiently);
        } catch (error) {
            console.error("Failed to load historical data:", error);
            updateAgent(AgentType.ORCHESTRATOR, 'error', 'Failed to load historical data.');
            setIsProcessing(false);
        }
    };

    const handleCSVUpload = async (file: File) => {
        setIsProcessing(true);
        setView('dashboard');
        setAgents(INITIAL_AGENTS.map(a => ({ ...a, status: 'idle', message: 'Standing by' })));

        updateAgent(AgentType.ORCHESTRATOR, 'processing', `Uploading ${file.name}...`);

        try {
            const formData = new FormData();
            formData.append('file', file);

            const response = await api.post<AnalysisResult>('/upload-csv', formData);
            await simulateAgentActivity(response.data);
        } catch (error) {
            console.error('CSV upload failed:', error);
            updateAgent(AgentType.ORCHESTRATOR, 'error', `Upload failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
            setIsProcessing(false);
        }
    };

    const refreshData = async () => {
        try {
            const response = await fetch('/demo-data', {
                method: 'POST'
            });
            const result = await response.json();
            setAnalysisResult(result);
        } catch (error) {
            console.error("Failed to refresh data:", error);
        }
    };

    if (view === 'landing') {
        return <LandingPage onLogin={() => setView('login')} />;
    }

    if (view === 'login') {
        return <LoginTransition onComplete={() => setView('dashboard')} />;
    }

    // Main Dashboard View
    return (
        <div className="flex h-screen overflow-hidden font-sans transition-colors duration-300 bg-slate-50 dark:bg-[#050505] text-slate-900 dark:text-white">

            {/* Sidebar */}
            {/* Sidebar */}
            <Sidebar
                isCollapsed={isSidebarCollapsed}
                setIsCollapsed={setIsSidebarCollapsed}
                currentView={view}
                setCurrentView={setView}
                history={history}
                onLoadHistory={loadHistoryItem}
                onReset={resetToHome}
                hasAnalysisResult={!!analysisResult}
                onLogout={() => setView('landing')}
            />

            {/* Main Content Area */}
            <main className="flex-1 flex flex-col h-full overflow-hidden relative transition-colors duration-500
                 bg-slate-50 dark:from-[#022c22] dark:via-[#050505] dark:to-[#000000] dark:bg-gradient-to-br
            ">
                {/* Background Decoration - Dark Mode Only */}
                <div className="hidden dark:block absolute top-0 left-0 w-full h-96 bg-emerald-500/5 blur-[120px] pointer-events-none rounded-full transform -translate-y-1/2 animate-pulse-slow"></div>

                {/* Background Decoration - Light Mode */}
                <div className="dark:hidden absolute top-0 right-0 w-[500px] h-[500px] bg-emerald-500/5 blur-[80px] pointer-events-none rounded-full transform -translate-y-1/2 translate-x-1/2 animate-float-slow"></div>

                <header className="h-16 border-b flex items-center justify-between px-8 flex-shrink-0 z-10 backdrop-blur-sm transition-colors duration-300
                    border-slate-200 bg-white/50
                    dark:border-white/5 dark:bg-transparent
                ">
                    <div className="flex items-center text-sm breadcrumbs text-slate-400 dark:text-gray-400">
                        <span className="hover:text-slate-900 dark:hover:text-white cursor-pointer transition-colors" onClick={resetToHome}>Home</span>
                        <ChevronRight size={14} className="mx-2" />
                        <span className={view !== 'home' ? 'text-slate-900 dark:text-white' : ''}>Analysis</span>
                        {view !== 'home' && <ChevronRight size={14} className="mx-2" />}
                        <span className="text-emerald-600 dark:text-emerald-400 font-medium">
                            {view === 'dashboard' ? 'Live Dashboard' : view === 'explorer' ? 'Data Explorer' : ''}
                        </span>
                    </div>
                    <div className="flex items-center gap-3">
                        <div className="flex items-center gap-2 px-3 py-1 rounded-full text-xs font-mono
                            bg-emerald-50 text-emerald-600 border border-emerald-200
                            dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/20
                         ">
                            <Activity size={12} />
                            <span>System Operational</span>
                        </div>
                    </div>
                </header>

                <div className="flex-1 overflow-y-auto p-8 scroll-smooth">
                    <div className="max-w-7xl mx-auto h-full flex flex-col">

                        {view === 'home' && (
                            <div className="flex-1 flex flex-col items-center justify-center min-h-[500px] animate-in zoom-in-95 duration-500">
                                <div className="w-full max-w-2xl">
                                    <div className="text-center mb-10">
                                        <h1 className="text-4xl md:text-5xl font-bold mb-4 bg-clip-text text-transparent bg-gradient-to-r from-emerald-600 via-teal-500 to-emerald-600 dark:from-emerald-200 dark:via-teal-200 dark:to-emerald-400">
                                            Provider Validation AI
                                        </h1>
                                        <p className="text-lg text-slate-500 dark:text-gray-400 max-w-lg mx-auto">
                                            Upload provider data to initiate the multi-agent orchestration for fraud detection and ROI analysis.
                                        </p>
                                    </div>
                                    <UploadSection onFilesSelected={handleFilesSelected} isProcessing={isProcessing} onLoadHistoricalData={loadHistoricalData} onCSVUpload={handleCSVUpload} totalRecords={analysisResult ? analysisResult.records.length : 0} />
                                </div>
                            </div>
                        )}

                        {view === 'dashboard' && (
                            <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 h-full animate-in slide-in-from-bottom-8 duration-500">
                                {/* Left Column: Upload (Compact) & Orchestration */}
                                <div className="xl:col-span-4 flex flex-col gap-6">
                                    <UploadSection onFilesSelected={handleFilesSelected} isProcessing={isProcessing} compact onLoadHistoricalData={loadHistoricalData} onCSVUpload={handleCSVUpload} totalRecords={analysisResult ? analysisResult.records.length : 0} />
                                    <div className="flex-grow min-h-[400px]">
                                        <AgentDashboard agents={agents} />
                                    </div>
                                </div>

                                {/* Right Column: Analytics Dashboard */}
                                <div className="xl:col-span-8 flex flex-col h-full">
                                    <MetricsDashboard data={analysisResult} onViewDetails={() => setView('explorer')} />
                                </div>
                            </div>
                        )}

                        {view === 'explorer' && (
                            <div className="h-full">
                                <RecordsExplorer records={analysisResult?.records} onRefresh={refreshData} />
                            </div>
                        )}

                        {view === 'manual' && (
                            <div className="h-full">
                                <ManualEntryExplorer
                                    onAddRecord={(record) => {
                                        setAnalysisResult(prev => {
                                            if (!prev) {
                                                return {
                                                    roi: 0,
                                                    fraudRiskScore: record.riskScore,
                                                    providersProcessed: 1,
                                                    discrepanciesFound: record.status === 'Verified' ? 0 : 1,
                                                    timelineData: [],
                                                    riskDistribution: [],
                                                    agentLogs: [],
                                                    summary: 'Manual Entry Verification',
                                                    records: [record]
                                                };
                                            }
                                            return {
                                                ...prev,
                                                providersProcessed: prev.providersProcessed + 1,
                                                discrepanciesFound: prev.discrepanciesFound + (record.status === 'Verified' ? 0 : 1),
                                                records: [record, ...prev.records]
                                            };
                                        });
                                        // Auto-transition user to Data Explorer if they want to see it contextually?
                                        // Wait, the requirement says "the pipeline run fro single entry only and got added to data explorer tab, note for the analysis we see in the right hand side of this single entry tab that we see in data explorer..."
                                        // So we DO NOT transition the view. We stay on the Manual Entry view so they can see the RHS ProviderDetailView!
                                    }}
                                />
                            </div>
                        )}

                    </div>
                </div>
            </main>
        </div>
    );
}

export default function App() {
    return (
        <ThemeProvider>
            <AppContent />
        </ThemeProvider>
    );
}