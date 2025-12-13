import React, { useState } from 'react';
import { INITIAL_AGENTS } from './constants';
import { AgentStatus, AnalysisResult, FileUpload, AgentType, HistoryItem } from './types';
import UploadSection from './components/UploadSection';
import AgentDashboard from './components/AgentDashboard';
import MetricsDashboard from './components/MetricsDashboard';
import RecordsExplorer from './components/RecordsExplorer';
import { analyzeFilesWithAgents } from './services/apiService';
import { Activity, LayoutDashboard, History, PlusCircle, ChevronRight, Leaf, Database } from 'lucide-react';
import GlassCard from './components/GlassCard';

export default function App() {
    const [agents, setAgents] = useState<AgentStatus[]>(INITIAL_AGENTS);
    const [isProcessing, setIsProcessing] = useState(false);
    const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);
    const [view, setView] = useState<'home' | 'dashboard' | 'explorer'>('home');
    const [history, setHistory] = useState<HistoryItem[]>([]);

    // Function to simulate agent activity step-by-step
    const simulateAgentActivity = async (finalResult: AnalysisResult) => {
        // 1. Activate Orchestrator
        updateAgent(AgentType.ORCHESTRATOR, 'processing', 'Dispatching tasks to specialists...');
        await delay(800);

        // 2. Parallel processing: Document & Validation
        updateAgent(AgentType.DOCUMENT, 'processing', 'OCRing PDFs and extracting entities...');
        updateAgent(AgentType.VALIDATION, 'processing', 'Querying NPI registry...');
        await delay(1500);

        updateAgent(AgentType.DOCUMENT, 'completed', 'Extraction complete. Records indexed.');
        updateAgent(AgentType.VALIDATION, 'completed', 'Cross-reference complete.');

        // 3. Fraud Detection
        updateAgent(AgentType.FRAUD, 'processing', 'Analyzing patterns against fraud database...');
        await delay(1200);
        updateAgent(AgentType.FRAUD, 'completed', 'Flagged suspicious billing cycles.');

        // 4. Business & Degradation
        updateAgent(AgentType.BUSINESS, 'processing', 'Calculating ROI and impact...');
        updateAgent(AgentType.DEGRADATION, 'processing', 'Predicting data decay velocity...');
        await delay(1000);

        updateAgent(AgentType.BUSINESS, 'completed', 'ROI Calculation finalized.');
        updateAgent(AgentType.DEGRADATION, 'completed', 'Degradation report generated.');

        // 5. Finalize Orchestrator
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

    return (
        <div className="flex h-screen overflow-hidden text-white font-sans bg-black/40 backdrop-blur-sm">

            {/* Sidebar */}
            <aside className="w-64 bg-black/40 border-r border-white/5 flex flex-col flex-shrink-0 z-10 backdrop-blur-xl">
                <div className="p-6 border-b border-white/5">
                    <div className="flex items-center gap-2 mb-1">
                        <div className="bg-emerald-500 p-1.5 rounded-lg shadow-lg shadow-emerald-500/20">
                            <Leaf size={20} className="text-black fill-current" />
                        </div>
                        <h1 className="font-bold text-lg tracking-tight text-emerald-50">HealthGuard</h1>
                    </div>
                    <p className="text-xs text-emerald-400/60 pl-9">AI Orchestrator</p>
                </div>

                <nav className="flex-1 overflow-y-auto p-4 space-y-2">
                    <button
                        onClick={resetToHome}
                        className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300 text-sm font-medium
                    ${view === 'home'
                                ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                                : 'text-gray-400 hover:bg-white/5 hover:text-white'}`}
                    >
                        <PlusCircle size={18} />
                        New Analysis
                    </button>
                    <button
                        onClick={() => view !== 'home' && setView('dashboard')}
                        disabled={!analysisResult}
                        className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300 text-sm font-medium
                    ${view === 'dashboard'
                                ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                                : !analysisResult ? 'text-gray-600 cursor-not-allowed' : 'text-gray-400 hover:bg-white/5 hover:text-white'}`}
                    >
                        <LayoutDashboard size={18} />
                        Live Dashboard
                    </button>
                    <button
                        onClick={() => view !== 'home' && setView('explorer')}
                        disabled={!analysisResult}
                        className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300 text-sm font-medium
                    ${view === 'explorer'
                                ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                                : !analysisResult ? 'text-gray-600 cursor-not-allowed' : 'text-gray-400 hover:bg-white/5 hover:text-white'}`}
                    >
                        <Database size={18} />
                        Data Explorer
                    </button>

                    <div className="pt-6 pb-2">
                        <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider px-2 mb-2 flex items-center gap-2">
                            <History size={12} />
                            Recent Runs
                        </h3>
                        <div className="space-y-1">
                            {history.length === 0 ? (
                                <div className="px-4 py-3 text-xs text-gray-600 italic">No history yet</div>
                            ) : (
                                history.map(item => (
                                    <button
                                        key={item.id}
                                        onClick={() => loadHistoryItem(item)}
                                        className="w-full text-left px-3 py-2 rounded-lg hover:bg-white/5 transition-colors group"
                                    >
                                        <div className="text-sm text-gray-300 group-hover:text-emerald-300 truncate font-medium">
                                            {item.timestamp.toLocaleDateString()}
                                        </div>
                                        <div className="text-xs text-gray-500 truncate mt-0.5">
                                            {item.summary}
                                        </div>
                                    </button>
                                ))
                            )}
                        </div>
                    </div>
                </nav>

                <div className="p-4 border-t border-white/5">
                    <GlassCard className="p-3 bg-gradient-to-br from-emerald-900/50 to-black border-emerald-500/20">
                        <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-emerald-500 flex items-center justify-center text-black font-bold text-xs">
                                EY
                            </div>
                            <div>
                                <p className="text-xs text-white font-medium">Enterprise User</p>
                                <p className="text-[10px] text-emerald-400">Connected</p>
                            </div>
                        </div>
                    </GlassCard>
                </div>
            </aside>

            {/* Main Content Area */}
            <main className="flex-1 flex flex-col h-full overflow-hidden bg-gradient-to-br from-emerald-900/10 via-black to-black relative">
                {/* Background Decoration */}
                <div className="absolute top-0 left-0 w-full h-96 bg-emerald-500/5 blur-[120px] pointer-events-none rounded-full transform -translate-y-1/2"></div>

                <header className="h-16 border-b border-white/5 flex items-center justify-between px-8 flex-shrink-0 z-10 backdrop-blur-sm">
                    <div className="flex items-center text-sm breadcrumbs text-gray-400">
                        <span className="hover:text-white cursor-pointer" onClick={resetToHome}>Home</span>
                        <ChevronRight size={14} className="mx-2" />
                        <span className={view !== 'home' ? 'text-white' : ''}>Analysis</span>
                        {view !== 'home' && <ChevronRight size={14} className="mx-2" />}
                        <span className="text-emerald-400 font-medium">
                            {view === 'dashboard' ? 'Live Dashboard' : view === 'explorer' ? 'Data Explorer' : ''}
                        </span>
                    </div>
                    <div className="flex items-center gap-3">
                        <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-xs text-emerald-400 font-mono">
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
                                        <h1 className="text-4xl md:text-5xl font-bold mb-4 bg-clip-text text-transparent bg-gradient-to-r from-emerald-200 via-teal-200 to-emerald-400">
                                            Provider Validation AI
                                        </h1>
                                        <p className="text-lg text-gray-400 max-w-lg mx-auto">
                                            Upload provider data to initiate the multi-agent orchestration for fraud detection and ROI analysis.
                                        </p>
                                    </div>
                                    <UploadSection onFilesSelected={handleFilesSelected} isProcessing={isProcessing} />
                                </div>
                            </div>
                        )}

                        {view === 'dashboard' && (
                            <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 h-full animate-in slide-in-from-bottom-8 duration-500">
                                {/* Left Column: Upload (Compact) & Orchestration */}
                                <div className="xl:col-span-4 flex flex-col gap-6">
                                    <UploadSection onFilesSelected={handleFilesSelected} isProcessing={isProcessing} compact />
                                    <div className="flex-grow min-h-[400px]">
                                        <AgentDashboard agents={agents} />
                                    </div>
                                </div>

                                {/* Right Column: Analytics Dashboard */}
                                <div className="xl:col-span-8 flex flex-col h-full">
                                    <MetricsDashboard data={analysisResult} />
                                </div>
                            </div>
                        )}

                        {view === 'explorer' && (
                            <div className="h-full">
                                <RecordsExplorer records={analysisResult?.records} />
                            </div>
                        )}

                    </div>
                </div>
            </main>
        </div>
    );
}