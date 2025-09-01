import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import LiveBadge from '../LiveBadge';

describe('LiveBadge', () => {
  it('should render live badge by default', () => {
    render(<LiveBadge />);
    
    const badge = screen.getByRole('status');
    expect(badge).toBeInTheDocument();
    expect(badge).toHaveTextContent('LIVE');
    expect(badge).toHaveAttribute('aria-label', 'Currently live streaming');
    expect(badge).toHaveClass('bg-red-600', 'text-white');
  });

  it('should render upcoming badge variant', () => {
    render(<LiveBadge variant="upcoming" />);
    
    const badge = screen.getByRole('status');
    expect(badge).toHaveTextContent('UPCOMING');
    expect(badge).toHaveAttribute('aria-label', 'Scheduled live stream');
    expect(badge).toHaveClass('bg-amber-500', 'text-white');
  });

  it('should render ended badge variant', () => {
    render(<LiveBadge variant="ended" />);
    
    const badge = screen.getByRole('status');
    expect(badge).toHaveTextContent('ENDED');
    expect(badge).toHaveAttribute('aria-label', 'Live stream has ended');
    expect(badge).toHaveClass('bg-gray-500', 'text-white');
  });

  it('should render custom text when provided', () => {
    render(<LiveBadge variant="live" text="ON AIR" />);
    
    const badge = screen.getByRole('status');
    expect(badge).toHaveTextContent('ON AIR');
    expect(badge).toHaveClass('bg-red-600');
  });

  it('should apply custom className', () => {
    render(<LiveBadge className="custom-class" />);
    
    const badge = screen.getByRole('status');
    expect(badge).toHaveClass('custom-class');
  });

  it('should have proper base styling classes', () => {
    render(<LiveBadge />);
    
    const badge = screen.getByRole('status');
    expect(badge).toHaveClass(
      'inline-flex',
      'items-center',
      'justify-center',
      'text-[10px]',
      'font-semibold',
      'rounded',
      'px-1.5',
      'py-0.5',
      'leading-none'
    );
  });

  it('should handle invalid variant gracefully', () => {
    // @ts-expect-error Testing invalid variant
    render(<LiveBadge variant="invalid" />);
    
    const badge = screen.getByRole('status');
    expect(badge).toHaveTextContent('LIVE');
    expect(badge).toHaveClass('bg-red-600');
  });

  it('should be accessible with proper ARIA attributes', () => {
    render(<LiveBadge variant="live" />);
    
    const badge = screen.getByRole('status');
    expect(badge).toHaveAttribute('role', 'status');
    expect(badge).toHaveAttribute('aria-label');
  });
});