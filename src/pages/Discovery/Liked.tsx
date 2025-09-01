import { InfiniteFeed, PageResponse } from '../../components/common/InfiniteFeed';
import { ENV } from '../../lib/env';

export default function Liked() {
  const fetchLikedVideos = async (page: number): Promise<PageResponse> => {
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '20',
      });

      const response = await fetch(`${ENV.API_BASE}/bff/liked?${params}`, {
        cache: 'no-store', // Always fetch fresh data for personalized content
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch liked videos');
      }

      const data = await response.json();
      return {
        items: data.videos || [],
        nextPage: page,
        hasMore: data.hasMore || false,
      };
    } catch (error) {
      console.warn('API call failed, using mock data:', error);
      
      // Fallback to mock data - simulate some liked videos
      const { mockVideos } = await import('../../lib/mockData');
      
      // Take videos with high likes as "liked" items
      const likedVideos = mockVideos
        .filter(video => video.likes > 30000)
        .map(video => ({
          ...video,
          liked: true
        }));
      
      // Simulate pagination
      const startIndex = (page - 1) * 20;
      const endIndex = startIndex + 20;
      const pageVideos = likedVideos.slice(startIndex, endIndex);
      
      return {
        items: pageVideos,
        nextPage: page,
        hasMore: endIndex < likedVideos.length,
      };
    }
  };

  return (
    <div className="min-h-screen">
      {/* Page Header */}
      <div className="container mx-auto px-4 py-6">
        <h1 className="text-2xl font-bold mb-2">Liked Videos</h1>
        <p className="text-muted-foreground">
          Videos you've liked and enjoyed
        </p>
      </div>

      {/* Video Feed */}
      <div className="container mx-auto px-4">
        <InfiniteFeed
          queryKey={['liked-videos']}
          fetchPage={fetchLikedVideos}
          emptyMessage="No liked videos"
          emptyDescription="Like videos to save them to this collection for easy access later."
        />
      </div>
    </div>
  );
}