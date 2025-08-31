# Testing Documentation

This directory contains the comprehensive testing suite for the Web3 Content Platform Frontend. The testing strategy follows industry best practices with unit tests, integration tests, and end-to-end tests.

## Testing Stack

- **Unit & Integration Tests**: Vitest + React Testing Library
- **End-to-End Tests**: Playwright
- **Mocking**: MSW (Mock Service Worker)
- **Coverage**: Vitest Coverage (v8)

## Directory Structure

```
src/test/
├── __tests__/           # Component and hook unit tests (co-located)
├── integration/         # Integration tests
├── e2e/                # End-to-end tests
├── mocks/              # MSW mock handlers and data
├── utils/              # Test utilities and helpers
├── setup.ts            # Test setup and configuration
└── README.md           # This file
```

## Test Categories

### Unit Tests
Located alongside components in `__tests__` directories:
- Component behavior and rendering
- Custom hook functionality
- Utility function logic
- State management (Zustand stores)

### Integration Tests
Located in `src/test/integration/`:
- Complete user workflows
- API integration with mocked responses
- Cross-component interactions
- Real-time features with WebSocket mocks

### End-to-End Tests
Located in `src/test/e2e/`:
- Full application workflows
- Cross-browser compatibility
- Mobile responsiveness
- Accessibility compliance
- Performance metrics

## Running Tests

### Development
```bash
# Run all tests in watch mode
npm run test

# Run tests with UI
npm run test:ui

# Run specific test file
npm run test -- VideoCard.test.tsx

# Run tests matching pattern
npm run test -- --grep "upload"
```

### CI/CD
```bash
# Run all tests once
npm run test:run

# Run with coverage
npm run test:coverage

# Run E2E tests
npm run test:e2e

# Run E2E tests with UI
npm run test:e2e:ui
```

## Test Utilities

### Custom Render
Use the custom render function that includes all providers:

```tsx
import { render, screen } from '../test/utils/test-utils';

test('component renders correctly', () => {
  render(<MyComponent />);
  expect(screen.getByText('Hello')).toBeInTheDocument();
});
```

### Mock Data
Consistent mock data is available for all tests:

```tsx
import { mockVideos, mockCreators } from '../test/mocks/mockData';

test('displays video information', () => {
  render(<VideoCard video={mockVideos[0]} />);
  // Test implementation
});
```

### File Mocking
Helper functions for testing file uploads:

```tsx
import { createMockFile } from '../test/utils/test-utils';

test('handles file upload', () => {
  const mockFile = createMockFile('video.mp4', 1024 * 1024 * 100);
  // Test file upload logic
});
```

## Testing Patterns

### Component Testing
```tsx
describe('VideoCard', () => {
  it('renders video information correctly', () => {
    render(<VideoCard video={mockVideo} />);
    
    expect(screen.getByText(mockVideo.title)).toBeInTheDocument();
    expect(screen.getByText(mockVideo.creator.displayName)).toBeInTheDocument();
  });

  it('handles click events', () => {
    const mockNavigate = vi.fn();
    vi.mocked(useNavigate).mockReturnValue(mockNavigate);
    
    render(<VideoCard video={mockVideo} />);
    fireEvent.click(screen.getByRole('article'));
    
    expect(mockNavigate).toHaveBeenCalledWith(`/watch/${mockVideo.id}`);
  });
});
```

### Hook Testing
```tsx
describe('useTip', () => {
  it('sends tip successfully', async () => {
    const { result } = renderHook(() => useTip(), { wrapper });
    
    result.current.sendTip({ videoId: 'video-1', amount: 5.00 });
    
    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });
  });
});
```

### Integration Testing
```tsx
describe('Upload Workflow', () => {
  it('completes full upload process', async () => {
    render(<Upload />);
    
    // Select file
    const fileInput = screen.getByLabelText(/select video/i);
    fireEvent.change(fileInput, { target: { files: [mockFile] } });
    
    // Fill metadata
    fireEvent.change(screen.getByLabelText(/title/i), { 
      target: { value: 'Test Video' } 
    });
    
    // Start upload
    fireEvent.click(screen.getByRole('button', { name: /upload/i }));
    
    // Verify completion
    await waitFor(() => {
      expect(screen.getByText(/upload completed/i)).toBeInTheDocument();
    });
  });
});
```

### E2E Testing
```tsx
test('user can upload and watch video', async ({ page }) => {
  await page.goto('/upload');
  
  // Upload workflow
  await page.setInputFiles('[data-testid="file-input"]', 'test-video.mp4');
  await page.fill('[data-testid="title-input"]', 'E2E Test Video');
  await page.click('[data-testid="upload-button"]');
  
  // Verify upload success
  await expect(page.locator('[data-testid="upload-success"]')).toBeVisible();
  
  // Navigate to watch page
  await page.click('[data-testid="watch-video-link"]');
  
  // Verify video plays
  await expect(page.locator('[data-testid="video-player"]')).toBeVisible();
});
```

## Mock Service Worker (MSW)

API responses are mocked using MSW for consistent testing:

```tsx
// Mock successful API response
server.use(
  http.post('/api/tips', () => {
    return HttpResponse.json({ id: 'tip-123', status: 'completed' });
  })
);

// Mock error response
server.use(
  http.post('/api/tips', () => {
    return new HttpResponse(null, { status: 400 });
  })
);
```

## Accessibility Testing

All tests include accessibility checks:

```tsx
test('component is accessible', () => {
  render(<MyComponent />);
  
  // Check ARIA labels
  expect(screen.getByRole('button')).toHaveAttribute('aria-label', 'Expected label');
  
  // Check keyboard navigation
  const button = screen.getByRole('button');
  button.focus();
  expect(button).toHaveFocus();
  
  // Check screen reader content
  expect(screen.getByLabelText(/screen reader text/i)).toBeInTheDocument();
});
```

## Performance Testing

Performance metrics are tested in E2E tests:

```tsx
test('page loads within performance budget', async ({ page }) => {
  await page.goto('/');
  
  // Measure Core Web Vitals
  const metrics = await page.evaluate(() => {
    return new Promise((resolve) => {
      new PerformanceObserver((list) => {
        const entries = list.getEntries();
        resolve(entries);
      }).observe({ entryTypes: ['navigation', 'paint'] });
    });
  });
  
  // Assert performance thresholds
  expect(metrics.loadEventEnd).toBeLessThan(3000);
});
```

## Coverage Requirements

- **Unit Tests**: 90%+ line coverage
- **Integration Tests**: Cover all critical user workflows
- **E2E Tests**: Cover all primary user journeys

## Continuous Integration

Tests run automatically on:
- Pull requests
- Main branch commits
- Nightly builds (E2E tests)

### CI Configuration
```yaml
# .github/workflows/test.yml
- name: Run unit tests
  run: npm run test:run

- name: Run E2E tests
  run: npm run test:e2e
  env:
    CI: true
```

## Best Practices

1. **Test Behavior, Not Implementation**
   - Focus on user interactions and outcomes
   - Avoid testing internal component state

2. **Use Semantic Queries**
   - Prefer `getByRole`, `getByLabelText` over `getByTestId`
   - Write tests that reflect how users interact with the app

3. **Mock External Dependencies**
   - Mock API calls, WebSocket connections, file uploads
   - Use MSW for consistent API mocking

4. **Test Error States**
   - Include tests for error conditions and edge cases
   - Verify error messages and recovery flows

5. **Accessibility First**
   - Include accessibility checks in all component tests
   - Test keyboard navigation and screen reader compatibility

6. **Performance Awareness**
   - Test loading states and performance metrics
   - Verify lazy loading and code splitting

## Debugging Tests

### Debug Mode
```bash
# Run tests in debug mode
npm run test -- --inspect-brk

# Run specific test with debugging
npm run test -- --grep "specific test" --inspect-brk
```

### Browser Debugging (E2E)
```bash
# Run E2E tests in headed mode
npm run test:e2e -- --headed

# Debug specific E2E test
npm run test:e2e -- --debug upload-workflow.spec.ts
```

### Test Artifacts
- Screenshots on failure (E2E)
- Video recordings (E2E)
- Coverage reports (HTML)
- Test traces (Playwright)

## Contributing

When adding new features:

1. Write unit tests for new components/hooks
2. Add integration tests for new workflows
3. Update E2E tests for new user journeys
4. Maintain test coverage above 90%
5. Update this documentation for new patterns

## Troubleshooting

### Common Issues

**Tests timing out**
- Increase timeout in test configuration
- Check for unresolved promises
- Verify mock responses are correct

**MSW not intercepting requests**
- Ensure server is started in test setup
- Check request URLs match mock handlers
- Verify handlers are reset between tests

**E2E tests flaky**
- Add proper wait conditions
- Use data-testid attributes for reliable selectors
- Check for race conditions in async operations

**Coverage not accurate**
- Ensure all source files are included
- Check for untested code paths
- Verify test files are not included in coverage