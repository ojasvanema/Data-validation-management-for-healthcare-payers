import React from 'react';
import { UploadCloud, Cpu, BarChart3, ArrowRight } from 'lucide-react';

const Features: React.FC = () => {
    const steps = [
        {
            icon: UploadCloud,
            title: "Data Ingestion",
            desc: "Drag-and-drop provider records (CSV, PDF, Excel). The system digitizes and structures unstructured data instantly.",
            color: "text-blue-400",
            bg: "bg-blue-500/10",
            border: "border-blue-500/20"
        },
        {
            icon: Cpu,
            title: "AI Orchestration",
            desc: "Multi-agent workflow triggers asynchronously to validate NPIs, check registries, and analyze document content.",
            color: "text-emerald-400",
            bg: "bg-emerald-500/10",
            border: "border-emerald-500/20"
        },
        {
            icon: BarChart3,
            title: "Insights & Audits",
            desc: "View detailed risk scores, degradation probabilities, and financial ROI. Drill down into every agent decision.",
            color: "text-purple-400",
            bg: "bg-purple-500/10",
            border: "border-purple-500/20"
        }
    ];

  return (
    <section id="platform" className="py-24 bg-neutral-950/50">
        <div className="max-w-7xl mx-auto px-6">
            <div className="flex flex-col md:flex-row justify-between items-end mb-16 gap-6">
                <div>
                    <h2 className="text-3xl font-bold text-white mb-4">Streamlined Intelligence Flow</h2>
                    <p className="text-gray-400 max-w-lg">
                        From raw uploads to strategic business intelligence in three automated steps.
                    </p>
                </div>
                <div className="hidden md:block h-px flex-1 bg-white/10 mx-8 mb-4"></div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {steps.map((step, idx) => (
                    <div key={idx} className="relative group">
                        <div className={`h-full p-8 rounded-2xl border ${step.border} bg-[#080808] hover:bg-white/[0.02] transition-colors relative z-10`}>
                            <div className={`w-14 h-14 rounded-xl ${step.bg} ${step.color} flex items-center justify-center mb-6`}>
                                <step.icon className="w-7 h-7" />
                            </div>
                            <h3 className="text-xl font-bold text-white mb-3">{step.title}</h3>
                            <p className="text-gray-400 leading-relaxed">
                                {step.desc}
                            </p>
                        </div>
                        {/* Connector Line */}
                        {idx !== steps.length - 1 && (
                            <div className="hidden md:block absolute top-1/2 -right-4 w-8 h-px bg-gradient-to-r from-white/10 to-transparent z-0">
                                <ArrowRight className="absolute -right-1 -top-2 w-4 h-4 text-gray-700" />
                            </div>
                        )}
                    </div>
                ))}
            </div>
        </div>
    </section>
  );
};

export default Features;