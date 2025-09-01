import { useState, useEffect } from 'react';
import { useParams, Navigate } from 'react-router-dom';
import LivePlayer from '../../components/live/LivePlayer';
import { LiveChat } from '../../components/chat/LiveChat';
import LiveTipTicker from '../../components/live/LiveTipTicker';
import { Loading } from '../../components/ui';
import { ENV } from '../../lib/env';
import { mockApi } from '../../lib/mockData';
import { useStreamStatus } from '../../hooks/useStreamStatus';
import type { Stream } from '../../types/live';

function LiveWatch() {
  const { id } = useParams<{ id: string }>();
  const [stream, setStream] = useState<Stream | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [playerKey, setPlayerKey] = useState(0); // Force player reinitialization

  // Get real-time stream status updates
  const { status: liveStatus } = useStreamStatus(id || '', stream?.status);

  const loadStream = async () => {
    if (!id) return;

    try {
      setIsLoading(true);
      setError(null);
      
      const streamData = await mockApi.getLiveStream(id);
      
      if (!streamData) {
        setError('Stream not found');
        return;
      }

      setStream(streamData);
    } catch (err) {
      setError('Failed to load stream');
      console.error('Error loading stream:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (ENV.LIVE_ENABLED) {
      loadStream();
    } else {
      setIsLoading(false);
    }
  }, [id]);

  // Update stream status when live status changes
  useEffect(() => {
    if (stream && liveStatus !== stream.status) {
      setStream(prev => prev ? { ...prev, status: liveStatus } : null);
      // Force player reinitialization when status changes
      setPlayerKey(prev => prev + 1);
    }
  }, [liveStatus, stream?.status]);

  // Redirect if live streaming is disabled
  if (!ENV.LIVE_ENABLED) {
    return <Navigate to="/" replace />;
  }

  // Show loading state
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <Loading />
      </div>
    );
  }

  // Show error state
  if (error || !stream) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="text-center">
          <h2 className="text-xl font-semibold mb-2">
            {error === 'Stream not found' ? 'Stream Not Found' : 'Error Loading Stream'}
          </h2>
          <p className="text-neutral-600 mb-4">
            {error === 'Stream not found' 
              ? 'This stream does not exist or is no longer available.'
              : error || 'Failed to load stream data.'
            }
          </p>
          <button 
            onClick={loadStream}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  const isLive = stream.status === 'live';
  const isPreview = stream.status === 'preview';
  const isEnded = stream.status === 'ended';

  return (
    <div className="max-w-7xl mx-auto px-4 py-6">
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-3 space-y-4">
          {/* Video Player */}
          <div className="relative">
            {isLive && stream.hlsUrl ? (
              <>
                <LivePlayer
                  key={playerKey}
                  src={stream.hlsUrl}
                  poster={stream.poster}
                  dvrWindowSec={stream.dvrWindowSec}
                  streamId={stream.id}
                  className="w-full"
                />
                {/* Tip Ticker Overlay */}
                <LiveTipTicker 
                  streamId={stream.id}
                  className="absolute top-4 left-4 right-4 z-10"
                  position="top"
                />
              </>
            ) : (
              <div className="relative aspect-video bg-neutral-900 rounded-lg overflow-hidden flex items-center justify-center">
                {stream.poster && (
                  <img 
                    src={stream.poster} 
                    alt={stream.title}
                    className="absolute inset-0 w-full h-full object-cover"
                  />
                )}
                <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                  <div className="text-center text-white">
                    {isPreview && (
                      <>
                        <div className="text-2xl mb-2">📺</div>
                        <h3 className="text-lg font-semibold mb-1">Stream will start soon</h3>
                        <p className="text-sm opacity-80">
                          {stream.startAt 
                            ? `Scheduled for ${new Date(stream.startAt).toLocaleString()}`
                            : 'The creator will start streaming shortly'
                          }
                        </p>
                      </>
                    )}
                    {isEnded && (
                      <>
                        <div className="text-2xl mb-2">📴</div>
                        <h3 className="text-lg font-semibold mb-1">Stream ended</h3>
                        <p className="text-sm opacity-80">This live stream has finished</p>
                      </>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Stream Info */}
          <div className="space-y-3">
            <h1 className="text-2xl font-bold">{stream.title}</h1>
            <div className="flex items-center gap-4 text-sm text-neutral-600">
              <span className="flex items-center gap-1">
                <span className="font-medium">@{stream.creator.handle}</span>
              </span>
              {stream.viewers !== undefined && (
                <span className="flex items-center gap-1">
                  <span>{stream.viewers.toLocaleString()}</span>
                  <span>{isLive ? 'watching' : 'viewers'}</span>
                </span>
              )}
              {isLive && (
                <span className="flex items-center gap-1">
                  <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></span>
                  <span className="text-red-600 font-medium">LIVE</span>
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Chat Sidebar */}
        <div className="lg:col-span-1">
          <div className="sticky top-4">
            <LiveChat 
              streamId={stream.id}
              className="h-[600px]"
              isCreator={false}
              isModerator={false}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

export default LiveWatch;