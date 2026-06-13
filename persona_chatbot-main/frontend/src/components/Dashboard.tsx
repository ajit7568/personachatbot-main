import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { fetchMyCharacters, fetchChatSessions, Character, ChatSession } from '../services/api';
import { getToken } from '../services/auth';

const Dashboard: React.FC = () => {
    const navigate = useNavigate();
    const [myCharacters, setMyCharacters] = useState<Character[]>([]);
    const [sessions, setSessions] = useState<ChatSession[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!getToken()) {
            navigate('/login');
            return;
        }

        Promise.all([fetchMyCharacters(), fetchChatSessions()])
            .then(([chars, sess]) => {
                setMyCharacters(chars);
                setSessions(sess);
                setLoading(false);
            })
            .catch(err => {
                console.error("Failed to load dashboard data", err);
                setLoading(false);
            });
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
                        onClick={() => navigate('/explore')}
                        className="text-sm font-semibold hover:text-purple-400 transition-colors"
                    >
                        Explore
                    </button>
                    <button 
                        onClick={() => navigate('/settings')}
                        className="text-sm font-semibold hover:text-purple-400 transition-colors"
                    >
                        Settings
                    </button>
                </div>
            </header>

            <main className="px-6 md:px-12 py-16 max-w-7xl mx-auto space-y-10">
                <div>
                    <h1 className="text-4xl font-black font-outfit tracking-tight mb-2">User Dashboard</h1>
                    <p className="text-gray-400 text-sm">Monitor your conversational statistics and customize your AI lineup.</p>
                </div>

                {loading ? (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 animate-pulse">
                        <div className="h-32 bg-white/5 rounded-2xl border border-white/10" />
                        <div className="h-32 bg-white/5 rounded-2xl border border-white/10" />
                        <div className="h-32 bg-white/5 rounded-2xl border border-white/10" />
                    </div>
                ) : (
                    <>
                        {/* Analytics Cards Grid */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                            <div className="glass-panel p-6 rounded-2xl border border-white/5">
                                <span className="text-gray-400 text-xs font-semibold uppercase tracking-wider block mb-2">Total Conversations</span>
                                <div className="text-4xl font-black font-outfit">{sessions.length}</div>
                                <span className="text-xs text-purple-400 mt-2 block font-medium">Across different characters</span>
                            </div>
                            
                            <div className="glass-panel p-6 rounded-2xl border border-white/5">
                                <span className="text-gray-400 text-xs font-semibold uppercase tracking-wider block mb-2">My Persona Roster</span>
                                <div className="text-4xl font-black font-outfit">{myCharacters.length}</div>
                                <span className="text-xs text-purple-400 mt-2 block font-medium">Custom & favorited characters</span>
                            </div>

                            <div className="glass-panel p-6 rounded-2xl border border-white/5">
                                <span className="text-gray-400 text-xs font-semibold uppercase tracking-wider block mb-2">Total Messages Exchanged</span>
                                <div className="text-4xl font-black font-outfit">
                                    {sessions.reduce((acc, sess) => acc + (sess.message_count || 0), 0)}
                                </div>
                                <span className="text-xs text-purple-400 mt-2 block font-medium">Active interactions</span>
                            </div>
                        </div>

                        {/* Interactive Chart & List Row */}
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                            {/* Graphic Chart */}
                            <div className="glass-panel p-6 rounded-2xl border border-white/5 lg:col-span-2 space-y-6">
                                <h3 className="text-lg font-bold font-outfit">Weekly Conversation Activity</h3>
                                <div className="w-full h-48 flex items-end justify-between px-2 pt-4 relative">
                                    {/* Mock chart heights representing traffic */}
                                    {[20, 45, 30, 80, 50, 70, 90].map((h, i) => (
                                        <div key={i} className="flex flex-col items-center flex-1 h-full justify-end">
                                            {/* Bar container with resolved height */}
                                            <div className="w-full flex-1 flex items-end justify-center mb-2">
                                                <div 
                                                    style={{ height: `${h}%` }}
                                                    className="w-8 sm:w-12 rounded-t bg-gradient-to-t from-indigo-600 to-purple-500 hover:to-purple-400 transition-all cursor-pointer relative group"
                                                >
                                                    <span className="absolute -top-8 left-1/2 transform -translate-x-1/2 px-2 py-0.5 rounded bg-gray-800 text-[10px] opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10">
                                                        {h}%
                                                    </span>
                                                </div>
                                            </div>
                                            <span className="text-[10px] text-gray-500 font-semibold uppercase">
                                                {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"][i]}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Recent Favorites */}
                            <div className="glass-panel p-6 rounded-2xl border border-white/5 space-y-6">
                                <h3 className="text-lg font-bold font-outfit">My Lineup</h3>
                                {myCharacters.length === 0 ? (
                                    <div className="text-center py-10">
                                        <p className="text-gray-500 text-xs mb-4">No custom or favorited characters yet.</p>
                                        <button 
                                            onClick={() => navigate('/explore')}
                                            className="px-4 py-2 text-xs font-semibold bg-purple-600 hover:bg-purple-500 rounded-lg transition-all"
                                        >
                                            Find Characters
                                        </button>
                                    </div>
                                ) : (
                                    <div className="space-y-3 max-h-[200px] overflow-y-auto pr-2">
                                        {myCharacters.map((char) => (
                                            <div 
                                                key={char.id}
                                                className="p-3 rounded-xl bg-white/5 border border-white/5 flex items-center justify-between hover:border-white/10 cursor-pointer"
                                                onClick={() => navigate(`/chat?character_id=${char.id}`)}
                                            >
                                                <div className="flex items-center gap-3">
                                                    <div className="w-8 h-8 rounded-lg bg-purple-600 flex items-center justify-center font-bold text-xs">{char.name[0]}</div>
                                                    <div>
                                                        <div className="text-xs font-bold">{char.name}</div>
                                                        <div className="text-[10px] text-gray-400 italic">from {char.movie}</div>
                                                    </div>
                                                </div>
                                                <span className="text-purple-400 text-xs">&rarr;</span>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    </>
                )}
            </main>
        </div>
    );
};

export default Dashboard;
