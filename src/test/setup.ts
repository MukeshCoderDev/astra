import '@testing-library/jest-dom';
import { beforeAll, afterEach, afterAll } from 'vitest';
import { cleanup } from '@testing-library/react';
import { server } from './mocks/server';

// Start server before all tests
beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));

// Clean up after each test case (e.g. clearing jsdom)
afterEach(() => {
  cleanup();
  server.resetHandlers();
});

// Close server after all tests
afterAll(() => server.close());

// Mock IntersectionObserver
global.IntersectionObserver = class IntersectionObserver {
  constructor() {}
  disconnect() {}
  observe() {}
  unobserve() {}
};

// Mock ResizeObserver
global.ResizeObserver = class ResizeObserver {
  constructor() {}
  disconnect() {}
  observe() {}
  unobserve() {}
};

// Mock matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(), // deprecated
    removeListener: vi.fn(), // deprecated
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});

// Mock scrollTo
Object.defineProperty(window, 'scrollTo', {
  writable: true,
  value: vi.fn(),
});

// Mock localStorage
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
};
Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
});

// Mock sessionStorage
const sessionStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
};
Object.defineProperty(window, 'sessionStorage', {
  value: sessionStorageMock,
});

// Mock URL.createObjectURL
Object.defineProperty(URL, 'createObjectURL', {
  writable: true,
  value: vi.fn(() => 'mocked-object-url'),
});

// Mock URL.revokeObjectURL
Object.defineProperty(URL, 'revokeObjectURL', {
  writable: true,
  value: vi.fn(),
});

// Mock HTMLMediaElement
Object.defineProperty(HTMLMediaElement.prototype, 'play', {
  writable: true,
  value: vi.fn().mockImplementation(() => Promise.resolve()),
});

Object.defineProperty(HTMLMediaElement.prototype, 'pause', {
  writable: true,
  value: vi.fn(),
});

Object.defineProperty(HTMLMediaElement.prototype, 'load', {
  writable: true,
  value: vi.fn(),
});