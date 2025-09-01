# Live Streaming Platform Requirements

## Introduction

This document outlines the requirements for implementing a comprehensive live streaming platform that enables both viewers to watch live content and creators to manage their streams through a control room interface. The platform will support low-latency streaming, real-time chat, viewer engagement features, and comprehensive creator tools while maintaining the existing Home and long-form video player functionality unchanged.

## Requirements

### Requirement 1: Live Stream Viewing Experience

**User Story:** As a viewer, I want to discover and watch live streams with minimal latency, so that I can engage with content in real-time.

#### Acceptance Criteria

1. WHEN a user visits /live THEN the system SHALL display a feed with "Live now" and "Upcoming" sections
2. WHEN a user clicks on a live stream card THEN the system SHALL navigate to /live/[id] with stream details
3. WHEN a live stream loads THEN the system SHALL achieve join time of less than 2 seconds
4. WHEN the stream uses LL-HLS THEN the system SHALL implement low-latency mode with maxBufferLength of 6 seconds
5. WHEN a viewer is more than 5 seconds behind live edge THEN the system SHALL show a "Go Live" button
6. WHEN a viewer clicks "Go Live" THEN the system SHALL seek to within 0.5 seconds of live edge
7. WHEN DVR is enabled THEN the system SHALL provide a seekable timeline for the configured window
8. WHEN a stream has a poster image THEN the system SHALL display it before stream loads

### Requirement 2: Real-time Chat System

**User Story:** As a viewer, I want to participate in live chat during streams, so that I can interact with the creator and other viewers.

#### Acceptance Criteria

1. WHEN a user joins a live stream THEN the system SHALL connect to chat via WebSocket
2. WHEN WebSocket connection fails THEN the system SHALL fallback to HTTP polling every 4 seconds
3. WHEN a user sends a message THEN the system SHALL broadcast it to all connected viewers
4. WHEN slow mode is enabled THEN the system SHALL enforce cooldown periods between messages
5. WHEN a message is pinned THEN the system SHALL display it prominently in chat
6. WHEN viewer count updates THEN the system SHALL reflect the change in real-time
7. WHEN a user is in slow mode cooldown THEN the system SHALL show remaining seconds

### Requirement 3: Viewer Engagement Features

**User Story:** As a viewer, I want to see engagement indicators and tip notifications, so that I feel connected to the live experience.

#### Acceptance Criteria

1. WHEN a tip is sent during a stream THEN the system SHALL display an animated ticker notification
2. WHEN multiple tips occur THEN the system SHALL queue and animate them sequentially
3. WHEN viewer count changes THEN the system SHALL update the display in real-time
4. WHEN a stream is live THEN the system SHALL display a "LIVE" badge prominently
5. WHEN a stream is scheduled THEN the system SHALL display an "UPCOMING" badge

### Requirement 4: Creator Stream Management

**User Story:** As a creator, I want to schedule and manage my live streams, so that I can control my broadcasting experience.

#### Acceptance Criteria

1. WHEN a creator visits /studio/live THEN the system SHALL display all their streams with status
2. WHEN a creator clicks "Schedule / New" THEN the system SHALL navigate to /studio/live/new
3. WHEN a creator creates a new stream THEN the system SHALL generate unique stream keys and ingest endpoints
4. WHEN a creator submits stream details THEN the system SHALL create the stream and redirect to control room
5. WHEN a stream is created THEN the system SHALL set initial status to "preview"

### Requirement 5: Live Control Room Interface

**User Story:** As a creator, I want a comprehensive control room to manage my live stream, so that I can monitor and control all aspects of my broadcast.

#### Acceptance Criteria

1. WHEN a creator accesses /studio/live/[id] THEN the system SHALL display the control room interface
2. WHEN stream status is "preview" THEN the system SHALL show "Go Live" button
3. WHEN stream status is "live" THEN the system SHALL show "End Stream" button
4. WHEN creator clicks "Go Live" THEN the system SHALL update status to "live" and notify viewers
5. WHEN creator clicks "End Stream" THEN the system SHALL update status to "ended" and stop broadcast
6. WHEN stream keys are displayed THEN the system SHALL mask them by default with show/hide toggle
7. WHEN creator clicks "Rotate keys" THEN the system SHALL generate new keys and refresh display

### Requirement 6: Stream Health Monitoring

**User Story:** As a creator, I want to monitor my stream's technical health, so that I can ensure quality broadcast.

#### Acceptance Criteria

1. WHEN a stream is active THEN the system SHALL display real-time viewer count
2. WHEN encoder is connected THEN the system SHALL show bitrate in kbps
3. WHEN frames are being processed THEN the system SHALL display current FPS
4. WHEN frame drops occur THEN the system SHALL show drop rate percentage
5. WHEN health metrics update THEN the system SHALL refresh display every 5 seconds via WebSocket

### Requirement 7: Chat Moderation Tools

**User Story:** As a creator, I want to moderate my stream chat, so that I can maintain a positive environment.

#### Acceptance Criteria

1. WHEN creator sets slow mode THEN the system SHALL enforce the specified cooldown period
2. WHEN creator timeouts a user THEN the system SHALL prevent them from chatting for the duration
3. WHEN creator bans a user THEN the system SHALL permanently block them from the stream
4. WHEN creator pins a message THEN the system SHALL highlight it for all viewers
5. WHEN creator unpins a message THEN the system SHALL remove the highlight
6. WHEN slow mode is adjusted THEN the system SHALL update all connected chat clients

### Requirement 8: Stream Customization

**User Story:** As a creator, I want to customize my stream settings, so that I can tailor the experience to my content.

#### Acceptance Criteria

1. WHEN creator uploads a thumbnail THEN the system SHALL use it as the stream poster
2. WHEN creator selects "Use current frame" THEN the system SHALL capture and set thumbnail from live feed
3. WHEN creator enables forensic watermark THEN the system SHALL apply it to the stream
4. WHEN creator marks stream as age-restricted THEN the system SHALL enforce age verification
5. WHEN creator sets DVR window THEN the system SHALL allow viewers to seek within that timeframe
6. WHEN settings are updated THEN the system SHALL apply changes immediately

### Requirement 9: Age Verification Integration

**User Story:** As a platform user, I want age-restricted content to be properly gated, so that compliance requirements are met.

#### Acceptance Criteria

1. WHEN VITE_ADULT is set to "1" THEN the system SHALL enable age verification
2. WHEN a user first visits THEN the system SHALL show age gate modal if not previously acknowledged
3. WHEN user clicks "I am 18+" THEN the system SHALL store consent with timestamp
4. WHEN consent expires after TTL days THEN the system SHALL show age gate again
5. WHEN user clicks "Leave" THEN the system SHALL redirect to external site

### Requirement 10: Environment Configuration

**User Story:** As a developer, I want proper environment configuration, so that the system can be deployed across different environments.

#### Acceptance Criteria

1. WHEN VITE_LIVE_ENABLED or NEXT_PUBLIC_LIVE_ENABLED is "1" THEN the system SHALL enable all live streaming features
2. WHEN API endpoints are configured THEN the system SHALL use them for all backend communication
3. WHEN WebSocket URLs are set THEN the system SHALL connect to the specified endpoints
4. WHEN CDN base is configured THEN the system SHALL serve media assets from that location
5. WHEN environment variables are missing THEN the system SHALL use sensible defaults
6. WHEN both VITE_ and NEXT_PUBLIC_ prefixes exist THEN the system SHALL prioritize NEXT_PUBLIC_ for compatibility

### Requirement 11: Stream Status Real-time Updates

**User Story:** As a viewer, I want to see immediate updates when stream status changes, so that I have accurate information about stream availability.

#### Acceptance Criteria

1. WHEN a stream transitions from preview to live THEN the system SHALL update viewer UI within 1 second
2. WHEN a stream ends THEN the system SHALL show "Stream ended" overlay immediately
3. WHEN a stream is in preview THEN the system SHALL show "Stream will start soon" overlay
4. WHEN stream status changes THEN the system SHALL reinitialize the player with new configuration
5. WHEN status updates are received THEN the system SHALL maintain WebSocket connection for real-time updates

### Requirement 12: Performance and Join Time Optimization

**User Story:** As a viewer, I want streams to load quickly, so that I can start watching without delay.

#### Acceptance Criteria

1. WHEN a viewer joins a stream THEN the system SHALL achieve Time To First Frame (TTFF) under 2 seconds
2. WHEN loading a stream THEN the system SHALL preconnect to CDN endpoints
3. WHEN manifest is available THEN the system SHALL preload it for faster startup
4. WHEN join time is measured THEN the system SHALL send metrics to analytics endpoint
5. WHEN LL-HLS is used THEN the system SHALL configure maxBufferLength to 6 seconds for low latency

### Requirement 13: Enhanced Chat Moderation Interface

**User Story:** As a creator, I want to moderate chat directly from the chat interface, so that I can quickly manage my community.

#### Acceptance Criteria

1. WHEN creator views chat THEN the system SHALL show moderation actions (pin/unpin/timeout/ban) on each message
2. WHEN creator clicks "Pin" THEN the system SHALL pin the message and highlight it for all viewers
3. WHEN creator clicks "Unpin" THEN the system SHALL remove the pin and highlight
4. WHEN creator clicks "Timeout" THEN the system SHALL prevent user from chatting for 5 minutes
5. WHEN creator clicks "Ban" THEN the system SHALL permanently block user from the stream
6. WHEN moderation actions are taken THEN the system SHALL update all connected clients immediately

### Requirement 14: Stream Quality Monitoring

**User Story:** As a creator, I want detailed stream health metrics, so that I can ensure optimal broadcast quality.

#### Acceptance Criteria

1. WHEN stream is active THEN the system SHALL update health metrics every 5 seconds via WebSocket
2. WHEN encoder connection is established THEN the system SHALL display bitrate in kbps
3. WHEN frames are processed THEN the system SHALL show current FPS
4. WHEN frame drops occur THEN the system SHALL display drop rate percentage
5. WHEN WebSocket fails THEN the system SHALL fallback to HTTP polling for health data
6. WHEN metrics are critical THEN the system SHALL highlight them with warning indicators