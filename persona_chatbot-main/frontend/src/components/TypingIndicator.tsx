import React from 'react';
import { motion } from 'framer-motion';

const TypingIndicator: React.FC = () => {
    return (
        <div 
            className="flex space-x-2 p-3 bg-gray-700 rounded-lg w-16"
            data-testid="typing-indicator"
        >
            {[...Array(3)].map((_, i) => (
                <motion.div
                    key={i}
                    className="w-2 h-2 bg-gray-400 rounded-full"
                    animate={{
                        y: ["0%", "-50%", "0%"]
                    }}
                    transition={{
                        duration: 0.8,
                        repeat: Infinity,
                        delay: i * 0.2
                    }}
                />
            ))}
        </div>
    );
};

export default TypingIndicator;