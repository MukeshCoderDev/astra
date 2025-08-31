import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '../utils/test-utils';
import { server } from '../mocks/server';
import { http, HttpResponse } from 'msw';
import { createMockFile } from '../utils/test-utils';
import Upload from '../../pages/Upload/Upload';

// Mock file input
const mockFileInput = vi.fn();
Object.defineProperty(HTMLInputElement.prototype, 'files', {
  get: mockFileInput,
});

// Mock TUS upload
const mockTusUpload = {
  start: vi.fn(),
  abort: vi.fn(),
  findPreviousUploads: vi.fn().mockResolvedValue([]),
};

vi.mock('tus-js-client', () => ({
  Upload: vi.fn().mockImplementation((file, options) => {
    // Simulate successful upload after a delay
    setTimeout(() => {
      options.onProgress?.(file.size, file.size);
      options.onSuccess?.();
    }, 100);
    return mockTusUpload;
  }),
}));

describe('Upload Workflow Integration', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should complete full upload workflow', async () => {
    // Mock successful upload initiation
    server.use(
      http.post('https://bff.example.com/uploads/initiate', () => {
        return HttpResponse.json({
          uploadId: 'upload-123',
          tusUrl: 'https://upload.example.com/files/upload-123',
        });
      }),
      http.post('https://bff.example.com/uploads/complete', () => {
        return HttpResponse.json({
          videoId: 'video-123',
          status: 'processing',
        });
      })
    );

    render(<Upload />);

    // Step 1: File selection
    const fileInput = screen.getByLabelText(/select video file/i);
    const mockFile = createMockFile('test-video.mp4', 1024 * 1024 * 100);
    
    mockFileInput.mockReturnValue([mockFile]);
    fireEvent.change(fileInput);

    // Should show file selected
    await waitFor(() => {
      expect(screen.getByText('test-video.mp4')).toBeInTheDocument();
    });

    // Step 2: Fill metadata form
    const titleInput = screen.getByLabelText(/title/i);
    const descriptionInput = screen.getByLabelText(/description/i);
    const tagsInput = screen.getByLabelText(/tags/i);

    fireEvent.change(titleInput, { target: { value: 'My Test Video' } });
    fireEvent.change(descriptionInput, { target: { value: 'This is a test video description' } });
    fireEvent.change(tagsInput, { target: { value: 'test, video, upload' } });

    // Step 3: Set visibility
    const publicRadio = screen.getByLabelText(/public/i);
    fireEvent.click(publicRadio);

    // Step 4: Start upload
    const uploadButton = screen.getByRole('button', { name: /start upload/i });
    fireEvent.click(uploadButton);

    // Should show upload progress
    await waitFor(() => {
      expect(screen.getByRole('progressbar')).toBeInTheDocument();
    });

    // Should show upload completion
    await waitFor(() => {
      expect(screen.getByText(/upload completed/i)).toBeInTheDocument();
    }, { timeout: 5000 });

    // Should show success message
    expect(screen.getByText(/video uploaded successfully/i)).toBeInTheDocument();
  });

  it('should handle upload errors gracefully', async () => {
    // Mock upload error
    server.use(
      http.post('https://bff.example.com/uploads/initiate', () => {
        return new HttpResponse(null, { status: 500 });
      })
    );

    render(<Upload />);

    // Select file
    const fileInput = screen.getByLabelText(/select video file/i);
    const mockFile = createMockFile('test-video.mp4');
    
    mockFileInput.mockReturnValue([mockFile]);
    fireEvent.change(fileInput);

    // Fill form
    fireEvent.change(screen.getByLabelText(/title/i), { 
      target: { value: 'Test Video' } 
    });

    // Try to upload
    const uploadButton = screen.getByRole('button', { name: /start upload/i });
    fireEvent.click(uploadButton);

    // Should show error message
    await waitFor(() => {
      expect(screen.getByText(/upload failed/i)).toBeInTheDocument();
    });

    // Should show retry button
    expect(screen.getByRole('button', { name: /retry/i })).toBeInTheDocument();
  });

  it('should validate file type and size', async () => {
    render(<Upload />);

    // Try to upload invalid file type
    const fileInput = screen.getByLabelText(/select video file/i);
    const invalidFile = createMockFile('document.pdf', 1024, 'application/pdf');
    
    mockFileInput.mockReturnValue([invalidFile]);
    fireEvent.change(fileInput);

    // Should show error message
    await waitFor(() => {
      expect(screen.getByText(/invalid file type/i)).toBeInTheDocument();
    });

    // Try to upload file that's too large
    const largeFile = createMockFile('large-video.mp4', 1024 * 1024 * 1024 * 25); // 25GB
    mockFileInput.mockReturnValue([largeFile]);
    fireEvent.change(fileInput);

    await waitFor(() => {
      expect(screen.getByText(/file too large/i)).toBeInTheDocument();
    });
  });

  it('should support upload pause and resume', async () => {
    render(<Upload />);

    // Start upload
    const fileInput = screen.getByLabelText(/select video file/i);
    const mockFile = createMockFile('test-video.mp4');
    
    mockFileInput.mockReturnValue([mockFile]);
    fireEvent.change(fileInput);

    fireEvent.change(screen.getByLabelText(/title/i), { 
      target: { value: 'Test Video' } 
    });

    const uploadButton = screen.getByRole('button', { name: /start upload/i });
    fireEvent.click(uploadButton);

    // Should show pause button during upload
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /pause/i })).toBeInTheDocument();
    });

    // Pause upload
    const pauseButton = screen.getByRole('button', { name: /pause/i });
    fireEvent.click(pauseButton);

    expect(mockTusUpload.abort).toHaveBeenCalled();

    // Should show resume button
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /resume/i })).toBeInTheDocument();
    });

    // Resume upload
    const resumeButton = screen.getByRole('button', { name: /resume/i });
    fireEvent.click(resumeButton);

    expect(mockTusUpload.start).toHaveBeenCalledTimes(2);
  });

  it('should handle adult content compliance', async () => {
    render(<Upload />);

    // Select file and fill basic info
    const fileInput = screen.getByLabelText(/select video file/i);
    const mockFile = createMockFile('adult-video.mp4');
    
    mockFileInput.mockReturnValue([mockFile]);
    fireEvent.change(fileInput);

    fireEvent.change(screen.getByLabelText(/title/i), { 
      target: { value: 'Adult Content Video' } 
    });

    // Mark as adult content
    const adultContentCheckbox = screen.getByLabelText(/adult content/i);
    fireEvent.click(adultContentCheckbox);

    // Should show compliance requirements
    await waitFor(() => {
      expect(screen.getByText(/2257 compliance required/i)).toBeInTheDocument();
    });

    // Should show ID verification requirement
    expect(screen.getByText(/id verification/i)).toBeInTheDocument();
    expect(screen.getByText(/model release/i)).toBeInTheDocument();

    // Upload button should be disabled until compliance is complete
    const uploadButton = screen.getByRole('button', { name: /start upload/i });
    expect(uploadButton).toBeDisabled();
  });

  it('should persist upload state across page refreshes', async () => {
    // Mock IndexedDB with existing upload
    const mockGet = vi.fn().mockResolvedValue({
      id: 'upload-123',
      file: createMockFile('persisted-video.mp4'),
      metadata: {
        title: 'Persisted Video',
        description: 'This upload was persisted',
        tags: ['persisted'],
        visibility: 'public',
      },
      progress: 50,
      status: 'paused',
      tusUrl: 'https://upload.example.com/files/123',
    });

    vi.doMock('idb-keyval', () => ({
      get: mockGet,
      set: vi.fn(),
      del: vi.fn(),
    }));

    render(<Upload />);

    // Should restore the persisted upload
    await waitFor(() => {
      expect(screen.getByText('Persisted Video')).toBeInTheDocument();
      expect(screen.getByText('50%')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /resume/i })).toBeInTheDocument();
    });
  });

  it('should handle multiple file uploads', async () => {
    render(<Upload />);

    // Select multiple files
    const fileInput = screen.getByLabelText(/select video file/i);
    const file1 = createMockFile('video1.mp4');
    const file2 = createMockFile('video2.mp4');
    
    mockFileInput.mockReturnValue([file1, file2]);
    fireEvent.change(fileInput);

    // Should show both files
    await waitFor(() => {
      expect(screen.getByText('video1.mp4')).toBeInTheDocument();
      expect(screen.getByText('video2.mp4')).toBeInTheDocument();
    });

    // Should show upload queue
    expect(screen.getByText(/2 files selected/i)).toBeInTheDocument();

    // Fill metadata for first file
    const titleInputs = screen.getAllByLabelText(/title/i);
    fireEvent.change(titleInputs[0], { target: { value: 'First Video' } });
    fireEvent.change(titleInputs[1], { target: { value: 'Second Video' } });

    // Start batch upload
    const uploadAllButton = screen.getByRole('button', { name: /upload all/i });
    fireEvent.click(uploadAllButton);

    // Should show progress for both uploads
    await waitFor(() => {
      const progressBars = screen.getAllByRole('progressbar');
      expect(progressBars).toHaveLength(2);
    });
  });
});