import React, { useState, useRef } from 'react';
import { Database, FileText, Calendar, Filter, PlayCircle, Settings, X, Plus, Upload, Camera, FileSpreadsheet, CheckCircle, AlertCircle, Loader2, ShieldAlert } from 'lucide-react';
import GlassCard from './GlassCard';
import { FileUpload } from '../types';

interface UploadSectionProps {
  onFilesSelected: (files: FileUpload[]) => void;
  onLoadHistoricalData?: (runEfficiently: boolean) => void;
  onCSVUpload?: (file: File) => void;
  onOCRUpload?: (file: File) => void;
  isProcessing: boolean;
  compact?: boolean;
  totalRecords?: number;
}

interface OCRResult {
  raw_text: string;
  extracted_fields: {
    npi: string;
    first_name: string;
    last_name: string;
    credential: string;
    specialty: string;
    phone: string;
    address: string;
    city: string;
    state: string;
    zip: string;
    email: string;
    extraction_confidence: string;
    fields_found: number;
  };
}

const UploadSection: React.FC<UploadSectionProps> = ({ onFilesSelected, onLoadHistoricalData, onCSVUpload, onOCRUpload, isProcessing, compact = false, totalRecords }) => {
  const [showFetchModal, setShowFetchModal] = useState(false);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [fetchType, setFetchType] = useState<'recent' | 'flagged' | 'all'>('recent');
  const [runEfficiently, setRunEfficiently] = useState(true);
  const [uploadTab, setUploadTab] = useState<'csv' | 'ocr'>('csv');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [ocrResult, setOcrResult] = useState<OCRResult | null>(null);
  const [ocrLoading, setOcrLoading] = useState(false);
  const [complaintStatus, setComplaintStatus] = useState<{ loaded: boolean; total: number; filename: string } | null>(null);
  const [complaintUploading, setComplaintUploading] = useState(false);
  const complaintInputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);

  const handleFetchClick = () => {
    setShowFetchModal(true);
  };

  const handleConfirmFetch = () => {
    setShowFetchModal(false);
    // Passing the flag indicating whether to run efficiently
    if (onLoadHistoricalData) {
      onLoadHistoricalData(runEfficiently);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) {
      setSelectedFile(file);
      setOcrResult(null);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      setOcrResult(null);
    }
  };

  const handleCSVSubmit = () => {
    if (selectedFile && onCSVUpload) {
      onCSVUpload(selectedFile);
      setShowUploadModal(false);
      setSelectedFile(null);
    }
  };

  const handleOCRSubmit = async () => {
    if (!selectedFile) return;

    setOcrLoading(true);
    try {
      const formData = new FormData();
      formData.append('file', selectedFile);

      const response = await fetch('/upload-ocr', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.detail || 'OCR failed');
      }

      const data = await response.json();
      setOcrResult(data);
    } catch (error) {
      console.error('OCR error:', error);
      setOcrResult({
        raw_text: `Error: ${error instanceof Error ? error.message : 'OCR processing failed'}`,
        extracted_fields: {
          npi: '', first_name: '', last_name: '', credential: '',
          specialty: '', phone: '', address: '', city: '', state: '',
          zip: '', email: '', extraction_confidence: 'error', fields_found: 0,
        },
      });
    } finally {
      setOcrLoading(false);
    }
  };

  const getAcceptedTypes = () => {
    if (uploadTab === 'csv') return '.csv';
    return '.jpg,.jpeg,.png,.bmp,.tiff,.tif,.webp,.pdf';
  };

  const resetUploadModal = () => {
    setShowUploadModal(false);
    setSelectedFile(null);
    setOcrResult(null);
    setUploadTab('csv');
  };

  const handleComplaintUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setComplaintUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      const resp = await fetch('/upload-complaints', { method: 'POST', body: formData });
      if (!resp.ok) {
        const err = await resp.json();
        throw new Error(err.detail || 'Upload failed');
      }
      const data = await resp.json();
      setComplaintStatus({ loaded: true, total: data.total_complaints, filename: file.name });
    } catch (error) {
      console.error('Complaint upload failed:', error);
      setComplaintStatus(null);
    } finally {
      setComplaintUploading(false);
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
            <div className="text-lg font-bold text-slate-900 dark:text-white">{totalRecords != null ? totalRecords.toLocaleString() : '0'}</div>
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
                Load Historical Data
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

              <div className="pt-2">
                <label className="flex items-center space-x-3 cursor-pointer group">
                  <div className="relative flex items-center justify-center">
                    <input
                      type="checkbox"
                      className="peer sr-only"
                      checked={runEfficiently}
                      onChange={(e) => setRunEfficiently(e.target.checked)}
                    />
                    <div className="w-5 h-5 border-2 border-slate-300 dark:border-slate-600 rounded bg-white dark:bg-slate-800 peer-checked:bg-emerald-500 peer-checked:border-emerald-500 transition-colors"></div>
                    <svg className="absolute w-3 h-3 text-white pointer-events-none opacity-0 peer-checked:opacity-100 transition-opacity" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <div className="flex flex-col justify-center">
                    <span className="text-sm font-medium text-slate-700 dark:text-slate-300 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">Run Agents Efficiently</span>
                  </div>
                </label>
              </div>
            </div>

            <button
              onClick={handleConfirmFetch}
              className="w-full py-3 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold rounded-xl shadow-lg shadow-emerald-500/20 dark:shadow-emerald-900/40 transition-all transform active:scale-[0.98] flex items-center justify-center gap-2"
            >
              <Database size={18} />
              Load Historical Batch
            </button>
          </GlassCard>
        </div>
      )}

      {/* Upload Modal */}
      {showUploadModal && (
        <div className="absolute inset-0 z-50 bg-white/80 dark:bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
          <GlassCard className="w-full max-w-lg p-6 shadow-2xl bg-white dark:bg-[#0a0a0a] border-slate-200 dark:border-blue-500/30">
            <div className="flex justify-between items-center mb-5 border-b border-slate-100 dark:border-white/10 pb-4">
              <h3 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Upload className="text-blue-500 dark:text-blue-400" size={20} />
                Manual Upload
              </h3>
              <button onClick={resetUploadModal} className="text-slate-400 hover:text-slate-600 dark:text-gray-400 dark:hover:text-white transition-colors">
                <X size={20} />
              </button>
            </div>

            {/* Tab Selector */}
            <div className="flex gap-1 p-1 bg-slate-100 dark:bg-white/5 rounded-xl mb-5">
              <button
                onClick={() => { setUploadTab('csv'); setSelectedFile(null); setOcrResult(null); }}
                className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-semibold transition-all ${uploadTab === 'csv'
                  ? 'bg-white dark:bg-white/10 text-blue-600 dark:text-blue-400 shadow-sm'
                  : 'text-slate-500 dark:text-gray-500 hover:text-slate-700 dark:hover:text-gray-300'
                  }`}
              >
                <FileSpreadsheet size={16} />
                CSV Upload
              </button>
              <button
                onClick={() => { setUploadTab('ocr'); setSelectedFile(null); setOcrResult(null); }}
                className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-semibold transition-all ${uploadTab === 'ocr'
                  ? 'bg-white dark:bg-white/10 text-purple-600 dark:text-purple-400 shadow-sm'
                  : 'text-slate-500 dark:text-gray-500 hover:text-slate-700 dark:hover:text-gray-300'
                  }`}
              >
                <Camera size={16} />
                Document Scan
              </button>
            </div>

            {/* Drop Zone */}
            <div
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-all duration-200 ${isDragging
                ? 'border-blue-500 bg-blue-50 dark:bg-blue-500/10'
                : selectedFile
                  ? 'border-emerald-400 bg-emerald-50/50 dark:bg-emerald-500/5 dark:border-emerald-500/30'
                  : 'border-slate-200 dark:border-white/10 hover:border-blue-300 dark:hover:border-blue-500/30 hover:bg-slate-50 dark:hover:bg-white/5'
                }`}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept={getAcceptedTypes()}
                onChange={handleFileSelect}
                className="hidden"
              />
              {selectedFile ? (
                <div className="flex flex-col items-center gap-2">
                  <div className="w-12 h-12 rounded-full bg-emerald-100 dark:bg-emerald-500/20 flex items-center justify-center">
                    <CheckCircle className="text-emerald-600 dark:text-emerald-400" size={24} />
                  </div>
                  <div className="text-sm font-semibold text-slate-900 dark:text-white">{selectedFile.name}</div>
                  <div className="text-[11px] text-slate-500 dark:text-gray-500">
                    {(selectedFile.size / 1024).toFixed(1)} KB · Click to change
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-2">
                  <div className="w-12 h-12 rounded-full bg-slate-100 dark:bg-white/5 flex items-center justify-center">
                    {uploadTab === 'csv' ? (
                      <FileSpreadsheet className="text-blue-500" size={24} />
                    ) : (
                      <Camera className="text-purple-500" size={24} />
                    )}
                  </div>
                  <div className="text-sm text-slate-600 dark:text-gray-300">
                    {uploadTab === 'csv' ? 'Drop a CSV file here' : 'Drop an image or PDF here'}
                  </div>
                  <div className="text-[11px] text-slate-400 dark:text-gray-600">
                    {uploadTab === 'csv' ? 'Accepts .csv files' : 'Accepts .jpg, .png, .pdf, .tiff, .bmp'}
                  </div>
                </div>
              )}
            </div>

            {/* OCR Results */}
            {uploadTab === 'ocr' && ocrResult && (
              <div className="mt-4 space-y-3">
                <div className="flex items-center gap-2">
                  <span className={`text-xs font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full ${ocrResult.extracted_fields.extraction_confidence === 'high'
                    ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400'
                    : ocrResult.extracted_fields.extraction_confidence === 'medium'
                      ? 'bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-400'
                      : 'bg-red-100 text-red-700 dark:bg-red-500/20 dark:text-red-400'
                    }`}>
                    {ocrResult.extracted_fields.extraction_confidence} confidence
                  </span>
                  <span className="text-[11px] text-slate-500 dark:text-gray-500">
                    {ocrResult.extracted_fields.fields_found} fields extracted
                  </span>
                </div>

                <div className="bg-slate-50 dark:bg-white/5 rounded-lg p-3 border border-slate-100 dark:border-white/5 max-h-[180px] overflow-y-auto custom-scrollbar">
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    {[
                      { label: 'NPI', value: ocrResult.extracted_fields.npi },
                      { label: 'First Name', value: ocrResult.extracted_fields.first_name },
                      { label: 'Last Name', value: ocrResult.extracted_fields.last_name },
                      { label: 'Credential', value: ocrResult.extracted_fields.credential },
                      { label: 'Specialty', value: ocrResult.extracted_fields.specialty },
                      { label: 'Phone', value: ocrResult.extracted_fields.phone },
                      { label: 'Address', value: ocrResult.extracted_fields.address },
                      { label: 'State', value: ocrResult.extracted_fields.state },
                      { label: 'ZIP', value: ocrResult.extracted_fields.zip },
                      { label: 'Email', value: ocrResult.extracted_fields.email },
                    ].filter(f => f.value).map((f, i) => (
                      <div key={i} className="flex flex-col">
                        <span className="text-[10px] text-slate-400 dark:text-gray-600 uppercase tracking-wider">{f.label}</span>
                        <span className="text-slate-900 dark:text-white font-medium truncate">{f.value}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Raw Text Toggle */}
                <details className="text-xs">
                  <summary className="cursor-pointer text-slate-500 dark:text-gray-500 hover:text-blue-500 transition-colors">
                    View raw OCR text
                  </summary>
                  <pre className="mt-2 bg-slate-100 dark:bg-black/40 rounded-lg p-3 text-[11px] text-slate-600 dark:text-gray-400 max-h-[120px] overflow-y-auto whitespace-pre-wrap font-mono custom-scrollbar">
                    {ocrResult.raw_text}
                  </pre>
                </details>
              </div>
            )}

            {/* Action Button */}
            <div className="mt-5">
              {uploadTab === 'csv' ? (
                <button
                  onClick={handleCSVSubmit}
                  disabled={!selectedFile || isProcessing}
                  className="w-full py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 disabled:from-slate-300 disabled:to-slate-400 dark:disabled:from-slate-700 dark:disabled:to-slate-800 text-white font-bold rounded-xl shadow-lg shadow-blue-500/20 dark:shadow-blue-900/40 transition-all transform active:scale-[0.98] disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {isProcessing ? (
                    <><Loader2 size={18} className="animate-spin" /> Processing...</>
                  ) : (
                    <><Upload size={18} /> Upload & Validate</>
                  )}
                </button>
              ) : (
                <button
                  onClick={handleOCRSubmit}
                  disabled={!selectedFile || ocrLoading}
                  className="w-full py-3 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 disabled:from-slate-300 disabled:to-slate-400 dark:disabled:from-slate-700 dark:disabled:to-slate-800 text-white font-bold rounded-xl shadow-lg shadow-purple-500/20 dark:shadow-purple-900/40 transition-all transform active:scale-[0.98] disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {ocrLoading ? (
                    <><Loader2 size={18} className="animate-spin" /> Scanning...</>
                  ) : ocrResult ? (
                    <><Camera size={18} /> Scan Another</>
                  ) : (
                    <><Camera size={18} /> Extract Data</>
                  )}
                </button>
              )}
            </div>
          </GlassCard>
        </div>
      )}

      <div className="mb-8 pl-2 border-l-4 border-emerald-500">
        <h2 className="font-bold text-3xl text-slate-900 dark:text-white mb-2">
          Data Ingestion
        </h2>
        <p className="text-slate-500 dark:text-gray-400 text-sm max-w-md">
          Select new provider data to ingest into the validation ecosystem. You can upload files manually or fetch recent claims from the connected database.
        </p>
      </div>

      {/* Member Complaints Upload Banner */}
      <div className="mb-4">
        <input
          ref={complaintInputRef}
          type="file"
          accept=".csv"
          onChange={handleComplaintUpload}
          className="hidden"
        />
        <div
          onClick={() => { if (!complaintStatus?.loaded) complaintInputRef.current?.click(); }}
          className={`group flex items-center gap-3 p-3 rounded-xl border transition-all duration-200 ${complaintStatus?.loaded
            ? 'bg-amber-50 border-amber-200 dark:bg-amber-500/5 dark:border-amber-500/20'
            : 'bg-slate-50 border-slate-200 dark:bg-white/[0.02] dark:border-white/10 hover:border-amber-300 dark:hover:border-amber-500/30 cursor-pointer'
            }`}
        >
          <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${complaintStatus?.loaded
            ? 'bg-amber-100 dark:bg-amber-500/20'
            : 'bg-slate-100 dark:bg-white/5'
            }`}>
            {complaintUploading ? (
              <Loader2 size={16} className="text-amber-500 animate-spin" />
            ) : complaintStatus?.loaded ? (
              <CheckCircle size={16} className="text-amber-600 dark:text-amber-400" />
            ) : (
              <ShieldAlert size={16} className="text-slate-400 dark:text-gray-600" />
            )}
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-xs font-semibold text-slate-700 dark:text-gray-300">
              {complaintStatus?.loaded ? 'Member Complaints Loaded' : 'Upload Member Complaints'}
            </div>
            <div className="text-[10px] text-slate-400 dark:text-gray-600 truncate">
              {complaintStatus?.loaded
                ? `${complaintStatus.total} complaints from ${complaintStatus.filename}`
                : 'Optional — upload member complaints CSV to cross-reference during validation'
              }
            </div>
          </div>
          {complaintStatus?.loaded && (
            <button
              onClick={async (e) => {
                e.stopPropagation();
                try {
                  await fetch('/upload-complaints', { method: 'DELETE' });
                  setComplaintStatus(null);
                } catch (err) {
                  console.error('Failed to clear complaints:', err);
                }
              }}
              className="p-1.5 rounded-lg hover:bg-red-100 dark:hover:bg-red-500/10 transition-colors"
              title="Remove member complaints"
            >
              <X size={14} className="text-slate-400 hover:text-red-500 transition-colors" />
            </button>
          )}
        </div>
      </div>

      <div className="flex flex-col gap-4 flex-1">
        {/* Manual Upload Card */}
        <div
          onClick={() => setShowUploadModal(true)}
          className="group relative bg-slate-50 border border-slate-200 dark:bg-[#0a0a0a]/40 dark:border-white/10 hover:border-blue-500/30 rounded-2xl p-5 transition-all duration-300 hover:bg-white dark:hover:bg-[#0a0a0a]/60 cursor-pointer flex flex-col justify-between overflow-hidden shadow-sm hover:shadow-md dark:shadow-none min-h-[160px]"
        >
          <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:opacity-20 transition-opacity">
            <FileText size={80} className="text-slate-900 dark:text-white" />
          </div>

          <div className="flex items-start gap-4">
            <div className="w-10 h-10 rounded-full bg-blue-50 border border-blue-100 dark:bg-blue-500/10 dark:border-blue-500/20 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform duration-300">
              <Upload className="text-blue-500 dark:text-blue-400" size={20} />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-1 group-hover:text-blue-600 dark:group-hover:text-blue-300 transition-colors">Manual Upload</h3>
              <p className="text-xs text-slate-500 dark:text-gray-500 leading-relaxed max-w-[90%]">
                Upload CSV files for batch validation or scan documents with OCR to extract provider data.
              </p>
            </div>
          </div>

          <div className="mt-4 flex gap-2">
            <span className="px-2 py-1 rounded-md bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 text-[10px] font-semibold border border-blue-100 dark:border-blue-500/20">CSV</span>
            <span className="px-2 py-1 rounded-md bg-purple-50 dark:bg-purple-500/10 text-purple-600 dark:text-purple-400 text-[10px] font-semibold border border-purple-100 dark:border-purple-500/20">OCR Scan</span>
            <span className="px-2 py-1 rounded-md bg-slate-50 dark:bg-white/5 text-slate-500 dark:text-gray-500 text-[10px] font-semibold border border-slate-200 dark:border-white/10">PDF</span>
          </div>
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