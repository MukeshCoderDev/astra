import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '../utils/test-utils';
import { server } from '../mocks/server';
import { http, HttpResponse } from 'msw';
import Search from '../../pages/Search/Search';
import { mockVideos, mockCreators } from '../mocks/mockData';

// Mock react-router-dom
const mockNavigate = vi.fn();
const mockSearchParams = new URLSearchParams();
const mockSetSearchParams = vi.fn();

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
    useSearchParams: () => [mockSearchParams, mockSetSearchParams],
  };
});

describe('Search Functionality Integration', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockSearchParams.clear();
  });

  it('should perform search and display results', async () => {
    // Mock search results
    server.use(
      http.get('https://bff.example.com/search', ({ request }) => {
        const url = new URL(request.url);
        const query = url.searchParams.get('q');
        
        if (query === 'travel') {
          return HttpResponse.json({
            videos: mockVideos.filter(v => v.title.toLowerCase().includes('travel')),
            creators: mockCreators.filter(c => c.displayName.toLowerCase().includes('travel')),
          });
        }
        
        return HttpResponse.json({ videos: [], creators: [] });
      })
    );

    render(<Search />);

    // Should show search input
    const searchInput = screen.getByRole('searchbox');
    expect(searchInput).toBeInTheDocument();

    // Perform search
    fireEvent.change(searchInput, { target: { value: 'travel' } });
    fireEvent.submit(searchInput.closest('form')!);

    // Should show loading state
    expect(screen.getByText(/searching/i)).toBeInTheDocument();

    // Should display search results
    await waitFor(() => {
      expect(screen.getByText('Amazing Travel Vlog')).toBeInTheDocument();
    });

    // Should update URL with search query
    expect(mockSetSearchParams).toHaveBeenCalledWith({ q: 'travel' });
  });

  it('should handle empty search results', async () => {
    server.use(
      http.get('https://bff.example.com/search', () => {
        return HttpResponse.json({ videos: [], creators: [] });
      })
    );

    render(<Search />);

    const searchInput = screen.getByRole('searchbox');
    fireEvent.change(searchInput, { target: { value: 'nonexistent' } });
    fireEvent.submit(searchInput.closest('form')!);

    await waitFor(() => {
      expect(screen.getByText(/no results found/i)).toBeInTheDocument();
    });

    // Should show search suggestions
    expect(screen.getByText(/try different keywords/i)).toBeInTheDocument();
  });

  it('should filter search results by content type', async () => {
    render(<Search />);

    // Perform initial search
    const searchInput = screen.getByRole('searchbox');
    fireEvent.change(searchInput, { target: { value: 'test' } });
    fireEvent.submit(searchInput.closest('form')!);

    await waitFor(() => {
      expect(screen.getByText(/search results/i)).toBeInTheDocument();
    });

    // Should show filter options
    expect(screen.getByRole('button', { name: /all/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /videos/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /shorts/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /creators/i })).toBeInTheDocument();

    // Filter by videos only
    fireEvent.click(screen.getByRole('button', { name: /videos/i }));

    // Should update search params with filter
    expect(mockSetSearchParams).toHaveBeenCalledWith(
      expect.objectContaining({ type: 'videos' })
    );
  });

  it('should handle search suggestions and autocomplete', async () => {
    // Mock search suggestions
    server.use(
      http.get('https://bff.example.com/search/suggestions', ({ request }) => {
        const url = new URL(request.url);
        const query = url.searchParams.get('q');
        
        if (query === 'tra') {
          return HttpResponse.json({
            suggestions: ['travel', 'training', 'transformation'],
          });
        }
        
        return HttpResponse.json({ suggestions: [] });
      })
    );

    render(<Search />);

    const searchInput = screen.getByRole('searchbox');
    
    // Type partial query
    fireEvent.change(searchInput, { target: { value: 'tra' } });

    // Should show suggestions dropdown
    await waitFor(() => {
      expect(screen.getByText('travel')).toBeInTheDocument();
      expect(screen.getByText('training')).toBeInTheDocument();
      expect(screen.getByText('transformation')).toBeInTheDocument();
    });

    // Click on suggestion
    fireEvent.click(screen.getByText('travel'));

    // Should update input and perform search
    expect(searchInput).toHaveValue('travel');
  });

  it('should handle search history', async () => {
    // Mock localStorage for search history
    const mockSearchHistory = ['travel', 'cooking', 'tech'];
    Storage.prototype.getItem = vi.fn().mockReturnValue(JSON.stringify(mockSearchHistory));
    Storage.prototype.setItem = vi.fn();

    render(<Search />);

    // Click on search input to show history
    const searchInput = screen.getByRole('searchbox');
    fireEvent.focus(searchInput);

    // Should show recent searches
    await waitFor(() => {
      expect(screen.getByText(/recent searches/i)).toBeInTheDocument();
      expect(screen.getByText('travel')).toBeInTheDocument();
      expect(screen.getByText('cooking')).toBeInTheDocument();
      expect(screen.getByText('tech')).toBeInTheDocument();
    });

    // Click on history item
    fireEvent.click(screen.getByText('travel'));

    // Should perform search with history item
    expect(searchInput).toHaveValue('travel');
  });

  it('should handle advanced search filters', async () => {
    render(<Search />);

    // Open advanced filters
    const advancedButton = screen.getByRole('button', { name: /advanced/i });
    fireEvent.click(advancedButton);

    // Should show advanced filter options
    await waitFor(() => {
      expect(screen.getByLabelText(/duration/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/upload date/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/sort by/i)).toBeInTheDocument();
    });

    // Set duration filter
    const durationSelect = screen.getByLabelText(/duration/i);
    fireEvent.change(durationSelect, { target: { value: 'short' } });

    // Set upload date filter
    const uploadDateSelect = screen.getByLabelText(/upload date/i);
    fireEvent.change(uploadDateSelect, { target: { value: 'week' } });

    // Set sort order
    const sortSelect = screen.getByLabelText(/sort by/i);
    fireEvent.change(sortSelect, { target: { value: 'views' } });

    // Apply filters
    const applyButton = screen.getByRole('button', { name: /apply filters/i });
    fireEvent.click(applyButton);

    // Should update search params with filters
    expect(mockSetSearchParams).toHaveBeenCalledWith(
      expect.objectContaining({
        duration: 'short',
        uploadDate: 'week',
        sortBy: 'views',
      })
    );
  });

  it('should handle search errors gracefully', async () => {
    // Mock search error
    server.use(
      http.get('https://bff.example.com/search', () => {
        return new HttpResponse(null, { status: 500 });
      })
    );

    render(<Search />);

    const searchInput = screen.getByRole('searchbox');
    fireEvent.change(searchInput, { target: { value: 'error test' } });
    fireEvent.submit(searchInput.closest('form')!);

    // Should show error message
    await waitFor(() => {
      expect(screen.getByText(/search failed/i)).toBeInTheDocument();
    });

    // Should show retry button
    expect(screen.getByRole('button', { name: /retry/i })).toBeInTheDocument();
  });

  it('should debounce search input', async () => {
    const mockSearchFn = vi.fn();
    
    // Mock the search API call
    server.use(
      http.get('https://bff.example.com/search', () => {
        mockSearchFn();
        return HttpResponse.json({ videos: [], creators: [] });
      })
    );

    render(<Search />);

    const searchInput = screen.getByRole('searchbox');

    // Type rapidly
    fireEvent.change(searchInput, { target: { value: 't' } });
    fireEvent.change(searchInput, { target: { value: 'tr' } });
    fireEvent.change(searchInput, { target: { value: 'tra' } });
    fireEvent.change(searchInput, { target: { value: 'trav' } });
    fireEvent.change(searchInput, { target: { value: 'travel' } });

    // Should only make one API call after debounce delay
    await waitFor(() => {
      expect(mockSearchFn).toHaveBeenCalledTimes(1);
    }, { timeout: 1000 });
  });

  it('should handle keyboard navigation in search results', async () => {
    render(<Search />);

    // Perform search
    const searchInput = screen.getByRole('searchbox');
    fireEvent.change(searchInput, { target: { value: 'travel' } });
    fireEvent.submit(searchInput.closest('form')!);

    await waitFor(() => {
      expect(screen.getByText('Amazing Travel Vlog')).toBeInTheDocument();
    });

    // Test keyboard navigation through results
    const firstResult = screen.getByRole('article');
    firstResult.focus();
    expect(firstResult).toHaveFocus();

    // Arrow down should move to next result
    fireEvent.keyDown(firstResult, { key: 'ArrowDown' });
    
    // Enter should navigate to video
    fireEvent.keyDown(firstResult, { key: 'Enter' });
    expect(mockNavigate).toHaveBeenCalled();
  });

  it('should support voice search', async () => {
    // Mock Web Speech API
    const mockRecognition = {
      start: vi.fn(),
      stop: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    };

    global.webkitSpeechRecognition = vi.fn().mockImplementation(() => mockRecognition);

    render(<Search />);

    // Should show voice search button
    const voiceButton = screen.getByRole('button', { name: /voice search/i });
    expect(voiceButton).toBeInTheDocument();

    // Click voice search
    fireEvent.click(voiceButton);

    // Should start speech recognition
    expect(mockRecognition.start).toHaveBeenCalled();

    // Simulate speech result
    const resultEvent = new Event('result');
    Object.defineProperty(resultEvent, 'results', {
      value: [[{ transcript: 'travel videos' }]],
    });

    const onResultCallback = mockRecognition.addEventListener.mock.calls
      .find(call => call[0] === 'result')?.[1];
    
    if (onResultCallback) {
      onResultCallback(resultEvent);
    }

    // Should update search input with voice result
    const searchInput = screen.getByRole('searchbox');
    expect(searchInput).toHaveValue('travel videos');
  });
});