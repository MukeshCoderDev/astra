# Accessibility Guide

This document outlines the accessibility features and best practices implemented in the Astra platform.

## Overview

Astra is designed to be accessible to all users, including those who rely on assistive technologies. We follow WCAG 2.1 AA guidelines and implement comprehensive accessibility features throughout the platform.

## Key Accessibility Features

### 1. Keyboard Navigation

- **Full keyboard support**: All interactive elements are accessible via keyboard
- **Focus management**: Proper focus indicators and logical tab order
- **Skip links**: Allow users to skip to main content areas
- **Roving tab index**: Efficient navigation within component groups

#### Keyboard Shortcuts

| Key | Action |
|-----|--------|
| `Tab` | Navigate to next focusable element |
| `Shift + Tab` | Navigate to previous focusable element |
| `Enter` / `Space` | Activate buttons and links |
| `Arrow Keys` | Navigate within component groups (chips, menus) |
| `Escape` | Close modals and dropdowns |
| `Home` / `End` | Jump to first/last item in lists |

### 2. Screen Reader Support

- **ARIA labels**: Comprehensive labeling for all interactive elements
- **Live regions**: Dynamic content announcements
- **Semantic HTML**: Proper use of headings, landmarks, and roles
- **Alternative text**: Descriptive alt text for images and media

#### ARIA Implementation

```tsx
// Example: Video card with comprehensive ARIA support
<Card
  role="article"
  aria-label="Video: Sample Title by Creator Name, 5 minutes duration, 1.2K views"
  aria-setsize={totalVideos}
  aria-posinset={currentIndex}
>
  <img src={poster} alt="" /> {/* Decorative image */}
  <h3>{title}</h3>
  <button aria-label="Like video, 50 likes">
    <Heart />
  </button>
</Card>
```

### 3. Visual Accessibility

- **High contrast support**: Automatic detection and enhanced contrast
- **Color contrast**: WCAG AA compliant contrast ratios (4.5:1 minimum)
- **Focus indicators**: Visible focus rings for keyboard navigation
- **Scalable text**: Support for user font size preferences

#### Color Contrast Compliance

All text and interactive elements meet WCAG AA standards:
- Normal text: 4.5:1 contrast ratio
- Large text (18pt+): 3:1 contrast ratio
- Interactive elements: 3:1 contrast ratio

### 4. Motion and Animation

- **Reduced motion support**: Respects `prefers-reduced-motion` setting
- **Optional animations**: All animations can be disabled
- **Smooth scrolling**: Configurable based on user preferences

```css
@media (prefers-reduced-motion: reduce) {
  * {
    animation-duration: 0.01ms !important;
    transition-duration: 0.01ms !important;
  }
}
```

### 5. Responsive Design

- **Mobile accessibility**: Touch-friendly targets (44px minimum)
- **Flexible layouts**: Adapts to different screen sizes and orientations
- **Zoom support**: Functional at 200% zoom level
- **Container queries**: Component-level responsive behavior

#### Responsive Breakpoints

| Breakpoint | Width | Usage |
|------------|-------|-------|
| `xs` | 475px+ | Small mobile devices |
| `sm` | 640px+ | Mobile devices |
| `md` | 768px+ | Tablets |
| `lg` | 1024px+ | Desktop |
| `xl` | 1280px+ | Large desktop |
| `2xl` | 1536px+ | Extra large screens |

## Component Accessibility

### StickyChips

- **Role**: `tablist` with individual `tab` roles
- **Keyboard**: Arrow key navigation between chips
- **ARIA**: `aria-selected` and `aria-controls` attributes
- **Focus**: Roving tab index for efficient navigation

```tsx
<StickyChips
  chips={filterChips}
  active={activeFilter}
  onChange={setActiveFilter}
  ariaLabel="Filter content by category"
/>
```

### VideoCard

- **Role**: `article` for semantic structure
- **Keyboard**: Enter/Space to play video
- **ARIA**: Comprehensive labels including title, creator, duration, views
- **Focus**: Visible focus indicators

```tsx
<VideoCard
  video={videoData}
  aria-setsize={totalVideos}
  aria-posinset={currentIndex}
/>
```

### InfiniteFeed

- **Role**: `feed` for dynamic content
- **ARIA**: Live regions for loading announcements
- **Loading**: Screen reader announcements for new content
- **Status**: Clear indication of loading and end states

```tsx
<InfiniteFeed
  queryKey={['videos']}
  fetchPage={fetchVideos}
  ariaLabel="Video feed"
/>
```

### Navigation

- **Landmarks**: Proper `navigation` role and labeling
- **Structure**: Logical grouping with headings
- **Current page**: `aria-current="page"` for active items
- **Keyboard**: Roving tab index within sections

## Testing Accessibility

### Automated Testing

We use `jest-axe` for automated accessibility testing:

```bash
npm run test:accessibility
```

### Manual Testing Checklist

- [ ] Navigate entire interface using only keyboard
- [ ] Test with screen reader (NVDA, JAWS, VoiceOver)
- [ ] Verify color contrast ratios
- [ ] Test at 200% zoom level
- [ ] Check with high contrast mode enabled
- [ ] Verify reduced motion preferences are respected

### Browser Testing

Test accessibility features across browsers:
- Chrome with ChromeVox
- Firefox with NVDA
- Safari with VoiceOver
- Edge with Narrator

## Accessibility Providers

### AccessibilityProvider

Central provider for accessibility state management:

```tsx
const { 
  prefersReducedMotion,
  prefersHighContrast,
  announceToScreenReader,
  updatePageTitle 
} = useAccessibilityContext();
```

### Custom Hooks

- `useAccessibility`: General accessibility utilities
- `useFocusTrap`: Focus management for modals
- `useKeyboardNavigation`: Keyboard event handling
- `useScreenReader`: Screen reader announcements

## Best Practices

### 1. Semantic HTML

Use proper HTML elements for their intended purpose:

```tsx
// Good
<button onClick={handleClick}>Submit</button>
<nav aria-label="Main navigation">
<main id="main-content">

// Avoid
<div onClick={handleClick}>Submit</div>
<div className="nav">
<div className="main">
```

### 2. ARIA Usage

Use ARIA to enhance, not replace, semantic HTML:

```tsx
// Good: Enhancing existing semantics
<button aria-expanded={isOpen} aria-controls="menu">
  Menu
</button>

// Avoid: Overriding semantics unnecessarily
<div role="button" tabIndex={0}>
  Click me
</div>
```

### 3. Focus Management

Ensure logical focus order and visible indicators:

```tsx
// Good: Proper focus management
<FocusTrap active={isModalOpen}>
  <Modal>
    <button autoFocus>Close</button>
  </Modal>
</FocusTrap>

// Good: Skip links for navigation
<SkipLinks links={[
  { href: "#main-content", label: "Skip to main content" },
  { href: "#navigation", label: "Skip to navigation" }
]} />
```

### 4. Dynamic Content

Announce important changes to screen readers:

```tsx
const { announceToScreenReader } = useAccessibilityContext();

const handleLike = async () => {
  try {
    await likeVideo(videoId);
    announceToScreenReader('Video liked successfully', 'polite');
  } catch (error) {
    announceToScreenReader('Failed to like video', 'assertive');
  }
};
```

## Common Patterns

### Loading States

```tsx
<div role="status" aria-live="polite">
  {isLoading ? 'Loading videos...' : `${videos.length} videos loaded`}
</div>
```

### Error States

```tsx
<div role="alert" aria-live="assertive">
  {error && `Error: ${error.message}`}
</div>
```

### Form Validation

```tsx
<input
  aria-describedby={hasError ? "error-message" : undefined}
  aria-invalid={hasError}
/>
{hasError && (
  <div id="error-message" role="alert">
    {errorMessage}
  </div>
)}
```

## Resources

- [WCAG 2.1 Guidelines](https://www.w3.org/WAI/WCAG21/quickref/)
- [ARIA Authoring Practices](https://www.w3.org/WAI/ARIA/apg/)
- [WebAIM Screen Reader Testing](https://webaim.org/articles/screenreader_testing/)
- [Color Contrast Analyzer](https://www.tpgi.com/color-contrast-checker/)

## Support

For accessibility-related questions or issues:
1. Check this documentation
2. Review component examples in `/src/components`
3. Run accessibility tests: `npm run test:accessibility`
4. Contact the development team for guidance

## Continuous Improvement

We continuously monitor and improve accessibility:
- Regular accessibility audits
- User feedback integration
- Automated testing in CI/CD
- Team training and awareness
- Community feedback and contributions