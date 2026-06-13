import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { fetchCharacters, Character } from '../services/api';
import { getToken } from '../services/auth';

const categories = [
    "All", "Action", "Sci-Fi", "Comedy", "Mystery", "Fantasy", 
    "Anime", "Historical", "Bollywood Inspired", "Regional Cinema"
];

const Explore: React.FC = () => {
    const navigate = useNavigate();
    const [characters, setCharacters] = useState<Character[]>([]);
    const [filteredCharacters, setFilteredCharacters] = useState<Character[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('All');
    const [isAuthenticated, setIsAuthenticated] = useState(false);

    useEffect(() => {
        setIsAuthenticated(!!getToken());
        
        fetchCharacters()
            .then(data => {
                setCharacters(data);
                setFilteredCharacters(data);
                setLoading(false);
            })
            .catch(err => {
                console.error("Failed to fetch explore directory", err);
                setLoading(false);
            });
    }, []);

    useEffect(() => {
        let results = characters;

        // Apply category filter
        if (selectedCategory !== 'All') {
            results = results.filter(char => 
                (char.genre || '').toLowerCase() === selectedCategory.toLowerCase()
            );
        }

        // Apply search query filter
        if (searchQuery.trim()) {
            const q = searchQuery.toLowerCase();
            results = results.filter(char => 
                char.name.toLowerCase().includes(q) || 
                char.movie.toLowerCase().includes(q) ||
                char.chat_style.toLowerCase().includes(q)
            );
        }

        setFilteredCharacters(results);
    }, [searchQuery, selectedCategory, characters]);

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
                    {isAuthenticated ? (
                        <>
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
                            <button 
                                onClick={() => navigate('/create')}
                                className="px-4 py-2 rounded-lg text-sm font-semibold bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 transition-all"
                            >
                                + Create Character
                            </button>
                        </>
                    ) : (
                        <button 
                            onClick={() => navigate('/login')}
                            className="px-5 py-2.5 rounded-lg text-sm font-semibold bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 transition-all"
                        >
                            Get Started
                        </button>
                    )}
                </div>
            </header>

            {/* Banner Section */}
            <div className="px-6 md:px-12 py-16 max-w-7xl mx-auto">
                <div className="mb-12">
                    <h1 className="text-4xl md:text-5xl font-black font-outfit tracking-tight mb-4">
                        Discover AI Personalities
                    </h1>
                    <p className="text-gray-400 max-w-xl">
                        Search and filter from hundreds of characters or generate custom ones instantly using the creation tools.
                    </p>
                </div>

                {/* Filters & Search Control */}
                <div className="flex flex-col lg:flex-row gap-6 items-stretch lg:items-center justify-between mb-10">
                    {/* Search Bar */}
                    <div className="relative flex-1 max-w-lg">
                        <input
                            type="text"
                            placeholder="Search character name, movie, archetype..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-10 pr-4 py-3 rounded-xl bg-white/5 border border-white/10 focus:outline-none focus:border-purple-500/60 focus:ring-1 focus:ring-purple-500/60 transition-all"
                        />
                        <span className="absolute left-3.5 top-3.5 text-gray-400 text-lg">🔍</span>
                    </div>

                    {/* Quick navigation tags */}
                    <div className="flex items-center gap-2 overflow-x-auto pb-2 lg:pb-0 scrollbar-none">
                        {categories.map((cat) => (
                            <button
                                key={cat}
                                onClick={() => setSelectedCategory(cat)}
                                className={`px-4 py-2 rounded-lg text-xs font-semibold whitespace-nowrap transition-all border ${
                                    selectedCategory === cat
                                        ? "bg-purple-600 border-purple-600 text-white shadow-lg shadow-purple-500/20"
                                        : "bg-white/5 border-white/5 hover:border-white/10 text-gray-300"
                                }`}
                            >
                                {cat}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Grid Directory */}
                {loading ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                        {[1, 2, 3, 4, 5, 6, 7, 8].map(i => (
                            <div key={i} className="h-60 rounded-2xl bg-white/5 border border-white/10 animate-pulse" />
                        ))}
                    </div>
                ) : filteredCharacters.length === 0 ? (
                    <div className="text-center py-20 bg-white/5 border border-white/5 rounded-2xl">
                        <span className="text-4xl mb-4 block">🤖</span>
                        <h3 className="text-xl font-bold font-outfit mb-2">No characters found</h3>
                        <p className="text-gray-400 text-sm mb-6">Try adjusting your filters or create a new custom character.</p>
                        <button
                            onClick={() => navigate(isAuthenticated ? '/create' : '/login')}
                            className="px-5 py-2.5 rounded-lg text-sm font-semibold bg-purple-600 hover:bg-purple-500 transition-all"
                        >
                            + Create a Character
                        </button>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                        {filteredCharacters.map((char) => (
                            <div 
                                key={char.id}
                                className="glass-card p-6 rounded-2xl flex flex-col justify-between h-64 relative group cursor-pointer"
                                onClick={() => navigate(isAuthenticated ? `/chat?character_id=${char.id}` : '/login')}
                            >
                                <div className="flex justify-between items-start mb-3">
                                    <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-purple-600 to-indigo-500 flex items-center justify-center text-lg font-bold font-outfit shadow-md">
                                        {char.name[0]}
                                    </div>
                                    <span className="px-2.5 py-0.5 rounded-full bg-white/5 border border-white/10 text-[10px] text-gray-400 font-medium capitalize">
                                        {char.genre || "Drama"}
                                    </span>
                                </div>
                                <div className="flex-1 mt-2">
                                    <h3 className="text-base font-bold font-outfit mb-0.5 group-hover:text-purple-400 transition-colors leading-snug">{char.name}</h3>
                                    <p className="text-[11px] text-gray-400 mb-3 italic">from {char.movie}</p>
                                    <p className="text-xs text-gray-300 line-clamp-3 leading-relaxed">
                                        {char.chat_style}
                                    </p>
                                </div>
                                <div className="mt-4 pt-3 border-t border-white/5 flex items-center justify-between text-xs text-purple-400 font-semibold opacity-0 group-hover:opacity-100 transition-opacity">
                                    <span>Start Chatting</span>
                                    <span>&rarr;</span>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default Explore;
