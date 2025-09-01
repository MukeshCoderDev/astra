import { useState, useEffect } from 'react';
import { StickyChips, Chip } from '../../components/common/StickyChips';
import { InfiniteFeed, PageResponse } from '../../components/common/InfiniteFeed';
import { Button } from '../../components/ui/button';
import { ChevronDown } from 'lucide-react';
import { ENV } from '../../lib/env';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '../../components/ui/dropdown-menu';

const timeWindows: Chip[] = [
  { id: 'now', label: 'Now', value: 'now' },
  { id: '24h', label: '24h', value: '24h' },
  { id: 'week', label: 'This week', value: 'week' },
];

interface Region {
  code: string;
  name: string;
}

export default function Trending() {
  const [activeTimeWindow, setActiveTimeWindow] = useState('now');
  const [selectedRegion, setSelectedRegion] = useState(ENV.DEFAULT_REGION || 'US');
  const [regions, setRegions] = useState<Region[]>([
    { code: 'US', name: 'United States' },
    { code: 'GB', name: 'United Kingdom' },
    { code: 'CA', name: 'Canada' },
  ]);

  // Fetch available regions from API
  useEffect(() => {
    const fetchRegions = async () => {
      try {
        const response = await fetch(`${ENV.API_BASE}/trending/regions`);
        if (response.ok) {
          const data = await response.json();
          if (data.regions && data.regions.length > 0) {
            setRegions(data.regions);
          }
        }
      } catch (error) {
        console.warn('Failed to fetch regions, using fallback:', error);
        // Keep fallback regions
      }
    };

    fetchRegions();
  }, []);

  const fetchTrendingVideos = async (page: number): Promise<PageResponse> => {
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '20',
        timeWindow: activeTimeWindow,
        region: selectedRegion,
      });

      const response = await fetch(`${ENV.API_BASE}/trending/videos?${params}`, {
        headers: {
          'Cache-Control': 'max-age=30', // 30-second cache for public content
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch trending videos');
      }

      const data = await response.json();
      return {
        items: data.videos || [],
        nextPage: page,
        hasMore: data.hasMore || false,
      };
    } catch (error) {
      console.warn('API call failed, using mock data:', error);
      
      // Fallback to mock data
      const { mockVideos } = await import('../../lib/mockData');
      
      // Sort by views for trending (highest first)
      const trendingVideos = [...mockVideos].sort((a, b) => b.views - a.views);
      
      // Simulate pagination
      const startIndex = (page - 1) * 20;
      const endIndex = startIndex + 20;
      const pageVideos = trendingVideos.slice(startIndex, endIndex);
      
      return {
        items: pageVideos,
        nextPage: page,
        hasMore: endIndex < trendingVideos.length,
      };
    }
  };

  const selectedRegionName = regions.find(r => r.code === selectedRegion)?.name || selectedRegion;

  return (
    <div className="min-h-screen">
      {/* Page Header */}
      <div className="container mx-auto px-4 py-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-2xl font-bold mb-2">Trending</h1>
            <p className="text-muted-foreground">
              Popular videos in {selectedRegionName}
            </p>
          </div>
          
          {/* Region Selector */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="gap-2">
                {selectedRegionName}
                <ChevronDown className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              {regions.map((region) => (
                <DropdownMenuItem
                  key={region.code}
                  onClick={() => setSelectedRegion(region.code)}
                  className={selectedRegion === region.code ? 'bg-accent' : ''}
                >
                  {region.name}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Time Window Filter Chips */}
      <StickyChips
        chips={timeWindows}
        active={activeTimeWindow}
        onChange={setActiveTimeWindow}
      />

      {/* Video Feed */}
      <div className="container mx-auto px-4 py-6">
        <InfiniteFeed
          queryKey={['trending', activeTimeWindow, selectedRegion]}
          fetchPage={fetchTrendingVideos}
          emptyMessage="No trending videos"
          emptyDescription="Check back later for trending content in your region."
        />
      </div>
    </div>
  );
}