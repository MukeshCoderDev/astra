import { useMemo } from 'react';
import { Card } from '../ui/card';
import { Badge } from '../ui/badge';
import { Progress } from '../ui/progress';
import { 
  Activity, 
  Users, 
  Zap, 
  Monitor,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Wifi,
  WifiOff,
  Loader2
} from 'lucide-react';
import { clsx } from 'clsx';
import { useLiveControl } from '../../hooks/useLiveControl';
import type { HealthMetrics } from '../../types/live';

/**
 * Props for HealthPanel component
 */
interface HealthPanelProps {
  /** Stream ID */
  streamId: string;
  /** Additional CSS classes */
  className?: string;
  /** Show detailed metrics */
  showDetails?: boolean;
}

/**
 * Health status levels
 */
type HealthStatus = 'excellent' | 'good' | 'warning' | 'critical' | 'offline';

/**
 * Health panel component
 * Displays real-time stream health metrics with WebSocket integration
 */
export default function HealthPanel({
  streamId,
  className,
  showDetails = true
}: HealthPanelProps) {
  const { 
    healthMetrics, 
    viewerCount, 
    connected, 
    failed, 
    loading 
  } = useLiveControl(streamId);

  /**
   * Calculate overall health status
   */
  const healthStatus = useMemo((): HealthStatus => {
    if (!connected && failed) return 'offline';
    if (!healthMetrics) return 'offline';

    const { bitrateKbps, fps, dropRate } = healthMetrics;

    // Critical thresholds
    if (dropRate > 10 || bitrateKbps < 500 || fps < 15) {
      return 'critical';
    }

    // Warning thresholds
    if (dropRate > 5 || bitrateKbps < 1000 || fps < 24) {
      return 'warning';
    }

    // Good thresholds
    if (dropRate > 2 || bitrateKbps < 2000 || fps < 30) {
      return 'good';
    }

    return 'excellent';
  }, [connected, failed, healthMetrics]);

  /**
   * Get status configuration
   */
  const getStatusConfig = (status: HealthStatus) => {
    switch (status) {
      case 'excellent':
        return {
          icon: CheckCircle,
          color: 'text-green-600',
          bgColor: 'bg-green-100 dark:bg-green-900/20',
          label: 'Excellent',
          description: 'Stream quality is optimal'
        };
      case 'good':
        return {
          icon: CheckCircle,
          color: 'text-blue-600',
          bgColor: 'bg-blue-100 dark:bg-blue-900/20',
          label: 'Good',
          description: 'Stream quality is stable'
        };
      case 'warning':
        return {
          icon: AlertTriangle,
          color: 'text-yellow-600',
          bgColor: 'bg-yellow-100 dark:bg-yellow-900/20',
          label: 'Warning',
          description: 'Stream quality needs attention'
        };
      case 'critical':
        return {
          icon: XCircle,
          color: 'text-red-600',
          bgColor: 'bg-red-100 dark:bg-red-900/20',
          label: 'Critical',
          description: 'Stream quality is poor'
        };
      case 'offline':
        return {
          icon: WifiOff,
          color: 'text-gray-600',
          bgColor: 'bg-gray-100 dark:bg-gray-900/20',
          label: 'Offline',
          description: 'No stream data available'
        };
    }
  };

  const statusConfig = getStatusConfig(healthStatus);
  const StatusIcon = statusConfig.icon;

  /**
   * Format numbers for display
   */
  const formatNumber = (num: number) => {
    if (num >= 1000000) {
      return `${(num / 1000000).toFixed(1)}M`;
    }
    if (num >= 1000) {
      return `${(num / 1000).toFixed(1)}K`;
    }
    return num.toLocaleString();
  };

  /**
   * Get metric status color
   */
  const getMetricStatus = (value: number, thresholds: { good: number; warning: number }) => {
    if (value >= thresholds.good) return 'text-green-600';
    if (value >= thresholds.warning) return 'text-yellow-600';
    return 'text-red-600';
  };

  /**
   * Render metric card
   */
  const renderMetricCard = (
    icon: React.ElementType,
    label: string,
    value: string | number,
    unit: string,
    status?: string,
    progress?: number
  ) => (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-muted/50 rounded-full flex items-center justify-center">
            {React.createElement(icon, { className: "h-4 w-4 text-muted-foreground" })}
          </div>
          <span className="text-sm font-medium">{label}</span>
        </div>
        {status && (
          <Badge variant="outline" className={clsx('text-xs', status)}>
            {typeof value === 'number' ? formatNumber(value) : value}{unit}
          </Badge>
        )}
      </div>
      
      {!status && (
        <div className="text-right">
          <span className="text-lg font-semibold">
            {typeof value === 'number' ? formatNumber(value) : value}
          </span>
          <span className="text-sm text-muted-foreground ml-1">{unit}</span>
        </div>
      )}

      {progress !== undefined && (
        <Progress value={progress} className="h-2" />
      )}
    </div>
  );

  return (
    <Card className={clsx('p-6', className)}>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Activity className="h-5 w-5 text-primary" />
              <h3 className="text-lg font-semibold">Stream Health</h3>
            </div>
            <p className="text-sm text-muted-foreground">
              Real-time monitoring of your stream quality
            </p>
          </div>

          {/* Connection Status */}
          <div className="flex items-center gap-2">
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
            ) : connected ? (
              <Wifi className="h-4 w-4 text-green-600" />
            ) : (
              <WifiOff className="h-4 w-4 text-red-600" />
            )}
            <span className="text-xs text-muted-foreground">
              {loading ? 'Connecting...' : connected ? 'Connected' : 'Disconnected'}
            </span>
          </div>
        </div>

        {/* Overall Health Status */}
        <div className={clsx(
          'rounded-lg p-4 border',
          statusConfig.bgColor
        )}>
          <div className="flex items-center gap-3">
            <StatusIcon className={clsx('h-6 w-6', statusConfig.color)} />
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <span className={clsx('font-semibold', statusConfig.color)}>
                  {statusConfig.label}
                </span>
                {healthMetrics && (
                  <span className="text-xs text-muted-foreground">
                    Updated {new Date(healthMetrics.timestamp).toLocaleTimeString()}
                  </span>
                )}
              </div>
              <p className="text-sm text-muted-foreground mt-1">
                {statusConfig.description}
              </p>
            </div>
          </div>
        </div>

        {/* Metrics Grid */}
        {showDetails && healthMetrics && (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Viewer Count */}
            {renderMetricCard(
              Users,
              'Viewers',
              viewerCount,
              '',
              undefined,
              undefined
            )}

            {/* Bitrate */}
            {renderMetricCard(
              Zap,
              'Bitrate',
              healthMetrics.bitrateKbps,
              ' kbps',
              getMetricStatus(healthMetrics.bitrateKbps, { good: 2000, warning: 1000 }),
              Math.min((healthMetrics.bitrateKbps / 6000) * 100, 100)
            )}

            {/* Frame Rate */}
            {renderMetricCard(
              Monitor,
              'Frame Rate',
              healthMetrics.fps,
              ' fps',
              getMetricStatus(healthMetrics.fps, { good: 30, warning: 24 }),
              Math.min((healthMetrics.fps / 60) * 100, 100)
            )}

            {/* Drop Rate */}
            {renderMetricCard(
              AlertTriangle,
              'Drop Rate',
              healthMetrics.dropRate.toFixed(1),
              '%',
              getMetricStatus(100 - healthMetrics.dropRate, { good: 95, warning: 90 }),
              Math.max(100 - healthMetrics.dropRate, 0)
            )}
          </div>
        )}

        {/* No Data State */}
        {!loading && !healthMetrics && (
          <div className="text-center py-8 text-muted-foreground">
            <div className="w-12 h-12 bg-muted/50 rounded-full flex items-center justify-center mx-auto mb-3">
              <Activity className="h-6 w-6" />
            </div>
            <p className="text-sm">No health data available</p>
            <p className="text-xs">
              {failed ? 'Connection failed - using polling fallback' : 'Start streaming to see metrics'}
            </p>
          </div>
        )}

        {/* Loading State */}
        {loading && !healthMetrics && (
          <div className="text-center py-8">
            <Loader2 className="h-8 w-8 animate-spin mx-auto mb-3 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">Loading health metrics...</p>
          </div>
        )}

        {/* Health Thresholds Info */}
        {showDetails && healthMetrics && (
          <div className="space-y-3 pt-4 border-t">
            <h4 className="text-sm font-medium">Health Thresholds</h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs text-muted-foreground">
              <div>
                <strong className="text-green-600">Excellent:</strong>
                <ul className="mt-1 space-y-0.5">
                  <li>• Bitrate: ≥2000 kbps</li>
                  <li>• FPS: ≥30</li>
                  <li>• Drop Rate: ≤2%</li>
                </ul>
              </div>
              <div>
                <strong className="text-yellow-600">Warning:</strong>
                <ul className="mt-1 space-y-0.5">
                  <li>• Bitrate: 1000-2000 kbps</li>
                  <li>• FPS: 24-30</li>
                  <li>• Drop Rate: 2-5%</li>
                </ul>
              </div>
              <div>
                <strong className="text-red-600">Critical:</strong>
                <ul className="mt-1 space-y-0.5">
                  <li>• Bitrate: &lt;1000 kbps</li>
                  <li>• FPS: &lt;24</li>
                  <li>• Drop Rate: &gt;5%</li>
                </ul>
              </div>
            </div>
          </div>
        )}
      </div>
    </Card>
  );
}