import axios, { RawAxiosRequestHeaders } from 'axios';
import { getToken } from './auth';

export const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000';

// Create axios instance with default config
const api = axios.create({
    baseURL: API_URL,
    headers: {
        'Content-Type': 'application/json'
    }
});

// Add request interceptor to inject auth token
api.interceptors.request.use(
    (config) => {
        const token = getToken();
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => Promise.reject(error)
);

export interface ChatMessage {
    message: string;
    character_id?: number;
    user_id?: number;
    chat_id?: string;
    chat_session?: string;
    timestamp: string;
}

export interface ChatResponse {
    response: string;
}

export interface Character {
    id: number;
    name: string;
    movie: string;
    chat_style: string;
    example_responses: string[];
    created_at: string;
    updated_at?: string;
}

export interface StreamResponse {
    text?: string;
    done: boolean;
    error?: string;
    chat_session?: string;
}

export interface ChatSession {
    chat_session: string;
    title: string;
    last_message: string;
    timestamp: string;
    character_id?: number;
}

export interface ChatHistoryMessage {
    id: number;
    message: string;
    user_id: number;
    character_id?: number;
    is_bot: boolean;
    timestamp: string;
    last_message?: string; // Added this field
    chat_id?: string;
}

export interface GroupedChatMessage {
    id: string;
    messages: ChatHistoryMessage[];
    timestamp: string;
    character?: Character;
}

export const fetchChatMessages = async (chatId: string): Promise<ChatHistoryMessage[]> => {
    try {
        const response = await api.get(`/messages/chat/${chatId}`);
        if (!response.data || !Array.isArray(response.data)) {
            throw new Error('Invalid response format from server');
        }
        return response.data;
    } catch (error) {
        console.error('Error fetching chat messages:', error);
        if (axios.isAxiosError(error)) {
            if (error.response?.status === 401) {
                throw new Error('Authentication required');
            }
            throw new Error(error.response?.data?.detail || 'Failed to fetch chat messages');
        }
        throw error;
    }
};

// Helper function to group messages by chat session
export const groupMessagesByChat = (messages: ChatHistoryMessage[]): GroupedChatMessage[] => {
    const groupedMessages = messages.reduce((acc, message) => {
        const key = message.chat_id || message.id.toString();
        if (!acc[key]) {
            acc[key] = {
                id: key,
                messages: [],
                timestamp: message.timestamp,
            };
        }
        acc[key].messages.push(message);
        return acc;
    }, {} as Record<string, GroupedChatMessage>);

    return Object.values(groupedMessages).sort(
        (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );
};

export const fetchCharacters = async (): Promise<Character[]> => {
    try {
        const response = await api.get('/characters');
        return response.data;
    } catch (error) {
        console.error('Error fetching characters:', error);
        throw new Error('Failed to fetch characters');
    }
};

export const sendMessage = async (message: ChatMessage): Promise<ChatResponse> => {
    try {
        const response = await api.post('/chat', message);
        return response.data;
    } catch (error) {
        console.error('Error sending message:', error);
        throw error;
    }
};

export const streamMessage = async (
    message: ChatMessage,
    onMessage: (data: StreamResponse) => void
) => {
    let retryCount = 0;
    const MAX_RETRIES = 3;
    const RETRY_DELAY = 1000;
    let messageBuffer = '';
    let lastChunkTime = Date.now();
    const CHUNK_TIMEOUT = 10000;

    const connect = () => {
        const params = new URLSearchParams({
            message: message.message,
            ...(message.character_id && { character_id: message.character_id.toString() }),
            ...(message.chat_session && { chat_session: message.chat_session })
        });

        const token = getToken();
        if (!token) {
            onMessage({ text: '', done: true, error: 'Authentication required' });
            return;
        }

        params.append('token', token);
        
        const eventSource = new EventSource(
            `${API_URL}/chat?${params.toString()}`,
            { withCredentials: true }
        );

        eventSource.onmessage = (event) => {
            try {
                const data = JSON.parse(event.data) as StreamResponse;
                lastChunkTime = Date.now();
                
                if (data.error) {
                    console.error('Stream error:', data.error);
                    eventSource.close();
                    onMessage({ text: '', done: true, error: data.error });
                    return;
                }

                if (data.text?.trim()) {
                    messageBuffer += data.text;
                    onMessage({ text: data.text, done: false });
                }
                
                if (data.done) {
                    eventSource.close();
                    onMessage({ 
                        text: '', 
                        done: true,
                        chat_session: data.chat_session 
                    });
                }
            } catch (error) {
                console.error('Error parsing message:', error);
                eventSource.close();
                onMessage({ text: '', done: true, error: 'Failed to parse response' });
            }
        };

        eventSource.onerror = async (error) => {
            const currentTime = Date.now();
            console.error('EventSource error:', error);
            eventSource.close();
            
            if (currentTime - lastChunkTime > CHUNK_TIMEOUT) {
                onMessage({ text: '', done: true, error: 'Response timeout. Please try again.' });
                return;
            }
            
            if (retryCount < MAX_RETRIES) {
                retryCount++;
                console.log(`Retrying connection (${retryCount}/${MAX_RETRIES})...`);
                await new Promise(resolve => setTimeout(resolve, RETRY_DELAY));
                connect();
            } else {
                onMessage({ text: '', done: true, error: 'Connection failed after multiple attempts.' });
            }
        };

        return () => {
            eventSource.close();
        };
    };

    return connect();
};

export const createCharacter = async (character: Omit<Character, 'id' | 'created_at' | 'updated_at'>): Promise<Character> => {
    try {
        const response = await api.post('/characters', character);
        return response.data;
    } catch (error) {
        console.error('Error creating character:', error);
        throw error;
    }
};

export const updateCharacter = async (id: number, character: Partial<Character>): Promise<Character> => {
    try {
        const response = await api.put(`/characters/${id}`, character);
        return response.data;
    } catch (error) {
        console.error('Error updating character:', error);
        throw error;
    }
};

export const deleteCharacter = async (id: number): Promise<void> => {
    try {
        await api.delete(`/characters/${id}`);
    } catch (error) {
        console.error('Error deleting character:', error);
        throw error;
    }
};

export const getCharacters = async (): Promise<Character[]> => {
    const response = await api.get('/characters');
    return response.data;
};

export const selectCharacter = async (characterId: number): Promise<void> => {
    await api.post(`/characters/${characterId}/select`);
};

export const fetchChatHistory = async (
    characterId?: number,
    limit: number = 50,
    offset: number = 0
): Promise<ChatHistoryMessage[]> => {
    try {
        let url = `/messages?limit=${limit}&offset=${offset}`;
        if (characterId) {
            url += `&character_id=${characterId}`;
        }
        const response = await api.get(url);
        return response.data;
    } catch (error) {
        console.error('Error fetching chat history:', error);
        throw error;
    }
};

export const fetchChatSessions = async (): Promise<ChatSession[]> => {
    try {
        const response = await api.get('/chat/sessions');
        return response.data;
    } catch (error) {
        console.error('Error fetching chat sessions:', error);
        throw error;
    }
};