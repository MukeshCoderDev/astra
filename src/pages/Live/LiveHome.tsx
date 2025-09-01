import { useState, useEffect } from 'react';
import { LiveCard } from '../../components/live';
import { Loading } from '../../components/ui';
import { ENV } from '../../lib/env';
import { mockApi } from '../../lib/mockData';
import type { Stream } from '../../types/live';

function LiveHome() {
  const [liveStreams, setLiveStreams] = useState<Stream[]>([]);
  const [upcomingStreams, setUpcomingStreams] = useState<Stream[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadLiveFeed = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const response = await mockApi.getLiveFeed();
      
      setLiveStreams(response.now);
      setUpcomingStreams(response.upcoming);
    } catch (err) {
      setError('Failed to load live streams');
      console.error('Error loading live feed:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    // Only load if live streaming is enabled
    if (ENV.LIVE_ENABLED) {
      loadLiveFeed();
    } else {
      setIsLoading(false);
    }
  }, []);

  // If live streaming is disabled, show feature not available
  if (!ENV.LIVE_ENABLED) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="text-center">
          <h2 className="text-xl font-semibold mb-2">Live Streaming Not Available</h2>
          <p className="text-neutral-600">Live streaming features are currently disabled.</p>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-semibold">Live</h1>
        </div>
        <div className="flex items-center justify-center min-h-[50vh]">
          <Loading />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-semibold">Live</h1>
        </div>
        <div className="flex items-center justify-center min-h-[50vh]">
          <div className="text-center">
            <h2 className="text-xl font-semibold mb-2">Error Loading Streams</h2>
            <p className="text-neutral-600 mb-4">{error}</p>
            <button 
              onClick={loadLiveFeed}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  const hasLiveStreams = liveStreams.length > 0;
  const hasUpcomingStreams = upcomingStreams.length > 0;

  if (!hasLiveStreams && !hasUpcomingStreams) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-semibold">Live</h1>
        </div>
        <div className="flex items-center justify-center min-h-[50vh]">
          <div className="text-center">
            <h2 className="text-xl font-semibold mb-2">No Live Streams</h2>
            <p className="text-neutral-600">There are no live or upcoming streams at the moment.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Live</h1>
      </div>

      {/* Live Now Section */}
      {hasLiveStreams && (
        <section>
          <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
            <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></span>
            Live now
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {liveStreams.map((stream) => (
              <LiveCard 
                key={stream.id} 
                stream={stream}
                showViewers={true}
                showCreator={true}
              />
            ))}
          </div>
        </section>
      )}

      {/* Upcoming Section */}
      {hasUpcomingStreams && (
        <section>
          <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
            <span className="w-2 h-2 bg-amber-500 rounded-full"></span>
            Upcoming
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {upcomingStreams.map((stream) => (
              <LiveCard 
                key={stream.id} 
                stream={stream}
                showViewers={false}
                showCreator={true}
              />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

export default LiveHome;