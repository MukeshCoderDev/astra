import { useState, useEffect } from 'react';
import { FeedList } from '../../components/feed';
import { mockApi } from '../../lib/mockData';
import { Video } from '../../types';

function Home() {
  const [videos, setVideos] = useState<Video[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [hasNextPage, setHasNextPage] = useState(false);
  const [page, setPage] = useState(1);
  const [error, setError] = useState<string | null>(null);

  const loadFeed = async (pageNum = 1, append = false) => {
    try {
      setIsLoading(true);
      setError(null);
      
      const response = await mockApi.getFeed(pageNum, 12);
      
      if (append) {
        setVideos(prev => [...prev, ...response.videos]);
      } else {
        setVideos(response.videos);
      }
      
      setHasNextPage(response.hasNext);
      setPage(pageNum);
    } catch (err) {
      setError('Failed to load content');
      console.error('Error loading feed:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleLoadMore = () => {
    if (!isLoading && hasNextPage) {
      loadFeed(page + 1, true);
    }
  };

  const handleRefresh = () => {
    setPage(1);
    loadFeed(1, false);
  };

  useEffect(() => {
    loadFeed();
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Home Feed</h1>
      </div>
      
      <FeedList
        videos={videos}
        isLoading={isLoading}
        hasNextPage={hasNextPage}
        onLoadMore={handleLoadMore}
        onRefresh={handleRefresh}
        layout="mixed"
        error={error}
      />
    </div>
  );
}

export default Home;