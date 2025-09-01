import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ChatMessage } from '../ChatMessage';
import { liveApi } from '../../../lib/api';
import { useSessionStore } from '../../../store/sessionStore';
import type { Message } from '../../../types/live';

// Mock the API
vi.mock('../../../lib/api', () => ({
  liveApi: {
    moderate: vi.fn(),
    pinMessage: vi.fn(),
    unpinMessage: vi.fn(),
  },
}));

// Mock the session store
vi.mock('../../../store/sessionStore');

const mockLiveApi = vi.mocked(liveApi);
const mockUseSessionStore = vi.mocked(useSessionStore);

describe('ChatMessage', () => {
  const streamId = 'test-stream-123';
  const formatTime = (ts: number) => new Date(ts * 1000).toLocaleTimeString();
  const onModerationAction = vi.fn();

  const mockUser = {
    id: 'user-1',
    handle: 'testuser',
    avatar: 'https://example.com/avatar.jpg',
  };

  const mockCreator = {
    id: 'creator-1',
    handle: 'creator',
    role: 'creator' as const,
  };

  const mockMessage: Message = {
    id: 'msg-1',
    user: { id: 'user-2', handle: 'viewer', role: 'viewer' },
    text: 'Hello world!',
    ts: Math.floor(Date.now() / 1000),
  };

  const mockPinnedMessage: Message = {
    ...mockMessage,
    id: 'msg-2',
    pinned: true,
    text: 'This is pinned!',
  };

  const mockDeletedMessage: Message = {
    ...mockMessage,
    id: 'msg-3',
    deleted: true,
    text: 'This was deleted',
  };

  beforeEach(() => {
    vi.clearAllMocks();
    
    mockUseSessionStore.mockReturnValue({
      user: mockUser,
      isAuthenticated: true,
      login: vi.fn(),
      logout: vi.fn(),
      updateUser: vi.fn(),
    });

    mockLiveApi.moderate.mockResolvedValue({ ok: true });
    mockLiveApi.pinMessage.mockResolvedValue({ ok: true });
    mockLiveApi.unpinMessage.mockResolvedValue({ ok: true });
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('should render basic message', () => {
    render(
      <ChatMessage
        message={mockMessage}
        streamId={streamId}
        formatTime={formatTime}
        onModerationAction={onModerationAction}
      />
    );

    expect(screen.getByText('Hello world!')).toBeInTheDocument();
    expect(screen.getByText('viewer')).toBeInTheDocument();
  });

  it('should render pinned message with pin indicator', () => {
    render(
      <ChatMessage
        message={mockPinnedMessage}
        streamId={streamId}
        formatTime={formatTime}
        onModerationAction={onModerationAction}
      />
    );

    expect(screen.getByText('This is pinned!')).toBeInTheDocument();
    expect(screen.getByText('PINNED')).toBeInTheDocument();
  });

  it('should render deleted message appropriately', () => {
    render(
      <ChatMessage
        message={mockDeletedMessage}
        streamId={streamId}
        formatTime={formatTime}
        onModerationAction={onModerationAction}
      />
    );

    expect(screen.getByText('Message deleted')).toBeInTheDocument();
    expect(screen.queryByText('This was deleted')).not.toBeInTheDocument();
  });

  it('should show moderation actions for creators', () => {
    render(
      <ChatMessage
        message={mockMessage}
        streamId={streamId}
        isCreator={true}
        formatTime={formatTime}
        onModerationAction={onModerationAction}
      />
    );

    // Hover to show moderation buttons
    const messageContainer = screen.getByText('Hello world!').closest('.group');
    fireEvent.mouseEnter(messageContainer!);

    const buttons = screen.getAllByRole('button');
    expect(buttons.length).toBeGreaterThan(0);
  });

  it('should show moderation actions for moderators', () => {
    render(
      <ChatMessage
        message={mockMessage}
        streamId={streamId}
        isModerator={true}
        formatTime={formatTime}
        onModerationAction={onModerationAction}
      />
    );

    // Hover to show moderation buttons
    const messageContainer = screen.getByText('Hello world!').closest('.group');
    fireEvent.mouseEnter(messageContainer!);

    const buttons = screen.getAllByRole('button');
    expect(buttons.length).toBeGreaterThan(0);
  });

  it('should not show moderation actions for regular viewers', () => {
    render(
      <ChatMessage
        message={mockMessage}
        streamId={streamId}
        formatTime={formatTime}
        onModerationAction={onModerationAction}
      />
    );

    // Hover to try to show moderation buttons
    const messageContainer = screen.getByText('Hello world!').closest('.group');
    fireEvent.mouseEnter(messageContainer!);

    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });

  it('should handle pin message action', async () => {
    render(
      <ChatMessage
        message={mockMessage}
        streamId={streamId}
        isCreator={true}
        formatTime={formatTime}
        onModerationAction={onModerationAction}
      />
    );

    // Hover and click pin button
    const messageContainer = screen.getByText('Hello world!').closest('.group');
    fireEvent.mouseEnter(messageContainer!);

    const pinButton = screen.getByTitle('Pin Message');
    fireEvent.click(pinButton);

    await waitFor(() => {
      expect(mockLiveApi.pinMessage).toHaveBeenCalledWith(streamId, mockMessage.id);
    });
  });

  it('should handle unpin message action', async () => {
    render(
      <ChatMessage
        message={mockPinnedMessage}
        streamId={streamId}
        isCreator={true}
        formatTime={formatTime}
        onModerationAction={onModerationAction}
      />
    );

    // Hover and click unpin button
    const messageContainer = screen.getByText('This is pinned!').closest('.group');
    fireEvent.mouseEnter(messageContainer!);

    const unpinButton = screen.getByTitle('Unpin Message');
    fireEvent.click(unpinButton);

    await waitFor(() => {
      expect(mockLiveApi.unpinMessage).toHaveBeenCalledWith(streamId, mockPinnedMessage.id);
    });
  });

  it('should handle delete message action', async () => {
    render(
      <ChatMessage
        message={mockMessage}
        streamId={streamId}
        isCreator={true}
        formatTime={formatTime}
        onModerationAction={onModerationAction}
      />
    );

    // Hover and click delete button
    const messageContainer = screen.getByText('Hello world!').closest('.group');
    fireEvent.mouseEnter(messageContainer!);

    const deleteButton = screen.getByTitle('Delete Message');
    fireEvent.click(deleteButton);

    await waitFor(() => {
      expect(mockLiveApi.moderate).toHaveBeenCalledWith(streamId, {
        action: 'delete',
        targetUserId: mockMessage.user.id,
        messageId: mockMessage.id,
      });
    });

    await waitFor(() => {
      expect(onModerationAction).toHaveBeenCalledWith(mockMessage.id, 'delete');
    });
  });

  it('should handle timeout user action', async () => {
    render(
      <ChatMessage
        message={mockMessage}
        streamId={streamId}
        isCreator={true}
        formatTime={formatTime}
        onModerationAction={onModerationAction}
      />
    );

    // Hover and click timeout button
    const messageContainer = screen.getByText('Hello world!').closest('.group');
    fireEvent.mouseEnter(messageContainer!);

    const timeoutButton = screen.getByTitle('Timeout User (5m)');
    fireEvent.click(timeoutButton);

    await waitFor(() => {
      expect(mockLiveApi.moderate).toHaveBeenCalledWith(streamId, {
        action: 'timeout',
        targetUserId: mockMessage.user.id,
        durationSec: 300, // 5 minutes
        reason: 'Timeout from chat message',
      });
    });

    await waitFor(() => {
      expect(onModerationAction).toHaveBeenCalledWith(mockMessage.id, 'timeout');
    });
  });

  it('should handle ban user action', async () => {
    render(
      <ChatMessage
        message={mockMessage}
        streamId={streamId}
        isCreator={true}
        formatTime={formatTime}
        onModerationAction={onModerationAction}
      />
    );

    // Hover and click ban button
    const messageContainer = screen.getByText('Hello world!').closest('.group');
    fireEvent.mouseEnter(messageContainer!);

    const banButton = screen.getByTitle('Ban User');
    fireEvent.click(banButton);

    await waitFor(() => {
      expect(mockLiveApi.moderate).toHaveBeenCalledWith(streamId, {
        action: 'ban',
        targetUserId: mockMessage.user.id,
        reason: 'Banned from chat message',
      });
    });

    await waitFor(() => {
      expect(onModerationAction).toHaveBeenCalledWith(mockMessage.id, 'ban');
    });
  });

  it('should not show timeout/ban actions on own messages', () => {
    const ownMessage: Message = {
      ...mockMessage,
      user: mockUser,
    };

    render(
      <ChatMessage
        message={ownMessage}
        streamId={streamId}
        isCreator={true}
        formatTime={formatTime}
        onModerationAction={onModerationAction}
      />
    );

    // Hover to show moderation buttons
    const messageContainer = screen.getByText('Hello world!').closest('.group');
    fireEvent.mouseEnter(messageContainer!);

    // Should show pin and delete, but not timeout/ban
    expect(screen.getByTitle('Pin Message')).toBeInTheDocument();
    expect(screen.getByTitle('Delete Message')).toBeInTheDocument();
    expect(screen.queryByTitle('Timeout User (5m)')).not.toBeInTheDocument();
    expect(screen.queryByTitle('Ban User')).not.toBeInTheDocument();
  });

  it('should handle API errors gracefully', async () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    mockLiveApi.moderate.mockResolvedValue({ ok: false, error: 'API Error' });

    render(
      <ChatMessage
        message={mockMessage}
        streamId={streamId}
        isCreator={true}
        formatTime={formatTime}
        onModerationAction={onModerationAction}
      />
    );

    // Hover and click delete button
    const messageContainer = screen.getByText('Hello world!').closest('.group');
    fireEvent.mouseEnter(messageContainer!);

    const deleteButton = screen.getByTitle('Delete Message');
    fireEvent.click(deleteButton);

    await waitFor(() => {
      expect(consoleSpy).toHaveBeenCalledWith('Moderation action failed:', 'API Error');
    });

    expect(onModerationAction).not.toHaveBeenCalled();
    consoleSpy.mockRestore();
  });

  it('should show different colors for different user roles', () => {
    const creatorMessage: Message = {
      ...mockMessage,
      user: mockCreator,
    };

    render(
      <ChatMessage
        message={creatorMessage}
        streamId={streamId}
        formatTime={formatTime}
        onModerationAction={onModerationAction}
      />
    );

    const creatorName = screen.getByText('creator');
    expect(creatorName).toHaveClass('text-purple-400');
  });

  it('should disable actions when loading', async () => {
    render(
      <ChatMessage
        message={mockMessage}
        streamId={streamId}
        isCreator={true}
        formatTime={formatTime}
        onModerationAction={onModerationAction}
      />
    );

    // Hover and click delete button
    const messageContainer = screen.getByText('Hello world!').closest('.group');
    fireEvent.mouseEnter(messageContainer!);

    const deleteButton = screen.getByTitle('Delete Message');
    fireEvent.click(deleteButton);

    // Button should be disabled during loading
    expect(deleteButton).toBeDisabled();
  });

  it('should format timestamp correctly', () => {
    const testTime = 1640995200; // 2022-01-01 00:00:00 UTC
    const testMessage: Message = {
      ...mockMessage,
      ts: testTime,
    };

    render(
      <ChatMessage
        message={testMessage}
        streamId={streamId}
        formatTime={formatTime}
        onModerationAction={onModerationAction}
      />
    );

    // Hover to show timestamp
    const messageContainer = screen.getByText('Hello world!').closest('.group');
    fireEvent.mouseEnter(messageContainer!);

    const timestamp = screen.getByText(formatTime(testTime));
    expect(timestamp).toBeInTheDocument();
  });
});