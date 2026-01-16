import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate, useLocation } from 'react-router-dom';
import { EyeIcon, EyeSlashIcon, ExclamationCircleIcon } from '@heroicons/react/24/outline';
import { login, loginWithGoogle } from '../services/auth';
import authBg from '../assets/images/auth-bg.webp';
import googleLogo from '../assets/icons/Google_G_logo.svg';

const Auth: React.FC = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [rememberMe, setRememberMe] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState('');
    const [isGoogleLoading, setIsGoogleLoading] = useState(false);
    const navigate = useNavigate();
    const location = useLocation();

    useEffect(() => {
        // Check for OAuth errors in URL
        const urlParams = new URLSearchParams(location.search);
        const oauthError = urlParams.get('error');
        if (oauthError === 'oauth_failed') {
            setError('Google sign-in failed. Please try again.');
        } else if (oauthError === 'no_code') {
            setError('Google sign-in was cancelled.');
        }
        // Don't clear existing errors - let them persist until user interaction
    }, [location]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        // Basic client-side validation
        if (!email.trim()) {
            setError('Please enter your email address');
            return;
        }
        if (!password.trim()) {
            setError('Please enter your password');
            return;
        }

        try {
            await login(email.trim(), password, rememberMe);
            // Only navigate on success
            navigate('/');
        } catch (error) {
            // Error message is already user-friendly from the backend
            const errorMessage = error instanceof Error ? error.message : 'Authentication failed. Please try again.';
            setError(errorMessage);
            // Don't navigate on error - stay on the page to show the error
        }
    };

    const handleGoogleSignIn = async () => {
        setError('');
        setIsGoogleLoading(true);
        try {
            await loginWithGoogle();
            // User will be redirected to Google, so we don't need to do anything else here
        } catch (error) {
            setIsGoogleLoading(false);
            setError(error instanceof Error ? error.message : 'Failed to initiate Google sign-in');
        }
    };

    return (
        <div 
            style={{ backgroundImage: `url(${authBg})` }}
            className="min-h-screen flex items-center justify-center p-4 relative bg-cover bg-center bg-no-repeat font-['Inter']"
        >
            <div className="absolute inset-0 bg-gradient-to-br from-gray-900/90 via-purple-900/80 to-gray-900/90 backdrop-blur-sm" />
            
            {/* Glass card effect */}
            <motion.div
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="w-full max-w-md p-8 rounded-2xl bg-white/10 backdrop-blur-xl shadow-2xl border border-white/20 relative z-10"
            >
                <motion.div
                    initial={{ y: -20 }}
                    animate={{ y: 0 }}
                    className="text-center mb-8"
                >
                    <h2 className="text-3xl font-bold text-white mb-2">
                        Welcome back
                    </h2>
                    <p className="text-gray-300 text-sm">
                        Sign in with your email and password or continue with Google
                    </p>
                </motion.div>

                <form onSubmit={handleSubmit} className="space-y-6">
                    <div>
                        <label htmlFor="email" className="block text-sm font-medium text-gray-300 mb-2">
                            Email Address
                        </label>
                        <motion.input
                            whileFocus={{ scale: 1.01 }}
                            id="email"
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="w-full px-4 py-3 rounded-lg bg-gray-800/50 text-white placeholder-gray-400 border border-gray-700/50 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200"
                            placeholder="you@example.com"
                            required
                        />
                    </div>

                    <div>
                        <label htmlFor="password" className="block text-sm font-medium text-gray-300 mb-2">
                            Password
                        </label>
                        <div className="relative">
                            <motion.input
                                whileFocus={{ scale: 1.01 }}
                                id="password"
                                type={showPassword ? "text" : "password"}
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="w-full px-4 py-3 pr-10 rounded-lg bg-gray-800/50 text-white placeholder-gray-400 border border-gray-700/50 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200"
                                placeholder="Enter your password"
                                required
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-300 focus:outline-none transition-colors"
                                aria-label={showPassword ? "Hide password" : "Show password"}
                            >
                                {showPassword ? (
                                    <EyeSlashIcon className="w-5 h-5" />
                                ) : (
                                    <EyeIcon className="w-5 h-5" />
                                )}
                            </button>
                        </div>
                    </div>

                    <div className="flex items-center">
                        <input
                            type="checkbox"
                            id="remember"
                            checked={rememberMe}
                            onChange={(e) => setRememberMe(e.target.checked)}
                            className="w-4 h-4 bg-gray-800/50 border border-gray-700/50 rounded focus:ring-2 focus:ring-purple-500 text-purple-600 cursor-pointer transition-all duration-200"
                        />
                        <label htmlFor="remember" className="ml-2 text-sm text-gray-300 cursor-pointer hover:text-gray-200 transition-colors">
                            Keep me signed in for 30 days
                        </label>
                    </div>

                    {error && (
                        <motion.div
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            className="p-4 rounded-lg bg-red-500/10 border border-red-500/30 flex items-start gap-3"
                        >
                            <ExclamationCircleIcon className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                            <p className="text-red-400 text-sm flex-1 leading-relaxed">
                                {error}
                            </p>
                        </motion.div>
                    )}

                    <motion.button
                        whileHover={{ scale: 1.01, backgroundColor: 'rgba(147, 51, 234, 0.9)' }}
                        whileTap={{ scale: 0.99 }}
                        type="submit"
                        className="w-full px-4 py-3 text-white text-sm font-medium bg-gradient-to-r from-purple-600 to-blue-600 rounded-lg hover:from-purple-500 hover:to-blue-500 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 focus:ring-offset-gray-800 shadow-lg shadow-purple-500/20 transition-all duration-200"
                    >
                        Sign In
                    </motion.button>

                    <div className="relative my-6">
                        <div className="absolute inset-0 flex items-center">
                            <div className="w-full border-t border-gray-600"></div>
                        </div>
                        <div className="relative flex justify-center text-sm">
                            <span className="px-2 bg-gray-900 text-gray-400 rounded-full">Or continue with</span>
                        </div>
                    </div>

                    <motion.button
                        whileHover={{ scale: 1.01 }}
                        whileTap={{ scale: 0.99 }}
                        type="button"
                        onClick={handleGoogleSignIn}
                        disabled={isGoogleLoading}
                        className="w-full px-4 py-3 text-white text-sm font-medium bg-white/10 hover:bg-white/20 rounded-lg border border-white/20 focus:outline-none focus:ring-2 focus:ring-white/50 focus:ring-offset-2 focus:ring-offset-gray-800 transition-all duration-200 flex items-center justify-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {isGoogleLoading ? (
                            <>
                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                                <span>Signing in...</span>
                            </>
                        ) : (
                            <>
                                <img src={googleLogo} alt="Google logo" className="w-5 h-5" />
                                <span>Sign in with Google</span>
                            </>
                        )}
                    </motion.button>

                </form>
            </motion.div>
        </div>
    );
};

export default Auth;