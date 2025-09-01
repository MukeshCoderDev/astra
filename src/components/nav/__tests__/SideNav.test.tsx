import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// Mock the environment configuration
const mockEnv = vi.hoisted(() => ({
  ENV: {
    LIVE_ENABLED: true,
  },
}));

vi.mock('../../../lib/env', () => mockEnv);

const renderWithRouter = (component: React.ReactElement) => {
  return render(
    <BrowserRouter>
      {component}
    </BrowserRouter>
  );
};

describe('SideNav', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('renders all navigation items when live streaming is enabled', async () => {
    // Import component after mock is set up
    const { default: SideNav } = await import('../SideNav');
    
    renderWithRouter(<SideNav />);
    
    expect(screen.getByText('Home')).toBeInTheDocument();
    expect(screen.getByText('Shorts')).toBeInTheDocument();
    expect(screen.getByText('Live')).toBeInTheDocument();
    expect(screen.getByText('Upload')).toBeInTheDocument();
    expect(screen.getByText('Wallet')).toBeInTheDocument();
    expect(screen.getByText('Studio')).toBeInTheDocument();
  });

  it('does not render Live link when live streaming is disabled', async () => {
    // Update the mock
    mockEnv.ENV.LIVE_ENABLED = false;
    
    // Clear module cache and re-import
    vi.resetModules();
    const { default: SideNav } = await import('../SideNav');
    
    renderWithRouter(<SideNav />);
    
    expect(screen.getByText('Home')).toBeInTheDocument();
    expect(screen.getByText('Shorts')).toBeInTheDocument();
    expect(screen.queryByText('Live')).not.toBeInTheDocument();
    expect(screen.getByText('Upload')).toBeInTheDocument();
    expect(screen.getByText('Wallet')).toBeInTheDocument();
    expect(screen.getByText('Studio')).toBeInTheDocument();
    
    // Reset for other tests
    mockEnv.ENV.LIVE_ENABLED = true;
  });

  it('applies active state correctly for Live link', async () => {
    const { default: SideNav } = await import('../SideNav');
    
    renderWithRouter(<SideNav />);
    
    const liveLink = screen.getByText('Live').closest('a');
    expect(liveLink).toHaveAttribute('href', '/live');
  });

  it('renders with custom className', async () => {
    const { default: SideNav } = await import('../SideNav');
    
    const { container } = renderWithRouter(<SideNav className="custom-class" />);
    
    const nav = container.querySelector('nav');
    expect(nav).toHaveClass('custom-class');
  });
});