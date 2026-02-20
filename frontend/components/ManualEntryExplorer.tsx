
import React, { useState } from 'react';
import { Upload, FileText, CheckCircle, AlertTriangle, AlertCircle, TrendingUp, DollarSign, Activity, ChevronRight, Loader2, ArrowRight, ShieldCheck } from 'lucide-react';
import GlassCard from './GlassCard';
import { analyzeManualEntry } from '../services/apiService';

import { ProviderRecord, AgentThought } from '../types';
import ProviderDetailView from './ProviderDetailView';

interface ManualEntryExplorerProps {
    onAddRecord?: (record: ProviderRecord) => void;
}

const ManualEntryExplorer: React.FC<ManualEntryExplorerProps> = ({ onAddRecord }) => {
    const [formData, setFormData] = useState({
        first_name: '',
        last_name: '',
        npi: '',
        specialty: '',
        state: '',
        license_number: ''
    });
    const [file, setFile] = useState<File | null>(null);
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [runEfficiently, setRunEfficiently] = useState(true);
    const [result, setResult] = useState<ProviderRecord | null>(null);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setFile(e.target.files[0]);
        }
    };

    const handleAnalyze = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsAnalyzing(true);
        setResult(null);

        try {
            const analysisData = await analyzeManualEntry(formData, file || undefined, runEfficiently);
            if (analysisData && analysisData.record) {
                setResult(analysisData.record);
                if (onAddRecord) {
                    onAddRecord(analysisData.record);
                }
            }
        } catch (error) {
            console.error("Analysis failed:", error);
            // Todo: Show error toast
        } finally {
            setIsAnalyzing(false);
        }
    };

    return (
        <div className="flex flex-col xl:flex-row h-full gap-6 p-6 animate-in fade-in duration-500">
            {/* Input Column */}
            <div className="w-full xl:w-1/3 flex flex-col gap-6">
                <GlassCard className="p-6">
                    <h2 className="text-xl font-bold mb-4 text-slate-900 dark:text-white flex items-center gap-2">
                        <FileText className="text-emerald-500" />
                        Manual Entry
                    </h2>
                    <form onSubmit={handleAnalyze} className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="text-xs font-semibold text-slate-500 dark:text-gray-400 uppercase tracking-wider mb-1 block">First Name</label>
                                <input
                                    type="text"
                                    name="first_name"
                                    value={formData.first_name}
                                    onChange={handleInputChange}
                                    className="w-full bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-lg px-3 py-2 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                                    placeholder="John"
                                />
                            </div>
                            <div>
                                <label className="text-xs font-semibold text-slate-500 dark:text-gray-400 uppercase tracking-wider mb-1 block">Last Name</label>
                                <input
                                    type="text"
                                    name="last_name"
                                    value={formData.last_name}
                                    onChange={handleInputChange}
                                    className="w-full bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-lg px-3 py-2 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                                    placeholder="Doe"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="text-xs font-semibold text-slate-500 dark:text-gray-400 uppercase tracking-wider mb-1 block">NPI Number</label>
                            <input
                                type="text"
                                name="npi"
                                value={formData.npi}
                                onChange={handleInputChange}
                                className="w-full bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-lg px-3 py-2 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/50 font-mono"
                                placeholder="1234567890"
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="text-xs font-semibold text-slate-500 dark:text-gray-400 uppercase tracking-wider mb-1 block">Specialty</label>
                                <select
                                    name="specialty"
                                    value={formData.specialty}
                                    onChange={handleInputChange}
                                    className="w-full bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-lg px-3 py-2 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                                >
                                    <option value="">Select...</option>
                                    <option value="Cardiology">Cardiology</option>
                                    <option value="Dermatology">Dermatology</option>
                                    <option value="Neurology">Neurology</option>
                                    <option value="Orthopedics">Orthopedics</option>
                                    <option value="Pediatrics">Pediatrics</option>
                                    <option value="Radiology">Radiology</option>
                                    <option value="Surgery">Surgery</option>
                                    <option value="General Practice">General Practice</option>
                                </select>
                            </div>
                            <div>
                                <label className="text-xs font-semibold text-slate-500 dark:text-gray-400 uppercase tracking-wider mb-1 block">State</label>
                                <input
                                    type="text"
                                    name="state"
                                    value={formData.state}
                                    onChange={handleInputChange}
                                    className="w-full bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-lg px-3 py-2 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                                    placeholder="NY"
                                    maxLength={2}
                                />
                            </div>
                        </div>

                        <div>
                            <label className="text-xs font-semibold text-slate-500 dark:text-gray-400 uppercase tracking-wider mb-1 block">License Number</label>
                            <input
                                type="text"
                                name="license_number"
                                value={formData.license_number}
                                onChange={handleInputChange}
                                className="w-full bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-lg px-3 py-2 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/50 font-mono"
                                placeholder="Optional"
                            />
                        </div>

                        <div className="pt-2">
                            <label className="text-xs font-semibold text-slate-500 dark:text-gray-400 uppercase tracking-wider mb-2 block">Upload Verification Doc (Optional)</label>
                            <div className="border-2 border-dashed border-slate-200 dark:border-white/10 rounded-lg p-4 hover:bg-slate-50 dark:hover:bg-white/5 transition-colors text-center cursor-pointer relative">
                                <input
                                    type="file"
                                    onChange={handleFileChange}
                                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                    accept=".pdf,.jpg,.png"
                                />
                                <Upload size={20} className="mx-auto text-slate-400 mb-2" />
                                <span className="text-sm text-slate-500 dark:text-gray-400">
                                    {file ? file.name : "Drop or click to upload PDF/Image"}
                                </span>
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

                        <button
                            type="submit"
                            disabled={isAnalyzing}
                            className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-semibold py-3 rounded-lg shadow-lg shadow-emerald-500/20 transition-all flex items-center justify-center gap-2 mt-4 disabled:opacity-70 disabled:cursor-not-allowed"
                        >
                            {isAnalyzing ? (
                                <>
                                    <Loader2 size={18} className="animate-spin" />
                                    Running Agents...
                                </>
                            ) : (
                                <>
                                    <Activity size={18} />
                                    Run Deep Analysis
                                </>
                            )}
                        </button>
                    </form>
                </GlassCard>
            </div>

            {/* Results Column */}
            <div className="flex-1 flex flex-col h-full bg-slate-100 dark:bg-black/20 rounded-xl overflow-hidden border border-slate-200 dark:border-white/5 relative">
                {!result && !isAnalyzing && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-400 dark:text-gray-600">
                        <Activity size={64} className="mb-4 opacity-20" />
                        <p className="text-lg font-medium">Ready for Analysis</p>
                        <p className="text-sm">Enter details or upload a document to begin</p>
                    </div>
                )}

                {isAnalyzing && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center bg-white/50 dark:bg-black/50 backdrop-blur-sm z-10">
                        <div className="flex flex-col gap-4 w-64">
                            <div className="flex items-center gap-3 text-sm text-emerald-600 dark:text-emerald-400 font-medium animate-pulse">
                                <div className="w-2 h-2 bg-emerald-500 rounded-full animate-ping"></div>
                                Validation Agent Cross-Referencing...
                            </div>
                            <div className="flex items-center gap-3 text-sm text-blue-600 dark:text-blue-400 font-medium animate-pulse delay-700">
                                <div className="w-2 h-2 bg-blue-500 rounded-full animate-ping"></div>
                                Predictive Agent Calculating Risk...
                            </div>
                            <div className="flex items-center gap-3 text-sm text-purple-600 dark:text-purple-400 font-medium animate-pulse delay-1000">
                                <div className="w-2 h-2 bg-purple-500 rounded-full animate-ping"></div>
                                ROI Agent Estimating Impact...
                            </div>
                        </div>
                    </div>
                )}

                {result && (
                    <div className="h-full overflow-y-auto">
                        <ProviderDetailView
                            selectedRecord={result}
                        />
                    </div>
                )}
            </div>
        </div>
    );
};

export default ManualEntryExplorer;
