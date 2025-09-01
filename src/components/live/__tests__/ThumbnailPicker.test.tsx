import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import ThumbnailPicker from '../ThumbnailPicker';
import { liveApi } from '../../../lib/api';

// Mock the API
vi.mock('../../../lib/api', () => ({
  liveApi: {
    uploadThumbnail: vi.fn(),
    setThumbnailFrame: vi.fn(),
  },
}));

const mockUploadThumbnail = vi.mocked(liveApi.uploadThumbnail);
const mockSetThumbnailFrame = vi.mocked(liveApi.setThumbnailFrame);

// Mock FileReader
const mockFileReader = {
  readAsDataURL: vi.fn(),
  result: 'data:image/jpeg;base64,mockImageData',
  onload: null as any,
};

Object.defineProperty(window, 'FileReader', {
  writable: true,
  value: vi.fn(() => mockFileReader),
});

describe('ThumbnailPicker', () => {
  const mockStreamId = 'test-stream-123';
  const mockOnThumbnailUpdate = vi.fn();
  const mockThumbnailUrl = 'https://example.com/thumbnail.jpg';

  beforeEach(() => {
    vi.clearAllMocks();
    mockUploadThumbnail.mockResolvedValue({ 
      ok: true, 
      data: { thumbnailUrl: mockThumbnailUrl } 
    });
    mockSetThumbnailFrame.mockResolvedValue({ 
      ok: true, 
      data: { thumbnailUrl: mockThumbnailUrl } 
    });
  });

  it('renders with stream thumbnail header', () => {
    render(<ThumbnailPicker streamId={mockStreamId} />);
    
    expect(screen.getByText('Stream Thumbnail')).toBeInTheDocument();
    expect(screen.getByText('Upload a custom thumbnail or capture from your live feed')).toBeInTheDocument();
  });

  it('shows no thumbnail state when no current thumbnail', () => {
    render(<ThumbnailPicker streamId={mockStreamId} />);
    
    expect(screen.getByText('No thumbnail set')).toBeInTheDocument();
    expect(screen.getByText('Current Thumbnail')).toBeInTheDocument();
  });

  it('shows current thumbnail when provided', () => {
    render(
      <ThumbnailPicker 
        streamId={mockStreamId} 
        currentThumbnail={mockThumbnailUrl}
      />
    );
    
    const thumbnailImage = screen.getByAltText('Stream thumbnail');
    expect(thumbnailImage).toBeInTheDocument();
    expect(thumbnailImage).toHaveAttribute('src', mockThumbnailUrl);
    expect(screen.getByText('Thumbnail Set')).toBeInTheDocument();
  });

  it('renders upload options', () => {
    render(<ThumbnailPicker streamId={mockStreamId} />);
    
    expect(screen.getByText('Upload Options')).toBeInTheDocument();
    expect(screen.getByText('Upload Image')).toBeInTheDocument();
    expect(screen.getByText('Drag & drop or click to select')).toBeInTheDocument();
    expect(screen.getByText('JPG, PNG up to 5MB')).toBeInTheDocument();
    
    expect(screen.getByText('Capture Frame')).toBeInTheDocument();
    expect(screen.getByText('Use current live frame')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Capture Now/ })).toBeInTheDocument();
  });

  it('shows thumbnail guidelines', () => {
    render(<ThumbnailPicker streamId={mockStreamId} />);
    
    expect(screen.getByText('Thumbnail Guidelines')).toBeInTheDocument();
    expect(screen.getByText(/Use high-quality images with 16:9 aspect ratio/)).toBeInTheDocument();
    expect(screen.getByText(/Recommended resolution: 1280x720 pixels/)).toBeInTheDocument();
    expect(screen.getByText(/Avoid text overlays/)).toBeInTheDocument();
    expect(screen.getByText(/Thumbnails help viewers identify your stream/)).toBeInTheDocument();
  });

  it('handles file upload via file input', async () => {
    render(<ThumbnailPicker streamId={mockStreamId} onThumbnailUpdate={mockOnThumbnailUpdate} />);
    
    // Create a mock file
    const file = new File(['mock image data'], 'thumbnail.jpg', { type: 'image/jpeg' });
    
    // Find the hidden file input
    const fileInput = screen.getByRole('textbox', { hidden: true }) || 
                     document.querySelector('input[type="file"]') as HTMLInputElement;
    
    // Simulate file selection
    Object.defineProperty(fileInput, 'files', {
      value: [file],
      writable: false,
    });
    
    fireEvent.change(fileInput);

    // Simulate FileReader onload
    if (mockFileReader.onload) {
      mockFileReader.onload({ target: { result: mockFileReader.result } } as any);
    }

    await waitFor(() => {
      expect(mockUploadThumbnail).toHaveBeenCalledWith(mockStreamId, expect.any(FormData));
    });

    await waitFor(() => {
      expect(mockOnThumbnailUpdate).toHaveBeenCalledWith(mockThumbnailUrl);
      expect(screen.getByText('Thumbnail uploaded successfully')).toBeInTheDocument();
    });
  });

  it('validates file type on upload', async () => {
    render(<ThumbnailPicker streamId={mockStreamId} />);
    
    // Create a non-image file
    const file = new File(['mock text data'], 'document.txt', { type: 'text/plain' });
    
    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
    Object.defineProperty(fileInput, 'files', {
      value: [file],
      writable: false,
    });
    
    fireEvent.change(fileInput);

    await waitFor(() => {
      expect(screen.getByText('Please select a valid image file')).toBeInTheDocument();
    });

    expect(mockUploadThumbnail).not.toHaveBeenCalled();
  });

  it('validates file size on upload', async () => {
    render(<ThumbnailPicker streamId={mockStreamId} />);
    
    // Create a large file (6MB)
    const largeFile = new File(['x'.repeat(6 * 1024 * 1024)], 'large.jpg', { type: 'image/jpeg' });
    
    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
    Object.defineProperty(fileInput, 'files', {
      value: [largeFile],
      writable: false,
    });
    
    fireEvent.change(fileInput);

    await waitFor(() => {
      expect(screen.getByText('File size must be less than 5MB')).toBeInTheDocument();
    });

    expect(mockUploadThumbnail).not.toHaveBeenCalled();
  });

  it('handles capture current frame', async () => {
    render(<ThumbnailPicker streamId={mockStreamId} onThumbnailUpdate={mockOnThumbnailUpdate} />);
    
    const captureButton = screen.getByRole('button', { name: /Capture Now/ });
    fireEvent.click(captureButton);

    expect(screen.getByText('Capturing...')).toBeInTheDocument();

    await waitFor(() => {
      expect(mockSetThumbnailFrame).toHaveBeenCalledWith(mockStreamId, expect.any(Number));
    });

    await waitFor(() => {
      expect(mockOnThumbnailUpdate).toHaveBeenCalledWith(mockThumbnailUrl);
      expect(screen.getByText('Thumbnail captured from live feed')).toBeInTheDocument();
    });
  });

  it('handles upload API error', async () => {
    const errorMessage = 'Upload failed';
    mockUploadThumbnail.mockResolvedValue({ 
      ok: false, 
      error: errorMessage,
      data: null 
    });

    render(<ThumbnailPicker streamId={mockStreamId} />);
    
    const file = new File(['mock image data'], 'thumbnail.jpg', { type: 'image/jpeg' });
    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
    
    Object.defineProperty(fileInput, 'files', {
      value: [file],
      writable: false,
    });
    
    fireEvent.change(fileInput);

    // Simulate FileReader onload
    if (mockFileReader.onload) {
      mockFileReader.onload({ target: { result: mockFileReader.result } } as any);
    }

    await waitFor(() => {
      expect(screen.getByText(errorMessage)).toBeInTheDocument();
    });
  });

  it('handles capture frame API error', async () => {
    const errorMessage = 'Capture failed';
    mockSetThumbnailFrame.mockResolvedValue({ 
      ok: false, 
      error: errorMessage,
      data: null 
    });

    render(<ThumbnailPicker streamId={mockStreamId} />);
    
    const captureButton = screen.getByRole('button', { name: /Capture Now/ });
    fireEvent.click(captureButton);

    await waitFor(() => {
      expect(screen.getByText(errorMessage)).toBeInTheDocument();
    });
  });

  it('handles network errors gracefully', async () => {
    const networkError = new Error('Network error');
    mockUploadThumbnail.mockRejectedValue(networkError);

    render(<ThumbnailPicker streamId={mockStreamId} />);
    
    const file = new File(['mock image data'], 'thumbnail.jpg', { type: 'image/jpeg' });
    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
    
    Object.defineProperty(fileInput, 'files', {
      value: [file],
      writable: false,
    });
    
    fireEvent.change(fileInput);

    // Simulate FileReader onload
    if (mockFileReader.onload) {
      mockFileReader.onload({ target: { result: mockFileReader.result } } as any);
    }

    await waitFor(() => {
      expect(screen.getByText('Network error')).toBeInTheDocument();
    });
  });

  it('removes thumbnail when remove button is clicked', async () => {
    render(
      <ThumbnailPicker 
        streamId={mockStreamId} 
        currentThumbnail={mockThumbnailUrl}
        onThumbnailUpdate={mockOnThumbnailUpdate}
      />
    );
    
    // Hover over the thumbnail to show remove button
    const thumbnailContainer = screen.getByAltText('Stream thumbnail').parentElement;
    fireEvent.mouseEnter(thumbnailContainer!);

    const removeButton = screen.getByRole('button', { name: /Remove/ });
    fireEvent.click(removeButton);

    expect(mockOnThumbnailUpdate).toHaveBeenCalledWith('');
    expect(screen.getByText('Thumbnail removed')).toBeInTheDocument();
    expect(screen.getByText('No thumbnail set')).toBeInTheDocument();
  });

  it('opens file picker when upload area is clicked', () => {
    render(<ThumbnailPicker streamId={mockStreamId} />);
    
    const uploadArea = screen.getByText('Upload Image').closest('div');
    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
    
    const clickSpy = vi.spyOn(fileInput, 'click');
    
    fireEvent.click(uploadArea!);
    
    expect(clickSpy).toHaveBeenCalled();
  });

  it('handles drag and drop', async () => {
    render(<ThumbnailPicker streamId={mockStreamId} onThumbnailUpdate={mockOnThumbnailUpdate} />);
    
    const file = new File(['mock image data'], 'thumbnail.jpg', { type: 'image/jpeg' });
    const uploadArea = screen.getByText('Upload Image').closest('div');
    
    // Create drag event with files
    const dragEvent = new Event('drop', { bubbles: true });
    Object.defineProperty(dragEvent, 'dataTransfer', {
      value: {
        files: [file]
      }
    });
    
    fireEvent(uploadArea!, dragEvent);

    // Simulate FileReader onload
    if (mockFileReader.onload) {
      mockFileReader.onload({ target: { result: mockFileReader.result } } as any);
    }

    await waitFor(() => {
      expect(mockUploadThumbnail).toHaveBeenCalledWith(mockStreamId, expect.any(FormData));
    });
  });

  it('prevents multiple simultaneous uploads', async () => {
    // Make API call take longer
    let resolvePromise: (value: any) => void;
    const promise = new Promise(resolve => {
      resolvePromise = resolve;
    });
    mockUploadThumbnail.mockReturnValue(promise);

    render(<ThumbnailPicker streamId={mockStreamId} />);
    
    const file = new File(['mock image data'], 'thumbnail.jpg', { type: 'image/jpeg' });
    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
    
    // First upload
    Object.defineProperty(fileInput, 'files', {
      value: [file],
      writable: false,
    });
    fireEvent.change(fileInput);

    // Try second upload while first is in progress
    const file2 = new File(['mock image data 2'], 'thumbnail2.jpg', { type: 'image/jpeg' });
    Object.defineProperty(fileInput, 'files', {
      value: [file2],
      writable: false,
    });
    fireEvent.change(fileInput);

    // Should only be called once due to loading state
    expect(mockUploadThumbnail).toHaveBeenCalledTimes(1);
    
    // Resolve the promise
    resolvePromise!({ ok: true, data: { thumbnailUrl: mockThumbnailUrl } });
    
    await waitFor(() => {
      expect(mockUploadThumbnail).toHaveBeenCalledTimes(1);
    });
  });

  it('disables capture button during loading', async () => {
    // Make API call take longer
    let resolvePromise: (value: any) => void;
    const promise = new Promise(resolve => {
      resolvePromise = resolve;
    });
    mockSetThumbnailFrame.mockReturnValue(promise);

    render(<ThumbnailPicker streamId={mockStreamId} />);
    
    const captureButton = screen.getByRole('button', { name: /Capture Now/ });
    fireEvent.click(captureButton);

    // Button should be disabled during loading
    expect(captureButton).toBeDisabled();
    expect(screen.getByText('Capturing...')).toBeInTheDocument();
    
    // Resolve the promise
    resolvePromise!({ ok: true, data: { thumbnailUrl: mockThumbnailUrl } });
    
    await waitFor(() => {
      expect(mockSetThumbnailFrame).toHaveBeenCalled();
    });
  });
});