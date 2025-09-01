import { useState, useCallback, useEffect } from 'react';
import { Card } from '../ui/card';
import { Button } from '../ui/button';
import { Label } from '../ui/label';
import { Switch } from '../ui/switch';
import { Badge } from '../ui/badge';
import { 
  Clock, 
  Settings, 
  Loader2,
  CheckCircle,
  AlertCircle
} from 'lucide-react';
import { clsx } from 'clsx';
import { liveApi } from '../../lib/api';
import type { SlowModeConfig } from '../../types/live';

/**
 * Props for SlowModeControl component
 */
interface SlowModeControlProps {
  /** Stream ID */
  streamId: string;
  /** Current slow mode configuration */
  currentConfig?: SlowModeConfig;
  /** Callback when slow mode is updated */
  onUpdate?: (config: SlowModeConfig) => void;
  /** Additional CSS classes */
  className?: string;
}

/**
 * Predefined slow mode intervals in seconds
 */
const SLOW_MODE_INTERVALS = [
  { value: 0, label: 'Off', description: 'No restrictions' },
  { value: 5, label: '5s', description: '5 second cooldown' },
  { value: 10, label: '10s', description: '10 second cooldown' },
  { value: 30, label: '30s', description: '30 second cooldown' },
  { value: 60, label: '1m', description: '1 minute cooldown' },
  { value: 300, label: '5m', description: '5 minute cooldown' },
  { value: 600, label: '10m', description: '10 minute cooldown' },
];

/**
 * SlowModeControl component
 * Provides interface for configuring chat slow mode with real-time updates
 */
export default function SlowModeControl({
  streamId,
  currentConfig,
  onUpdate,
  className
}: SlowModeControlProps) {
  const [config, setConfig] = useState<SlowModeConfig>(
    currentConfig || { seconds: 0, enabled: false }
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  /**
   * Update local config when prop changes
   */
  useEffect(() => {
    if (currentConfig) {
      setConfig(currentConfig);
    }
  }, [currentConfig]);

  /**
   * Clear status messages after delay
   */
  useEffect(() => {
    if (success || error) {
      const timer = setTimeout(() => {
        setSuccess(false);
        setError(null);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [success, error]);

  /**
   * Update slow mode configuration
   */
  const updateSlowMode = useCallback(async (newConfig: SlowModeConfig) => {
    if (loading) return;

    setLoading(true);
    setError(null);
    setSuccess(false);

    try {
      const response = await liveApi.setSlowMode(streamId, newConfig.seconds);
      
      if (response.ok) {
        setConfig(newConfig);
        setSuccess(true);
        onUpdate?.(newConfig);
      } else {
        throw new Error(response.error || 'Failed to update slow mode');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update slow mode';
      setError(errorMessage);
      console.error('Slow mode update failed:', err);
    } finally {
      setLoading(false);
    }
  }, [streamId, loading, onUpdate]);

  /**
   * Handle slow mode toggle
   */
  const handleToggle = useCallback((enabled: boolean) => {
    const newConfig: SlowModeConfig = {
      ...config,
      enabled,
      seconds: enabled ? (config.seconds || 10) : 0
    };
    updateSlowMode(newConfig);
  }, [config, updateSlowMode]);

  /**
   * Handle interval selection
   */
  const handleIntervalSelect = useCallback((seconds: number) => {
    const newConfig: SlowModeConfig = {
      seconds,
      enabled: seconds > 0
    };
    updateSlowMode(newConfig);
  }, [updateSlowMode]);

  /**
   * Get current interval info
   */
  const currentInterval = SLOW_MODE_INTERVALS.find(
    interval => interval.value === config.seconds
  ) || SLOW_MODE_INTERVALS[0];

  return (
    <Card className={clsx('p-6', className)}>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-primary" />
              <h3 className="text-lg font-semibold">Slow Mode</h3>
            </div>
            <p className="text-sm text-muted-foreground">
              Control how frequently viewers can send chat messages
            </p>
          </div>

          {/* Status Indicator */}
          <div className="flex items-center gap-2">
            {loading && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />}
            {success && <CheckCircle className="h-4 w-4 text-green-600" />}
            {error && <AlertCircle className="h-4 w-4 text-red-600" />}
            
            <Badge 
              variant={config.enabled ? "default" : "secondary"}
              className={clsx(
                config.enabled ? "bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400" : ""
              )}
            >
              {config.enabled ? `${currentInterval.label} Active` : 'Disabled'}
            </Badge>
          </div>
        </div>

        {/* Toggle Switch */}
        <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
          <div className="space-y-1">
            <Label htmlFor="slow-mode-toggle" className="text-sm font-medium">
              Enable Slow Mode
            </Label>
            <p className="text-xs text-muted-foreground">
              {config.enabled 
                ? `Users must wait ${currentInterval.description} between messages`
                : 'Users can send messages without restrictions'
              }
            </p>
          </div>
          
          <Switch
            id="slow-mode-toggle"
            checked={config.enabled}
            onCheckedChange={handleToggle}
            disabled={loading}
          />
        </div>

        {/* Interval Selection */}
        {config.enabled && (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label className="text-sm font-medium">Cooldown Period</Label>
              <p className="text-xs text-muted-foreground">
                Choose how long users must wait between messages
              </p>
            </div>

            <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-7 gap-2">
              {SLOW_MODE_INTERVALS.slice(1).map((interval) => (
                <Button
                  key={interval.value}
                  variant={config.seconds === interval.value ? "default" : "outline"}
                  size="sm"
                  onClick={() => handleIntervalSelect(interval.value)}
                  disabled={loading}
                  className={clsx(
                    "h-12 flex flex-col items-center justify-center text-xs",
                    config.seconds === interval.value && "ring-2 ring-primary ring-offset-2"
                  )}
                >
                  <span className="font-semibold">{interval.label}</span>
                  <span className="text-[10px] opacity-70 leading-none mt-0.5">
                    {interval.value < 60 ? 'sec' : 'min'}
                  </span>
                </Button>
              ))}
            </div>

            {/* Current Selection Info */}
            <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
              <div className="flex items-center gap-2">
                <Settings className="h-4 w-4 text-blue-600" />
                <span className="text-sm font-medium text-blue-900 dark:text-blue-100">
                  Current Setting: {currentInterval.description}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Status Messages */}
        {error && (
          <div className="p-3 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800">
            <div className="flex items-center gap-2">
              <AlertCircle className="h-4 w-4 text-red-600" />
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
                Slow mode updated successfully
              </span>
            </div>
          </div>
        )}

        {/* Help Text */}
        <div className="space-y-2 pt-4 border-t">
          <h4 className="text-sm font-medium">How Slow Mode Works</h4>
          <ul className="text-xs text-muted-foreground space-y-1">
            <li>• Users must wait the specified time between sending messages</li>
            <li>• Moderators and the creator are not affected by slow mode</li>
            <li>• Changes take effect immediately for all viewers</li>
            <li>• Users will see a countdown timer when in cooldown</li>
          </ul>
        </div>
      </div>
    </Card>
  );
}