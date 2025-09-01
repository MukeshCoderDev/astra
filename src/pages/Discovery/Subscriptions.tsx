import { useState } from 'react';
import { StickyChips, Chip } from '../../components/common/StickyChips';
import { InfiniteFeed, PageResponse } from '../../components/common/InfiniteFeed';
import { ENV } from '../../lib/env';

const timeFilters: Chip[] = [
  { id: 'all', label: 'All', value: 'all' },
  { id: 'today', label: 'Today', value: 'today' },
  { id: 'week', label: 'This week', value: 'week' },
];

export default function Subscriptions() {
  const [activeFilter, setActiveFilter] = useState('all');

  const fetchSubscriptionVideos = async (page: number): Promise<PageResponse> => {
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '20',
        timeFilter: activeFilter,
      });

      const response = await fetch(`${ENV.API_BASE}/subscriptions/feed?${params}`, {
        cache: 'no-store', // Always fetch fresh data for personalized content
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch subscription videos');
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
      
      // Filter by time if needed
      let filteredVideos = mockVideos;
      if (activeFilter === 'today') {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        filteredVideos = mockVideos.filter(video => 
          new Date(video.createdAt) >= today
        );
      } else if (activeFilter === 'week') {
        const weekAgo = new Date();
        weekAgo.setDate(weekAgo.getDate() - 7);
        filteredVideos = mockVideos.filter(video => 
          new Date(video.createdAt) >= weekAgo
        );
      }
      
      // Simulate pagination
      const startIndex = (page - 1) * 20;
      const endIndex = startIndex + 20;
      const pageVideos = filteredVideos.slice(startIndex, endIndex);
      
      return {
        items: pageVideos,
        nextPage: page,
        hasMore: endIndex < filteredVideos.length,
      };
    }
  };

  return (
    <div className="min-h-screen">
      {/* Page Header */}
      <div className="container mx-auto px-4 py-6">
        <h1 className="text-2xl font-bold mb-2">Subscriptions</h1>
        <p className="text-muted-foreground">
          Latest videos from creators you follow
        </p>
      </div>

      {/* Filter Chips */}
      <StickyChips
        chips={timeFilters}
        active={activeFilter}
        onChange={setActiveFilter}
      />

      {/* Video Feed */}
      <div className="container mx-auto px-4 py-6">
        <InfiniteFeed
          queryKey={['subscriptions', activeFilter]}
          fetchPage={fetchSubscriptionVideos}
          emptyMessage="No subscription videos"
          emptyDescription="Subscribe to creators to see their latest videos here."
        />
      </div>
    </div>
  );
}