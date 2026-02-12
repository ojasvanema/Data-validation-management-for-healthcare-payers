import React, { useState, useMemo } from 'react';
import { Search, Filter, AlertTriangle, CheckCircle2, AlertCircle, Eye, ArrowRight, X, BrainCircuit, Mail, Phone, MoreHorizontal, ChevronRight, MessageSquare, ShieldCheck, Clock, Star, History, MapPin } from 'lucide-react';
import GlassCard from './GlassCard';
import { ProviderRecord, AgentThought } from '../types';

interface RecordsExplorerProps {
   records: ProviderRecord[] | undefined;
}

const RecordsExplorer: React.FC<RecordsExplorerProps> = ({ records }) => {
   const [searchTerm, setSearchTerm] = useState('');
   const [selectedRecord, setSelectedRecord] = useState<ProviderRecord | null>(null);
   const [statusFilter, setStatusFilter] = useState<'All' | 'Flagged' | 'Verified' | 'Review'>('All');

   const [pendingStatus, setPendingStatus] = useState<'Flagged' | 'Review' | 'Verified' | null>(null);
   const [showCallDropdown, setShowCallDropdown] = useState(false);
   const [isActionsCollapsed, setIsActionsCollapsed] = useState(false);

   const filteredRecords = useMemo(() => {
      if (!records) return [];
      return records.filter(record => {
         const matchesSearch = record.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            record.npi.includes(searchTerm) ||
            record.specialty.toLowerCase().includes(searchTerm.toLowerCase());
         const matchesStatus = statusFilter === 'All' || record.status === statusFilter;
         return matchesSearch && matchesStatus;
      });
   }, [records, searchTerm, statusFilter]);

   const getRiskColor = (score: number) => {
      if (score < 30) return 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20';
      if (score < 70) return 'text-yellow-400 bg-yellow-500/10 border-yellow-500/20';
      return 'text-red-400 bg-red-500/10 border-red-500/20';
   };

   // Update local pending state
   const handleStatusChange = (newStatus: 'Flagged' | 'Review' | 'Verified') => {
      setPendingStatus(newStatus);
   };

   // Import at top of file needed: import { updateProviderStatus } from '../services/apiService';

   // Commit status change
   const handleConfirmStatusUpdate = async () => {
      if (selectedRecord && pendingStatus) {
         try {
            // Call API to persist change
            // We need to dynamic import or pass this function as prop usually, but for now we'll fetch
            // since this component doesn't have the API service imported yet, let's assume valid scope or add import
            // For strict correctness in this edited snippet:

            // Optimistic update
            const updatedRecord = { ...selectedRecord, status: pendingStatus };
            setSelectedRecord(updatedRecord);

            // Trigger actual API call (silently for now in this scope, or ideally propagated up)
            // Ideally we should pass an onUpdate prop to this component to handle data refresh
            // But to fulfill the request directly:
            const { updateProviderStatus } = await import('../services/apiService');
            await updateProviderStatus(selectedRecord.id, pendingStatus);

            setPendingStatus(null);
         } catch (error) {
            console.error("Failed to update status:", error);
            // Revert or show toast
         }
      }
   };

   // Reset pending status when record selection changes
   React.useEffect(() => {
      setPendingStatus(null);
   }, [selectedRecord?.id]);

   return (
      <div className="flex h-full gap-6 animate-in fade-in duration-500">
         {/* Main Table Area */}
         <div className={`flex-1 flex flex-col transition-all duration-300 ${selectedRecord ? 'w-[60%]' : 'w-full'}`}>
            <GlassCard className="flex-1 flex flex-col p-0 overflow-hidden border-slate-200 dark:border-emerald-500/20 bg-white/50 dark:bg-[#0a0a0a]/40">
               {/* Header & Controls */}
               <div className="p-4 border-b border-slate-100 dark:border-white/5 flex items-center justify-between bg-white dark:bg-[#0a0a0a]/40">
                  <div className="flex items-center gap-2">
                     <h2 className="text-lg font-bold text-slate-900 dark:text-white">Data Explorer</h2>
                     <span className="text-xs bg-slate-100 dark:bg-white/10 px-2 py-0.5 rounded text-slate-500 dark:text-gray-400">
                        {records ? records.length : 0} Entries
                     </span>
                  </div>

                  <div className="flex items-center gap-3">
                     <div className="flex bg-slate-100 dark:bg-black/30 rounded-lg p-1 border border-slate-200 dark:border-white/10">
                        {['All', 'Flagged', 'Review', 'Verified'].map((status) => (
                           <button
                              key={status}
                              onClick={() => setStatusFilter(status as any)}
                              className={`px-3 py-1 rounded text-xs font-medium transition-all ${statusFilter === status ? 'bg-white dark:bg-white/10 text-slate-900 dark:text-white shadow-sm dark:shadow-none' : 'text-slate-500 dark:text-gray-500 hover:text-slate-700 dark:hover:text-gray-300'}`}
                           >
                              {status}
                           </button>
                        ))}
                     </div>
                     <div className="relative">
                        <Search size={16} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 dark:text-gray-400" />
                        <input
                           type="text"
                           placeholder="Search name, NPI..."
                           value={searchTerm}
                           onChange={(e) => setSearchTerm(e.target.value)}
                           className="bg-slate-50 dark:bg-black/30 border border-slate-200 dark:border-white/10 rounded-lg pl-9 pr-4 py-1.5 text-sm text-slate-900 dark:text-white focus:outline-none focus:border-emerald-500/50 w-56 transition-colors"
                        />
                     </div>
                  </div>
               </div>

               {/* Table Header */}
               <div className="grid grid-cols-12 gap-4 px-6 py-3 border-b border-slate-100 dark:border-white/5 bg-slate-50 dark:bg-white/[0.02] text-xs font-semibold text-slate-500 dark:text-gray-400 uppercase tracking-wider">
                  <div className="col-span-4">Provider Name</div>
                  <div className="col-span-3">NPI / Specialty</div>
                  <div className="col-span-2">Risk Score</div>
                  <div className="col-span-2">Status</div>
                  <div className="col-span-1 text-center">Action</div>
               </div>

               {/* Table Body */}
               <div className="overflow-y-auto flex-1 custom-scrollbar">
                  {!records || records.length === 0 ? (
                     <div className="flex flex-col items-center justify-center h-48 text-slate-500 dark:text-gray-500">
                        <p>No records found to display.</p>
                     </div>
                  ) : filteredRecords.length === 0 ? (
                     <div className="flex flex-col items-center justify-center h-48 text-slate-500 dark:text-gray-500">
                        <p>No matches found for "{searchTerm}"</p>
                     </div>
                  ) : (
                     filteredRecords.map((record) => (
                        <div
                           key={record.id}
                           onClick={() => setSelectedRecord(record)}
                           className={`grid grid-cols-12 gap-4 px-6 py-3 border-b border-slate-100 dark:border-white/5 items-center hover:bg-slate-50 dark:hover:bg-emerald-500/5 cursor-pointer transition-colors group text-sm
                    ${selectedRecord?.id === record.id ? 'bg-emerald-50 dark:bg-emerald-500/10 border-l-2 border-l-emerald-500 dark:border-l-emerald-400' : 'border-l-2 border-l-transparent'}
                  `}
                        >
                           <div className="col-span-4 font-medium text-slate-900 dark:text-white truncate flex items-center gap-3">
                              <div className={`w-2 h-2 rounded-full shrink-0 ${record.status === 'Verified' ? 'bg-emerald-500' : record.status === 'Flagged' ? 'bg-red-500' : 'bg-yellow-500'}`}></div>
                              <span className="truncate">{record.name}</span>
                           </div>

                           <div className="col-span-3 text-slate-500 dark:text-gray-400 truncate">
                              <div className="text-xs font-mono text-slate-600 dark:text-emerald-400/70">{record.npi}</div>
                              <div className="text-[10px] uppercase text-slate-400 dark:text-gray-500">{record.specialty}</div>
                           </div>

                           <div className="col-span-2">
                              <span className={`px-2 py-0.5 rounded text-xs font-medium border ${getRiskColor(record.riskScore)}`}>
                                 {record.riskScore}/100
                              </span>
                           </div>

                           <div className="col-span-2">
                              {record.status === 'Verified' && (
                                 <span className="flex items-center gap-1.5 text-emerald-700 dark:text-emerald-400 text-xs bg-emerald-50 dark:bg-emerald-500/10 px-2 py-1 rounded w-fit">
                                    <CheckCircle2 size={12} /> Verified
                                 </span>
                              )}
                              {record.status === 'Flagged' && (
                                 <span className="flex items-center gap-1.5 text-red-700 dark:text-red-400 text-xs bg-red-50 dark:bg-red-500/10 px-2 py-1 rounded w-fit">
                                    <AlertCircle size={12} /> Flagged
                                 </span>
                              )}
                              {record.status === 'Review' && (
                                 <span className="flex items-center gap-1.5 text-yellow-700 dark:text-yellow-400 text-xs bg-yellow-50 dark:bg-yellow-500/10 px-2 py-1 rounded w-fit">
                                    <AlertTriangle size={12} /> Review
                                 </span>
                              )}
                           </div>

                           <div className="col-span-1 flex justify-center">
                              <button className="p-1.5 rounded hover:bg-slate-200 dark:hover:bg-white/10 text-slate-400 dark:text-gray-500 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
                                 <ChevronRight size={16} />
                              </button>
                           </div>
                        </div>
                     ))
                  )}
               </div>
            </GlassCard>
         </div>

         {/* Detail Slide-over Panel */}
         {selectedRecord && (
            <div className="w-[40%] flex-shrink-0 animate-in slide-in-from-right-10 duration-300 flex flex-col gap-4">
               {/* Metadata Card */}
               <GlassCard className="p-0 border-slate-200 dark:border-emerald-500/30 shadow-lg dark:shadow-none bg-white/50 dark:bg-[#0a0a0a]/40 backdrop-blur-md">
                  <div className="p-5 border-b border-slate-100 dark:border-white/10 bg-emerald-50 dark:bg-emerald-900/10 flex justify-between items-start">
                     <div>
                        <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-1">{selectedRecord.name}</h3>
                        <div className="flex items-center gap-3 text-xs text-slate-500 dark:text-gray-400">
                           <span className="font-mono bg-white dark:bg-white/5 px-1.5 py-0.5 rounded text-emerald-700 dark:text-emerald-300 border border-slate-200 dark:border-transparent">{selectedRecord.npi}</span>
                           <span>{selectedRecord.specialty}</span>
                        </div>
                     </div>
                     <button onClick={() => setSelectedRecord(null)} className="text-slate-400 dark:text-gray-400 hover:text-slate-700 dark:hover:text-white transition-colors">
                        <X size={20} />
                     </button>
                  </div>

                  <div className="p-4 bg-white dark:bg-[#0a0a0a] space-y-4">
                     {/* Feedback Section */}
                     {selectedRecord.feedback && (
                        <div className="bg-slate-50 dark:bg-white/5 rounded-lg p-3 border border-slate-100 dark:border-white/5">
                           <div className="flex justify-between items-center mb-2">
                              <h4 className="text-xs font-bold text-slate-500 dark:text-gray-400 uppercase tracking-wider">Patient Feedback</h4>
                              <div className="flex items-center gap-1 bg-yellow-400/20 text-yellow-600 dark:text-yellow-400 px-2 py-0.5 rounded text-xs font-bold">
                                 <Star size={12} fill="currentColor" /> {selectedRecord.feedback.score}
                              </div>
                           </div>
                           <div className="flex gap-1 h-8 items-end mb-2">
                              {selectedRecord.feedback.trend.map((val, idx) => (
                                 <div key={idx} className="flex-1 bg-emerald-500/20 rounded-sm relative group">
                                    <div className="absolute bottom-0 w-full bg-emerald-500 rounded-sm" style={{ height: `${(val / 5) * 100}%` }}></div>
                                    <div className="opacity-0 group-hover:opacity-100 absolute -top-6 left-1/2 -translate-x-1/2 bg-black text-white text-[10px] px-1 py-0.5 rounded pointer-events-none">{val}</div>
                                 </div>
                              ))}
                           </div>
                           <div className="space-y-1">
                              {selectedRecord.feedback.recent_reviews.map((review, i) => (
                                 <div key={i} className="text-[10px] text-slate-500 dark:text-gray-400 italic opacity-80">"{review}"</div>
                              ))}
                           </div>
                        </div>
                     )}

                     {/* Locations List */}
                     <div className="space-y-2">
                        <div className="flex items-center gap-2 text-slate-900 dark:text-white text-xs font-semibold">
                           <MapPin size={12} /> Locations History
                        </div>
                        <div className="space-y-1.5 max-h-[100px] overflow-y-auto custom-scrollbar">
                           {selectedRecord.locations.map((loc, idx) => (
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

                     {/* Actions & Status (Collapsible) */}
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
                                       onClick={() => setShowCallDropdown(!showCallDropdown)}
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
                                 </select>
                                 <div className="flex justify-between mt-1 px-1">
                                    <div className={`w-2 h-2 rounded-full ${(pendingStatus || selectedRecord.status) === 'Review' ? 'bg-yellow-500 ring-2 ring-yellow-500/20' : 'bg-slate-200 dark:bg-gray-700'}`}></div>
                                    <div className={`w-2 h-2 rounded-full ${(pendingStatus || selectedRecord.status) === 'Flagged' ? 'bg-red-500 ring-2 ring-red-500/20' : 'bg-slate-200 dark:bg-gray-700'}`}></div>
                                    <div className={`w-2 h-2 rounded-full ${(pendingStatus || selectedRecord.status) === 'Verified' ? 'bg-emerald-500 ring-2 ring-emerald-500/20' : 'bg-slate-200 dark:bg-gray-700'}`}></div>
                                 </div>

                                 {pendingStatus && pendingStatus !== selectedRecord.status && (
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
                  </div>
               </GlassCard>

               {/* Agent Analysis Chat */}
               <GlassCard className="flex-1 flex flex-col p-0 border-slate-200 dark:border-emerald-500/20 overflow-hidden shadow-lg dark:shadow-none bg-white/50 dark:bg-transparent">
                  <div className="p-3 border-b border-slate-100 dark:border-white/10 bg-slate-50 dark:bg-white/5 flex items-center gap-2">
                     <BrainCircuit size={16} className="text-purple-600 dark:text-purple-400" />
                     <h4 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">Agentic Preview</h4>
                  </div>

                  <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar bg-white dark:bg-[#050505]/50">
                     {selectedRecord.agentThoughts.map((thought, idx) => (
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

                  {selectedRecord.conflicts.length > 0 && (
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
               </GlassCard>
            </div>
         )}
      </div>
   );
};

export default RecordsExplorer;
