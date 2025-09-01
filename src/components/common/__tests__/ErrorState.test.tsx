import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { ErrorState } from '../ErrorState';

describe('ErrorState', () => {
  it('renders error message correctly', () => {
    const error = new Error('Test error message');
    render(<ErrorState error={error} />);
    
    expect(screen.getByText('Something Went Wrong')).toBeInTheDocument();
    expect(screen.getByText(/Test error message/)).toBeInTheDocument();
  });

  it('shows retry button when onRetry is provided', () => {
    const error = new Error('Network error');
    const onRetry = vi.fn();
    
    render(<ErrorState error={error} onRetry={onRetry} />);
    
    const retryButton = screen.getByRole('button', { name: /try again/i });
    expect(retryButton).toBeInTheDocument();
    
    fireEvent.click(retryButton);
    expect(onRetry).toHaveBeenCalledTimes(1);
  });

  it('shows loading state when retrying', () => {
    const error = new Error('Network error');
    const onRetry = vi.fn();
    
    render(<ErrorState error={error} onRetry={onRetry} isRetrying={true} />);
    
    expect(screen.getByText('Retrying...')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /retrying/i })).toBeDisabled();
  });

  it('renders compact variant correctly', () => {
    const error = new Error('Test error');
    render(<ErrorState error={error} variant="compact" />);
    
    // Should not render as a card in compact mode
    expect(screen.queryByRole('heading')).not.toBeInTheDocument();
    expect(screen.getByText('Error')).toBeInTheDocument();
  });

  it('renders inline variant correctly', () => {
    const error = new Error('Test error');
    render(<ErrorState error={error} variant="inline" />);
    
    // Should be very minimal in inline mode
    expect(screen.queryByRole('button', { name: /refresh page/i })).not.toBeInTheDocument();
  });

  it('shows technical details in development mode', () => {
    const originalEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = 'development';
    
    const error = new Error('Technical error details');
    render(<ErrorState error={error} showDetails={true} />);
    
    expect(screen.getByText('Technical Details')).toBeInTheDocument();
    
    process.env.NODE_ENV = originalEnv;
  });

  it('handles string errors correctly', () => {
    render(<ErrorState error="String error message" />);
    
    expect(screen.getByText(/String error message/)).toBeInTheDocument();
  });

  it('uses custom title and description when provided', () => {
    const error = new Error('Test error');
    render(
      <ErrorState 
        error={error} 
        title="Custom Title" 
        description="Custom description" 
      />
    );
    
    expect(screen.getByText('Custom Title')).toBeInTheDocument();
    expect(screen.getByText('Custom description')).toBeInTheDocument();
  });

  it('shows appropriate icon for different error types', () => {
    const networkError = new Error('Network error occurred');
    const { rerender } = render(<ErrorState error={networkError} />);
    
    // Should show network-related icon (WifiOff)
    expect(screen.getByText('Connection Problem')).toBeInTheDocument();
    
    const authError = new Error('Unauthorized access');
    rerender(<ErrorState error={authError} />);
    
    // Should show auth-related title
    expect(screen.getByText('Access Required')).toBeInTheDocument();
  });

  it('does not render when error is null', () => {
    const { container } = render(<ErrorState error={null} />);
    expect(container.firstChild).toBeNull();
  });
});