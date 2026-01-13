import { useState, useEffect, useCallback } from 'react';

interface UseSpeechProps {
    onSpeechResult?: (text: string) => void;
    onSpeechStart?: () => void;
    onSpeechEnd?: () => void;
}

export const useSpeech = ({ onSpeechResult, onSpeechStart, onSpeechEnd }: UseSpeechProps = {}) => {
    const [isListening, setIsListening] = useState(false);
    const [isSpeaking, setIsSpeaking] = useState(false);
    const [speechError, setSpeechError] = useState<string | null>(null);

    // Initialize speech recognition
    const recognition = useCallback(() => {
        if ('webkitSpeechRecognition' in window) {
            const recognition = new (window as any).webkitSpeechRecognition();
            recognition.continuous = false;
            recognition.interimResults = false;
            recognition.lang = 'en-US';
            return recognition;
        }
        return null;
    }, []);

    // Initialize speech synthesis
    const synth = typeof window !== 'undefined' ? window.speechSynthesis : null;

    const startListening = useCallback(() => {
        const recognitionInstance = recognition();
        if (!recognitionInstance) {
            setSpeechError('Speech recognition is not supported in your browser');
            return;
        }

        try {
            setIsListening(true);
            setSpeechError(null);
            onSpeechStart?.();

            recognitionInstance.onresult = (event: any) => {
                const transcript = event.results[0][0].transcript;
                onSpeechResult?.(transcript);
            };

            recognitionInstance.onerror = (event: any) => {
                setSpeechError(event.error);
                setIsListening(false);
            };

            recognitionInstance.onend = () => {
                setIsListening(false);
                onSpeechEnd?.();
            };

            recognitionInstance.start();
        } catch (error) {
            setSpeechError('Error starting speech recognition');
            setIsListening(false);
        }
    }, [recognition, onSpeechResult, onSpeechStart, onSpeechEnd]);

    const stopListening = useCallback(() => {
        const recognitionInstance = recognition();
        if (recognitionInstance) {
            recognitionInstance.stop();
            setIsListening(false);
        }
    }, [recognition]);

    const speak = useCallback((text: string) => {
        if (!synth) {
            setSpeechError('Speech synthesis is not supported in your browser');
            return;
        }

        // Cancel any ongoing speech
        synth.cancel();

        const utterance = new SpeechSynthesisUtterance(text);
        utterance.rate = 1.0;
        utterance.pitch = 1.0;
        utterance.volume = 1.0;
        
        utterance.onstart = () => setIsSpeaking(true);
        utterance.onend = () => setIsSpeaking(false);
        utterance.onerror = () => {
            setIsSpeaking(false);
            setSpeechError('Error during speech synthesis');
        };

        synth.speak(utterance);
    }, [synth]);

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            if (synth) {
                synth.cancel();
            }
            const recognitionInstance = recognition();
            if (recognitionInstance) {
                recognitionInstance.abort();
            }
        };
    }, [recognition, synth]);

    return {
        startListening,
        stopListening,
        speak,
        isListening,
        isSpeaking,
        error: speechError,
    };
};