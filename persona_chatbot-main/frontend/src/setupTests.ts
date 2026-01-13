import '@testing-library/jest-dom';

// Mock IntersectionObserver
const mockIntersectionObserver = jest.fn();
mockIntersectionObserver.mockImplementation(() => ({
  observe: () => null,
  unobserve: () => null,
  disconnect: () => null
}));
window.IntersectionObserver = mockIntersectionObserver;

// Mock SpeechSynthesis and SpeechRecognition
Object.defineProperty(window, 'speechSynthesis', {
  value: {
    speak: jest.fn(),
    cancel: jest.fn(),
    getVoices: jest.fn().mockReturnValue([]),
    pause: jest.fn(),
    resume: jest.fn()
  }
});

// Mock SpeechRecognition
class MockSpeechRecognition {
  start = jest.fn();
  stop = jest.fn();
  abort = jest.fn();
  addEventListener = jest.fn();
}

Object.defineProperty(window, 'webkitSpeechRecognition', {
  value: MockSpeechRecognition
});

// Mock EventSource for SSE
class MockEventSource {
  constructor(url: string) {
    return {
      url,
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
      close: jest.fn()
    };
  }
}

Object.defineProperty(window, 'EventSource', {
  value: MockEventSource
});

// Mock ResizeObserver
const mockResizeObserver = jest.fn();
mockResizeObserver.mockImplementation(() => ({
  observe: () => null,
  unobserve: () => null,
  disconnect: () => null
}));
window.ResizeObserver = mockResizeObserver;