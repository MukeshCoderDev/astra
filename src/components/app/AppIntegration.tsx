import React, { useEffect, Suspense } from 'react';
import { ErrorBoundary } from '../ui';
import { FeatureFlagProvider, useFeatureFlag } from '../../lib/featureFlags';
import { useSessionStore } from '../../store/sessionStore';
import { useUIStore } from '../../store/uiStore';
import { registerServiceWorker } from '../../lib/serviceWorker';
import { initializeAnalytics } from '../../lib/analytics';
import { Loading } from '../ui';

/**
 * Application integration component that handles:
 * - Feature flag initialization
 * - Service worker registration
 * - Analytics initialization
 * - Global error handling
 * - Performance monitoring
 */

interface AppIntegrationProps {
  children: React.ReactNode;
}

function AppIntegrationInner({ children }: AppIntegrationProps) {
  const { user, isAuthenticated } = useSessionStore();
  const { theme } = useUIStore();
  
  // Feature flags
  const analyticsEnabled = useFeatureFlag('analytics');
  const notificationsEnabled = useFeatureFlag('notifications');
  
  useEffect(() => {
    // Initialize service worker in production
    if (import.meta.env.PROD) {
      registerServiceWorker({
        onSuccess: () => {
          console.log('✅ App is ready for offline use');
        },
        onUpdate: () => {
          console.log('🔄 New content available, please refresh');
          // Could show a toast notification here
        },
        onOfflineReady: () => {
          console.log('📱 App is ready to work offline');
        },
      });
    }
  }, []);

  useEffect(() => {
    // Initialize analytics if enabled
    if (analyticsEnabled && import.meta.env.PROD) {
      initializeAnalytics({
        userId: user?.id,
        userProperties: {
          plan: 'free', // Could be dynamic based on user data
          verified: user?.verified || false,
        },
      });
    }
  }, [analyticsEnabled, user]);

  useEffect(() => {
    // Set theme class on document
    document.documentElement.className = theme;
    
    // Update meta theme-color for mobile browsers
    const metaThemeColor = document.querySelector('meta[name="theme-color"]');
    if (metaThemeColor) {
      metaThemeColor.setAttribute(
        'content', 
        theme === 'dark' ? '#0f0f23' : '#ffffff'
      );
    }
  }, [theme]);

  useEffect(() => {
    // Request notification permission if notifications are enabled
    if (notificationsEnabled && 'Notification' in window && isAuthenticated) {
      if (Notification.permission === 'default') {
        Notification.requestPermission().then(permission => {
          console.log('Notification permission:', permission);
        });
      }
    }
  }, [notificationsEnabled, isAuthenticated]);

  useEffect(() => {
    // Performance monitoring
    if (import.meta.env.PROD && 'performance' in window) {
      // Monitor Core Web Vitals
      try {
        import('web-vitals').then(({ getCLS, getFID, getFCP, getLCP, getTTFB }) => {
          getCLS(console.log);
          getFID(console.log);
          getFCP(console.log);
          getLCP(console.log);
          getTTFB(console.log);
        }).catch((error) => {
          console.warn('Failed to load web-vitals:', error);
        });
      } catch (error) {
        console.warn('Web-vitals not available:', error);
      }
    }
  }, []);

  useEffect(() => {
    // Global error handling
    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      console.error('Unhandled promise rejection:', event.reason);
      
      // Report to analytics if enabled
      if (analyticsEnabled) {
        // Analytics error reporting would go here
      }
    };

    const handleError = (event: ErrorEvent) => {
      console.error('Global error:', event.error);
      
      // Report to analytics if enabled
      if (analyticsEnabled) {
        // Analytics error reporting would go here
      }
    };

    window.addEventListener('unhandledrejection', handleUnhandledRejection);
    window.addEventListener('error', handleError);

    return () => {
      window.removeEventListener('unhandledrejection', handleUnhandledRejection);
      window.removeEventListener('error', handleError);
    };
  }, [analyticsEnabled]);

  return (
    <ErrorBoundary>
      <Suspense fallback={<AppLoadingFallback />}>
        {children}
      </Suspense>
    </ErrorBoundary>
  );
}

function AppLoadingFallback() {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="text-center space-y-4">
        <Loading size="lg" />
        <div className="space-y-2">
          <h2 className="text-xl font-semibold">Loading Application</h2>
          <p className="text-muted-foreground">
            Initializing Web3 Content Platform...
          </p>
        </div>
      </div>
    </div>
  );
}

export function AppIntegration({ children }: AppIntegrationProps) {
  return (
    <FeatureFlagProvider>
      <AppIntegrationInner>
        {children}
      </AppIntegrationInner>
    </FeatureFlagProvider>
  );
}