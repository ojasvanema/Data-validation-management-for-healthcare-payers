import React, { useState } from 'react';
import { X, ShieldCheck, MapPin, Phone, Clock, AlertCircle, ChevronRight, Mail, BrainCircuit, ArrowRight } from 'lucide-react';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, ReferenceLine } from 'recharts';
import GlassCard from './GlassCard';
import { useTheme } from './ThemeContext';
import { ProviderRecord } from '../types';

interface ProviderDetailViewProps {
    selectedRecord: ProviderRecord;
    onClose?: () => void;
    pendingStatus?: string | null;
    handleStatusChange?: (status: any) => void;
    handleConfirmStatusUpdate?: () => void;
    showCallDropdown?: boolean;
    setShowCallDropdown?: (show: boolean) => void;
    isActionsCollapsed?: boolean;
    setIsActionsCollapsed?: (collapsed: boolean) => void;
}

const ProviderDetailView: React.FC<ProviderDetailViewProps> = ({
    selectedRecord,
    onClose,
    pendingStatus,
    handleStatusChange,
    handleConfirmStatusUpdate,
    showCallDropdown,
    setShowCallDropdown,
    isActionsCollapsed,
    setIsActionsCollapsed
}) => {
    const { theme } = useTheme();
    const isDark = theme === 'dark';

    return (
        <div className="w-full flex flex-col h-full bg-slate-50 dark:bg-[#0a0a0a]/60 border-l border-slate-200 dark:border-white/5 overflow-y-auto animate-in slide-in-from-right-8 duration-300">
            <div className="p-5 border-b border-slate-100 dark:border-white/10 bg-emerald-50 dark:bg-emerald-900/10 flex justify-between items-start">
                <div>
                    <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-1">{selectedRecord.name}</h3>
                    <div className="flex items-center gap-3 text-xs text-slate-500 dark:text-gray-400">
                        <span className="font-mono bg-white dark:bg-white/5 px-1.5 py-0.5 rounded text-emerald-700 dark:text-emerald-300 border border-slate-200 dark:border-transparent">{selectedRecord.npi}</span>
                        <span>{selectedRecord.specialty}</span>
                    </div>
                </div>
                {onClose && (
                    <button onClick={onClose} className="text-slate-400 dark:text-gray-400 hover:text-slate-700 dark:hover:text-white transition-colors">
                        <X size={20} />
                    </button>
                )}
            </div>

            <div className="p-4 bg-white dark:bg-[#0a0a0a] space-y-4">
                {/* Complaint History Section */}
                <div className="bg-slate-50 dark:bg-white/5 rounded-lg p-3 border border-slate-100 dark:border-white/5 relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                        <AlertCircle size={60} />
                    </div>
                    <h4 className="text-xs font-bold text-slate-500 dark:text-gray-400 uppercase tracking-wider mb-3 flex items-center gap-2">
                        <AlertCircle size={14} /> Complaint History
                    </h4>

                    <div className="space-y-3">
                        {selectedRecord.complaints && selectedRecord.complaints.length > 0 ? (
                            selectedRecord.complaints.map((complaint, idx) => (
                                <div key={idx} className="p-3 rounded bg-white dark:bg-black/20 border border-slate-200 dark:border-white/10">
                                    <div className="flex justify-between items-start mb-1">
                                        <span className="text-[10px] font-bold text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 px-1.5 py-0.5 rounded uppercase">
                                            {complaint.field}
                                        </span>
                                        <span className="text-[10px] text-slate-400 font-mono">{complaint.date}</span>
                                    </div>
                                    <div className="text-xs font-medium text-slate-700 dark:text-gray-300 mb-1">
                                        "{complaint.value}"
                                    </div>
                                    {complaint.notes && (
                                        <p className="text-[10px] text-slate-500 dark:text-gray-500 italic">
                                            Note: {complaint.notes}
                                        </p>
                                    )}
                                </div>
                            ))
                        ) : (
                            <div className="text-center py-4 text-slate-400 dark:text-gray-600">
                                <ShieldCheck size={24} className="mx-auto mb-1 opacity-50" />
                                <p className="text-xs">No member complaints on file.</p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Locations List */}
                <div className="space-y-2">
                    <div className="flex items-center gap-2 text-slate-900 dark:text-white text-xs font-semibold">
                        <MapPin size={12} /> Locations History
                    </div>
                    <div className="space-y-1.5 max-h-[100px] overflow-y-auto custom-scrollbar">
                        {selectedRecord.locations?.map((loc, idx) => (
                            <div key={idx} className="text-xs flex justify-between items-start p-2 rounded bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-white/5">
                                <span className="text-slate-600 dark:text-gray-300 w-[70%]">{loc.address}</span>
                                <span className="text-[10px] text-slate-400 whitespace-nowrap">{new Date(loc.updated).toLocaleDateString()}</span>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Contact Numbers List */}
                <div className="space-y-2">
                    <div className="flex items-center gap-2 text-slate-900 dark:text-white text-xs font-semibold">
                        <Phone size={12} /> Contact Numbers
                    </div>
                    <div className="space-y-1.5 max-h-[100px] overflow-y-auto custom-scrollbar">
                        {selectedRecord.contact_numbers?.map((contact, idx) => (
                            <div key={idx} className="text-xs flex justify-between items-center p-2 rounded bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-white/5">
                                <span className="text-slate-600 dark:text-gray-300 font-mono">{contact.number}</span>
                                <span className="text-[10px] text-slate-500 bg-slate-100 dark:bg-white/10 px-1.5 py-0.5 rounded">{contact.type}</span>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Predictive Degradation — Survival Curve */}
                <div className="space-y-2">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 text-slate-900 dark:text-white text-xs font-semibold">
                            <Clock size={12} /> Decay Curve
                        </div>
                        <span className="text-[10px] text-purple-500 dark:text-purple-400 font-semibold uppercase tracking-wider bg-purple-50 dark:bg-purple-500/10 px-1.5 py-0.5 rounded-full border border-purple-100 dark:border-purple-500/20">
                            PDA
                        </span>
                    </div>
                    {(() => {
                        const dp = Math.min(Math.max((selectedRecord.decayProb != null ? selectedRecord.decayProb : 0.05), 0.01), 0.99);
                        const lambda = -Math.log(1 - dp) / 90;
                        const curveData = [];
                        for (let t = 0; t <= 180; t += 5) {
                            curveData.push({ day: t, accuracy: Math.round(Math.exp(-lambda * t) * 1000) / 10 });
                        }
                        const reVerifyDay = curveData.find(p => p.accuracy < 70)?.day || 180;
                        const reVerifyDate = new Date();
                        reVerifyDate.setDate(reVerifyDate.getDate() + reVerifyDay);
                        const reVerifyStr = reVerifyDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
                        const tooltipBg = isDark ? '#022c22' : '#ffffff';
                        const tooltipBorder = isDark ? '#064e3b' : '#e2e8f0';
                        const tooltipText = isDark ? '#fff' : '#0f172a';
                        const axisColor = isDark ? 'rgba(255,255,255,0.25)' : 'rgba(0,0,0,0.3)';

                        return (
                            <div className="bg-slate-50 dark:bg-white/5 rounded-lg p-3 border border-slate-100 dark:border-white/5">
                                <ResponsiveContainer width="100%" height={130}>
                                    <AreaChart data={curveData} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                                        <defs>
                                            <linearGradient id="decayCurveGrad" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="5%" stopColor="#a855f7" stopOpacity={0.25} />
                                                <stop offset="95%" stopColor="#a855f7" stopOpacity={0} />
                                            </linearGradient>
                                        </defs>
                                        <XAxis dataKey="day" stroke={axisColor} fontSize={9} tickLine={false} axisLine={false} />
                                        <YAxis domain={[0, 100]} stroke={axisColor} fontSize={9} tickLine={false} axisLine={false} tickFormatter={(v: number) => `${v}%`} />
                                        <Tooltip
                                            contentStyle={{ backgroundColor: tooltipBg, borderColor: tooltipBorder, color: tooltipText, borderRadius: '6px', fontSize: '11px' }}
                                            formatter={(value: number) => [`${value.toFixed(1)}%`, 'Accuracy']}
                                            labelFormatter={(label: number) => `Day ${label}`}
                                        />
                                        <ReferenceLine y={70} stroke={isDark ? 'rgba(239,68,68,0.5)' : 'rgba(239,68,68,0.35)'} strokeDasharray="4 3" />
                                        <Area type="monotone" dataKey="accuracy" stroke="#a855f7" strokeWidth={2} fillOpacity={1} fill="url(#decayCurveGrad)" dot={false} />
                                    </AreaChart>
                                </ResponsiveContainer>
                                <div className="flex items-center justify-between mt-2 pt-2 border-t border-slate-100 dark:border-white/5">
                                    <div>
                                        <div className="text-[10px] text-slate-400 dark:text-gray-500 uppercase tracking-wider">Re-verify by</div>
                                        <div className={`text-xs font-bold ${dp >= 0.6 ? 'text-red-500' : dp >= 0.3 ? 'text-amber-500' : 'text-emerald-500'
                                            }`}>{reVerifyStr}</div>
                                    </div>
                                    <div className="text-right">
                                        <div className="text-[10px] text-slate-400 dark:text-gray-500 uppercase tracking-wider">90-day Fail Prob</div>
                                        <div className={`text-xs font-bold ${dp >= 0.6 ? 'text-red-500' : dp >= 0.3 ? 'text-amber-500' : 'text-emerald-500'
                                            }`}>{(dp * 100).toFixed(0)}%</div>
                                    </div>
                                </div>
                            </div>
                        );
                    })()}
                </div>

                {/* Actions & Status (Collapsible) */}
                {handleStatusChange && setIsActionsCollapsed && (
                    <div className="border-t border-slate-100 dark:border-white/5 pt-2">
                        <button
                            onClick={() => setIsActionsCollapsed(!isActionsCollapsed)}
                            className="w-full flex items-center justify-between text-xs font-bold text-slate-500 dark:text-gray-400 uppercase tracking-wider mb-2 hover:text-slate-700 dark:hover:text-white transition-colors"
                        >
                            <span>Review & Actions</span>
                            {isActionsCollapsed ? <ChevronRight size={14} /> : <ChevronRight size={14} className="rotate-90" />}
                        </button>

                        {!isActionsCollapsed && (
                            <div className="grid grid-cols-2 gap-3 animate-in slide-in-from-top-2 duration-200">
                                <div className="flex flex-col gap-2 relative">
                                    <button className="w-full py-2 bg-slate-50 dark:bg-white/5 hover:bg-emerald-50 dark:hover:bg-emerald-500/20 hover:text-emerald-700 dark:hover:text-emerald-300 border border-slate-200 dark:border-white/5 hover:border-emerald-200 dark:hover:border-emerald-500/30 rounded-lg text-xs text-slate-600 dark:text-gray-300 transition-colors flex items-center justify-center gap-2">
                                        <Mail size={14} /> Send Email
                                    </button>

                                    <div className="relative">
                                        <button
                                            onClick={() => setShowCallDropdown && setShowCallDropdown(!showCallDropdown)}
                                            className="w-full py-2 bg-slate-50 dark:bg-white/5 hover:bg-blue-50 dark:hover:bg-blue-500/20 hover:text-blue-700 dark:hover:text-blue-300 border border-slate-200 dark:border-white/5 hover:border-blue-200 dark:hover:border-blue-500/30 rounded-lg text-xs text-slate-600 dark:text-gray-300 transition-colors flex items-center justify-center gap-2"
                                        >
                                            <Phone size={14} /> Call Provider {showCallDropdown ? <ChevronRight size={12} className="rotate-90" /> : null}
                                        </button>

                                        {showCallDropdown && (
                                            <div className="absolute top-full left-0 w-full mt-1 bg-white dark:bg-[#1a1a1a] border border-slate-200 dark:border-white/10 rounded-lg shadow-xl z-10 overflow-hidden animate-in fade-in zoom-in-95">
                                                {selectedRecord.contact_numbers?.length > 0 ? (
                                                    selectedRecord.contact_numbers.map((contact, idx) => (
                                                        <a
                                                            key={idx}
                                                            href={`tel:${contact.number}`}
                                                            className="block px-3 py-2 text-xs text-slate-600 dark:text-gray-300 hover:bg-slate-50 dark:hover:bg-white/5 flex justify-between items-center"
                                                        >
                                                            <span>{contact.type}</span>
                                                            <span className="font-mono text-slate-400">{contact.number}</span>
                                                        </a>
                                                    ))
                                                ) : (
                                                    <div className="px-3 py-2 text-xs text-slate-400 italic text-center">No numbers available</div>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                </div>

                                <div className="flex flex-col gap-1">
                                    <label className="text-[10px] text-slate-400 dark:text-gray-400 uppercase font-semibold">Validation Status</label>
                                    <select
                                        value={pendingStatus || selectedRecord.status}
                                        onChange={(e) => handleStatusChange(e.target.value as any)}
                                        className="w-full bg-slate-50 dark:bg-black/40 border border-slate-200 dark:border-white/10 rounded-lg py-1.5 px-3 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-emerald-500/50"
                                    >
                                        <option value="Review">Review Pending</option>
                                        <option value="Flagged">Flagged for Correction</option>
                                        <option value="Verified">Verified</option>
                                        <option value="Pending">Validation Pending</option>
                                    </select>
                                    <div className="flex justify-between mt-1 px-1">
                                        <div className={`w-2 h-2 rounded-full ${(pendingStatus || selectedRecord.status) === 'Review' ? 'bg-yellow-500 ring-2 ring-yellow-500/20' : 'bg-slate-200 dark:bg-gray-700'}`}></div>
                                        <div className={`w-2 h-2 rounded-full ${(pendingStatus || selectedRecord.status) === 'Flagged' ? 'bg-red-500 ring-2 ring-red-500/20' : 'bg-slate-200 dark:bg-gray-700'}`}></div>
                                        <div className={`w-2 h-2 rounded-full ${(pendingStatus || selectedRecord.status) === 'Verified' ? 'bg-emerald-500 ring-2 ring-emerald-500/20' : 'bg-slate-200 dark:bg-gray-700'}`}></div>
                                        <div className={`w-2 h-2 rounded-full ${(pendingStatus || selectedRecord.status) === 'Pending' ? 'bg-blue-500 ring-2 ring-blue-500/20' : 'bg-slate-200 dark:bg-gray-700'}`}></div>
                                    </div>

                                    {pendingStatus && pendingStatus !== selectedRecord.status && handleConfirmStatusUpdate && (
                                        <button
                                            onClick={handleConfirmStatusUpdate}
                                            className="mt-2 w-full py-1.5 bg-emerald-500 text-white rounded-lg text-xs font-medium hover:bg-emerald-600 transition-colors flex items-center justify-center gap-1 animate-in fade-in zoom-in-95"
                                        >
                                            Send Update <ArrowRight size={12} />
                                        </button>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* Agent Analysis Chat */}
            <div className="flex-shrink-0 flex flex-col p-0 border-t border-slate-200 dark:border-emerald-500/20 overflow-hidden shadow-lg dark:shadow-none bg-white/50 dark:bg-transparent" style={{ minHeight: '400px' }}>
                <div className="p-3 border-b border-slate-100 dark:border-white/10 bg-slate-50 dark:bg-white/5 flex items-center gap-2">
                    <BrainCircuit size={16} className="text-purple-600 dark:text-purple-400" />
                    <h4 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">Agentic Preview</h4>
                </div>

                <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar bg-white dark:bg-[#050505]/50">
                    {selectedRecord.agentThoughts?.map((thought, idx) => (
                        <div key={idx} className="flex gap-3">
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 border text-[10px] font-bold
                          ${thought.agentName.includes('Validation')
                                    ? 'bg-blue-50 border-blue-200 text-blue-600 dark:bg-blue-500/10 dark:border-blue-500/20 dark:text-blue-400'
                                    : thought.agentName.includes('Fraud')
                                        ? 'bg-red-50 border-red-200 text-red-600 dark:bg-red-500/10 dark:border-red-500/20 dark:text-red-400'
                                        : 'bg-purple-50 border-purple-200 text-purple-600 dark:bg-purple-500/10 dark:border-purple-500/20 dark:text-purple-400'}
                     `}>
                                {thought.agentName.substring(0, 2).toUpperCase()}
                            </div>
                            <div className="space-y-1 max-w-[85%]">
                                <div className="flex items-center gap-2">
                                    <span className="text-xs font-semibold text-slate-700 dark:text-gray-300">{thought.agentName}</span>
                                    <span className="text-[10px] text-slate-400 dark:text-gray-600">{new Date(thought.timestamp).toLocaleTimeString()}</span>
                                </div>
                                <div className={`p-3 rounded-2xl rounded-tl-none text-xs leading-relaxed border
                              ${thought.verdict === 'fail'
                                        ? 'bg-red-50 border-red-100 text-slate-700 dark:bg-red-900/10 dark:border-red-500/20 dark:text-gray-300'
                                        : thought.verdict === 'pass'
                                            ? 'bg-emerald-50 border-emerald-100 text-slate-700 dark:bg-emerald-900/10 dark:border-emerald-500/20 dark:text-gray-300'
                                            : 'bg-slate-50 border-slate-100 text-slate-700 dark:bg-white/5 dark:border-white/10 dark:text-gray-300'}
                          `}>
                                    {thought.thought}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                {selectedRecord.conflicts && selectedRecord.conflicts.length > 0 && (
                    <div className="p-4 border-t border-red-100 dark:border-white/10 bg-red-50 dark:bg-red-900/5">
                        <div className="flex items-center gap-2 mb-2 text-red-600 dark:text-red-400">
                            <AlertCircle size={14} />
                            <span className="text-xs font-bold uppercase">Detected Conflicts</span>
                        </div>
                        <div className="space-y-1">
                            {selectedRecord.conflicts.map((c, i) => (
                                <div key={i} className="text-xs text-red-700/80 dark:text-red-300/80 pl-6 relative">
                                    <span className="absolute left-2 top-1.5 w-1 h-1 rounded-full bg-red-500 dark:bg-red-400"></span>
                                    {c}
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default ProviderDetailView;
