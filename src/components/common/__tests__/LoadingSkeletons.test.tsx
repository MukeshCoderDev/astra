import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { 
  VideoGridSkeleton, 
  HistoryListSkeleton, 
  PlaylistGridSkeleton,
  UploadTableSkeleton,
  FilterChipsSkeleton,
  PageHeaderSkeleton,
  ContentSkeleton
} from '../LoadingSkeletons';

describe('LoadingSkeletons', () => {
  describe('VideoGridSkeleton', () => {
    it('renders default number of skeleton items', () => {
      const { container } = render(<VideoGridSkeleton />);
      
      // Should render 8 skeleton items by default
      const skeletonItems = container.querySelectorAll('.space-y-3');
      expect(skeletonItems).toHaveLength(8);
    });

    it('renders custom number of skeleton items', () => {
      const { container } = render(<VideoGridSkeleton count={4} />);
      
      const skeletonItems = container.querySelectorAll('.space-y-3');
      expect(skeletonItems).toHaveLength(4);
    });

    it('applies custom className', () => {
      const { container } = render(<VideoGridSkeleton className="custom-class" />);
      
      expect(container.firstChild).toHaveClass('custom-class');
    });
  });

  describe('HistoryListSkeleton', () => {
    it('renders default number of history items', () => {
      const { container } = render(<HistoryListSkeleton />);
      
      const historyItems = container.querySelectorAll('.flex.gap-4.p-4');
      expect(historyItems).toHaveLength(6);
    });

    it('renders custom number of history items', () => {
      const { container } = render(<HistoryListSkeleton count={3} />);
      
      const historyItems = container.querySelectorAll('.flex.gap-4.p-4');
      expect(historyItems).toHaveLength(3);
    });
  });

  describe('PlaylistGridSkeleton', () => {
    it('renders default number of playlist items', () => {
      const { container } = render(<PlaylistGridSkeleton />);
      
      const playlistItems = container.querySelectorAll('.space-y-3');
      expect(playlistItems).toHaveLength(6);
    });

    it('uses grid layout for playlists', () => {
      const { container } = render(<PlaylistGridSkeleton />);
      
      expect(container.firstChild).toHaveClass('grid', 'grid-cols-1', 'sm:grid-cols-2', 'lg:grid-cols-3');
    });
  });

  describe('UploadTableSkeleton', () => {
    it('renders table header and rows', () => {
      const { container } = render(<UploadTableSkeleton />);
      
      // Should have header row
      const headerRow = container.querySelector('.grid.grid-cols-12.gap-4.p-4.border-b');
      expect(headerRow).toBeInTheDocument();
      
      // Should have 8 data rows by default
      const dataRows = container.querySelectorAll('.grid.grid-cols-12.gap-4.p-4.border-b');
      expect(dataRows).toHaveLength(9); // 1 header + 8 data rows
    });

    it('renders custom number of table rows', () => {
      const { container } = render(<UploadTableSkeleton count={3} />);
      
      const dataRows = container.querySelectorAll('.grid.grid-cols-12.gap-4.p-4.border-b');
      expect(dataRows).toHaveLength(4); // 1 header + 3 data rows
    });
  });

  describe('FilterChipsSkeleton', () => {
    it('renders default number of filter chips', () => {
      const { container } = render(<FilterChipsSkeleton />);
      
      const chips = container.querySelectorAll('.h-8.w-16.rounded-full');
      expect(chips).toHaveLength(6);
    });

    it('uses horizontal scrolling layout', () => {
      const { container } = render(<FilterChipsSkeleton />);
      
      expect(container.firstChild).toHaveClass('flex', 'gap-2', 'overflow-x-auto');
    });
  });

  describe('PageHeaderSkeleton', () => {
    it('renders basic header skeleton', () => {
      const { container } = render(<PageHeaderSkeleton />);
      
      // Should have title skeleton
      const titleSkeleton = container.querySelector('.h-8.w-48');
      expect(titleSkeleton).toBeInTheDocument();
    });

    it('shows description when enabled', () => {
      const { container } = render(<PageHeaderSkeleton showDescription={true} />);
      
      const descriptionSkeleton = container.querySelector('.h-4.w-96');
      expect(descriptionSkeleton).toBeInTheDocument();
    });

    it('shows actions when enabled', () => {
      const { container } = render(<PageHeaderSkeleton showActions={true} />);
      
      const actionSkeletons = container.querySelectorAll('.h-10');
      expect(actionSkeletons.length).toBeGreaterThan(0);
    });

    it('hides description when disabled', () => {
      const { container } = render(<PageHeaderSkeleton showDescription={false} />);
      
      const descriptionSkeleton = container.querySelector('.h-4.w-96');
      expect(descriptionSkeleton).not.toBeInTheDocument();
    });
  });

  describe('ContentSkeleton', () => {
    it('renders grid skeleton by default', () => {
      const { container } = render(<ContentSkeleton />);
      
      // Should render video grid skeleton
      expect(container.firstChild).toHaveClass('grid');
    });

    it('renders list skeleton when type is list', () => {
      const { container } = render(<ContentSkeleton type="list" />);
      
      // Should render history list skeleton
      expect(container.firstChild).toHaveClass('space-y-4');
    });

    it('renders table skeleton when type is table', () => {
      const { container } = render(<ContentSkeleton type="table" />);
      
      // Should render upload table skeleton
      const headerRow = container.querySelector('.grid.grid-cols-12');
      expect(headerRow).toBeInTheDocument();
    });

    it('renders playlist skeleton when type is playlist', () => {
      const { container } = render(<ContentSkeleton type="playlist" />);
      
      // Should render playlist grid skeleton
      expect(container.firstChild).toHaveClass('grid', 'grid-cols-1', 'sm:grid-cols-2', 'lg:grid-cols-3');
    });

    it('passes count to underlying skeleton', () => {
      const { container } = render(<ContentSkeleton type="grid" count={4} />);
      
      const skeletonItems = container.querySelectorAll('.space-y-3');
      expect(skeletonItems).toHaveLength(4);
    });
  });
});