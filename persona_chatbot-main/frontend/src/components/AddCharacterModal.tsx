import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Character, createCharacter, favoriteCharacter } from '../services/api';

interface AddCharacterModalProps {
    isOpen: boolean;
    onClose: () => void;
    onAdd: (character: Character) => void;
    autoFavorite?: boolean;
}

const GENRES = ['action', 'drama', 'comedy', 'scifi', 'fantasy'] as const;

const AddCharacterModal: React.FC<AddCharacterModalProps> = ({ isOpen, onClose, onAdd, autoFavorite = true }) => {
    const [name, setName] = useState('');
    const [movie, setMovie] = useState('');
    const [chatStyle, setChatStyle] = useState('');
    const [exampleResponses, setExampleResponses] = useState<string[]>(['']);
    const [genre, setGenre] = useState<string>('');
    const [imageUrl, setImageUrl] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setIsSubmitting(true);
        
        try {
            const characterData: Omit<Character, 'id' | 'created_at' | 'updated_at'> = {
                name,
                movie,
                chat_style: chatStyle,
                example_responses: exampleResponses.filter(response => response.trim() !== ''),
                ...(genre && { genre }),
                ...(imageUrl && { image_url: imageUrl }),
                source: 'local'
            };
            
            const newCharacter = await createCharacter(characterData);
            
            // Auto-favorite if enabled
            if (autoFavorite) {
                try {
                    await favoriteCharacter(newCharacter.id);
                } catch (favError) {
                    console.warn('Failed to auto-favorite character:', favError);
                    // Don't fail the whole operation if favoriting fails
                }
            }
            
            onAdd(newCharacter);
            
            // Reset form
            setName('');
            setMovie('');
            setChatStyle('');
            setExampleResponses(['']);
            setGenre('');
            setImageUrl('');
            onClose();
        } catch (err: any) {
            setError(err.message || 'Failed to create character');
        } finally {
            setIsSubmitting(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
            <motion.div
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.95, opacity: 0 }}
                className="bg-gray-800 rounded-lg p-6 w-full max-w-md"
            >
                <h2 className="text-2xl font-bold mb-4 text-white">Add New Character</h2>
                {error && (
                    <div className="mb-4 p-3 bg-red-500/20 border border-red-500/50 rounded-lg text-red-300 text-sm">
                        {error}
                    </div>
                )}
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">
                            Character Name *
                        </label>
                        <input
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            className="w-full p-2 bg-gray-700 text-white rounded border border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
                            required
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">
                            Movie/Show/Book *
                        </label>
                        <input
                            type="text"
                            value={movie}
                            onChange={(e) => setMovie(e.target.value)}
                            className="w-full p-2 bg-gray-700 text-white rounded border border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
                            required
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">
                            Chat Style *
                        </label>
                        <input
                            type="text"
                            value={chatStyle}
                            onChange={(e) => setChatStyle(e.target.value)}
                            className="w-full p-2 bg-gray-700 text-white rounded border border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="e.g., witty and sarcastic"
                            required
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">
                            Genre
                        </label>
                        <select
                            value={genre}
                            onChange={(e) => setGenre(e.target.value)}
                            className="w-full p-2 bg-gray-700 text-white rounded border border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                            <option value="">Select a genre (optional)</option>
                            {GENRES.map(g => (
                                <option key={g} value={g}>{g.charAt(0).toUpperCase() + g.slice(1)}</option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">
                            Image URL
                        </label>
                        <input
                            type="url"
                            value={imageUrl}
                            onChange={(e) => setImageUrl(e.target.value)}
                            className="w-full p-2 bg-gray-700 text-white rounded border border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="https://example.com/image.jpg"
                        />
                        {imageUrl && (
                            <div className="mt-2">
                                <img 
                                    src={imageUrl} 
                                    alt="Preview" 
                                    className="w-24 h-24 object-cover rounded"
                                    onError={(e) => {
                                        (e.target as HTMLImageElement).style.display = 'none';
                                    }}
                                />
                            </div>
                        )}
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">
                            Example Responses
                        </label>
                        {exampleResponses.map((response, index) => (
                            <div key={index} className="flex gap-2 mb-2">
                                <input
                                    type="text"
                                    value={response}
                                    onChange={(e) => {
                                        const newResponses = [...exampleResponses];
                                        newResponses[index] = e.target.value;
                                        setExampleResponses(newResponses);
                                    }}
                                    className="flex-1 p-2 bg-gray-700 text-white rounded border border-gray-600"
                                    placeholder="Enter an example response"
                                />
                                <button
                                    type="button"
                                    onClick={() => {
                                        const newResponses = exampleResponses.filter((_, i) => i !== index);
                                        setExampleResponses(newResponses.length ? newResponses : ['']);
                                    }}
                                    className="p-2 text-red-500 hover:text-red-400"
                                >
                                    Remove
                                </button>
                            </div>
                        ))}
                        <button
                            type="button"
                            onClick={() => setExampleResponses([...exampleResponses, ''])}
                            className="text-blue-500 hover:text-blue-400 text-sm"
                        >
                            + Add Response
                        </button>
                    </div>
                    <div className="flex justify-end gap-2">
                        <button
                            type="button"
                            onClick={onClose}
                            disabled={isSubmitting}
                            className="px-4 py-2 text-gray-300 hover:text-white disabled:opacity-50"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={isSubmitting}
                            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {isSubmitting ? 'Adding...' : 'Add Character'}
                        </button>
                    </div>
                </form>
            </motion.div>
        </div>
    );
};

export default AddCharacterModal;