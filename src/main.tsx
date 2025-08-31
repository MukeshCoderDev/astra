import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.tsx';
import './styles/globals.css';
import { registerServiceWorker } from './lib/serviceWorker';

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
    },
    onUpdate: () => {
      console.log('New content available, please refresh');
    },
    onOfflineReady: () => {
      console.log('App is ready to work offline');
    },
  });
}