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
        className="fixed bottom-4 right-4 z-50 space-y-2"
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
              px-4 py-3 rounded-lg shadow-lg max-w-sm animate-slide-up
              ${toast.type === 'success' ? 'bg-green-600 text-white' : ''}
              ${toast.type === 'error' ? 'bg-red-600 text-white' : ''}
              ${toast.type === 'info' ? 'bg-blue-600 text-white' : ''}
              ${toast.type === 'warning' ? 'bg-yellow-600 text-white' : ''}
            `}
          >
            <div className="flex justify-between items-start">
              <div>
                <div className="font-medium">{toast.title}</div>
                {toast.description && (
                  <div className="text-sm opacity-90 mt-1">
                    {toast.description}
                  </div>
                )}
              </div>
              <button
                onClick={() => removeToast(toast.id)}
                className="ml-3 text-white/70 hover:text-white focus:outline-none focus:ring-2 focus:ring-white/50 rounded"
                aria-label={`Dismiss ${toast.type} notification: ${toast.title}`}
              >
                <span aria-hidden="true">×</span>
              </button>
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