import { Video, Creator, KYCVerification, PayoutRecord, PayoutSettings } from '../types';

// Mock creators
const mockCreators: Creator[] = [
  {
    id: '1',
    handle: 'techguru',
    displayName: 'Tech Guru',
    avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop&crop=face',
    verified: true,
    followerCount: 125000,
    totalViews: 2500000,
    bio: 'Teaching technology and programming to everyone! Passionate about React, TypeScript, and Web3 development.',
    kycStatus: 'approved'
  },
  {
    id: '2',
    handle: 'creativemind',
    displayName: 'Creative Mind',
    avatar: 'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=100&h=100&fit=crop&crop=face',
    verified: false,
    followerCount: 45000,
    totalViews: 890000,
    bio: 'Exploring the intersection of art and code. Digital artist and creative developer sharing tutorials and inspiration.',
    kycStatus: 'pending'
  },
  {
    id: '3',
    handle: 'fitnesscoach',
    displayName: 'Fitness Coach',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop&crop=face',
    verified: true,
    followerCount: 78000,
    totalViews: 1200000,
    bio: 'Certified personal trainer helping you achieve your fitness goals. Full body workouts, nutrition tips, and motivation!',
    kycStatus: 'approved'
  },
  {
    id: '4',
    handle: 'artlover',
    displayName: 'Art Lover',
    avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100&h=100&fit=crop&crop=face',
    verified: false,
    followerCount: 32000,
    totalViews: 450000,
    kycStatus: 'approved'
  }
];

// Mock videos
export const mockVideos: Video[] = [
  {
    id: '1',
    title: 'Building a Modern React App with TypeScript',
    description: 'Learn how to build a production-ready React application with TypeScript, including best practices and advanced patterns.',
    hlsUrl: 'https://example.com/video1.m3u8',
    poster: 'https://images.unsplash.com/photo-1633356122544-f134324a6cee?w=640&h=360&fit=crop',
    durationSec: 1245,
    durationLabel: '20:45',
    views: 45230,
    likes: 1250,
    tips: 89,
    createdAt: '2024-01-15T10:30:00Z',
    updatedAt: '2024-01-15T10:30:00Z',
    creator: mockCreators[0],
    tags: ['react', 'typescript', 'tutorial'],
    visibility: 'public',
    type: 'long',
    forensicWatermark: false,
    adultContent: false
  },
  {
    id: '2',
    title: 'Quick Design Tips',
    description: 'Essential design principles in 60 seconds',
    hlsUrl: 'https://example.com/video2.m3u8',
    poster: 'https://images.unsplash.com/photo-1558655146-9f40138edfeb?w=360&h=640&fit=crop',
    durationSec: 58,
    durationLabel: '0:58',
    views: 12450,
    likes: 890,
    tips: 23,
    createdAt: '2024-01-14T15:20:00Z',
    updatedAt: '2024-01-14T15:20:00Z',
    creator: mockCreators[1],
    tags: ['design', 'tips', 'short'],
    visibility: 'public',
    type: 'short',
    forensicWatermark: false,
    adultContent: false
  },
  {
    id: '3',
    title: 'Full Body Workout Routine',
    description: 'Complete 30-minute full body workout that you can do at home with no equipment needed.',
    hlsUrl: 'https://example.com/video3.m3u8',
    poster: 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=640&h=360&fit=crop',
    durationSec: 1800,
    durationLabel: '30:00',
    views: 78900,
    likes: 2340,
    tips: 156,
    createdAt: '2024-01-13T08:00:00Z',
    updatedAt: '2024-01-13T08:00:00Z',
    creator: mockCreators[2],
    tags: ['fitness', 'workout', 'health'],
    visibility: 'public',
    type: 'long',
    forensicWatermark: false,
    adultContent: false
  },
  {
    id: '4',
    title: 'Art Technique Demo',
    description: 'Quick watercolor technique',
    hlsUrl: 'https://example.com/video4.m3u8',
    poster: 'https://images.unsplash.com/photo-1513475382585-d06e58bcb0e0?w=360&h=640&fit=crop',
    durationSec: 45,
    durationLabel: '0:45',
    views: 8760,
    likes: 567,
    tips: 34,
    createdAt: '2024-01-12T14:30:00Z',
    updatedAt: '2024-01-12T14:30:00Z',
    creator: mockCreators[3],
    tags: ['art', 'watercolor', 'tutorial'],
    visibility: 'public',
    type: 'short',
    forensicWatermark: false,
    adultContent: false
  },
  {
    id: '5',
    title: 'Advanced JavaScript Concepts',
    description: 'Deep dive into closures, prototypes, and async programming patterns in JavaScript.',
    hlsUrl: 'https://example.com/video5.m3u8',
    poster: 'https://images.unsplash.com/photo-1627398242454-45a1465c2479?w=640&h=360&fit=crop',
    durationSec: 2145,
    durationLabel: '35:45',
    views: 34560,
    likes: 1890,
    tips: 234,
    createdAt: '2024-01-11T16:45:00Z',
    updatedAt: '2024-01-11T16:45:00Z',
    creator: mockCreators[0],
    tags: ['javascript', 'programming', 'advanced'],
    visibility: 'public',
    type: 'long',
    forensicWatermark: false,
    adultContent: false
  },
  {
    id: '6',
    title: 'Morning Motivation',
    description: 'Start your day right!',
    hlsUrl: 'https://example.com/video6.m3u8',
    poster: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=360&h=640&fit=crop',
    durationSec: 30,
    durationLabel: '0:30',
    views: 15670,
    likes: 1200,
    tips: 67,
    createdAt: '2024-01-10T06:00:00Z',
    updatedAt: '2024-01-10T06:00:00Z',
    creator: mockCreators[2],
    tags: ['motivation', 'morning', 'lifestyle'],
    visibility: 'public',
    type: 'short',
    forensicWatermark: false,
    adultContent: false
  }
];

// Mock KYC data
export const mockKYCData: KYCVerification = {
  status: 'approved',
  documentType: 'drivers_license',
  verificationDate: '2024-01-10T00:00:00Z',
  expiryDate: '2025-01-10T00:00:00Z',
  modelReleaseStatus: 'signed'
};

// Mock payout data
export const mockPayouts: PayoutRecord[] = [
  {
    id: '1',
    amount: 500.00,
    currency: 'USDC',
    status: 'completed',
    requestedAt: '2024-01-15T10:00:00Z',
    processedAt: '2024-01-16T14:30:00Z',
    transactionHash: '0x1234567890abcdef1234567890abcdef12345678',
    walletAddress: '0xabcdef1234567890abcdef1234567890abcdef12',
    fees: 5.00,
    netAmount: 495.00
  },
  {
    id: '2',
    amount: 250.00,
    currency: 'USDC',
    status: 'processing',
    requestedAt: '2024-01-18T09:15:00Z',
    walletAddress: '0xabcdef1234567890abcdef1234567890abcdef12',
    fees: 2.50,
    netAmount: 247.50
  },
  {
    id: '3',
    amount: 100.00,
    currency: 'USDC',
    status: 'failed',
    requestedAt: '2024-01-12T16:20:00Z',
    walletAddress: '0xabcdef1234567890abcdef1234567890abcdef12',
    fees: 1.00,
    netAmount: 99.00
  }
];

export const mockPayoutSettings: PayoutSettings = {
  minimumPayout: 50.00,
  estimatedFees: 2.50,
  processingTime: '1-3 business days'
};

// Mock API functions
export const mockApi = {
  getFeed: async (page = 1, limit = 20): Promise<{ videos: Video[]; hasNext: boolean }> => {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 500));
    
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    const videos = mockVideos.slice(startIndex, endIndex);
    
    return {
      videos,
      hasNext: endIndex < mockVideos.length
    };
  },

  getVideoById: async (id: string): Promise<Video | null> => {
    await new Promise(resolve => setTimeout(resolve, 300));
    return mockVideos.find(video => video.id === id) || null;
  },

  searchVideos: async (query: string): Promise<Video[]> => {
    await new Promise(resolve => setTimeout(resolve, 400));
    return mockVideos.filter(video => 
      video.title.toLowerCase().includes(query.toLowerCase()) ||
      video.description.toLowerCase().includes(query.toLowerCase()) ||
      video.tags.some(tag => tag.toLowerCase().includes(query.toLowerCase()))
    );
  },

  getShorts: async (): Promise<Video[]> => {
    await new Promise(resolve => setTimeout(resolve, 300));
    return mockVideos.filter(video => video.type === 'short');
  }
};