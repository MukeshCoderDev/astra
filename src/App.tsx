import { BrowserRouter } from 'react-router-dom';
import { QueryProvider } from './providers/QueryProvider';
import { ThemeProvider } from './providers/ThemeProvider';
import { ToastProvider } from './providers/ToastProvider';
import { SocketProvider } from './providers/SocketProvider';
import { AccessibilityProvider } from './providers/AccessibilityProvider';
import { AppIntegration } from './components/app/AppIntegration';
import { AnalyticsProvider } from './lib/analytics';
import { CriticalErrorBoundary } from './components/monitoring/ErrorBoundary';
import { PerformanceMonitor } from './components/monitoring/PerformanceMonitor';
import AppRoutes from './routes/AppRoutes';

function App() {
  return (
    <CriticalErrorBoundary>
      <BrowserRouter>
        <AppIntegration>
          <AccessibilityProvider>
            <QueryProvider>
              <ThemeProvider defaultTheme="dark">
                <AnalyticsProvider>
                  <ToastProvider>
                    <SocketProvider>
                      <AppRoutes />
                      <PerformanceMonitor />
                    </SocketProvider>
                  </ToastProvider>
                </AnalyticsProvider>
              </ThemeProvider>
            </QueryProvider>
          </AccessibilityProvider>
        </AppIntegration>
      </BrowserRouter>
    </CriticalErrorBoundary>
  );
}

export default App;