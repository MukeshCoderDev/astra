import { render, screen } from '@testing-library/react';
import { vi } from 'vitest';
import HealthPanel from '../HealthPanel';
import { useLiveControl } from '../../../hooks/useLiveControl';

// Mock the useLiveControl hook
vi.mock('../../../hooks/useLiveControl');

describe('HealthPanel', () => {
  const defaultProps = {
    streamId: 'test-stream-123',
  };

  const mockHealthMetrics = {
    viewerCount: 150,
    bitrateKbps: 2500,
    fps: 30,
    dropRate: 1.5,
    timestamp: Date.now(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders health panel with excellent status', () => {
    (useLiveControl as any).mockReturnValue({
      healthMetrics: mockHealthMetrics,
      viewerCount: 150,
      connected: true,
      failed: false,
      loading: false,
    });

    render(<HealthPanel {...defaultProps} />);

    expect(screen.getByText('Stream Health')).toBeInTheDocument();
    expect(screen.getByText('Real-time monitoring of your stream quality')).toBeInTheDocument();
    expect(screen.getByText('Excellent')).toBeInTheDocument();
    expect(screen.getByText('Stream quality is optimal')).toBeInTheDocument();
    expect(screen.getByText('Connected')).toBeInTheDocument();
  });

  it('displays health metrics correctly', () => {
    (useLiveControl as any).mockReturnValue({
      healthMetrics: mockHealthMetrics,
      viewerCount: 150,
      connected: true,
      failed: false,
      loading: false,
    });

    render(<HealthPanel {...defaultProps} />);

    expect(screen.getByText('Viewers')).toBeInTheDocument();
    expect(screen.getByText('150')).toBeInTheDocument();
    
    expect(screen.getByText('Bitrate')).toBeInTheDocument();
    expect(screen.getByText('2.5K kbps')).toBeInTheDocument();
    
    expect(screen.getByText('Frame Rate')).toBeInTheDocument();
    expect(screen.getByText('30 fps')).toBeInTheDocument();
    
    expect(screen.getByText('Drop Rate')).toBeInTheDocument();
    expect(screen.getByText('1.5%')).toBeInTheDocument();
  });

  it('shows warning status for moderate metrics', () => {
    const warningMetrics = {
      ...mockHealthMetrics,
      bitrateKbps: 1500,
      fps: 25,
      dropRate: 3.5,
    };

    (useLiveControl as any).mockReturnValue({
      healthMetrics: warningMetrics,
      viewerCount: 150,
      connected: true,
      failed: false,
      loading: false,
    });

    render(<HealthPanel {...defaultProps} />);

    expect(screen.getByText('Warning')).toBeInTheDocument();
    expect(screen.getByText('Stream quality needs attention')).toBeInTheDocument();
  });

  it('shows critical status for poor metrics', () => {
    const criticalMetrics = {
      ...mockHealthMetrics,
      bitrateKbps: 400,
      fps: 12,
      dropRate: 15,
    };

    (useLiveControl as any).mockReturnValue({
      healthMetrics: criticalMetrics,
      viewerCount: 150,
      connected: true,
      failed: false,
      loading: false,
    });

    render(<HealthPanel {...defaultProps} />);

    expect(screen.getByText('Critical')).toBeInTheDocument();
    expect(screen.getByText('Stream quality is poor')).toBeInTheDocument();
  });

  it('shows offline status when disconnected', () => {
    (useLiveControl as any).mockReturnValue({
      healthMetrics: null,
      viewerCount: 0,
      connected: false,
      failed: true,
      loading: false,
    });

    render(<HealthPanel {...defaultProps} />);

    expect(screen.getByText('Offline')).toBeInTheDocument();
    expect(screen.getByText('No stream data available')).toBeInTheDocument();
    expect(screen.getByText('Disconnected')).toBeInTheDocument();
  });

  it('shows loading state correctly', () => {
    (useLiveControl as any).mockReturnValue({
      healthMetrics: null,
      viewerCount: 0,
      connected: false,
      failed: false,
      loading: true,
    });

    render(<HealthPanel {...defaultProps} />);

    expect(screen.getByText('Connecting...')).toBeInTheDocument();
    expect(screen.getByText('Loading health metrics...')).toBeInTheDocument();
  });

  it('shows no data state when not loading and no metrics', () => {
    (useLiveControl as any).mockReturnValue({
      healthMetrics: null,
      viewerCount: 0,
      connected: true,
      failed: false,
      loading: false,
    });

    render(<HealthPanel {...defaultProps} />);

    expect(screen.getByText('No health data available')).toBeInTheDocument();
    expect(screen.getByText('Start streaming to see metrics')).toBeInTheDocument();
  });

  it('shows polling fallback message when failed', () => {
    (useLiveControl as any).mockReturnValue({
      healthMetrics: null,
      viewerCount: 0,
      connected: false,
      failed: true,
      loading: false,
    });

    render(<HealthPanel {...defaultProps} />);

    expect(screen.getByText('Connection failed - using polling fallback')).toBeInTheDocument();
  });

  it('formats large viewer counts correctly', () => {
    (useLiveControl as any).mockReturnValue({
      healthMetrics: { ...mockHealthMetrics, viewerCount: 1500000 },
      viewerCount: 1500000,
      connected: true,
      failed: false,
      loading: false,
    });

    render(<HealthPanel {...defaultProps} />);

    expect(screen.getByText('1.5M')).toBeInTheDocument();
  });

  it('formats thousands correctly', () => {
    (useLiveControl as any).mockReturnValue({
      healthMetrics: { ...mockHealthMetrics, bitrateKbps: 2500 },
      viewerCount: 1250,
      connected: true,
      failed: false,
      loading: false,
    });

    render(<HealthPanel {...defaultProps} />);

    expect(screen.getByText('1.3K')).toBeInTheDocument(); // Viewer count
    expect(screen.getByText('2.5K kbps')).toBeInTheDocument(); // Bitrate
  });

  it('displays health thresholds information', () => {
    (useLiveControl as any).mockReturnValue({
      healthMetrics: mockHealthMetrics,
      viewerCount: 150,
      connected: true,
      failed: false,
      loading: false,
    });

    render(<HealthPanel {...defaultProps} />);

    expect(screen.getByText('Health Thresholds')).toBeInTheDocument();
    expect(screen.getByText('Excellent:')).toBeInTheDocument();
    expect(screen.getByText('Warning:')).toBeInTheDocument();
    expect(screen.getByText('Critical:')).toBeInTheDocument();
    
    expect(screen.getByText('• Bitrate: ≥2000 kbps')).toBeInTheDocument();
    expect(screen.getByText('• FPS: ≥30')).toBeInTheDocument();
    expect(screen.getByText('• Drop Rate: ≤2%')).toBeInTheDocument();
  });

  it('shows updated timestamp', () => {
    const fixedTime = new Date('2024-01-01T12:00:00Z').getTime();
    const metricsWithTime = {
      ...mockHealthMetrics,
      timestamp: fixedTime,
    };

    (useLiveControl as any).mockReturnValue({
      healthMetrics: metricsWithTime,
      viewerCount: 150,
      connected: true,
      failed: false,
      loading: false,
    });

    render(<HealthPanel {...defaultProps} />);

    // Should show the formatted time (will vary by timezone)
    expect(screen.getByText(/Updated \d{1,2}:\d{2}:\d{2}/)).toBeInTheDocument();
  });

  it('hides details when showDetails is false', () => {
    (useLiveControl as any).mockReturnValue({
      healthMetrics: mockHealthMetrics,
      viewerCount: 150,
      connected: true,
      failed: false,
      loading: false,
    });

    render(<HealthPanel {...defaultProps} showDetails={false} />);

    expect(screen.getByText('Stream Health')).toBeInTheDocument();
    expect(screen.getByText('Excellent')).toBeInTheDocument();
    
    // Should not show detailed metrics
    expect(screen.queryByText('Viewers')).not.toBeInTheDocument();
    expect(screen.queryByText('Bitrate')).not.toBeInTheDocument();
    expect(screen.queryByText('Health Thresholds')).not.toBeInTheDocument();
  });

  it('applies custom className', () => {
    (useLiveControl as any).mockReturnValue({
      healthMetrics: mockHealthMetrics,
      viewerCount: 150,
      connected: true,
      failed: false,
      loading: false,
    });

    const { container } = render(
      <HealthPanel {...defaultProps} className="custom-class" />
    );

    expect(container.firstChild).toHaveClass('custom-class');
  });

  it('handles edge case metrics correctly', () => {
    const edgeMetrics = {
      viewerCount: 0,
      bitrateKbps: 0,
      fps: 0,
      dropRate: 100,
      timestamp: Date.now(),
    };

    (useLiveControl as any).mockReturnValue({
      healthMetrics: edgeMetrics,
      viewerCount: 0,
      connected: true,
      failed: false,
      loading: false,
    });

    render(<HealthPanel {...defaultProps} />);

    expect(screen.getByText('Critical')).toBeInTheDocument();
    expect(screen.getByText('0')).toBeInTheDocument(); // Viewer count
    expect(screen.getByText('0 kbps')).toBeInTheDocument();
    expect(screen.getByText('0 fps')).toBeInTheDocument();
    expect(screen.getByText('100.0%')).toBeInTheDocument();
  });

  it('shows good status for borderline good metrics', () => {
    const goodMetrics = {
      ...mockHealthMetrics,
      bitrateKbps: 1800,
      fps: 28,
      dropRate: 2.5,
    };

    (useLiveControl as any).mockReturnValue({
      healthMetrics: goodMetrics,
      viewerCount: 150,
      connected: true,
      failed: false,
      loading: false,
    });

    render(<HealthPanel {...defaultProps} />);

    expect(screen.getByText('Good')).toBeInTheDocument();
    expect(screen.getByText('Stream quality is stable')).toBeInTheDocument();
  });

  it('handles progress bars correctly', () => {
    (useLiveControl as any).mockReturnValue({
      healthMetrics: mockHealthMetrics,
      viewerCount: 150,
      connected: true,
      failed: false,
      loading: false,
    });

    const { container } = render(<HealthPanel {...defaultProps} />);

    // Should have progress bars for bitrate, fps, and drop rate
    const progressBars = container.querySelectorAll('[role="progressbar"]');
    expect(progressBars).toHaveLength(3);
  });
});