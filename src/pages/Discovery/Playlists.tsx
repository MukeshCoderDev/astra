import { useNavigate } from 'react-router-dom';
import { Button } from '../../components/ui/button';
import { PlaylistCard } from '../../components/common/PlaylistCard';
import { Plus, RefreshCw, AlertCircle } from 'lucide-react';
import { ENV } from '../../lib/env';
import { useQuery } from '@tanstack/react-query';
import { Loading } from '../../components/ui/loading';
import { usePlaylists } from '../../hooks/usePlaylists';
import type { Playlist } from '../../types';

export default function Playlists() {
  const navigate = useNavigate();
  const { isCreating } = usePlaylists();

  const { data: playlists, isLoading, error, refetch } = useQuery({
    queryKey: ['playlists'],
    queryFn: async () => {
      try {
        const response = await fetch(`${ENV.API_BASE}/bff/playlists`, {
          cache: 'no-store',
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`,
          },
        });

        if (!response.ok) {
          throw new Error('Failed to fetch playlists');
        }

        const data = await response.json();
        return data.playlists || [];
      } catch (error) {
        console.warn('API call failed, using mock data:', error);
        
        // Fallback to mock playlists
        const { mockVideos } = await import('../../lib/mockData');
        
        return [
          {
            id: 'playlist-1',
            title: 'Favorite Cartoons',
            videoCount: 8,
            updatedAt: new Date().toISOString(),
            cover: mockVideos[0].poster,
          },
          {
            id: 'playlist-2',
            title: 'Tech Tutorials',
            videoCount: 5,
            updatedAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
            cover: mockVideos[6].poster,
          },
          {
            id: 'playlist-3',
            title: 'Watch Later',
            videoCount: 12,
            updatedAt: new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString(),
            cover: mockVideos[2].poster,
          },
        ];
      }
    },
    staleTime: 0, // Always fetch fresh for personalized content
    retry: 2,
  });

  const handleCreatePlaylist = () => {
    navigate('/playlists/new');
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-2xl font-bold mb-2">Your Playlists</h1>
              <p className="text-muted-foreground">
                Organize your favorite videos into collections
              </p>
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="animate-pulse">
                <div className="aspect-video bg-gray-200 dark:bg-gray-700 rounded-lg mb-3" />
                <div className="space-y-2">
                  <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4" />
                  <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/2" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="min-h-screen">
        <div className="container mx-auto px-4 py-6">
          <div className="flex flex-col items-center justify-center py-12">
            <AlertCircle className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">Something went wrong</h3>
            <p className="text-muted-foreground text-center mb-4 max-w-md">
              {error.message || "Failed to load your playlists. Please try again."}
            </p>
            <Button onClick={() => refetch()} variant="outline" className="gap-2">
              <RefreshCw className="h-4 w-4" />
              Try again
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      {/* Page Header */}
      <div className="container mx-auto px-4 py-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold mb-2">Your Playlists</h1>
            <p className="text-muted-foreground">
              Organize your favorite videos into collections
            </p>
          </div>
          
          <Button onClick={handleCreatePlaylist} disabled={isCreating} className="gap-2">
            <Plus className="h-4 w-4" />
            Create playlist
          </Button>
        </div>

        {/* Playlists Grid */}
        {playlists && playlists.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {playlists.map((playlist: Playlist) => (
              <PlaylistCard key={playlist.id} playlist={playlist} />
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-12">
            <div className="text-6xl mb-4">📝</div>
            <h3 className="text-lg font-semibold mb-2">No playlists yet</h3>
            <p className="text-muted-foreground text-center mb-4 max-w-md">
              Create your first playlist to organize videos you want to watch together.
            </p>
            <Button onClick={handleCreatePlaylist} className="gap-2">
              <Plus className="h-4 w-4" />
              Create your first playlist
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}