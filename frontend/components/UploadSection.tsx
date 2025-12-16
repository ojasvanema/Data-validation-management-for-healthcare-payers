import React, { useCallback, useState } from 'react';
import { UploadCloud, File as FileIcon, X } from 'lucide-react';
import GlassCard from './GlassCard';
import { FileUpload } from '../types';

interface UploadSectionProps {
  onFilesSelected: (files: FileUpload[]) => void;
  onLoadDemoData?: () => void;
  isProcessing: boolean;
  compact?: boolean;
}

const UploadSection: React.FC<UploadSectionProps> = ({ onFilesSelected, onLoadDemoData, isProcessing, compact = false }) => {
  const [dragActive, setDragActive] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<FileUpload[]>([]);

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const newFiles = Array.from(e.dataTransfer.files).map((f: File) => ({
        name: f.name,
        type: f.type,
        size: f.size,
        file: f
      }));
      setSelectedFiles(prev => [...prev, ...newFiles]);
    }
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();
    if (e.target.files && e.target.files.length > 0) {
      const newFiles = Array.from(e.target.files).map((f: File) => ({
        name: f.name,
        type: f.type,
        size: f.size,
        file: f
      }));
      setSelectedFiles(prev => [...prev, ...newFiles]);
    }
  };

  const removeFile = (index: number) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleProcess = () => {
    if (selectedFiles.length > 0) {
      onFilesSelected(selectedFiles);
    }
  };

  return (
    <GlassCard className={`flex flex-col ${compact ? 'p-4 h-auto' : 'p-10 h-full justify-center'}`}>
      <div className={compact ? 'mb-2' : 'mb-6 text-center'}>
        <h2 className={`font-bold bg-clip-text text-transparent bg-gradient-to-r from-emerald-300 to-teal-300 ${compact ? 'text-lg' : 'text-3xl mb-2'}`}>
          Data Ingestion
        </h2>
        {!compact && (
          <p className="text-gray-400">
            Upload CSV records or documents for AI validation.
          </p>
        )}
      </div>

      <div
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        className={`
          border-2 border-dashed rounded-xl p-8 transition-all duration-300 flex flex-col items-center justify-center cursor-pointer group
          ${dragActive
            ? 'border-emerald-500 bg-emerald-500/10 scale-[1.02]'
            : compact
              ? 'border-white/10 bg-white/[0.02] hover:bg-white/[0.04] hover:border-emerald-500/30'
              : 'border-white/10 bg-white/[0.02] hover:bg-white/[0.04] hover:border-emerald-500/30 h-64'
          }
          ${isProcessing ? 'opacity-50 pointer-events-none' : ''}
        `}
      >
        <UploadCloud size={compact ? 32 : 56} className="text-emerald-400 mb-4" />
        <p className={`${compact ? 'text-sm' : 'text-xl'} font-medium text-center text-gray-200`}>
          {compact ? 'Drag files here' : 'Drag & drop files here'}
        </p>
        <p className="text-sm text-gray-500 mb-4 text-center">or</p>
        <label className="bg-emerald-600 hover:bg-emerald-500 text-white px-6 py-2 rounded-full cursor-pointer transition-colors shadow-lg shadow-emerald-900/50">
          Browse Files
          <input
            type="file"
            className="hidden"
            multiple
            onChange={handleChange}
            accept=".csv,.pdf,.jpg,.png,.xlsx"
          />
        </label>

        {onLoadDemoData && (
          <div className="mt-4 flex flex-col items-center w-full">
            <div className="flex items-center gap-2 w-full mb-2">
              <div className="h-px bg-white/10 flex-1"></div>
              <span className="text-xs text-gray-500 uppercase">Demo</span>
              <div className="h-px bg-white/10 flex-1"></div>
            </div>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onLoadDemoData();
              }}
              className="text-sm text-purple-400 hover:text-purple-300 hover:underline transition-colors"
            >
              Load 100 Dummy Records
            </button>
          </div>
        )}
      </div>

      {selectedFiles.length > 0 && (
        <div className="mt-4 flex flex-col gap-2 max-h-48 overflow-y-auto">
          {selectedFiles.map((file, idx) => (
            <div key={idx} className="flex items-center justify-between bg-white/5 p-3 rounded-lg border border-white/5">
              <div className="flex items-center gap-3">
                <FileIcon size={20} className="text-emerald-300" />
                <span className="text-sm truncate max-w-[200px] text-gray-300">{file.name}</span>
              </div>
              {!isProcessing && (
                <button onClick={() => removeFile(idx)} className="text-red-400 hover:text-red-300">
                  <X size={18} />
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      <button
        onClick={handleProcess}
        disabled={selectedFiles.length === 0 || isProcessing}
        className={`
          mt-6 w-full rounded-xl font-bold tracking-wide shadow-lg transition-all
          ${compact ? 'py-2 text-sm' : 'py-4 text-lg'}
          ${selectedFiles.length > 0 && !isProcessing
            ? 'bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-white shadow-emerald-900/50'
            : 'bg-white/5 text-gray-500 cursor-not-allowed'}
        `}
      >
        {isProcessing ? 'Orchestrating Agents...' : 'Start Orchestration'}
      </button>
    </GlassCard>
  );
};

export default UploadSection;