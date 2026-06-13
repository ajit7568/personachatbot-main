import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence, LazyMotion, domAnimation } from 'framer-motion';
import axios from 'axios';
import { 
    PaperAirplaneIcon, 
    Bars3Icon,
    UserCircleIcon,
    ArrowLeftOnRectangleIcon,
    Cog6ToothIcon,
    UserGroupIcon,
    MicrophoneIcon,
    SpeakerWaveIcon,
    SpeakerXMarkIcon,
    ChatBubbleLeftIcon,
    TrashIcon,
    PencilIcon,
    SparklesIcon,
    GlobeAltIcon,
    ArrowTrendingUpIcon,
    InformationCircleIcon
} from '@heroicons/react/24/solid';
import MessageBubble from './MessageBubble';
import TypingIndicator from './TypingIndicator';
import { CharacterSelect } from './CharacterSelect';
import { ConfirmationDialog } from './ConfirmationDialog';
import { fetchCharacters, streamMessage, fetchChatMessages, fetchChatSessions, deleteChatSession, renameChatSession, StreamResponse, ChatSession } from '../services/api';
import { Character } from '../services/api';
import { logout, getCurrentUser } from '../services/auth';
import { useSpeech } from '../hooks/useSpeech';
import MessageList from './MessageList';
import { useNavigate } from 'react-router-dom';

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
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [isSidebarOpen, setIsSidebarOpen] = useState(true);
    const [isDetailsOpen, setIsDetailsOpen] = useState(true);
    const [chatSessions, setChatSessions] = useState<ChatSession[]>([]);
    const [selectedChatSession, setSelectedChatSession] = useState<string | null>(null);
    const [isCharacterSelectOpen, setIsCharacterSelectOpen] = useState(false);
    const [isSpeechEnabled, setIsSpeechEnabled] = useState(() => localStorage.getItem('tts_enabled') === 'true');
    const [isLoadingHistory, setIsLoadingHistory] = useState(false);
    const [renamingSessionId, setRenamingSessionId] = useState<string | null>(null);
    const [renameValue, setRenameValue] = useState<string>('');
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [sessionToDelete, setSessionToDelete] = useState<string | null>(null);
    const [sessionToDeleteTitle, setSessionToDeleteTitle] = useState<string>('');
    const [currentUserEmail, setCurrentUserEmail] = useState<string>('');

    const navigate = useNavigate();

    // Helper functions for localStorage title management
    const getCustomTitle = (chatSession: string): string | null => {
        const titles = JSON.parse(localStorage.getItem('chatSessionTitles') || '{}');
        return titles[chatSession] || null;
    };

    const setCustomTitle = (chatSession: string, title: string): void => {
        const titles = JSON.parse(localStorage.getItem('chatSessionTitles') || '{}');
        titles[chatSession] = title;
        localStorage.setItem('chatSessionTitles', JSON.stringify(titles));
    };

    const removeCustomTitle = (chatSession: string): void => {
        const titles = JSON.parse(localStorage.getItem('chatSessionTitles') || '{}');
        delete titles[chatSession];
        localStorage.setItem('chatSessionTitles', JSON.stringify(titles));
    };

    const handleAuthError = useCallback(() => {
        logout();
        navigate('/login');
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
        },
        onSpeechEnd: () => {
            // Speech ended
        }
    });

    const messagesEndRef = useRef<HTMLDivElement>(null);
    const messageContainerRef = useRef<HTMLDivElement>(null);

    const scrollToBottom = useCallback(() => {
        if (messageContainerRef.current) {
            messageContainerRef.current.scrollTo({
                top: messageContainerRef.current.scrollHeight,
                behavior: "smooth"
            });
        }
    }, []);

    useEffect(() => {
        const checkAuth = async () => {
            try {
                const user = await getCurrentUser();
                if (!user) {
                    handleAuthError();
                    return;
                }
                setCurrentUserEmail(user.email);
            } catch (error) {
                handleAuthError();
            }
        };

        checkAuth();
        loadCharacters();
        loadChatSessions();
    }, [handleAuthError]);

    useEffect(() => {
        scrollToBottom();
    }, [messages, isLoading, scrollToBottom]);

    // Parse URL params for a selected character (e.g. ?character_id=3)
    useEffect(() => {
        const urlParams = new URLSearchParams(window.location.search);
        const charIdStr = urlParams.get('character_id');
        if (charIdStr && characters.length > 0) {
            const charId = parseInt(charIdStr);
            const found = characters.find(c => c.id === charId);
            if (found) {
                handleCharacterSelect(found);
            }
        }
    }, [characters]);

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
            const sessionsWithCustomTitles = sessions.map(session => ({
                ...session,
                title: getCustomTitle(session.chat_session) || session.title
            }));
            setChatSessions(sessionsWithCustomTitles);
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

            const formattedMessages: Message[] = chatMessages.map((msg) => ({
                id: msg.id.toString(),
                text: msg.content || msg.message,
                isUser: msg.role === "user" || (!msg.role && !msg.is_bot),
                character: characters.find(c => c.id === msg.character_id),
                timestamp: new Date(msg.timestamp)
            }));

            setMessages(formattedMessages);
            setSelectedChatSession(sessionId);
            
            const botMessage = chatMessages.find(msg => msg.character_id);
            if (botMessage) {
                const character = characters.find(c => c.id === botMessage.character_id);
                if (character) setSelectedCharacter(character);
            }

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
            setMessages([]);
            setSelectedChatSession(null);
        } finally {
            setIsLoadingHistory(false);
        }
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
                                handleAuthError();
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
                                    loadChatSessions();
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
                    handleAuthError();
                }
            }
        }
    };

    const handleCharacterSelect = async (character: Character) => {
        setMessages([]);
        setSelectedChatSession(null);
        setInput('');
        setError(null);
        setIsLoading(false);
        setSelectedCharacter(character);
        setIsCharacterSelectOpen(false);
    };

    const startNewChat = () => {
        setMessages([]);
        setSelectedChatSession(null);
        
        if (selectedCharacter) {
            setMessages([{
                id: 'welcome',
                text: `Starting a new conversation with ${selectedCharacter.name}. What would you like to discuss?`,
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
    };

    const handleDeleteSession = async (e: React.MouseEvent, session: ChatSession) => {
        e.stopPropagation();
        setSessionToDelete(session.chat_session);
        setSessionToDeleteTitle(session.title);
        setDeleteDialogOpen(true);
    };

    const confirmDeleteSession = async () => {
        if (!sessionToDelete) return;
        
        try {
            await deleteChatSession(sessionToDelete);
            removeCustomTitle(sessionToDelete);
            setChatSessions(prev => prev.filter(s => s.chat_session !== sessionToDelete));
            if (selectedChatSession === sessionToDelete) {
                setSelectedChatSession(null);
                setMessages([]);
            }
        } catch (error) {
            console.error('Error deleting chat session:', error);
            alert(error instanceof Error ? error.message : 'Failed to delete chat session');
        } finally {
            setSessionToDelete(null);
            setSessionToDeleteTitle('');
        }
    };

    const handleStartRename = (e: React.MouseEvent, session: ChatSession) => {
        e.stopPropagation();
        setRenamingSessionId(session.chat_session);
        setRenameValue(getCustomTitle(session.chat_session) || session.title);
    };

    const handleCancelRename = () => {
        setRenamingSessionId(null);
        setRenameValue('');
    };

    const handleSaveRename = async (chatSession: string) => {
        if (!renameValue.trim()) {
            alert('Title cannot be empty');
            return;
        }
        try {
            await renameChatSession(chatSession, renameValue.trim());
            setCustomTitle(chatSession, renameValue.trim());
            setChatSessions(prev => prev.map(s => 
                s.chat_session === chatSession 
                    ? { ...s, title: renameValue.trim() }
                    : s
            ));
            setRenamingSessionId(null);
            setRenameValue('');
        } catch (error) {
            console.error('Error renaming chat session:', error);
            alert(error instanceof Error ? error.message : 'Failed to rename chat session');
        }
    };

    return (
        <LazyMotion features={domAnimation}>
            <div className="relative flex h-screen bg-[#0B0F19] overflow-hidden text-white font-['Inter']">
                {/* Glowing environment overlay */}
                <div className="absolute top-[-20%] left-[-10%] w-[500px] h-[500px] rounded-full bg-purple-900/10 blur-[150px] pointer-events-none" />
                <div className="absolute bottom-[-10%] right-[-10%] w-[500px] h-[500px] rounded-full bg-blue-900/10 blur-[150px] pointer-events-none" />

                {/* Left Column (Sidebar) */}
                <AnimatePresence>
                    {isSidebarOpen && (
                        <motion.div 
                            initial={{ x: -320, opacity: 0 }}
                            animate={{ x: 0, opacity: 1 }}
                            exit={{ x: -320, opacity: 0 }}
                            transition={{ type: "spring", stiffness: 300, damping: 30 }}
                            className="w-80 bg-[#0B0F19]/60 backdrop-blur-xl border-r border-white/5 flex flex-col h-full z-20 flex-shrink-0"
                        >
                            {/* App Logo & Title */}
                            <div className="p-5 border-b border-white/5 flex items-center justify-between">
                                <span className="text-xl font-black bg-gradient-to-r from-purple-500 via-indigo-400 to-cyan-400 bg-clip-text text-transparent font-outfit tracking-widest cursor-pointer" onClick={() => navigate('/')}>
                                    PERSONA.AI
                                </span>
                            </div>

                            {/* Create/Explore Shortcuts */}
                            <div className="p-4 space-y-2 border-b border-white/5">
                                <button
                                    onClick={handleNewChat}
                                    className="w-full py-3 px-4 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white rounded-xl transition-all duration-200 flex items-center justify-center gap-2 font-semibold shadow-lg shadow-purple-500/10 text-sm"
                                >
                                    + Start New Chat
                                </button>
                                
                                <div className="grid grid-cols-2 gap-2 mt-2">
                                    <button
                                        onClick={() => navigate('/explore')}
                                        className="py-2.5 px-3 bg-white/5 hover:bg-white/10 border border-white/5 rounded-lg flex flex-col items-center justify-center gap-1 transition-all text-xs font-semibold text-gray-300"
                                    >
                                        <GlobeAltIcon className="w-4 h-4 text-purple-400" />
                                        <span>Explore</span>
                                    </button>
                                    <button
                                        onClick={() => navigate('/create')}
                                        className="py-2.5 px-3 bg-white/5 hover:bg-white/10 border border-white/5 rounded-lg flex flex-col items-center justify-center gap-1 transition-all text-xs font-semibold text-gray-300"
                                    >
                                        <SparklesIcon className="w-4 h-4 text-indigo-400" />
                                        <span>Create AI</span>
                                    </button>
                                </div>
                            </div>

                            {/* Navigation List */}
                            <div className="px-4 py-3 border-b border-white/5 space-y-1.5">
                                <button
                                    onClick={() => navigate('/dashboard')}
                                    className="w-full py-2 px-3 hover:bg-white/5 rounded-lg flex items-center gap-2.5 text-xs font-bold text-gray-400 hover:text-white transition-all"
                                >
                                    <ArrowTrendingUpIcon className="w-4 h-4" />
                                    <span>My Dashboard</span>
                                </button>
                                <button
                                    onClick={() => navigate('/settings')}
                                    className="w-full py-2 px-3 hover:bg-white/5 rounded-lg flex items-center gap-2.5 text-xs font-bold text-gray-400 hover:text-white transition-all"
                                >
                                    <Cog6ToothIcon className="w-4 h-4" />
                                    <span>Settings</span>
                                </button>
                            </div>

                            {/* Recent Conversations */}
                            <div className="flex-1 overflow-y-auto p-4 space-y-3">
                                <h4 className="text-[10px] font-bold text-gray-500 uppercase tracking-widest pl-2">Recent Chats</h4>
                                <div className="space-y-1">
                                    {chatSessions.length === 0 ? (
                                        <div className="text-center py-8">
                                            <p className="text-xs text-gray-500">No chat history yet</p>
                                        </div>
                                    ) : (
                                        chatSessions.map((session) => {
                                            const displayTitle = getCustomTitle(session.chat_session) || session.title;
                                            const isRenaming = renamingSessionId === session.chat_session;
                                            
                                            return (
                                                <div
                                                    key={session.chat_session}
                                                    className={`w-full rounded-xl transition-all duration-200 group border cursor-pointer ${
                                                        selectedChatSession === session.chat_session 
                                                            ? 'bg-white/5 border-white/10 hover:bg-white/10' 
                                                            : 'bg-transparent border-transparent hover:bg-white/5'
                                                    }`}
                                                    onClick={(e) => {
                                                        if (isRenaming) {
                                                            e.stopPropagation();
                                                            return;
                                                        }
                                                        const target = e.target as HTMLElement;
                                                        if (target.closest('button') || target.tagName === 'BUTTON') {
                                                            return;
                                                        }
                                                        handleSidebarChat(session.chat_session);
                                                    }}
                                                >
                                                    {isRenaming ? (
                                                        <div className="p-3" onClick={(e) => e.stopPropagation()}>
                                                            <input
                                                                type="text"
                                                                value={renameValue}
                                                                onChange={(e) => setRenameValue(e.target.value)}
                                                                className="w-full px-2 py-1 text-xs bg-white/5 text-white rounded-lg border border-white/10 focus:outline-none focus:border-purple-500"
                                                                onKeyDown={(e) => {
                                                                    if (e.key === 'Enter') handleSaveRename(session.chat_session);
                                                                    else if (e.key === 'Escape') handleCancelRename();
                                                                }}
                                                                autoFocus
                                                            />
                                                            <div className="flex gap-1.5 mt-2 justify-end">
                                                                <button
                                                                    onClick={() => handleSaveRename(session.chat_session)}
                                                                    className="px-2 py-1 text-[10px] bg-purple-600 hover:bg-purple-500 text-white rounded font-medium"
                                                                >
                                                                    Save
                                                                </button>
                                                                <button
                                                                    onClick={handleCancelRename}
                                                                    className="px-2 py-1 text-[10px] bg-white/5 hover:bg-white/10 text-gray-300 rounded font-medium"
                                                                >
                                                                    Cancel
                                                                </button>
                                                            </div>
                                                        </div>
                                                    ) : (
                                                        <div className="p-3 flex items-start justify-between gap-2">
                                                            <div className="flex items-start gap-2.5 min-w-0 flex-1">
                                                                <ChatBubbleLeftIcon className="w-4 h-4 text-purple-400 mt-0.5 flex-shrink-0" />
                                                                <div className="min-w-0 flex-1">
                                                                    <div className="text-xs font-bold text-gray-200 truncate group-hover:text-white">
                                                                        {displayTitle}
                                                                    </div>
                                                                    <p className="text-[10px] text-gray-500 truncate mt-0.5">
                                                                        {session.last_message || "No messages"}
                                                                    </p>
                                                                </div>
                                                            </div>
                                                            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                                <button
                                                                    onClick={(e) => handleStartRename(e, session)}
                                                                    className="p-1 hover:bg-white/5 rounded text-gray-400 hover:text-white"
                                                                    title="Rename"
                                                                >
                                                                    <PencilIcon className="w-3 h-3" />
                                                                </button>
                                                                <button
                                                                    onClick={(e) => handleDeleteSession(e, session)}
                                                                    className="p-1 hover:bg-red-500/10 rounded text-gray-400 hover:text-red-400"
                                                                    title="Delete"
                                                                >
                                                                    <TrashIcon className="w-3 h-3" />
                                                                </button>
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>
                                            );
                                        })
                                    )}
                                </div>
                            </div>

                            {/* Bottom profile info */}
                            <div className="p-4 border-t border-white/5 bg-white/2 flex items-center justify-between">
                                <div className="flex items-center gap-2 min-w-0">
                                    <UserCircleIcon className="w-8 h-8 text-purple-400 flex-shrink-0" />
                                    <span className="text-xs font-bold text-gray-300 truncate">{currentUserEmail}</span>
                                </div>
                                <button 
                                    onClick={logout}
                                    className="p-2 hover:bg-red-500/10 text-gray-400 hover:text-red-400 rounded-lg transition-all"
                                    title="Log Out"
                                >
                                    <ArrowLeftOnRectangleIcon className="w-4 h-4" />
                                </button>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Center Column (Chat Pane) */}
                <div className="flex-1 flex flex-col h-full overflow-hidden relative">
                    {/* Header */}
                    <header className="h-16 border-b border-white/5 bg-[#0B0F19]/50 backdrop-blur-md flex items-center justify-between px-6 z-10">
                        <div className="flex items-center gap-4">
                            <button
                                onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                                className="p-2 hover:bg-white/5 border border-white/5 rounded-lg text-gray-300 hover:text-white transition-colors"
                            >
                                <Bars3Icon className="w-5 h-5" />
                            </button>

                            <button
                                onClick={() => setIsCharacterSelectOpen(true)}
                                className="flex items-center gap-2.5 py-1.5 px-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl transition-all text-xs font-semibold"
                            >
                                {selectedCharacter ? (
                                    <>
                                        {selectedCharacter.image_url ? (
                                            <img 
                                                src={selectedCharacter.image_url} 
                                                alt={selectedCharacter.name}
                                                className="w-6 h-6 rounded-lg object-cover"
                                            />
                                        ) : (
                                            <div className="w-6 h-6 rounded-lg bg-gradient-to-tr from-purple-500 to-indigo-500 flex items-center justify-center text-[10px] font-black text-white">
                                                {selectedCharacter.name.charAt(0)}
                                            </div>
                                        )}
                                        <div className="flex flex-col items-start leading-none">
                                            <span className="text-white text-[11px] font-bold">{selectedCharacter.name}</span>
                                            <span className="text-gray-400 text-[9px] mt-0.5">{selectedCharacter.movie}</span>
                                        </div>
                                    </>
                                ) : (
                                    <>
                                        <UserGroupIcon className="w-4 h-4 text-purple-400" />
                                        <span>Choose Character</span>
                                    </>
                                )}
                            </button>
                        </div>

                        {selectedCharacter && (
                            <button
                                onClick={() => setIsDetailsOpen(!isDetailsOpen)}
                                className={`p-2 rounded-lg border transition-colors ${
                                    isDetailsOpen 
                                        ? 'bg-purple-600/10 border-purple-500/20 text-purple-400' 
                                        : 'hover:bg-white/5 border-white/5 text-gray-300 hover:text-white'
                                }`}
                                title="Toggle details"
                            >
                                <InformationCircleIcon className="w-5 h-5" />
                            </button>
                        )}
                    </header>

                    {/* Messages List Area */}
                    <div ref={messageContainerRef} className="flex-1 overflow-y-auto p-6 space-y-4">
                        {isLoadingHistory ? (
                            <div className="flex justify-center items-center h-full">
                                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500"></div>
                            </div>
                        ) : messages.length === 0 ? (
                            selectedCharacter ? (
                                <div className="h-full flex flex-col items-center justify-center text-center space-y-6 p-8">
                                    <div className="w-20 h-20 rounded-2xl bg-gradient-to-tr from-purple-600 to-indigo-500 flex items-center justify-center text-4xl font-black text-white shadow-lg border border-white/10">
                                        {selectedCharacter.image_url ? (
                                            <img src={selectedCharacter.image_url} alt={selectedCharacter.name} className="w-full h-full object-cover rounded-2xl" />
                                        ) : selectedCharacter.name.charAt(0)}
                                    </div>
                                    <div className="space-y-1 max-w-sm">
                                        <h3 className="font-outfit font-bold text-xl text-white">Say hello to {selectedCharacter.name}!</h3>
                                        <p className="text-xs text-gray-400 italic">from {selectedCharacter.movie}</p>
                                        <p className="text-xs text-gray-500 mt-2">Start your conversation or pick a prompt below.</p>
                                    </div>

                                    {/* Conversation starter chips */}
                                    <div className="w-full max-w-lg space-y-2">
                                        <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Conversation Starters</p>
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                            {(() => {
                                                const genre = (selectedCharacter.genre || '').toLowerCase();
                                                const name = selectedCharacter.name;
                                                const movie = selectedCharacter.movie;
                                                
                                                // Build context-aware starters
                                                const starters: string[] = [];
                                                starters.push(`Tell me about yourself, ${name}.`);
                                                starters.push(`What's the most defining moment of your life?`);
                                                
                                                if (genre.includes('action') || genre.includes('warrior') || genre.includes('hero')) {
                                                    starters.push(`What's your greatest battle strategy?`);
                                                    starters.push(`How do you handle fear before a fight?`);
                                                } else if (genre.includes('mystery') || genre.includes('detective') || genre.includes('crime')) {
                                                    starters.push(`Walk me through how you solved your toughest case.`);
                                                    starters.push(`What clues do you look for that others miss?`);
                                                } else if (genre.includes('sci-fi') || genre.includes('science')) {
                                                    starters.push(`What's the most advanced technology you've encountered?`);
                                                    starters.push(`Describe the world you live in.`);
                                                } else if (genre.includes('comedy') || genre.includes('humor')) {
                                                    starters.push(`Tell me your funniest story.`);
                                                    starters.push(`What's the best joke you know?`);
                                                } else if (genre.includes('historical') || genre.includes('strategy')) {
                                                    starters.push(`What's your greatest strategic insight?`);
                                                    starters.push(`What lesson from history should we never forget?`);
                                                } else if (genre.includes('bollywood') || genre.includes('regional')) {
                                                    starters.push(`Kya hua tha ${movie} mein?`);
                                                    starters.push(`Your most iconic dialogue from ${movie}?`);
                                                } else if (genre.includes('anime')) {
                                                    starters.push(`What's your ultimate technique or power?`);
                                                    starters.push(`Who is your greatest rival?`);
                                                } else if (genre.includes('fantasy')) {
                                                    starters.push(`Describe the magic system in your world.`);
                                                    starters.push(`What quest are you currently on?`);
                                                } else {
                                                    starters.push(`What is your biggest fear?`);
                                                    starters.push(`If you could change one thing about ${movie}, what would it be?`);
                                                }
                                                
                                                return starters.slice(0, 4).map((starter, idx) => (
                                                    <button
                                                        key={idx}
                                                        onClick={() => setInput(starter)}
                                                        className="px-4 py-3 text-left text-xs text-gray-300 bg-white/5 hover:bg-purple-600/15 border border-white/5 hover:border-purple-500/30 rounded-xl transition-all leading-relaxed hover:text-white"
                                                    >
                                                        💬 {starter}
                                                    </button>
                                                ));
                                            })()}
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                <div className="h-full flex flex-col items-center justify-center text-center space-y-4 p-8">
                                    <div className="w-16 h-16 rounded-2xl bg-white/5 border border-white/5 flex items-center justify-center text-3xl">
                                        🤖
                                    </div>
                                    <div className="space-y-1 max-w-sm">
                                        <h3 className="font-outfit font-bold text-lg text-white">No active conversation</h3>
                                        <p className="text-xs text-gray-400">
                                            Select a character from the menu above to start an immersive roleplay chat.
                                        </p>
                                    </div>
                                    <button
                                        onClick={() => setIsCharacterSelectOpen(true)}
                                        className="px-4 py-2 text-xs font-semibold bg-purple-600 hover:bg-purple-500 rounded-lg transition-all"
                                    >
                                        Select Character
                                    </button>
                                </div>
                            )
                        ) : (
                            <div className="space-y-4 max-w-4xl mx-auto">
                                <MessageList 
                                    messages={messages}
                                    isLoading={isLoading}
                                    error={error}
                                />
                                <div ref={messagesEndRef} />
                            </div>
                        )}
                    </div>

                    {/* Input Bar Area */}
                    <div className="p-6 border-t border-white/5 bg-[#0B0F19]/50 backdrop-blur-md">
                        <form onSubmit={handleSendMessage} className="max-w-4xl mx-auto flex items-center gap-3">
                            <div className="flex gap-2">
                                <button
                                    type="button"
                                    onClick={() => {
                                        if (isListening) stopListening();
                                        else startListening();
                                    }}
                                    className={`p-3.5 rounded-xl border focus:outline-none transition-all ${
                                        isListening 
                                            ? 'bg-red-500/10 border-red-500/20 text-red-400' 
                                            : 'bg-white/5 border-white/5 hover:bg-white/10 text-gray-300'
                                    }`}
                                    title={isListening ? 'Stop listening' : 'Start speech typing'}
                                >
                                    <MicrophoneIcon className="w-5 h-5" />
                                </button>
                                <button
                                    type="button"
                                    onClick={() => {
                                        const nextVal = !isSpeechEnabled;
                                        setIsSpeechEnabled(nextVal);
                                        localStorage.setItem('tts_enabled', String(nextVal));
                                    }}
                                    className={`p-3.5 rounded-xl border focus:outline-none transition-all ${
                                        isSpeechEnabled 
                                            ? 'bg-purple-600/10 border-purple-500/20 text-purple-400' 
                                            : 'bg-white/5 border-white/5 hover:bg-white/10 text-gray-300'
                                    }`}
                                    title={isSpeechEnabled ? 'Disable TTS voice' : 'Enable TTS voice'}
                                >
                                    {isSpeechEnabled ? (
                                        <SpeakerWaveIcon className="w-5 h-5" />
                                    ) : (
                                        <SpeakerXMarkIcon className="w-5 h-5" />
                                    )}
                                </button>
                            </div>
                            <input
                                type="text"
                                value={input}
                                onChange={(e) => setInput(e.target.value)}
                                placeholder={isListening ? 'Listening...' : 'Message your character...'}
                                className="flex-1 p-4 rounded-xl bg-white/5 text-white placeholder-gray-500 border border-white/10 focus:outline-none focus:border-purple-500/60 focus:ring-1 focus:ring-purple-500/60 transition-all text-sm"
                                disabled={!selectedCharacter}
                            />
                            <button
                                type="submit"
                                disabled={isLoading || !input.trim() || !selectedCharacter}
                                className="p-4 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-purple-500/10"
                            >
                                <PaperAirplaneIcon className="w-5 h-5" />
                            </button>
                        </form>
                    </div>
                </div>

                {/* Right Column (Details) */}
                <AnimatePresence>
                    {isDetailsOpen && selectedCharacter && (
                        <motion.div
                            initial={{ x: 320, opacity: 0 }}
                            animate={{ x: 0, opacity: 1 }}
                            exit={{ x: 320, opacity: 0 }}
                            transition={{ type: "spring", stiffness: 300, damping: 30 }}
                            className="w-80 bg-[#0B0F19]/60 backdrop-blur-xl border-l border-white/5 flex flex-col h-full z-20 flex-shrink-0 overflow-y-auto"
                        >
                            {/* Heading */}
                            <div className="p-5 border-b border-white/5 flex items-center justify-between">
                                <h3 className="font-outfit font-bold text-sm uppercase tracking-wider text-purple-400">Persona Profile</h3>
                                <button 
                                    onClick={() => setIsDetailsOpen(false)}
                                    className="text-xs text-gray-500 hover:text-white"
                                >
                                    Hide &rarr;
                                </button>
                            </div>

                            {/* Details body */}
                            <div className="p-6 space-y-6">
                                {/* Character Display */}
                                <div className="text-center space-y-3">
                                    {selectedCharacter.image_url ? (
                                        <img 
                                            src={selectedCharacter.image_url} 
                                            alt={selectedCharacter.name}
                                            className="w-24 h-24 rounded-2xl object-cover mx-auto shadow-md border-2 border-white/10"
                                        />
                                    ) : (
                                        <div className="w-24 h-24 rounded-2xl bg-gradient-to-tr from-purple-600 to-indigo-500 flex items-center justify-center text-3xl font-black text-white mx-auto shadow-md border border-white/10">
                                            {selectedCharacter.name.charAt(0)}
                                        </div>
                                    )}
                                    <div>
                                        <h4 className="font-outfit font-bold text-lg text-white leading-tight">{selectedCharacter.name}</h4>
                                        <p className="text-xs text-gray-400 italic mt-1">from {selectedCharacter.movie}</p>
                                    </div>
                                </div>

                                {/* Traits / Categories */}
                                <div className="space-y-2">
                                    <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest block">Universe / Genre</span>
                                    <div className="flex flex-wrap gap-2">
                                        {selectedCharacter.genre && (
                                            <span className="px-2.5 py-1 rounded-full bg-purple-500/10 border border-purple-500/20 text-xs font-semibold text-purple-300 capitalize">
                                                {selectedCharacter.genre}
                                            </span>
                                        )}
                                        {selectedCharacter.source && (
                                            <span className="px-2.5 py-1 rounded-full bg-white/5 border border-white/10 text-xs font-semibold text-gray-300 capitalize">
                                                {selectedCharacter.source} Source
                                            </span>
                                        )}
                                    </div>
                                </div>

                                {/* Behavior & Chat Style */}
                                <div className="space-y-2">
                                    <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest block">Personality / Description</span>
                                    <p className="text-xs text-gray-300 leading-relaxed bg-white/2 p-3.5 rounded-xl border border-white/5">
                                        {selectedCharacter.chat_style || "No description provided."}
                                    </p>
                                </div>

                                {/* Example Responses */}
                                {selectedCharacter.example_responses && selectedCharacter.example_responses.length > 0 && (
                                    <div className="space-y-3">
                                        <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest block">Signature Dialogue</span>
                                        <div className="space-y-2">
                                            {selectedCharacter.example_responses.map((quote, idx) => (
                                                <div key={idx} className="p-3 bg-white/5 border border-white/5 rounded-xl text-xs text-gray-400 italic leading-relaxed">
                                                    "{quote}"
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            <CharacterSelect
                isOpen={isCharacterSelectOpen}
                onCharacterSelect={handleCharacterSelect}
                onClose={() => setIsCharacterSelectOpen(false)}
                isSidebarOpen={isSidebarOpen}
            />

            <ConfirmationDialog
                isOpen={deleteDialogOpen}
                onClose={() => {
                    setDeleteDialogOpen(false);
                    setSessionToDelete(null);
                    setSessionToDeleteTitle('');
                }}
                onConfirm={confirmDeleteSession}
                title="Delete Conversation"
                message={`Are you sure you want to delete "${sessionToDeleteTitle}"? This action cannot be undone and all messages in this conversation will be permanently deleted.`}
                confirmText="Delete"
                cancelText="Cancel"
                confirmButtonColor="red"
            />
        </LazyMotion>
    );
};

export default Chat;