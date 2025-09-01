import { useState, useCallback, useEffect } from 'react';
import { Card } from '../ui/card';
import { Button } from '../ui/button';
import { Label } from '../ui/label';
import { Switch } from '../ui/switch';
import { Badge } from '../ui/badge';
import { 
  Settings, 
  Shield, 
  Clock,
  Droplets,
  AlertTriangle,
  CheckCircle,
  Loader2,
  Info
} from 'lucide-react';
import { clsx } from 'clsx';
import { liveApi } from '../../lib/api';

/**
 * Stream settings interface
 */
interface StreamSettings {
  dvrWindowSec: number;
  watermark: boolean;
  ageRestricted: boolean;
}

/**
 * Props for SettingsPanel component
 */
interface SettingsPanelProps {
  /** Stream ID */
  streamId: string;
  /** Current stream settings */
  currentSettings?: StreamSettings;
  /** Callback when settings are updated */
  onSettingsUpdate?: (settings: StreamSettings) => void;
  /** Additional CSS classes */
  className?: string;
}

/**
 * DVR window options in seconds
 */
const DVR_WINDOW_OPTIONS = [
  { value: 0, label: 'Disabled', description: 'No DVR functionality' },
  { value: 300, label: '5 minutes', description: '5 minute rewind' },
  { value: 900, label: '15 minutes', description: '15 minute rewind' },
  { value: 1800, label: '30 minutes', description: '30 minute rewind' },
  { value: 3600, label: '1 hour', description: '1 hour rewind' },
  { value: 7200, label: '2 hours', description: '2 hour rewind' },
  { value: 14400, label: '4 hours', description: '4 hour rewind' },
];

/**
 * SettingsPanel component
 * Provides interface for stream settings (DVR, watermark, age restriction)
 */
export default function SettingsPanel({
  streamId,
  currentSettings,
  onSettingsUpdate,
  className
}: SettingsPanelProps) {
  const [settings, setSettings] = useState<StreamSettings>(
    currentSettings || {
      dvrWindowSec: 0,
      watermark: false,
      ageRestricted: false
    }
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [hasChanges, setHasChanges] = useState(false);

  /**
   * Update local settings when prop changes
   */
  useEffect(() => {
    if (currentSettings) {
      setSettings(currentSettings);
      setHasChanges(false);
    }
  }, [currentSettings]);

  /**
   * Clear status messages after delay
   */
  const clearMessages = useCallback(() => {
    setTimeout(() => {
      setSuccess(null);
      setError(null);
    }, 3000);
  }, []);

  /**
   * Update settings and track changes
   */
  const updateLocalSettings = useCallback((newSettings: Partial<StreamSettings>) => {
    setSettings(prev => {
      const updated = { ...prev, ...newSettings };
      const hasChanges = JSON.stringify(updated) !== JSON.stringify(currentSettings || {});
      setHasChanges(hasChanges);
      return updated;
    });
  }, [currentSettings]);

  /**
   * Save settings to API
   */
  const saveSettings = useCallback(async () => {
    if (loading || !hasChanges) return;

    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const response = await liveApi.updateSettings(streamId, settings);
      
      if (response.ok) {
        setSuccess('Settings updated successfully');
        setHasChanges(false);
        onSettingsUpdate?.(settings);
      } else {
        throw new Error(response.error || 'Failed to update settings');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update settings';
      setError(errorMessage);
      console.error('Settings update failed:', err);
    } finally {
      setLoading(false);
      clearMessages();
    }
  }, [streamId, settings, loading, hasChanges, onSettingsUpdate, clearMessages]);

  /**
   * Reset settings to current saved values
   */
  const resetSettings = useCallback(() => {
    if (currentSettings) {
      setSettings(currentSettings);
      setHasChanges(false);
    }
  }, [currentSettings]);

  /**
   * Handle DVR window change
   */
  const handleDvrWindowChange = useCallback((dvrWindowSec: number) => {
    updateLocalSettings({ dvrWindowSec });
  }, [updateLocalSettings]);

  /**
   * Handle watermark toggle
   */
  const handleWatermarkToggle = useCallback((watermark: boolean) => {
    updateLocalSettings({ watermark });
  }, [updateLocalSettings]);

  /**
   * Handle age restriction toggle
   */
  const handleAgeRestrictedToggle = useCallback((ageRestricted: boolean) => {
    updateLocalSettings({ ageRestricted });
  }, [updateLocalSettings]);

  /**
   * Get current DVR option
   */
  const currentDvrOption = DVR_WINDOW_OPTIONS.find(
    option => option.value === settings.dvrWindowSec
  ) || DVR_WINDOW_OPTIONS[0];

  return (
    <Card className={clsx('p-6', className)}>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Settings className="h-5 w-5 text-primary" />
              <h3 className="text-lg font-semibold">Stream Settings</h3>
            </div>
            <p className="text-sm text-muted-foreground">
              Configure DVR, watermark, and content restrictions
            </p>
          </div>

          {/* Status Indicator */}
          <div className="flex items-center gap-2">
            {loading && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />}
            {success && <CheckCircle className="h-4 w-4 text-green-600" />}
            {error && <AlertTriangle className="h-4 w-4 text-red-600" />}
            
            {hasChanges && (
              <Badge variant="outline" className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400">
                Unsaved Changes
              </Badge>
            )}
          </div>
        </div>

        {/* DVR Settings */}
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-primary" />
            <Label className="text-sm font-medium">DVR Window</Label>
          </div>
          
          <p className="text-xs text-muted-foreground">
            Allow viewers to rewind and seek within your live stream
          </p>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {DVR_WINDOW_OPTIONS.map((option) => (
              <Button
                key={option.value}
                variant={settings.dvrWindowSec === option.value ? "default" : "outline"}
                size="sm"
                onClick={() => handleDvrWindowChange(option.value)}
                disabled={loading}
                className={clsx(
                  "h-auto py-3 px-3 flex flex-col items-center justify-center text-xs",
                  settings.dvrWindowSec === option.value && "ring-2 ring-primary ring-offset-2"
                )}
              >
                <span className="font-semibold">{option.label}</span>
                <span className="text-[10px] opacity-70 leading-none mt-0.5">
                  {option.value === 0 ? 'Off' : 'Rewind'}
                </span>
              </Button>
            ))}
          </div>

          <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
            <div className="flex items-start gap-2">
              <Info className="h-4 w-4 text-blue-600 mt-0.5" />
              <div className="text-sm text-blue-900 dark:text-blue-100">
                <strong>Current DVR Setting:</strong> {currentDvrOption.description}
                {settings.dvrWindowSec > 0 && (
                  <div className="text-xs mt-1 opacity-80">
                    Viewers can seek back up to {currentDvrOption.label} from the live edge
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Watermark Settings */}
        <div className="space-y-4">
          <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <Droplets className="h-4 w-4 text-primary" />
                <Label htmlFor="watermark-toggle" className="text-sm font-medium">
                  Forensic Watermark
                </Label>
              </div>
              <p className="text-xs text-muted-foreground">
                Add invisible watermark to help identify unauthorized redistribution
              </p>
            </div>
            
            <Switch
              id="watermark-toggle"
              checked={settings.watermark}
              onCheckedChange={handleWatermarkToggle}
              disabled={loading}
            />
          </div>

          {settings.watermark && (
            <div className="p-3 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
              <div className="flex items-start gap-2">
                <CheckCircle className="h-4 w-4 text-green-600 mt-0.5" />
                <div className="text-sm text-green-900 dark:text-green-100">
                  <strong>Watermark Enabled:</strong> Your stream will include forensic watermarking
                  <div className="text-xs mt-1 opacity-80">
                    This helps protect your content from unauthorized use
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Age Restriction Settings */}
        <div className="space-y-4">
          <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <Shield className="h-4 w-4 text-primary" />
                <Label htmlFor="age-restricted-toggle" className="text-sm font-medium">
                  Age Restricted Content
                </Label>
              </div>
              <p className="text-xs text-muted-foreground">
                Mark this stream as containing mature content (18+)
              </p>
            </div>
            
            <Switch
              id="age-restricted-toggle"
              checked={settings.ageRestricted}
              onCheckedChange={handleAgeRestrictedToggle}
              disabled={loading}
            />
          </div>

          {settings.ageRestricted && (
            <div className="p-3 bg-orange-50 dark:bg-orange-900/20 rounded-lg border border-orange-200 dark:border-orange-800">
              <div className="flex items-start gap-2">
                <AlertTriangle className="h-4 w-4 text-orange-600 mt-0.5" />
                <div className="text-sm text-orange-900 dark:text-orange-100">
                  <strong>Age Restriction Active:</strong> Viewers will be prompted to verify their age
                  <div className="text-xs mt-1 opacity-80">
                    This stream will be marked as mature content and may have limited discoverability
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        {hasChanges && (
          <div className="flex justify-end gap-2 pt-4 border-t">
            <Button
              variant="outline"
              onClick={resetSettings}
              disabled={loading}
            >
              Reset
            </Button>
            <Button
              onClick={saveSettings}
              disabled={loading || !hasChanges}
            >
              {loading && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
              Save Settings
            </Button>
          </div>
        )}

        {/* Status Messages */}
        {error && (
          <div className="p-3 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-red-600" />
              <span className="text-sm text-red-900 dark:text-red-100">
                {error}
              </span>
            </div>
          </div>
        )}

        {success && (
          <div className="p-3 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
            <div className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <span className="text-sm text-green-900 dark:text-green-100">
                {success}
              </span>
            </div>
          </div>
        )}

        {/* Help Text */}
        <div className="space-y-2 pt-4 border-t">
          <h4 className="text-sm font-medium">Settings Information</h4>
          <ul className="text-xs text-muted-foreground space-y-1">
            <li>• <strong>DVR Window:</strong> Allows viewers to rewind and seek within your live stream</li>
            <li>• <strong>Forensic Watermark:</strong> Invisible protection against unauthorized redistribution</li>
            <li>• <strong>Age Restriction:</strong> Requires age verification for mature content</li>
            <li>• Settings take effect immediately after saving</li>
          </ul>
        </div>
      </div>
    </Card>
  );
}