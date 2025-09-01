import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ENV } from '../../../lib/env';
import { complianceApi } from '../../../lib/api';
import { STORAGE_KEYS } from '../../../constants/live';
import AgeRequirementCard from '../AgeRequirementCard';

// Mock the environment and API
vi.mock('../../../lib/env', () => ({
  ENV: {
    ADULT: true,
    AGE_TTL_DAYS: 90,
  },
}));

vi.mock('../../../lib/api', () => ({
  complianceApi: {
    acknowledgeAge: vi.fn(),
  },
}));

// Mock window.location
const mockLocation = {
  href: '',
};
Object.defineProperty(window, 'location', {
  value: mockLocation,
  writable: true,
});

describe('AgeRequirementCard', () => {
  beforeEach(() => {
    // Clear localStorage before each test
    localStorage.clear();
    mockLocation.href = '';
    vi.clearAllMocks();
  });

  afterEach(() => {
    localStorage.clear();
  });

  it('should not render when adult content is disabled', () => {
    // Mock ENV.ADULT as false
    vi.mocked(ENV).ADULT = false;
    
    render(<AgeRequirementCard />);
    
    expect(screen.queryByText('Adults only (18+)')).not.toBeInTheDocument();
  });

  it('should not render when age is already acknowledged and not expired', () => {
    vi.mocked(ENV).ADULT = true;
    
    // Set valid acknowledgment
    localStorage.setItem(STORAGE_KEYS.AGE_ACKNOWLEDGMENT, '1');
    localStorage.setItem(STORAGE_KEYS.AGE_ACKNOWLEDGMENT_TIMESTAMP, String(Date.now()));
    
    render(<AgeRequirementCard />);
    
    expect(screen.queryByText('Adults only (18+)')).not.toBeInTheDocument();
  });

  it('should render when adult content is enabled and no acknowledgment exists', () => {
    vi.mocked(ENV).ADULT = true;
    
    render(<AgeRequirementCard />);
    
    expect(screen.getByText('Adults only (18+)')).toBeInTheDocument();
    expect(screen.getByText(/You must be 18\+ to use this site/)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'I am 18+' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Leave' })).toBeInTheDocument();
  });

  it('should render when acknowledgment has expired', () => {
    vi.mocked(ENV).ADULT = true;
    vi.mocked(ENV).AGE_TTL_DAYS = 90;
    
    // Set expired acknowledgment (91 days ago)
    const expiredTimestamp = Date.now() - (91 * 24 * 60 * 60 * 1000);
    localStorage.setItem(STORAGE_KEYS.AGE_ACKNOWLEDGMENT, '1');
    localStorage.setItem(STORAGE_KEYS.AGE_ACKNOWLEDGMENT_TIMESTAMP, String(expiredTimestamp));
    
    render(<AgeRequirementCard />);
    
    expect(screen.getByText('Adults only (18+)')).toBeInTheDocument();
  });

  it('should handle accept button click correctly', async () => {
    vi.mocked(ENV).ADULT = true;
    vi.mocked(complianceApi.acknowledgeAge).mockResolvedValue({ ok: true });
    
    render(<AgeRequirementCard />);
    
    const acceptButton = screen.getByRole('button', { name: 'I am 18+' });
    fireEvent.click(acceptButton);
    
    // Should show loading state
    expect(screen.getByText('Verifying...')).toBeInTheDocument();
    
    await waitFor(() => {
      // Should store acknowledgment in localStorage
      expect(localStorage.getItem(STORAGE_KEYS.AGE_ACKNOWLEDGMENT)).toBe('1');
      expect(localStorage.getItem(STORAGE_KEYS.AGE_ACKNOWLEDGMENT_TIMESTAMP)).toBeTruthy();
      
      // Should call API
      expect(complianceApi.acknowledgeAge).toHaveBeenCalledOnce();
      
      // Modal should be closed (component unmounted)
      expect(screen.queryByText('Adults only (18+)')).not.toBeInTheDocument();
    });
  });

  it('should handle API failure gracefully', async () => {
    vi.mocked(ENV).ADULT = true;
    vi.mocked(complianceApi.acknowledgeAge).mockRejectedValue(new Error('Network error'));
    
    const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    
    render(<AgeRequirementCard />);
    
    const acceptButton = screen.getByRole('button', { name: 'I am 18+' });
    fireEvent.click(acceptButton);
    
    await waitFor(() => {
      // Should still store acknowledgment in localStorage despite API failure
      expect(localStorage.getItem(STORAGE_KEYS.AGE_ACKNOWLEDGMENT)).toBe('1');
      
      // Should log warning
      expect(consoleSpy).toHaveBeenCalledWith(
        'Failed to send age acknowledgment to server:',
        expect.any(Error)
      );
      
      // Modal should still be closed
      expect(screen.queryByText('Adults only (18+)')).not.toBeInTheDocument();
    });
    
    consoleSpy.mockRestore();
  });

  it('should handle leave button click correctly', () => {
    vi.mocked(ENV).ADULT = true;
    
    render(<AgeRequirementCard />);
    
    const leaveButton = screen.getByRole('button', { name: 'Leave' });
    fireEvent.click(leaveButton);
    
    expect(mockLocation.href).toBe('https://google.com');
  });

  it('should disable buttons during loading', async () => {
    vi.mocked(ENV).ADULT = true;
    vi.mocked(complianceApi.acknowledgeAge).mockImplementation(
      () => new Promise(resolve => setTimeout(resolve, 100))
    );
    
    render(<AgeRequirementCard />);
    
    const acceptButton = screen.getByRole('button', { name: 'I am 18+' });
    const leaveButton = screen.getByRole('button', { name: 'Leave' });
    
    fireEvent.click(acceptButton);
    
    // Both buttons should be disabled during loading
    expect(acceptButton).toBeDisabled();
    expect(leaveButton).toBeDisabled();
    expect(screen.getByText('Verifying...')).toBeInTheDocument();
  });

  it('should have proper accessibility attributes', () => {
    vi.mocked(ENV).ADULT = true;
    
    render(<AgeRequirementCard />);
    
    const dialog = screen.getByRole('dialog');
    expect(dialog).toHaveAttribute('aria-modal', 'true');
    expect(dialog).toHaveAttribute('aria-labelledby', 'age-gate-title');
    expect(dialog).toHaveAttribute('aria-describedby', 'age-gate-description');
    
    expect(screen.getByRole('heading', { name: 'Adults only (18+)' })).toHaveAttribute('id', 'age-gate-title');
    expect(screen.getByText(/You must be 18\+ to use this site/)).toHaveAttribute('id', 'age-gate-description');
  });
});