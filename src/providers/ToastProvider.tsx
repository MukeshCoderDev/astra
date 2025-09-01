import { createContext, useContext, useState, ReactNode } from 'react';

interface Toast {
  id: string;
  type: 'success' | 'error' | 'info' | 'warning';
  title: string;
  description?: string;
  duration?: number;
}

interface ToastContextType {
  toasts: Toast[];
  addToast: (toast: Omit<Toast, 'id'>) => void;
  removeToast: (id: string) => void;
  success: (title: string, description?: string) => void;
  error: (title: string, description?: string) => void;
  info: (title: string, description?: string) => void;
  warning: (title: string, description?: string) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

interface ToastProviderProps {
  children: ReactNode;
}

export function ToastProvider({ children }: ToastProviderProps) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const addToast = (toast: Omit<Toast, 'id'>) => {
    const id = Math.random().toString(36).substr(2, 9);
    const newToast = { ...toast, id };
    
    setToasts(prev => [...prev, newToast]);

    // Auto remove after duration
    const duration = toast.duration || 5000;
    setTimeout(() => {
      removeToast(id);
    }, duration);
  };

  const removeToast = (id: string) => {
    setToasts(prev => prev.filter(toast => toast.id !== id));
  };

  const success = (title: string, description?: string) => {
    addToast({ type: 'success', title, description });
  };

  const error = (title: string, description?: string) => {
    addToast({ type: 'error', title, description });
  };

  const info = (title: string, description?: string) => {
    addToast({ type: 'info', title, description });
  };

  const warning = (title: string, description?: string) => {
    addToast({ type: 'warning', title, description });
  };

  const value = {
    toasts,
    addToast,
    removeToast,
    success,
    error,
    info,
    warning,
  };

  return (
    <ToastContext.Provider value={value}>
      {children}
      {/* Toast container */}
      <div 
        className="fixed bottom-4 right-4 z-50 space-y-2 max-w-sm"
        role="region"
        aria-label="Notifications"
        aria-live="polite"
      >
        {toasts.map(toast => (
          <div
            key={toast.id}
            role="alert"
            aria-live={toast.type === 'error' ? 'assertive' : 'polite'}
            className={`
              px-4 py-3 rounded-lg shadow-lg backdrop-blur-sm border
              transform transition-all duration-300 ease-out
              animate-in slide-in-from-right-full fade-in
              ${toast.type === 'success' ? 'bg-green-600/90 text-white border-green-500/50' : ''}
              ${toast.type === 'error' ? 'bg-red-600/90 text-white border-red-500/50' : ''}
              ${toast.type === 'info' ? 'bg-blue-600/90 text-white border-blue-500/50' : ''}
              ${toast.type === 'warning' ? 'bg-yellow-600/90 text-white border-yellow-500/50' : ''}
            `}
          >
            <div className="flex justify-between items-start gap-3">
              <div className="flex-1 min-w-0">
                <div className="font-medium text-sm leading-tight">{toast.title}</div>
                {toast.description && (
                  <div className="text-xs opacity-90 mt-1 leading-relaxed">
                    {toast.description}
                  </div>
                )}
              </div>
              <button
                onClick={() => removeToast(toast.id)}
                className="flex-shrink-0 text-white/70 hover:text-white focus:outline-none focus:ring-2 focus:ring-white/50 rounded p-1 transition-colors"
                aria-label={`Dismiss ${toast.type} notification: ${toast.title}`}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            {/* Progress bar for auto-dismiss */}
            <div className="mt-2 h-1 bg-white/20 rounded-full overflow-hidden">
              <div 
                className="h-full bg-white/40 rounded-full animate-progress"
                style={{ 
                  animationDuration: `${toast.duration || 5000}ms`,
                  animationTimingFunction: 'linear'
                }}
              />
            </div>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export const useToast = () => {
  const context = useContext(ToastContext);
  if (context === undefined) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
};