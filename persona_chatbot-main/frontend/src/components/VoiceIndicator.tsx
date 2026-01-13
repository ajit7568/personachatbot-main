import React from 'react';
import { motion } from 'framer-motion';

interface VoiceIndicatorProps {
    isActive: boolean;
    type: 'listening' | 'speaking';
}

const VoiceIndicator: React.FC<VoiceIndicatorProps> = ({ isActive, type }) => {
    const baseClass = type === 'listening' ? 'bg-blue-500' : 'bg-purple-500';
    
    return (
        <motion.div
            data-testid="voice-indicator"
            className={`w-4 h-4 rounded-full mx-2 ${baseClass}`}
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{
                scale: isActive ? [0.8, 1.2, 0.8] : 0.8,
                opacity: isActive ? 1 : 0
            }}
            transition={{
                duration: 1.5,
                repeat: Infinity,
                ease: "easeInOut"
            }}
        />
    );
};

export default VoiceIndicator;