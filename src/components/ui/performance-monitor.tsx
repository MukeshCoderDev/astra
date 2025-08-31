import React, { useState, useEffect } from 'react';
import { clsx } from 'clsx';
import { useWebVitals, useMemoryMonitor, useNetworkStatus } from '../../hooks/usePerformance';

interface PerformanceMonitorProps {
  enabled?: boolean;
  position?: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';
  className?: string;
}

/**
 * Performance monitoring overlay component (development only)
 */
export function PerformanceMonitor({
  enabled = process.env.NODE_ENV === 'development',
  position = 'bottom-right',
  className,
}: PerformanceMonitorProps) {
  const [isVisible, setIsVisible] = useState(false);
  const webVitals = useWebVitals();
  const memoryInfo = useMemoryMonitor();
  const networkStatus = useNetworkStatus();

  if (!enabled) return null;

  const positionClasses = {
    'top-left': 'top-4 left-4',
    'top-right': 'top-4 right-4',
    'bottom-left': 'bottom-4 left-4',
    'bottom-right': 'bottom-4 right-4',
  };

  const getMetricColor = (metric: string, value: number) => {
    switch (metric) {
      case 'CLS':
        return value <= 0.1 ? 'text-green-500' : value <= 0.25 ? 'text-yellow-500' : 'text-red-500';
      case 'LCP':
        return value <= 2500 ? 'text-green-500' : value <= 4000 ? 'text-yellow-500' : 'text-red-500';
      case 'FID':
        return value <= 100 ? 'text-green-500' : value <= 300 ? 'text-yellow-500' : 'text-red-500';
      default:
        return 'text-foreground';
    }
  };

  return (
    <div className={clsx('fixed z-50', positionClasses[position], className)}>
      {/* Toggle button */}
      <button
        onClick={() => setIsVisible(!isVisible)}
        className="bg-background border rounded-full w-12 h-12 flex items-center justify-center shadow-lg hover:bg-accent"
        title="Performance Monitor"
      >
        📊
      </button>

      {/* Performance panel */}
      {isVisible && (
        <div className="absolute bottom-14 right-0 bg-background border rounded-lg shadow-lg p-4 min-w-[300px] text-sm">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold">Performance Monitor</h3>
            <button
              onClick={() => setIsVisible(false)}
              className="text-muted-foreground hover:text-foreground"
            >
              ×
            </button>
          </div>

          {/* Web Vitals */}
          <div className="space-y-2 mb-4">
            <h4 className="font-medium text-xs uppercase tracking-wide text-muted-foreground">
              Web Vitals
            </h4>
            {Object.entries(webVitals).map(([metric, value]) => (
              <div key={metric} className="flex justify-between">
                <span>{metric}:</span>
                <span className={getMetricColor(metric, value)}>
                  {metric === 'CLS' ? value.toFixed(3) : `${Math.round(value)}ms`}
                </span>
              </div>
            ))}
          </div>

          {/* Memory Usage */}
          {memoryInfo.used && (
            <div className="space-y-2 mb-4">
              <h4 className="font-medium text-xs uppercase tracking-wide text-muted-foreground">
                Memory Usage
              </h4>
              <div className="flex justify-between">
                <span>Used:</span>
                <span>{memoryInfo.used} MB</span>
              </div>
              <div className="flex justify-between">
                <span>Total:</span>
                <span>{memoryInfo.total} MB</span>
              </div>
              <div className="flex justify-between">
                <span>Limit:</span>
                <span>{memoryInfo.limit} MB</span>
              </div>
            </div>
          )}

          {/* Network Status */}
          <div className="space-y-2">
            <h4 className="font-medium text-xs uppercase tracking-wide text-muted-foreground">
              Network
            </h4>
            <div className="flex justify-between">
              <span>Status:</span>
              <span className={networkStatus.online ? 'text-green-500' : 'text-red-500'}>
                {networkStatus.online ? 'Online' : 'Offline'}
              </span>
            </div>
            {networkStatus.effectiveType && (
              <div className="flex justify-between">
                <span>Type:</span>
                <span>{networkStatus.effectiveType}</span>
              </div>
            )}
            {networkStatus.downlink && (
              <div className="flex justify-between">
                <span>Speed:</span>
                <span>{networkStatus.downlink} Mbps</span>
              </div>
            )}
            {networkStatus.rtt && (
              <div className="flex justify-between">
                <span>RTT:</span>
                <span>{networkStatus.rtt}ms</span>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

interface RenderCounterProps {
  name: string;
  className?: string;
}

/**
 * Component render counter for debugging
 */
export function RenderCounter({ name, className }: RenderCounterProps) {
  const [renderCount, setRenderCount] = useState(0);

  useEffect(() => {
    setRenderCount(prev => prev + 1);
  });

  if (process.env.NODE_ENV !== 'development') return null;

  return (
    <div className={clsx('text-xs text-muted-foreground', className)}>
      {name}: {renderCount} renders
    </div>
  );
}

interface BundleSizeDisplayProps {
  className?: string;
}

/**
 * Bundle size display component
 */
export function BundleSizeDisplay({ className }: BundleSizeDisplayProps) {
  const [bundleInfo, setBundleInfo] = useState<{
    scripts: number;
    styles: number;
    total: string;
  } | null>(null);

  useEffect(() => {
    const scripts = Array.from(document.querySelectorAll('script[src]'));
    const styles = Array.from(document.querySelectorAll('link[rel="stylesheet"]'));
    
    // This is a simplified calculation - in production you'd use webpack-bundle-analyzer
    const estimatedSize = scripts.length * 100 + styles.length * 20; // KB
    
    setBundleInfo({
      scripts: scripts.length,
      styles: styles.length,
      total: `~${estimatedSize}KB`,
    });
  }, []);

  if (process.env.NODE_ENV !== 'development' || !bundleInfo) return null;

  return (
    <div className={clsx('text-xs space-y-1', className)}>
      <div className="font-medium">Bundle Info:</div>
      <div>Scripts: {bundleInfo.scripts}</div>
      <div>Styles: {bundleInfo.styles}</div>
      <div>Est. Size: {bundleInfo.total}</div>
    </div>
  );
}

interface PerformanceProfilerProps {
  children: React.ReactNode;
  name: string;
  onRender?: (id: string, phase: string, actualDuration: number) => void;
}

/**
 * Performance profiler wrapper component
 */
export function PerformanceProfiler({ 
  children, 
  name, 
  onRender 
}: PerformanceProfilerProps) {
  const handleRender = (
    id: string,
    phase: 'mount' | 'update',
    actualDuration: number,
    baseDuration: number,
    startTime: number,
    commitTime: number
  ) => {
    if (process.env.NODE_ENV === 'development') {
      console.log(`${name} ${phase}:`, {
        actualDuration: `${actualDuration.toFixed(2)}ms`,
        baseDuration: `${baseDuration.toFixed(2)}ms`,
        startTime: `${startTime.toFixed(2)}ms`,
        commitTime: `${commitTime.toFixed(2)}ms`,
      });
    }
    
    onRender?.(id, phase, actualDuration);
  };

  return (
    <React.Profiler id={name} onRender={handleRender}>
      {children}
    </React.Profiler>
  );
}