import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { http, HttpResponse } from 'msw';
import { setupServer } from 'msw/node';
import type { DefaultBodyType, HttpHandler, PathParams } from 'msw';
import Chat from '../Chat';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000';

const mockCharacter = {
    id: 1,
    name: "Test Character",
    movie: "Test Movie",
    chat_style: "witty and sarcastic",
    example_responses: ["Response 1", "Response 2"],
    created_at: "2025-04-16T10:00:00Z"
};

const server = setupServer(
    http.get(`${API_URL}/characters`, () => {
        return HttpResponse.json([mockCharacter]);
    }),
    http.get(`${API_URL}/chat`, () => {
        return new HttpResponse(
            'data: {"text": "Test response", "done": true}\n\n',
            {
                headers: {
                    'Content-Type': 'text/event-stream',
                }
            }
        );
    }),
    http.get(`${API_URL}/messages/:userId`, () => {
        return HttpResponse.json([]);
    })
);

beforeAll(() => server.listen());
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

describe('Chat Component', () => {
    test('renders chat interface', () => {
        render(<Chat />);
        expect(screen.getByPlaceholderText('Type your message...')).toBeInTheDocument();
    });

    test('loads characters on mount', async () => {
        render(<Chat />);
        await waitFor(() => {
            expect(screen.getByText('AI Assistant')).toBeInTheDocument();
        });
    });

    test('sends message and displays response', async () => {
        render(<Chat />);
        
        const input = screen.getByPlaceholderText('Type your message...');
        fireEvent.change(input, { target: { value: 'Hello!' } });
        
        const form = input.closest('form');
        fireEvent.submit(form!);
        
        await waitFor(() => {
            expect(screen.getByText('Hello!')).toBeInTheDocument();
        });
        
        await waitFor(() => {
            expect(screen.getByText('Test response')).toBeInTheDocument();
        });
    });

    test('displays loading state while fetching response', async () => {
        render(<Chat />);
        
        const input = screen.getByPlaceholderText('Type your message...');
        fireEvent.change(input, { target: { value: 'Hello!' } });
        
        const form = input.closest('form');
        fireEvent.submit(form!);
        
        expect(screen.getByTestId('typing-indicator')).toBeInTheDocument();
        
        await waitFor(() => {
            expect(screen.queryByTestId('typing-indicator')).not.toBeInTheDocument();
        });
    });

    test('handles character selection', async () => {
        render(<Chat />);
        
        const characterButton = screen.getByText('AI Assistant');
        fireEvent.click(characterButton);
        
        await waitFor(() => {
            expect(screen.getByText('Test Character')).toBeInTheDocument();
        });
        
        fireEvent.click(screen.getByText('Test Character'));
        
        await waitFor(() => {
            expect(screen.getByText('Test Character')).toBeInTheDocument();
        });
    });

    test('handles errors gracefully', async () => {
        server.use(
            http.get(`${API_URL}/chat`, () => {
                return HttpResponse.error();
            })
        );
        
        render(<Chat />);
        
        const input = screen.getByPlaceholderText('Type your message...');
        fireEvent.change(input, { target: { value: 'Hello!' } });
        
        const form = input.closest('form');
        fireEvent.submit(form!);
        
        await waitFor(() => {
            expect(screen.getByText(/error/i)).toBeInTheDocument();
        });
    });

    test('toggles speech recognition', () => {
        render(<Chat />);
        
        const micButton = screen.getByRole('button', { name: /microphone/i });
        fireEvent.click(micButton);
        
        expect(micButton).toHaveClass('bg-blue-600');
        
        fireEvent.click(micButton);
        expect(micButton).not.toHaveClass('bg-blue-600');
    });

    test('toggles text-to-speech', () => {
        render(<Chat />);
        
        const speakerButton = screen.getByRole('button', { name: /speaker/i });
        fireEvent.click(speakerButton);
        
        expect(speakerButton).not.toHaveClass('bg-purple-600');
        
        fireEvent.click(speakerButton);
        expect(speakerButton).toHaveClass('bg-purple-600');
    });
});