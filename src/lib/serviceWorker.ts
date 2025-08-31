/**
 * Service Worker registration and management utilities
 */

const isLocalhost = Boolean(
  window.location.hostname === 'localhost' ||
  window.location.hostname === '[::1]' ||
  window.location.hostname.match(
    /^127(?:\.(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)){3}$/
  )
);

interface ServiceWorkerConfig {
  onSuccess?: (registration: ServiceWorkerRegistration) => void;
  onUpdate?: (registration: ServiceWorkerRegistration) => void;
  onOfflineReady?: () => void;
}

export function registerServiceWorker(config?: ServiceWorkerConfig) {
  if ('serviceWorker' in navigator) {
    const publicUrl = new URL(process.env.PUBLIC_URL || '', window.location.href);
    if (publicUrl.origin !== window.location.origin) {
      return;
    }

    window.addEventListener('load', () => {
      const swUrl = `${process.env.PUBLIC_URL}/sw.js`;

      if (isLocalhost) {
        checkValidServiceWorker(swUrl, config);
        navigator.serviceWorker.ready.then(() => {
          console.log('Service worker is ready in localhost mode');
        });
      } else {
        registerValidServiceWorker(swUrl, config);
      }
    });
  }
}

async function registerValidServiceWorker(swUrl: string, config?: ServiceWorkerConfig) {
  try {
    const registration = await navigator.serviceWorker.register(swUrl);
    
    registration.onupdatefound = () => {
      const installingWorker = registration.installing;
      if (installingWorker == null) {
        return;
      }

      installingWorker.onstatechange = () => {
        if (installingWorker.state === 'installed') {
          if (navigator.serviceWorker.controller) {
            console.log('New content is available; please refresh.');
            config?.onUpdate?.(registration);
          } else {
            console.log('Content is cached for offline use.');
            config?.onSuccess?.(registration);
            config?.onOfflineReady?.();
          }
        }
      };
    };
  } catch (error) {
    console.error('Error during service worker registration:', error);
  }
}

async function checkValidServiceWorker(swUrl: string, config?: ServiceWorkerConfig) {
  try {
    const response = await fetch(swUrl, {
      headers: { 'Service-Worker': 'script' },
    });

    const contentType = response.headers.get('content-type');
    if (
      response.status === 404 ||
      (contentType != null && contentType.indexOf('javascript') === -1)
    ) {
      const registration = await navigator.serviceWorker.ready;
      await registration.unregister();
      window.location.reload();
    } else {
      registerValidServiceWorker(swUrl, config);
    }
  } catch (error) {
    console.log('No internet connection found. App is running in offline mode.');
    config?.onOfflineReady?.();
  }
}

export function unregisterServiceWorker() {
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.ready
      .then((registration) => {
        registration.unregister();
      })
      .catch((error) => {
        console.error(error.message);
      });
  }
}

export function updateServiceWorker() {
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.ready
      .then((registration) => {
        registration.update();
      })
      .catch((error) => {
        console.error('Error updating service worker:', error);
      });
  }
}

export function skipWaiting() {
  if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
    navigator.serviceWorker.controller.postMessage({ type: 'SKIP_WAITING' });
  }
}

export function isServiceWorkerSupported(): boolean {
  return 'serviceWorker' in navigator;
}

export function isOffline(): boolean {
  return !navigator.onLine;
}

export function onNetworkStatusChange(callback: (isOnline: boolean) => void) {
  const handleOnline = () => callback(true);
  const handleOffline = () => callback(false);

  window.addEventListener('online', handleOnline);
  window.addEventListener('offline', handleOffline);

  return () => {
    window.removeEventListener('online', handleOnline);
    window.removeEventListener('offline', handleOffline);
  };
}

// Push notification utilities
export async function subscribeToPushNotifications(): Promise<PushSubscription | null> {
  if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
    console.warn('Push notifications are not supported');
    return null;
  }

  try {
    const registration = await navigator.serviceWorker.ready;
    const subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: process.env.REACT_APP_VAPID_PUBLIC_KEY,
    });

    return subscription;
  } catch (error) {
    console.error('Failed to subscribe to push notifications:', error);
    return null;
  }
}

export async function unsubscribeFromPushNotifications(): Promise<boolean> {
  if (!('serviceWorker' in navigator)) {
    return false;
  }

  try {
    const registration = await navigator.serviceWorker.ready;
    const subscription = await registration.pushManager.getSubscription();
    
    if (subscription) {
      return await subscription.unsubscribe();
    }
    
    return true;
  } catch (error) {
    console.error('Failed to unsubscribe from push notifications:', error);
    return false;
  }
}

// Background sync utilities
export function requestBackgroundSync(tag: string): void {
  if ('serviceWorker' in navigator && 'sync' in window.ServiceWorkerRegistration.prototype) {
    navigator.serviceWorker.ready
      .then((registration) => {
        return (registration as any).sync.register(tag);
      })
      .catch((error) => {
        console.error('Background sync registration failed:', error);
      });
  }
}

// Cache management utilities
export async function clearCache(cacheName?: string): Promise<void> {
  if ('caches' in window) {
    if (cacheName) {
      await caches.delete(cacheName);
    } else {
      const cacheNames = await caches.keys();
      await Promise.all(cacheNames.map(name => caches.delete(name)));
    }
  }
}

export async function getCacheSize(): Promise<number> {
  if (!('caches' in window) || !('storage' in navigator) || !('estimate' in navigator.storage)) {
    return 0;
  }

  try {
    const estimate = await navigator.storage.estimate();
    return estimate.usage || 0;
  } catch (error) {
    console.error('Failed to get cache size:', error);
    return 0;
  }
}

export async function preloadCriticalResources(urls: string[]): Promise<void> {
  if ('caches' in window) {
    try {
      const cache = await caches.open('critical-resources');
      await cache.addAll(urls);
    } catch (error) {
      console.error('Failed to preload critical resources:', error);
    }
  }
}