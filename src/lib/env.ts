// Environment configuration with validation
interface EnvConfig {
  API_BASE: string;
  WS_URL: string;
  CDN_BASE: string;
  UPLOAD_TUS_ENDPOINT: string;
  IPFS_GATEWAY: string;
  FEATURE_FLAGS: string[];
  ADULT_CONTENT: boolean;
  AGE_GATE_TTL_DAYS: number;
  KYC_PROVIDER_URL: string;
  GEO_BLOCK_API: string;
  WATERMARK_ENDPOINT: string;
  COMPLIANCE_REGION: string;
}

function getEnvVar(key: string, defaultValue: string = ''): string {
  return import.meta.env[key] || defaultValue;
}

function getEnvBool(key: string, _defaultValue: boolean = false): boolean {
  const value = import.meta.env[key];
  return value === '1' || value === 'true';
}

function getEnvNumber(key: string, defaultValue: number): number {
  const value = import.meta.env[key];
  const parsed = parseInt(value, 10);
  return isNaN(parsed) ? defaultValue : parsed;
}

export const env: EnvConfig = {
  // API Configuration
  API_BASE: getEnvVar('VITE_API_BASE', 'http://localhost:3001/api'),
  WS_URL: getEnvVar('VITE_WS_URL', 'ws://localhost:3001'),
  CDN_BASE: getEnvVar('VITE_CDN_BASE', 'http://localhost:3001/cdn'),
  
  // Upload Configuration
  UPLOAD_TUS_ENDPOINT: getEnvVar('VITE_UPLOAD_TUS_ENDPOINT', 'http://localhost:3001/files/'),
  
  // IPFS Configuration
  IPFS_GATEWAY: getEnvVar('VITE_IPFS_GATEWAY', 'https://cloudflare-ipfs.com/ipfs/'),
  
  // Feature Flags
  FEATURE_FLAGS: getEnvVar('VITE_FEATURE_FLAGS', 'shorts,live,watermark').split(',').filter(Boolean),
  
  // Adult Content Compliance
  ADULT_CONTENT: getEnvBool('VITE_ADULT', false),
  AGE_GATE_TTL_DAYS: getEnvNumber('VITE_AGE_GATE_TTL_DAYS', 90),
  KYC_PROVIDER_URL: getEnvVar('VITE_KYC_PROVIDER_URL', 'https://kyc.example.com'),
  GEO_BLOCK_API: getEnvVar('VITE_GEO_BLOCK_API', 'https://geo.example.com'),
  WATERMARK_ENDPOINT: getEnvVar('VITE_WATERMARK_ENDPOINT', 'https://watermark.example.com'),
  COMPLIANCE_REGION: getEnvVar('VITE_COMPLIANCE_REGION', 'US'),
};

// Feature flag utilities
export const hasFeature = (feature: string): boolean => {
  return env.FEATURE_FLAGS.includes(feature);
};

export const features = {
  shorts: hasFeature('shorts'),
  live: hasFeature('live'),
  watermark: hasFeature('watermark'),
} as const;

// Validate required environment variables
export const validateEnv = () => {
  const required = ['API_BASE', 'WS_URL', 'CDN_BASE', 'UPLOAD_TUS_ENDPOINT'];
  const missing = required.filter(key => !env[key as keyof typeof env]);
  
  if (missing.length > 0) {
    console.warn('Missing environment variables:', missing);
  }
  
  return missing.length === 0;
};