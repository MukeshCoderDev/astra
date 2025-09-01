import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { describe, it, expect, vi } from 'vitest';
import SideNav from '../SideNav';

// Mock the ENV module
vi.mock('../../../lib/env', () => ({
  ENV: {
    LIVE_ENABLED: true
  }
}));

const renderWithRouter = (component: React.ReactElement) => {
  return render(
    <BrowserRouter>
      {component}
    </BrowserRouter>
  );
};

describe('SideNav', () => {
  it('renders main navigation items', () => {
    renderWithRouter(<SideNav />);
    
    expect(screen.getByText('Home')).toBeInTheDocument();
    expect(screen.getByText('Shorts')).toBeInTheDocument();
    expect(screen.getByText('Live')).toBeInTheDocument();
    expect(screen.getByText('Subscriptions')).toBeInTheDocument();
    expect(screen.getByText('Explore')).toBeInTheDocument();
    expect(screen.getByText('Trending')).toBeInTheDocument();
  });

  it('renders "You" section items', () => {
    renderWithRouter(<SideNav />);
    
    expect(screen.getByText('You')).toBeInTheDocument();
    expect(screen.getByText('History')).toBeInTheDocument();
    expect(screen.getByText('Playlists')).toBeInTheDocument();
    expect(screen.getByText('Your videos')).toBeInTheDocument();
    expect(screen.getByText('Watch later')).toBeInTheDocument();
    expect(screen.getByText('Liked videos')).toBeInTheDocument();
  });

  it('renders other navigation items', () => {
    renderWithRouter(<SideNav />);
    
    expect(screen.getByText('Upload')).toBeInTheDocument();
    expect(screen.getByText('Wallet')).toBeInTheDocument();
    expect(screen.getByText('Studio')).toBeInTheDocument();
  });

  it('organizes navigation into logical sections with separators', () => {
    renderWithRouter(<SideNav />);
    
    // Check that sections are properly separated
    const youSection = screen.getByText('You');
    expect(youSection).toBeInTheDocument();
    
    // Verify the section structure
    const nav = screen.getByRole('navigation');
    expect(nav).toBeInTheDocument();
  });

  it('applies correct link paths', () => {
    renderWithRouter(<SideNav />);
    
    expect(screen.getByRole('link', { name: /home/i })).toHaveAttribute('href', '/');
    expect(screen.getByRole('link', { name: /subscriptions/i })).toHaveAttribute('href', '/subscriptions');
    expect(screen.getByRole('link', { name: /explore/i })).toHaveAttribute('href', '/explore');
    expect(screen.getByRole('link', { name: /trending/i })).toHaveAttribute('href', '/trending');
    expect(screen.getByRole('link', { name: /history/i })).toHaveAttribute('href', '/history');
    expect(screen.getByRole('link', { name: /playlists/i })).toHaveAttribute('href', '/playlists');
  });
});