import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ShortsPlayer } from '../../components/player/ShortsPlayer';
import { FeedList } from '../../components/feed';
import { mockApi } from '../../lib/mockData';
import { Video } from '../../types';
import { Loading } from '../../components/ui/loading';

function Shorts() {
  const { videoId } = useParams();
  const navigate = useNavigate();
  const [shorts, setShorts] = useState<Video[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadShorts = async () => {
      try {
        setIsLoading(true);
        setError(null);
        
        const shortsData = await mockApi.getShorts();
        setShorts(shortsData);

        // If a specific video ID is provided, find its index
        if (videoId) {
          const index = shortsData.findIndex(video => video.id === videoId);
          if (index !== -1) {
            setCurrentIndex(index);
          } else {
            // Video not found, redirect to first short
            if (shortsData.length > 0) {
              navigate(`/shorts/${shortsData[0].id}`, { replace: true });
            }
          }
        }
      } catch (err) {
        setError('Failed to load shorts');
        console.error('Error loading shorts:', err);
      } finally {
        setIsLoading(false);
      }
    };

    loadShorts();
  }, [videoId, navigate]);

  const handleIndexChange = (newIndex: number) => {
    if (newIndex >= 0 && newIndex < shorts.length) {
      setCurrentIndex(newIndex);
      navigate(`/shorts/${shorts[newIndex].id}`, { replace: true });
    }
  };

  if (isLoading) {
    return (
      <div className="h-screen flex items-center justify-center bg-black">
        <Loading size="lg" className="text-white" />
      </div>
    );
  }

  if (error || shorts.length === 0) {
    return (
      <div className="h-screen flex flex-col items-center justify-center bg-black text-white">
        <div className="text-center mb-8">
          <h2 className="text-xl font-semibold mb-2">
            {error || 'No shorts available'}
          </h2>
          <p className="text-white/70">
            {error ? 'Please try again later' : 'Check back soon for new content'}
          </p>
        </div>
      </div>
    );
  }

  // If no specific video ID, show shorts grid
  if (!videoId) {
    return (
      <div className="container mx-auto px-4 py-6">
        <div className="mb-6">
          <h1 className="text-2xl font-semibold mb-2">Shorts</h1>
          <p className="text-muted-foreground">
            Quick, engaging videos under 60 seconds
          </p>
        </div>
        
        <FeedList
          videos={shorts}
          layout="grid"
          className="grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6"
        />
      </div>
    );
  }

  // Show full-screen shorts player
  return (
    <ShortsPlayer
      videos={shorts}
      currentIndex={currentIndex}
      onIndexChange={handleIndexChange}
    />
  );
}

export default Shorts;