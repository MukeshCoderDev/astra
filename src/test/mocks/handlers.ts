import { http, HttpResponse } from 'msw';
import { mockVideos, mockCreators, mockWalletBalance, mockTipTransactions } from './mockData';

const API_BASE = 'https://bff.example.com';

export const handlers = [
  // Auth endpoints
  http.get(`${API_BASE}/auth/me`, () => {
    return HttpResponse.json({
      id: 'user-1',
      handle: 'testuser',
      displayName: 'Test User',
      avatar: 'https://example.com/avatar.jpg',
      verified: false,
      followerCount: 100,
      totalViews: 1000,
      kycStatus: 'approved',
    });
  }),

  // Video endpoints
  http.get(`${API_BASE}/videos`, ({ request }) => {
    const url = new URL(request.url);
    const page = parseInt(url.searchParams.get('page') || '1');
    const limit = parseInt(url.searchParams.get('limit') || '10');
    const type = url.searchParams.get('type');
    
    let videos = mockVideos;
    if (type) {
      videos = videos.filter(v => v.type === type);
    }
    
    const start = (page - 1) * limit;
    const end = start + limit;
    const paginatedVideos = videos.slice(start, end);
    
    return HttpResponse.json({
      videos: paginatedVideos,
      hasMore: end < videos.length,
      total: videos.length,
    });
  }),

  http.get(`${API_BASE}/videos/:id`, ({ params }) => {
    const video = mockVideos.find(v => v.id === params.id);
    if (!video) {
      return new HttpResponse(null, { status: 404 });
    }
    return HttpResponse.json(video);
  }),

  // Search endpoint
  http.get(`${API_BASE}/search`, ({ request }) => {
    const url = new URL(request.url);
    const query = url.searchParams.get('q') || '';
    const filteredVideos = mockVideos.filter(v => 
      v.title.toLowerCase().includes(query.toLowerCase()) ||
      v.description.toLowerCase().includes(query.toLowerCase())
    );
    
    return HttpResponse.json({
      videos: filteredVideos,
      creators: mockCreators.filter(c => 
        c.handle.toLowerCase().includes(query.toLowerCase()) ||
        c.displayName.toLowerCase().includes(query.toLowerCase())
      ),
    });
  }),

  // Wallet endpoints
  http.get(`${API_BASE}/wallet/balance`, () => {
    return HttpResponse.json(mockWalletBalance);
  }),

  http.get(`${API_BASE}/wallet/transactions`, () => {
    return HttpResponse.json({
      transactions: mockTipTransactions,
      hasMore: false,
    });
  }),

  // Tip endpoint
  http.post(`${API_BASE}/tips`, async ({ request }) => {
    const body = await request.json() as any;
    const newTip = {
      id: `tip-${Date.now()}`,
      amount: body.amount,
      currency: 'USDC',
      videoId: body.videoId,
      creatorId: body.creatorId,
      timestamp: new Date().toISOString(),
      status: 'completed' as const,
    };
    
    return HttpResponse.json(newTip);
  }),

  // Upload endpoints
  http.post(`${API_BASE}/uploads/initiate`, () => {
    return HttpResponse.json({
      uploadId: `upload-${Date.now()}`,
      tusUrl: 'https://upload.example.com/files/upload-123',
    });
  }),

  http.post(`${API_BASE}/uploads/complete`, async ({ request }) => {
    const body = await request.json() as any;
    return HttpResponse.json({
      videoId: `video-${Date.now()}`,
      status: 'processing',
      ...body,
    });
  }),

  // Profile endpoints
  http.get(`${API_BASE}/profiles/:handle`, ({ params }) => {
    const creator = mockCreators.find(c => c.handle === params.handle);
    if (!creator) {
      return new HttpResponse(null, { status: 404 });
    }
    return HttpResponse.json(creator);
  }),

  http.post(`${API_BASE}/profiles/:handle/follow`, ({ params }) => {
    return HttpResponse.json({
      following: true,
      followerCount: 101,
    });
  }),

  http.delete(`${API_BASE}/profiles/:handle/follow`, ({ params }) => {
    return HttpResponse.json({
      following: false,
      followerCount: 99,
    });
  }),

  // Comments endpoints
  http.get(`${API_BASE}/videos/:videoId/comments`, ({ params }) => {
    return HttpResponse.json({
      comments: [
        {
          id: 'comment-1',
          content: 'Great video!',
          author: {
            id: 'user-2',
            handle: 'commenter',
            displayName: 'Commenter',
            avatar: 'https://example.com/avatar2.jpg',
          },
          createdAt: new Date().toISOString(),
          likes: 5,
          replies: [],
        },
      ],
      hasMore: false,
    });
  }),

  http.post(`${API_BASE}/videos/:videoId/comments`, async ({ request }) => {
    const body = await request.json() as any;
    return HttpResponse.json({
      id: `comment-${Date.now()}`,
      content: body.content,
      author: {
        id: 'user-1',
        handle: 'testuser',
        displayName: 'Test User',
        avatar: 'https://example.com/avatar.jpg',
      },
      createdAt: new Date().toISOString(),
      likes: 0,
      replies: [],
    });
  }),

  // Studio endpoints
  http.get(`${API_BASE}/studio/analytics`, () => {
    return HttpResponse.json({
      totalEarnings: 1250.50,
      monthlyEarnings: 350.25,
      totalViews: 15000,
      monthlyViews: 3500,
      totalVideos: 25,
      avgViewsPerVideo: 600,
    });
  }),

  http.get(`${API_BASE}/studio/content`, () => {
    return HttpResponse.json({
      videos: mockVideos.slice(0, 5),
      hasMore: false,
    });
  }),

  // KYC endpoints
  http.get(`${API_BASE}/kyc/status`, () => {
    return HttpResponse.json({
      status: 'approved',
      documentType: 'drivers_license',
      verificationDate: '2024-01-15T10:00:00Z',
      expiryDate: '2025-01-15T10:00:00Z',
      modelReleaseStatus: 'signed',
    });
  }),

  // Compliance endpoints
  http.post(`${API_BASE}/reports`, async ({ request }) => {
    const body = await request.json() as any;
    return HttpResponse.json({
      id: `report-${Date.now()}`,
      status: 'pending',
      ...body,
    });
  }),

  // Live streaming endpoints
  http.get(`${API_BASE}/live/feed`, () => {
    return HttpResponse.json({
      now: [
        {
          id: 'stream-1',
          title: 'Live Gaming Session',
          poster: 'https://example.com/poster1.jpg',
          viewers: 1250,
          status: 'live',
          creator: {
            id: 'creator-1',
            handle: 'gamer123',
          },
          hlsUrl: 'https://cdn.example.com/stream1.m3u8',
          dvrWindowSec: 300,
        },
        {
          id: 'stream-2',
          title: 'Cooking Show',
          poster: 'https://example.com/poster2.jpg',
          viewers: 850,
          status: 'live',
          creator: {
            id: 'creator-2',
            handle: 'chef_master',
          },
          hlsUrl: 'https://cdn.example.com/stream2.m3u8',
        },
      ],
      upcoming: [
        {
          id: 'stream-3',
          title: 'Music Performance',
          poster: 'https://example.com/poster3.jpg',
          scheduled: true,
          startAt: new Date(Date.now() + 3600000).toISOString(),
          status: 'preview',
          creator: {
            id: 'creator-3',
            handle: 'musician_pro',
          },
        },
      ],
    });
  }),

  http.get(`${API_BASE}/live/streams/:id`, ({ params }) => {
    const streamId = params.id;
    
    const mockStreams = {
      'stream-1': {
        id: 'stream-1',
        title: 'Live Gaming Session',
        poster: 'https://example.com/poster1.jpg',
        viewers: 1250,
        status: 'live',
        creator: {
          id: 'creator-1',
          handle: 'gamer123',
        },
        hlsUrl: 'https://cdn.example.com/stream1.m3u8',
        dvrWindowSec: 300,
      },
      'stream-2': {
        id: 'stream-2',
        title: 'Cooking Show',
        poster: 'https://example.com/poster2.jpg',
        viewers: 850,
        status: 'live',
        creator: {
          id: 'creator-2',
          handle: 'chef_master',
        },
        hlsUrl: 'https://cdn.example.com/stream2.m3u8',
      },
    };

    const stream = mockStreams[streamId as keyof typeof mockStreams];
    if (!stream) {
      return new HttpResponse(null, { status: 404 });
    }
    
    return HttpResponse.json(stream);
  }),

  http.get(`${API_BASE}/live/streams/:id/chat`, ({ request, params }) => {
    const url = new URL(request.url);
    const since = parseInt(url.searchParams.get('since') || '0');
    
    const mockMessages = [
      {
        id: 'msg-1',
        user: { id: 'user-1', handle: 'viewer1' },
        text: 'Great stream!',
        ts: Math.floor(Date.now() / 1000) - 60,
      },
      {
        id: 'msg-2',
        user: { id: 'user-2', handle: 'viewer2' },
        text: 'Love this content',
        ts: Math.floor(Date.now() / 1000) - 30,
        pinned: true,
      },
    ];

    // Filter messages newer than 'since' timestamp
    const filteredMessages = mockMessages.filter(msg => msg.ts > since);
    
    return HttpResponse.json(filteredMessages);
  }),

  http.post(`${API_BASE}/live/streams/:id/chat`, async ({ request, params }) => {
    const body = await request.json() as any;
    
    return HttpResponse.json({
      id: `msg-${Date.now()}`,
      user: { id: 'user-1', handle: 'testuser' },
      text: body.text,
      ts: Math.floor(Date.now() / 1000),
    });
  }),

  http.post(`${API_BASE}/analytics/metrics`, async ({ request }) => {
    const body = await request.json() as any;
    return HttpResponse.json({ success: true });
  }),

  // Error simulation endpoints for testing
  http.get(`${API_BASE}/error/500`, () => {
    return new HttpResponse(null, { status: 500 });
  }),

  http.get(`${API_BASE}/error/404`, () => {
    return new HttpResponse(null, { status: 404 });
  }),

  http.get(`${API_BASE}/error/network`, () => {
    return HttpResponse.error();
  }),
];