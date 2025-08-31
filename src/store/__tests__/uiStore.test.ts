import { describe, it, expect, beforeEach } from 'vitest';
import { useUIStore } from '../uiStore';

const mockStore = useUIStore;

describe('uiStore', () => {
  beforeEach(() => {
    // Reset store state before each test
    mockStore.setState({
      theme: 'dark',
      sidebarOpen: false,
      modals: {},
      notifications: [],
      loading: {},
    });
  });

  it('should have initial state', () => {
    const state = mockStore.getState();
    
    expect(state.theme).toBe('dark');
    expect(state.sidebarOpen).toBe(false);
    expect(state.modals).toEqual({});
    expect(state.notifications).toEqual([]);
    expect(state.loading).toEqual({});
  });

  it('should toggle theme', () => {
    const { toggleTheme } = mockStore.getState();
    
    // Should start with dark theme
    expect(mockStore.getState().theme).toBe('dark');
    
    // Toggle to light
    toggleTheme();
    expect(mockStore.getState().theme).toBe('light');
    
    // Toggle back to dark
    toggleTheme();
    expect(mockStore.getState().theme).toBe('dark');
  });

  it('should set specific theme', () => {
    const { setTheme } = mockStore.getState();
    
    setTheme('light');
    expect(mockStore.getState().theme).toBe('light');
    
    setTheme('dark');
    expect(mockStore.getState().theme).toBe('dark');
  });

  it('should toggle sidebar', () => {
    const { toggleSidebar } = mockStore.getState();
    
    // Should start closed
    expect(mockStore.getState().sidebarOpen).toBe(false);
    
    // Toggle open
    toggleSidebar();
    expect(mockStore.getState().sidebarOpen).toBe(true);
    
    // Toggle closed
    toggleSidebar();
    expect(mockStore.getState().sidebarOpen).toBe(false);
  });

  it('should set sidebar state', () => {
    const { setSidebarOpen } = mockStore.getState();
    
    setSidebarOpen(true);
    expect(mockStore.getState().sidebarOpen).toBe(true);
    
    setSidebarOpen(false);
    expect(mockStore.getState().sidebarOpen).toBe(false);
  });

  it('should open and close modals', () => {
    const { openModal, closeModal } = mockStore.getState();
    
    // Open modal
    openModal('tip', { videoId: 'video-1', amount: 5 });
    
    let state = mockStore.getState();
    expect(state.modals.tip).toEqual({
      isOpen: true,
      data: { videoId: 'video-1', amount: 5 },
    });
    
    // Close modal
    closeModal('tip');
    
    state = mockStore.getState();
    expect(state.modals.tip).toEqual({
      isOpen: false,
      data: null,
    });
  });

  it('should close all modals', () => {
    const { openModal, closeAllModals } = mockStore.getState();
    
    // Open multiple modals
    openModal('tip', { videoId: 'video-1' });
    openModal('upload', { step: 1 });
    openModal('profile', { userId: 'user-1' });
    
    // Verify modals are open
    let state = mockStore.getState();
    expect(state.modals.tip?.isOpen).toBe(true);
    expect(state.modals.upload?.isOpen).toBe(true);
    expect(state.modals.profile?.isOpen).toBe(true);
    
    // Close all modals
    closeAllModals();
    
    state = mockStore.getState();
    expect(state.modals.tip?.isOpen).toBe(false);
    expect(state.modals.upload?.isOpen).toBe(false);
    expect(state.modals.profile?.isOpen).toBe(false);
  });

  it('should add and remove notifications', () => {
    const { addNotification, removeNotification } = mockStore.getState();
    
    // Add notification
    const notification = {
      id: 'notif-1',
      type: 'success' as const,
      title: 'Success',
      message: 'Operation completed',
    };
    
    addNotification(notification);
    
    let state = mockStore.getState();
    expect(state.notifications).toHaveLength(1);
    expect(state.notifications[0]).toEqual(notification);
    
    // Remove notification
    removeNotification('notif-1');
    
    state = mockStore.getState();
    expect(state.notifications).toHaveLength(0);
  });

  it('should auto-generate notification IDs', () => {
    const { addNotification } = mockStore.getState();
    
    // Add notification without ID
    addNotification({
      type: 'info',
      title: 'Info',
      message: 'Information message',
    });
    
    const state = mockStore.getState();
    expect(state.notifications).toHaveLength(1);
    expect(state.notifications[0].id).toBeDefined();
    expect(typeof state.notifications[0].id).toBe('string');
  });

  it('should clear all notifications', () => {
    const { addNotification, clearNotifications } = mockStore.getState();
    
    // Add multiple notifications
    addNotification({ type: 'success', title: 'Success 1', message: 'Message 1' });
    addNotification({ type: 'error', title: 'Error 1', message: 'Message 2' });
    addNotification({ type: 'info', title: 'Info 1', message: 'Message 3' });
    
    // Verify notifications exist
    expect(mockStore.getState().notifications).toHaveLength(3);
    
    // Clear all notifications
    clearNotifications();
    
    expect(mockStore.getState().notifications).toHaveLength(0);
  });

  it('should set and clear loading states', () => {
    const { setLoading, clearLoading } = mockStore.getState();
    
    // Set loading state
    setLoading('upload', true);
    
    let state = mockStore.getState();
    expect(state.loading.upload).toBe(true);
    
    // Set another loading state
    setLoading('tip', true);
    
    state = mockStore.getState();
    expect(state.loading.upload).toBe(true);
    expect(state.loading.tip).toBe(true);
    
    // Clear specific loading state
    clearLoading('upload');
    
    state = mockStore.getState();
    expect(state.loading.upload).toBe(false);
    expect(state.loading.tip).toBe(true);
  });

  it('should check if any loading state is active', () => {
    const { setLoading, isLoading } = mockStore.getState();
    
    // No loading states
    expect(isLoading()).toBe(false);
    
    // Set loading state
    setLoading('upload', true);
    expect(isLoading()).toBe(true);
    
    // Check specific loading state
    expect(isLoading('upload')).toBe(true);
    expect(isLoading('tip')).toBe(false);
  });

  it('should handle notification with duration', () => {
    vi.useFakeTimers();
    
    const { addNotification, removeNotification } = mockStore.getState();
    const mockRemove = vi.fn();
    
    // Mock removeNotification
    mockStore.setState(state => ({
      ...state,
      removeNotification: mockRemove,
    }));
    
    // Add notification with duration
    addNotification({
      type: 'success',
      title: 'Auto-remove',
      message: 'This will auto-remove',
      duration: 3000,
    });
    
    // Fast-forward time
    vi.advanceTimersByTime(3000);
    
    // Should have called removeNotification
    expect(mockRemove).toHaveBeenCalled();
    
    vi.useRealTimers();
  });
});