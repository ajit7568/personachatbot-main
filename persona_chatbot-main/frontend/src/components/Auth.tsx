import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate, useLocation } from 'react-router-dom';
import { login, register, loginWithGoogle } from '../services/auth';
import authBg from '../assets/images/auth-bg.webp';
import googleLogo from '../assets/icons/Google_G_logo.svg';

interface AuthProps {
    mode?: 'login' | 'register';
}

const Auth: React.FC<AuthProps> = ({ mode = 'login' }) => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [isLogin, setIsLogin] = useState(mode === 'login');
    const [error, setError] = useState('');
    const [showSuccess, setShowSuccess] = useState(false);
    const [isGoogleLoading, setIsGoogleLoading] = useState(false);
    const navigate = useNavigate();
    const location = useLocation();

    useEffect(() => {
        setIsLogin(mode === 'login');
        // Check for OAuth errors in URL
        const urlParams = new URLSearchParams(location.search);
        const oauthError = urlParams.get('error');
        if (oauthError === 'oauth_failed') {
            setError('Google sign-in failed. Please try again.');
        } else if (oauthError === 'no_code') {
            setError('Google sign-in was cancelled.');
        }
    }, [mode, location]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setShowSuccess(false);

        try {
            if (isLogin) {
                await login(email, password);
                navigate('/');
            } else {
                await register(email, password);
                setShowSuccess(true);
                setEmail('');
                setPassword('');
                setTimeout(() => {
                    setShowSuccess(false);
                    navigate('/login');
                }, 2000);
            }
        } catch (error) {
            setError(error instanceof Error ? error.message : 'Authentication failed');
        }
    };

    const toggleMode = () => {
        const newMode = isLogin ? 'register' : 'login';
        setError('');
        navigate(`/${newMode}`);
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
            
            {/* Success Message Overlay */}
            <AnimatePresence>
                {showSuccess && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.5 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.5 }}
                        className="fixed inset-0 flex items-center justify-center z-50 bg-black/50 backdrop-blur-sm"
                    >
                        <motion.div
                            initial={{ y: 20 }}
                            animate={{ y: 0 }}
                            className="bg-gradient-to-br from-green-500 to-emerald-600 p-6 rounded-2xl shadow-xl text-white text-center"
                        >
                            <motion.div
                                animate={{ 
                                    rotate: [0, 10, -10, 10, 0],
                                    scale: [1, 1.2, 1] 
                                }}
                                transition={{ duration: 0.5 }}
                                className="text-4xl mb-2"
                            >
                                🎉
                            </motion.div>
                            <h3 className="text-xl font-bold mb-1">Account Created Successfully!</h3>
                            <p className="text-sm opacity-90">Redirecting to login...</p>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

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
                        {isLogin ? 'Welcome Back' : 'Create Account'}
                    </h2>
                    <p className="text-gray-300 text-sm">
                        {isLogin 
                            ? 'Sign in to continue chatting with your favorite characters' 
                            : 'Join us and start chatting with amazing characters'}
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
                        <motion.input
                            whileFocus={{ scale: 1.01 }}
                            id="password"
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="w-full px-4 py-3 rounded-lg bg-gray-800/50 text-white placeholder-gray-400 border border-gray-700/50 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200"
                            placeholder="Enter your password"
                            required
                        />
                    </div>

                    {error && (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="p-4 rounded-lg bg-red-500/10 border border-red-500/20"
                        >
                            <p className="text-red-500 text-sm text-center">
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
                        {isLogin ? 'Sign In' : 'Create Account'}
                    </motion.button>

                    <div className="relative my-6">
                        <div className="absolute inset-0 flex items-center">
                            <div className="w-full border-t border-gray-600"></div>
                        </div>
                        <div className="relative flex justify-center text-sm">
                            <span className="px-2 bg-transparent text-gray-400">Or continue with</span>
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

                    <div className="text-center mt-6">
                        <button
                            type="button"
                            onClick={toggleMode}
                            className="text-sm text-gray-400 hover:text-white transition-colors duration-200"
                        >
                            {isLogin 
                                ? "Don't have an account? Create one" 
                                : 'Already have an account? Sign in'}
                        </button>
                    </div>
                </form>
            </motion.div>
        </div>
    );
};

export default Auth;