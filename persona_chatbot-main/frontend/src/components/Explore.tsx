import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { fetchCharacters, searchExternalCharacters, createCharacterFromExternal, Character, ExternalCharacterResult } from '../services/api';
import { getToken } from '../services/auth';

const categories = [
    "All", "Action", "Sci-Fi", "Comedy", "Mystery", "Fantasy", 
    "Anime", "Historical", "Bollywood Inspired", "Regional Cinema"
];

const onlineCategories = [
    { value: "all", label: "All Sources" },
    { value: "anime", label: "Anime" },
    { value: "movie", label: "Hollywood Movies" },
    { value: "tv", label: "TV Shows" },
    { value: "bollywood", label: "Bollywood" },
    { value: "book", label: "Books" },
    { value: "other", label: "Other" }
];

const Explore: React.FC = () => {
    const navigate = useNavigate();
    const [viewMode, setViewMode] = useState<'local' | 'online'>('local');
    const [characters, setCharacters] = useState<Character[]>([]);
    const [filteredCharacters, setFilteredCharacters] = useState<Character[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('All');
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    
    // Online search states
    const [onlineCategory, setOnlineCategory] = useState('all');
    const [onlineResults, setOnlineResults] = useState<ExternalCharacterResult[]>([]);
    const [isSearchingOnline, setIsSearchingOnline] = useState(false);
    const [onlineSearchPerformed, setOnlineSearchPerformed] = useState(false);
    const [importingIndex, setImportingIndex] = useState<number | null>(null);
    const [error, setError] = useState<string | null>(null);

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

    // Filter local characters
    useEffect(() => {
        if (viewMode !== 'local') return;

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
                (char.chat_style || '').toLowerCase().includes(q)
            );
        }

        setFilteredCharacters(results);
    }, [searchQuery, selectedCategory, characters, viewMode]);

    // Handle online search
    const handleOnlineSearch = async (e?: React.FormEvent) => {
        if (e) e.preventDefault();
        if (!searchQuery.trim()) return;

        setIsSearchingOnline(true);
        setError(null);
        setOnlineSearchPerformed(true);
        try {
            const results = await searchExternalCharacters(searchQuery, onlineCategory);
            setOnlineResults(results);
        } catch (err) {
            console.error("Failed to search online characters", err);
            setError("Failed to fetch online search results. Make sure your search queries are valid.");
        } finally {
            setIsSearchingOnline(false);
        }
    };

    // Import external character and chat
    const handleImportAndChat = async (externalChar: ExternalCharacterResult, idx: number) => {
        if (!isAuthenticated) {
            navigate('/login');
            return;
        }
        if (importingIndex !== null) return;
        setImportingIndex(idx);
        setError(null);
        try {
            const newChar = await createCharacterFromExternal(externalChar);
            navigate(`/chat?character_id=${newChar.id}`);
        } catch (err) {
            console.error("Failed to import character", err);
            setError("Failed to import character to your local roster.");
            setImportingIndex(null);
        }
    };

    return (
        <div className="min-h-screen bg-[#0B0F19] text-white selection:bg-purple-600 selection:text-white font-['Inter'] relative">
            {/* Ambient background glow */}
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

            {/* Content Body */}
            <div className="px-6 md:px-12 py-16 max-w-7xl mx-auto relative z-10">
                <div className="mb-12 flex flex-col md:flex-row md:items-end justify-between gap-6">
                    <div>
                        <h1 className="text-4xl md:text-5xl font-black font-outfit tracking-tight mb-4">
                            Discover AI Personalities
                        </h1>
                        <p className="text-gray-400 max-w-xl">
                            Search and filter from hundreds of characters or generate custom ones instantly using the creation tools.
                        </p>
                    </div>

                    {/* View mode toggle */}
                    <div className="flex bg-white/5 p-1 rounded-xl border border-white/5 self-start md:self-auto">
                        <button
                            onClick={() => {
                                setViewMode('local');
                                setError(null);
                            }}
                            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${
                                viewMode === 'local' 
                                    ? "bg-purple-600 text-white shadow-lg shadow-purple-500/20" 
                                    : "text-gray-400 hover:text-white"
                            }`}
                        >
                            Local Roster
                        </button>
                        <button
                            onClick={() => {
                                setViewMode('online');
                                setError(null);
                            }}
                            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${
                                viewMode === 'online' 
                                    ? "bg-purple-600 text-white shadow-lg shadow-purple-500/20" 
                                    : "text-gray-400 hover:text-white"
                            }`}
                        >
                            Explore Online
                        </button>
                    </div>
                </div>

                {error && (
                    <div className="mb-8 p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-xs">
                        ⚠️ {error}
                    </div>
                )}

                {/* Filters & Search Control */}
                {viewMode === 'local' ? (
                    <div className="flex flex-col lg:flex-row gap-6 items-stretch lg:items-center justify-between mb-10">
                        {/* Search Bar */}
                        <div className="relative flex-1 max-w-lg">
                            <input
                                type="text"
                                placeholder="Search character name, movie, archetype..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full pl-10 pr-4 py-3 rounded-xl bg-white/5 border border-white/10 focus:outline-none focus:border-purple-500/60 focus:ring-1 focus:ring-purple-500/60 transition-all text-sm"
                            />
                            <span className="absolute left-3.5 top-3.5 text-gray-400 text-sm">🔍</span>
                        </div>

                        {/* Quick category tags */}
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
                ) : (
                    /* Search Form for Online mode */
                    <form onSubmit={handleOnlineSearch} className="flex flex-col md:flex-row gap-4 items-stretch justify-between mb-10 max-w-3xl">
                        <div className="relative flex-1">
                            <input
                                type="text"
                                placeholder="Search for characters online..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full pl-10 pr-4 py-3.5 rounded-xl bg-white/5 border border-white/10 focus:outline-none focus:border-purple-500/60 focus:ring-1 focus:ring-purple-500/60 transition-all text-sm"
                                required
                            />
                            <span className="absolute left-3.5 top-4 text-gray-400 text-sm">🔍</span>
                        </div>

                        <select
                            value={onlineCategory}
                            onChange={(e) => setOnlineCategory(e.target.value)}
                            className="px-4 py-3.5 rounded-xl bg-[#0F1424] border border-white/10 focus:outline-none focus:border-purple-500 text-sm text-white min-w-[150px]"
                        >
                            {onlineCategories.map(cat => (
                                <option key={cat.value} value={cat.value}>{cat.label}</option>
                            ))}
                        </select>

                        <button
                            type="submit"
                            disabled={isSearchingOnline || !searchQuery.trim()}
                            className="px-6 py-3.5 bg-purple-600 hover:bg-purple-500 disabled:opacity-50 text-white text-sm font-bold rounded-xl transition-all shadow-lg shadow-purple-500/10 flex items-center justify-center gap-2"
                        >
                            {isSearchingOnline ? (
                                <>
                                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                                    <span>Searching...</span>
                                </>
                            ) : (
                                <span>Search Online</span>
                            )}
                        </button>
                    </form>
                )}

                {/* Local Roster View Grid */}
                {viewMode === 'local' ? (
                    loading ? (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                            {[1, 2, 3, 4, 5, 6, 7, 8].map(i => (
                                <div key={i} className="h-64 rounded-2xl bg-white/5 border border-white/10 animate-pulse" />
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
                                        {char.image_url ? (
                                            <img 
                                                src={char.image_url} 
                                                alt={char.name}
                                                className="w-12 h-12 rounded-xl object-cover shadow-md"
                                                onError={(e) => {
                                                    const target = e.target as HTMLImageElement;
                                                    target.style.display = 'none';
                                                    if (target.nextElementSibling) {
                                                        (target.nextElementSibling as HTMLElement).style.display = 'flex';
                                                    }
                                                }}
                                            />
                                        ) : null}
                                        {(!char.image_url) && (
                                            <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-purple-600 to-indigo-500 flex items-center justify-center text-lg font-bold font-outfit shadow-md">
                                                {char.name[0]}
                                            </div>
                                        )}
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
                    )
                ) : (
                    /* Online Search Results Grid */
                    isSearchingOnline ? (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                            {[1, 2, 3, 4].map(i => (
                                <div key={i} className="h-64 rounded-2xl bg-white/5 border border-white/10 animate-pulse" />
                            ))}
                        </div>
                    ) : onlineResults.length === 0 ? (
                        <div className="text-center py-20 bg-white/5 border border-white/5 rounded-2xl">
                            <span className="text-4xl mb-4 block">🌍</span>
                            <h3 className="text-xl font-bold font-outfit mb-2">
                                {onlineSearchPerformed ? "No online results found" : "Search external libraries"}
                            </h3>
                            <p className="text-gray-400 text-sm max-w-sm mx-auto">
                                {onlineSearchPerformed 
                                    ? "Try searching another query or changing the category filter."
                                    : "Type a query in the search bar above to fetch characters from external pop-culture, literature, and movie databases."}
                            </p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                            {onlineResults.map((char, idx) => (
                                <div 
                                    key={idx}
                                    className="glass-card p-6 rounded-2xl flex flex-col justify-between h-64 relative group cursor-pointer"
                                    onClick={() => handleImportAndChat(char, idx)}
                                >
                                    <div className="flex justify-between items-start mb-3">
                                        {char.image_url ? (
                                            <img 
                                                src={char.image_url} 
                                                alt={char.name}
                                                className="w-12 h-12 rounded-xl object-cover shadow-md"
                                                onError={(e) => {
                                                    const target = e.target as HTMLImageElement;
                                                    target.style.display = 'none';
                                                    if (target.nextElementSibling) {
                                                        (target.nextElementSibling as HTMLElement).style.display = 'flex';
                                                    }
                                                }}
                                            />
                                        ) : null}
                                        {(!char.image_url) && (
                                            <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-purple-600 to-indigo-500 flex items-center justify-center text-lg font-bold font-outfit shadow-md">
                                                {char.name[0]}
                                            </div>
                                        )}
                                        <span className="px-2.5 py-0.5 rounded-full bg-white/5 border border-white/10 text-[10px] text-gray-400 font-medium uppercase">
                                            {char.source}
                                        </span>
                                    </div>
                                    <div className="flex-1 mt-2">
                                        <h3 className="text-base font-bold font-outfit mb-0.5 group-hover:text-purple-400 transition-colors leading-snug">{char.name}</h3>
                                        <p className="text-[11px] text-gray-400 mb-3 italic">from {char.universe_title}</p>
                                        <p className="text-xs text-gray-300 line-clamp-3 leading-relaxed">
                                            {char.description}
                                        </p>
                                    </div>
                                    <div className="mt-4 pt-3 border-t border-white/5 flex items-center justify-between text-xs text-purple-400 font-semibold">
                                        <span>{importingIndex === idx ? "Importing..." : "Add & Chat Now"}</span>
                                        <span>&rarr;</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )
                )}
            </div>
        </div>
    );
};

export default Explore;
