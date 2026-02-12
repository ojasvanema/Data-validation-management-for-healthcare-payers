import React, { useState } from 'react';
import { Database, FileText, Calendar, Filter, PlayCircle, Settings, X, Plus } from 'lucide-react';
import GlassCard from './GlassCard';
import { FileUpload } from '../types';

interface UploadSectionProps {
  onFilesSelected: (files: FileUpload[]) => void;
  onLoadDemoData?: () => void;
  isProcessing: boolean;
  compact?: boolean;
}

const UploadSection: React.FC<UploadSectionProps> = ({ onFilesSelected, onLoadDemoData, isProcessing, compact = false }) => {
  const [showFetchModal, setShowFetchModal] = useState(false);
  const [fetchType, setFetchType] = useState<'recent' | 'flagged' | 'all'>('recent');

  const handleFetchClick = () => {
    setShowFetchModal(true);
  };

  const handleConfirmFetch = () => {
    setShowFetchModal(false);
    if (onLoadDemoData) {
      onLoadDemoData();
    }
  };

  if (compact) {
    return (
      <GlassCard className="p-4 flex flex-col gap-3">
        <div className="flex items-center gap-2 mb-2">
          <Database className="text-emerald-600 dark:text-emerald-400" size={18} />
          <h3 className="font-bold text-slate-900 dark:text-white text-sm">Active Data Source</h3>
        </div>

        <div className="bg-slate-50 border border-slate-200 dark:bg-white/5 dark:border-white/10 rounded-lg p-3 flex items-center justify-between">
          <div>
            <div className="text-xs text-slate-500 dark:text-gray-400">Source</div>
            <div className="text-sm font-medium text-slate-900 dark:text-white">Claims Database (Live)</div>
          </div>
          <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
        </div>

        <div className="grid grid-cols-2 gap-2 mt-1">
          <div className="bg-slate-50 border border-slate-200 dark:bg-white/5 dark:border-white/10 rounded-lg p-2">
            <div className="text-[10px] text-slate-500 dark:text-gray-400">Records</div>
            <div className="text-lg font-bold text-slate-900 dark:text-white">1,240</div>
          </div>
          <div className="bg-slate-50 border border-slate-200 dark:bg-white/5 dark:border-white/10 rounded-lg p-2">
            <div className="text-[10px] text-slate-500 dark:text-gray-400">Batch ID</div>
            <div className="text-lg font-bold text-slate-900 dark:text-white">#8829</div>
          </div>
        </div>
      </GlassCard>
    )
  }

  return (
    <GlassCard className="p-8 h-full flex flex-col relative overflow-hidden">
      {/* Configuration Modal for Fetch */}
      {showFetchModal && (
        <div className="absolute inset-0 z-50 bg-white/80 dark:bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
          <GlassCard className="w-full max-w-md p-6 shadow-2xl bg-white dark:bg-[#0a0a0a] border-slate-200 dark:border-emerald-500/30">
            <div className="flex justify-between items-center mb-6 border-b border-slate-100 dark:border-white/10 pb-4">
              <h3 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Settings className="text-emerald-600 dark:text-emerald-400" size={20} />
                Configure Data Fetch
              </h3>
              <button onClick={() => setShowFetchModal(false)} className="text-slate-400 hover:text-slate-600 dark:text-gray-400 dark:hover:text-white transition-colors">
                <X size={20} />
              </button>
            </div>

            <div className="space-y-4 mb-8">
              <div className="space-y-2">
                <label className="text-sm text-slate-500 dark:text-gray-400">Time Range</label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-gray-500" size={16} />
                  <select className="w-full bg-slate-50 dark:bg-black/40 border border-slate-200 dark:border-white/10 rounded-lg py-2.5 pl-10 pr-4 text-slate-700 dark:text-white text-sm focus:outline-none focus:border-emerald-500/50 appearance-none">
                    <option>Last 24 Hours</option>
                    <option>Last 7 Days</option>
                    <option>Last 30 Days</option>
                    <option>Custom Range</option>
                  </select>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm text-slate-500 dark:text-gray-400">Record Filters</label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    onClick={() => setFetchType('recent')}
                    className={`px-3 py-2 rounded-lg border text-sm transition-all ${fetchType === 'recent' ? 'bg-emerald-50 border-emerald-500 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400' : 'bg-slate-50 border-slate-200 text-slate-500 hover:border-slate-300 dark:bg-white/5 dark:border-white/10 dark:text-gray-400 dark:hover:border-white/20'}`}
                  >
                    Recent Updates
                  </button>
                  <button
                    onClick={() => setFetchType('flagged')}
                    className={`px-3 py-2 rounded-lg border text-sm transition-all ${fetchType === 'flagged' ? 'bg-emerald-50 border-emerald-500 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400' : 'bg-slate-50 border-slate-200 text-slate-500 hover:border-slate-300 dark:bg-white/5 dark:border-white/10 dark:text-gray-400 dark:hover:border-white/20'}`}
                  >
                    Flagged Only
                  </button>
                  <button
                    onClick={() => setFetchType('all')}
                    className={`px-3 py-2 rounded-lg border text-sm transition-all ${fetchType === 'all' ? 'bg-emerald-50 border-emerald-500 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400' : 'bg-slate-50 border-slate-200 text-slate-500 hover:border-slate-300 dark:bg-white/5 dark:border-white/10 dark:text-gray-400 dark:hover:border-white/20'}`}
                  >
                    All Pending
                  </button>
                </div>
              </div>
            </div>

            <button
              onClick={handleConfirmFetch}
              className="w-full py-3 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold rounded-xl shadow-lg shadow-emerald-500/20 dark:shadow-emerald-900/40 transition-all transform active:scale-[0.98] flex items-center justify-center gap-2"
            >
              <Database size={18} />
              Fetch & Analyze Records
            </button>
          </GlassCard>
        </div>
      )}

      <div className="mb-8 pl-2 border-l-4 border-emerald-500">
        <h2 className="font-bold text-3xl text-slate-900 dark:text-white mb-2">
          Data Ingestion
        </h2>
        <p className="text-slate-500 dark:text-gray-400 text-sm max-w-md">
          Select new provider data to ingest into the validation ecosystem. You can manually enter details or fetch recent claims from the connected database.
        </p>
      </div>

      <div className="flex flex-col gap-4 flex-1">
        {/* Manual Entry Card */}
        <div className="group relative bg-slate-50 border border-slate-200 dark:bg-[#0a0a0a]/40 dark:border-white/10 hover:border-emerald-500/30 rounded-2xl p-5 transition-all duration-300 hover:bg-white dark:hover:bg-[#0a0a0a]/60 cursor-pointer flex flex-col justify-between overflow-hidden shadow-sm hover:shadow-md dark:shadow-none min-h-[160px]">
          <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:opacity-20 transition-opacity">
            <FileText size={80} className="text-slate-900 dark:text-white" />
          </div>

          <div className="flex items-start gap-4">
            <div className="w-10 h-10 rounded-full bg-blue-50 border border-blue-100 dark:bg-blue-500/10 dark:border-blue-500/20 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform duration-300">
              <Plus className="text-blue-500 dark:text-blue-400" size={20} />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-1 group-hover:text-blue-600 dark:group-hover:text-blue-300 transition-colors">Manual Entry</h3>
              <p className="text-xs text-slate-500 dark:text-gray-500 leading-relaxed max-w-[90%]">
                Input individual provider details directly for ad-hoc validation.
              </p>
            </div>
          </div>

          <button className="mt-4 w-full py-2 rounded-lg border border-slate-200 bg-white dark:border-white/10 dark:bg-white/5 text-slate-600 dark:text-gray-300 font-medium hover:bg-blue-50 hover:text-blue-600 hover:border-blue-200 dark:hover:bg-blue-500/20 dark:hover:text-blue-300 dark:hover:border-blue-500/30 transition-all text-xs flex items-center justify-center gap-2">
            Open Form <span className="opacity-0 group-hover:opacity-100 transition-opacity">→</span>
          </button>
        </div>

        {/* Fetch Data Card */}
        <div
          onClick={handleFetchClick}
          className="group relative bg-slate-50 border border-emerald-200 dark:bg-[#0a0a0a]/40 dark:border-emerald-500/20 hover:border-emerald-500/50 rounded-2xl p-5 transition-all duration-300 hover:bg-white dark:hover:bg-[#0a0a0a]/60 cursor-pointer flex flex-col justify-between overflow-hidden shadow-sm hover:shadow-md dark:shadow-none min-h-[160px]"
        >
          <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:opacity-20 transition-opacity">
            <Database size={80} className="text-emerald-500" />
          </div>

          <div className="flex items-start gap-4">
            <div className="w-10 h-10 rounded-full bg-emerald-50 border border-emerald-100 dark:bg-emerald-500/10 dark:border-emerald-500/20 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform duration-300">
              <PlayCircle className="text-emerald-500 dark:text-emerald-400" size={20} />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-1 group-hover:text-emerald-600 dark:group-hover:text-emerald-300 transition-colors">Fetch Connection</h3>
              <p className="text-xs text-slate-500 dark:text-gray-500 leading-relaxed max-w-[90%]">
                Connect to the Claims DB to retrieve the latest batch.
              </p>
            </div>
          </div>

          <button className="mt-4 w-full py-2 rounded-lg bg-emerald-50 text-emerald-600 border border-emerald-100 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/20 group-hover:bg-emerald-100 group-hover:border-emerald-200 dark:group-hover:bg-emerald-500/20 dark:group-hover:border-emerald-500/40 transition-all text-xs flex items-center justify-center gap-2">
            Configure Fetch <span className="opacity-0 group-hover:opacity-100 transition-opacity">→</span>
          </button>
        </div>
      </div>

      <div className="mt-6 pt-6 border-t border-slate-100 dark:border-white/5 flex justify-between items-center">
        <div className="flex items-center gap-2 text-xs text-slate-400 dark:text-gray-500">
          <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
          System Online
        </div>
        <div className="text-xs text-slate-500 dark:text-gray-600">
          Database v2.4.1 Connected
        </div>
      </div>
    </GlassCard>
  );
};

export default UploadSection;