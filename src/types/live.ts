// TypeScript interfaces for Live Streaming Platform data models

/**
 * Stream status enumeration
 */
export type StreamStatus = "preview" | "live" | "ended";

/**
 * Stream creator information
 */
export interface StreamCreator {
  id: string;
  handle: string;
  avatar?: string;
}

/**
 * Stream keys for RTMP ingest
 */
export interface StreamKeys {
  primary: string;
  backup: string;
}

/**
 * Ingest endpoints configuration
 */
export interface IngestEndpoints {
  rtmp: string;
  srt?: string;
}

/**
 * Stream settings configuration
 */
export interface StreamSettings {
  dvrWindowSec: number;
  watermark?: boolean;
  ageRestricted?: boolean;
}

/**
 * Core Stream model
 * Used for both viewer and creator interfaces
 */
export interface Stream {
  id: string;
  title: string;
  poster?: string;
  viewers?: number;
  scheduled?: boolean;
  startAt?: string;
  status: StreamStatus;
  creator: StreamCreator;
  
  // Viewer-specific fields
  hlsUrl?: string;
  dvrWindowSec?: number;
  viewerCount?: number;
  pinned?: boolean;
  slowModeSec?: number;
  
  // Creator-specific fields
  streamKeys?: StreamKeys;
  ingest?: IngestEndpoints;
  settings?: StreamSettings;
}

/**
 * Chat user information
 */
export interface ChatUser {
  id: string;
  handle: string;
  avatar?: string;
  role?: 'viewer' | 'moderator' | 'creator';
}

/**
 * Chat message model
 */
export interface Message {
  id: string;
  user: ChatUser;
  text: string;
  ts: number;
  pinned?: boolean;
  deleted?: boolean;
}

/**
 * Stream health metrics
 */
export interface HealthMetrics {
  viewerCount: number;
  bitrateKbps: number;
  fps: number;
  dropRate: number;
  timestamp: number;
}

/**
 * Tip/donation event
 */
export interface TipEvent {
  id: string;
  streamId: string;
  user: ChatUser;
  amount: number;
  currency: string;
  message?: string;
  timestamp: number;
}

/**
 * Moderation action types
 */
export type ModerationAction = "delete" | "timeout" | "ban";

/**
 * Moderation request payload
 */
export interface ModerationRequest {
  action: ModerationAction;
  targetUserId: string;
  messageId?: string;
  durationSec?: number;
  reason?: string;
}

/**
 * Stream creation request
 */
export interface CreateStreamRequest {
  title: string;
  startAt?: string;
  privacy?: 'public' | 'unlisted' | 'private';
  dvrWindowSec?: number;
  watermark?: boolean;
  ageRestricted?: boolean;
}

/**
 * Stream update request
 */
export interface UpdateStreamRequest {
  title?: string;
  dvrWindowSec?: number;
  watermark?: boolean;
  ageRestricted?: boolean;
}

/**
 * Live feed response
 */
export interface LiveFeedResponse {
  now: Stream[];
  upcoming: Stream[];
}

/**
 * Chat message send request
 */
export interface SendMessageRequest {
  text: string;
  replyTo?: string;
}

/**
 * WebSocket event types
 */
export interface WebSocketEvents {
  // Chat events
  'chat:join': { room: string };
  'chat:message': Message;
  'chat:pinned': Message;
  'chat:slow_mode': { seconds: number };
  'chat:viewers': { count: number };
  
  // Realtime events
  'realtime:tip': TipEvent;
  'realtime:viewers_update': { streamId: string; count: number };
  
  // Control events
  'control:health': HealthMetrics;
  'control:status': { status: StreamStatus };
  'control:viewers': { count: number };
}

/**
 * API response wrapper
 */
export interface ApiResponse<T = any> {
  ok: boolean;
  data?: T;
  error?: string;
  message?: string;
}

/**
 * Join time metrics
 */
export interface JoinTimeMetrics {
  type: 'live' | 'vod';
  streamId: string;
  ms: number;
  timestamp: number;
  userAgent?: string;
}

/**
 * Stream statistics
 */
export interface StreamStats {
  viewerCount: number;
  bitrateKbps: number;
  droppedFrames: number;
  avgJoinTimeMs: number;
  peakViewers: number;
}

/**
 * Thumbnail upload request
 */
export interface ThumbnailRequest {
  frameAtSec?: number;
  file?: File;
}

/**
 * Slow mode configuration
 */
export interface SlowModeConfig {
  seconds: number;
  enabled: boolean;
}

/**
 * Pin/unpin message request
 */
export interface PinMessageRequest {
  messageId: string;
}

/**
 * Stream key rotation response
 */
export interface RotateKeysResponse {
  primary: string;
  backup: string;
}