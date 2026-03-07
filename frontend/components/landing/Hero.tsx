import React from 'react';
import Button from './ui/Button';
import { ArrowRight, PlayCircle } from 'lucide-react';
import DashboardPreview from './DashboardPreview';

interface HeroProps {
  onStart: () => void;
}

const Hero: React.FC<HeroProps> = ({ onStart }) => {
  return (
    <div className="relative pt-32 pb-20 min-h-screen flex flex-col justify-center overflow-hidden">
      <div className="max-w-7xl mx-auto px-6 text-center relative z-10">

        {/* Pill Label */}
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-gray-300 text-sm mb-8 animate-fade-in-up">
          <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
          <span>System Operational • v2.4 Live</span>
        </div>

        {/* Headline */}
        <h1 className="text-5xl md:text-7xl font-bold text-white tracking-tight mb-8 leading-tight animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
          Automated Healthcare <br />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 via-teal-300 to-cyan-400">Data Integrity</span>
        </h1>

        {/* Subhead */}
        <p className="text-lg md:text-xl text-gray-400 max-w-2xl mx-auto mb-10 leading-relaxed animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
          Orchestrate validation with a 7-agent AI swarm. Assess compliance risks, calculate ROI, and ensure data integrity with a single autonomous platform.
        </p>

        {/* CTA Buttons */}
        <div className="flex flex-col md:flex-row items-center justify-center gap-4 mb-20 animate-fade-in-up" style={{ animationDelay: '0.3s' }}>
          <Button size="lg" className="group" onClick={onStart}>
            Start Orchestration
            <ArrowRight className="ml-2 w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </Button>
        </div>

        {/* Dashboard Preview Anchor */}
        <div className="animate-fade-in-up" style={{ animationDelay: '0.5s' }}>
          <DashboardPreview />
        </div>
      </div>
    </div>
  );
};

export default Hero;