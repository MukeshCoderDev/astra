import { Video, Creator, KYCVerification, PayoutRecord, PayoutSettings } from '../types';
import type { Stream, LiveFeedResponse } from '../types/live';

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
  },
  {
    id: '5',
    handle: 'animationstudio',
    displayName: 'Animation Studio',
    avatar: 'https://images.unsplash.com/photo-1513475382585-d06e58bcb0e0?w=100&h=100&fit=crop&crop=face',
    verified: true,
    followerCount: 890000,
    totalViews: 15000000,
    bio: 'Professional animation studio creating original cartoon content and educational animations for all ages.',
    kycStatus: 'approved'
  },
  {
    id: '6',
    handle: 'cartoonnetwork',
    displayName: 'Cartoon Network',
    avatar: 'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=100&h=100&fit=crop&crop=face',
    verified: true,
    followerCount: 2500000,
    totalViews: 50000000,
    bio: 'Official Cartoon Network channel featuring your favorite animated shows and characters!',
    kycStatus: 'approved'
  }
];

// Mock videos
export const mockVideos: Video[] = [
  {
    id: '1',
    title: 'Adventure Time: Finn & Jake\'s Epic Quest',
    description: 'Join Finn and Jake on their most epic adventure yet! Explore the Land of Ooo in this action-packed episode full of friendship and fun.',
    hlsUrl: 'https://demo.unified-streaming.com/k8s/features/stable/video/tears-of-steel/tears-of-steel.ism/.m3u8',
    poster: 'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=640&h=360&fit=crop',
    durationSec: 1245,
    durationLabel: '20:45',
    views: 1250000,
    likes: 45000,
    tips: 2890,
    createdAt: '2024-01-15T10:30:00Z',
    updatedAt: '2024-01-15T10:30:00Z',
    creator: mockCreators[5],
    tags: ['adventure-time', 'cartoon', 'animation'],
    visibility: 'public',
    type: 'long',
    forensicWatermark: false,
    adultContent: false
  },
  {
    id: '2',
    title: 'Steven Universe: Gem Fusion Tutorial',
    description: 'Learn about the magical world of gem fusion with Steven and the Crystal Gems!',
    hlsUrl: 'https://bitdash-a.akamaihd.net/content/sintel/hls/playlist.m3u8',
    poster: 'https://images.unsplash.com/photo-1513475382585-d06e58bcb0e0?w=640&h=360&fit=crop',
    durationSec: 1680,
    durationLabel: '28:00',
    views: 890000,
    likes: 32000,
    tips: 1560,
    createdAt: '2024-01-14T15:20:00Z',
    updatedAt: '2024-01-14T15:20:00Z',
    creator: mockCreators[5],
    tags: ['steven-universe', 'gems', 'magic'],
    visibility: 'public',
    type: 'long',
    forensicWatermark: false,
    adultContent: false
  },
  {
    id: '3',
    title: 'Regular Show: Mordecai & Rigby\'s Pranks',
    description: 'The best pranks and hilarious moments from Mordecai and Rigby at the park!',
    hlsUrl: 'https://demo.unified-streaming.com/k8s/features/stable/video/tears-of-steel/tears-of-steel.ism/.m3u8',
    poster: 'https://images.unsplash.com/photo-1558655146-9f40138edfeb?w=640&h=360&fit=crop',
    durationSec: 1320,
    durationLabel: '22:00',
    views: 2100000,
    likes: 78000,
    tips: 4200,
    createdAt: '2024-01-13T08:00:00Z',
    updatedAt: '2024-01-13T08:00:00Z',
    creator: mockCreators[5],
    tags: ['regular-show', 'comedy', 'pranks'],
    visibility: 'public',
    type: 'long',
    forensicWatermark: false,
    adultContent: false
  },
  {
    id: '4',
    title: 'Ben 10: Alien Transformation',
    description: 'Watch Ben transform into his most powerful aliens!',
    hlsUrl: 'https://bitdash-a.akamaihd.net/content/sintel/hls/playlist.m3u8',
    poster: 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=360&h=640&fit=crop',
    durationSec: 45,
    durationLabel: '0:45',
    views: 567000,
    likes: 23000,
    tips: 890,
    createdAt: '2024-01-12T14:30:00Z',
    updatedAt: '2024-01-12T14:30:00Z',
    creator: mockCreators[5],
    tags: ['ben-10', 'aliens', 'transformation'],
    visibility: 'public',
    type: 'short',
    forensicWatermark: false,
    adultContent: false
  },
  {
    id: '5',
    title: 'The Amazing World of Gumball: School Chaos',
    description: 'Gumball and Darwin cause mayhem at Elmore Junior High in this hilarious episode!',
    hlsUrl: 'https://demo.unified-streaming.com/k8s/features/stable/video/tears-of-steel/tears-of-steel.ism/.m3u8',
    poster: 'https://images.unsplash.com/photo-1627398242454-45a1465c2479?w=640&h=360&fit=crop',
    durationSec: 1380,
    durationLabel: '23:00',
    views: 1800000,
    likes: 65000,
    tips: 3400,
    createdAt: '2024-01-11T16:45:00Z',
    updatedAt: '2024-01-11T16:45:00Z',
    creator: mockCreators[5],
    tags: ['gumball', 'school', 'comedy'],
    visibility: 'public',
    type: 'long',
    forensicWatermark: false,
    adultContent: false
  },
  {
    id: '6',
    title: 'Teen Titans GO! Dance Battle',
    description: 'Epic dance battle between the Teen Titans!',
    hlsUrl: 'https://bitdash-a.akamaihd.net/content/sintel/hls/playlist.m3u8',
    poster: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=360&h=640&fit=crop',
    durationSec: 30,
    durationLabel: '0:30',
    views: 890000,
    likes: 34000,
    tips: 1200,
    createdAt: '2024-01-10T06:00:00Z',
    updatedAt: '2024-01-10T06:00:00Z',
    creator: mockCreators[5],
    tags: ['teen-titans', 'dance', 'superhero'],
    visibility: 'public',
    type: 'short',
    forensicWatermark: false,
    adultContent: false
  },
  {
    id: '7',
    title: 'Building a Modern React App with TypeScript',
    description: 'Learn how to build a production-ready React application with TypeScript, including best practices and advanced patterns.',
    hlsUrl: 'https://demo.unified-streaming.com/k8s/features/stable/video/tears-of-steel/tears-of-steel.ism/.m3u8',
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
    id: '8',
    title: 'PowerPuff Girls: Saving Townsville',
    description: 'Blossom, Bubbles, and Buttercup team up to save Townsville from Mojo Jojo!',
    hlsUrl: 'https://bitdash-a.akamaihd.net/content/sintel/hls/playlist.m3u8',
    poster: 'https://images.unsplash.com/photo-1558655146-9f40138edfeb?w=360&h=640&fit=crop',
    durationSec: 58,
    durationLabel: '0:58',
    views: 1200000,
    likes: 45000,
    tips: 2300,
    createdAt: '2024-01-14T15:20:00Z',
    updatedAt: '2024-01-14T15:20:00Z',
    creator: mockCreators[5],
    tags: ['powerpuff-girls', 'superhero', 'action'],
    visibility: 'public',
    type: 'short',
    forensicWatermark: false,
    adultContent: false
  },
  {
    id: '9',
    title: 'Scooby-Doo: Mystery Solving 101',
    description: 'Join Scooby and the gang as they solve another spooky mystery with teamwork and Scooby Snacks!',
    hlsUrl: 'https://demo.unified-streaming.com/k8s/features/stable/video/tears-of-steel/tears-of-steel.ism/.m3u8',
    poster: 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=640&h=360&fit=crop',
    durationSec: 1800,
    durationLabel: '30:00',
    views: 1500000,
    likes: 67000,
    tips: 3400,
    createdAt: '2024-01-13T08:00:00Z',
    updatedAt: '2024-01-13T08:00:00Z',
    creator: mockCreators[5],
    tags: ['scooby-doo', 'mystery', 'adventure'],
    visibility: 'public',
    type: 'long',
    forensicWatermark: false,
    adultContent: false
  },
  {
    id: '10',
    title: 'Tom & Jerry: Classic Chase',
    description: 'The timeless cat and mouse chase that never gets old!',
    hlsUrl: 'https://bitdash-a.akamaihd.net/content/sintel/hls/playlist.m3u8',
    poster: 'https://images.unsplash.com/photo-1513475382585-d06e58bcb0e0?w=360&h=640&fit=crop',
    durationSec: 45,
    durationLabel: '0:45',
    views: 2800000,
    likes: 89000,
    tips: 5600,
    createdAt: '2024-01-12T14:30:00Z',
    updatedAt: '2024-01-12T14:30:00Z',
    creator: mockCreators[5],
    tags: ['tom-jerry', 'classic', 'comedy'],
    visibility: 'public',
    type: 'short',
    forensicWatermark: false,
    adultContent: false
  },
  {
    id: '11',
    title: 'Dexter\'s Laboratory: Science Experiment',
    description: 'Dexter conducts his most ambitious scientific experiment yet, but will Dee Dee ruin it?',
    hlsUrl: 'https://demo.unified-streaming.com/k8s/features/stable/video/tears-of-steel/tears-of-steel.ism/.m3u8',
    poster: 'https://images.unsplash.com/photo-1627398242454-45a1465c2479?w=640&h=360&fit=crop',
    durationSec: 2145,
    durationLabel: '35:45',
    views: 980000,
    likes: 34000,
    tips: 1890,
    createdAt: '2024-01-11T16:45:00Z',
    updatedAt: '2024-01-11T16:45:00Z',
    creator: mockCreators[5],
    tags: ['dexters-lab', 'science', 'experiment'],
    visibility: 'public',
    type: 'long',
    forensicWatermark: false,
    adultContent: false
  },
  {
    id: '12',
    title: 'Courage the Cowardly Dog: Spooky Adventure',
    description: 'Courage faces his fears to protect Muriel and Eustace!',
    hlsUrl: 'https://bitdash-a.akamaihd.net/content/sintel/hls/playlist.m3u8',
    poster: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=360&h=640&fit=crop',
    durationSec: 30,
    durationLabel: '0:30',
    views: 756000,
    likes: 28000,
    tips: 1200,
    createdAt: '2024-01-10T06:00:00Z',
    updatedAt: '2024-01-10T06:00:00Z',
    creator: mockCreators[5],
    tags: ['courage', 'spooky', 'adventure'],
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

// Mock live streams
export const mockLiveStreams: Stream[] = [
  {
    id: 'live-1',
    title: 'Building a React Live Streaming App',
    poster: 'https://images.unsplash.com/photo-1633356122544-f134324a6cee?w=640&h=360&fit=crop',
    viewers: 1247,
    status: 'live',
    creator: {
      id: '1',
      handle: 'techguru',
    },
    hlsUrl: 'https://demo.unified-streaming.com/k8s/features/stable/video/tears-of-steel/tears-of-steel.ism/.m3u8',
    dvrWindowSec: 3600,
    viewerCount: 1247,
  },
  {
    id: 'live-2',
    title: 'Digital Art Creation Process',
    poster: 'https://images.unsplash.com/photo-1541961017774-22349e4a1262?w=640&h=360&fit=crop',
    viewers: 892,
    status: 'live',
    creator: {
      id: '2',
      handle: 'creativemind',
    },
    hlsUrl: 'https://bitdash-a.akamaihd.net/content/sintel/hls/playlist.m3u8',
    dvrWindowSec: 1800,
    viewerCount: 892,
  },
  {
    id: 'live-3',
    title: 'Morning Workout Session',
    poster: 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=640&h=360&fit=crop',
    viewers: 2156,
    status: 'live',
    creator: {
      id: '3',
      handle: 'fitnesscoach',
    },
    hlsUrl: 'https://demo.unified-streaming.com/k8s/features/stable/video/tears-of-steel/tears-of-steel.ism/.m3u8',
    dvrWindowSec: 7200,
    viewerCount: 2156,
  },
];

export const mockUpcomingStreams: Stream[] = [
  {
    id: 'upcoming-1',
    title: 'Advanced TypeScript Patterns',
    poster: 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=640&h=360&fit=crop',
    scheduled: true,
    startAt: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString(), // 2 hours from now
    status: 'preview',
    creator: {
      id: '1',
      handle: 'techguru',
    },
  },
  {
    id: 'upcoming-2',
    title: 'Watercolor Painting Tutorial',
    poster: 'https://images.unsplash.com/photo-1513475382585-d06e58bcb0e0?w=640&h=360&fit=crop',
    scheduled: true,
    startAt: new Date(Date.now() + 4 * 60 * 60 * 1000).toISOString(), // 4 hours from now
    status: 'preview',
    creator: {
      id: '4',
      handle: 'artlover',
    },
  },
  {
    id: 'live-3',
    title: 'Morning Workout Session',
    poster: 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=640&h=360&fit=crop',
    viewers: 2156,
    status: 'live', // Changed from 'preview' to 'live'
    creator: {
      id: '3',
      handle: 'fitnesscoach',
    },
    hlsUrl: 'https://demo.unified-streaming.com/k8s/features/stable/video/tears-of-steel/tears-of-steel.ism/.m3u8',
    dvrWindowSec: 7200, // 2 hours DVR window
    viewerCount: 2156,
  },
];

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
  },

  getLiveFeed: async (): Promise<LiveFeedResponse> => {
    await new Promise(resolve => setTimeout(resolve, 400));
    return {
      now: mockLiveStreams,
      upcoming: mockUpcomingStreams
    };
  },

  getLiveStream: async (id: string): Promise<Stream | null> => {
    await new Promise(resolve => setTimeout(resolve, 300));
    const allStreams = [...mockLiveStreams, ...mockUpcomingStreams];
    return allStreams.find(stream => stream.id === id) || null;
  }
};