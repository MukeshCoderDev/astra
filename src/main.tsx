import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.tsx';
import './styles/globals.css';
import { registerServiceWorker } from './lib/serviceWorker';
import { initializeMonitoring } from './lib/monitoring';
import { initializeBundleOptimizations } from './lib/bundleOptimization';
import { errorLogger } from './lib/errorLogging';

// Initialize monitoring and optimizations
initializeMonitoring();
initializeBundleOptimizations();

// Set up error logging
errorLogger.info('Application starting', {
  userAgent: navigator.userAgent,
  timestamp: Date.now(),
  version: import.meta.env.VITE_APP_VERSION || 'development',
});

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

// Register service worker for caching and offline support
if (process.env.NODE_ENV === 'production') {
  registerServiceWorker({
    onSuccess: () => {
      console.log('App is ready for offline use');
      errorLogger.info('Service worker registered successfully');
    },
    onUpdate: () => {
      console.log('New content available, please refresh');
      errorLogger.info('Service worker update available');
    },
    onOfflineReady: () => {
      console.log('App is ready to work offline');
      errorLogger.info('App ready for offline use');
    },
  });
}