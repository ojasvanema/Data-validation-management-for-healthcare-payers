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
   onRefresh?: () => void;
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

            // Refresh parent data
            if (onRefresh) {
               onRefresh();
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
                        {['All', 'Pending', 'Flagged', 'Review', 'Verified'].map((status) => (
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
                              <div className={`w-2 h-2 rounded-full shrink-0 ${record.status === 'Verified' ? 'bg-emerald-500' : record.status === 'Flagged' ? 'bg-red-500' : record.status === 'Review' ? 'bg-yellow-500' : 'bg-blue-500'}`}></div>
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
                              {record.status === 'Pending' && (
                                 <span className="flex items-center gap-1.5 text-blue-700 dark:text-blue-400 text-xs bg-blue-50 dark:bg-blue-500/10 px-2 py-1 rounded w-fit">
                                    <Clock size={12} /> Pending
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

         {/* Detail View Slide-over */}
         {selectedRecord && (
            <div className="w-[40%] flex flex-col h-full overflow-hidden animate-in slide-in-from-right-8 duration-300 rounded-2xl shadow-xl border border-slate-200 dark:border-white/10">
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
