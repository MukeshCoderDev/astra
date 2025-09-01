import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Button } from '../../components/ui/button';
import { VideoCard } from '../../components/feed/VideoCard';
import { ArrowLeft, Play, Trash2, RefreshCw, AlertCircle } from 'lucide-react';
import { ENV } from '../../lib/env';
import { Loading } from '../../components/ui/loading';
import { usePlaylists } from '../../hooks/usePlaylists';
import type { Playlist } from '../../types';

export default function PlaylistDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { removeVideoFromPlaylist, isRemoving } = usePlaylists();

  const { data: playlist, isLoading, error, refetch } = useQuery({
    queryKey: ['playlist', id],
    queryFn: async () => {
      try {
        const response = await fetch(`${ENV.API_BASE}/bff/playlists/${id}`, {
          cache: 'no-store',
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`,
          },
        });

        if (!response.ok) {
          throw new Error('Failed to fetch playlist');
        }

        const data = await response.json();
        return data.playlist;
      } catch (error) {
        console.warn('API call failed, using mock data:', error);
        
        // Fallback to mock playlist data
        const { mockVideos } = await import('../../lib/mockData');
        
        // Create mock playlist based on ID
        const mockPlaylists = {
          'playlist-1': {
            id: 'playlist-1',
            title: 'Favorite Cartoons',
            videoCount: 8,
            updatedAt: new Date().toISOString(),
            cover: mockVideos[0].poster,
            items: mockVideos.filter(v => v.tags.some(tag => 
              ['adventure-time', 'steven-universe', 'regular-show', 'gumball', 'powerpuff-girls', 'scooby-doo', 'tom-jerry', 'courage'].includes(tag)
            )),
          },
          'playlist-2': {
            id: 'playlist-2',
            title: 'Tech Tutorials',
            videoCount: 5,
            updatedAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
            cover: mockVideos[6].poster,
            items: mockVideos.filter(v => v.tags.some(tag => 
              ['react', 'typescript', 'tutorial'].includes(tag)
            )),
          },
          'playlist-3': {
            id: 'playlist-3',
            title: 'Watch Later',
            videoCount: 12,
            updatedAt: new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString(),
            cover: mockVideos[2].poster,
            items: mockVideos.slice(0, 6),
          },
        };
        
        return mockPlaylists[id as keyof typeof mockPlaylists] || {
          id: id || 'unknown',
          title: 'Unknown Playlist',
          videoCount: 0,
          updatedAt: new Date().toISOString(),
          items: [],
        };
      }
    },
    enabled: !!id,
    staleTime: 0, // Always fetch fresh for personalized content
    retry: 2,
  });

  const handlePlayAll = () => {
    if (playlist?.items && playlist.items.length > 0) {
      navigate(`/watch/${playlist.items[0].id}?playlist=${id}`);
    }
  };

  const handleRemoveVideo = (videoId: string) => {
    if (id) {
      removeVideoFromPlaylist(id, videoId);
    }
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center gap-4 mb-6">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate('/playlists')}
              className="gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Back
            </Button>
          </div>
          <div className="flex flex-col lg:flex-row gap-6">
            <div className="lg:w-80 flex-shrink-0">
              <div className="aspect-video bg-gray-200 dark:bg-gray-700 rounded-lg mb-4 animate-pulse" />
              <div className="space-y-2">
                <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-3/4 animate-pulse" />
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2 animate-pulse" />
              </div>
            </div>
            <div className="flex-1">
              <div className="space-y-4">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="flex gap-4 p-4 animate-pulse">
                    <div className="w-8 h-4 bg-gray-200 dark:bg-gray-700 rounded" />
                    <div className="w-40 aspect-video bg-gray-200 dark:bg-gray-700 rounded" />
                    <div className="flex-1 space-y-2">
                      <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4" />
                      <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/2" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Error state
  if (error || !playlist) {
    return (
      <div className="min-h-screen">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center gap-4 mb-6">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate('/playlists')}
              className="gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Back
            </Button>
          </div>
          <div className="flex flex-col items-center justify-center py-12">
            <AlertCircle className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">Something went wrong</h3>
            <p className="text-muted-foreground text-center mb-4 max-w-md">
              {error?.message || "Failed to load playlist. Please try again."}
            </p>
            <div className="flex gap-2">
              <Button onClick={() => refetch()} variant="outline" className="gap-2">
                <RefreshCw className="h-4 w-4" />
                Try again
              </Button>
              <Button onClick={() => navigate('/playlists')}>
                Back to playlists
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <div className="container mx-auto px-4 py-6">
        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate('/playlists')}
            className="gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Back
          </Button>
        </div>

        {/* Playlist Info */}
        <div className="flex flex-col lg:flex-row gap-6 mb-8">
          <div className="lg:w-80 flex-shrink-0">
            <div className="aspect-video bg-gradient-to-br from-primary/20 to-primary/5 rounded-lg flex items-center justify-center mb-4">
              {playlist.cover ? (
                <img 
                  src={playlist.cover} 
                  alt={playlist.title}
                  className="w-full h-full object-cover rounded-lg"
                />
              ) : (
                <Play className="h-12 w-12 text-primary" />
              )}
            </div>
            
            <h1 className="text-2xl font-bold mb-2">{playlist.title}</h1>
            <p className="text-muted-foreground mb-4">
              {playlist.videoCount} videos
            </p>
            
            {playlist.items && playlist.items.length > 0 && (
              <Button onClick={handlePlayAll} className="w-full gap-2 mb-2">
                <Play className="h-4 w-4" />
                Play all
              </Button>
            )}
          </div>

          {/* Videos List */}
          <div className="flex-1">
            {playlist.items && playlist.items.length > 0 ? (
              <div className="space-y-4">
                {playlist.items.map((video, index) => (
                  <div key={video.id} className="flex gap-4 p-4 rounded-lg border hover:bg-accent/50 transition-colors">
                    <div className="flex-shrink-0 w-8 text-center text-sm text-muted-foreground">
                      {index + 1}
                    </div>
                    <div className="flex-1">
                      <VideoCard video={video} layout="list" />
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleRemoveVideo(video.id)}
                      disabled={isRemoving}
                      className="flex-shrink-0 text-destructive hover:text-destructive hover:bg-destructive/10"
                      title="Remove from playlist"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-12">
                <div className="text-6xl mb-4">📝</div>
                <h3 className="text-lg font-semibold mb-2">Empty playlist</h3>
                <p className="text-muted-foreground text-center max-w-md">
                  This playlist doesn't have any videos yet. Add some videos to get started.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}