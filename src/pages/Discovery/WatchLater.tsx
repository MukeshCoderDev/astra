import { InfiniteFeed, PageResponse } from '../../components/common/InfiniteFeed';
import { ENV } from '../../lib/env';

export default function WatchLater() {
  const fetchWatchLaterVideos = async (page: number): Promise<PageResponse> => {
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '20',
      });

      const response = await fetch(`${ENV.API_BASE}/bff/watch-later?${params}`, {
        cache: 'no-store', // Always fetch fresh data for personalized content
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch watch later videos');
      }

      const data = await response.json();
      return {
        items: data.videos || [],
        nextPage: page,
        hasMore: data.hasMore || false,
      };
    } catch (error) {
      console.warn('API call failed, using mock data:', error);
      
      // Fallback to mock data - simulate some videos in watch later
      const { mockVideos } = await import('../../lib/mockData');
      
      // Take first few videos as "watch later" items
      const watchLaterVideos = mockVideos.slice(0, 6).map(video => ({
        ...video,
        watchLater: true
      }));
      
      // Simulate pagination
      const startIndex = (page - 1) * 20;
      const endIndex = startIndex + 20;
      const pageVideos = watchLaterVideos.slice(startIndex, endIndex);
      
      return {
        items: pageVideos,
        nextPage: page,
        hasMore: endIndex < watchLaterVideos.length,
      };
    }
  };

  return (
    <div className="min-h-screen">
      {/* Page Header */}
      <div className="container mx-auto px-4 py-6">
        <h1 className="text-2xl font-bold mb-2">Watch Later</h1>
        <p className="text-muted-foreground">
          Videos you've saved to watch later
        </p>
      </div>

      {/* Video Feed */}
      <div className="container mx-auto px-4">
        <InfiniteFeed
          queryKey={['watch-later']}
          fetchPage={fetchWatchLaterVideos}
          emptyMessage="No videos saved"
          emptyDescription="Save videos to your Watch Later list to easily find them here."
        />
      </div>
    </div>
  );
}