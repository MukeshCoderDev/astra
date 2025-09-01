"use client";

import { Link } from 'react-router-dom';
import { useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import ShortsViewer from '../../components/shorts/ShortsViewer';
import { mockApi } from '../../lib/mockData';
import { Video } from '../../types';

function Shorts() {
  const { videoId } = useParams();

  const { data, isLoading, error } = useQuery({
    queryKey: ["shorts-list"],
    queryFn: async () => {
      try {
        // Try the API endpoint first
        const response = await fetch(`${process.env.REACT_APP_API_BASE}/bff/shorts`, { cache: "no-store" });
        if (!response.ok) {
          throw new Error('API endpoint not available');
        }
        return await response.json();
      } catch (err) {
        // Fallback to mock data
        console.log('Using mock data for shorts');
        const items = await mockApi.getShorts();
        return { items };
      }
    }
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-64px)]">
        <div className="text-center space-y-2">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="text-sm opacity-70">Loading shorts...</p>
        </div>
      </div>
    );
  }
  
  if (error || !data?.items) {
    return (
      <div className="flex flex-col items-center justify-center h-[calc(100vh-64px)] space-y-4">
        <h2 className="text-xl font-semibold">Unable to Load Shorts</h2>
        <p className="text-sm opacity-70">There was an error loading the shorts content.</p>
        <button 
          onClick={() => window.location.reload()} 
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors"
        >
          Try Again
        </button>
      </div>
    );
  }

  if (data.items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-[calc(100vh-64px)] space-y-4">
        <h2 className="text-xl font-semibold">No Shorts Available</h2>
        <p className="text-sm opacity-70">There are no shorts to display at the moment.</p>
        <Link 
          to="/" 
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors"
        >
          Go to Home
        </Link>
      </div>
    );
  }

  // If no specific video ID, show shorts grid
  if (!videoId) {
    return (
      <div className="space-y-4">
        <h1 className="text-2xl font-semibold">Shorts</h1>
        <p className="text-sm opacity-70">Quick, engaging videos under 60 seconds</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {data.items.map((v: Video) => (
            <Link key={v.id} to={`/shorts/${v.id}`} className="block">
              {/* Keep your existing card UI here (thumbnail, duration, creator) */}
              <div className="relative aspect-[9/16] rounded-lg overflow-hidden bg-neutral-900">
                <img src={v.poster} alt={v.title} className="w-full h-full object-cover" />
                <span className="absolute top-2 right-2 text-xs bg-black/70 text-white rounded px-1.5 py-0.5">{v.durationLabel}</span>
                <div className="absolute bottom-0 left-0 right-0 p-2 text-sm bg-gradient-to-t from-black/70 to-transparent">
                  <div className="line-clamp-1">{v.title}</div>
                  <div className="text-xs opacity-80">@{v.creator.handle}</div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    );
  }

  // Check if the videoId exists in the items
  const videoExists = data.items.some((item: Video) => item.id === videoId);
  if (!videoExists) {
    return (
      <div className="flex flex-col items-center justify-center h-[calc(100vh-64px)] space-y-4">
        <h2 className="text-xl font-semibold">Video Not Found</h2>
        <p className="text-sm opacity-70">The requested video could not be found.</p>
        <Link 
          to="/shorts" 
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors"
        >
          Back to Shorts
        </Link>
      </div>
    );
  }

  // Show full-screen shorts viewer
  return <ShortsViewer items={data.items} initialId={videoId} />;
}

export default Shorts;