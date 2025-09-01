import { useState, useEffect } from 'react';
import { StickyChips, Chip } from '../../components/common/StickyChips';
import { InfiniteFeed, PageResponse } from '../../components/common/InfiniteFeed';
import { PageErrorBoundary } from '../../components/common/PageErrorBoundary';
import { PageHeaderSkeleton, FilterChipsSkeleton } from '../../components/common/LoadingSkeletons';
import { SkipLinks } from '../../components/ui/focus-management';
import { Landmark } from '../../components/ui/screen-reader';
import { useAccessibilityContext } from '../../providers/AccessibilityProvider';
import { ENV } from '../../lib/env';

const fallbackTags: Chip[] = [
  { id: 'all', label: 'All', value: 'all' },
  { id: 'live', label: 'Live', value: 'live' },
  { id: 'music', label: 'Music', value: 'music' },
  { id: 'gaming', label: 'Gaming', value: 'gaming' },
  { id: 'sports', label: 'Sports', value: 'sports' },
  { id: 'education', label: 'Education', value: 'education' },
  { id: 'tech', label: 'Tech', value: 'tech' },
  { id: 'crypto', label: 'Crypto', value: 'crypto' },
  { id: 'news', label: 'News', value: 'news' },
];

export default function Explore() {
  const [activeTag, setActiveTag] = useState('all');
  const [tags, setTags] = useState<Chip[]>(fallbackTags);
  const [isLoadingTags, setIsLoadingTags] = useState(true);
  const { updatePageTitle, announceToScreenReader } = useAccessibilityContext();

  // Update page title for screen readers
  useEffect(() => {
    updatePageTitle('Explore');
  }, [updatePageTitle]);

  // Announce filter changes to screen readers
  useEffect(() => {
    if (!isLoadingTags && activeTag) {
      const selectedTag = tags.find(tag => tag.value === activeTag);
      if (selectedTag) {
        announceToScreenReader(
          `Filtering by ${selectedTag.label}`, 
          'polite'
        );
      }
    }
  }, [activeTag, tags, isLoadingTags, announceToScreenReader]);

  // Fetch available tags from API
  useEffect(() => {
    const fetchTags = async () => {
      try {
        setIsLoadingTags(true);
        const response = await fetch(`${ENV.API_BASE}/explore/tags`);
        if (response.ok) {
          const data = await response.json();
          const apiTags: Chip[] = data.tags?.map((tag: any) => ({
            id: tag.id || tag.name.toLowerCase(),
            label: tag.name,
            value: tag.value || tag.name.toLowerCase(),
          })) || [];
          
          if (apiTags.length > 0) {
            setTags([{ id: 'all', label: 'All', value: 'all' }, ...apiTags]);
          }
        }
      } catch (error) {
        console.warn('Failed to fetch tags, using fallback:', error);
        // Keep fallback tags
      } finally {
        setIsLoadingTags(false);
      }
    };

    fetchTags();
  }, []);

  const fetchExploreVideos = async (page: number): Promise<PageResponse> => {
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '20',
        tag: activeTag === 'all' ? '' : activeTag,
      });

      const response = await fetch(`${ENV.API_BASE}/explore/videos?${params}`, {
        headers: {
          'Cache-Control': 'max-age=30', // 30-second cache for public content
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch explore videos');
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
      
      // Filter by tag if not 'all'
      let filteredVideos = mockVideos;
      if (activeTag !== 'all') {
        filteredVideos = mockVideos.filter(video => 
          video.tags?.some(tag => tag.toLowerCase().includes(activeTag.toLowerCase()))
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
    <PageErrorBoundary section="Explore Page" resetKeys={[activeTag]}>
      {/* Skip Links for keyboard navigation */}
      <SkipLinks 
        links={[
          { href: "#main-content", label: "Skip to main content" },
          { href: "#category-filters", label: "Skip to category filters" },
          { href: "#video-feed", label: "Skip to video feed" }
        ]}
      />

      <div className="min-h-screen">
        {/* Page Header */}
        <Landmark role="banner" className="container mx-auto px-4 py-6">
          <h1 
            id="page-title"
            className="text-2xl sm:text-3xl lg:text-4xl font-bold mb-2 text-responsive-xl"
          >
            Explore
          </h1>
          <p className="text-muted-foreground text-responsive-base">
            Discover new content by category and interest
          </p>
        </Landmark>

        {/* Tag Filter Chips */}
        <div id="category-filters">
          {isLoadingTags ? (
            <div 
              className="sticky top-0 z-30 bg-background/80 backdrop-blur-sm border-b px-4 py-3"
              role="status"
              aria-live="polite"
              aria-label="Loading category filters"
            >
              <FilterChipsSkeleton count={8} />
            </div>
          ) : (
            <StickyChips
              chips={tags}
              active={activeTag}
              onChange={setActiveTag}
              ariaLabel="Filter videos by category"
            />
          )}
        </div>

        {/* Video Feed */}
        <Landmark 
          role="main" 
          className="container mx-auto px-4 py-6"
          ariaLabelledBy="page-title"
        >
          <div id="video-feed">
            <PageErrorBoundary section="Explore Feed" resetKeys={[activeTag]}>
              <InfiniteFeed
                queryKey={['explore', activeTag]}
                fetchPage={fetchExploreVideos}
                emptyMessage="No videos found"
                emptyDescription="Try selecting a different category or check back later for new content."
                ariaLabel={`Videos in ${tags.find(t => t.value === activeTag)?.label || 'selected'} category`}
              />
            </PageErrorBoundary>
          </div>
        </Landmark>
      </div>
    </PageErrorBoundary>
  );
}