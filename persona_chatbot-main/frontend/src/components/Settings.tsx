import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getToken, getCurrentUser, logout } from '../services/auth';

const Settings: React.FC = () => {
    const navigate = useNavigate();
    const [userEmail, setUserEmail] = useState('');
    const [username, setUsername] = useState('');
    const [voicePlayback, setVoicePlayback] = useState(false);
    const [themeParticles, setThemeParticles] = useState(true);

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

    return (
        <div className="min-h-screen bg-[#0B0F19] text-white selection:bg-purple-600 selection:text-white font-['Inter']">
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

            <main className="px-6 md:px-12 py-16 max-w-4xl mx-auto space-y-10">
                <div>
                    <h1 className="text-4xl font-black font-outfit tracking-tight mb-2">Settings</h1>
                    <p className="text-gray-400 text-sm">Configure your AI chat experience and manage account preferences.</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    {/* Left Navigation Menu */}
                    <div className="space-y-2">
                        <button className="w-full text-left px-4 py-2.5 rounded-lg text-sm font-bold bg-purple-600 text-white shadow-md shadow-purple-500/10">
                            👤 Account Profile
                        </button>
                        <button className="w-full text-left px-4 py-2.5 rounded-lg text-sm font-semibold text-gray-400 hover:bg-white/5 transition-all">
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
                    <div className="md:col-span-2 space-y-8">
                        {/* Profile Section */}
                        <div className="glass-panel p-6 rounded-2xl border border-white/5 space-y-4">
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
                            
                            <div className="pt-4 flex items-center justify-between">
                                <span className="text-xs text-gray-400">Need to modify password credentials?</span>
                                <button 
                                    onClick={() => navigate('/set-password')}
                                    className="px-4 py-2 text-xs font-semibold bg-white/10 hover:bg-white/20 border border-white/10 rounded-lg transition-all"
                                >
                                    Change Password
                                </button>
                            </div>
                        </div>

                        {/* Chat Preferences Section */}
                        <div className="glass-panel p-6 rounded-2xl border border-white/5 space-y-4">
                            <h3 className="text-base font-bold font-outfit uppercase tracking-wider text-purple-400 mb-2">Preferences</h3>

                            <div className="space-y-4">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <div className="text-sm font-bold">Text-to-Speech Playback</div>
                                        <p className="text-[11px] text-gray-400">Read character responses aloud using browser voice synthesis.</p>
                                    </div>
                                    <button 
                                        onClick={() => setVoicePlayback(!voicePlayback)}
                                        className={`w-12 h-6 rounded-full transition-all relative ${
                                            voicePlayback ? "bg-purple-600" : "bg-white/10"
                                        }`}
                                    >
                                        <div className={`w-4 h-4 rounded-full bg-white absolute top-1 transition-all ${
                                            voicePlayback ? "right-1" : "left-1"
                                        }`} />
                                    </button>
                                </div>

                                <div className="flex items-center justify-between">
                                    <div>
                                        <div className="text-sm font-bold">Background Particle Effects</div>
                                        <p className="text-[11px] text-gray-400">Display twinkling background particles on the landing screen.</p>
                                    </div>
                                    <button 
                                        onClick={() => setThemeParticles(!themeParticles)}
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
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
};

export default Settings;
