/**
 * Analytics integration for user behavior tracking
 * Supports multiple analytics providers with privacy-first approach
 */

import React from 'react';

interface AnalyticsConfig {
  userId?: string;
  userProperties?: Record<string, any>;
  debug?: boolean;
}

interface AnalyticsEvent {
  name: string;
  properties?: Record<string, any>;
  userId?: string;
  timestamp?: number;
}

interface AnalyticsProvider {
  name: string;
  initialize: (config: AnalyticsConfig) => void;
  track: (event: AnalyticsEvent) => void;
  identify: (userId: string, properties?: Record<string, any>) => void;
  page: (pageName: string, properties?: Record<string, any>) => void;
}

// Privacy-first analytics implementation
class PrivacyAnalytics implements AnalyticsProvider {
  name = 'privacy-analytics';
  private config: AnalyticsConfig = {};
  private events: AnalyticsEvent[] = [];

  initialize(config: AnalyticsConfig) {
    this.config = config;
    
    if (config.debug) {
      console.log('🔍 Privacy Analytics initialized', config);
    }
  }

  track(event: AnalyticsEvent) {
    const enrichedEvent = {
      ...event,
      userId: event.userId || this.config.userId,
      timestamp: event.timestamp || Date.now(),
      sessionId: this.getSessionId(),
      url: window.location.href,
      referrer: document.referrer,
      userAgent: navigator.userAgent,
    };

    this.events.push(enrichedEvent);

    if (this.config.debug) {
      console.log('📊 Analytics Event:', enrichedEvent);
    }

    // In production, this would send to analytics service
    this.sendToAnalyticsService(enrichedEvent);
  }

  identify(userId: string, properties?: Record<string, any>) {
    this.config.userId = userId;
    this.config.userProperties = { ...this.config.userProperties, ...properties };

    if (this.config.debug) {
      console.log('👤 User Identified:', { userId, properties });
    }
  }

  page(pageName: string, properties?: Record<string, any>) {
    this.track({
      name: 'page_view',
      properties: {
        page: pageName,
        title: document.title,
        ...properties,
      },
    });
  }

  private getSessionId(): string {
    let sessionId = sessionStorage.getItem('analytics_session_id');
    if (!sessionId) {
      sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      sessionStorage.setItem('analytics_session_id', sessionId);
    }
    return sessionId;
  }

  private async sendToAnalyticsService(event: AnalyticsEvent) {
    // In production, implement actual analytics service integration
    if (import.meta.env.PROD) {
      try {
        // Example: Send to your analytics endpoint
        // await fetch('/api/analytics/events', {
        //   method: 'POST',
        //   headers: { 'Content-Type': 'application/json' },
        //   body: JSON.stringify(event),
        // });
      } catch (error) {
        console.error('Analytics error:', error);
      }
    }
  }

  // Get analytics data for debugging
  getEvents(): AnalyticsEvent[] {
    return [...this.events];
  }

  // Clear analytics data
  clear() {
    this.events = [];
    sessionStorage.removeItem('analytics_session_id');
  }
}

// Analytics manager
class AnalyticsManager {
  private providers: AnalyticsProvider[] = [];
  private initialized = false;

  addProvider(provider: AnalyticsProvider) {
    this.providers.push(provider);
  }

  initialize(config: AnalyticsConfig) {
    this.providers.forEach(provider => {
      try {
        provider.initialize(config);
      } catch (error) {
        console.error(`Failed to initialize ${provider.name}:`, error);
      }
    });
    this.initialized = true;
  }

  track(eventName: string, properties?: Record<string, any>) {
    if (!this.initialized) {
      console.warn('Analytics not initialized');
      return;
    }

    const event: AnalyticsEvent = {
      name: eventName,
      properties,
    };

    this.providers.forEach(provider => {
      try {
        provider.track(event);
      } catch (error) {
        console.error(`Failed to track event with ${provider.name}:`, error);
      }
    });
  }

  identify(userId: string, properties?: Record<string, any>) {
    if (!this.initialized) {
      console.warn('Analytics not initialized');
      return;
    }

    this.providers.forEach(provider => {
      try {
        provider.identify(userId, properties);
      } catch (error) {
        console.error(`Failed to identify user with ${provider.name}:`, error);
      }
    });
  }

  page(pageName: string, properties?: Record<string, any>) {
    if (!this.initialized) {
      console.warn('Analytics not initialized');
      return;
    }

    this.providers.forEach(provider => {
      try {
        provider.page(pageName, properties);
      } catch (error) {
        console.error(`Failed to track page with ${provider.name}:`, error);
      }
    });
  }
}

// Global analytics instance
const analytics = new AnalyticsManager();

// Add privacy-first analytics provider
analytics.addProvider(new PrivacyAnalytics());

// Initialize analytics
export function initializeAnalytics(config: AnalyticsConfig) {
  analytics.initialize({
    debug: import.meta.env.DEV,
    ...config,
  });
}

// Track events
export function trackEvent(eventName: string, properties?: Record<string, any>) {
  analytics.track(eventName, properties);
}

// Identify users
export function identifyUser(userId: string, properties?: Record<string, any>) {
  analytics.identify(userId, properties);
}

// Track page views
export function trackPageView(pageName: string, properties?: Record<string, any>) {
  analytics.page(pageName, properties);
}

// Predefined event tracking functions
export const AnalyticsEvents = {
  // Video events
  videoPlay: (videoId: string, duration?: number) => 
    trackEvent('video_play', { videoId, duration }),
  
  videoPause: (videoId: string, currentTime?: number) => 
    trackEvent('video_pause', { videoId, currentTime }),
  
  videoComplete: (videoId: string, duration?: number) => 
    trackEvent('video_complete', { videoId, duration }),

  // Upload events
  uploadStart: (fileSize: number, fileType: string) => 
    trackEvent('upload_start', { fileSize, fileType }),
  
  uploadComplete: (videoId: string, duration: number) => 
    trackEvent('upload_complete', { videoId, duration }),
  
  uploadError: (error: string, fileSize?: number) => 
    trackEvent('upload_error', { error, fileSize }),

  // Tip events
  tipSent: (amount: number, videoId: string, creatorId: string) => 
    trackEvent('tip_sent', { amount, videoId, creatorId }),
  
  tipReceived: (amount: number, videoId: string) => 
    trackEvent('tip_received', { amount, videoId }),

  // Search events
  search: (query: string, resultsCount: number) => 
    trackEvent('search', { query, resultsCount }),
  
  searchResultClick: (query: string, resultId: string, position: number) => 
    trackEvent('search_result_click', { query, resultId, position }),

  // Social events
  follow: (creatorId: string) => 
    trackEvent('follow', { creatorId }),
  
  unfollow: (creatorId: string) => 
    trackEvent('unfollow', { creatorId }),
  
  like: (videoId: string) => 
    trackEvent('like', { videoId }),
  
  comment: (videoId: string, commentLength: number) => 
    trackEvent('comment', { videoId, commentLength }),

  // Compliance events
  ageGateAccept: () => 
    trackEvent('age_gate_accept'),
  
  ageGateDeny: () => 
    trackEvent('age_gate_deny'),
  
  contentReport: (videoId: string, reason: string) => 
    trackEvent('content_report', { videoId, reason }),
  
  kycStart: () => 
    trackEvent('kyc_start'),
  
  kycComplete: (status: string) => 
    trackEvent('kyc_complete', { status }),

  // Error events
  error: (errorType: string, errorMessage: string, context?: Record<string, any>) => 
    trackEvent('error', { errorType, errorMessage, ...context }),

  // Performance events
  pageLoad: (loadTime: number, pageName: string) => 
    trackEvent('page_load', { loadTime, pageName }),
  
  apiCall: (endpoint: string, duration: number, status: number) => 
    trackEvent('api_call', { endpoint, duration, status }),
};

// React hook for analytics
export function useAnalytics() {
  return {
    track: trackEvent,
    identify: identifyUser,
    page: trackPageView,
    events: AnalyticsEvents,
  };
}

// Higher-order component for automatic page tracking
export function withPageTracking<P extends object>(
  pageName: string,
  Component: React.ComponentType<P>
) {
  return function PageTrackedComponent(props: P) {
    React.useEffect(() => {
      trackPageView(pageName);
    }, []);

    return <Component {...props} />;
  };
}

// Analytics context for React
export const AnalyticsContext = React.createContext({
  track: trackEvent,
  identify: identifyUser,
  page: trackPageView,
  events: AnalyticsEvents,
});

export function AnalyticsProvider({ children }: { children: React.ReactNode }) {
  const value = {
    track: trackEvent,
    identify: identifyUser,
    page: trackPageView,
    events: AnalyticsEvents,
  };

  return (
    <AnalyticsContext.Provider value={value}>
      {children}
    </AnalyticsContext.Provider>
  );
}