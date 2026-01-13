import React from 'react';
import { render, screen } from '@testing-library/react';
import MessageBubble from '../MessageBubble';

const mockCharacter = {
    id: 1,
    name: "Test Character",
    movie: "Test Movie",
    chat_style: "witty and sarcastic",
    example_responses: ["Response 1"],
    created_at: "2025-04-16T10:00:00Z"
};

describe('MessageBubble', () => {
    test('renders user message correctly', () => {
        render(
            <MessageBubble 
                message="Hello!" 
                isUser={true}
                isTyping={false}
            />
        );
        expect(screen.getByText('Hello!')).toBeInTheDocument();
        expect(screen.getByTestId('message-bubble')).toHaveClass('bg-blue-600');
    });

    test('renders bot message correctly', () => {
        render(
            <MessageBubble 
                message="Hi there!" 
                isUser={false}
                character={mockCharacter}
                isTyping={false}
            />
        );
        expect(screen.getByText('Hi there!')).toBeInTheDocument();
        expect(screen.getByTestId('message-bubble')).toHaveClass('bg-gray-700');
    });

    test('shows typing indicator when isTyping is true', () => {
        render(
            <MessageBubble 
                message="" 
                isUser={false}
                isTyping={true}
                character={mockCharacter}
            />
        );
        expect(screen.getByTestId('typing-indicator')).toBeInTheDocument();
    });

    test('displays character name when provided', () => {
        render(
            <MessageBubble 
                message="Hello!" 
                isUser={false}
                character={mockCharacter}
                isTyping={false}
            />
        );
        expect(screen.getByText(mockCharacter.name)).toBeInTheDocument();
    });

    test('handles long messages correctly', () => {
        const longMessage = 'A'.repeat(1000);
        render(
            <MessageBubble 
                message={longMessage} 
                isUser={true}
                isTyping={false}
            />
        );
        expect(screen.getByText(longMessage)).toBeInTheDocument();
    });

    test('handles markdown content in messages', () => {
        render(
            <MessageBubble 
                message="**Bold** and *italic*" 
                isUser={false}
                isTyping={false}
            />
        );
        const messageElement = screen.getByTestId('message-bubble');
        expect(messageElement).toContainHTML('<strong>');
        expect(messageElement).toContainHTML('<em>');
    });
});