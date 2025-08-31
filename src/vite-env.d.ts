/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_BASE: string;
  readonly VITE_WS_URL: string;
  readonly VITE_CDN_BASE: string;
  readonly VITE_UPLOAD_TUS_ENDPOINT: string;
  readonly VITE_IPFS_GATEWAY: string;
  readonly VITE_FEATURE_FLAGS: string;
  readonly VITE_ADULT: string;
  readonly VITE_AGE_GATE_TTL_DAYS: string;
  readonly VITE_KYC_PROVIDER_URL: string;
  readonly VITE_GEO_BLOCK_API: string;
  readonly VITE_WATERMARK_ENDPOINT: string;
  readonly VITE_COMPLIANCE_REGION: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}