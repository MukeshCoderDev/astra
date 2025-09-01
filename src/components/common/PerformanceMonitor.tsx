import { useEffect, useState } from 'react';
import { PerformanceMonitor } from '../../lib/performanceOptimizations';

interface PerformanceMetrics {
  scrollPerformance: number;
  renderTime: number;
  memoryUsage: number;
  fps: number;
}

interface PerformanceMonitorProps {
  enabled?: boolean;
  showOverlay?: boolean;
  onMetricsUpdate?: (metrics: PerformanceMetrics) => void;
}

export function PerformanceMonitorComponent({ 
  enabled = false, 
  showOverlay = false,
  onMetricsUpdate 
}: PerformanceMonitorProps) {
  const [metrics, setMetrics] = useState<PerformanceMetrics>({
    scrollPerformance: 0,
    renderTime: 0,
    memoryUsage: 0,
    fps: 0,
  });

  useEffect(() => {
    if (!enabled) return;

    const monitor = PerformanceMonitor.getInstance();
    let frameCount = 0;
    let lastTime = performance.now();
    let animationId: number;

    // FPS monitoring
    const measureFPS = () => {
      frameCount++;
      const currentTime = performance.now();
      
      if (currentTime - lastTime >= 1000) {
        const fps = Math.round((frameCount * 1000) / (currentTime - lastTime));
        
        setMetrics(prev => ({
          ...prev,
          fps,
          scrollPerformance: monitor.getAverageTime('scroll'),
          renderTime: monitor.getAverageTime('render'),
        }));

        frameCount = 0;
        lastTime = currentTime;
      }
      
      animationId = requestAnimationFrame(measureFPS);
    };

    // Memory usage monitoring
    const measureMemory = () => {
      if ('memory' in performance) {
        const memory = (performance as any).memory;
        setMetrics(prev => ({
          ...prev,
          memoryUsage: Math.round(memory.usedJSHeapSize / 1024 / 1024), // MB
        }));
      }
    };

    // Start monitoring
    animationId = requestAnimationFrame(measureFPS);
    const memoryInterval = setInterval(measureMemory, 5000);

    // Scroll performance monitoring
    const handleScroll = () => {
      monitor.startTiming('scroll');
      requestAnimationFrame(() => {
        monitor.endTiming('scroll');
      });
    };

    window.addEventListener('scroll', handleScroll, { passive: true });

    return () => {
      cancelAnimationFrame(animationId);
      clearInterval(memoryInterval);
      window.removeEventListener('scroll', handleScroll);
    };
  }, [enabled]);

  useEffect(() => {
    if (onMetricsUpdate) {
      onMetricsUpdate(metrics);
    }
  }, [metrics, onMetricsUpdate]);

  if (!enabled || !showOverlay) {
    return null;
  }

  return (
    <div className="fixed top-4 right-4 bg-black/80 text-white p-3 rounded-lg text-xs font-mono z-50">
      <div className="space-y-1">
        <div>FPS: {metrics.fps}</div>
        <div>Scroll: {metrics.scrollPerformance.toFixed(1)}ms</div>
        <div>Render: {metrics.renderTime.toFixed(1)}ms</div>
        <div>Memory: {metrics.memoryUsage}MB</div>
      </div>
    </div>
  );
}

/**
 * Hook for performance monitoring
 */
export function usePerformanceMonitoring(enabled: boolean = false) {
  const [metrics, setMetrics] = useState<PerformanceMetrics>({
    scrollPerformance: 0,
    renderTime: 0,
    memoryUsage: 0,
    fps: 0,
  });

  const startRenderTiming = () => {
    if (enabled) {
      PerformanceMonitor.getInstance().startTiming('render');
    }
  };

  const endRenderTiming = () => {
    if (enabled) {
      const duration = PerformanceMonitor.getInstance().endTiming('render');
      setMetrics(prev => ({ ...prev, renderTime: duration }));
    }
  };

  const measureScrollPerformance = () => {
    if (enabled) {
      PerformanceMonitor.getInstance().startTiming('scroll');
      return () => {
        const duration = PerformanceMonitor.getInstance().endTiming('scroll');
        setMetrics(prev => ({ ...prev, scrollPerformance: duration }));
      };
    }
    return () => {};
  };

  return {
    metrics,
    startRenderTiming,
    endRenderTiming,
    measureScrollPerformance,
  };
}