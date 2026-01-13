import React from 'react';
import { render, screen } from '@testing-library/react';
import VoiceIndicator from '../VoiceIndicator';

describe('VoiceIndicator', () => {
    test('renders listening indicator when type is listening', () => {
        render(<VoiceIndicator type="listening" isActive={true} />);
        expect(screen.getByTestId('voice-indicator')).toHaveClass('bg-blue-500');
    });

    test('renders speaking indicator when type is speaking', () => {
        render(<VoiceIndicator type="speaking" isActive={true} />);
        expect(screen.getByTestId('voice-indicator')).toHaveClass('bg-purple-500');
    });

    test('shows inactive state when isActive is false', () => {
        render(<VoiceIndicator type="listening" isActive={false} />);
        expect(screen.getByTestId('voice-indicator')).toHaveClass('opacity-0');
    });

    test('shows active state when isActive is true', () => {
        render(<VoiceIndicator type="speaking" isActive={true} />);
        expect(screen.getByTestId('voice-indicator')).toHaveClass('opacity-100');
    });
});