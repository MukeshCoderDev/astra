import { useState } from 'react';
import { ENV } from '../../lib/env';
import { 
  getAgeVerificationStatus, 
  clearAgeAcknowledgment,
  getExpirationTimeString,
  isAgeVerificationRequired 
} from '../../lib/ageVerification';

export function AgeGateTest() {
  const [showDebug, setShowDebug] = useState(false);

  const clearConsent = () => {
    clearAgeAcknowledgment();
    window.location.reload();
  };

  const forceShow = () => {
    clearAgeAcknowledgment();
    // Force re-render by reloading
    window.location.reload();
  };

  if (!showDebug) {
    return (
      <div className="fixed bottom-4 right-4 z-50">
        <button
          onClick={() => setShowDebug(true)}
          className="bg-red-600 text-white px-3 py-2 rounded text-sm"
        >
          🔞 Debug Age Gate
        </button>
      </div>
    );
  }

  const consentStatus = getAgeVerificationStatus();

  return (
    <div className="fixed bottom-4 right-4 z-50 bg-black text-white p-4 rounded-lg max-w-sm">
      <div className="flex justify-between items-center mb-2">
        <h3 className="font-bold">Age Gate Debug</h3>
        <button
          onClick={() => setShowDebug(false)}
          className="text-gray-400 hover:text-white"
        >
          ✕
        </button>
      </div>
      
      <div className="space-y-2 text-xs">
        <div>
          <strong>Environment:</strong>
          <div>ADULT_CONTENT: {ENV.ADULT ? '✅ true' : '❌ false'}</div>
          <div>TTL_DAYS: {ENV.AGE_TTL_DAYS}</div>
          <div>Required: {isAgeVerificationRequired() ? '✅ true' : '❌ false'}</div>
        </div>
        
        <div>
          <strong>Consent Status:</strong>
          <div>Required: {consentStatus.required ? '✅ true' : '❌ false'}</div>
          <div>Valid: {consentStatus.valid ? '✅ true' : '❌ false'}</div>
          <div>Acknowledged: {consentStatus.acknowledged ? '✅ true' : '❌ false'}</div>
          <div>Expired: {consentStatus.expired ? '⚠️ true' : '✅ false'}</div>
          <div>Expiration: {getExpirationTimeString()}</div>
        </div>
        
        <div>
          <strong>LocalStorage:</strong>
          <div>age_ack: {localStorage.getItem('age_ack') || 'null'}</div>
          <div>age_ack_ts: {localStorage.getItem('age_ack_ts') || 'null'}</div>
        </div>
        
        <div className="flex gap-2 mt-3">
          <button
            onClick={clearConsent}
            className="bg-red-600 text-white px-2 py-1 rounded text-xs"
          >
            Clear & Reload
          </button>
          <button
            onClick={forceShow}
            className="bg-blue-600 text-white px-2 py-1 rounded text-xs"
          >
            Force Show
          </button>
        </div>
      </div>
    </div>
  );
}