import React, { useEffect, useState } from 'react';
import { ShieldCheck, Lock, CheckCircle } from 'lucide-react';

interface LoginTransitionProps {
    onComplete: () => void;
}

const LoginTransition: React.FC<LoginTransitionProps> = ({ onComplete }) => {
    const [step, setStep] = useState(0);

    useEffect(() => {
        const timers = [
            setTimeout(() => setStep(1), 800),
            setTimeout(() => setStep(2), 1600),
            setTimeout(() => setStep(3), 2400),
            setTimeout(() => onComplete(), 3000),
        ];
        return () => timers.forEach(clearTimeout);
    }, [onComplete]);

    return (
        <div className="fixed inset-0 bg-gray-900 flex flex-col items-center justify-center z-50 text-white">
            <div className="w-full max-w-md p-8 bg-gray-800/50 backdrop-blur-xl rounded-2xl border border-white/10 shadow-2xl relative overflow-hidden">
                {/* Abstract background glow */}
                <div className="absolute -top-20 -left-20 w-64 h-64 bg-emerald-500/20 rounded-full blur-[80px]"></div>
                <div className="absolute -bottom-20 -right-20 w-64 h-64 bg-cyan-500/20 rounded-full blur-[80px]"></div>

                <div className="relative z-10 flex flex-col items-center">
                    <div className="w-16 h-16 mb-6 relative">
                        <div className="absolute inset-0 animate-ping opacity-30 bg-emerald-500 rounded-full"></div>
                        <div className="bg-gradient-to-br from-emerald-400 to-cyan-500 w-full h-full rounded-xl flex items-center justify-center shadow-lg shadow-emerald-500/20">
                            <ShieldCheck className="w-8 h-8 text-black" />
                        </div>
                    </div>

                    <h2 className="text-2xl font-bold mb-8">Accessing Secure Portal</h2>

                    <div className="w-full space-y-4">
                        {/* Step 1 */}
                        <div className={`flex items-center space-x-3 transition-opacity duration-500 ${step >= 0 ? 'opacity-100' : 'opacity-0'}`}>
                            <div className={`w-5 h-5 rounded-full flex items-center justify-center ${step > 0 ? 'bg-emerald-500' : 'bg-gray-700 animate-pulse'}`}>
                                {step > 0 && <CheckCircle className="w-3 h-3 text-black" />}
                            </div>
                            <span className={step > 0 ? 'text-emerald-400' : 'text-gray-400'}>Establishing secure handshake...</span>
                        </div>

                        {/* Step 2 */}
                        <div className={`flex items-center space-x-3 transition-opacity duration-500 ${step >= 1 ? 'opacity-100' : 'opacity-0'}`}>
                            <div className={`w-5 h-5 rounded-full flex items-center justify-center ${step > 1 ? 'bg-emerald-500' : 'bg-gray-700 animate-pulse'}`}>
                                {step > 1 && <CheckCircle className="w-3 h-3 text-black" />}
                            </div>
                            <span className={step > 1 ? 'text-emerald-400' : 'text-gray-400'}>Verifying credentials...</span>
                        </div>

                        {/* Step 3 */}
                        <div className={`flex items-center space-x-3 transition-opacity duration-500 ${step >= 2 ? 'opacity-100' : 'opacity-0'}`}>
                            <div className={`w-5 h-5 rounded-full flex items-center justify-center ${step > 2 ? 'bg-emerald-500' : 'bg-gray-700 animate-pulse'}`}>
                                {step > 2 && <CheckCircle className="w-3 h-3 text-black" />}
                            </div>
                            <span className={step > 2 ? 'text-emerald-400 top-0 left-0' : 'text-gray-400'}>Loading Orchestrator Dashboard...</span>
                        </div>
                    </div>

                    <div className="mt-8 w-full bg-gray-700 h-1 rounded-full overflow-hidden">
                        <div className="bg-emerald-500 h-full transition-all duration-3000 ease-out" style={{ width: step === 3 ? '100%' : `${(step + 1) * 25}%` }}></div>
                    </div>

                </div>
            </div>
        </div>
    );
};

export default LoginTransition;
