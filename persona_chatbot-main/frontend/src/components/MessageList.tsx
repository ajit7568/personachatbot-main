import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import MessageBubble from './MessageBubble';
import TypingIndicator from './TypingIndicator';
import { Character } from '../services/api';

interface Message {
    text: string;
    isUser: boolean;
    id: string;
    isStreaming?: boolean;
    character?: Character;
    timestamp?: Date;
}

interface MessageListProps {
    messages: Message[];
    isLoading: boolean;
    error: string | null;
}

const MessageList: React.FC<MessageListProps> = ({ messages, isLoading, error }) => {
    return (
        <AnimatePresence initial={false}>
            {messages.map((msg, index) => {
                // Skip empty messages or those marked for deletion
                if (!msg.text.trim() && !msg.isStreaming) return null;

                // Check if this is part of a consecutive group of messages from the same sender
                const isPartOfGroup = messages[index - 1]?.isUser === msg.isUser;
                const showTimestamp = !isPartOfGroup || index === messages.length - 1;

                return (
                    <motion.div
                        key={msg.id}
                        layout
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        className={`transition-all duration-200 ${isPartOfGroup ? 'mt-1' : 'mt-4'}`}
                    >
                        <MessageBubble
                            message={msg.text}
                            isUser={msg.isUser}
                            isTyping={msg.isStreaming}
                            character={msg.character}
                            showAvatar={!isPartOfGroup}
                            showName={!isPartOfGroup}
                            timestamp={showTimestamp ? msg.timestamp : undefined}
                        />
                    </motion.div>
                );
            })}

            {error && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="text-red-500 text-sm p-2 rounded-lg bg-red-500/10"
                >
                    {error}
                </motion.div>
            )}

            {isLoading && !messages.some(msg => msg.isStreaming) && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                >
                    <TypingIndicator />
                </motion.div>
            )}
        </AnimatePresence>
    );
};

export default MessageList;