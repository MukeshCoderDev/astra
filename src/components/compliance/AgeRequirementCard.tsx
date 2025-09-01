"use client";
import { useEffect, useState } from "react";
import { complianceApi } from "../../lib/api";
import { getAgeVerificationStatus, storeAgeAcknowledgment } from "../../lib/ageVerification";

/**
 * Age verification modal component
 * Shows 18+ age gate when required and not previously acknowledged
 */
export default function AgeRequirementCard() {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const status = getAgeVerificationStatus();
    
    // Show age gate if required and not valid
    if (status.required && !status.valid) {
      setOpen(true);
    }
  }, []);

  const handleAccept = async () => {
    setLoading(true);
    
    // Store acknowledgment in localStorage
    storeAgeAcknowledgment();
    
    // Send acknowledgment to backend (best effort)
    try {
      await complianceApi.acknowledgeAge();
    } catch (error) {
      // Silent failure - localStorage persistence is maintained
      console.warn('Failed to send age acknowledgment to server:', error);
    }
    
    setLoading(false);
    setOpen(false);
  };

  const handleLeave = () => {
    // Redirect to external site
    window.location.href = "https://google.com";
  };

  // Don't render if modal is closed
  if (!open) return null;

  return (
    <div 
      className="fixed inset-0 z-[1000] bg-black/70 flex items-center justify-center p-4" 
      role="dialog" 
      aria-modal="true"
      aria-labelledby="age-gate-title"
      aria-describedby="age-gate-description"
    >
      <div className="bg-white dark:bg-neutral-900 rounded-xl p-5 max-w-lg w-full shadow-xl border border-neutral-200 dark:border-neutral-800">
        <h2 id="age-gate-title" className="text-xl font-semibold mb-2">
          Adults only (18+)
        </h2>
        <p id="age-gate-description" className="text-sm text-neutral-600 dark:text-neutral-400 mb-4">
          You must be 18+ to use this site. By continuing, you confirm that you are 18+ and agree to our Terms and Privacy Policy.
        </p>
        <div className="flex gap-2 justify-end">
          <button
            onClick={handleLeave}
            className="px-3 py-2 rounded bg-neutral-200 dark:bg-neutral-800 hover:bg-neutral-300 dark:hover:bg-neutral-700 transition-colors"
            disabled={loading}
          >
            Leave
          </button>
          <button 
            onClick={handleAccept} 
            className="px-3 py-2 rounded bg-brand-500 text-white hover:bg-brand-600 transition-colors disabled:opacity-50"
            disabled={loading}
          >
            {loading ? 'Verifying...' : 'I am 18+'}
          </button>
        </div>
      </div>
    </div>
  );
}