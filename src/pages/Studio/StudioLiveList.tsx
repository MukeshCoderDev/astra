import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import { LiveBadge } from '../../components/live/LiveBadge';
import { Loading } from '../../components/ui';
import { liveApi } from '../../lib/api';
import { Stream } from '../../types/live';
import { ENV } from '../../lib/env';
import { 
  Plus,
  Calendar,
  Users,
  Eye,
  Settings,
  Play
} from 'lucide-react';

interface StudioLiveListProps {}

function StudioLiveList({}: StudioLiveListProps) {
  const navigate = useNavigate();
  const [streams, setStreams] = useState<Stream[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch creator's streams
  useEffect(() => {
    const fetchStreams = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // API call to get creator's streams
        const response = await liveApi.getCreatorStreams();
        
        if (response.ok && response.data) {
          setStreams(response.data);
        } else {
          setError(response.error || 'Failed to load streams');
        }
      } catch (err) {
        console.error('Error fetching streams:', err);
        setError('Failed to load streams');
      } finally {
        setLoading(false);
      }
    };

    fetchStreams();
  }, []);

  const handleNewStream = () => {
    navigate('/studio/live/new');
  };

  const handleStreamClick = (stream: Stream) => {
    navigate(`/studio/live/${stream.id}`);
  };

  const handleScheduleStream = () => {
    navigate('/studio/live/new?scheduled=true');
  };

  const getStatusColor = (status: Stream['status']) => {
    switch (status) {
      case 'live':
        return 'bg-red-500';
      case 'preview':
        return 'bg-amber-500';
      case 'ended':
        return 'bg-gray-500';
      default:
        return 'bg-gray-500';
    }
  };

  const getStatusText = (status: Stream['status']) => {
    switch (status) {
      case 'live':
        return 'LIVE';
      case 'preview':
        return 'PREVIEW';
      case 'ended':
        return 'ENDED';
      default:
        return 'UNKNOWN';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <Loading />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Live Streams</h1>
          <p className="text-muted-foreground">
            Manage your live streams and create new broadcasts
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" onClick={handleScheduleStream} className="gap-2">
            <Calendar className="h-4 w-4" />
            Schedule
          </Button>
          <Button onClick={handleNewStream} className="gap-2">
            <Plus className="h-4 w-4" />
            New Stream
          </Button>
        </div>
      </div>

      {/* Error State */}
      {error && (
        <Card className="p-6">
          <div className="text-center">
            <div className="text-red-500 mb-2">Error loading streams</div>
            <p className="text-muted-foreground">{error}</p>
            <Button 
              variant="outline" 
              onClick={() => window.location.reload()} 
              className="mt-4"
            >
              Retry
            </Button>
          </div>
        </Card>
      )}

      {/* Empty State */}
      {!error && streams.length === 0 && (
        <Card className="p-12">
          <div className="text-center">
            <div className="w-16 h-16 bg-muted/50 rounded-full flex items-center justify-center mx-auto mb-4">
              <Play className="h-8 w-8 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-medium mb-2">No live streams yet</h3>
            <p className="text-muted-foreground mb-6">
              Create your first live stream to start broadcasting to your audience
            </p>
            <div className="flex items-center justify-center gap-3">
              <Button onClick={handleNewStream} className="gap-2">
                <Plus className="h-4 w-4" />
                Create Stream
              </Button>
              <Button variant="outline" onClick={handleScheduleStream} className="gap-2">
                <Calendar className="h-4 w-4" />
                Schedule Stream
              </Button>
            </div>
          </div>
        </Card>
      )}

      {/* Streams Grid */}
      {streams.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {streams.map((stream) => (
            <Card 
              key={stream.id} 
              className="overflow-hidden cursor-pointer hover:shadow-lg transition-shadow"
              onClick={() => handleStreamClick(stream)}
            >
              {/* Stream Poster */}
              <div className="relative aspect-video bg-muted">
                {stream.poster ? (
                  <img 
                    src={stream.poster} 
                    alt={stream.title}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <Play className="h-12 w-12 text-muted-foreground" />
                  </div>
                )}
                
                {/* Status Badge */}
                <div className="absolute top-3 left-3">
                  <LiveBadge 
                    isLive={stream.status === 'live'} 
                    isUpcoming={stream.status === 'preview'}
                  />
                </div>

                {/* Viewer Count */}
                {stream.status === 'live' && stream.viewerCount !== undefined && (
                  <div className="absolute top-3 right-3 bg-black/70 text-white px-2 py-1 rounded text-sm flex items-center gap-1">
                    <Users className="h-3 w-3" />
                    {stream.viewerCount.toLocaleString()}
                  </div>
                )}
              </div>

              {/* Stream Info */}
              <div className="p-4">
                <div className="flex items-start justify-between mb-2">
                  <h3 className="font-medium line-clamp-2 flex-1">{stream.title}</h3>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleStreamClick(stream);
                    }}
                    className="ml-2 shrink-0"
                  >
                    <Settings className="h-4 w-4" />
                  </Button>
                </div>

                {/* Stream Metadata */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm text-muted-foreground">
                    <span>Status</span>
                    <Badge 
                      variant="secondary" 
                      className={`${getStatusColor(stream.status)} text-white`}
                    >
                      {getStatusText(stream.status)}
                    </Badge>
                  </div>

                  {stream.scheduled && stream.startAt && (
                    <div className="flex items-center justify-between text-sm text-muted-foreground">
                      <span>Scheduled</span>
                      <span>{new Date(stream.startAt).toLocaleString()}</span>
                    </div>
                  )}

                  {stream.status === 'ended' && stream.viewers !== undefined && (
                    <div className="flex items-center justify-between text-sm text-muted-foreground">
                      <span>Peak Viewers</span>
                      <div className="flex items-center gap-1">
                        <Eye className="h-3 w-3" />
                        {stream.viewers.toLocaleString()}
                      </div>
                    </div>
                  )}

                  {stream.dvrWindowSec && (
                    <div className="flex items-center justify-between text-sm text-muted-foreground">
                      <span>DVR Window</span>
                      <span>{Math.floor(stream.dvrWindowSec / 3600)}h</span>
                    </div>
                  )}
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Quick Actions */}
      {streams.length > 0 && (
        <Card className="p-6">
          <h3 className="font-medium mb-4">Quick Actions</h3>
          <div className="flex flex-wrap gap-3">
            <Button variant="outline" onClick={handleNewStream} className="gap-2">
              <Plus className="h-4 w-4" />
              New Stream
            </Button>
            <Button variant="outline" onClick={handleScheduleStream} className="gap-2">
              <Calendar className="h-4 w-4" />
              Schedule Stream
            </Button>
            <Button variant="outline" onClick={() => navigate('/studio')} className="gap-2">
              <Settings className="h-4 w-4" />
              Studio Settings
            </Button>
          </div>
        </Card>
      )}
    </div>
  );
}

export default StudioLiveList;