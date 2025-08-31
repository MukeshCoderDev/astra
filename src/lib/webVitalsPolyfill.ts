/**
 * Web Vitals polyfill for cases where the package is not available
 */

interface Metric {
  name: string;
  value: number;
  delta: number;
  id: string;
}

type MetricCallback = (metric: Metric) => void;

// Fallback implementations for when web-vitals is not available
export function getCLS(callback: MetricCallback) {
  console.warn('CLS measurement not available - web-vitals package not loaded');
}

export function getFID(callback: MetricCallback) {
  console.warn('FID measurement not available - web-vitals package not loaded');
}

export function getFCP(callback: MetricCallback) {
  console.warn('FCP measurement not available - web-vitals package not loaded');
}

export function getLCP(callback: MetricCallback) {
  console.warn('LCP measurement not available - web-vitals package not loaded');
}

export function getTTFB(callback: MetricCallback) {
  console.warn('TTFB measurement not available - web-vitals package not loaded');
}

// Helper function to safely import web-vitals with fallback
export async function safeImportWebVitals() {
  try {
    return await import('web-vitals');
  } catch (error) {
    console.warn('web-vitals package not available, using fallback');
    return {
      getCLS,
      getFID,
      getFCP,
      getLCP,
      getTTFB,
    };
  }
}