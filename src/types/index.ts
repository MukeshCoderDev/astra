// Core data models for the Web3 Content Platform

export interface Creator {
  id: string;
  handle: string;
  displayName: string;
  avatar?: string;
  verified: boolean;
  followerCount: number;
  totalViews: number;
  bio?: string;
  kycStatus?: 'pending' | 'approved' | 'rejected';
  requires2257?: boolean;
}

export interface Video {
  id: string;
  title: string;
  description: string;
  hlsUrl: string;
  poster: string;
  durationSec: number;
  durationLabel: string;
  views: number;
  likes: number;
  tips: number;
  createdAt: string;
  updatedAt: string;
  creator: Creator;
  tags: string[];
  visibility: 'public' | 'unlisted' | 'draft' | 'under_review' | 'dmca_hidden';
  type: 'long' | 'short';
  geoBlocked?: string[];
  forensicWatermark?: boolean;
  adultContent?: boolean;
}

export interface WalletBalance {
  usdc: number;
  pendingEarnings: number;
  availableForWithdraw: number;
  lastUpdated: string;
}

export interface TipTransaction {
  id: string;
  amount: number;
  currency: 'USDC';
  videoId: string;
  creatorId: string;
  timestamp: string;
  status: 'pending' | 'completed' | 'failed';
}

export interface UploadSession {
  id: string;
  file: File;
  tusUrl?: string;
  progress: number;
  status: 'uploading' | 'processing' | 'completed' | 'failed';
  metadata: VideoMetadata;
}

export interface VideoMetadata {
  title: string;
  description: string;
  tags: string[];
  visibility: 'public' | 'unlisted' | 'draft';
  thumbnail?: string;
  adultContent?: boolean;
  geoBlocked?: string[];
  forensicWatermark?: boolean;
}

// Compliance Models
export interface AgeVerification {
  acknowledged: boolean;
  timestamp: number;
  ipAddress: string;
  userAgent: string;
}

export interface ContentReport {
  id: string;
  videoId: string;
  reporterId?: string;
  reason: 'csam' | 'non-consensual' | 'copyright' | 'other';
  details: string;
  status: 'pending' | 'reviewed' | 'resolved';
  createdAt: string;
}

export interface KYCVerification {
  status: 'pending' | 'approved' | 'rejected';
  documentType: 'drivers_license' | 'passport' | 'national_id';
  verificationDate?: string;
  expiryDate?: string;
  modelReleaseStatus: 'pending' | 'signed' | 'expired';
}

// Comment Models
export interface Comment {
  id: string;
  content: string;
  authorId: string;
  author: {
    id: string;
    handle: string;
    displayName: string;
    avatar?: string;
    verified: boolean;
  };
  videoId: string;
  parentId?: string; // For nested comments
  likes: number;
  isLiked: boolean;
  replies: Comment[];
  createdAt: string;
  updatedAt: string;
}

export interface CommentRequest {
  content: string;
  videoId: string;
  parentId?: string;
}

// Payout Models
export interface PayoutRecord {
  id: string;
  amount: number;
  currency: 'USDC';
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled';
  requestedAt: string;
  processedAt?: string;
  transactionHash?: string;
  walletAddress?: string;
  fees: number;
  netAmount: number;
}

export interface PayoutRequest {
  amount: number;
  walletAddress: string;
}

export interface PayoutSettings {
  minimumPayout: number;
  estimatedFees: number;
  processingTime: string;
}

// API Response Types
export interface ApiResponse<T> {
  data: T;
  success: boolean;
  message?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}