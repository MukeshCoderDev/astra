# Requirements Document

## Introduction

This document outlines the requirements for patching the existing Shorts player to improve performance and user experience, while adding a global 18+ requirement card for compliance. The patch focuses on optimizing the Shorts viewer by rendering only current/previous/next items, implementing strict 9:16 aspect ratio containers, pausing off-screen videos, and adding lightweight overlays. Additionally, it implements a persistent age verification system that blocks access until users confirm they are 18+.

## Requirements

### Requirement 1

**User Story:** As a platform user, I want the Shorts player to have smooth performance without FPS drops, so that I can enjoy seamless video browsing.

#### Acceptance Criteria

1. WHEN viewing Shorts THEN the system SHALL render only the current, previous, and next video items to optimize performance
2. WHEN a video is not currently active THEN the system SHALL pause the video automatically to reduce resource usage
3. WHEN the browser tab becomes hidden THEN the system SHALL pause all video playback to conserve resources
4. WHEN a video goes off-screen THEN the system SHALL pause playback using intersection observer with 50% threshold
5. WHEN navigating between Shorts THEN the system SHALL maintain 50-60 FPS performance target
6. WHEN a video container is rendered THEN the system SHALL enforce strict 9:16 aspect ratio with proper containment

### Requirement 2

**User Story:** As a platform user, I want intuitive navigation controls for Shorts, so that I can easily browse through content using keyboard, touch, or mouse.

#### Acceptance Criteria

1. WHEN using keyboard navigation THEN the system SHALL support arrow up/down keys to navigate between videos
2. WHEN using touch gestures THEN the system SHALL support swipe up/down with minimum 40px threshold to change videos
3. WHEN clicking navigation buttons THEN the system SHALL provide up/down arrow buttons for manual navigation
4. WHEN reaching content boundaries THEN the system SHALL prevent navigation beyond first/last video
5. WHEN navigating THEN the system SHALL update the URL to reflect the current video ID for deep linking

### Requirement 3

**User Story:** As a platform user, I want to interact with Shorts content through tapping and overlay controls, so that I can play/pause videos and access creator actions.

#### Acceptance Criteria

1. WHEN tapping on a video THEN the system SHALL toggle play/pause state
2. WHEN viewing a video THEN the system SHALL display creator handle, title, and tags in a left overlay
3. WHEN viewing a video THEN the system SHALL show action buttons (Like, Share, Tip) in a right rail overlay
4. WHEN interacting with overlay elements THEN the system SHALL maintain pointer events only on interactive elements
5. WHEN displaying video metadata THEN the system SHALL limit tags to first 3 items with proper styling

### Requirement 4

**User Story:** As a platform, I need to implement age verification to comply with adult content regulations, so that only users 18+ can access the platform.

#### Acceptance Criteria

1. WHEN a user first visits the platform THEN the system SHALL display an 18+ age requirement modal that blocks all content
2. WHEN the NEXT_PUBLIC_ADULT environment variable is set to "1" THEN the system SHALL enable the age verification feature
3. WHEN a user confirms they are 18+ THEN the system SHALL store the acknowledgment in localStorage with a timestamp
4. WHEN age acknowledgment is stored THEN the system SHALL persist the consent for 90 days (configurable via NEXT_PUBLIC_AGE_GATE_TTL_DAYS)
5. WHEN the consent period expires THEN the system SHALL show the age gate modal again
6. WHEN a user confirms age THEN the system SHALL make a POST request to /bff/compliance/age/ack endpoint for backend tracking
7. WHEN a user chooses to leave THEN the system SHALL redirect to an external site (google.com)

### Requirement 5

**User Story:** As a platform user, I want optimized video loading and prefetching, so that I experience minimal buffering when navigating between Shorts.

#### Acceptance Criteria

1. WHEN viewing a video THEN the system SHALL use HLS.js with optimized buffer settings (lowLatencyMode: true, maxBufferLength: 10)
2. WHEN a next video exists THEN the system SHALL preload the next video's HLS manifest to warm the CDN
3. WHEN HLS is not supported THEN the system SHALL fall back to native HLS playback (Safari/iOS)
4. WHEN a video loads THEN the system SHALL call onReady callback after manifest parsing
5. WHEN cleaning up video resources THEN the system SHALL properly destroy HLS instances to prevent memory leaks

### Requirement 6

**User Story:** As a developer, I want the Shorts patch to not interfere with existing functionality, so that Home and long-form video players remain unchanged.

#### Acceptance Criteria

1. WHEN implementing the patch THEN the system SHALL NOT modify app/page.tsx (Home page)
2. WHEN implementing the patch THEN the system SHALL NOT modify components/player/VideoPlayer.tsx (long-form player)
3. WHEN implementing the patch THEN the system SHALL NOT modify existing Home card components
4. WHEN implementing the patch THEN the system SHALL only add/update specified files for Shorts functionality
5. WHEN implementing the patch THEN the system SHALL maintain existing API contracts and data structures

### Requirement 7

**User Story:** As a platform user, I want the Shorts page to maintain its existing card layout while adding immersive viewing, so that I can browse Shorts in both grid and full-screen modes.

#### Acceptance Criteria

1. WHEN visiting /shorts THEN the system SHALL display the existing card grid layout unchanged
2. WHEN clicking a Shorts card THEN the system SHALL navigate to /shorts/[id] for immersive viewing
3. WHEN in immersive mode THEN the system SHALL display the ShortsViewer component with full-screen video
4. WHEN in immersive mode THEN the system SHALL show video metadata and creator information in overlays
5. WHEN in immersive mode THEN the system SHALL provide navigation controls and indicators