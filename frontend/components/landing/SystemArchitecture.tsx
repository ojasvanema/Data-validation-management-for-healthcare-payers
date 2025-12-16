import React from 'react';

const SystemArchitecture: React.FC = () => {
  return (
    <section className="relative py-24 md:py-32 bg-[#050505] overflow-hidden">
      {/* Background Gradients */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-emerald-500/5 blur-[100px] rounded-full pointer-events-none"></div>

      <div className="max-w-7xl mx-auto px-6 relative z-10 grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
        {/* Text Content */}
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-mono mb-6">
            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
            <span>DECENTRALIZED ARCHITECTURE</span>
          </div>
          <h2 className="text-3xl md:text-5xl font-bold text-white mb-6 leading-tight">
            The Central Nervous System of <span className="text-emerald-400">Healthcare Data</span>
          </h2>
          <p className="text-gray-400 text-lg leading-relaxed mb-8">
            A multi-layered AI operating system that unifies disparate data sources. 
            From the bottom-layer secure ledger to the top-layer agentic orchestration, 
            every byte is validated, processed, and optimized for decision-making.
          </p>
          
          <div className="space-y-6 border-l border-white/10 pl-6">
            <div className="relative">
                <h4 className="text-white font-semibold mb-1">AI Orchestration Layer</h4>
                <p className="text-gray-500 text-sm">Autonomous task dispatching and interface management.</p>
                <div className="absolute -left-[25px] top-1 w-3 h-3 rounded-full bg-emerald-500 ring-4 ring-[#050505]"></div>
            </div>
            <div className="relative">
                <h4 className="text-white font-semibold mb-1">Agent Processing Node</h4>
                <p className="text-gray-500 text-sm">7-Agent swarm for validation, fraud detection, and prediction.</p>
                <div className="absolute -left-[25px] top-1 w-3 h-3 rounded-full bg-emerald-700 ring-4 ring-[#050505]"></div>
            </div>
            <div className="relative">
                <h4 className="text-white font-semibold mb-1">Secure Data Lake</h4>
                <p className="text-gray-500 text-sm">Immutable ledger storage with full audit traceability.</p>
                <div className="absolute -left-[25px] top-1 w-3 h-3 rounded-full bg-emerald-900 ring-4 ring-[#050505]"></div>
            </div>
          </div>
        </div>

        {/* 3D Visualization */}
        <div className="relative h-[500px] w-full flex items-center justify-center perspective-[1200px] group">
            {/* The Isometric World */}
            <div className="relative w-[300px] h-[300px] sm:w-[360px] sm:h-[360px] iso-parent transition-transform duration-700 ease-out group-hover:scale-105">
                
                {/* --- LAYER 1: BOTTOM (STORAGE) --- */}
                <div className="absolute inset-0 bg-[#0a0a0a]/90 border border-white/10 rounded-3xl shadow-[0_0_40px_rgba(0,0,0,0.5)] transition-all duration-500"
                     style={{ transform: 'translateZ(0px)' }}>
                     {/* Grid pattern on surface */}
                     <div className="absolute inset-0 rounded-3xl opacity-20 bg-[linear-gradient(rgba(255,255,255,0.1)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.1)_1px,transparent_1px)] bg-[size:20px_20px]"></div>
                     
                     {/* Internal glow */}
                     <div className="absolute inset-10 rounded-full bg-emerald-900/20 blur-xl"></div>
                </div>

                {/* --- LAYER 2: MIDDLE (COMPUTE) --- */}
                <div className="absolute inset-0 bg-emerald-950/30 border border-emerald-500/20 rounded-3xl backdrop-blur-sm shadow-2xl transition-all duration-500"
                     style={{ 
                         transform: 'translateZ(60px)', 
                         animation: 'float-layer-2 6s ease-in-out infinite' 
                     }}>
                     <div className="absolute inset-0 flex items-center justify-center">
                         <div className="grid grid-cols-2 gap-4 transform rotate-12 opacity-80">
                             <div className="w-12 h-12 bg-emerald-500/20 border border-emerald-500/40 rounded animate-pulse"></div>
                             <div className="w-12 h-12 bg-emerald-500/20 border border-emerald-500/40 rounded animate-pulse" style={{animationDelay: '0.5s'}}></div>
                             <div className="w-12 h-12 bg-emerald-500/20 border border-emerald-500/40 rounded animate-pulse" style={{animationDelay: '1.0s'}}></div>
                             <div className="w-12 h-12 bg-emerald-500/20 border border-emerald-500/40 rounded animate-pulse" style={{animationDelay: '1.5s'}}></div>
                         </div>
                     </div>
                     {/* Connecting Beams */}
                     <div className="absolute top-0 left-1/2 w-0.5 h-[60px] bg-gradient-to-b from-emerald-500/0 via-emerald-500/50 to-emerald-500/0 -translate-x-1/2 -translate-y-full opacity-30"></div>
                </div>

                {/* --- LAYER 3: TOP (ORCHESTRATION) --- */}
                <div className="absolute inset-0 bg-emerald-500/5 border border-emerald-400/30 rounded-3xl backdrop-blur-md shadow-[0_0_30px_rgba(16,185,129,0.15)] transition-all duration-500 flex items-center justify-center"
                     style={{ 
                         transform: 'translateZ(140px)', 
                         animation: 'float-layer-3 6s ease-in-out infinite' 
                     }}>
                     {/* Central Core */}
                     <div className="relative w-24 h-24">
                        <div className="absolute inset-0 bg-emerald-400/20 rounded-full blur-xl animate-pulse"></div>
                        <div className="absolute inset-0 border-2 border-emerald-400 rounded-full flex items-center justify-center shadow-[0_0_20px_rgba(16,185,129,0.4)]">
                            <div className="w-3 h-3 bg-white rounded-full shadow-[0_0_10px_white]"></div>
                        </div>
                        {/* Orbiting ring */}
                        <div className="absolute inset-[-10px] border border-emerald-500/30 rounded-full animate-[spin_10s_linear_infinite]"></div>
                     </div>
                </div>

                {/* --- LABELS (Floating) --- */}
                {/* We position these absolutely in the 3D space but try to counter-rotate or just line usage */}
                
            </div>
            
            {/* Overlay Elements (Fake 3D Labels) */}
            <div className="absolute inset-0 pointer-events-none">
                {/* Label 1 */}
                <div className="absolute top-[20%] right-[10%] flex items-center gap-3 animate-fade-in-up" style={{animationDelay: '0.5s'}}>
                    <div className="text-right">
                        <div className="text-xs font-mono text-emerald-400">LAYER_03</div>
                        <div className="text-white font-bold text-sm">ORCHESTRATION</div>
                    </div>
                    <div className="w-12 h-px bg-gradient-to-l from-emerald-500 to-transparent"></div>
                </div>

                {/* Label 2 */}
                <div className="absolute top-[50%] left-[5%] flex items-center gap-3 animate-fade-in-up" style={{animationDelay: '0.7s'}}>
                    <div className="w-12 h-px bg-gradient-to-r from-emerald-500 to-transparent"></div>
                    <div>
                        <div className="text-xs font-mono text-emerald-400">LAYER_02</div>
                        <div className="text-white font-bold text-sm">VALIDATION SWARM</div>
                    </div>
                </div>
                
                {/* Label 3 */}
                <div className="absolute bottom-[20%] right-[10%] flex items-center gap-3 animate-fade-in-up" style={{animationDelay: '0.9s'}}>
                    <div className="text-right">
                        <div className="text-xs font-mono text-emerald-400">LAYER_01</div>
                        <div className="text-white font-bold text-sm">IMMUTABLE LOGS</div>
                    </div>
                    <div className="w-12 h-px bg-gradient-to-l from-emerald-500 to-transparent"></div>
                </div>
            </div>
        </div>
      </div>

      <style>{`
        @keyframes float-layer-2 {
            0%, 100% { transform: translateZ(60px); }
            50% { transform: translateZ(80px); }
        }
        @keyframes float-layer-3 {
            0%, 100% { transform: translateZ(140px); }
            50% { transform: translateZ(170px); }
        }
      `}</style>
    </section>
  );
};

export default SystemArchitecture;