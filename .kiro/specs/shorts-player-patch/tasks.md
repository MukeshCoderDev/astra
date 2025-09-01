# Implementation Plan

- [x] 1. Create age verification compliance component



  - Implement AgeRequirementCard component with environment-driven activation
  - Add localStorage persistence for age acknowledgment with configurable TTL
  - Integrate BFF API call for compliance tracking
  - Implement modal overlay with proper ARIA accessibility attributes
  - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5, 4.6, 4.7_

- [x] 2. Integrate age verification into application layout



  - Update app/layout.tsx to mount AgeRequirementCard after Header component
  - Ensure proper component ordering and styling integration
  - Test modal overlay z-index and positioning
  - _Requirements: 4.1, 4.7_

- [x] 3. Create optimized short video player component



  - Implement ShortVideo component with HLS.js integration and optimized buffer settings
  - Add Intersection Observer for off-screen video pause detection with 50% threshold
  - Implement Visibility API integration for tab-hidden pause behavior
  - Add click-to-toggle play/pause functionality
  - Enforce strict 9:16 aspect ratio with proper CSS containment
  - Implement proper HLS resource cleanup and Safari fallback support
  - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 1.6, 5.1, 5.3, 5.4, 5.5_

- [x] 4. Create shorts overlay component for metadata and actions



  - Implement ShortsOverlay component with left metadata section (creator, title, tags)
  - Add right rail action buttons (Like, Share, Tip) with proper pointer events
  - Integrate existing TipButton component without modification
  - Limit tag display to first 3 items with proper styling
  - Implement semi-transparent backgrounds for content readability
  - _Requirements: 3.2, 3.3, 3.4, 3.5_

- [x] 5. Create shorts viewer with 3-item window rendering



  - Implement ShortsViewer component with performance-optimized 3-item rendering window
  - Add keyboard navigation support for ArrowUp/ArrowDown keys
  - Implement touch gesture navigation with 40px minimum threshold
  - Add manual navigation buttons with accessibility labels
  - Implement boundary checking to prevent out-of-bounds navigation
  - _Requirements: 1.1, 2.1, 2.2, 2.3, 2.4, 3.1_

- [x] 6. Add URL synchronization and manifest prefetching



  - Implement URL updates using router.replace() for deep linking without history pollution
  - Add next video manifest prefetching to warm CDN caches
  - Ensure proper cleanup of prefetch resources
  - Test deep linking functionality with initialId parameter
  - _Requirements: 2.5, 5.2, 5.4_

- [x] 7. Update shorts list page for immersive navigation



  - Modify app/shorts/page.tsx to link cards to /shorts/[id] routes
  - Preserve existing card grid layout and styling completely
  - Ensure proper Link component integration for client-side navigation
  - _Requirements: 6.1, 6.2, 6.3, 6.4, 7.1, 7.2_

- [x] 8. Create immersive shorts viewing route





  - Implement app/shorts/[id]/page.tsx with server-side data fetching
  - Integrate ShortsViewer component with proper error handling
  - Add notFound() handling for invalid video IDs
  - Ensure proper SSR compatibility and data hydration
  - _Requirements: 7.3, 7.4, 7.5_

- [x] 9. Add environment variable configuration



  - Document required environment variables (NEXT_PUBLIC_ADULT, NEXT_PUBLIC_AGE_GATE_TTL_DAYS)
  - Implement proper environment variable validation and defaults
  - Test feature flag behavior with different environment configurations
  - _Requirements: 4.2, 4.5_

- [x] 10. Verify non-interference with existing components



  - Test that Home page (app/page.tsx) remains completely unchanged
  - Verify long-form VideoPlayer component is not modified
  - Ensure existing Home card components maintain their functionality
  - Validate that only specified files are added/updated per requirements
  - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5_