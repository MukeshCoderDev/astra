import { useEffect, useState } from 'react';
import { env } from '@/lib/env';

function AgeGate() {
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    if (!env.ADULT_CONTENT) return;

    const checkAgeVerification = () => {
      const ack = localStorage.getItem('age_ack');
      const timestamp = localStorage.getItem('age_ack_ts');
      
      if (!ack || !timestamp) {
        setIsOpen(true);
        return;
      }

      const ackTime = parseInt(timestamp);
      const ttlMs = env.AGE_GATE_TTL_DAYS * 24 * 60 * 60 * 1000;
      const isExpired = Date.now() - ackTime > ttlMs;

      if (isExpired) {
        setIsOpen(true);
      }
    };

    checkAgeVerification();
  }, []);

  const handleAccept = async () => {
    const timestamp = Date.now().toString();
    localStorage.setItem('age_ack', '1');
    localStorage.setItem('age_ack_ts', timestamp);

    // Send acknowledgment to backend
    try {
      await fetch(`${env.API_BASE}/bff/compliance/age/ack`, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          timestamp: parseInt(timestamp),
          userAgent: navigator.userAgent,
        }),
      });
    } catch (error) {
      console.warn('Failed to send age acknowledgment:', error);
    }

    setIsOpen(false);
  };

  const handleLeave = () => {
    window.location.href = 'https://google.com';
  };

  if (!env.ADULT_CONTENT || !isOpen) {
    return null;
  }

  return (
    <div 
      className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="age-gate-title"
    >
      <div className="bg-white dark:bg-neutral-900 rounded-lg p-6 max-w-md w-full">
        <h2 id="age-gate-title" className="text-xl font-semibold mb-3 text-neutral-900 dark:text-neutral-100">
          Adults Only
        </h2>
        <p className="text-sm text-neutral-600 dark:text-neutral-400 mb-4">
          You must be 18 years or older to use this site. This website contains 
          adult content and is intended for mature audiences only. By continuing, 
          you confirm that you are 18+ years old.
        </p>
        <p className="text-xs text-neutral-500 dark:text-neutral-500 mb-6">
          By entering, you agree to our{' '}
          <a 
            href="/legal/terms" 
            target="_blank" 
            rel="noopener noreferrer"
            className="text-brand-500 hover:underline"
          >
            Terms of Service
          </a>
          {' '}and{' '}
          <a 
            href="/legal/privacy" 
            target="_blank" 
            rel="noopener noreferrer"
            className="text-brand-500 hover:underline"
          >
            Privacy Policy
          </a>
          .
        </p>
        <div className="flex gap-3 justify-end">
          <button
            onClick={handleLeave}
            className="px-4 py-2 rounded bg-neutral-200 dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 hover:bg-neutral-300 dark:hover:bg-neutral-700 transition-colors"
          >
            Leave Site
          </button>
          <button
            onClick={handleAccept}
            className="px-4 py-2 rounded bg-brand-500 text-white hover:bg-brand-600 transition-colors"
          >
            I am 18+
          </button>
        </div>
      </div>
    </div>
  );
}

export default AgeGate;