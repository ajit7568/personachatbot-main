import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import TypingIndicator from './TypingIndicator';
import ReactMarkdown from 'react-markdown';
import { UserCircleIcon, SparklesIcon } from '@heroicons/react/24/solid';

interface Character {
    id: number;
    name: string;
    movie: string;
}

interface MessageBubbleProps {
    message: string;
    isUser: boolean;
    isTyping?: boolean;
    character?: Character;
    error?: string;
    showAvatar?: boolean;
    showName?: boolean;
    timestamp?: Date;
}

const MessageBubble: React.FC<MessageBubbleProps> = ({ 
    message, 
    isUser, 
    isTyping,
    character,
    error,
    showAvatar = true,
    showName = true,
    timestamp
}) => {
    return (
        <AnimatePresence>
            <motion.div
                data-testid="message-bubble"
                initial={{ opacity: 1, y: 0 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}
            >
                <div className={`max-w-[80%] flex ${isUser ? 'flex-row-reverse' : 'flex-row'} items-start gap-2`}>
                    {/* Avatar/Icon */}
                    {showAvatar && (
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 
                            ${isUser ? 'bg-blue-600' : character ? 'bg-purple-600' : 'bg-gray-600'}`}
                        >
                            {isUser ? (
                                <UserCircleIcon className="w-6 h-6 text-white" />
                            ) : (
                                <SparklesIcon className="w-5 h-5 text-white" />
                            )}
                        </div>
                    )}

                    {/* Message Content */}
                    <div className="flex flex-col">
                        {/* Label */}
                        {showName && (
                            <span className={`text-sm mb-1 ${isUser ? 'text-blue-400' : 'text-purple-400'}`}>
                                {isUser ? 'You' : character?.name || 'Bot'}
                            </span>
                        )}
                        
                        <motion.div
                            layout
                            className={`rounded-xl shadow-md px-6 py-4 ${
                                error ? 'bg-red-50 border border-red-200' :
                                isUser
                                    ? 'bg-blue-600/10 border border-blue-500/20 text-white'
                                    : character 
                                        ? 'bg-purple-600/10 border border-purple-500/20 text-white'
                                        : 'bg-gray-700 text-white border border-gray-600'
                            }`}
                        >
                            {error ? (
                                <p className="text-sm md:text-base text-red-600 font-medium">
                                    Error: {error}
                                </p>
                            ) : isTyping && !message.trim() ? (
                                <TypingIndicator />
                            ) : (
                                <div className="prose prose-invert max-w-none">
                                    <ReactMarkdown>
                                        {message}
                                    </ReactMarkdown>
                                </div>
                            )}
                        </motion.div>

                        {/* Timestamp */}
                        {timestamp && (
                            <span className="text-xs text-gray-500 mt-1">
                                {timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                        )}
                    </div>
                </div>
            </motion.div>
        </AnimatePresence>
    );
};

export default MessageBubble;