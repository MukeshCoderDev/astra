import { describe, it, expect, beforeEach } from 'vitest';
import { useSessionStore } from '../sessionStore';

// Mock the store for testing
const mockStore = useSessionStore;

describe('sessionStore', () => {
  beforeEach(() => {
    // Reset store state before each test
    mockStore.setState({
      user: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,
    });
  });

  it('should have initial state', () => {
    const state = mockStore.getState();
    
    expect(state.user).toBeNull();
    expect(state.isAuthenticated).toBe(false);
    expect(state.isLoading).toBe(false);
    expect(state.error).toBeNull();
  });

  it('should set loading state', () => {
    const { setLoading } = mockStore.getState();
    
    setLoading(true);
    
    expect(mockStore.getState().isLoading).toBe(true);
  });

  it('should set user and authentication state', () => {
    const mockUser = {
      id: 'user-1',
      handle: 'testuser',
      displayName: 'Test User',
      avatar: 'https://example.com/avatar.jpg',
      verified: false,
      followerCount: 100,
      totalViews: 1000,
    };

    const { setUser } = mockStore.getState();
    
    setUser(mockUser);
    
    const state = mockStore.getState();
    expect(state.user).toEqual(mockUser);
    expect(state.isAuthenticated).toBe(true);
    expect(state.error).toBeNull();
  });

  it('should set error state', () => {
    const errorMessage = 'Authentication failed';
    const { setError } = mockStore.getState();
    
    setError(errorMessage);
    
    const state = mockStore.getState();
    expect(state.error).toBe(errorMessage);
    expect(state.isLoading).toBe(false);
  });

  it('should clear user on logout', () => {
    const mockUser = {
      id: 'user-1',
      handle: 'testuser',
      displayName: 'Test User',
      avatar: 'https://example.com/avatar.jpg',
      verified: false,
      followerCount: 100,
      totalViews: 1000,
    };

    const { setUser, logout } = mockStore.getState();
    
    // Set user first
    setUser(mockUser);
    expect(mockStore.getState().isAuthenticated).toBe(true);
    
    // Then logout
    logout();
    
    const state = mockStore.getState();
    expect(state.user).toBeNull();
    expect(state.isAuthenticated).toBe(false);
    expect(state.error).toBeNull();
  });

  it('should clear error when setting user', () => {
    const { setError, setUser } = mockStore.getState();
    
    // Set error first
    setError('Some error');
    expect(mockStore.getState().error).toBe('Some error');
    
    // Set user should clear error
    setUser({
      id: 'user-1',
      handle: 'testuser',
      displayName: 'Test User',
      avatar: 'https://example.com/avatar.jpg',
      verified: false,
      followerCount: 100,
      totalViews: 1000,
    });
    
    expect(mockStore.getState().error).toBeNull();
  });

  it('should update user data', () => {
    const initialUser = {
      id: 'user-1',
      handle: 'testuser',
      displayName: 'Test User',
      avatar: 'https://example.com/avatar.jpg',
      verified: false,
      followerCount: 100,
      totalViews: 1000,
    };

    const { setUser, updateUser } = mockStore.getState();
    
    // Set initial user
    setUser(initialUser);
    
    // Update user data
    updateUser({ verified: true, followerCount: 150 });
    
    const state = mockStore.getState();
    expect(state.user?.verified).toBe(true);
    expect(state.user?.followerCount).toBe(150);
    expect(state.user?.displayName).toBe('Test User'); // Should preserve other fields
  });

  it('should not update user if not authenticated', () => {
    const { updateUser } = mockStore.getState();
    
    // Try to update user when not authenticated
    updateUser({ verified: true });
    
    expect(mockStore.getState().user).toBeNull();
  });
});