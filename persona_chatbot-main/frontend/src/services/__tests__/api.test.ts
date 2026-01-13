import '@testing-library/jest-dom';
import { render, screen, waitFor } from '@testing-library/react';
import { http, HttpResponse } from 'msw';
import { setupServer } from 'msw/node';
import { act } from 'react-dom/test-utils';
import { 
    fetchCharacters, 
    sendMessage, 
    streamMessage, 
    createCharacter,
    fetchChatHistory,
    type Character,
    type ChatMessage,
    type ChatHistoryMessage,
    type StreamResponse
} from '../api';

// Mock API endpoint
const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000';

// Sample test data
const mockCharacter: Character = {
    id: 1,
    name: "Test Character",
    movie: "Test Movie",
    chat_style: "witty and sarcastic",
    example_responses: ["Response 1", "Response 2"],
    created_at: "2025-04-16T10:00:00Z"
};

const mockChatHistoryMessage: ChatHistoryMessage = {
    id: 1,
    message: "Hello!",
    user_id: 1,
    character_id: 1,
    is_bot: false,
    timestamp: "2025-04-16T10:00:00Z"
};

// Setup MSW server for API mocking
const server = setupServer(
    http.get(`${API_URL}/characters`, () => {
        return HttpResponse.json([mockCharacter]);
    }),

    http.post(`${API_URL}/chat`, () => {
        return HttpResponse.json({ response: "Test response" });
    }),

    http.get(`${API_URL}/chat`, () => {
        return new HttpResponse(
            'data: {"text": "Test stream", "done": false}\n\n',
            {
                headers: {
                    'Content-Type': 'text/event-stream',
                }
            }
        );
    }),

    http.post(`${API_URL}/characters`, () => {
        return HttpResponse.json(mockCharacter);
    }),

    http.get(`${API_URL}/messages/:userId`, () => {
        return HttpResponse.json([mockChatHistoryMessage]);
    })
);

// Start MSW server before tests
beforeAll(() => server.listen());
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

// Tests
describe('API Integration Tests', () => {
    test('fetchCharacters should return characters', async () => {
        const characters = await fetchCharacters();
        expect(characters).toHaveLength(1);
        expect(characters[0]).toEqual(mockCharacter);
    });

    test('sendMessage should send chat message', async () => {
        const message: ChatMessage = {
            message: "Hello!",
            user_id: 1,
            character_id: 1,
            timestamp: new Date().toISOString()
        };
        const response = await sendMessage(message);
        expect(response).toEqual({ response: "Test response" });
    });

    test('streamMessage should handle streaming response', async () => {
        const message: ChatMessage = {
            message: "Hello!",
            user_id: 1,
            character_id: 1,
            timestamp: new Date().toISOString()
        };
        
        const onMessage = jest.fn();
        await streamMessage(message, onMessage);
        
        expect(onMessage).toHaveBeenCalledWith({
            text: "Test stream",
            done: false
        });
    });

    test('createCharacter should create new character', async () => {
        const newCharacter = {
            name: "Test Character",
            movie: "Test Movie",
            chat_style: "witty and sarcastic",
            example_responses: ["Response 1", "Response 2"]
        };
        
        const response = await createCharacter(newCharacter);
        expect(response).toEqual(mockCharacter);
    });

    test('fetchChatHistory should return chat messages', async () => {
        const userId = 1;
        const messages = await fetchChatHistory(userId);
        expect(messages).toHaveLength(1);
        expect(messages[0]).toEqual(mockChatHistoryMessage);
    });

    test('fetchCharacters should handle errors', async () => {
        server.use(
            http.get(`${API_URL}/characters`, () => {
                return HttpResponse.error();
            })
        );

        await expect(fetchCharacters()).rejects.toThrow();
    });

    test('sendMessage should handle network errors', async () => {
        server.use(
            http.post(`${API_URL}/chat`, () => {
                return HttpResponse.error();
            })
        );

        const message: ChatMessage = {
            message: "Hello!",
            user_id: 1,
            character_id: 1,
            timestamp: new Date().toISOString()
        };

        await expect(sendMessage(message)).rejects.toThrow();
    });

    test('streamMessage should handle connection errors', async () => {
        server.use(
            http.get(`${API_URL}/chat`, () => {
                return HttpResponse.error();
            })
        );

        const message: ChatMessage = {
            message: "Hello!",
            user_id: 1,
            character_id: 1,
            timestamp: new Date().toISOString()
        };

        const onMessage = jest.fn();
        await streamMessage(message, onMessage);
        
        expect(onMessage).toHaveBeenCalledWith({
            text: '',
            done: true,
            error: expect.any(String)
        });
    });
});