import React from 'react';
import { ShieldCheck, Github, Twitter, Linkedin } from 'lucide-react';

const Footer: React.FC = () => {
  return (
    <footer className="bg-black border-t border-white/10 py-12">
      <div className="max-w-7xl mx-auto px-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-12">
            <div className="col-span-1 md:col-span-2">
                <div className="flex items-center gap-2 mb-4">
                     <ShieldCheck className="w-6 h-6 text-emerald-500" />
                     <span className="text-lg font-bold text-white">HealthGuard</span>
                </div>
                <p className="text-gray-400 text-sm max-w-sm leading-relaxed">
                    Advanced AI orchestration for healthcare data integrity. 
                    Automating compliance, reducing fraud risk, and delivering actionable business intelligence.
                </p>
            </div>
            
            <div>
                <h4 className="text-white font-semibold mb-4">Platform</h4>
                <ul className="space-y-2 text-sm text-gray-400">
                    <li><a href="#" className="hover:text-emerald-400 transition-colors">Data Ingestion</a></li>
                    <li><a href="#" className="hover:text-emerald-400 transition-colors">Agent Auditing</a></li>
                    <li><a href="#" className="hover:text-emerald-400 transition-colors">Risk Scoring</a></li>
                    <li><a href="#" className="hover:text-emerald-400 transition-colors">Predictive Analytics</a></li>
                </ul>
            </div>

            <div>
                <h4 className="text-white font-semibold mb-4">Company</h4>
                <ul className="space-y-2 text-sm text-gray-400">
                    <li><a href="#" className="hover:text-emerald-400 transition-colors">About</a></li>
                    <li><a href="#" className="hover:text-emerald-400 transition-colors">Documentation</a></li>
                    <li><a href="#" className="hover:text-emerald-400 transition-colors">Security</a></li>
                    <li><a href="#" className="hover:text-emerald-400 transition-colors">Contact</a></li>
                </ul>
            </div>
        </div>

        <div className="pt-8 border-t border-white/5 flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="text-sm text-gray-500">
                © 2025 HealthGuard AI. All rights reserved.
            </div>
            <div className="flex gap-4">
                <a href="#" className="text-gray-500 hover:text-white transition-colors"><Github className="w-5 h-5" /></a>
                <a href="#" className="text-gray-500 hover:text-white transition-colors"><Twitter className="w-5 h-5" /></a>
                <a href="#" className="text-gray-500 hover:text-white transition-colors"><Linkedin className="w-5 h-5" /></a>
            </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;