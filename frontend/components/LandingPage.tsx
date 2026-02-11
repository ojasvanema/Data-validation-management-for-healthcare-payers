import React from 'react';
import Navbar from './landing/Navbar';
import Hero from './landing/Hero';
import Features from './landing/Features';
import AgentSystem from './landing/AgentSystem';
import SystemArchitecture from './landing/SystemArchitecture';
import Footer from './landing/Footer';
import BackgroundGrid from './landing/BackgroundGrid';

interface LandingPageProps {
    onLogin: () => void;
}

const LandingPage: React.FC<LandingPageProps> = ({ onLogin }) => {
    return (
        <div className="min-h-screen text-slate-900 dark:text-gray-200 font-sans selection:bg-emerald-500/30 selection:text-emerald-700 dark:selection:text-emerald-200">
            <BackgroundGrid />
            <Navbar />
            <main>
                <Hero onStart={onLogin} />
                <SystemArchitecture />
                <Features />
                <AgentSystem />

                {/* Value Proposition / CTA Section */}
                <section className="py-24 relative overflow-hidden">
                    <div className="absolute inset-0 bg-emerald-50 dark:bg-emerald-900/10"></div>
                    <div className="max-w-4xl mx-auto px-6 text-center relative z-10">
                        <h2 className="text-3xl md:text-5xl font-bold text-slate-900 dark:text-white mb-6">Ready to secure your network?</h2>
                        <p className="text-xl text-slate-600 dark:text-gray-400 mb-10">
                            Join top healthcare payers using HealthGuard to reduce risk and optimize operational efficiency.
                        </p>
                        <button className="bg-emerald-600 text-white dark:bg-white dark:text-black px-8 py-4 rounded-lg font-bold text-lg hover:bg-emerald-700 dark:hover:bg-gray-100 transition-colors shadow-lg shadow-emerald-500/20 dark:shadow-[0_0_40px_rgba(255,255,255,0.3)]" onClick={onLogin}>
                            Schedule a Demo
                        </button>
                    </div>
                </section>
            </main>
            <Footer />
        </div>
    );
};

export default LandingPage;
