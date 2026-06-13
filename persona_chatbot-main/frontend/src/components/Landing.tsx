import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { getToken } from '../services/auth';
import { fetchCharacters, Character } from '../services/api';
import googleLogo from '../assets/icons/Google_G_logo.svg';

const Landing: React.FC = () => {
    const navigate = useNavigate();
    const [characters, setCharacters] = useState<Character[]>([]);
    const [loading, setLoading] = useState(true);
    const [isAuthenticated, setIsAuthenticated] = useState(false);

    useEffect(() => {
        setIsAuthenticated(!!getToken());
        
        fetchCharacters()
            .then(data => {
                // Take top 6 characters for preview
                setCharacters(data.slice(0, 6));
                setLoading(false);
            })
            .catch(err => {
                console.error("Failed to load preview characters", err);
                setLoading(false);
            });
    }, []);

    const features = [
        {
            title: "Dynamic Roleplay",
            desc: "Powered by advanced generative AI, characters maintain deep memory, lore consistency, and unique vocabulary.",
            icon: "🎭"
        },
        {
            title: "Real-Time Typing",
            desc: "Streaming responses (SSE) word-by-word mimic a natural chat cadence for highly interactive conversations.",
            icon: "⚡"
        },
        {
            title: "Custom Studio",
            desc: "Design your own custom personas from scratch with custom bios, traits, and dialogue templates.",
            icon: "🛠️"
        }
    ];

    return (
        <div className="min-h-screen bg-[#0B0F19] text-white overflow-hidden relative selection:bg-purple-600 selection:text-white font-['Inter']">
            {/* Glowing background circles */}
            <div className="absolute top-[-20%] left-[-10%] w-[600px] h-[600px] rounded-full bg-purple-900/10 blur-[150px] pointer-events-none" />
            <div className="absolute bottom-[-10%] right-[-10%] w-[500px] h-[500px] rounded-full bg-blue-900/10 blur-[120px] pointer-events-none" />
            
            {/* Header / Nav */}
            <header className="w-full py-5 px-6 md:px-12 flex items-center justify-between border-b border-white/5 bg-[#0B0F19]/50 backdrop-blur-md sticky top-0 z-50">
                <div className="flex items-center gap-2 cursor-pointer" onClick={() => navigate('/')}>
                    <span className="text-2xl font-black bg-gradient-to-r from-purple-500 via-indigo-400 to-cyan-400 bg-clip-text text-transparent font-outfit tracking-wider">
                        PERSONA.AI
                    </span>
                </div>
                <div className="flex items-center gap-4">
                    {isAuthenticated ? (
                        <button 
                            onClick={() => navigate('/chat')}
                            className="px-5 py-2.5 rounded-lg text-sm font-semibold bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 transition-all shadow-lg shadow-purple-500/20"
                        >
                            Open Application
                        </button>
                    ) : (
                        <>
                            <button 
                                onClick={() => navigate('/login')}
                                className="text-sm font-medium hover:text-purple-400 transition-colors"
                            >
                                Sign In
                            </button>
                            <button 
                                onClick={() => navigate('/login?tab=register')}
                                className="px-4 py-2 rounded-lg text-sm font-semibold bg-white/10 border border-white/10 hover:bg-white/20 transition-all"
                            >
                                Get Started
                            </button>
                        </>
                    )}
                </div>
            </header>

            {/* Hero Section */}
            <section className="relative z-10 px-6 md:px-12 py-20 md:py-32 max-w-7xl mx-auto flex flex-col items-center text-center">
                <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8 }}
                    className="max-w-4xl"
                >
                    <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/5 border border-white/10 text-xs font-semibold text-purple-300 tracking-wide mb-6">
                        <span>✨</span> Introducing Regional & Movie AI Personalities
                    </div>
                    
                    <h1 className="text-5xl md:text-7xl font-black font-outfit tracking-tight leading-tight mb-8">
                        Conversations with{" "}
                        <span className="bg-gradient-to-r from-purple-400 via-indigo-400 to-cyan-400 bg-clip-text text-transparent">
                            Legends & Icons
                        </span>
                    </h1>
                    
                    <p className="text-gray-400 text-lg md:text-xl leading-relaxed mb-12 max-w-2xl mx-auto">
                        Chat directly with iconic movie protagonists, regional archetypes, and mythological strategists. Powered by cutting-edge generative AI.
                    </p>

                    <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                        <button
                            onClick={() => navigate(isAuthenticated ? '/chat' : '/login')}
                            className="w-full sm:w-auto px-8 py-4 rounded-xl text-base font-bold bg-gradient-to-r from-purple-600 via-indigo-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 transition-all shadow-xl shadow-purple-500/30 transform hover:-translate-y-0.5"
                        >
                            Start Chatting Now
                        </button>
                        <button
                            onClick={() => navigate('/explore')}
                            className="w-full sm:w-auto px-8 py-4 rounded-xl text-base font-bold bg-white/5 hover:bg-white/10 border border-white/10 transition-all transform hover:-translate-y-0.5"
                        >
                            Explore Characters
                        </button>
                    </div>
                </motion.div>
            </section>

            {/* Character Showcase Section */}
            <section className="relative z-10 py-16 bg-gradient-to-b from-transparent via-white/5 to-transparent border-y border-white/5">
                <div className="max-w-7xl mx-auto px-6 md:px-12">
                    <div className="flex items-end justify-between mb-12">
                        <div>
                            <h2 className="text-3xl font-bold font-outfit tracking-tight mb-2">Featured Characters</h2>
                            <p className="text-gray-400 text-sm">Select a legend to initiate a dynamic roleplay conversation</p>
                        </div>
                        <button 
                            onClick={() => navigate('/explore')}
                            className="text-sm font-semibold text-purple-400 hover:text-purple-300 transition-colors flex items-center gap-1"
                        >
                            View All Directory &rarr;
                        </button>
                    </div>

                    {loading ? (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                            {[1, 2, 3].map(i => (
                                <div key={i} className="h-64 rounded-2xl bg-white/5 border border-white/10 animate-pulse" />
                            ))}
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                            {characters.map((char) => (
                                <div 
                                    key={char.id}
                                    className="glass-card p-6 rounded-2xl flex flex-col justify-between h-64 relative group cursor-pointer"
                                    onClick={() => navigate(isAuthenticated ? `/chat?character_id=${char.id}` : '/login')}
                                >
                                    <div className="flex justify-between items-start mb-4">
                                        <div className="w-14 h-14 rounded-xl bg-gradient-to-tr from-purple-600 to-cyan-500 flex items-center justify-center text-xl font-bold font-outfit shadow-md">
                                            {char.name[0]}
                                        </div>
                                        <span className="px-2.5 py-1 rounded-full bg-white/5 border border-white/10 text-xs text-gray-300 font-medium capitalize">
                                            {char.genre || "Drama"}
                                        </span>
                                    </div>
                                    <div>
                                        <h3 className="text-lg font-bold font-outfit mb-1">{char.name}</h3>
                                        <p className="text-xs text-gray-400 mb-4 italic">from {char.movie}</p>
                                        <p className="text-sm text-gray-300 line-clamp-2 leading-relaxed">
                                            {char.chat_style}
                                        </p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </section>

            {/* Features Info Section */}
            <section className="relative z-10 py-24 max-w-7xl mx-auto px-6 md:px-12">
                <div className="text-center mb-16">
                    <h2 className="text-3xl md:text-4xl font-bold font-outfit mb-4">Under the Hood</h2>
                    <p className="text-gray-400 max-w-xl mx-auto">Discover the state-of-the-art technologies that enable natural conversations.</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    {features.map((f, i) => (
                        <div key={i} className="p-8 rounded-2xl bg-white/5 border border-white/5 hover:border-white/10 transition-all duration-300">
                            <div className="text-4xl mb-6">{f.icon}</div>
                            <h3 className="text-xl font-bold font-outfit mb-3">{f.title}</h3>
                            <p className="text-gray-400 text-sm leading-relaxed">{f.desc}</p>
                        </div>
                    ))}
                </div>
            </section>

            {/* Footer */}
            <footer className="relative z-10 py-12 px-6 border-t border-white/5 text-center text-gray-500 text-xs">
                <p>&copy; 2026 Persona Chatbot. Designed for immersive AI roleplaying.</p>
            </footer>
        </div>
    );
};

export default Landing;
