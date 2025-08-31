import React, { useState, useEffect } from 'react';
import { reportPerformanceMetric, getMonitoringHealth } from '../../lib/monitoring';
import { Card, CardContent, CardHeader, CardTitle, Button } from '../ui';
import { Activity, Zap, Clock, AlertTriangle, CheckCircle } from 'lucide-react';

interface PerformanceData {
  fps: number;
  memoryUsage: number;
  loadTime: number;
  renderTime: number;
  bundleSize: number;
  cacheHitRate: number;
}

interface PerformanceMonitorProps {
  enabled?: boolean;
  position?: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';
  showDetails?: boolean;
  onPerformanceIssue?: (issue: string, severity: 'low' | 'medium' | 'high') => void;
}

export function PerformanceMonitor({
  enabled = import.meta.env.DEV,
  position = 'bottom-right',
  showDetails = false,
  onPerformanceIssue,
}: PerformanceMonitorProps) {
  const [performanceData, setPerformanceData] = useState<PerformanceData>({
    fps: 0,
    memoryUsage: 0,
    loadTime: 0,
    renderTime: 0,
    bundleSize: 0,
    cacheHitRate: 0,
  });
  
  const [isExpanded, setIsExpanded] = useState(showDetails);
  const [healthStatus, setHealthStatus] = useState<any>(null);

  useEffect(() => {
    if (!enabled) return;

    let frameCount = 0;
    let lastTime = performance.now();
    let animationId: number;

    // FPS monitoring
    function measureFPS() {
      frameCount++;
      const currentTime = performance.now();
      
      if (currentTime >= lastTime + 1000) {
        const fps = Math.round((frameCount * 1000) / (currentTime - lastTime));
        setPerformanceData(prev => ({ ...prev, fps }));
        
        // Report low FPS
        if (fps < 30) {
          reportPerformanceMetric('low_fps', fps, { threshold: '30' });
          onPerformanceIssue?.('Low FPS detected', fps < 15 ? 'high' : 'medium');
        }
        
        frameCount = 0;
        lastTime = currentTime;
      }
      
      animationId = requestAnimationFrame(measureFPS);
    }

    measureFPS();

    // Memory usage monitoring
    const memoryInterval = setInterval(() => {
      if ('memory' in performance) {
        const memory = (performance as any).memory;
        const memoryUsage = Math.round(memory.usedJSHeapSize / 1024 / 1024);
        setPerformanceData(prev => ({ ...prev, memoryUsage }));
        
        // Report high memory usage
        if (memoryUsage > 100) {
          reportPerformanceMetric('high_memory_usage', memoryUsage, { threshold: '100MB' });
          onPerformanceIssue?.('High memory usage', memoryUsage > 200 ? 'high' : 'medium');
        }
      }
    }, 5000);

    // Performance timing
    const updatePerformanceTiming = () => {
      const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
      if (navigation) {
        const loadTime = navigation.loadEventEnd - navigation.loadEventStart;
        const renderTime = navigation.domContentLoadedEventEnd - navigation.domContentLoadedEventStart;
        
        setPerformanceData(prev => ({
          ...prev,
          loadTime: Math.round(loadTime),
          renderTime: Math.round(renderTime),
        }));
      }
    };

    // Bundle size estimation
    const estimateBundleSize = () => {
      const resources = performance.getEntriesByType('resource') as PerformanceResourceTiming[];
      const jsResources = resources.filter(r => r.name.includes('.js'));
      const totalSize = jsResources.reduce((sum, r) => sum + (r.transferSize || 0), 0);
      const bundleSize = Math.round(totalSize / 1024);
      
      setPerformanceData(prev => ({ ...prev, bundleSize }));
    };

    // Cache hit rate
    const calculateCacheHitRate = () => {
      const resources = performance.getEntriesByType('resource') as PerformanceResourceTiming[];
      const cachedResources = resources.filter(r => r.transferSize === 0);
      const cacheHitRate = resources.length > 0 ? 
        Math.round((cachedResources.length / resources.length) * 100) : 0;
      
      setPerformanceData(prev => ({ ...prev, cacheHitRate }));
    };

    // Update monitoring health
    const updateHealthStatus = () => {
      setHealthStatus(getMonitoringHealth());
    };

    // Initial measurements
    setTimeout(() => {
      updatePerformanceTiming();
      estimateBundleSize();
      calculateCacheHitRate();
      updateHealthStatus();
    }, 2000);

    // Periodic updates
    const healthInterval = setInterval(updateHealthStatus, 10000);

    return () => {
      cancelAnimationFrame(animationId);
      clearInterval(memoryInterval);
      clearInterval(healthInterval);
    };
  }, [enabled, onPerformanceIssue]);

  if (!enabled) return null;

  const getPerformanceStatus = () => {
    const issues = [];
    
    if (performanceData.fps > 0 && performanceData.fps < 30) {
      issues.push('Low FPS');
    }
    
    if (performanceData.memoryUsage > 100) {
      issues.push('High Memory');
    }
    
    if (performanceData.loadTime > 3000) {
      issues.push('Slow Load');
    }
    
    if (performanceData.bundleSize > 1000) {
      issues.push('Large Bundle');
    }
    
    return issues.length === 0 ? 'good' : issues.length < 3 ? 'warning' : 'critical';
  };

  const status = getPerformanceStatus();
  const positionClasses = {
    'top-left': 'top-4 left-4',
    'top-right': 'top-4 right-4',
    'bottom-left': 'bottom-4 left-4',
    'bottom-right': 'bottom-4 right-4',
  };

  return (
    <div className={`fixed ${positionClasses[position]} z-50 max-w-sm`}>
      <Card className="bg-background/95 backdrop-blur-sm border shadow-lg">
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-2">
              <Activity className="h-4 w-4" />
              Performance
              {status === 'good' && <CheckCircle className="h-3 w-3 text-green-500" />}
              {status === 'warning' && <AlertTriangle className="h-3 w-3 text-yellow-500" />}
              {status === 'critical' && <AlertTriangle className="h-3 w-3 text-red-500" />}
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsExpanded(!isExpanded)}
              className="h-6 w-6 p-0"
            >
              {isExpanded ? '−' : '+'}
            </Button>
          </CardTitle>
        </CardHeader>
        
        <CardContent className="pt-0">
          <div className="space-y-2 text-xs">
            {/* Always visible metrics */}
            <div className="flex justify-between">
              <span className="flex items-center gap-1">
                <Zap className="h-3 w-3" />
                FPS:
              </span>
              <span className={performanceData.fps < 30 ? 'text-red-500' : 'text-green-500'}>
                {performanceData.fps || '—'}
              </span>
            </div>
            
            <div className="flex justify-between">
              <span>Memory:</span>
              <span className={performanceData.memoryUsage > 100 ? 'text-yellow-500' : ''}>
                {performanceData.memoryUsage}MB
              </span>
            </div>

            {isExpanded && (
              <>
                <div className="flex justify-between">
                  <span className="flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    Load:
                  </span>
                  <span className={performanceData.loadTime > 3000 ? 'text-yellow-500' : ''}>
                    {performanceData.loadTime}ms
                  </span>
                </div>
                
                <div className="flex justify-between">
                  <span>Render:</span>
                  <span>{performanceData.renderTime}ms</span>
                </div>
                
                <div className="flex justify-between">
                  <span>Bundle:</span>
                  <span className={performanceData.bundleSize > 1000 ? 'text-yellow-500' : ''}>
                    {performanceData.bundleSize}KB
                  </span>
                </div>
                
                <div className="flex justify-between">
                  <span>Cache:</span>
                  <span className={performanceData.cacheHitRate < 50 ? 'text-yellow-500' : 'text-green-500'}>
                    {performanceData.cacheHitRate}%
                  </span>
                </div>

                {healthStatus && (
                  <>
                    <hr className="my-2" />
                    <div className="text-xs text-muted-foreground">
                      <div>Session: {healthStatus.sessionId?.slice(-8)}</div>
                      <div>Queues: E:{healthStatus.queueSizes?.errors} P:{healthStatus.queueSizes?.performance}</div>
                    </div>
                  </>
                )}

                <div className="flex gap-1 mt-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      // Force garbage collection if available
                      if ('gc' in window) {
                        (window as any).gc();
                      }
                      // Clear performance entries
                      if ('clearResourceTimings' in performance) {
                        performance.clearResourceTimings();
                      }
                    }}
                    className="text-xs h-6 px-2"
                  >
                    Clear
                  </Button>
                  
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      const report = {
                        timestamp: new Date().toISOString(),
                        performance: performanceData,
                        health: healthStatus,
                        userAgent: navigator.userAgent,
                        url: window.location.href,
                      };
                      
                      const blob = new Blob([JSON.stringify(report, null, 2)], {
                        type: 'application/json',
                      });
                      
                      const url = URL.createObjectURL(blob);
                      const a = document.createElement('a');
                      a.href = url;
                      a.download = `performance-report-${Date.now()}.json`;
                      a.click();
                      URL.revokeObjectURL(url);
                    }}
                    className="text-xs h-6 px-2"
                  >
                    Export
                  </Button>
                </div>
              </>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// Hook for component-level performance monitoring
export function usePerformanceMonitor(componentName: string) {
  useEffect(() => {
    const startTime = performance.now();
    
    return () => {
      const endTime = performance.now();
      const renderTime = endTime - startTime;
      
      reportPerformanceMetric(`component_render_${componentName}`, renderTime, {
        component: componentName,
      });
      
      // Report slow renders
      if (renderTime > 16) { // 60fps = 16.67ms per frame
        reportPerformanceMetric('slow_component_render', renderTime, {
          component: componentName,
          threshold: '16ms',
        });
      }
    };
  }, [componentName]);
}

// Performance monitoring wrapper component
export function PerformanceWrapper({ 
  children, 
  name,
  threshold = 100 
}: { 
  children: React.ReactNode;
  name: string;
  threshold?: number;
}) {
  useEffect(() => {
    const startTime = performance.now();
    
    return () => {
      const duration = performance.now() - startTime;
      
      reportPerformanceMetric(`wrapper_${name}`, duration, {
        wrapper: name,
      });
      
      if (duration > threshold) {
        reportPerformanceMetric('slow_wrapper', duration, {
          wrapper: name,
          threshold: `${threshold}ms`,
        });
      }
    };
  }, [name, threshold]);

  return <>{children}</>;
}