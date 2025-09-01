import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Loading } from '../../components/ui';
import { ControlRoomHeader } from '../../components/live/ControlRoomHeader';
import { StreamKeyCard } from '../../components/live/StreamKeyCard';
import { IngestEndpoints } from '../../components/live/IngestEndpoints';
import { HealthPanel } from '../../components/live/HealthPanel';
import { ModerationPanel } from '../../components/live/ModerationPanel';
import { SettingsPanel } from '../../components/live/SettingsPanel';
import { ThumbnailPicker } from '../../components/live/ThumbnailPicker';
import { LiveChat } from '../../components/chat/LiveChat';
import { useLiveControl } from '../../hooks/useLiveControl';
import { liveApi } from '../../lib/api';
import { Stream } from '../../types/live';
import { 
  ArrowLeft,
  AlertCircle
} from 'lucide-react';

interface ControlRoomProps {}

function ControlRoom({}: ControlRoomProps) {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  
  const [stream, setStream] = useState<Stream | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Live control hook for real-time updates
  const {
    healthMetrics,
    isConnected,
    connect,
    disconnect,
    goLive,
    endStream,
  } = useLiveControl(id || '');

  // Fetch stream data
  useEffect(() => {
    const fetchStream = async () => {
      if (!id) {
        setError('Stream ID is required');
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);
        
        const response = await liveApi.getCreatorStream(id);
        
        if (response.ok && response.data) {
          setStream(response.data);
        } else {
          setError(response.error || 'Failed to load stream');
        }
      } catch (err) {
        console.error('Error fetching stream:', err);
        setError('Failed to load stream');
      } finally {
        setLoading(false);
      }
    };

    fetchStream();
  }, [id]);

  // Connect to live control when stream is loaded
  useEffect(() => {
    if (stream && !isConnected) {
      connect();
    }
    
    return () => {
      if (isConnected) {
        disconnect();
      }
    };
  }, [stream, isConnected, connect, disconnect]);

  const handleBack = () => {
    navigate('/studio/live');
  };

  const handleGoLive = async () => {
    if (stream) {
      await goLive();
      // Update local stream status
      setStream(prev => prev ? { ...prev, status: 'live' } : null);
    }
  };

  const handleEndStream = async () => {
    if (stream) {
      await endStream();
      // Update local stream status
      setStream(prev => prev ? { ...prev, status: 'ended' } : null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <Loading />
      </div>
    );
  }

  if (error || !stream) {
    return (
      <div className="max-w-2xl mx-auto">
        <Card className="p-6">
          <div className="text-center">
            <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <h3 className="text-lg font-medium mb-2">Stream Not Found</h3>
            <p className="text-muted-foreground mb-4">
              {error || 'The requested stream could not be found.'}
            </p>
            <Button onClick={handleBack}>
              Back to Live Streams
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" onClick={handleBack}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div className="flex-1">
          <ControlRoomHeader
            stream={stream}
            onGoLive={handleGoLive}
            onEndStream={handleEndStream}
          />
        </div>
      </div>

      {/* Main Control Room Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Stream Setup */}
        <div className="lg:col-span-2 space-y-6">
          {/* Stream Keys */}
          <StreamKeyCard stream={stream} />
          
          {/* Ingest Endpoints */}
          <IngestEndpoints stream={stream} />
          
          {/* Thumbnail Picker */}
          <ThumbnailPicker streamId={stream.id} currentPoster={stream.poster} />
          
          {/* Settings Panel */}
          <SettingsPanel stream={stream} />
        </div>

        {/* Right Column - Monitoring & Chat */}
        <div className="space-y-6">
          {/* Health Monitoring */}
          <HealthPanel 
            streamId={stream.id}
            metrics={healthMetrics}
            isConnected={isConnected}
          />
          
          {/* Moderation Panel */}
          <ModerationPanel streamId={stream.id} />
          
          {/* Live Chat (Creator View) */}
          {stream.status === 'live' && (
            <Card className="p-4">
              <h3 className="font-medium mb-4">Live Chat</h3>
              <div className="h-96">
                <LiveChat 
                  streamId={stream.id} 
                  isCreator={true}
                />
              </div>
            </Card>
          )}
        </div>
      </div>

      {/* Connection Status */}
      {!isConnected && (
        <Card className="p-4 border-amber-200 bg-amber-50 dark:bg-amber-900/20">
          <div className="flex items-center gap-2 text-amber-600 dark:text-amber-400">
            <AlertCircle className="h-4 w-4" />
            <span className="text-sm">
              Reconnecting to control room... Some features may be limited.
            </span>
          </div>
        </Card>
      )}
    </div>
  );
}

export default ControlRoom;