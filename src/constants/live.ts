// Constants for Live Streaming Platform

/**
 * HLS.js configuration for low-latency streaming with join time optimizations
 */
export const HLS_CONFIG = {
  lowLatencyMode: true,
  maxBufferLength: 6, // 6 seconds for low latency
  backBufferLength: 30, // 30 seconds of back buffer
  liveSyncDurationCount: 3, // Sync to live edge
  liveMaxLatencyDurationCount: 10, // Max latency before seeking
  enableWorker: true,
  startLevel: -1, // Auto start level
  capLevelToPlayerSize: true,
  
  // Join time optimizations
  maxBufferSize: 60 * 1000 * 1000, // 60MB buffer size
  maxMaxBufferLength: 12, // Max buffer in seconds
  startFragPrefetch: true, // Prefetch first fragment
  testBandwidth: false, // Skip initial bandwidth test for faster startup
  abrEwmaFastLive: 3.0, // Faster adaptation for live streams
  abrEwmaSlowLive: 9.0, // Slower adaptation for stability
  manifestLoadingTimeOut: 5000, // 5s timeout for manifest loading
  manifestLoadingMaxRetry: 2, // Fewer retries for faster failure detection
  levelLoadingTimeOut: 5000, // 5s timeout for level loading
  fragLoadingTimeOut: 10000, // 10s timeout for fragment loading
  
  // Additional performance optimizations
  progressive: false, // Disable progressive loading for live
  lowLatencyMode: true, // Enable low latency mode
  backBufferLength: 30, // Keep reasonable back buffer
  maxFragLookUpTolerance: 0.25, // Tighter fragment lookup tolerance
} as const;

/**
 * Performance thresholds and targets
 */
export const PERFORMANCE_TARGETS = {
  MAX_JOIN_TIME_MS: 2000, // Target: < 2 seconds TTFF
  OPTIMAL_JOIN_TIME_MS: 1000, // Optimal: < 1 second TTFF
  GO_LIVE_THRESHOLD_SEC: 5, // Show "Go Live" when >5s behind
  HEALTH_UPDATE_INTERVAL_MS: 5000, // 5 second health updates
  CHAT_POLLING_INTERVAL_MS: 4000, // 4 second chat polling fallback
  TIP_ANIMATION_DURATION_MS: 8000, // 8 second tip ticker animation
  METRICS_REPORT_INTERVAL_MS: 30000, // 30 second metrics reporting
  
  // Join time optimization targets
  MAX_PRECONNECT_TIME_MS: 100, // Target preconnect time
  MAX_MANIFEST_PRELOAD_MS: 500, // Target manifest preload time
  MAX_HLS_INIT_MS: 300, // Target HLS initialization time
  MAX_FIRST_FRAME_MS: 1500, // Target first frame time
  
  // Performance monitoring
  PERFORMANCE_SAMPLE_RATE: 0.1, // 10% of sessions for detailed metrics
  SLOW_JOIN_THRESHOLD_MS: 3000, // Report as slow if > 3 seconds
  CRITICAL_JOIN_THRESHOLD_MS: 5000, // Report as critical if > 5 seconds
} as const;

/**
 * Chat configuration
 */
export const CHAT_CONFIG = {
  MAX_MESSAGE_LENGTH: 500,
  MAX_MESSAGES_DISPLAYED: 100,
  SLOW_MODE_MAX_SECONDS: 120,
  RECONNECT_ATTEMPTS: 5,
  RECONNECT_DELAY_MS: 1000,
} as const;

/**
 * Stream configuration limits
 */
export const STREAM_LIMITS = {
  MAX_TITLE_LENGTH: 100,
  MIN_DVR_WINDOW_SEC: 0,
  MAX_DVR_WINDOW_SEC: 14400, // 4 hours
  DEFAULT_DVR_WINDOW_SEC: 7200, // 2 hours
  MAX_THUMBNAIL_SIZE_MB: 5,
  SUPPORTED_THUMBNAIL_FORMATS: ['image/jpeg', 'image/png', 'image/webp'],
} as const;

/**
 * Moderation action durations
 */
export const MODERATION_DURATIONS = {
  TIMEOUT_DEFAULT_SEC: 300, // 5 minutes
  TIMEOUT_OPTIONS_SEC: [60, 300, 600, 1800, 3600], // 1m, 5m, 10m, 30m, 1h
  BAN_PERMANENT: -1,
} as const;

/**
 * Stream status display configuration
 */
export const STATUS_CONFIG = {
  LIVE_BADGE_COLOR: '#dc2626', // red-600
  UPCOMING_BADGE_COLOR: '#f59e0b', // amber-500
  ENDED_BADGE_COLOR: '#6b7280', // gray-500
  PREVIEW_OVERLAY_OPACITY: 0.6,
} as const;

/**
 * WebSocket event names
 */
export const WS_EVENTS = {
  // Chat events
  CHAT_JOIN: 'join',
  CHAT_MESSAGE: 'message',
  CHAT_PINNED: 'pinned',
  CHAT_SLOW_MODE: 'slow_mode',
  CHAT_VIEWERS: 'viewers',
  
  // Realtime events
  REALTIME_TIP: 'tip',
  REALTIME_VIEWERS_UPDATE: 'viewers_update',
  
  // Control events
  CONTROL_HEALTH: 'health',
  CONTROL_STATUS: 'status',
  CONTROL_VIEWERS: 'viewers',
} as const;

/**
 * API endpoints
 */
export const API_ENDPOINTS = {
  // Viewer endpoints
  LIVE_FEED: '/bff/live/feed',
  LIVE_STREAM: (id: string) => `/bff/live/${id}`,
  LIVE_CHAT: (id: string) => `/bff/live/${id}/chat`,
  LIVE_STATS: (id: string) => `/bff/live/${id}/stats`,
  
  // Creator endpoints
  STUDIO_LIVE_LIST: '/bff/studio/live',
  STUDIO_LIVE_CREATE: '/bff/studio/live',
  STUDIO_LIVE_STREAM: (id: string) => `/bff/studio/live/${id}`,
  STUDIO_LIVE_START: (id: string) => `/bff/studio/live/${id}/start`,
  STUDIO_LIVE_END: (id: string) => `/bff/studio/live/${id}/end`,
  STUDIO_LIVE_KEYS_ROTATE: (id: string) => `/bff/studio/live/${id}/keys/rotate`,
  STUDIO_LIVE_SLOW_MODE: (id: string) => `/bff/studio/live/${id}/slow_mode`,
  STUDIO_LIVE_PIN: (id: string) => `/bff/studio/live/${id}/pin`,
  STUDIO_LIVE_UNPIN: (id: string) => `/bff/studio/live/${id}/unpin`,
  STUDIO_LIVE_MODERATE: (id: string) => `/bff/studio/live/${id}/moderate`,
  STUDIO_LIVE_THUMBNAIL: (id: string) => `/bff/studio/live/${id}/thumbnail`,
  STUDIO_LIVE_SETTINGS: (id: string) => `/bff/studio/live/${id}/settings`,
  
  // Metrics endpoints
  METRICS_JOIN: '/bff/metrics/join',
  METRICS_ERROR: '/bff/metrics/error',
  
  // Compliance endpoints
  COMPLIANCE_AGE_ACK: '/bff/compliance/age/ack',
} as const;

/**
 * Local storage keys
 */
export const STORAGE_KEYS = {
  AGE_ACKNOWLEDGMENT: 'age_ack',
  AGE_ACKNOWLEDGMENT_TIMESTAMP: 'age_ack_ts',
  CHAT_PREFERENCES: 'live_chat_prefs',
  PLAYER_PREFERENCES: 'live_player_prefs',
} as const;

/**
 * CSS classes for animations
 */
export const ANIMATION_CLASSES = {
  TIP_SLIDE_LEFT: 'animate-slide-left',
  FADE_IN: 'animate-fade-in',
  FADE_OUT: 'animate-fade-out',
  PULSE: 'animate-pulse',
  BOUNCE: 'animate-bounce',
} as const;

/**
 * Error messages
 */
export const ERROR_MESSAGES = {
  NETWORK_ERROR: 'Network connection failed. Please check your internet connection.',
  WEBSOCKET_FAILED: 'Real-time connection failed. Falling back to polling.',
  STREAM_NOT_FOUND: 'Stream not found or no longer available.',
  STREAM_ENDED: 'This stream has ended.',
  CHAT_SEND_FAILED: 'Failed to send message. Please try again.',
  MODERATION_FAILED: 'Moderation action failed. Please try again.',
  SETTINGS_SAVE_FAILED: 'Failed to save settings. Please try again.',
  THUMBNAIL_UPLOAD_FAILED: 'Failed to upload thumbnail. Please try again.',
  INVALID_FILE_TYPE: 'Invalid file type. Please upload a JPEG, PNG, or WebP image.',
  FILE_TOO_LARGE: 'File is too large. Maximum size is 5MB.',
  AGE_VERIFICATION_REQUIRED: 'Age verification is required to access this content.',
} as const;

/**
 * Success messages
 */
export const SUCCESS_MESSAGES = {
  STREAM_STARTED: 'Stream started successfully!',
  STREAM_ENDED: 'Stream ended successfully.',
  SETTINGS_SAVED: 'Settings saved successfully.',
  THUMBNAIL_UPLOADED: 'Thumbnail uploaded successfully.',
  KEYS_ROTATED: 'Stream keys rotated successfully.',
  MESSAGE_PINNED: 'Message pinned successfully.',
  MESSAGE_UNPINNED: 'Message unpinned successfully.',
  USER_MODERATED: 'User moderated successfully.',
} as const;