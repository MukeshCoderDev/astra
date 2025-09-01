import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import SettingsPanel from '../SettingsPanel';
import { liveApi } from '../../../lib/api';

// Mock the API
vi.mock('../../../lib/api', () => ({
  liveApi: {
    updateSettings: vi.fn(),
  },
}));

const mockUpdateSettings = vi.mocked(liveApi.updateSettings);

describe('SettingsPanel', () => {
  const mockStreamId = 'test-stream-123';
  const mockOnSettingsUpdate = vi.fn();
  const mockCurrentSettings = {
    dvrWindowSec: 1800,
    watermark: true,
    ageRestricted: false
  };

  beforeEach(() => {
    vi.clearAllMocks();
    mockUpdateSettings.mockResolvedValue({ ok: true, data: {} });
  });

  it('renders with stream settings header', () => {
    render(<SettingsPanel streamId={mockStreamId} />);
    
    expect(screen.getByText('Stream Settings')).toBeInTheDocument();
    expect(screen.getByText('Configure DVR, watermark, and content restrictions')).toBeInTheDocument();
  });

  it('renders with default settings when no current settings provided', () => {
    render(<SettingsPanel streamId={mockStreamId} />);
    
    // DVR should be disabled by default
    expect(screen.getByText('Disabled')).toHaveClass('ring-2', 'ring-primary');
    
    // Switches should be off by default
    const watermarkSwitch = screen.getByRole('switch', { name: /Forensic Watermark/ });
    const ageRestrictedSwitch = screen.getByRole('switch', { name: /Age Restricted Content/ });
    
    expect(watermarkSwitch).not.toBeChecked();
    expect(ageRestrictedSwitch).not.toBeChecked();
  });

  it('renders with current settings when provided', () => {
    render(
      <SettingsPanel 
        streamId={mockStreamId} 
        currentSettings={mockCurrentSettings}
        onSettingsUpdate={mockOnSettingsUpdate}
      />
    );
    
    // DVR should show 30 minutes selected
    expect(screen.getByText('30 minutes')).toHaveClass('ring-2', 'ring-primary');
    
    // Watermark should be enabled
    const watermarkSwitch = screen.getByRole('switch', { name: /Forensic Watermark/ });
    expect(watermarkSwitch).toBeChecked();
    
    // Age restriction should be disabled
    const ageRestrictedSwitch = screen.getByRole('switch', { name: /Age Restricted Content/ });
    expect(ageRestrictedSwitch).not.toBeChecked();
  });

  it('shows DVR window options', () => {
    render(<SettingsPanel streamId={mockStreamId} />);
    
    expect(screen.getByText('DVR Window')).toBeInTheDocument();
    expect(screen.getByText('Allow viewers to rewind and seek within your live stream')).toBeInTheDocument();
    
    // Check all DVR options are present
    expect(screen.getByText('Disabled')).toBeInTheDocument();
    expect(screen.getByText('5 minutes')).toBeInTheDocument();
    expect(screen.getByText('15 minutes')).toBeInTheDocument();
    expect(screen.getByText('30 minutes')).toBeInTheDocument();
    expect(screen.getByText('1 hour')).toBeInTheDocument();
    expect(screen.getByText('2 hours')).toBeInTheDocument();
    expect(screen.getByText('4 hours')).toBeInTheDocument();
  });

  it('shows watermark settings', () => {
    render(<SettingsPanel streamId={mockStreamId} />);
    
    expect(screen.getByText('Forensic Watermark')).toBeInTheDocument();
    expect(screen.getByText('Add invisible watermark to help identify unauthorized redistribution')).toBeInTheDocument();
  });

  it('shows age restriction settings', () => {
    render(<SettingsPanel streamId={mockStreamId} />);
    
    expect(screen.getByText('Age Restricted Content')).toBeInTheDocument();
    expect(screen.getByText('Mark this stream as containing mature content (18+)')).toBeInTheDocument();
  });

  it('shows settings information help text', () => {
    render(<SettingsPanel streamId={mockStreamId} />);
    
    expect(screen.getByText('Settings Information')).toBeInTheDocument();
    expect(screen.getByText(/DVR Window.*Allows viewers to rewind and seek/)).toBeInTheDocument();
    expect(screen.getByText(/Forensic Watermark.*Invisible protection against unauthorized redistribution/)).toBeInTheDocument();
    expect(screen.getByText(/Age Restriction.*Requires age verification for mature content/)).toBeInTheDocument();
    expect(screen.getByText(/Settings take effect immediately after saving/)).toBeInTheDocument();
  });

  it('tracks changes and shows unsaved changes badge', async () => {
    render(<SettingsPanel streamId={mockStreamId} currentSettings={mockCurrentSettings} />);
    
    // Initially no unsaved changes
    expect(screen.queryByText('Unsaved Changes')).not.toBeInTheDocument();
    
    // Change DVR setting
    const disabledButton = screen.getByText('Disabled');
    fireEvent.click(disabledButton);
    
    // Should show unsaved changes
    expect(screen.getByText('Unsaved Changes')).toBeInTheDocument();
    expect(screen.getByText('Save Settings')).toBeInTheDocument();
    expect(screen.getByText('Reset')).toBeInTheDocument();
  });

  it('handles DVR window selection', async () => {
    render(<SettingsPanel streamId={mockStreamId} />);
    
    const oneHourButton = screen.getByText('1 hour');
    fireEvent.click(oneHourButton);
    
    expect(oneHourButton).toHaveClass('ring-2', 'ring-primary');
    expect(screen.getByText('Unsaved Changes')).toBeInTheDocument();
  });

  it('handles watermark toggle', async () => {
    render(<SettingsPanel streamId={mockStreamId} />);
    
    const watermarkSwitch = screen.getByRole('switch', { name: /Forensic Watermark/ });
    fireEvent.click(watermarkSwitch);
    
    expect(watermarkSwitch).toBeChecked();
    expect(screen.getByText('Watermark Enabled: Your stream will include forensic watermarking')).toBeInTheDocument();
    expect(screen.getByText('Unsaved Changes')).toBeInTheDocument();
  });

  it('handles age restriction toggle', async () => {
    render(<SettingsPanel streamId={mockStreamId} />);
    
    const ageRestrictedSwitch = screen.getByRole('switch', { name: /Age Restricted Content/ });
    fireEvent.click(ageRestrictedSwitch);
    
    expect(ageRestrictedSwitch).toBeChecked();
    expect(screen.getByText('Age Restriction Active: Viewers will be prompted to verify their age')).toBeInTheDocument();
    expect(screen.getByText('Unsaved Changes')).toBeInTheDocument();
  });

  it('saves settings when save button is clicked', async () => {
    render(<SettingsPanel streamId={mockStreamId} onSettingsUpdate={mockOnSettingsUpdate} />);
    
    // Make a change
    const watermarkSwitch = screen.getByRole('switch', { name: /Forensic Watermark/ });
    fireEvent.click(watermarkSwitch);
    
    // Save settings
    const saveButton = screen.getByText('Save Settings');
    fireEvent.click(saveButton);
    
    await waitFor(() => {
      expect(mockUpdateSettings).toHaveBeenCalledWith(mockStreamId, {
        dvrWindowSec: 0,
        watermark: true,
        ageRestricted: false
      });
    });
    
    await waitFor(() => {
      expect(mockOnSettingsUpdate).toHaveBeenCalledWith({
        dvrWindowSec: 0,
        watermark: true,
        ageRestricted: false
      });
      expect(screen.getByText('Settings updated successfully')).toBeInTheDocument();
    });
  });

  it('resets settings when reset button is clicked', async () => {
    render(<SettingsPanel streamId={mockStreamId} currentSettings={mockCurrentSettings} />);
    
    // Make a change
    const disabledButton = screen.getByText('Disabled');
    fireEvent.click(disabledButton);
    
    expect(screen.getByText('Unsaved Changes')).toBeInTheDocument();
    
    // Reset settings
    const resetButton = screen.getByText('Reset');
    fireEvent.click(resetButton);
    
    // Should revert to original settings
    expect(screen.getByText('30 minutes')).toHaveClass('ring-2', 'ring-primary');
    expect(screen.queryByText('Unsaved Changes')).not.toBeInTheDocument();
  });

  it('shows error message when API call fails', async () => {
    const errorMessage = 'Settings update failed';
    mockUpdateSettings.mockResolvedValue({ 
      ok: false, 
      error: errorMessage,
      data: null 
    });

    render(<SettingsPanel streamId={mockStreamId} />);
    
    // Make a change and save
    const watermarkSwitch = screen.getByRole('switch', { name: /Forensic Watermark/ });
    fireEvent.click(watermarkSwitch);
    
    const saveButton = screen.getByText('Save Settings');
    fireEvent.click(saveButton);
    
    await waitFor(() => {
      expect(screen.getByText(errorMessage)).toBeInTheDocument();
    });
  });

  it('handles network errors gracefully', async () => {
    const networkError = new Error('Network error');
    mockUpdateSettings.mockRejectedValue(networkError);

    render(<SettingsPanel streamId={mockStreamId} />);
    
    // Make a change and save
    const watermarkSwitch = screen.getByRole('switch', { name: /Forensic Watermark/ });
    fireEvent.click(watermarkSwitch);
    
    const saveButton = screen.getByText('Save Settings');
    fireEvent.click(saveButton);
    
    await waitFor(() => {
      expect(screen.getByText('Network error')).toBeInTheDocument();
    });
  });

  it('disables controls during loading', async () => {
    // Make API call take longer
    let resolvePromise: (value: any) => void;
    const promise = new Promise(resolve => {
      resolvePromise = resolve;
    });
    mockUpdateSettings.mockReturnValue(promise);

    render(<SettingsPanel streamId={mockStreamId} />);
    
    // Make a change and save
    const watermarkSwitch = screen.getByRole('switch', { name: /Forensic Watermark/ });
    fireEvent.click(watermarkSwitch);
    
    const saveButton = screen.getByText('Save Settings');
    fireEvent.click(saveButton);
    
    // Controls should be disabled during loading
    expect(watermarkSwitch).toBeDisabled();
    expect(saveButton).toBeDisabled();
    
    // Resolve the promise
    resolvePromise!({ ok: true, data: {} });
    
    await waitFor(() => {
      expect(mockUpdateSettings).toHaveBeenCalled();
    });
  });

  it('shows current DVR setting information', () => {
    render(<SettingsPanel streamId={mockStreamId} currentSettings={mockCurrentSettings} />);
    
    expect(screen.getByText('Current DVR Setting: 30 minute rewind')).toBeInTheDocument();
    expect(screen.getByText('Viewers can seek back up to 30 minutes from the live edge')).toBeInTheDocument();
  });

  it('shows disabled DVR information when DVR is off', () => {
    render(<SettingsPanel streamId={mockStreamId} />);
    
    expect(screen.getByText('Current DVR Setting: No DVR functionality')).toBeInTheDocument();
  });

  it('prevents saving when no changes are made', () => {
    render(<SettingsPanel streamId={mockStreamId} currentSettings={mockCurrentSettings} />);
    
    // No save/reset buttons should be visible initially
    expect(screen.queryByText('Save Settings')).not.toBeInTheDocument();
    expect(screen.queryByText('Reset')).not.toBeInTheDocument();
  });

  it('updates settings when currentSettings prop changes', () => {
    const { rerender } = render(
      <SettingsPanel streamId={mockStreamId} />
    );
    
    // Initially disabled
    expect(screen.getByText('Disabled')).toHaveClass('ring-2', 'ring-primary');
    
    // Update with new settings
    rerender(
      <SettingsPanel 
        streamId={mockStreamId} 
        currentSettings={mockCurrentSettings}
      />
    );
    
    // Should reflect new settings
    expect(screen.getByText('30 minutes')).toHaveClass('ring-2', 'ring-primary');
    const watermarkSwitch = screen.getByRole('switch', { name: /Forensic Watermark/ });
    expect(watermarkSwitch).toBeChecked();
  });

  it('prevents multiple simultaneous API calls', async () => {
    // Make API call take longer
    let resolvePromise: (value: any) => void;
    const promise = new Promise(resolve => {
      resolvePromise = resolve;
    });
    mockUpdateSettings.mockReturnValue(promise);

    render(<SettingsPanel streamId={mockStreamId} />);
    
    // Make a change
    const watermarkSwitch = screen.getByRole('switch', { name: /Forensic Watermark/ });
    fireEvent.click(watermarkSwitch);
    
    const saveButton = screen.getByText('Save Settings');
    
    // Click multiple times rapidly
    fireEvent.click(saveButton);
    fireEvent.click(saveButton);
    fireEvent.click(saveButton);

    // Should only be called once due to loading state
    expect(mockUpdateSettings).toHaveBeenCalledTimes(1);
    
    // Resolve the promise
    resolvePromise!({ ok: true, data: {} });
    
    await waitFor(() => {
      expect(mockUpdateSettings).toHaveBeenCalledTimes(1);
    });
  });
});