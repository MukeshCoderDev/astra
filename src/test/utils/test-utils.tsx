import React, { ReactElement } from 'react';
import { render, RenderOptions } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ThemeProvider } from '../../providers/ThemeProvider';
import { ToastProvider } from '../../providers/ToastProvider';
import { AuthProvider } from '../../providers/AuthProvider';
import { WalletProvider } from '../../providers/WalletProvider';

// Create a custom render function that includes providers
const AllTheProviders = ({ children }: { children: React.ReactNode }) => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        gcTime: 0,
      },
    },
  });

  return (
    <BrowserRouter>
      <QueryClientProvider client={queryClient}>
        <ThemeProvider>
          <AuthProvider>
            <WalletProvider>
              <ToastProvider>
                {children}
              </ToastProvider>
            </WalletProvider>
          </AuthProvider>
        </ThemeProvider>
      </QueryClientProvider>
    </BrowserRouter>
  );
};

const customRender = (
  ui: ReactElement,
  options?: Omit<RenderOptions, 'wrapper'>
) => render(ui, { wrapper: AllTheProviders, ...options });

export * from '@testing-library/react';
export { customRender as render };

// Mock file for testing file uploads
export const createMockFile = (
  name: string = 'test-video.mp4',
  size: number = 1024 * 1024 * 100, // 100MB
  type: string = 'video/mp4'
): File => {
  const file = new File([''], name, { type });
  Object.defineProperty(file, 'size', {
    value: size,
    writable: false,
  });
  return file;
};

// Mock video element for testing video players
export const createMockVideoElement = () => {
  const video = document.createElement('video');
  Object.defineProperty(video, 'play', {
    writable: true,
    value: vi.fn().mockResolvedValue(undefined),
  });
  Object.defineProperty(video, 'pause', {
    writable: true,
    value: vi.fn(),
  });
  Object.defineProperty(video, 'load', {
    writable: true,
    value: vi.fn(),
  });
  Object.defineProperty(video, 'currentTime', {
    writable: true,
    value: 0,
  });
  Object.defineProperty(video, 'duration', {
    writable: true,
    value: 100,
  });
  Object.defineProperty(video, 'paused', {
    writable: true,
    value: true,
  });
  return video;
};

// Wait for async operations to complete
export const waitForLoadingToFinish = () => 
  new Promise(resolve => setTimeout(resolve, 0));

// Mock intersection observer for testing lazy loading
export const mockIntersectionObserver = (isIntersecting: boolean = true) => {
  const mockObserver = {
    observe: vi.fn(),
    disconnect: vi.fn(),
    unobserve: vi.fn(),
  };

  global.IntersectionObserver = vi.fn().mockImplementation((callback) => {
    // Immediately trigger the callback with mock entries
    setTimeout(() => {
      callback([
        {
          isIntersecting,
          target: document.createElement('div'),
          intersectionRatio: isIntersecting ? 1 : 0,
        },
      ]);
    }, 0);
    return mockObserver;
  });

  return mockObserver;
};

// Mock WebSocket for testing real-time features
export const createMockWebSocket = () => {
  const mockSocket = {
    send: vi.fn(),
    close: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    readyState: WebSocket.OPEN,
  };

  global.WebSocket = vi.fn().mockImplementation(() => mockSocket);
  return mockSocket;
};

// Mock HLS.js for testing video players
export const createMockHls = () => {
  const mockHls = {
    loadSource: vi.fn(),
    attachMedia: vi.fn(),
    destroy: vi.fn(),
    on: vi.fn(),
    off: vi.fn(),
    isSupported: vi.fn().mockReturnValue(true),
  };

  return mockHls;
};