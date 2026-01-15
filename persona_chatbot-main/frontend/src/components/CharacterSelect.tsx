import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { 
    Character, 
    fetchCharacters, 
    fetchMyCharacters,
    searchExternalCharacters,
    createCharacterFromExternal,
    favoriteCharacter,
    unfavoriteCharacter,
    ExternalCharacterResult
} from '../services/api';
import {
    SparklesIcon,
    FilmIcon,
    ChatBubbleLeftRightIcon,
    ChatBubbleOvalLeftIcon,
    MagnifyingGlassIcon,
    XMarkIcon,
    HeartIcon,
    PlusIcon,
    GlobeAltIcon,
    RectangleStackIcon
} from '@heroicons/react/24/solid';
import { HeartIcon as HeartOutlineIcon } from '@heroicons/react/24/outline';

interface CharacterSelectProps {
    onCharacterSelect: (character: Character) => void;
    isOpen: boolean;
    onClose: () => void;
    isSidebarOpen?: boolean;
}

type ViewMode = 'my-collection' | 'all-local' | 'explore-online';

// Genre-based background gradients
const genreBackgrounds = {
    'action': 'from-red-500/20 to-orange-600/20',
    'drama': 'from-blue-500/20 to-purple-600/20',
    'comedy': 'from-yellow-500/20 to-green-600/20',
    'scifi': 'from-cyan-500/20 to-blue-600/20',
    'fantasy': 'from-purple-500/20 to-pink-600/20',
    'default': 'from-gray-600/20 to-gray-700/20'
};

// Function to determine genre - use explicit genre field if available, otherwise infer
const getGenre = (character: Character | ExternalCharacterResult): keyof typeof genreBackgrounds => {
    if ('genre' in character && character.genre) {
        return character.genre as keyof typeof genreBackgrounds || 'default';
    }
    
    // Handle both Character and ExternalCharacterResult types
    const movie = 'movie' in character ? character.movie : ('universe_title' in character ? character.universe_title : '');
    const chat_style = 'chat_style' in character ? character.chat_style : '';
    const description = 'description' in character ? character.description : '';
    
    const text = (movie + ' ' + chat_style + ' ' + description).toLowerCase();
    
    if (text.includes('action') || text.includes('adventure') || text.includes('hero')) return 'action';
    if (text.includes('drama') || text.includes('emotional')) return 'drama';
    if (text.includes('comedy') || text.includes('funny') || text.includes('humorous')) return 'comedy';
    if (text.includes('sci') || text.includes('future') || text.includes('space')) return 'scifi';
    if (text.includes('fantasy') || text.includes('magic') || text.includes('wizard')) return 'fantasy';
    return 'default';
};

const CharacterCard: React.FC<{
    character: Character;
    onClick: () => void;
    isFavorite?: boolean;
    onToggleFavorite?: () => void;
    showFavoriteButton?: boolean;
    isConfirmed?: boolean;
    onToggleConfirm?: () => void;
    aiMessage?: string | undefined;
}> = ({ character, onClick, isFavorite = false, onToggleFavorite, showFavoriteButton = true, isConfirmed = false, onToggleConfirm, aiMessage }) => {
    const genre = getGenre(character);
    const [isExpanded, setIsExpanded] = useState(false);

    const handleClick = (e: React.MouseEvent) => {
        if ((e.target as HTMLElement).closest('.expand-responses') || 
            (e.target as HTMLElement).closest('.favorite-button')) {
            e.stopPropagation();
            return;
        }
        onClick();
    };

    const handleFavoriteClick = (e: React.MouseEvent) => {
        e.stopPropagation();
        if (onToggleFavorite) {
            onToggleFavorite();
        }
    };

    return (
        <motion.div
            layout
            onClick={handleClick}
            className={`p-6 rounded-xl transition-all relative overflow-hidden cursor-pointer
                ${genreBackgrounds[genre]} backdrop-blur-sm 
                border-2 border-white/10 hover:border-white/20
                hover:shadow-lg hover:shadow-purple-500/10
                bg-gradient-to-br from-gray-800/90 to-gray-900/90`}
            whileHover={{ scale: 1.02, y: -4 }}
            whileTap={{ scale: 0.98 }}
        >
            {/* Favorite Button */}
            {showFavoriteButton && onToggleFavorite && (
                <button
                    className="favorite-button absolute top-4 right-4 z-10 p-2 rounded-full bg-gray-800/80 hover:bg-gray-700 transition-colors"
                    onClick={handleFavoriteClick}
                    title={isFavorite ? "Remove from favorites" : "Add to favorites"}
                >
                    {isFavorite ? (
                        <HeartIcon className="w-5 h-5 text-red-500" />
                    ) : (
                        <HeartOutlineIcon className="w-5 h-5 text-gray-400 hover:text-red-400" />
                    )}
                </button>
            )}

            {/* Confirm toggle + AI message (shown when favorited) */}
            {isFavorite && (
                <div className="absolute top-16 right-4 z-10 flex flex-col items-end space-y-2">
                    {onToggleConfirm && (
                        <button
                            onClick={(e) => { e.stopPropagation(); onToggleConfirm(); }}
                            className="px-2 py-1 rounded-full bg-green-600 text-xs text-white"
                        >
                            {isConfirmed ? 'Confirmed' : 'Confirm Added'}
                        </button>
                    )}
                    {aiMessage && (
                        <div className="max-w-xs text-right text-xs italic text-gray-300 bg-gray-800/70 px-3 py-2 rounded">
                            {aiMessage}
                        </div>
                    )}
                </div>
            )}
            {/* Character Image or Avatar */}
            {character.image_url ? (
                <div className="w-full h-48 mb-4 rounded-lg overflow-hidden">
                    <img 
                        src={character.image_url} 
                        alt={character.name}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                            // Fallback to avatar if image fails to load
                            const target = e.target as HTMLImageElement;
                            target.style.display = 'none';
                            if (target.parentElement) {
                                target.parentElement.innerHTML = `
                                    <div class="w-full h-full bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center">
                                        <span class="text-4xl text-white font-bold">${character.name.charAt(0)}</span>
                                    </div>
                                `;
                            }
                        }}
                    />
                </div>
            ) : (
                <div className="w-full h-48 mb-4 rounded-lg bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center">
                    <span className="text-4xl text-white font-bold">
                        {character.name.charAt(0)}
                    </span>
                </div>
            )}

            {/* Source Badge */}
            {character.source && character.source !== 'local' && (
                <div className="absolute top-4 left-4 px-2 py-1 rounded text-xs bg-gray-800/80 text-gray-300">
                    {character.source.toUpperCase()}
                </div>
            )}

            {/* Header Section */}
            <motion.div layout="position" className="mb-4">
                <h3 className="text-2xl font-bold text-white mb-2 leading-tight">{character.name}</h3>
                <div className="flex flex-wrap gap-2 text-sm">
                    <div className="flex items-center px-3 py-1 rounded-full bg-gray-700/50 text-gray-300">
                        <FilmIcon className="w-4 h-4 mr-1" />
                        <span>{character.movie}</span>
                    </div>
                    {character.genre && (
                        <div className={`px-3 py-1 rounded-full text-xs font-medium ${
                            genre === 'action' ? 'bg-red-500/20 text-red-300' :
                            genre === 'drama' ? 'bg-blue-500/20 text-blue-300' :
                            genre === 'comedy' ? 'bg-yellow-500/20 text-yellow-300' :
                            genre === 'scifi' ? 'bg-cyan-500/20 text-cyan-300' :
                            genre === 'fantasy' ? 'bg-purple-500/20 text-purple-300' :
                            'bg-gray-700/50 text-gray-300'
                        }`}>
                            {character.genre.toUpperCase()}
                        </div>
                    )}
                </div>
            </motion.div>

            {/* Chat Style */}
            <div className="mb-4">
                <div className="flex items-center px-3 py-1 rounded-full bg-gray-700/50 text-gray-300 text-sm">
                    <ChatBubbleLeftRightIcon className="w-4 h-4 mr-1" />
                    <span>{character.chat_style}</span>
                </div>
            </div>

            {/* Example Responses Section */}
            {'example_responses' in character && character.example_responses && (
                <motion.div layout="position" className="mt-4">
                    <div className="flex items-center justify-between text-gray-300 mb-3">
                        <div className="flex items-center">
                            <ChatBubbleOvalLeftIcon className="w-4 h-4 mr-2" />
                            <span className="text-sm font-medium">Sample Responses</span>
                        </div>
                        <button 
                            className="expand-responses text-xs text-blue-400 hover:text-blue-300 transition-colors flex items-center"
                            onClick={(e) => {
                                e.stopPropagation();
                                setIsExpanded(!isExpanded);
                            }}
                        >
                            {isExpanded ? (
                                <>
                                    <XMarkIcon className="w-4 h-4 mr-1" />
                                    Show Less
                                </>
                            ) : (
                                <>
                                    Show All ({character.example_responses.length})
                                </>
                            )}
                        </button>
                    </div>
                    <div className={`space-y-3 relative ${isExpanded ? '' : 'max-h-32 overflow-hidden'}`}>
                        {character.example_responses.map((response, index) => (
                            <motion.div 
                                key={index}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: index * 0.1 }}
                                className="p-3 rounded-lg bg-gray-800/50 border border-gray-700/50"
                            >
                                <p className="text-gray-300 text-sm">
                                    {response}
                                </p>
                            </motion.div>
                        ))}
                        {!isExpanded && character.example_responses.length > 2 && (
                            <div className="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-gray-900 to-transparent pointer-events-none" />
                        )}
                    </div>
                </motion.div>
            )}
        </motion.div>
    );
};

const ExternalCharacterCard: React.FC<{
    character: ExternalCharacterResult;
    onAdd: () => void;
}> = ({ character, onAdd }) => {
    const genre = getGenre(character);

    return (
        <motion.div
            layout
            className={`p-6 rounded-xl transition-all relative overflow-hidden
                ${genreBackgrounds[genre]} backdrop-blur-sm 
                border-2 border-white/10 hover:border-white/20
                hover:shadow-lg hover:shadow-purple-500/10
                bg-gradient-to-br from-gray-800/90 to-gray-900/90`}
            whileHover={{ scale: 1.02, y: -4 }}
            whileTap={{ scale: 0.98 }}
        >
            {/* Character Image or Avatar */}
            {character.image_url ? (
                <div className="w-full h-48 mb-4 rounded-lg overflow-hidden">
                    <img 
                        src={character.image_url} 
                        alt={character.name}
                        className="w-full h-full object-cover"
                    />
                </div>
            ) : (
                <div className="w-full h-48 mb-4 rounded-lg bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center">
                    <span className="text-4xl text-white font-bold">
                        {character.name.charAt(0)}
                    </span>
                </div>
            )}

            {/* Source Badge */}
            <div className="absolute top-4 left-4 px-2 py-1 rounded text-xs bg-gray-800/80 text-gray-300">
                {character.source.toUpperCase()}
            </div>

            {/* Header Section */}
            <div className="mb-4">
                <h3 className="text-2xl font-bold text-white mb-2 leading-tight">{character.name}</h3>
                <div className="flex flex-wrap gap-2 text-sm">
                    <div className="flex items-center px-3 py-1 rounded-full bg-gray-700/50 text-gray-300">
                        <FilmIcon className="w-4 h-4 mr-1" />
                        <span>{character.universe_title}</span>
                    </div>
                    {character.genre && (
                        <div className={`px-3 py-1 rounded-full text-xs font-medium ${
                            genre === 'action' ? 'bg-red-500/20 text-red-300' :
                            genre === 'drama' ? 'bg-blue-500/20 text-blue-300' :
                            genre === 'comedy' ? 'bg-yellow-500/20 text-yellow-300' :
                            genre === 'scifi' ? 'bg-cyan-500/20 text-cyan-300' :
                            genre === 'fantasy' ? 'bg-purple-500/20 text-purple-300' :
                            'bg-gray-700/50 text-gray-300'
                        }`}>
                            {character.genre.toUpperCase()}
                        </div>
                    )}
                </div>
            </div>

            {/* Description */}
            <div className="mb-4">
                <p className="text-gray-300 text-sm line-clamp-3">
                    {character.description}
                </p>
            </div>

            {/* Add Button */}
            <button
                onClick={onAdd}
                className="w-full mt-4 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors flex items-center justify-center gap-2"
            >
                <PlusIcon className="w-5 h-5" />
                Add to My Collection
            </button>
        </motion.div>
    );
};

export const CharacterSelect: React.FC<CharacterSelectProps> = ({ onCharacterSelect, isOpen, onClose, isSidebarOpen = false }) => {
    const [characters, setCharacters] = useState<Character[]>([]);
    const [myCharacters, setMyCharacters] = useState<Character[]>([]);
    const [externalCharacters, setExternalCharacters] = useState<ExternalCharacterResult[]>([]);
    const [favoriteIds, setFavoriteIds] = useState<Set<number>>(new Set());
    const [aiMessages, setAiMessages] = useState<Record<number, string>>({});
    const [confirmedIds, setConfirmedIds] = useState<Set<number>>(new Set());
    const [searchPerformed, setSearchPerformed] = useState(false);
    const [loading, setLoading] = useState(true);
    const [searching, setSearching] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedGenre, setSelectedGenre] = useState<keyof typeof genreBackgrounds | 'all'>('all');
    const [viewMode, setViewMode] = useState<ViewMode>('all-local');
    const [searchCategory, setSearchCategory] = useState<string>('other');

    // Load characters based on view mode
    useEffect(() => {
        const loadCharacters = async () => {
            try {
                setLoading(true);
                setError(null);
                
                if (viewMode === 'my-collection') {
                    const data = await fetchMyCharacters();
                    setMyCharacters(data);
                    setFavoriteIds(new Set(data.map(c => c.id)));
                } else if (viewMode === 'all-local') {
                    const data = await fetchCharacters(selectedGenre === 'all' ? undefined : selectedGenre);
                    setCharacters(data);
                }
            } catch (err: any) {
                setError(err.message || 'Failed to load characters');
            } finally {
                setLoading(false);
            }
        };

        if (isOpen && viewMode !== 'explore-online') {
            loadCharacters();
        }
    }, [isOpen, viewMode, selectedGenre]);

    // Search external characters
    const handleExternalSearch = async () => {
        if (!searchTerm.trim()) return;
        
        setSearchPerformed(true);
        try {
            setSearching(true);
            setError(null);
            const results = await searchExternalCharacters(searchTerm, searchCategory);
            setExternalCharacters(results);
        } catch (err: any) {
            setError(err.message || 'Failed to search external characters');
        } finally {
            setSearching(false);
        }
    };

    const handleAddExternalCharacter = async (externalChar: ExternalCharacterResult) => {
        try {
            const newCharacter = await createCharacterFromExternal(externalChar);
            // Auto-favorite the new character
            const aiMsg = await favoriteCharacter(newCharacter.id);
            if (aiMsg) {
                setAiMessages(prev => ({ ...prev, [newCharacter.id]: aiMsg }));
            }
            // Refresh lists
            const updatedMyChars = await fetchMyCharacters();
            setMyCharacters(updatedMyChars);
            setFavoriteIds(new Set(updatedMyChars.map(c => c.id)));
            // Switch to my collection view and clear search so full collection shows
            setSearchTerm('');
            setSearchPerformed(false);
            setViewMode('my-collection');
        } catch (err: any) {
            setError(err.message || 'Failed to add character');
        }
    };

    const handleToggleFavorite = async (characterId: number, isFavorite: boolean) => {
        try {
            if (isFavorite) {
                await unfavoriteCharacter(characterId);
                setFavoriteIds(prev => {
                    const newSet = new Set(prev);
                    newSet.delete(characterId);
                    return newSet;
                });
                // clear ai message and confirmation when unfavorited
                setAiMessages(prev => {
                    const next = { ...prev };
                    delete next[characterId];
                    return next;
                });
                setConfirmedIds(prev => {
                    const next = new Set(prev);
                    next.delete(characterId);
                    return next;
                });
            } else {
                const aiMsg = await favoriteCharacter(characterId);
                if (aiMsg) {
                    setAiMessages(prev => ({ ...prev, [characterId]: aiMsg }));
                }
                setFavoriteIds(prev => new Set(prev).add(characterId));
            }

            // Refresh my collection if we're viewing it
            if (viewMode === 'my-collection') {
                const updated = await fetchMyCharacters();
                setMyCharacters(updated);
            }
        } catch (err: any) {
            setError(err.message || 'Failed to update favorite');
        }
    };

    const getDisplayCharacters = (): Character[] => {
        if (viewMode === 'my-collection') {
            return myCharacters;
        }
        return characters;
    };

        const toggleConfirm = (characterId: number) => {
            setConfirmedIds(prev => {
                const next = new Set(prev);
                if (next.has(characterId)) next.delete(characterId);
                else next.add(characterId);
                return next;
            });
        };

    const filteredCharacters = getDisplayCharacters().filter(char => {
        const matchesSearch = 
            char.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            char.movie.toLowerCase().includes(searchTerm.toLowerCase()) ||
            char.chat_style.toLowerCase().includes(searchTerm.toLowerCase());
        
        const charGenre = char.genre || getGenre(char);
        const matchesGenre = selectedGenre === 'all' || charGenre === selectedGenre;
        
        return matchesSearch && matchesGenre;
    });

    if (!isOpen) return null;

    return (
        <div 
            className="fixed inset-0 bg-gray-900/75 backdrop-blur-sm flex items-center justify-center p-4 z-50"
            onClick={onClose}
        >
            <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                onClick={(e) => e.stopPropagation()}
                className={`bg-gray-800 rounded-xl p-6 overflow-hidden flex flex-col transition-all duration-300 ${
                    isSidebarOpen 
                        ? 'w-full max-w-4xl max-h-[90vh]' 
                        : 'w-full max-w-6xl max-h-[90vh]'
                }`}
                style={isSidebarOpen ? { marginLeft: '320px' } : {}}
            >
                {/* Header with Title and Close Button */}
                <div className="mb-6 flex items-center justify-between">
                    <h2 className="text-2xl font-bold text-white">Select a Character</h2>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-gray-700 rounded-lg transition-colors"
                        title="Close"
                    >
                        <XMarkIcon className="w-6 h-6 text-gray-400 hover:text-white" />
                    </button>
                </div>

                {/* Tabs */}
                <div className="mb-6 flex gap-2 border-b border-gray-700">
                    <button
                        onClick={() => {
                            setViewMode('my-collection');
                            setSearchTerm('');
                        }}
                        className={`px-4 py-2 font-medium transition-colors border-b-2 ${
                            viewMode === 'my-collection'
                                ? 'border-blue-500 text-blue-400'
                                : 'border-transparent text-gray-400 hover:text-gray-300'
                        }`}
                    >
                        <RectangleStackIcon className="w-5 h-5 inline mr-2" />
                        My Collection
                    </button>
                    <button
                        onClick={() => {
                            setViewMode('all-local');
                            setSearchTerm('');
                        }}
                        className={`px-4 py-2 font-medium transition-colors border-b-2 ${
                            viewMode === 'all-local'
                                ? 'border-blue-500 text-blue-400'
                                : 'border-transparent text-gray-400 hover:text-gray-300'
                        }`}
                    >
                        All Local
                    </button>
                    <button
                        onClick={() => {
                            setViewMode('explore-online');
                            setSearchTerm('');
                            setExternalCharacters([]);
                        }}
                        className={`px-4 py-2 font-medium transition-colors border-b-2 ${
                            viewMode === 'explore-online'
                                ? 'border-blue-500 text-blue-400'
                                : 'border-transparent text-gray-400 hover:text-gray-300'
                        }`}
                    >
                        <GlobeAltIcon className="w-5 h-5 inline mr-2" />
                        Explore Online
                    </button>
                </div>

                {/* Search and Filters */}
                {viewMode === 'explore-online' ? (
                    <div className="mb-6 flex flex-col sm:flex-row gap-4">
                        <div className="relative flex-1">
                            <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                            <input
                                type="text"
                                placeholder="Search for characters..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && handleExternalSearch()}
                                className="w-full pl-10 p-3 rounded-lg bg-gray-700 text-white placeholder-gray-400 border border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                        </div>
                        <select
                            value={searchCategory}
                            onChange={(e) => setSearchCategory(e.target.value)}
                            className="px-4 py-3 rounded-lg bg-gray-700 text-white border border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                            <option value="all">All sources</option>
                            <option value="anime">Anime</option>
                            <option value="movie">Hollywood Movies</option>
                            <option value="tv">TV Shows</option>
                            <option value="bollywood">Bollywood</option>
                            <option value="book">Books</option>
                            <option value="other">Other</option>
                        </select>
                        <button
                            onClick={handleExternalSearch}
                            disabled={searching || !searchTerm.trim()}
                            className="px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white rounded-lg transition-colors"
                        >
                            {searching ? 'Searching...' : 'Search'}
                        </button>
                    </div>
                ) : (
                    <div className="mb-6 flex flex-col sm:flex-row gap-4">
                        <div className="relative flex-1">
                            <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                            <input
                                type="text"
                                placeholder="Search characters..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full pl-10 p-3 rounded-lg bg-gray-700 text-white placeholder-gray-400 border border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                        </div>
                        <div className="flex gap-2 overflow-x-auto pb-2 sm:pb-0">
                            {['all', ...Object.keys(genreBackgrounds)].map((genre) => (
                                <button
                                    key={genre}
                                    onClick={() => setSelectedGenre(genre as keyof typeof genreBackgrounds | 'all')}
                                    className={`px-4 py-2 rounded-lg text-sm whitespace-nowrap transition-colors ${
                                        selectedGenre === genre
                                            ? 'bg-blue-600 text-white'
                                            : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                                    }`}
                                >
                                    {genre.charAt(0).toUpperCase() + genre.slice(1)}
                                </button>
                            ))}
                        </div>
                    </div>
                )}

                {/* Error Display */}
                {error && (
                    <div className="mb-4 p-3 bg-red-500/20 border border-red-500/50 rounded-lg text-red-300 text-sm">
                        {error}
                    </div>
                )}

                {/* Content */}
                <div className="overflow-y-auto flex-1">
                    {loading && viewMode !== 'explore-online' ? (
                        <div className="flex justify-center items-center h-64">
                            <div className="flex items-center space-x-4">
                                <SparklesIcon className="w-8 h-8 text-blue-500 animate-pulse" />
                                <p className="text-white text-lg">Loading characters...</p>
                            </div>
                        </div>
                    ) : viewMode === 'explore-online' ? (
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 pr-2">
                            {externalCharacters.map((char, index) => (
                                <ExternalCharacterCard
                                    key={`${char.source}-${char.external_id || index}`}
                                    character={char}
                                    onAdd={() => handleAddExternalCharacter(char)}
                                />
                            ))}
                            {externalCharacters.length === 0 && !searching && (
                                <div className="col-span-2 text-center py-8">
                                    {!searchPerformed ? (
                                        <p className="text-gray-400">Search for characters to explore online.</p>
                                    ) : (
                                        <p className="text-gray-400">No results found for "{searchTerm}" in {searchCategory === 'all' ? 'any source' : searchCategory}. Try widening your query or try <strong>All sources</strong>.</p>
                                    )}
                                </div>
                            )}
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 pr-2">
                            {filteredCharacters.map((character) => (
                                <CharacterCard
                                    key={character.id}
                                    character={character}
                                    onClick={() => onCharacterSelect(character)}
                                    isFavorite={favoriteIds.has(character.id)}
                                    onToggleFavorite={() => handleToggleFavorite(character.id, favoriteIds.has(character.id))}
                                    showFavoriteButton={true}
                                    isConfirmed={confirmedIds.has(character.id)}
                                    onToggleConfirm={() => toggleConfirm(character.id)}
                                    aiMessage={aiMessages[character.id]}
                                />
                            ))}
                            {filteredCharacters.length === 0 && (
                                <div className="col-span-2 text-center py-8">
                                    <p className="text-gray-400">
                                        {viewMode === 'my-collection' 
                                            ? 'No characters in your collection yet. Explore online to add some!'
                                            : 'No characters found matching your search.'}
                                    </p>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </motion.div>
        </div>
    );
};

export default CharacterSelect;
