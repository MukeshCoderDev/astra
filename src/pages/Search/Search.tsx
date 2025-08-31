import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { FeedList } from '../../components/feed';
import { Input } from '../../components/ui/input';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import { Search as SearchIcon, X, Filter } from 'lucide-react';
import { mockApi } from '../../lib/mockData';
import { Video } from '../../types';

function Search() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [query, setQuery] = useState(searchParams.get('q') || '');
  const [results, setResults] = useState<Video[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [selectedFilter, setSelectedFilter] = useState<'all' | 'long' | 'short'>('all');

  const popularSearches = [
    'React tutorial',
    'Fitness workout',
    'Art techniques',
    'JavaScript tips',
    'Design principles',
    'Cooking recipes'
  ];

  const performSearch = async (searchQuery: string) => {
    if (!searchQuery.trim()) {
      setResults([]);
      setHasSearched(false);
      return;
    }

    try {
      setIsLoading(true);
      const searchResults = await mockApi.searchVideos(searchQuery);
      
      // Apply filter
      let filteredResults = searchResults;
      if (selectedFilter !== 'all') {
        filteredResults = searchResults.filter(video => video.type === selectedFilter);
      }
      
      setResults(filteredResults);
      setHasSearched(true);
      
      // Update URL
      setSearchParams({ q: searchQuery });
    } catch (error) {
      console.error('Search error:', error);
      setResults([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    performSearch(query);
  };

  const handlePopularSearch = (searchTerm: string) => {
    setQuery(searchTerm);
    performSearch(searchTerm);
  };

  const clearSearch = () => {
    setQuery('');
    setResults([]);
    setHasSearched(false);
    setSearchParams({});
  };

  const handleFilterChange = (filter: 'all' | 'long' | 'short') => {
    setSelectedFilter(filter);
    if (hasSearched) {
      performSearch(query);
    }
  };

  // Perform search on mount if query exists
  useEffect(() => {
    const initialQuery = searchParams.get('q');
    if (initialQuery) {
      setQuery(initialQuery);
      performSearch(initialQuery);
    }
  }, []);

  return (
    <div className="space-y-6">
      {/* Search Header */}
      <div className="space-y-4">
        <h1 className="text-2xl font-semibold">Search</h1>
        
        {/* Search Form */}
        <form onSubmit={handleSubmit} className="flex gap-2">
          <div className="relative flex-1">
            <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Search for videos, creators, or topics..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="pl-10 pr-10"
            />
            {query && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={clearSearch}
                className="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8 p-0"
              >
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>
          <Button type="submit" disabled={isLoading}>
            {isLoading ? 'Searching...' : 'Search'}
          </Button>
        </form>

        {/* Filters */}
        {hasSearched && (
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-muted-foreground" />
            <div className="flex gap-2">
              <Button
                variant={selectedFilter === 'all' ? 'default' : 'outline'}
                size="sm"
                onClick={() => handleFilterChange('all')}
              >
                All
              </Button>
              <Button
                variant={selectedFilter === 'long' ? 'default' : 'outline'}
                size="sm"
                onClick={() => handleFilterChange('long')}
              >
                Videos
              </Button>
              <Button
                variant={selectedFilter === 'short' ? 'default' : 'outline'}
                size="sm"
                onClick={() => handleFilterChange('short')}
              >
                Shorts
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Search Results */}
      {hasSearched ? (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-medium">
              Search Results for "{query}"
            </h2>
            <div className="text-sm text-muted-foreground">
              {results.length} result{results.length !== 1 ? 's' : ''}
            </div>
          </div>
          
          <FeedList
            videos={results}
            isLoading={isLoading}
            layout="list"
          />
        </div>
      ) : (
        /* Popular Searches */
        <div className="space-y-4">
          <h2 className="text-lg font-medium">Popular Searches</h2>
          <div className="flex flex-wrap gap-2">
            {popularSearches.map((searchTerm) => (
              <Badge
                key={searchTerm}
                variant="secondary"
                className="cursor-pointer hover:bg-primary hover:text-primary-foreground transition-colors"
                onClick={() => handlePopularSearch(searchTerm)}
              >
                {searchTerm}
              </Badge>
            ))}
          </div>
          
          <div className="text-muted-foreground text-sm">
            Click on a popular search or enter your own search term above
          </div>
        </div>
      )}
    </div>
  );
}

export default Search;