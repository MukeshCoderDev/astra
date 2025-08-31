# Requirements Document

## Introduction

This document outlines the requirements for building a production-ready React.js 18 + TypeScript frontend for a walletless Web3 content platform that combines YouTube and TikTok functionality. The platform enables users to upload, watch, and monetize video content through a seamless Web3 experience without traditional wallet complexity. The frontend will communicate with a Backend-for-Frontend (BFF) via REST APIs and real-time WebSocket connections.

## Requirements

### Requirement 0

**User Story:** As a platform, we must prevent minors from accessing adult content and verify performers' age/consent to meet 18 USC §2257 and payment-processor rules.

#### Acceptance Criteria

1. WHEN a creator uploads adult content THEN the system SHALL require an ID scan and a signed model release (2257 packet) before publish
2. WHEN a visitor first arrives THEN the system SHALL show an age-gate modal (I am 18+) and persist consent; for flagged regions the system SHALL request ID verification
3. WHEN a video is published THEN the system SHALL allow per-asset geo-blocking (e.g., TX, UT, VA) and enforce via CDN edge rules
4. WHEN any user reports content THEN the system SHALL open a report flow and push the item into a moderation queue; asset visibility SHALL support public | unlisted | under_review | dmca_hidden
5. WHEN "forensic watermark" is enabled in Studio THEN the system SHALL mark the asset for session-unique watermarking in the packaging pipeline
6. WHEN a tip is received THEN the system SHALL hold funds in 3-day escrow with admin freeze/release controls exposed in Studio and Admin
7. WHEN legal pages are visited THEN the system SHALL show adult-specific ToS, Privacy, and DMCA pages, linked in footer and upload flow

### Requirement 1

**User Story:** As a content viewer, I want to browse and watch video content in multiple formats (long-form and shorts), so that I can consume entertainment content seamlessly.

#### Acceptance Criteria

1. WHEN a user visits the home page THEN the system SHALL display a mixed feed of video content with thumbnails, titles, and creator information
2. WHEN a user clicks on a video card THEN the system SHALL navigate to the watch page with HLS video playback
3. WHEN a user visits the shorts page THEN the system SHALL display vertical short-form videos in a swipeable interface
4. WHEN a video is playing THEN the system SHALL support HLS and Low-Latency HLS (LL-HLS) streaming with adaptive bitrate
5. WHEN a user searches for content THEN the system SHALL provide search functionality with results filtering

### Requirement 2

**User Story:** As a content creator, I want to upload large video files (up to 20GB+) with resumable uploads, so that I can publish my content reliably even with unstable connections.

#### Acceptance Criteria

1. WHEN a creator accesses the upload page THEN the system SHALL provide a drag-and-drop interface for video file selection
2. WHEN a creator uploads a video file THEN the system SHALL use TUS protocol for resumable uploads with progress indication
3. IF an upload is interrupted THEN the system SHALL allow resuming from the last successful chunk
4. WHEN an upload completes THEN the system SHALL provide a form for video metadata (title, description, tags, visibility)
5. WHEN a creator publishes a video THEN the system SHALL finalize the upload via BFF API integration
6. WHEN a creator uploads adult content THEN the system SHALL prompt for government ID scan and model release signature before publishing; show kycStatus: pending | approved | rejected
7. WHEN a creator sets geo-restrictions THEN the system SHALL allow setting a country blacklist per video; persist and enforce via CDN

### Requirement 3

**User Story:** As a platform user, I want to interact with content through tips and reactions without managing complex wallet operations, so that I can support creators seamlessly.

#### Acceptance Criteria

1. WHEN a user views content THEN the system SHALL display reaction buttons (like, share, tip)
2. WHEN a user clicks the tip button THEN the system SHALL open a tip modal with preset USDC amounts
3. WHEN a user sends a tip THEN the system SHALL process the payment through the walletless system and show confirmation
4. WHEN a user has a wallet balance THEN the system SHALL display their USDC balance in the header
5. WHEN a user needs to add funds THEN the system SHALL provide on-ramp functionality
6. WHEN a user first visits THEN the system SHALL show an 18+ age-gate modal; persist consent; re-prompt every 90 days or on policy change

### Requirement 4

**User Story:** As a content creator, I want to access a studio dashboard to manage my content and track earnings, so that I can monitor my creator business effectively.

#### Acceptance Criteria

1. WHEN a creator accesses the studio THEN the system SHALL display a dashboard with earnings summary and KYC status
2. WHEN a creator views their content THEN the system SHALL show a table of uploaded videos with performance metrics
3. WHEN a creator checks earnings THEN the system SHALL display revenue breakdown and payout history
4. WHEN a creator needs to complete KYC THEN the system SHALL show KYC status and required actions
5. WHEN a creator views analytics THEN the system SHALL provide content performance insights
6. WHEN a creator accesses compliance THEN the system SHALL show 2257 compliance card with current status, last verification date
7. WHEN a creator manages content THEN the system SHALL provide a geo-restriction editor (country multiselect)
8. WHEN a creator configures watermarks THEN the system SHALL provide "Enable forensic watermark" toggle per asset and at account default level
9. WHEN a creator checks payments THEN the system SHALL show escrow status for recent tips (held | released | frozen) and dispute flow

### Requirement 5

**User Story:** As a platform user, I want to discover and follow creators through profile pages, so that I can build connections with content creators I enjoy.

#### Acceptance Criteria

1. WHEN a user visits a creator profile THEN the system SHALL display the creator's handle, avatar, and content tabs
2. WHEN a user browses a profile THEN the system SHALL show organized content (Videos, Shorts, About sections)
3. WHEN a user wants to follow a creator THEN the system SHALL provide follow/unfollow functionality
4. WHEN a user views profile content THEN the system SHALL display the creator's uploaded videos and shorts
5. WHEN a user accesses their own profile THEN the system SHALL allow profile editing and management
6. WHEN a user encounters inappropriate content THEN the system SHALL provide "Report content" action on cards and watch; confirm and submit to moderation

### Requirement 6

**User Story:** As a platform user, I want real-time interactions and notifications, so that I can engage with live content and receive immediate feedback.

#### Acceptance Criteria

1. WHEN users interact with content THEN the system SHALL support real-time tip notifications via WebSocket
2. WHEN live streaming is available THEN the system SHALL provide real-time chat functionality
3. WHEN users receive tips or interactions THEN the system SHALL display toast notifications
4. WHEN network connectivity changes THEN the system SHALL handle reconnection gracefully
5. WHEN real-time features are unavailable THEN the system SHALL degrade gracefully to polling

### Requirement 7

**User Story:** As a platform user, I want a responsive and accessible interface that works across devices, so that I can use the platform on mobile, tablet, and desktop.

#### Acceptance Criteria

1. WHEN a user accesses the platform on mobile THEN the system SHALL provide a mobile-optimized layout with bottom navigation
2. WHEN a user accesses the platform on desktop THEN the system SHALL display a sidebar navigation and multi-column layout
3. WHEN a user interacts with the interface THEN the system SHALL meet WCAG accessibility guidelines
4. WHEN a user prefers dark mode THEN the system SHALL provide a dark theme as the default
5. WHEN a user wants to switch themes THEN the system SHALL provide a day/night theme toggle with dark as default
6. WHEN a user navigates the platform THEN the system SHALL provide smooth transitions and loading states

### Requirement 8

**User Story:** As a system administrator, I want configurable feature flags and environment-based settings, so that I can control feature rollouts and manage different deployment environments.

#### Acceptance Criteria

1. WHEN the system initializes THEN it SHALL read configuration from environment variables for API endpoints
2. WHEN feature flags are set THEN the system SHALL conditionally render features (shorts, live, watermark)
3. WHEN different environments are deployed THEN the system SHALL use appropriate API base URLs and CDN endpoints
4. WHEN IPFS integration is needed THEN the system SHALL use configured IPFS gateway endpoints
5. WHEN upload endpoints change THEN the system SHALL use configurable TUS upload endpoints
6. WHEN compliance features are enabled THEN the system SHALL read forensic watermark and geo-block endpoints from environment/config
7. WHEN age verification is required THEN the system SHALL support an AGE_GATE flag and region policy endpoint for conditional ID checks