import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { StickyChips, Chip } from '../StickyChips';

const mockChips: Chip[] = [
  { id: 'all', label: 'All', value: 'all' },
  { id: 'today', label: 'Today', value: 'today' },
  { id: 'week', label: 'This week', value: 'week' },
];

describe('StickyChips', () => {
  it('renders all chips', () => {
    const onChange = vi.fn();
    render(
      <StickyChips
        chips={mockChips}
        active="all"
        onChange={onChange}
      />
    );

    expect(screen.getByText('All')).toBeInTheDocument();
    expect(screen.getByText('Today')).toBeInTheDocument();
    expect(screen.getByText('This week')).toBeInTheDocument();
  });

  it('highlights the active chip', () => {
    const onChange = vi.fn();
    render(
      <StickyChips
        chips={mockChips}
        active="today"
        onChange={onChange}
      />
    );

    const todayButton = screen.getByText('Today');
    expect(todayButton).toHaveClass('bg-primary');
  });

  it('calls onChange when a chip is clicked', () => {
    const onChange = vi.fn();
    render(
      <StickyChips
        chips={mockChips}
        active="all"
        onChange={onChange}
      />
    );

    fireEvent.click(screen.getByText('Today'));
    expect(onChange).toHaveBeenCalledWith('today');
  });

  it('applies sticky positioning', () => {
    const onChange = vi.fn();
    const { container } = render(
      <StickyChips
        chips={mockChips}
        active="all"
        onChange={onChange}
      />
    );

    const stickyContainer = container.firstChild as HTMLElement;
    expect(stickyContainer).toHaveClass('sticky');
    expect(stickyContainer).toHaveClass('top-16');
  });
});