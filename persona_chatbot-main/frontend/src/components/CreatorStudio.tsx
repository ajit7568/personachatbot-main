import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { createCharacter } from '../services/api';
import { getToken } from '../services/auth';

const genres = ["Action", "Sci-Fi", "Comedy", "Mystery", "Fantasy", "Anime", "Historical", "Bollywood Inspired", "Regional Cinema"];

const CreatorStudio: React.FC = () => {
    const navigate = useNavigate();
    const [step, setStep] = useState(1);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    
    // Form fields
    const [name, setName] = useState('');
    const [movie, setMovie] = useState('');
    const [genre, setGenre] = useState('Bollywood Inspired');
    const [chatStyle, setChatStyle] = useState('');
    const [imageUrl, setImageUrl] = useState('');
    
    // Example responses
    const [exampleResponses, setExampleResponses] = useState<string[]>(['', '']);

    const handleAddResponse = () => {
        setExampleResponses([...exampleResponses, '']);
    };

    const handleRemoveResponse = (index: number) => {
        const updated = exampleResponses.filter((_, idx) => idx !== index);
        setExampleResponses(updated);
    };

    const handleResponseChange = (index: number, val: string) => {
        const updated = [...exampleResponses];
        updated[index] = val;
        setExampleResponses(updated);
    };

    const handleNext = () => {
        if (step === 1 && (!name.trim() || !movie.trim())) {
            setError('Please fill in character name and origin movie/universe.');
            return;
        }
        if (step === 2 && !chatStyle.trim()) {
            setError('Please describe your character\'s chat style and personality.');
            return;
        }
        setError('');
        setStep(step + 1);
    };

    const handleBack = () => {
        setError('');
        setStep(step - 1);
    };

    const handleSubmit = async () => {
        setLoading(true);
        setError('');

        const cleanedResponses = exampleResponses.filter(r => r.trim() !== '');
        if (cleanedResponses.length === 0) {
            setError('Please provide at least one example quote.');
            setLoading(false);
            return;
        }

        const payload = {
            name: name.trim(),
            movie: movie.trim(),
            chat_style: chatStyle.trim(),
            example_responses: cleanedResponses,
            genre: genre,
            source: 'local',
            image_url: imageUrl.trim() || undefined
        };

        try {
            const newChar = await createCharacter(payload);
            navigate(`/chat?character_id=${newChar.id}`);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to create character. Please check your inputs.');
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-[#0B0F19] text-white flex flex-col font-['Inter']">
            {/* Header */}
            <header className="w-full py-5 px-6 md:px-12 flex items-center justify-between border-b border-white/5 bg-[#0B0F19]/50 backdrop-blur-md sticky top-0 z-50">
                <div className="flex items-center gap-2 cursor-pointer" onClick={() => navigate('/')}>
                    <span className="text-2xl font-black bg-gradient-to-r from-purple-500 via-indigo-400 to-cyan-400 bg-clip-text text-transparent font-outfit tracking-wider">
                        PERSONA.AI
                    </span>
                    <span className="text-xs font-semibold px-2 py-0.5 rounded-md bg-white/5 border border-white/10 text-gray-400 uppercase tracking-widest">
                        Studio
                    </span>
                </div>
                <button 
                    onClick={() => navigate('/explore')}
                    className="text-sm font-semibold text-gray-400 hover:text-white transition-colors"
                >
                    Cancel &rarr;
                </button>
            </header>

            {/* Content Container */}
            <main className="flex-1 flex items-center justify-center p-6 relative z-10 max-w-2xl w-full mx-auto">
                <div className="w-full glass-card p-8 md:p-10 rounded-2xl relative z-20 shadow-2xl border border-white/10">
                    
                    {/* Stepper Progress Bar */}
                    <div className="flex justify-between items-center mb-8 border-b border-white/5 pb-4">
                        {[1, 2, 3, 4].map((s) => (
                            <div key={s} className="flex items-center gap-2">
                                <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold font-outfit transition-all ${
                                    step >= s ? "bg-purple-600 text-white" : "bg-white/5 border border-white/10 text-gray-400"
                                }`}>
                                    {s}
                                </div>
                                {s < 4 && <div className={`w-12 md:w-16 h-0.5 ${step > s ? "bg-purple-600" : "bg-white/5"}`} />}
                            </div>
                        ))}
                    </div>

                    {error && (
                        <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm mb-6">
                            ⚠️ {error}
                        </div>
                    )}

                    <AnimatePresence mode="wait">
                        {step === 1 && (
                            <motion.div
                                initial={{ opacity: 0, x: 10 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -10 }}
                                className="space-y-6"
                            >
                                <div>
                                    <h2 className="text-2xl font-bold font-outfit mb-1">Basic Profile</h2>
                                    <p className="text-gray-400 text-xs mb-6">Set your AI character's fundamental naming and categories.</p>
                                </div>
                                <div className="space-y-4">
                                    <div>
                                        <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Character Name</label>
                                        <input
                                            type="text"
                                            value={name}
                                            onChange={(e) => setName(e.target.value)}
                                            placeholder="e.g. Detective Byomkesh"
                                            className="w-full px-4 py-3 rounded-lg bg-white/5 border border-white/10 focus:outline-none focus:border-purple-500 transition-all text-sm"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Origin Movie or Universe</label>
                                        <input
                                            type="text"
                                            value={movie}
                                            onChange={(e) => setMovie(e.target.value)}
                                            placeholder="e.g. Classic Bengali Literature"
                                            className="w-full px-4 py-3 rounded-lg bg-white/5 border border-white/10 focus:outline-none focus:border-purple-500 transition-all text-sm"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Archetype / Genre</label>
                                        <select
                                            value={genre}
                                            onChange={(e) => setGenre(e.target.value)}
                                            className="w-full px-4 py-3 rounded-lg bg-[#0F1424] border border-white/10 focus:outline-none focus:border-purple-500 transition-all text-sm text-white"
                                        >
                                            {genres.map(g => (
                                                <option key={g} value={g}>{g}</option>
                                            ))}
                                        </select>
                                    </div>
                                </div>
                            </motion.div>
                        )}

                        {step === 2 && (
                            <motion.div
                                initial={{ opacity: 0, x: 10 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -10 }}
                                className="space-y-6"
                            >
                                <div>
                                    <h2 className="text-2xl font-bold font-outfit mb-1">Personality & Tone</h2>
                                    <p className="text-gray-400 text-xs mb-6">Describe how this character talks, behaves, and treats the user.</p>
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Behavior & Style Description</label>
                                    <textarea
                                        value={chatStyle}
                                        onChange={(e) => setChatStyle(e.target.value)}
                                        rows={6}
                                        placeholder="e.g. Calm, exceptionally analytical, and detail-oriented. Speaks with rich vocabulary. Has a habit of questioning tiny contradictions in conversations."
                                        className="w-full px-4 py-3 rounded-lg bg-white/5 border border-white/10 focus:outline-none focus:border-purple-500 transition-all text-sm leading-relaxed"
                                    />
                                </div>
                            </motion.div>
                        )}

                        {step === 3 && (
                            <motion.div
                                initial={{ opacity: 0, x: 10 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -10 }}
                                className="space-y-6"
                            >
                                <div>
                                    <h2 className="text-2xl font-bold font-outfit mb-1">Example Quotes</h2>
                                    <p className="text-gray-400 text-xs mb-6">Add example quotes showing the typical voice, dialect, and phrases.</p>
                                </div>
                                <div className="space-y-4 max-h-[300px] overflow-y-auto pr-2">
                                    {exampleResponses.map((res, idx) => (
                                        <div key={idx} className="flex gap-2 items-center">
                                            <input
                                                type="text"
                                                value={res}
                                                onChange={(e) => handleResponseChange(idx, e.target.value)}
                                                placeholder={`Quote #${idx + 1}...`}
                                                className="flex-1 px-4 py-3 rounded-lg bg-white/5 border border-white/10 focus:outline-none focus:border-purple-500 transition-all text-sm"
                                            />
                                            {exampleResponses.length > 1 && (
                                                <button
                                                    type="button"
                                                    onClick={() => handleRemoveResponse(idx)}
                                                    className="w-10 h-10 rounded-lg border border-red-500/20 text-red-400 hover:bg-red-500/10 flex items-center justify-center transition-all text-sm"
                                                >
                                                    🗑️
                                                </button>
                                            )}
                                        </div>
                                    ))}
                                </div>
                                <button
                                    type="button"
                                    onClick={handleAddResponse}
                                    className="px-4 py-2 text-xs font-semibold border border-purple-500/20 text-purple-400 hover:bg-purple-500/10 rounded-lg transition-all"
                                >
                                    + Add Example Quote
                                </button>
                            </motion.div>
                        )}

                        {step === 4 && (
                            <motion.div
                                initial={{ opacity: 0, x: 10 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -10 }}
                                className="space-y-6"
                            >
                                <div>
                                    <h2 className="text-2xl font-bold font-outfit mb-1">Avatar & Review</h2>
                                    <p className="text-gray-400 text-xs mb-6">Upload an optional image URL and review details.</p>
                                </div>
                                <div className="space-y-4">
                                    <div>
                                        <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Avatar / Image URL</label>
                                        <input
                                            type="text"
                                            value={imageUrl}
                                            onChange={(e) => setImageUrl(e.target.value)}
                                            placeholder="https://example.com/avatar.jpg"
                                            className="w-full px-4 py-3 rounded-lg bg-white/5 border border-white/10 focus:outline-none focus:border-purple-500 transition-all text-sm"
                                        />
                                    </div>
                                    
                                    {/* Final preview box */}
                                    <div className="p-6 rounded-2xl bg-white/5 border border-white/10 space-y-3">
                                        <h4 className="text-sm font-bold text-purple-400 font-outfit uppercase tracking-widest">Character Preview</h4>
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-lg bg-purple-600 flex items-center justify-center font-bold">{name ? name[0] : "?"}</div>
                                            <div>
                                                <div className="font-bold text-sm">{name || "Unnamed Character"}</div>
                                                <div className="text-[10px] text-gray-400 italic">from {movie || "Unknown Universe"}</div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {/* Navigation Buttons */}
                    <div className="flex justify-between items-center mt-10 border-t border-white/5 pt-6">
                        {step > 1 ? (
                            <button
                                type="button"
                                onClick={handleBack}
                                className="px-5 py-2.5 rounded-lg text-sm font-semibold bg-white/5 border border-white/10 hover:bg-white/10 transition-all"
                            >
                                Back
                            </button>
                        ) : (
                            <div />
                        )}

                        {step < 4 ? (
                            <button
                                type="button"
                                onClick={handleNext}
                                className="px-5 py-2.5 rounded-lg text-sm font-semibold bg-purple-600 hover:bg-purple-500 transition-all"
                            >
                                Next Step
                            </button>
                        ) : (
                            <button
                                type="button"
                                onClick={handleSubmit}
                                disabled={loading}
                                className="px-6 py-3 rounded-lg text-sm font-bold bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 transition-all shadow-lg shadow-purple-500/20 disabled:opacity-50"
                            >
                                {loading ? "Creating..." : "Build Persona"}
                            </button>
                        )}
                    </div>

                </div>
            </main>
        </div>
    );
};

export default CreatorStudio;
