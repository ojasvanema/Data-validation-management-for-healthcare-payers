import React from 'react';
import { UploadCloud, CheckCircle, AlertTriangle, FileText, Activity, Users, DollarSign, ShieldAlert, ShieldCheck } from 'lucide-react';
import Button from './ui/Button';

const DashboardPreview: React.FC = () => {
  return (
    <div className="relative mx-auto max-w-[1200px] mt-16 perspective-1000">
      {/* Background Glow */}
      <div className="absolute -inset-1 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-2xl blur opacity-10"></div>
      
      {/* App Container */}
      <div className="relative bg-[#050505] rounded-xl border border-white/10 shadow-2xl overflow-hidden flex h-[800px] md:h-[800px]">
        
        {/* Sidebar */}
        <div className="hidden md:flex w-64 border-r border-white/5 flex-col bg-[#080808] p-4">
            <div className="flex items-center gap-2 mb-10 px-2">
                <div className="w-8 h-8 rounded-lg bg-emerald-500/20 flex items-center justify-center">
                    <div className="w-4 h-4 bg-emerald-500 rounded-full shadow-[0_0_10px_rgba(16,185,129,0.5)]"></div>
                </div>
                <div>
                    <span className="font-bold text-gray-100 block leading-tight">HealthGuard</span>
                    <span className="text-[10px] text-gray-500">AI Orchestrator</span>
                </div>
            </div>
            
            <div className="space-y-1">
                <div className="px-3 py-2 text-gray-400 hover:text-white flex items-center gap-3 rounded-lg hover:bg-white/5 cursor-pointer transition-colors">
                    <div className="w-4 h-4 border border-current rounded-full opacity-50"></div>
                    <span className="text-sm">New Analysis</span>
                </div>
                <div className="px-3 py-2 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center gap-3 rounded-lg cursor-pointer">
                     <div className="w-4 h-4 grid grid-cols-2 gap-0.5">
                         <div className="bg-current rounded-[1px]"></div>
                         <div className="bg-current rounded-[1px]"></div>
                         <div className="bg-current rounded-[1px]"></div>
                         <div className="bg-current rounded-[1px]"></div>
                     </div>
                    <span className="text-sm font-medium">Live Dashboard</span>
                </div>
                <div className="px-3 py-2 text-gray-400 hover:text-white flex items-center gap-3 rounded-lg hover:bg-white/5 cursor-pointer transition-colors">
                    <div className="w-4 h-4 border-2 border-current rounded-[3px] opacity-50"></div>
                    <span className="text-sm">Data Explorer</span>
                </div>
            </div>

            <div className="mt-8">
                <div className="text-[10px] font-bold text-gray-600 px-3 mb-2 tracking-wider">RECENT RUNS</div>
                <div className="space-y-3 px-3">
                    <div className="border-l border-white/10 pl-3">
                        <div className="text-xs text-gray-300">09/12/2025</div>
                        <div className="text-[10px] text-gray-500 truncate">Processed 1542 providers with $...</div>
                    </div>
                    <div className="border-l border-white/10 pl-3">
                        <div className="text-xs text-gray-300">09/12/2025</div>
                        <div className="text-[10px] text-gray-500 truncate">Processed 1542 providers with $...</div>
                    </div>
                </div>
            </div>

            <div className="mt-auto pt-4 border-t border-white/5">
                <div className="flex items-center gap-3 p-2 bg-white/5 rounded-lg border border-white/5">
                    <div className="w-8 h-8 rounded-full bg-emerald-900 flex items-center justify-center text-xs text-emerald-300 font-bold">EY</div>
                    <div>
                        <div className="text-xs text-white font-medium">Enterprise User</div>
                        <div className="text-[10px] text-emerald-500 flex items-center gap-1">
                            <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full"></div> Connected
                        </div>
                    </div>
                </div>
            </div>
        </div>

        {/* Main Dashboard Content */}
        <div className="flex-1 bg-[#050505] p-6 md:p-8 overflow-y-auto">
            {/* Breadcrumb & Header */}
            <div className="flex justify-between items-center mb-8">
                <div className="text-xs text-gray-500 mb-1">Home &gt; Analysis &gt; <span className="text-emerald-500">Live Dashboard</span></div>
                <div className="bg-emerald-500/10 text-emerald-500 px-3 py-1 rounded-full text-xs font-mono border border-emerald-500/20 flex items-center gap-2">
                    <Activity className="w-3 h-3" />
                    System Operational
                </div>
            </div>

            <div className="grid grid-cols-12 gap-6">
                
                {/* Data Ingestion Card (Top Left) */}
                <div className="col-span-12 lg:col-span-4 bg-[#0a0a0a] border border-white/10 rounded-xl p-6 relative overflow-hidden group">
                     <div className="absolute inset-0 bg-emerald-500/5 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"></div>
                     <h3 className="text-emerald-500 font-medium mb-4 flex items-center gap-2">
                         Data Ingestion
                     </h3>
                     <div className="border-2 border-dashed border-white/10 rounded-xl h-40 flex flex-col items-center justify-center bg-[#050505] mb-4 hover:border-emerald-500/30 transition-colors cursor-pointer">
                         <UploadCloud className="w-8 h-8 text-gray-500 mb-2" />
                         <span className="text-sm text-gray-400">Drag files here</span>
                         <span className="text-xs text-gray-600">or</span>
                         <span className="text-xs text-emerald-500 mt-1 font-medium bg-emerald-500/10 px-2 py-0.5 rounded">Browse Files</span>
                     </div>
                     <Button className="w-full bg-white/5 hover:bg-white/10 text-gray-300 border border-white/10">Start Orchestration</Button>
                </div>

                {/* Metrics Row (Top Right) */}
                <div className="col-span-12 lg:col-span-8 grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="bg-[#0a0a0a] border border-white/10 rounded-xl p-4 flex flex-col justify-between">
                        <div className="flex justify-between items-start">
                            <DollarSign className="w-5 h-5 text-emerald-500" />
                        </div>
                        <div>
                            <div className="text-[10px] text-gray-500 uppercase tracking-wider">Potential ROI</div>
                            <div className="text-2xl font-bold text-white">$1,250,000</div>
                        </div>
                    </div>
                    <div className="bg-[#0a0a0a] border border-white/10 rounded-xl p-4 flex flex-col justify-between">
                         <div className="flex justify-between items-start">
                            <ShieldAlert className="w-5 h-5 text-red-500" />
                        </div>
                        <div>
                            <div className="text-[10px] text-gray-500 uppercase tracking-wider">Fraud Risk</div>
                            <div className="text-2xl font-bold text-white">42/100</div>
                        </div>
                    </div>
                    <div className="bg-[#0a0a0a] border border-white/10 rounded-xl p-4 flex flex-col justify-between">
                         <div className="flex justify-between items-start">
                            <Users className="w-5 h-5 text-blue-500" />
                        </div>
                        <div>
                            <div className="text-[10px] text-gray-500 uppercase tracking-wider">Providers</div>
                            <div className="text-2xl font-bold text-white">1,542</div>
                        </div>
                    </div>
                    <div className="bg-[#0a0a0a] border border-white/10 rounded-xl p-4 flex flex-col justify-between">
                         <div className="flex justify-between items-start">
                            <AlertTriangle className="w-5 h-5 text-amber-500" />
                        </div>
                        <div>
                            <div className="text-[10px] text-gray-500 uppercase tracking-wider">Discrepancies</div>
                            <div className="text-2xl font-bold text-white">128</div>
                        </div>
                    </div>
                    
                    {/* Charts Area */}
                    <div className="col-span-2 md:col-span-3 bg-[#0a0a0a] border border-white/10 rounded-xl p-5 mt-0 h-[220px] relative">
                        <div className="flex items-center gap-2 mb-4 border-l-4 border-emerald-500 pl-2">
                            <h4 className="text-sm font-bold text-white">Validation Throughput</h4>
                        </div>
                        {/* Mock Chart Line */}
                        <div className="absolute bottom-6 left-6 right-6 top-16 border-l border-b border-white/5">
                             <svg className="w-full h-full overflow-visible" preserveAspectRatio="none" viewBox="0 0 100 100">
                                 <path d="M0,100 C20,95 40,80 50,40 C60,10 80,5 100,0" fill="none" stroke="#10b981" strokeWidth="2" vectorEffect="non-scaling-stroke" />
                                 <path d="M0,100 C20,95 40,80 50,40 C60,10 80,5 100,0 L100,100 L0,100" fill="url(#grad)" opacity="0.2" />
                                 <defs>
                                     <linearGradient id="grad" x1="0%" y1="0%" x2="0%" y2="100%">
                                         <stop offset="0%" stopColor="#10b981" />
                                         <stop offset="100%" stopColor="transparent" />
                                     </linearGradient>
                                 </defs>
                             </svg>
                             {/* X Axis Labels */}
                             <div className="absolute -bottom-5 left-0 text-[9px] text-gray-600">00:00</div>
                             <div className="absolute -bottom-5 left-1/4 text-[9px] text-gray-600">04:00</div>
                             <div className="absolute -bottom-5 left-2/4 text-[9px] text-gray-600">08:00</div>
                             <div className="absolute -bottom-5 left-3/4 text-[9px] text-gray-600">12:00</div>
                             <div className="absolute -bottom-5 right-0 text-[9px] text-gray-600">16:00</div>
                        </div>
                    </div>

                    <div className="col-span-2 md:col-span-1 bg-[#0a0a0a] border border-white/10 rounded-xl p-5 h-[220px]">
                         <div className="flex items-center gap-2 mb-4 border-l-4 border-amber-500 pl-2">
                            <h4 className="text-sm font-bold text-white">Risk Dist.</h4>
                        </div>
                        <div className="flex items-end justify-between h-32 gap-2 mt-4">
                            <div className="w-1/3 bg-emerald-500 rounded-t h-full relative group">
                                <div className="absolute -top-6 left-1/2 -translate-x-1/2 text-[10px] text-gray-400 opacity-0 group-hover:opacity-100">85%</div>
                            </div>
                            <div className="w-1/3 bg-amber-500 rounded-t h-[20%] relative group">
                                 <div className="absolute -top-6 left-1/2 -translate-x-1/2 text-[10px] text-gray-400 opacity-0 group-hover:opacity-100">12%</div>
                            </div>
                            <div className="w-1/3 bg-red-500 rounded-t h-[5%] relative group">
                                 <div className="absolute -top-6 left-1/2 -translate-x-1/2 text-[10px] text-gray-400 opacity-0 group-hover:opacity-100">3%</div>
                            </div>
                        </div>
                        <div className="flex justify-between mt-2 text-[9px] text-gray-500">
                            <span>Low</span>
                            <span>Med</span>
                            <span>High</span>
                        </div>
                    </div>
                </div>

                {/* System Logs / Agent Activity (Bottom) */}
                <div className="col-span-12 bg-[#0a0a0a] border border-white/10 rounded-xl p-6">
                    <div className="flex items-center gap-2 mb-4 border-l-4 border-blue-500 pl-2">
                        <h4 className="text-sm font-bold text-white">System Logs</h4>
                    </div>
                    <div className="space-y-0">
                        <div className="grid grid-cols-12 py-3 border-b border-white/5 text-xs">
                            <div className="col-span-2 text-gray-500 font-mono">03:51:52</div>
                            <div className="col-span-2 text-emerald-400 font-bold">ORCHESTRATOR</div>
                            <div className="col-span-8 text-gray-300">Batch ingestion started: 1,542 records.</div>
                        </div>
                        <div className="grid grid-cols-12 py-3 border-b border-white/5 text-xs">
                            <div className="col-span-2 text-gray-500 font-mono">03:51:52</div>
                            <div className="col-span-2 text-blue-400 font-bold">DOCUMENT</div>
                            <div className="col-span-8 text-gray-300">OCR processing complete. 98.5% confidence.</div>
                        </div>
                         <div className="grid grid-cols-12 py-3 border-b border-white/5 text-xs">
                            <div className="col-span-2 text-gray-500 font-mono">03:51:52</div>
                            <div className="col-span-2 text-emerald-400 font-bold">VALIDATION</div>
                            <div className="col-span-8 text-gray-300">NPI Registry cross-reference started.</div>
                        </div>
                         <div className="grid grid-cols-12 py-3 text-xs">
                            <div className="col-span-2 text-gray-500 font-mono">03:51:52</div>
                            <div className="col-span-2 text-emerald-400 font-bold">VALIDATION</div>
                            <div className="col-span-8 text-gray-300">15 license mismatches detected.</div>
                        </div>
                    </div>
                </div>

                {/* Agent Cards (Floating above log in screenshot, but we'll put below or grid) */}
                {/* Visual simplification: Displaying key agent status cards in a grid */}
                <div className="col-span-6 lg:col-span-3 bg-[#0f0f0f] border border-white/10 rounded-xl p-4 flex flex-col gap-2">
                     <div className="flex justify-between">
                         <ShieldCheck className="w-5 h-5 text-emerald-500" />
                         <CheckCircle className="w-3 h-3 text-emerald-500" />
                     </div>
                     <div className="text-xs font-bold text-white">Multi-source Validation</div>
                     <div className="text-[10px] text-gray-500">Cross-references 15+ sources (NPI, etc.)</div>
                     <div className="h-1 w-full bg-gray-800 rounded-full mt-2 overflow-hidden">
                         <div className="h-full bg-emerald-500 w-3/4"></div>
                     </div>
                </div>
                <div className="col-span-6 lg:col-span-3 bg-[#0f0f0f] border border-white/10 rounded-xl p-4 flex flex-col gap-2">
                     <div className="flex justify-between">
                         <FileText className="w-5 h-5 text-blue-500" />
                         <CheckCircle className="w-3 h-3 text-emerald-500" />
                     </div>
                     <div className="text-xs font-bold text-white">Document Parser</div>
                     <div className="text-[10px] text-gray-500">Extracts data from unstructured PDFs/Images</div>
                      <div className="h-1 w-full bg-gray-800 rounded-full mt-2 overflow-hidden">
                         <div className="h-full bg-blue-500 w-full"></div>
                     </div>
                </div>
                 <div className="col-span-6 lg:col-span-3 bg-[#0f0f0f] border border-white/10 rounded-xl p-4 flex flex-col gap-2">
                     <div className="flex justify-between">
                         <ShieldAlert className="w-5 h-5 text-red-500" />
                         <div className="w-3 h-3 rounded-full border border-gray-600"></div>
                     </div>
                     <div className="text-xs font-bold text-white">Fraud Detection</div>
                     <div className="text-[10px] text-gray-500">Flags suspicious billing & licenses</div>
                     <div className="px-2 py-0.5 bg-red-500/10 text-red-500 text-[9px] rounded w-fit">Suspicious Found</div>
                </div>
                 <div className="col-span-6 lg:col-span-3 bg-[#0f0f0f] border border-white/10 rounded-xl p-4 flex flex-col gap-2">
                     <div className="flex justify-between">
                         <Activity className="w-5 h-5 text-purple-500" />
                         <CheckCircle className="w-3 h-3 text-emerald-500" />
                     </div>
                     <div className="text-xs font-bold text-white">Predictive Degradation</div>
                     <div className="text-[10px] text-gray-500">Predicts data accuracy decay</div>
                      <div className="h-1 w-full bg-gray-800 rounded-full mt-2 overflow-hidden">
                         <div className="h-full bg-purple-500 w-1/2"></div>
                     </div>
                </div>
            </div>
        </div>
      </div>
      
      {/* Decorative elements behind dashboard */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[120%] h-[120%] bg-emerald-500/5 blur-[100px] -z-10 rounded-full pointer-events-none"></div>
    </div>
  );
};

export default DashboardPreview;