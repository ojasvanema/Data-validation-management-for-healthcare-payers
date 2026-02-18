import React from 'react';
import { ShieldCheck, ChevronLeft, ChevronRight, PlusCircle, LayoutDashboard, Database, History, LogOut } from 'lucide-react';
import GlassCard from './GlassCard';

interface HistoryItem {
    id: string;
    timestamp: Date;
    summary: string;
    result: any;
}

interface SidebarProps {
    isCollapsed: boolean;
    setIsCollapsed: (collapsed: boolean) => void;
    currentView: string;
    setCurrentView: (view: any) => void; // Using any for view type simplicity
    history: HistoryItem[];
    onLoadHistory: (item: HistoryItem) => void;
    onReset: () => void;
    hasAnalysisResult: boolean;
    onLogout: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({
    isCollapsed,
    setIsCollapsed,
    currentView,
    setCurrentView,
    history,
    onLoadHistory,
    onReset,
    hasAnalysisResult,
    onLogout
}) => {
    return (
        <aside className={`${isCollapsed ? 'w-20' : 'w-64'} flex flex-col flex-shrink-0 z-20 backdrop-blur-xl border-r transition-all duration-300
            bg-white/80 border-slate-200
            dark:bg-[#0a0a0a]/60 dark:border-white/5
        `}>
            <div className={`p-6 border-b border-inherit flex items-center ${isCollapsed ? 'justify-center' : 'justify-between'}`}>
                <div className="flex items-center gap-2 mb-1">
                    <div className="p-1.5 rounded-lg border bg-emerald-50 border-emerald-200 dark:bg-emerald-500/10 dark:border-emerald-500/20">
                        <ShieldCheck size={20} className="text-emerald-600 dark:text-emerald-400" />
                    </div>
                    {!isCollapsed && <h1 className="font-bold text-lg tracking-tight animate-in fade-in duration-300 font-heading"><span className="text-emerald-600 dark:text-emerald-400">VERA</span></h1>}
                </div>
                {!isCollapsed && <button onClick={() => setIsCollapsed(true)} className="p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-white/5 text-slate-400 hover:text-emerald-500 transition-colors">
                    <ChevronLeft size={16} />
                </button>}
            </div>
            {isCollapsed && (
                <div className="flex justify-center py-2 border-b border-inherit">
                    <button onClick={() => setIsCollapsed(false)} className="p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-white/5 text-slate-400 hover:text-emerald-500 transition-colors" title="Expand Sidebar">
                        <ChevronRight size={16} />
                    </button>
                </div>
            )}
            {!isCollapsed && (
                <div className="px-6 pb-2 pt-1">
                    <p className="text-xs text-slate-500 dark:text-emerald-400/60 pl-9 animate-in fade-in duration-300">AI Orchestrator</p>
                </div>
            )}

            <nav className="flex-1 overflow-y-auto p-4 space-y-2">
                <button
                    onClick={onReset}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300 text-sm font-medium group relative
                ${currentView === 'home'
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-500/20 dark:text-emerald-400 dark:border-emerald-500/30 border'
                            : 'text-slate-500 hover:bg-slate-100 hover:text-slate-900 dark:text-gray-400 dark:hover:bg-white/5 dark:hover:text-white'}`}
                    title={isCollapsed ? "New Analysis" : ""}
                >
                    <PlusCircle size={18} className="shrink-0" />
                    {!isCollapsed && <span className="animate-in fade-in duration-300">New Analysis</span>}
                </button>
                <button
                    onClick={() => currentView !== 'home' && setCurrentView('dashboard')}
                    disabled={!hasAnalysisResult}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300 text-sm font-medium group relative
                ${currentView === 'dashboard'
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-500/20 dark:text-emerald-400 dark:border-emerald-500/30 border'
                            : !hasAnalysisResult ? 'text-gray-400 dark:text-gray-600 cursor-not-allowed' : 'text-slate-500 hover:bg-slate-100 hover:text-slate-900 dark:text-gray-400 dark:hover:bg-white/5 dark:hover:text-white'}`}
                    title={isCollapsed ? "Live Dashboard" : ""}
                >
                    <LayoutDashboard size={18} className="shrink-0" />
                    {!isCollapsed && <span className="animate-in fade-in duration-300">Live Dashboard</span>}
                </button>
                <button
                    onClick={() => currentView !== 'home' && setCurrentView('explorer')}
                    disabled={!hasAnalysisResult}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300 text-sm font-medium group relative
                ${currentView === 'explorer'
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-500/20 dark:text-emerald-400 dark:border-emerald-500/30 border'
                            : !hasAnalysisResult ? 'text-gray-400 dark:text-gray-600 cursor-not-allowed' : 'text-slate-500 hover:bg-slate-100 hover:text-slate-900 dark:text-gray-400 dark:hover:bg-white/5 dark:hover:text-white'}`}
                    title={isCollapsed ? "Data Explorer" : ""}
                >
                    <Database size={18} className="shrink-0" />
                    {!isCollapsed && <span className="animate-in fade-in duration-300">Data Explorer</span>}
                </button>
                <button
                    onClick={() => setCurrentView('manual')}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300 text-sm font-medium group relative
                ${currentView === 'manual'
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-500/20 dark:text-emerald-400 dark:border-emerald-500/30 border'
                            : 'text-slate-500 hover:bg-slate-100 hover:text-slate-900 dark:text-gray-400 dark:hover:bg-white/5 dark:hover:text-white'}`}
                    title={isCollapsed ? "Manual Entry" : ""}
                >
                    <LayoutDashboard size={18} className="shrink-0" />
                    {!isCollapsed && <span className="animate-in fade-in duration-300">Detailed Agent Demo</span>}
                </button>

                <div className={`pt-6 pb-2 ${isCollapsed ? 'hidden' : 'block'}`}>
                    <h3 className="text-xs font-semibold uppercase tracking-wider px-2 mb-2 flex items-center gap-2 text-slate-400 dark:text-gray-500 animate-in fade-in duration-300">
                        <History size={12} />
                        Recent Runs
                    </h3>
                    <div className="space-y-1">
                        {history.length === 0 ? (
                            <div className="px-4 py-3 text-xs text-slate-400 dark:text-gray-600 italic">No history yet</div>
                        ) : (
                            history.map(item => (
                                <button
                                    key={item.id}
                                    onClick={() => onLoadHistory(item)}
                                    className="w-full text-left px-3 py-2 rounded-lg transition-colors group hover:bg-slate-100 dark:hover:bg-white/5"
                                >
                                    <div className="text-sm font-medium truncate text-slate-700 dark:text-gray-300 group-hover:text-emerald-600 dark:group-hover:text-emerald-300">
                                        {item.timestamp.toLocaleDateString()}
                                    </div>
                                    <div className="text-xs truncate mt-0.5 text-slate-500 dark:text-gray-500">
                                        {item.summary}
                                    </div>
                                </button>
                            ))
                        )}
                    </div>
                </div>
            </nav>

            <div className="p-4 border-t border-inherit space-y-2">
                <button
                    onClick={onLogout}
                    className={`w-full flex items-center gap-3 px-4 py-2 rounded-lg text-xs transition-colors text-slate-500 hover:text-slate-900 hover:bg-slate-100 dark:text-gray-500 dark:hover:text-white dark:hover:bg-white/5 ${isCollapsed ? 'justify-center' : ''}`}
                    title={isCollapsed ? "Logout" : ""}
                >
                    <LogOut size={14} className="shrink-0" />
                    {!isCollapsed && <span className="animate-in fade-in duration-300">Logout</span>}
                </button>

                <GlassCard className="p-3 bg-gradient-to-br from-white to-slate-100 border-slate-200 dark:from-emerald-900/50 dark:to-black dark:border-emerald-500/20">
                    <div className={`flex items-center gap-3 ${isCollapsed ? 'justify-center' : ''}`}>
                        <div className="w-8 h-8 rounded-full bg-emerald-500 flex items-center justify-center text-white dark:text-black font-bold text-xs shadow-sm shrink-0">
                            EY
                        </div>
                        {!isCollapsed && (
                            <div className="animate-in fade-in duration-300">
                                <p className="text-xs font-medium text-slate-900 dark:text-white">Enterprise User</p>
                                <p className="text-[10px] text-emerald-600 dark:text-emerald-400">Connected</p>
                            </div>
                        )}
                    </div>
                </GlassCard>
            </div>
        </aside>
    );
};

export default Sidebar;
