import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Character } from '../services/api';

interface AddCharacterModalProps {
    isOpen: boolean;
    onClose: () => void;
    onAdd: (character: Omit<Character, 'id' | 'created_at' | 'updated_at'>) => void;
}

const AddCharacterModal: React.FC<AddCharacterModalProps> = ({ isOpen, onClose, onAdd }) => {
    const [name, setName] = useState('');
    const [movie, setMovie] = useState('');
    const [chatStyle, setChatStyle] = useState('');
    const [exampleResponses, setExampleResponses] = useState<string[]>(['']);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onAdd({
            name,
            movie,
            chat_style: chatStyle,
            example_responses: exampleResponses.filter(response => response.trim() !== '')
        });
        onClose();
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
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">
                            Character Name
                        </label>
                        <input
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            className="w-full p-2 bg-gray-700 text-white rounded border border-gray-600"
                            required
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">
                            Movie
                        </label>
                        <input
                            type="text"
                            value={movie}
                            onChange={(e) => setMovie(e.target.value)}
                            className="w-full p-2 bg-gray-700 text-white rounded border border-gray-600"
                            required
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">
                            Chat Style
                        </label>
                        <input
                            type="text"
                            value={chatStyle}
                            onChange={(e) => setChatStyle(e.target.value)}
                            className="w-full p-2 bg-gray-700 text-white rounded border border-gray-600"
                            placeholder="e.g., witty and sarcastic"
                            required
                        />
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
                            className="px-4 py-2 text-gray-300 hover:text-white"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                        >
                            Add Character
                        </button>
                    </div>
                </form>
            </motion.div>
        </div>
    );
};

export default AddCharacterModal;