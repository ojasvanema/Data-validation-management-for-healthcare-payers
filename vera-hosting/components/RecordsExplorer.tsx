import React, { useState, useMemo } from 'react';
import { Search, Filter, AlertTriangle, CheckCircle2, AlertCircle, Eye, ArrowRight, X, BrainCircuit, Mail, Phone, MoreHorizontal, ChevronRight, MessageSquare, ShieldCheck, Clock, Star, History, MapPin } from 'lucide-react';
import GlassCard from './GlassCard';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, ReferenceLine } from 'recharts';
import { useTheme } from './ThemeContext';
import { ProviderRecord, AgentThought } from '../types';

import { updateProviderStatus } from '../services/apiService';
import ProviderDetailView from './ProviderDetailView';

interface RecordsExplorerProps {
   records: ProviderRecord[] | undefined;
   onRefresh?: (id?: string, status?: string) => void;
}

const RecordsExplorer: React.FC<RecordsExplorerProps> = ({ records, onRefresh }) => {
   const { theme } = useTheme();
   const isDark = theme === 'dark';
   const [searchTerm, setSearchTerm] = useState('');
   const [selectedRecord, setSelectedRecord] = useState<ProviderRecord | null>(null);
   const [statusFilter, setStatusFilter] = useState<'All' | 'Flagged' | 'Verified' | 'Review' | 'Pending'>('All');

   const [pendingStatus, setPendingStatus] = useState<'Flagged' | 'Review' | 'Verified' | 'Pending' | null>(null);
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
   const handleStatusChange = (newStatus: 'Flagged' | 'Review' | 'Verified' | 'Pending') => {
      setPendingStatus(newStatus);
   };

   // Commit status change
   const handleConfirmStatusUpdate = async () => {
      if (selectedRecord && pendingStatus) {
         try {
            // Optimistic update
            const updatedRecord = { ...selectedRecord, status: pendingStatus };
            setSelectedRecord(updatedRecord);

            // Call API
            await updateProviderStatus(selectedRecord.id, pendingStatus);

            setPendingStatus(null);

            // Refresh parent data locally
            if (onRefresh) {
               onRefresh(selectedRecord.id, pendingStatus);
            }
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
         <div className={`flex flex-col transition-all duration-300 ${selectedRecord ? 'hidden lg:flex lg:w-[60%]' : 'flex-1 w-full'}`}>
            <GlassCard className="flex-1 flex flex-col p-0 overflow-hidden border-slate-200 dark:border-emerald-500/20 bg-white/50 dark:bg-[#0a0a0a]/40">
               {/* Header & Controls */}
               <div className="p-3 sm:p-4 border-b border-slate-100 dark:border-white/5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-white dark:bg-[#0a0a0a]/40">
                  <div className="flex items-center justify-between w-full sm:w-auto gap-2">
                     <div className="flex items-center gap-2">
                        <h2 className="text-lg font-bold text-slate-900 dark:text-white">Data Explorer</h2>
                        <span className="text-xs bg-slate-100 dark:bg-white/10 px-2 py-0.5 rounded text-slate-500 dark:text-gray-400">
                           {records ? records.length : 0} <span className="hidden sm:inline">Entries</span>
                        </span>
                     </div>
                  </div>

                  <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full sm:w-auto">
                     <div className="flex overflow-x-auto custom-scrollbar pb-1 sm:pb-0 bg-slate-100 dark:bg-black/30 w-full sm:w-auto rounded-lg p-1 border border-slate-200 dark:border-white/10">
                        {['All', 'Pending', 'Flagged', 'Review', 'Verified'].map((status) => (
                           <button
                              key={status}
                              onClick={() => setStatusFilter(status as any)}
                              className={`px-3 py-1 rounded text-[11px] sm:text-xs font-medium whitespace-nowrap transition-all ${statusFilter === status ? 'bg-white dark:bg-white/10 text-slate-900 dark:text-white shadow-sm dark:shadow-none' : 'text-slate-500 dark:text-gray-500 hover:text-slate-700 dark:hover:text-gray-300'}`}
                           >
                              {status}
                           </button>
                        ))}
                     </div>
                     <div className="relative shrink-0">
                        <Search size={16} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 dark:text-gray-400" />
                        <input
                           type="text"
                           placeholder="Search name, NPI..."
                           value={searchTerm}
                           onChange={(e) => setSearchTerm(e.target.value)}
                           className="bg-slate-50 dark:bg-black/30 border border-slate-200 dark:border-white/10 rounded-lg pl-9 pr-4 py-1.5 text-sm w-full sm:w-56 text-slate-900 dark:text-white focus:outline-none focus:border-emerald-500/50 transition-colors"
                        />
                     </div>
                  </div>
               </div>

               {/* Table Header */}
               <div className="hidden sm:grid grid-cols-12 gap-4 px-6 py-3 border-b border-slate-100 dark:border-white/5 bg-slate-50 dark:bg-white/[0.02] text-xs font-semibold text-slate-500 dark:text-gray-400 uppercase tracking-wider">
                  <div className="col-span-5 lg:col-span-4">Provider Name</div>
                  <div className="col-span-4 lg:col-span-3">NPI / Specialty</div>
                  <div className="col-span-3 lg:col-span-2">Risk Score</div>
                  <div className="hidden lg:block col-span-2">Status</div>
                  <div className="hidden lg:block col-span-1 text-center">Action</div>
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
                           className={`flex flex-col sm:grid sm:grid-cols-12 gap-3 sm:gap-4 px-4 sm:px-6 py-4 sm:py-3 border-b border-slate-100 dark:border-white/5 sm:items-center hover:bg-slate-50 dark:hover:bg-emerald-500/5 cursor-pointer transition-colors group text-sm
                    ${selectedRecord?.id === record.id ? 'bg-emerald-50 dark:bg-emerald-500/10 border-l-2 border-l-emerald-500 dark:border-l-emerald-400' : 'border-l-2 border-l-transparent'}
                  `}
                        >
                           <div className="sm:col-span-5 lg:col-span-4 font-medium text-slate-900 dark:text-white truncate flex items-center justify-between sm:justify-start gap-3 w-full">
                              <div className="flex items-center gap-3 truncate">
                                 <div className={`w-2 h-2 rounded-full shrink-0 ${record.status === 'Verified' ? 'bg-emerald-500' : record.status === 'Flagged' ? 'bg-red-500' : record.status === 'Review' ? 'bg-yellow-500' : 'bg-blue-500'}`}></div>
                                 <span className="truncate">{record.name}</span>
                              </div>
                              {/* Mobile Status Badge */}
                              <div className="sm:hidden shrink-0">
                                 {record.status === 'Verified' && (
                                    <span className="flex items-center gap-1 text-emerald-700 dark:text-emerald-400 text-[10px] bg-emerald-50 dark:bg-emerald-500/10 px-1.5 py-0.5 rounded">
                                       <CheckCircle2 size={10} /> Verified
                                    </span>
                                 )}
                                 {record.status === 'Flagged' && (
                                    <span className="flex items-center gap-1 text-red-700 dark:text-red-400 text-[10px] bg-red-50 dark:bg-red-500/10 px-1.5 py-0.5 rounded">
                                       <AlertCircle size={10} /> Flagged
                                    </span>
                                 )}
                                 {record.status === 'Review' && (
                                    <span className="flex items-center gap-1 text-yellow-700 dark:text-yellow-400 text-[10px] bg-yellow-50 dark:bg-yellow-500/10 px-1.5 py-0.5 rounded">
                                       <AlertTriangle size={10} /> Review
                                    </span>
                                 )}
                                 {record.status === 'Pending' && (
                                    <span className="flex items-center gap-1 text-blue-700 dark:text-blue-400 text-[10px] bg-blue-50 dark:bg-blue-500/10 px-1.5 py-0.5 rounded">
                                       <Clock size={10} /> Pending
                                    </span>
                                 )}
                              </div>
                           </div>

                           <div className="flex sm:contents flex-wrap items-center gap-3">
                              <div className="sm:col-span-4 lg:col-span-3 text-slate-500 dark:text-gray-400 truncate flex sm:block items-center justify-between sm:justify-start w-full sm:w-auto mt-1 sm:mt-0">
                                 <div className="text-xs font-mono text-slate-600 dark:text-emerald-400/70">{record.npi}</div>
                                 <div className="text-[10px] sm:mt-0 uppercase text-slate-400 dark:text-gray-500">{record.specialty}</div>
                              </div>

                              <div className="sm:col-span-3 lg:col-span-2">
                                 <span className={`px-2 py-0.5 rounded text-[11px] sm:text-xs font-medium border ${getRiskColor(record.riskScore)}`}>
                                    Risk: {record.riskScore}/100
                                 </span>
                              </div>
                           </div>

                           <div className="hidden lg:flex col-span-2">
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
                              {record.status === 'Pending' && (
                                 <span className="flex items-center gap-1.5 text-blue-700 dark:text-blue-400 text-xs bg-blue-50 dark:bg-blue-500/10 px-2 py-1 rounded w-fit">
                                    <Clock size={12} /> Pending
                                 </span>
                              )}
                           </div>

                           <div className="hidden lg:flex col-span-1 justify-center">
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

         {/* Detail View Slide-over */}
         {selectedRecord && (
            <div className={`
               fixed inset-0 z-50 lg:relative lg:z-auto lg:w-[40%] flex flex-col h-full overflow-hidden 
               animate-in slide-in-from-right-8 lg:slide-in-from-right-4 duration-300 shadow-2xl lg:shadow-xl 
               lg:rounded-2xl border-l lg:border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-[#050505]
            `}>
               <ProviderDetailView
                  selectedRecord={selectedRecord}
                  onClose={() => setSelectedRecord(null)}
                  pendingStatus={pendingStatus}
                  handleStatusChange={handleStatusChange}
                  handleConfirmStatusUpdate={handleConfirmStatusUpdate}
                  showCallDropdown={showCallDropdown}
                  setShowCallDropdown={setShowCallDropdown}
                  isActionsCollapsed={isActionsCollapsed}
                  setIsActionsCollapsed={setIsActionsCollapsed}
               />
            </div>
         )}
      </div>
   );
};

export default RecordsExplorer;
