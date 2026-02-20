import React, { useState } from 'react';
import { X, CheckCircle } from 'lucide-react';

interface RequestDemoModalProps {
    onClose: () => void;
}

const RequestDemoModal: React.FC<RequestDemoModalProps> = ({ onClose }) => {
    const [submitted, setSubmitted] = useState(false);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitted(true);
        setTimeout(() => {
            onClose();
        }, 3000);
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white dark:bg-[#0a0a0a] border border-slate-200 dark:border-white/10 p-8 rounded-2xl w-full max-w-md relative shadow-2xl">
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 dark:hover:text-white transition-colors"
                >
                    <X size={20} />
                </button>

                {!submitted ? (
                    <>
                        <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">Request Access</h2>
                        <p className="text-slate-500 dark:text-gray-400 text-sm mb-6">
                            See how VERA can automate your provider credentialing.
                        </p>

                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <label className="block text-xs font-semibold text-slate-500 dark:text-gray-400 uppercase tracking-wider mb-1">Company Email</label>
                                <input
                                    type="email"
                                    required
                                    placeholder="name@company.com"
                                    className="w-full bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-lg px-4 py-3 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-semibold text-slate-500 dark:text-gray-400 uppercase tracking-wider mb-1">Name</label>
                                <input
                                    type="text"
                                    required
                                    placeholder="Jane Doe"
                                    className="w-full bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-lg px-4 py-3 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                                />
                            </div>

                            <button
                                type="submit"
                                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3 rounded-lg mt-2 transition-colors shadow-lg shadow-emerald-500/20"
                            >
                                Submit Request
                            </button>
                        </form>
                    </>
                ) : (
                    <div className="text-center py-8">
                        <div className="mx-auto w-16 h-16 bg-emerald-100 dark:bg-emerald-500/20 rounded-full flex items-center justify-center mb-4 text-emerald-600 dark:text-emerald-400">
                            <CheckCircle size={32} />
                        </div>
                        <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">Request Received</h2>
                        <p className="text-slate-500 dark:text-gray-400 text-sm">
                            Our team will be in touch shortly to schedule your personalized demo.
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default RequestDemoModal;
