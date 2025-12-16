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
        <div className="min-h-screen text-gray-200 font-sans selection:bg-emerald-500/30 selection:text-emerald-200">
            <BackgroundGrid />
            <Navbar />
            <main>
                <Hero onStart={onLogin} />
                <SystemArchitecture />
                <Features />
                <AgentSystem />

                {/* Value Proposition / CTA Section */}
                <section className="py-24 relative overflow-hidden">
                    <div className="absolute inset-0 bg-emerald-900/10"></div>
                    <div className="max-w-4xl mx-auto px-6 text-center relative z-10">
                        <h2 className="text-3xl md:text-5xl font-bold text-white mb-6">Ready to secure your network?</h2>
                        <p className="text-xl text-gray-400 mb-10">
                            Join top healthcare payers using HealthGuard to reduce risk and optimize operational efficiency.
                        </p>
                        <button className="bg-white text-black px-8 py-4 rounded-lg font-bold text-lg hover:bg-gray-100 transition-colors shadow-[0_0_40px_rgba(255,255,255,0.3)]" onClick={onLogin}>
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
