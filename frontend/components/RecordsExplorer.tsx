import React, { useState, useMemo } from 'react';
import { Search, Filter, AlertTriangle, CheckCircle2, AlertCircle, Eye, ArrowRight, X, BrainCircuit } from 'lucide-react';
import GlassCard from './GlassCard';
import { ProviderRecord, AgentThought } from '../types';

interface RecordsExplorerProps {
   records: ProviderRecord[] | undefined;
}

const RecordsExplorer: React.FC<RecordsExplorerProps> = ({ records }) => {
   const [searchTerm, setSearchTerm] = useState('');
   const [selectedRecord, setSelectedRecord] = useState<ProviderRecord | null>(null);

   const filteredRecords = useMemo(() => {
      if (!records) return [];
      return records.filter(record =>
         record.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
         record.npi.includes(searchTerm) ||
         record.specialty.toLowerCase().includes(searchTerm.toLowerCase())
      );
   }, [records, searchTerm]);

   const getRiskColor = (score: number) => {
      if (score < 30) return 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20';
      if (score < 70) return 'text-yellow-400 bg-yellow-500/10 border-yellow-500/20';
      return 'text-red-400 bg-red-500/10 border-red-500/20';
   };

   const getDecayColor = (prob: number) => {
      // High decay prob is bad
      if (prob < 0.3) return 'bg-emerald-500';
      if (prob < 0.7) return 'bg-yellow-500';
      return 'bg-red-500';
   };

   return (
      <div className="flex h-full gap-6 animate-in fade-in duration-500">
         {/* Main Table Area */}
         <div className={`flex-1 flex flex-col transition-all duration-300 ${selectedRecord ? 'w-2/3' : 'w-full'}`}>
            <GlassCard className="flex-1 flex flex-col p-0 overflow-hidden border-emerald-500/20">
               {/* Header & Controls */}
               <div className="p-4 border-b border-white/5 flex items-center justify-between bg-[#0a0a0a]/40">
                  <div className="flex items-center gap-2">
                     <h2 className="text-lg font-bold text-white">Data Explorer</h2>
                     <span className="text-xs bg-white/10 px-2 py-0.5 rounded text-gray-400">
                        {records ? records.length : 0} Entries
                     </span>
                  </div>

                  <div className="flex items-center gap-3">
                     <div className="relative">
                        <Search size={16} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                        <input
                           type="text"
                           placeholder="Search name, NPI..."
                           value={searchTerm}
                           onChange={(e) => setSearchTerm(e.target.value)}
                           className="bg-black/30 border border-white/10 rounded-lg pl-9 pr-4 py-1.5 text-sm text-white focus:outline-none focus:border-emerald-500/50 w-64 transition-colors"
                        />
                     </div>
                     <button className="p-1.5 hover:bg-white/5 rounded text-gray-400 hover:text-white transition-colors">
                        <Filter size={18} />
                     </button>
                  </div>
               </div>

               {/* Table Header */}
               <div className="grid grid-cols-12 gap-4 px-6 py-3 border-b border-white/5 bg-white/[0.02] text-xs font-semibold text-gray-400 uppercase tracking-wider">
                  <div className="col-span-3">Provider Name</div>
                  <div className="col-span-2">NPI / Specialty</div>
                  <div className="col-span-2">Risk Score</div>
                  <div className="col-span-2">Decay Prob.</div>
                  <div className="col-span-2">Status</div>
                  <div className="col-span-1 text-center">Trace</div>
               </div>

               {/* Table Body */}
               <div className="overflow-y-auto flex-1 custom-scrollbar">
                  {!records || records.length === 0 ? (
                     <div className="flex flex-col items-center justify-center h-48 text-gray-500">
                        <p>No records found to display.</p>
                     </div>
                  ) : filteredRecords.length === 0 ? (
                     <div className="flex flex-col items-center justify-center h-48 text-gray-500">
                        <p>No matches found for "{searchTerm}"</p>
                     </div>
                  ) : (
                     filteredRecords.map((record, idx) => (
                        <div
                           key={record.id}
                           onClick={() => setSelectedRecord(record)}
                           className={`grid grid-cols-12 gap-4 px-6 py-3 border-b border-white/5 items-center hover:bg-emerald-500/5 cursor-pointer transition-colors group text-sm
                    ${selectedRecord?.id === record.id ? 'bg-emerald-500/10 border-l-2 border-l-emerald-400' : 'border-l-2 border-l-transparent'}
                  `}
                        >
                           <div className="col-span-3 font-medium text-white truncate flex items-center gap-2">
                              <div className={`w-2 h-2 rounded-full ${record.status === 'Verified' ? 'bg-emerald-500' : record.status === 'Flagged' ? 'bg-red-500' : 'bg-yellow-500'}`}></div>
                              {record.name}
                           </div>

                           <div className="col-span-2 text-gray-400 truncate">
                              <div className="text-xs font-mono text-emerald-400/70">{record.npi}</div>
                              <div className="text-[10px] uppercase">{record.specialty}</div>
                           </div>

                           <div className="col-span-2">
                              <span className={`px-2 py-0.5 rounded text-xs font-medium border ${getRiskColor(record.riskScore)}`}>
                                 {record.riskScore}/100
                              </span>
                           </div>

                           <div className="col-span-2 flex items-center gap-2">
                              <div className="flex-1 h-1.5 bg-gray-700 rounded-full overflow-hidden">
                                 <div
                                    className={`h-full rounded-full ${getDecayColor(record.decayProb)}`}
                                    style={{ width: `${record.decayProb * 100}%` }}
                                 />
                              </div>
                              <span className="text-xs text-gray-400">{(record.decayProb * 100).toFixed(0)}%</span>
                           </div>

                           <div className="col-span-2">
                              {record.status === 'Verified' && (
                                 <span className="flex items-center gap-1.5 text-emerald-400 text-xs">
                                    <CheckCircle2 size={14} /> Verified
                                 </span>
                              )}
                              {record.status === 'Flagged' && (
                                 <span className="flex items-center gap-1.5 text-red-400 text-xs">
                                    <AlertCircle size={14} /> Flagged
                                 </span>
                              )}
                              {record.status === 'Review' && (
                                 <span className="flex items-center gap-1.5 text-yellow-400 text-xs">
                                    <AlertTriangle size={14} /> Review
                                 </span>
                              )}
                           </div>

                           <div className="col-span-1 flex justify-center">
                              <button className="p-1.5 rounded hover:bg-white/10 text-gray-500 group-hover:text-emerald-400 transition-colors">
                                 <Eye size={16} />
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
            <div className="w-[400px] flex-shrink-0 animate-in slide-in-from-right-10 duration-300">
               <GlassCard className="h-full flex flex-col p-0 border-emerald-500/30">
                  <div className="p-5 border-b border-white/10 bg-emerald-900/20 flex justify-between items-start">
                     <div>
                        <h3 className="text-xl font-bold text-white mb-1">{selectedRecord.name}</h3>
                        <div className="flex items-center gap-2 text-xs text-gray-400">
                           <span className="font-mono">{selectedRecord.npi}</span>
                           <span>•</span>
                           <span>{selectedRecord.specialty}</span>
                        </div>
                     </div>
                     <button onClick={() => setSelectedRecord(null)} className="text-gray-400 hover:text-white transition-colors">
                        <X size={20} />
                     </button>
                  </div>

                  <div className="p-5 flex-1 overflow-y-auto">
                     {/* Summary Cards */}
                     <div className="grid grid-cols-2 gap-3 mb-6">
                        <div className="bg-white/5 rounded-lg p-3 border border-white/5">
                           <div className="text-xs text-gray-500 mb-1">Risk Assessment</div>
                           <div className={`text-xl font-bold ${selectedRecord.riskScore > 50 ? 'text-red-400' : 'text-emerald-400'}`}>
                              {selectedRecord.riskScore}<span className="text-xs text-gray-500 ml-1">/100</span>
                           </div>
                        </div>
                        <div className="bg-white/5 rounded-lg p-3 border border-white/5">
                           <div className="text-xs text-gray-500 mb-1">Decay Prob</div>
                           <div className={`text-xl font-bold ${selectedRecord.decayProb > 0.5 ? 'text-yellow-400' : 'text-emerald-400'}`}>
                              {(selectedRecord.decayProb * 100).toFixed(0)}%
                           </div>
                        </div>
                     </div>

                     {/* Conflicts Section */}
                     {selectedRecord.conflicts.length > 0 && (
                        <div className="mb-6">
                           <h4 className="text-xs font-bold text-red-300 uppercase tracking-wider mb-3 flex items-center gap-2">
                              <AlertCircle size={12} /> Identified Conflicts
                           </h4>
                           <div className="space-y-2">
                              {selectedRecord.conflicts.map((conflict, i) => (
                                 <div key={i} className="bg-red-500/10 border border-red-500/20 rounded px-3 py-2 text-sm text-red-200">
                                    {conflict}
                                 </div>
                              ))}
                           </div>
                        </div>
                     )}

                     {/* Agent Thoughts Timeline */}
                     <div>
                        <h4 className="text-xs font-bold text-emerald-300 uppercase tracking-wider mb-4 flex items-center gap-2">
                           <BrainCircuit size={12} /> Agent Reasoning Trace
                        </h4>
                        <div className="relative border-l border-white/10 ml-3 space-y-6">
                           {selectedRecord.agentThoughts.map((thought, idx) => (
                              <div key={idx} className="relative pl-6">
                                 <div className={`absolute -left-[5px] top-1 w-2.5 h-2.5 rounded-full border-2 border-black 
                                ${thought.verdict === 'pass' ? 'bg-emerald-500' : thought.verdict === 'fail' ? 'bg-red-500' : 'bg-yellow-500'}
                             `}></div>
                                 <div className="flex flex-col">
                                    <span className="text-xs font-bold text-white mb-0.5">{thought.agentName}</span>
                                    <span className="text-xs text-gray-500 mb-2">{new Date(thought.timestamp).toLocaleTimeString()}</span>
                                    <div className="bg-white/5 rounded-lg p-3 text-sm text-gray-300 border border-white/5 leading-relaxed">
                                       {thought.thought}
                                    </div>
                                 </div>
                              </div>
                           ))}
                        </div>
                     </div>
                  </div>

                  <div className="p-4 border-t border-white/10 bg-black/20">
                     <button className="w-full py-2 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2">
                        View Full Source Document <ArrowRight size={14} />
                     </button>
                  </div>
               </GlassCard>
            </div>
         )}
      </div>
   );
};

export default RecordsExplorer;
