import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence, LazyMotion, domAnimation } from 'framer-motion';
import axios from 'axios';
import { 
    PaperAirplaneIcon, 
    ChevronDownIcon,
    Bars3Icon,
    UserCircleIcon,
    ArrowLeftOnRectangleIcon,
    Cog6ToothIcon,
    UserGroupIcon,
    MicrophoneIcon,
    SpeakerWaveIcon,
    SpeakerXMarkIcon,
    ChatBubbleLeftIcon
} from '@heroicons/react/24/solid';
import MessageBubble from './MessageBubble';
import TypingIndicator from './TypingIndicator';
import VoiceIndicator from './VoiceIndicator';
import { CharacterSelect } from './CharacterSelect';
import { containerVariants, dropdownVariants } from '../styles/variants';
import { fetchCharacters, streamMessage, fetchChatMessages, fetchChatSessions, StreamResponse, ChatSession } from '../services/api';
import { Character } from '../services/api';
import { logout, getCurrentUser } from '../services/auth';
import { useSpeech } from '../hooks/useSpeech';
import MessageList from './MessageList';
import { useNavigate } from 'react-router-dom';

// Using Character interface imported from API service

interface Message {
    text: string;
    isUser: boolean;
    id: string;
    isStreaming?: boolean;
    character?: Character;
    timestamp?: Date;
    fadeOut?: boolean;
    fadeIn?: boolean;
}

const Chat: React.FC = () => {
    const [messages, setMessages] = useState<Message[]>([]);
    const [input, setInput] = useState<string>('');
    const [characters, setCharacters] = useState<Character[]>([]);
    const [selectedCharacter, setSelectedCharacter] = useState<Character | null>(null);
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [isSidebarOpen, setIsSidebarOpen] = useState(true);
    const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
    const [chatSessions, setChatSessions] = useState<ChatSession[]>([]);
    const [selectedChatSession, setSelectedChatSession] = useState<string | null>(null);
    const [isCharacterSelectOpen, setIsCharacterSelectOpen] = useState(false);
    const [isSpeechEnabled, setIsSpeechEnabled] = useState(true);
    const [isLoadingHistory, setIsLoadingHistory] = useState(false);

    const navigate = useNavigate();

    // Add authentication error handler
    const handleAuthError = useCallback(() => {
        logout();
        navigate('/');
    }, [navigate]);

    const {
        startListening,
        stopListening,
        speak,
        isListening,
        isSpeaking,
        error: speechError
    } = useSpeech({
        onSpeechResult: (text) => {
            setInput(text);
            // Auto-send message when received from speech
            handleSendMessage(new Event('submit') as any);
        },
        onSpeechEnd: () => {
            // Handle any cleanup needed when speech recognition ends
        }
    });

    const messagesEndRef = useRef<HTMLDivElement>(null);
    const dropdownRef = useRef<HTMLDivElement>(null);
    const userMenuRef = useRef<HTMLDivElement>(null);

    const scrollToBottom = useCallback(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, []);

    useEffect(() => {
        const checkAuth = async () => {
            try {
                const user = await getCurrentUser();
                if (!user) {
                    handleAuthError();
                    return;
                }
            } catch (error) {
                handleAuthError();
            }
        };

        checkAuth();
        loadCharacters();
        loadChatSessions();

        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsDropdownOpen(false);
            }
            if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
                setIsUserMenuOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [handleAuthError]);

    useEffect(() => {
        scrollToBottom();
    }, [messages, isLoading, scrollToBottom]);

    const loadCharacters = async () => {
        try {
            const data = await fetchCharacters();
            setCharacters(data);
        } catch (error) {
            if (axios.isAxiosError(error) && error.response?.status === 401) {
                handleAuthError();
            } else {
                setError('Failed to load characters');
                console.error('Error fetching characters:', error);
            }
        }
    };

    const loadChatSessions = async () => {
        try {
            const sessions = await fetchChatSessions();
            setChatSessions(sessions);
        } catch (error) {
            console.error('Error loading chat sessions:', error);
            if (axios.isAxiosError(error) && error.response?.status === 401) {
                handleAuthError();
            } else {
                setError('Failed to load chat history');
            }
        }
    };

    const loadChatMessages = async (sessionId: string) => {
        // Prevent loading if already loading this chat
        if (isLoadingHistory || sessionId === selectedChatSession) return;
        
        try {
            setIsLoadingHistory(true);
            setError(null);
            
            const chatMessages = await fetchChatMessages(sessionId);
            
            if (!chatMessages || !Array.isArray(chatMessages)) {
                throw new Error('Invalid chat history format');
            }

            if (chatMessages.length === 0) {
                setMessages([]);
                setSelectedChatSession(sessionId);
                return;
            }

            // Format messages and set them all at once
            const formattedMessages: Message[] = chatMessages.map((msg) => ({
                id: msg.id.toString(),
                text: msg.message,
                isUser: !msg.is_bot,
                character: characters.find(c => c.id === msg.character_id),
                timestamp: new Date(msg.timestamp)
            }));

            setMessages(formattedMessages);
            setSelectedChatSession(sessionId);
            
            // Set character if it exists in the messages
            const botMessage = chatMessages.find(msg => msg.character_id);
            if (botMessage) {
                const character = characters.find(c => c.id === botMessage.character_id);
                if (character) setSelectedCharacter(character);
            }

            // Scroll to bottom after messages are loaded
            setTimeout(scrollToBottom, 100);
        } catch (error) {
            console.error('Error loading chat messages:', error);
            let errorMessage = 'Failed to load chat messages.';
            
            if (error instanceof Error) {
                errorMessage = error.message;
            } else if (axios.isAxiosError(error)) {
                if (error.response?.status === 401) {
                    handleAuthError();
                    return;
                }
                errorMessage = error.response?.data?.detail || 'Network error while loading chat messages';
            }
            
            setError(errorMessage);
            setMessages([]); // Clear messages on error
            setSelectedChatSession(null); // Reset selected session on error
        } finally {
            setIsLoadingHistory(false);
        }
    };

    const handleLogout = () => {
        logout();
    };

    const handleSettings = () => {
        console.log('Opening settings...');
    };

    const handleSendMessage = async (e: React.FormEvent) => {
        e.preventDefault();
        if (input.trim() && !isLoading) {
            const userMessageId = Date.now().toString();
            const userMessage = { 
                text: input, 
                isUser: true, 
                id: userMessageId,
                character: selectedCharacter || undefined,
                timestamp: new Date()
            };
            
            setMessages(prev => [...prev, userMessage]);
            setInput('');
            setIsLoading(true);
            setError(null);
            
            try {
                const botMessageId = (Date.now() + 1).toString();
                let fullResponse = '';
                
                setMessages(prev => [...prev, { 
                    text: '', 
                    isUser: false, 
                    id: botMessageId,
                    isStreaming: true,
                    character: selectedCharacter || undefined,
                    timestamp: new Date()
                }]);

                await streamMessage(
                    {
                        message: input,
                        character_id: selectedCharacter?.id,
                        chat_session: selectedChatSession || undefined,
                        timestamp: new Date().toISOString()
                    },
                    (data: StreamResponse) => {
                        if (data.error) {
                            setError(data.error);
                            setMessages(prev => prev.filter(msg => msg.id !== botMessageId));
                            setIsLoading(false);
                            if (data.error.includes('authenticated')) {
                                window.location.href = '/';
                            }
                        } else {
                            fullResponse += data.text || '';
                            setMessages(prev => prev.map(msg => 
                                msg.id === botMessageId 
                                    ? { 
                                        ...msg, 
                                        text: fullResponse,
                                        isStreaming: !data.done 
                                    }
                                    : msg
                            ));

                            if (data.done) {
                                setIsLoading(false);
                                if (data.chat_session) {
                                    setSelectedChatSession(data.chat_session);
                                    loadChatSessions(); // Refresh the chat list
                                }
                                if (isSpeechEnabled && fullResponse) {
                                    speak(fullResponse);
                                }
                            }
                            scrollToBottom();
                        }
                    }
                );
            } catch (error) {
                const errorMessage = error instanceof Error ? error.message : 'Failed to send message';
                setError(errorMessage);
                setIsLoading(false);
                if ((error as any)?.response?.status === 401) {
                    window.location.href = '/';
                }
            }
        }
    };

    const handleCharacterSelect = async (character: Character) => {
        // Clear any existing chat state
        setMessages([]);
        setSelectedChatSession(null);
        setInput('');
        setError(null);
        setIsLoading(false);
        
        // Set the new character
        setSelectedCharacter(character);
        setIsCharacterSelectOpen(false);
    };

    const startNewChat = () => {
        // Clear messages and selected chat session
        setMessages([]);
        setSelectedChatSession(null);
        
        // If a character is selected, show their welcome message
        if (selectedCharacter) {
            setMessages([{
                id: 'welcome',
                text: selectedCharacter.id === 0 
                    ? "Starting a new chat. How can I help you?"
                    : `Starting a new chat with ${selectedCharacter.name}. How can I assist you?`,
                isUser: false,
                character: selectedCharacter,
                timestamp: new Date()
            }]);
        }
    };

    const handleSidebarChat = async (sessionId: string) => {
        if (selectedChatSession === sessionId) return;
        await loadChatMessages(sessionId);
    };

    const handleNewChat = () => {
        startNewChat();
        setIsSidebarOpen(true);
    };

    return (
        <LazyMotion features={domAnimation}>
            <div className="flex h-screen bg-gray-900">
                {/* Chat History Sidebar */}
                <motion.div 
                    initial={{ x: isSidebarOpen ? 0 : -320 }}
                    animate={{ x: isSidebarOpen ? 0 : -320 }}
                    transition={{ type: "spring", stiffness: 300, damping: 30 }}
                    className="w-80 bg-gray-800 border-r border-gray-700 flex flex-col h-screen"
                >
                    <div className="p-4 border-b border-gray-700">
                        <button
                            onClick={handleNewChat}
                            className="w-full py-3 px-4 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors duration-200 flex items-center justify-center gap-2 font-medium"
                        >
                            <PaperAirplaneIcon className="w-5 h-5" />
                            New Chat
                        </button>
                    </div>
                    <div className="flex-1 overflow-y-auto">
                        <div className="p-2 space-y-2">
                            {chatSessions.length === 0 ? (
                                <div className="text-center py-8">
                                    <p className="text-gray-400">No chat history</p>
                                </div>
                            ) : (
                                chatSessions.map((session) => (
                                    <motion.button
                                        key={session.chat_session}
                                        onClick={() => handleSidebarChat(session.chat_session)}
                                        className={`w-full p-3 rounded-lg text-left transition-all duration-200 group ${
                                            selectedChatSession === session.chat_session 
                                                ? 'bg-gray-600/50 hover:bg-gray-600' 
                                                : 'hover:bg-gray-700'
                                        }`}
                                    >
                                        <div className="flex items-start gap-3">
                                            <div className={`flex-shrink-0 w-4 h-4 mt-1 ${
                                                selectedChatSession === session.chat_session ? 'text-white' : 'text-gray-400'
                                            }`}>
                                                <ChatBubbleLeftIcon className="w-4 h-4" />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <h3 className="text-sm font-medium text-gray-200 truncate group-hover:text-white">
                                                    {session.title}
                                                </h3>
                                                <p className="text-xs text-gray-400 truncate mt-1">
                                                    {session.last_message}
                                                </p>
                                            </div>
                                            <time className="text-xs text-gray-500 flex-shrink-0">
                                                {new Date(session.timestamp).toLocaleDateString()}
                                            </time>
                                        </div>
                                    </motion.button>
                                ))
                            )}
                        </div>
                    </div>
                </motion.div>

                {/* Rest of the chat interface */}
                <div className="flex-1 flex flex-col">
                    <div className="h-16 border-b border-gray-700 flex items-center justify-between px-4">
                        <button
                            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                            className="p-2 hover:bg-gray-700 rounded-lg transition-colors duration-200"
                        >
                            <Bars3Icon className="w-6 h-6 text-white" />
                        </button>

                        <button
                            onClick={() => setIsCharacterSelectOpen(true)}
                            className="flex items-center space-x-2 p-2 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors duration-200 text-white"
                        >
                            <UserGroupIcon className="w-5 h-5" />
                            <span>{selectedCharacter ? selectedCharacter.name : 'Select Character'}</span>
                        </button>

                        <div className="relative" ref={userMenuRef}>
                            <button
                                onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                                className="p-2 hover:bg-gray-700 rounded-full transition-colors duration-200"
                            >
                                <UserCircleIcon className="w-8 h-8 text-white" />
                            </button>

                            <AnimatePresence>
                                {isUserMenuOpen && (
                                    <motion.div
                                        variants={dropdownVariants}
                                        initial="hidden"
                                        animate="visible"
                                        exit="hidden"
                                        className="absolute right-0 mt-2 w-48 bg-gray-700 rounded-lg shadow-xl z-10"
                                    >
                                        <div className="py-2">
                                            <button
                                                onClick={handleSettings}
                                                className="w-full px-4 py-2 text-left text-white hover:bg-gray-600 transition-colors duration-200 flex items-center"
                                            >
                                                <Cog6ToothIcon className="w-5 h-5 mr-2" />
                                                Settings
                                            </button>
                                            <button
                                                onClick={handleLogout}
                                                className="w-full px-4 py-2 text-left text-white hover:bg-gray-600 transition-colors duration-200 flex items-center"
                                            >
                                                <ArrowLeftOnRectangleIcon className="w-5 h-5 mr-2" />
                                                Logout
                                            </button>
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>
                    </div>

                    <div className="flex-1 overflow-y-auto p-4">
                        {isLoadingHistory ? (
                            <div className="flex justify-center items-center h-full">
                                <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                <MessageList 
                                    messages={messages}
                                    isLoading={isLoading}
                                    error={error}
                                />
                                <div ref={messagesEndRef} />
                            </div>
                        )}
                    </div>

                    <div className="p-4 border-t border-gray-700">
                        <form onSubmit={handleSendMessage} className="flex gap-2">
                            <div className="flex gap-2">
                                <motion.button
                                    type="button"
                                    whileHover={{ scale: 1.05 }}
                                    whileTap={{ scale: 0.95 }}
                                    onClick={() => {
                                        if (isListening) {
                                            stopListening();
                                        } else {
                                            startListening();
                                        }
                                    }}
                                    className={`p-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-gray-800 transition-colors duration-200 ${
                                        isListening 
                                            ? 'bg-blue-600 text-white' 
                                            : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                                    }`}
                                >
                                    <MicrophoneIcon className="w-6 h-6" />
                                </motion.button>
                                <motion.button
                                    type="button"
                                    whileHover={{ scale: 1.05 }}
                                    whileTap={{ scale: 0.95 }}
                                    onClick={() => setIsSpeechEnabled(!isSpeechEnabled)}
                                    className={`p-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-gray-800 transition-colors duration-200 ${
                                        isSpeechEnabled 
                                            ? 'bg-purple-600 text-white' 
                                            : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                                    }`}
                                >
                                    {isSpeechEnabled ? (
                                        <SpeakerWaveIcon className="w-6 h-6" />
                                    ) : (
                                        <SpeakerXMarkIcon className="w-6 h-6" />
                                    )}
                                </motion.button>
                            </div>
                            <input
                                type="text"
                                value={input}
                                onChange={(e) => setInput(e.target.value)}
                                placeholder={isListening ? 'Listening...' : 'Type your message...'}
                                className="flex-1 p-3 rounded-lg bg-gray-700 text-white placeholder-gray-400 border border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            />
                            <motion.button
                                type="submit"
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                disabled={isLoading || !input.trim()}
                                className="p-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-gray-800 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                <PaperAirplaneIcon className="w-6 h-6" />
                            </motion.button>
                        </form>
                    </div>
                </div>
            </div>

            <CharacterSelect
                isOpen={isCharacterSelectOpen}
                onCharacterSelect={handleCharacterSelect}
            />
        </LazyMotion>
    );
};

export default Chat;