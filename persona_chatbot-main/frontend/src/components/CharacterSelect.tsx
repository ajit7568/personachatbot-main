import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Character, fetchCharacters } from '../services/api';
import {
    SparklesIcon,
    FilmIcon,
    ChatBubbleLeftRightIcon,
    ChatBubbleOvalLeftIcon,
    MagnifyingGlassIcon,
    XMarkIcon
} from '@heroicons/react/24/solid';

interface CharacterSelectProps {
    onCharacterSelect: (character: Character) => void;
    isOpen: boolean;
}

// Genre-based background gradients
const genreBackgrounds = {
    'action': 'from-red-500/20 to-orange-600/20',
    'drama': 'from-blue-500/20 to-purple-600/20',
    'comedy': 'from-yellow-500/20 to-green-600/20',
    'scifi': 'from-cyan-500/20 to-blue-600/20',
    'fantasy': 'from-purple-500/20 to-pink-600/20',
    'default': 'from-gray-600/20 to-gray-700/20'
};

// Function to determine genre based on movie/show name or chat style
const getGenre = (character: Character): keyof typeof genreBackgrounds => {
    const { movie, chat_style } = character;
    const text = (movie + ' ' + chat_style).toLowerCase();
    
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
}> = ({ character, onClick }) => {
    const genre = getGenre(character);
    const [isExpanded, setIsExpanded] = useState(false);

    const handleClick = (e: React.MouseEvent) => {
        if ((e.target as HTMLElement).closest('.expand-responses')) {
            e.stopPropagation();
            setIsExpanded(!isExpanded);
        } else {
            onClick();
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
            {/* Character Icon/Avatar */}
            <div className="absolute top-4 right-4 w-12 h-12 rounded-full bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center shadow-lg">
                <span className="text-2xl">
                    {character.name.charAt(0)}
                </span>
            </div>

            {/* Header Section */}
            <motion.div layout="position" className="pr-16">
                <h3 className="text-2xl font-bold text-white mb-2 leading-tight">{character.name}</h3>
                <div className="flex flex-wrap gap-3 text-sm">
                    <div className="flex items-center px-3 py-1 rounded-full bg-gray-700/50 text-gray-300">
                        <FilmIcon className="w-4 h-4 mr-1" />
                        <span>{character.movie}</span>
                    </div>
                    <div className="flex items-center px-3 py-1 rounded-full bg-gray-700/50 text-gray-300">
                        <ChatBubbleLeftRightIcon className="w-4 h-4 mr-1" />
                        <span>{character.chat_style}</span>
                    </div>
                </div>
            </motion.div>

            {/* Example Responses Section */}
            <motion.div layout="position" className="mt-6">
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
        </motion.div>
    );
};

export const CharacterSelect: React.FC<CharacterSelectProps> = ({ onCharacterSelect, isOpen }) => {
    const [characters, setCharacters] = useState<Character[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedGenre, setSelectedGenre] = useState<keyof typeof genreBackgrounds | 'all'>('all');

    useEffect(() => {
        const loadCharacters = async () => {
            try {
                setLoading(true);
                const data = await fetchCharacters();
                setCharacters(data);
            } catch (err) {
                setError('Failed to load characters');
            } finally {
                setLoading(false);
            }
        };

        if (isOpen) {
            loadCharacters();
        }
    }, [isOpen]);

    const filteredCharacters = characters.filter(char => {
        const matchesSearch = 
            char.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            char.movie.toLowerCase().includes(searchTerm.toLowerCase()) ||
            char.chat_style.toLowerCase().includes(searchTerm.toLowerCase());
        
        const matchesGenre = selectedGenre === 'all' || getGenre(char) === selectedGenre;
        
        return matchesSearch && matchesGenre;
    });

    if (!isOpen) return null;

    if (loading) {
        return (
            <div className="fixed inset-0 bg-gray-900/75 backdrop-blur-sm flex items-center justify-center">
                <motion.div
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="bg-gray-800 p-6 rounded-xl shadow-xl"
                >
                    <div className="flex items-center space-x-4">
                        <SparklesIcon className="w-8 h-8 text-blue-500 animate-pulse" />
                        <p className="text-white text-lg">Loading characters...</p>
                    </div>
                </motion.div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="fixed inset-0 bg-gray-900/75 backdrop-blur-sm flex items-center justify-center">
                <div className="bg-gray-800 p-6 rounded-xl shadow-xl">
                    <p className="text-red-500">{error}</p>
                </div>
            </div>
        );
    }

    return (
        <div className="fixed inset-0 bg-gray-900/75 backdrop-blur-sm flex items-center justify-center p-4">
            <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="bg-gray-800 rounded-xl p-6 w-full max-w-6xl max-h-[90vh] overflow-hidden flex flex-col"
            >
                {/* Header with Search and Filters */}
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

                {/* Character Grid */}
                <div className="overflow-y-auto flex-1">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 pr-2">
                        {filteredCharacters.map((character) => (
                            <CharacterCard
                                key={character.id}
                                character={character}
                                onClick={() => onCharacterSelect(character)}
                            />
                        ))}
                    </div>
                    
                    {filteredCharacters.length === 0 && (
                        <div className="text-center py-8">
                            <p className="text-gray-400">No characters found matching your search.</p>
                        </div>
                    )}
                </div>
            </motion.div>
        </div>
    );
};

export default CharacterSelect;