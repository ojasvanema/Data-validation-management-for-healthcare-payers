
import React, { useState } from 'react';
import { Upload, FileText, CheckCircle, AlertTriangle, AlertCircle, TrendingUp, DollarSign, Activity, ChevronRight, Loader2, ArrowRight, ShieldCheck } from 'lucide-react';
import GlassCard from './GlassCard';
import { analyzeManualEntry } from '../services/apiService';

interface ValidationStep {
    step: string;
    status: string;
    reasoning: string;
}

interface ValidationResult {
    verdict: string;
    confidence: number;
    steps: ValidationStep[];
    summary: string;
}

interface PredictiveResult {
    risk_score: number;
    risk_level: string;
    factors: string[];
    decay_probability: number;
    explanation: string;
}

interface ROIResult {
    cost_saving: number;
    processing_time_saved: number;
    error_prevention_value: number;
    graph_points: { x: number; y: number }[];
}

interface DetailedAnalysis {
    validation: ValidationResult;
    predictive: PredictiveResult;
    roi: ROIResult;
    raw_data: any;
    ocr_text?: string;
}

const ManualEntryExplorer = () => {
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
    const [result, setResult] = useState<DetailedAnalysis | null>(null);
    const [activeTab, setActiveTab] = useState<'validation' | 'predictive' | 'roi'>('validation');

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
            const analysisData = await analyzeManualEntry(formData, file || undefined);
            setResult(analysisData);
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

                {/* Context / Instructions */}
                <div className="p-4 bg-blue-50 dark:bg-blue-500/10 border border-blue-100 dark:border-blue-500/20 rounded-lg">
                    <h3 className="text-sm font-semibold text-blue-800 dark:text-blue-300 mb-2 flex items-center gap-2">
                        <Activity size={14} />
                        Agent Demonstration Mode
                    </h3>
                    <p className="text-xs text-blue-700 dark:text-blue-200/80 leading-relaxed">
                        This mode bypasses the batch pipeline to show you exactly how each agent thinks.
                        Enter provider details (even fake ones) to see the Validation, Predictive, and ROI agents reason in real-time.
                    </p>
                </div>
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
                    <div className="flex flex-col h-full">
                        {/* Tabs */}
                        <div className="flex border-b border-slate-200 dark:border-white/10 bg-white dark:bg-white/5">
                            <button
                                onClick={() => setActiveTab('validation')}
                                className={`flex-1 py-4 text-sm font-medium border-b-2 transition-colors ${activeTab === 'validation' ? 'border-emerald-500 text-emerald-600 dark:text-emerald-400 bg-emerald-50/50 dark:bg-emerald-500/10' : 'border-transparent text-slate-500 dark:text-gray-400 hover:text-slate-700 dark:hover:text-gray-200'}`}
                            >
                                Validation Agent
                            </button>
                            <button
                                onClick={() => setActiveTab('predictive')}
                                className={`flex-1 py-4 text-sm font-medium border-b-2 transition-colors ${activeTab === 'predictive' ? 'border-blue-500 text-blue-600 dark:text-blue-400 bg-blue-50/50 dark:bg-blue-500/10' : 'border-transparent text-slate-500 dark:text-gray-400 hover:text-slate-700 dark:hover:text-gray-200'}`}
                            >
                                Predictive Agent
                            </button>
                            <button
                                onClick={() => setActiveTab('roi')}
                                className={`flex-1 py-4 text-sm font-medium border-b-2 transition-colors ${activeTab === 'roi' ? 'border-purple-500 text-purple-600 dark:text-purple-400 bg-purple-50/50 dark:bg-purple-500/10' : 'border-transparent text-slate-500 dark:text-gray-400 hover:text-slate-700 dark:hover:text-gray-200'}`}
                            >
                                ROI & Business Agent
                            </button>
                        </div>

                        {/* Content */}
                        <div className="flex-1 overflow-y-auto p-6 scroll-smooth">

                            {/* Validation View */}
                            {activeTab === 'validation' && (
                                <div className="space-y-6 animate-in slide-in-from-right-4 duration-300">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <h3 className="text-2xl font-bold text-slate-900 dark:text-white mb-1">Validation Verdict</h3>
                                            <p className="text-slate-500 dark:text-gray-400 text-sm">Cross-referencing integrity check</p>
                                        </div>
                                        <div className={`px-4 py-2 rounded-lg text-lg font-bold flex items-center gap-2 ${result.validation.verdict === 'Verified' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400' :
                                            result.validation.verdict === 'Flagged' ? 'bg-red-100 text-red-700 dark:bg-red-500/20 dark:text-red-400' :
                                                'bg-yellow-100 text-yellow-700 dark:bg-yellow-500/20 dark:text-yellow-400'
                                            }`}>
                                            {result.validation.verdict === 'Verified' ? <CheckCircle /> : <AlertTriangle />}
                                            {result.validation.verdict}
                                        </div>
                                    </div>

                                    <div className="bg-white dark:bg-black/40 rounded-xl p-6 border border-slate-200 dark:border-white/10">

                                        {result.ocr_text && (
                                            <div className="mb-6 p-4 bg-slate-100 dark:bg-white/5 rounded-lg border border-slate-200 dark:border-white/10">
                                                <h4 className="font-semibold mb-2 text-xs uppercase tracking-wider text-slate-500">OCR Extracted Evidence</h4>
                                                <pre className="text-xs font-mono text-slate-700 dark:text-gray-300 whitespace-pre-wrap">{result.ocr_text}</pre>
                                            </div>
                                        )}

                                        <h4 className="font-semibold mb-4 text-sm uppercase tracking-wider text-slate-500">Agent Reasoning Steps</h4>
                                        <div className="space-y-4">
                                            {result.validation.steps.map((step, idx) => (
                                                <div key={idx} className="flex gap-4">
                                                    <div className="flex flex-col items-center">
                                                        <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${step.status === 'Pass' ? 'bg-emerald-100 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-400' :
                                                            step.status === 'Fail' ? 'bg-red-100 text-red-600 dark:bg-red-500/20 dark:text-red-400' :
                                                                'bg-yellow-100 text-yellow-600 dark:bg-yellow-500/20 dark:text-yellow-400'
                                                            }`}>
                                                            {step.status === 'Pass' ? <CheckCircle size={16} /> : <AlertCircle size={16} />}
                                                        </div>
                                                        {idx < result.validation.steps.length - 1 && <div className="w-0.5 h-full bg-slate-200 dark:bg-white/10 my-2"></div>}
                                                    </div>
                                                    <div className="pb-6">
                                                        <h5 className="font-semibold text-slate-800 dark:text-white text-sm">{step.step}</h5>
                                                        <p className="text-slate-600 dark:text-gray-400 text-sm mt-1 leading-relaxed">{step.reasoning}</p>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    <div className="p-4 bg-slate-50 dark:bg-white/5 rounded-lg border border-slate-200 dark:border-white/10">
                                        <h4 className="font-semibold mb-2 text-sm">Executive Summary</h4>
                                        <p className="text-sm text-slate-600 dark:text-gray-300">{result.validation.summary}</p>
                                    </div>
                                </div>
                            )}

                            {/* Predictive View */}
                            {activeTab === 'predictive' && (
                                <div className="space-y-6 animate-in slide-in-from-right-4 duration-300">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <h3 className="text-2xl font-bold text-slate-900 dark:text-white mb-1">Risk Assessment</h3>
                                            <p className="text-slate-500 dark:text-gray-400 text-sm">Predictive Fraud & Decay Analysis</p>
                                        </div>
                                        <div className="text-right">
                                            <div className="text-3xl font-bold text-slate-900 dark:text-white">{result.predictive.risk_score}<span className="text-lg text-slate-400 font-normal">/100</span></div>
                                            <div className={`text-sm font-medium ${result.predictive.risk_level === 'Low' ? 'text-emerald-500' :
                                                result.predictive.risk_level === 'High' ? 'text-red-500' : 'text-yellow-500'
                                                }`}>Risk Level: {result.predictive.risk_level}</div>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="p-5 bg-white dark:bg-black/40 rounded-xl border border-slate-200 dark:border-white/10">
                                            <h4 className="font-semibold mb-3 text-sm text-slate-500 uppercase">Risk Factors</h4>
                                            <ul className="space-y-2">
                                                {result.predictive.factors.map((factor, i) => (
                                                    <li key={i} className="flex items-start gap-2 text-sm text-slate-700 dark:text-gray-300">
                                                        <AlertTriangle size={14} className="text-amber-500 mt-0.5 shrink-0" />
                                                        {factor}
                                                    </li>
                                                ))}
                                                {result.predictive.factors.length === 0 && <li className="text-sm text-slate-400 italic">No significant risk factors identified.</li>}
                                            </ul>
                                        </div>
                                        <div className="p-5 bg-white dark:bg-black/40 rounded-xl border border-slate-200 dark:border-white/10">
                                            <h4 className="font-semibold mb-3 text-sm text-slate-500 uppercase">Data Decay Velocity</h4>
                                            <div className="flex items-center gap-4 mb-2">
                                                <TrendingUp className="text-purple-500" size={24} />
                                                <div>
                                                    <div className="text-2xl font-bold text-slate-900 dark:text-white">{(result.predictive.decay_probability * 100).toFixed(1)}%</div>
                                                    <div className="text-xs text-slate-500">Prob. of 90-day obsolescence</div>
                                                </div>
                                            </div>
                                            <div className="w-full bg-slate-100 dark:bg-white/10 h-2 rounded-full overflow-hidden">
                                                <div className="h-full bg-purple-500" style={{ width: `${result.predictive.decay_probability * 100}%` }}></div>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="p-6 bg-slate-50 dark:bg-white/5 rounded-xl border border-slate-200 dark:border-white/10">
                                        <h4 className="font-semibold mb-3 text-sm flex items-center gap-2">
                                            <Activity size={16} className="text-blue-500" />
                                            AI Agent Analysis
                                        </h4>
                                        <p className="text-slate-700 dark:text-gray-300 text-sm leading-relaxed whitespace-pre-line">
                                            {result.predictive.explanation}
                                        </p>
                                    </div>
                                </div>
                            )}

                            {/* ROI View */}
                            {activeTab === 'roi' && (
                                <div className="space-y-6 animate-in slide-in-from-right-4 duration-300">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <h3 className="text-2xl font-bold text-slate-900 dark:text-white mb-1">Business Impact</h3>
                                            <p className="text-slate-500 dark:text-gray-400 text-sm">ROI & Efficiency Metrics</p>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-3 gap-4">
                                        <div className="p-4 bg-emerald-50 dark:bg-emerald-900/10 border border-emerald-100 dark:border-emerald-500/20 rounded-xl text-center">
                                            <DollarSign className="mx-auto text-emerald-600 dark:text-emerald-400 mb-2" />
                                            <div className="text-xs font-semibold text-emerald-700 dark:text-emerald-300 uppercase">Cost Savings</div>
                                            <div className="text-2xl font-bold text-slate-900 dark:text-white">${result.roi.cost_saving.toLocaleString()}</div>
                                        </div>
                                        <div className="p-4 bg-blue-50 dark:bg-blue-900/10 border border-blue-100 dark:border-blue-500/20 rounded-xl text-center">
                                            <Activity className="mx-auto text-blue-600 dark:text-blue-400 mb-2" />
                                            <div className="text-xs font-semibold text-blue-700 dark:text-blue-300 uppercase">Time Saved</div>
                                            <div className="text-2xl font-bold text-slate-900 dark:text-white">{result.roi.processing_time_saved.toFixed(1)} hrs</div>
                                        </div>
                                        <div className="p-4 bg-purple-50 dark:bg-purple-900/10 border border-purple-100 dark:border-purple-500/20 rounded-xl text-center">
                                            <ShieldCheck className="mx-auto text-purple-600 dark:text-purple-400 mb-2" />
                                            <div className="text-xs font-semibold text-purple-700 dark:text-purple-300 uppercase">Risk Value</div>
                                            <div className="text-2xl font-bold text-slate-900 dark:text-white">${result.roi.error_prevention_value.toLocaleString()}</div>
                                        </div>
                                    </div>

                                    <div className="bg-white dark:bg-black/40 rounded-xl p-6 border border-slate-200 dark:border-white/10">
                                        <h4 className="font-semibold mb-6 text-sm">Projected Cumulative Savings (1000 records)</h4>
                                        <div className="h-64 flex items-end gap-2 justify-between px-4 pb-4 border-b border-l border-slate-200 dark:border-white/10 relative">
                                            {result.roi.graph_points.map((pt, i) => {
                                                const maxVal = Math.max(...result.roi.graph_points.map(p => p.y));
                                                const height = (pt.y / maxVal) * 100;
                                                return (
                                                    <div key={i} className="flex flex-col items-center gap-2 flex-1 group">
                                                        <div className="w-full bg-emerald-500/20 dark:bg-emerald-500/10 rounded-t-sm relative transition-all duration-500 group-hover:bg-emerald-500/40" style={{ height: `${height}%` }}>
                                                            <div className="absolute top-0 w-full h-1 bg-emerald-500"></div>
                                                            <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-slate-900 text-white text-[10px] px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity">
                                                                ${pt.y.toLocaleString()}
                                                            </div>
                                                        </div>
                                                        <span className="text-xs text-slate-500">Month {pt.x}</span>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>
                                </div>
                            )}

                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default ManualEntryExplorer;
