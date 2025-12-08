import React, { useCallback, useState } from 'react';
import { UploadCloud, File as FileIcon, X } from 'lucide-react';
import GlassCard from './GlassCard';
import { FileUpload } from '../types';

interface UploadSectionProps {
  onFilesSelected: (files: FileUpload[]) => void;
  isProcessing: boolean;
  compact?: boolean;
}

const UploadSection: React.FC<UploadSectionProps> = ({ onFilesSelected, isProcessing, compact = false }) => {
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
        size: f.size
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
        size: f.size
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
        className={`
          flex-grow border-2 border-dashed rounded-xl flex flex-col items-center justify-center transition-all duration-300
          ${dragActive ? 'border-emerald-400 bg-emerald-900/20' : 'border-white/10 hover:border-white/20 hover:bg-white/5'}
          ${isProcessing ? 'opacity-50 pointer-events-none' : ''}
          ${compact ? 'p-4 min-h-[120px]' : 'p-12 min-h-[250px]'}
        `}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
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

      <div className="mt-4 flex justify-center">
        <button
          onClick={(e) => {
            e.preventDefault();
            const syntheticContent = `NPI,FirstName,LastName,Organization,Taxonomy,LicenseState,LicenseNumber,OIG_Exclusion
1234567890,John,Doe,,Cardiology,NY,123456,False
9876543210,Jane,Smith,,Dermatology,CA,654321,False
1122334455,Robert,Malone,Malone Medical Group,General Practice,TX,998877,True
5566778899,,,"Urgent Care Plus",Internal Medicine,FL,554433,False
6677889900,Alice,Wonderland,,Psychiatry,WA,112233,False
3344556677,Bad,Actor,Fraud Corp,Surgery,NV,000000,True`;

            const newFile = {
              name: "synthetic_providers.csv",
              type: "text/csv",
              size: syntheticContent.length,
              content: syntheticContent
            };
            // @ts-ignore
            setSelectedFiles(prev => [...prev, newFile]);
          }}
          className="text-emerald-400 text-sm hover:underline"
          disabled={isProcessing}
        >
          Load Synthetic Data (Demo)
        </button>
      </div>
    </GlassCard>
  );
};

export default UploadSection;