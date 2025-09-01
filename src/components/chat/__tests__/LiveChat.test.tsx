import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import { LiveChat } from '../LiveChat';
import { useLiveChat } from '../../../hooks/useLiveChat';
import { useSessionStore } from '../../../store/sessionStore';
import type { Message } from '../../../types/live';

// Mock the hooks
vi.mock('../../../hooks/useLiveChat');
vi.mock('../../../store/sessionStore');

const mockUseLiveChat = vi.mocked(useLiveChat);
const mockUseSessionStore = vi.mocked(useSessionStore);

describe('LiveChat', () => {
  const streamId = 'test-stream-123';
  const mockUser = {
    id: 'user-1',
    handle: 'testuser',
    avatar: 'https://example.com/avatar.jpg',
  };

  const mockMessage: Message = {
    id: 'msg-1',
    user: { id: 'user-1', handle: 'testuser' },
    text: 'Hello world!',
    ts: Math.floor(Date.now() / 1000),
  };

  const mockPinnedMessage: Message = {
    id: 'msg-2',
    user: { id: 'user-2', handle: 'creator', role: 'creator' },
    text: 'Welcome to the stream!',
    ts: Math.floor(Date.now() / 1000),
    pinned: true,
  };

  const defaultChatState = {
    messages: [],
    viewers: 0,
    slowModeSec: 0,
    connected: true,
    loading: false,
    failed: false,
    send: vi.fn(),
    clearMessages: vi.fn(),
    reconnect: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
    
    // Mock scrollIntoView for JSDOM
    Element.prototype.scrollIntoView = vi.fn();
    
    mockUseSessionStore.mockReturnValue({
      user: mockUser,
      isAuthenticated: true,
      login: vi.fn(),
      logout: vi.fn(),
      updateUser: vi.fn(),
    });

    mockUseLiveChat.mockReturnValue(defaultChatState);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should render chat interface', () => {
    render(<LiveChat streamId={streamId} />);

    expect(screen.getByText('Live Chat')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Type a message...')).toBeInTheDocument();
    expect(screen.getByRole('button')).toBeInTheDocument();
  });

  it('should display viewer count', () => {
    mockUseLiveChat.mockReturnValue({
      ...defaultChatState,
      viewers: 150,
    });

    render(<LiveChat streamId={streamId} />);

    expect(screen.getByText('150')).toBeInTheDocument();
  });

  it('should display connection status', () => {
    mockUseLiveChat.mockReturnValue({
      ...defaultChatState,
      connected: false,
      failed: true,
    });

    render(<LiveChat streamId={streamId} />);

    expect(screen.getByText('Connection failed - using fallback')).toBeInTheDocument();
  });

  it('should display messages', () => {
    mockUseLiveChat.mockReturnValue({
      ...defaultChatState,
      messages: [mockMessage],
    });

    render(<LiveChat streamId={streamId} />);

    expect(screen.getByText('Hello world!')).toBeInTheDocument();
    expect(screen.getByText('testuser')).toBeInTheDocument();
  });

  it('should highlight pinned messages', () => {
    mockUseLiveChat.mockReturnValue({
      ...defaultChatState,
      messages: [mockPinnedMessage],
    });

    render(<LiveChat streamId={streamId} />);

    expect(screen.getByText('Welcome to the stream!')).toBeInTheDocument();
    expect(screen.getByText('PINNED')).toBeInTheDocument();
    expect(screen.getByText('creator')).toHaveClass('text-purple-400');
  });

  it('should send message when form is submitted', async () => {
    const mockSend = vi.fn().mockResolvedValue(undefined);
    mockUseLiveChat.mockReturnValue({
      ...defaultChatState,
      send: mockSend,
    });

    render(<LiveChat streamId={streamId} />);

    const input = screen.getByPlaceholderText('Type a message...');
    const button = screen.getByRole('button');

    fireEvent.change(input, { target: { value: 'Test message' } });
    
    await act(async () => {
      fireEvent.click(button);
    });

    expect(mockSend).toHaveBeenCalledWith('Test message');
  });

  it('should send message on Enter key press', async () => {
    const mockSend = vi.fn().mockResolvedValue(undefined);
    mockUseLiveChat.mockReturnValue({
      ...defaultChatState,
      send: mockSend,
    });

    render(<LiveChat streamId={streamId} />);

    const input = screen.getByPlaceholderText('Type a message...');

    fireEvent.change(input, { target: { value: 'Test message' } });
    
    await act(async () => {
      fireEvent.keyDown(input, { key: 'Enter', code: 'Enter' });
    });

    expect(mockSend).toHaveBeenCalledWith('Test message');
  });

  it('should not send message on Shift+Enter', () => {
    const mockSend = vi.fn().mockResolvedValue(undefined);
    mockUseLiveChat.mockReturnValue({
      ...defaultChatState,
      send: mockSend,
    });

    render(<LiveChat streamId={streamId} />);

    const input = screen.getByPlaceholderText('Type a message...');

    fireEvent.change(input, { target: { value: 'Test message' } });
    fireEvent.keyDown(input, { key: 'Enter', code: 'Enter', shiftKey: true });

    expect(mockSend).not.toHaveBeenCalled();
  });

  it('should display slow mode indicator', () => {
    mockUseLiveChat.mockReturnValue({
      ...defaultChatState,
      slowModeSec: 30,
    });

    render(<LiveChat streamId={streamId} />);

    expect(screen.getByText(/Slow mode: 30s between messages/)).toBeInTheDocument();
  });

  it('should handle slow mode cooldown', async () => {
    const mockSend = vi.fn().mockResolvedValue(undefined);
    mockUseLiveChat.mockReturnValue({
      ...defaultChatState,
      slowModeSec: 5,
      send: mockSend,
    });

    render(<LiveChat streamId={streamId} />);

    const input = screen.getByPlaceholderText('Type a message...');
    const button = screen.getByRole('button');

    // Send first message
    fireEvent.change(input, { target: { value: 'First message' } });
    
    await act(async () => {
      fireEvent.click(button);
    });

    expect(mockSend).toHaveBeenCalledWith('First message');

    // Should show cooldown
    expect(screen.getByPlaceholderText(/Wait \d+s.../)).toBeInTheDocument();

    // Button should be disabled during cooldown
    expect(button).toBeDisabled();

    // Fast-forward time
    act(() => {
      vi.advanceTimersByTime(5000);
    });

    expect(screen.getByPlaceholderText('Type a message...')).toBeInTheDocument();
    
    // Add some text to enable the button
    fireEvent.change(input, { target: { value: 'Second message' } });
    expect(button).not.toBeDisabled();
  });

  it('should display character count', async () => {
    render(<LiveChat streamId={streamId} />);

    const input = screen.getByPlaceholderText('Type a message...');

    fireEvent.change(input, { target: { value: 'Hello' } });

    expect(screen.getByText('5/500')).toBeInTheDocument();
  });

  it('should disable input when not connected', () => {
    mockUseLiveChat.mockReturnValue({
      ...defaultChatState,
      connected: false,
    });

    render(<LiveChat streamId={streamId} />);

    const input = screen.getByPlaceholderText('Disconnected');
    const button = screen.getByRole('button');

    expect(input).toBeDisabled();
    expect(button).toBeDisabled();
  });

  it('should disable input when loading', () => {
    mockUseLiveChat.mockReturnValue({
      ...defaultChatState,
      loading: true,
      connected: false,
    });

    render(<LiveChat streamId={streamId} />);

    const input = screen.getByPlaceholderText('Connecting...');
    const button = screen.getByRole('button');

    expect(input).toBeDisabled();
    expect(button).toBeDisabled();
  });

  it('should show sign in message when user is not authenticated', () => {
    mockUseSessionStore.mockReturnValue({
      user: null,
      isAuthenticated: false,
      login: vi.fn(),
      logout: vi.fn(),
      updateUser: vi.fn(),
    });

    render(<LiveChat streamId={streamId} />);

    expect(screen.getByText('Sign in to join the chat')).toBeInTheDocument();
    expect(screen.queryByPlaceholderText('Type a message...')).not.toBeInTheDocument();
  });

  it('should handle send message error gracefully', async () => {
    const mockSend = vi.fn().mockRejectedValue(new Error('Send failed'));
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    
    mockUseLiveChat.mockReturnValue({
      ...defaultChatState,
      send: mockSend,
    });

    render(<LiveChat streamId={streamId} />);

    const input = screen.getByPlaceholderText('Type a message...');
    const button = screen.getByRole('button');

    fireEvent.change(input, { target: { value: 'Test message' } });
    
    await act(async () => {
      fireEvent.click(button);
    });

    expect(mockSend).toHaveBeenCalledWith('Test message');
    
    // Wait for the error to be logged
    await act(async () => {
      await vi.runAllTimersAsync();
    });

    expect(consoleSpy).toHaveBeenCalledWith('Failed to send message:', expect.any(Error));

    consoleSpy.mockRestore();
  });

  it('should not send empty messages', () => {
    const mockSend = vi.fn().mockResolvedValue(undefined);
    mockUseLiveChat.mockReturnValue({
      ...defaultChatState,
      send: mockSend,
    });

    render(<LiveChat streamId={streamId} />);

    const input = screen.getByPlaceholderText('Type a message...');
    const button = screen.getByRole('button');

    fireEvent.change(input, { target: { value: '   ' } }); // Only whitespace
    fireEvent.click(button);

    expect(mockSend).not.toHaveBeenCalled();
  });

  it('should display deleted messages appropriately', () => {
    const deletedMessage: Message = {
      id: 'msg-deleted',
      user: { id: 'user-1', handle: 'testuser' },
      text: 'This was deleted',
      ts: Math.floor(Date.now() / 1000),
      deleted: true,
    };

    mockUseLiveChat.mockReturnValue({
      ...defaultChatState,
      messages: [deletedMessage],
    });

    render(<LiveChat streamId={streamId} />);

    expect(screen.getByText('Message deleted')).toBeInTheDocument();
    expect(screen.queryByText('This was deleted')).not.toBeInTheDocument();
  });

  it('should apply custom className', () => {
    const { container } = render(<LiveChat streamId={streamId} className="custom-class" />);
    
    expect(container.firstChild).toHaveClass('custom-class');
  });
});