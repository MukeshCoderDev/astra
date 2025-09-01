import { useEffect, useState } from 'react';
import { env, ageGate } from '../../lib/env';

function AgeGate() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    // Debug logging
    console.log('🔞 AgeGate Debug Info:');
    console.log('- ADULT_CONTENT enabled:', env.ADULT_CONTENT);
    console.log('- ageGate.isEnabled():', ageGate.isEnabled());
    
    const consentStatus = ageGate.getConsentStatus();
    console.log('- Consent Status:', consentStatus);
    
    if (consentStatus.required && !consentStatus.valid) {
      console.log('✅ Age gate should open - setting open to true');
      setOpen(true);
    } else {
      console.log('❌ Age gate will not open:', {
        required: consentStatus.required,
        valid: consentStatus.valid
      });
    }
  }, []);

  const accept = async () => {
    localStorage.setItem("age_ack", "1");
    localStorage.setItem("age_ack_ts", String(Date.now()));
    
    try {
      await fetch(`${env.API_BASE}/bff/compliance/age/ack`, {
        method: "POST",
        credentials: "include"
      });
    } catch {
      // Silent failure - localStorage persistence maintained
    }
    
    setOpen(false);
  };

  // Debug logging for render
  console.log('🔞 AgeGate Render Check:', {
    enabled: ageGate.isEnabled(),
    open: open,
    willRender: ageGate.isEnabled() && open
  });

  if (!ageGate.isEnabled() || !open) return null;

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
          You must be 18 years or older to use this site. By continuing, you confirm that you are 18+ and agree to our Terms and Privacy Policy.
        </p>
        <div className="flex gap-2 justify-end">
          <a 
            href="https://google.com" 
            className="px-3 py-2 rounded bg-neutral-200 dark:bg-neutral-800 hover:bg-neutral-300 dark:hover:bg-neutral-700 transition-colors"
          >
            Leave
          </a>
          <button 
            onClick={accept} 
            className="px-3 py-2 rounded bg-brand-500 text-white hover:bg-brand-600 transition-colors"
          >
            I am 18+
          </button>
        </div>
      </div>
    </div>
  );
}

export default AgeGate;