import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { getToken, getCurrentUser, logout } from '../services/auth';

const Settings: React.FC = () => {
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState<'profile' | 'preferences'>('profile');
    const [userEmail, setUserEmail] = useState('');
    const [username, setUsername] = useState('');
    
    // Preferences state synced with localStorage
    const [voicePlayback, setVoicePlayback] = useState(() => {
        return localStorage.getItem('tts_enabled') === 'true';
    });
    const [themeParticles, setThemeParticles] = useState(() => {
        return localStorage.getItem('particles_enabled') !== 'false'; // Defaults to true
    });

    useEffect(() => {
        if (!getToken()) {
            navigate('/login');
            return;
        }

        getCurrentUser()
            .then(user => {
                if (user) {
                    setUserEmail(user.email);
                    setUsername(user.username);
                }
            })
            .catch(err => console.error("Failed to load user profile in settings", err));
    }, [navigate]);

    const handleVoicePlaybackToggle = () => {
        const nextVal = !voicePlayback;
        setVoicePlayback(nextVal);
        localStorage.setItem('tts_enabled', String(nextVal));
    };

    const handleThemeParticlesToggle = () => {
        const nextVal = !themeParticles;
        setThemeParticles(nextVal);
        localStorage.setItem('particles_enabled', String(nextVal));
    };

    return (
        <div className="min-h-screen bg-[#0B0F19] text-white selection:bg-purple-600 selection:text-white font-['Inter'] relative">
            {/* Ambient glows */}
            <div className="absolute top-[-20%] left-[-10%] w-[600px] h-[600px] rounded-full bg-purple-900/10 blur-[150px] pointer-events-none" />
            <div className="absolute bottom-[-10%] right-[-10%] w-[500px] h-[500px] rounded-full bg-blue-900/10 blur-[120px] pointer-events-none" />

            {/* Header */}
            <header className="w-full py-5 px-6 md:px-12 flex items-center justify-between border-b border-white/5 bg-[#0B0F19]/50 backdrop-blur-md sticky top-0 z-50">
                <div className="flex items-center gap-2 cursor-pointer" onClick={() => navigate('/')}>
                    <span className="text-2xl font-black bg-gradient-to-r from-purple-500 via-indigo-400 to-cyan-400 bg-clip-text text-transparent font-outfit tracking-wider">
                        PERSONA.AI
                    </span>
                </div>
                <div className="flex items-center gap-4">
                    <button 
                        onClick={() => navigate('/chat')}
                        className="text-sm font-semibold hover:text-purple-400 transition-colors"
                    >
                        Conversations
                    </button>
                    <button 
                        onClick={() => navigate('/dashboard')}
                        className="text-sm font-semibold hover:text-purple-400 transition-colors"
                    >
                        Dashboard
                    </button>
                </div>
            </header>

            <main className="px-6 md:px-12 py-16 max-w-4xl mx-auto space-y-10 relative z-10">
                <div>
                    <h1 className="text-4xl font-black font-outfit tracking-tight mb-2">Settings</h1>
                    <p className="text-gray-400 text-sm">Configure your AI chat experience and manage account preferences.</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    {/* Left Navigation Menu */}
                    <div className="space-y-2">
                        <button 
                            onClick={() => setActiveTab('profile')}
                            className={`w-full text-left px-4 py-2.5 rounded-lg text-sm font-bold transition-all ${
                                activeTab === 'profile'
                                    ? "bg-purple-600 text-white shadow-md shadow-purple-500/10"
                                    : "text-gray-400 hover:bg-white/5 hover:text-white"
                            }`}
                        >
                            👤 Account Profile
                        </button>
                        <button 
                            onClick={() => setActiveTab('preferences')}
                            className={`w-full text-left px-4 py-2.5 rounded-lg text-sm font-bold transition-all ${
                                activeTab === 'preferences'
                                    ? "bg-purple-600 text-white shadow-md shadow-purple-500/10"
                                    : "text-gray-400 hover:bg-white/5 hover:text-white"
                            }`}
                        >
                            ⚙️ Chat Preferences
                        </button>
                        <button 
                            onClick={logout}
                            className="w-full text-left px-4 py-2.5 rounded-lg text-sm font-semibold text-red-400 hover:bg-red-500/10 transition-all mt-6"
                        >
                            🚪 Log Out
                        </button>
                    </div>

                    {/* Right Configuration Pane */}
                    <div className="md:col-span-2 min-h-[300px]">
                        <AnimatePresence mode="wait">
                            {activeTab === 'profile' && (
                                <motion.div
                                    key="profile"
                                    initial={{ opacity: 0, x: 10 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: -10 }}
                                    className="glass-panel p-6 rounded-2xl border border-white/5 space-y-4 shadow-xl"
                                >
                                    <h3 className="text-base font-bold font-outfit uppercase tracking-wider text-purple-400 mb-2">Account Profile</h3>
                                    
                                    <div className="space-y-3">
                                        <div>
                                            <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Email Address</label>
                                            <input 
                                                type="text" 
                                                value={userEmail} 
                                                disabled 
                                                className="w-full px-4 py-2.5 rounded-lg bg-white/5 border border-white/5 text-gray-400 text-sm cursor-not-allowed"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Username</label>
                                            <input 
                                                type="text" 
                                                value={username} 
                                                disabled 
                                                className="w-full px-4 py-2.5 rounded-lg bg-white/5 border border-white/5 text-gray-400 text-sm cursor-not-allowed"
                                            />
                                        </div>
                                    </div>
                                    
                                    <div className="pt-4 flex items-center justify-between border-t border-white/5 mt-6">
                                        <span className="text-xs text-gray-400">Need to modify password credentials?</span>
                                        <button 
                                            onClick={() => navigate('/set-password')}
                                            className="px-4 py-2 text-xs font-semibold bg-white/10 hover:bg-white/20 border border-white/10 rounded-lg transition-all"
                                        >
                                            Change Password
                                        </button>
                                    </div>
                                </motion.div>
                            )}

                            {activeTab === 'preferences' && (
                                <motion.div
                                    key="preferences"
                                    initial={{ opacity: 0, x: 10 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: -10 }}
                                    className="glass-panel p-6 rounded-2xl border border-white/5 space-y-4 shadow-xl"
                                >
                                    <h3 className="text-base font-bold font-outfit uppercase tracking-wider text-purple-400 mb-2">Chat Preferences</h3>

                                    <div className="space-y-6">
                                        <div className="flex items-center justify-between">
                                            <div>
                                                <div className="text-sm font-bold text-gray-100">Text-to-Speech Playback</div>
                                                <p className="text-[11px] text-gray-400 max-w-sm mt-0.5">Automatically read character responses aloud using browser voice synthesis.</p>
                                            </div>
                                            <button 
                                                onClick={handleVoicePlaybackToggle}
                                                className={`w-12 h-6 rounded-full transition-all relative ${
                                                    voicePlayback ? "bg-purple-600" : "bg-white/10"
                                                }`}
                                            >
                                                <div className={`w-4 h-4 rounded-full bg-white absolute top-1 transition-all ${
                                                    voicePlayback ? "right-1" : "left-1"
                                                }`} />
                                            </button>
                                        </div>

                                        <div className="flex items-center justify-between border-t border-white/5 pt-4">
                                            <div>
                                                <div className="text-sm font-bold text-gray-100">Background Particle Effects</div>
                                                <p className="text-[11px] text-gray-400 max-w-sm mt-0.5">Display twinkling futuristic background particles on the landing screen.</p>
                                            </div>
                                            <button 
                                                onClick={handleThemeParticlesToggle}
                                                className={`w-12 h-6 rounded-full transition-all relative ${
                                                    themeParticles ? "bg-purple-600" : "bg-white/10"
                                                }`}
                                            >
                                                <div className={`w-4 h-4 rounded-full bg-white absolute top-1 transition-all ${
                                                    themeParticles ? "right-1" : "left-1"
                                                }`} />
                                            </button>
                                        </div>
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                </div>
            </main>
        </div>
    );
};

export default Settings;
