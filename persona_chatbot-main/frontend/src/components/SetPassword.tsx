import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { EyeIcon, EyeSlashIcon, ExclamationCircleIcon } from '@heroicons/react/24/outline';
import { setPassword } from '../services/auth';

const SetPassword: React.FC = () => {
    const [password, setPasswordValue] = useState('');
    const [confirmPassword, setConfirmPasswordValue] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [error, setError] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const navigate = useNavigate();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        if (password !== confirmPassword) {
            setError('Passwords do not match');
            return;
        }

        try {
            setIsSubmitting(true);
            await setPassword(password, confirmPassword);
            navigate('/', { replace: true });
        } catch (err) {
            setIsSubmitting(false);
            setError(
                err instanceof Error ? err.message : 'Failed to set password'
            );
        }
    };

    return (
        <div className="min-h-screen bg-[#0B0F19] flex items-center justify-center p-4 relative font-['Inter']">
            {/* Glowing background shapes */}
            <div className="absolute top-1/4 left-1/4 w-96 h-96 rounded-full bg-purple-600/10 blur-[100px] pointer-events-none" />
            <div className="absolute bottom-1/4 right-1/4 w-96 h-96 rounded-full bg-blue-600/10 blur-[100px] pointer-events-none" />

            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="w-full max-w-md p-8 rounded-2xl glass-panel border border-white/10 shadow-2xl relative z-10"
            >
                <h2 className="text-2xl font-bold text-white mb-2 text-center font-outfit">
                    Set your password
                </h2>
                <p className="text-gray-400 text-xs mb-6 text-center leading-relaxed">
                    You signed up with Google. Create a password so you can also
                    sign in with email and password.
                </p>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label
                            htmlFor="password"
                            className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2"
                        >
                            New password
                        </label>
                        <div className="relative">
                            <input
                                id="password"
                                type={showPassword ? "text" : "password"}
                                value={password}
                                onChange={(e) => setPasswordValue(e.target.value)}
                                className="w-full px-4 py-3 pr-10 rounded-xl bg-white/5 text-white placeholder-gray-500 border border-white/10 focus:outline-none focus:border-purple-500/60 focus:ring-1 focus:ring-purple-500/60 transition-all text-sm"
                                placeholder="Minimum 8 characters"
                                required
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute right-3.5 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-300 focus:outline-none transition-colors"
                                aria-label={showPassword ? "Hide password" : "Show password"}
                            >
                                {showPassword ? (
                                    <EyeSlashIcon className="w-4 h-4" />
                                ) : (
                                    <EyeIcon className="w-4 h-4" />
                                )}
                            </button>
                        </div>
                    </div>
                    <div>
                        <label
                            htmlFor="confirmPassword"
                            className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2"
                        >
                            Confirm password
                        </label>
                        <div className="relative">
                            <input
                                id="confirmPassword"
                                type={showConfirmPassword ? "text" : "password"}
                                value={confirmPassword}
                                onChange={(e) =>
                                    setConfirmPasswordValue(e.target.value)
                                }
                                className="w-full px-4 py-3 pr-10 rounded-xl bg-white/5 text-white placeholder-gray-500 border border-white/10 focus:outline-none focus:border-purple-500/60 focus:ring-1 focus:ring-purple-500/60 transition-all text-sm"
                                placeholder="Confirm new password"
                                required
                            />
                            <button
                                type="button"
                                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                className="absolute right-3.5 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-300 focus:outline-none transition-colors"
                                aria-label={showConfirmPassword ? "Hide password" : "Show password"}
                            >
                                {showConfirmPassword ? (
                                    <EyeSlashIcon className="w-4 h-4" />
                                ) : (
                                    <EyeIcon className="w-4 h-4" />
                                )}
                            </button>
                        </div>
                    </div>

                    {error && (
                        <motion.div
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="p-3.5 rounded-xl bg-red-500/10 border border-red-500/20 flex items-start gap-2.5"
                        >
                            <ExclamationCircleIcon className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" />
                            <p className="text-red-400 text-xs leading-relaxed flex-1">
                                {error}
                            </p>
                        </motion.div>
                    )}

                    <button
                        type="submit"
                        disabled={isSubmitting}
                        className="w-full px-4 py-3.5 text-white text-sm font-bold bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 rounded-xl shadow-xl shadow-purple-500/20 hover:shadow-purple-500/30 transform active:scale-95 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                    >
                        {isSubmitting ? 'Saving...' : 'Save password'}
                    </button>
                </form>
            </motion.div>
        </div>
    );
};

export default SetPassword;
