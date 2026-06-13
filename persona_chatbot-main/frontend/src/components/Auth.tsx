import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate, useLocation } from 'react-router-dom';
import { EyeIcon, EyeSlashIcon, ExclamationCircleIcon } from '@heroicons/react/24/outline';
import { login, loginWithGoogle } from '../services/auth';
import authBg from '../assets/images/auth-bg.webp';
import googleLogo from '../assets/icons/Google_G_logo.svg';

const Auth: React.FC = () => {
    const navigate = useNavigate();
    const location = useLocation();
    
    // Parse tab parameter from URL (default to login, tab=register to register)
    const urlParams = new URLSearchParams(location.search);
    const initialTab = urlParams.get('tab') === 'register' ? false : true;
    
    const [isLogin, setIsLogin] = useState(initialTab);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [rememberMe, setRememberMe] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [isGoogleLoading, setIsGoogleLoading] = useState(false);

    useEffect(() => {
        const currentTab = new URLSearchParams(location.search).get('tab');
        if (currentTab === 'register') {
            setIsLogin(false);
        } else {
            setIsLogin(true);
        }
    }, [location.search]);

    useEffect(() => {
        // Check for OAuth errors in URL
        const urlParams = new URLSearchParams(location.search);
        const oauthError = urlParams.get('error');
        if (oauthError === 'oauth_failed') {
            setError('Google sign-in failed. Please try again.');
        } else if (oauthError === 'no_code') {
            setError('Google sign-in was cancelled.');
        }
    }, [location]);

    const handleTabChange = (mode: boolean) => {
        setIsLogin(mode);
        setError('');
        setEmail('');
        setPassword('');
        navigate(`/login?tab=${mode ? 'login' : 'register'}`, { replace: true });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setIsLoading(true);

        const emailTrimmed = email.trim();
        if (!emailTrimmed) {
            setError('Please enter your email address');
            setIsLoading(false);
            return;
        }
        if (!password.trim()) {
            setError('Please enter your password');
            setIsLoading(false);
            return;
        }

        try {
            await login(emailTrimmed, password, rememberMe);
            navigate('/');
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Authentication failed. Please try again.';
            setError(errorMessage);
            setIsLoading(false);
        }
    };

    const handleGoogleSignIn = async () => {
        setError('');
        setIsGoogleLoading(true);
        try {
            await loginWithGoogle();
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
            <div className="absolute inset-0 bg-gradient-to-br from-[#0B0F19]/95 via-purple-950/40 to-[#0B0F19]/95 backdrop-blur-sm" />
            
            {/* Ambient glows */}
            <div className="absolute top-1/4 left-1/4 w-96 h-96 rounded-full bg-purple-600/10 blur-[100px] pointer-events-none" />
            <div className="absolute bottom-1/4 right-1/4 w-96 h-96 rounded-full bg-blue-600/10 blur-[100px] pointer-events-none" />

            <div className="w-full max-w-md relative z-10">
                <div className="text-center mb-8">
                    <span className="text-3xl font-black bg-gradient-to-r from-purple-500 via-indigo-400 to-cyan-400 bg-clip-text text-transparent font-outfit tracking-widest cursor-pointer" onClick={() => navigate('/')}>
                        PERSONA.AI
                    </span>
                    <p className="text-gray-400 text-xs mt-2 uppercase tracking-widest">AI Entertainment Platform</p>
                </div>

                <div className="glass-panel p-8 rounded-2xl border border-white/10 shadow-2xl relative">
                    {/* Tab Navigation */}
                    <div className="flex bg-white/5 p-1 rounded-xl mb-8 border border-white/5">
                        <button
                            type="button"
                            onClick={() => handleTabChange(true)}
                            className={`flex-1 py-2.5 rounded-lg text-sm font-semibold transition-all duration-300 ${
                                isLogin 
                                    ? "bg-purple-600 text-white shadow-lg shadow-purple-500/20" 
                                    : "text-gray-400 hover:text-white"
                            }`}
                        >
                            Sign In
                        </button>
                        <button
                            type="button"
                            onClick={() => handleTabChange(false)}
                            className={`flex-1 py-2.5 rounded-lg text-sm font-semibold transition-all duration-300 ${
                                !isLogin 
                                    ? "bg-purple-600 text-white shadow-lg shadow-purple-500/20" 
                                    : "text-gray-400 hover:text-white"
                            }`}
                        >
                            Register
                        </button>
                    </div>

                    {isLogin ? (
                        <form onSubmit={handleSubmit} className="space-y-5">
                            <div>
                                <label htmlFor="email" className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
                                    Email Address
                                </label>
                                <input
                                    id="email"
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className="w-full px-4 py-3 rounded-xl bg-white/5 text-white placeholder-gray-500 border border-white/10 focus:outline-none focus:border-purple-500/60 focus:ring-1 focus:ring-purple-500/60 transition-all text-sm"
                                    placeholder="you@example.com"
                                    required
                                />
                            </div>

                            <div>
                                <label htmlFor="password" className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
                                    Password
                                </label>
                                <div className="relative">
                                    <input
                                        id="password"
                                        type={showPassword ? "text" : "password"}
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        className="w-full px-4 py-3 pr-10 rounded-xl bg-white/5 text-white placeholder-gray-500 border border-white/10 focus:outline-none focus:border-purple-500/60 focus:ring-1 focus:ring-purple-500/60 transition-all text-sm"
                                        placeholder="Enter your password"
                                        required
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="absolute right-3.5 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-300 focus:outline-none transition-colors"
                                    >
                                        {showPassword ? (
                                            <EyeSlashIcon className="w-4 h-4" />
                                        ) : (
                                            <EyeIcon className="w-4 h-4" />
                                        )}
                                    </button>
                                </div>
                            </div>

                            <div className="flex items-center justify-between text-xs text-gray-400">
                                <label className="flex items-center gap-2 cursor-pointer hover:text-gray-300 transition-colors">
                                    <input
                                        type="checkbox"
                                        checked={rememberMe}
                                        onChange={(e) => setRememberMe(e.target.checked)}
                                        className="w-4 h-4 rounded bg-white/5 border-white/10 text-purple-600 focus:ring-purple-500/50 cursor-pointer"
                                    />
                                    Keep me signed in for 30 days
                                </label>
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
                                disabled={isLoading}
                                className="w-full px-4 py-3.5 text-white text-sm font-bold bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 rounded-xl shadow-xl shadow-purple-500/20 hover:shadow-purple-500/30 transform active:scale-95 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                            >
                                {isLoading ? (
                                    <>
                                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                                        <span>Processing...</span>
                                    </>
                                ) : (
                                    <span>Sign In</span>
                                )}
                            </button>

                            <div className="relative my-6 flex items-center justify-center">
                                <div className="absolute inset-0 flex items-center">
                                    <div className="w-full border-t border-white/5"></div>
                                </div>
                                <span className="relative px-3 bg-[#0B0F19]/80 text-[10px] text-gray-500 uppercase tracking-widest font-semibold">Or connect with</span>
                            </div>

                            <button
                                type="button"
                                onClick={handleGoogleSignIn}
                                disabled={isGoogleLoading}
                                className="w-full px-4 py-3.5 text-white text-sm font-semibold bg-white/5 hover:bg-white/10 rounded-xl border border-white/10 hover:border-white/20 transition-all flex items-center justify-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {isGoogleLoading ? (
                                    <>
                                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                                        <span>Connecting...</span>
                                    </>
                                ) : (
                                    <>
                                        <img src={googleLogo} alt="Google logo" className="w-4 h-4" />
                                        <span>Sign in with Google</span>
                                    </>
                                )}
                            </button>
                        </form>
                    ) : (
                        <div className="space-y-6 text-center py-4">
                            <p className="text-gray-400 text-xs leading-relaxed max-w-sm mx-auto">
                                Join PERSONA.AI to chat with movie legends, regional protagonists, and historical strategists. Create your account instantly with your Google account.
                            </p>

                            {error && (
                                <motion.div
                                    initial={{ opacity: 0, y: -10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className="p-3.5 rounded-xl bg-red-500/10 border border-red-500/20 flex items-start gap-2.5 text-left"
                                >
                                    <ExclamationCircleIcon className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" />
                                    <p className="text-red-400 text-xs leading-relaxed flex-1">
                                        {error}
                                    </p>
                                </motion.div>
                            )}

                            <button
                                type="button"
                                onClick={handleGoogleSignIn}
                                disabled={isGoogleLoading}
                                className="w-full px-4 py-4 text-white text-sm font-bold bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 rounded-xl transition-all flex items-center justify-center gap-3 shadow-xl shadow-purple-500/20 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {isGoogleLoading ? (
                                    <>
                                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                                        <span>Connecting...</span>
                                    </>
                                ) : (
                                    <>
                                        <img src={googleLogo} alt="Google logo" className="w-5 h-5" />
                                        <span>Continue using Google</span>
                                    </>
                                )}
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default Auth;