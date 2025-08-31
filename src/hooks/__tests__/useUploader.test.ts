import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor, act } from '@testing-library/react';
import { useUploader } from '../useUploader';
import { createMockFile } from '../../test/utils/test-utils';

// Mock TUS client
const mockTusUpload = {
  start: vi.fn(),
  abort: vi.fn(),
  findPreviousUploads: vi.fn().mockResolvedValue([]),
};

vi.mock('tus-js-client', () => ({
  Upload: vi.fn().mockImplementation(() => mockTusUpload),
}));

// Mock IndexedDB
const mockIdbKeyval = {
  get: vi.fn(),
  set: vi.fn(),
  del: vi.fn(),
};

vi.mock('idb-keyval', () => mockIdbKeyval);

describe('useUploader', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockIdbKeyval.get.mockResolvedValue(null);
    mockIdbKeyval.set.mockResolvedValue(undefined);
    mockIdbKeyval.del.mockResolvedValue(undefined);
  });

  it('should initialize with default state', () => {
    const { result } = renderHook(() => useUploader());

    expect(result.current.uploads).toEqual([]);
    expect(result.current.isUploading).toBe(false);
  });

  it('should start upload with valid file', async () => {
    const { result } = renderHook(() => useUploader());
    const mockFile = createMockFile('test-video.mp4', 1024 * 1024 * 100);

    await act(async () => {
      result.current.startUpload(mockFile, {
        title: 'Test Video',
        description: 'Test Description',
        tags: ['test'],
        visibility: 'public',
      });
    });

    expect(result.current.uploads).toHaveLength(1);
    expect(result.current.isUploading).toBe(true);
    expect(mockTusUpload.start).toHaveBeenCalled();
  });

  it('should reject invalid file types', async () => {
    const { result } = renderHook(() => useUploader());
    const invalidFile = createMockFile('test.txt', 1024, 'text/plain');

    await act(async () => {
      try {
        result.current.startUpload(invalidFile, {
          title: 'Test Video',
          description: 'Test Description',
          tags: ['test'],
          visibility: 'public',
        });
      } catch (error) {
        expect(error.message).toContain('Invalid file type');
      }
    });

    expect(result.current.uploads).toHaveLength(0);
    expect(mockTusUpload.start).not.toHaveBeenCalled();
  });

  it('should reject files that are too large', async () => {
    const { result } = renderHook(() => useUploader());
    const largeFile = createMockFile('large-video.mp4', 1024 * 1024 * 1024 * 25); // 25GB

    await act(async () => {
      try {
        result.current.startUpload(largeFile, {
          title: 'Large Video',
          description: 'Large Description',
          tags: ['test'],
          visibility: 'public',
        });
      } catch (error) {
        expect(error.message).toContain('File too large');
      }
    });

    expect(result.current.uploads).toHaveLength(0);
  });

  it('should update upload progress', async () => {
    const { result } = renderHook(() => useUploader());
    const mockFile = createMockFile();

    // Mock TUS upload with progress callback
    const mockUploadWithProgress = {
      ...mockTusUpload,
      start: vi.fn().mockImplementation(() => {
        // Simulate progress updates
        setTimeout(() => {
          const progressCallback = vi.mocked(require('tus-js-client').Upload).mock.calls[0][1].onProgress;
          progressCallback(500, 1000); // 50% progress
        }, 10);
      }),
    };

    vi.mocked(require('tus-js-client').Upload).mockImplementation(() => mockUploadWithProgress);

    await act(async () => {
      result.current.startUpload(mockFile, {
        title: 'Test Video',
        description: 'Test Description',
        tags: ['test'],
        visibility: 'public',
      });
    });

    await waitFor(() => {
      const upload = result.current.uploads[0];
      expect(upload.progress).toBe(50);
    });
  });

  it('should handle upload success', async () => {
    const { result } = renderHook(() => useUploader());
    const mockFile = createMockFile();

    // Mock successful upload
    const mockUploadWithSuccess = {
      ...mockTusUpload,
      start: vi.fn().mockImplementation(() => {
        setTimeout(() => {
          const successCallback = vi.mocked(require('tus-js-client').Upload).mock.calls[0][1].onSuccess;
          successCallback();
        }, 10);
      }),
    };

    vi.mocked(require('tus-js-client').Upload).mockImplementation(() => mockUploadWithSuccess);

    await act(async () => {
      result.current.startUpload(mockFile, {
        title: 'Test Video',
        description: 'Test Description',
        tags: ['test'],
        visibility: 'public',
      });
    });

    await waitFor(() => {
      const upload = result.current.uploads[0];
      expect(upload.status).toBe('completed');
      expect(result.current.isUploading).toBe(false);
    });
  });

  it('should handle upload errors', async () => {
    const { result } = renderHook(() => useUploader());
    const mockFile = createMockFile();

    // Mock upload error
    const mockUploadWithError = {
      ...mockTusUpload,
      start: vi.fn().mockImplementation(() => {
        setTimeout(() => {
          const errorCallback = vi.mocked(require('tus-js-client').Upload).mock.calls[0][1].onError;
          errorCallback(new Error('Upload failed'));
        }, 10);
      }),
    };

    vi.mocked(require('tus-js-client').Upload).mockImplementation(() => mockUploadWithError);

    await act(async () => {
      result.current.startUpload(mockFile, {
        title: 'Test Video',
        description: 'Test Description',
        tags: ['test'],
        visibility: 'public',
      });
    });

    await waitFor(() => {
      const upload = result.current.uploads[0];
      expect(upload.status).toBe('failed');
      expect(upload.error).toBeTruthy();
    });
  });

  it('should pause and resume uploads', async () => {
    const { result } = renderHook(() => useUploader());
    const mockFile = createMockFile();

    await act(async () => {
      result.current.startUpload(mockFile, {
        title: 'Test Video',
        description: 'Test Description',
        tags: ['test'],
        visibility: 'public',
      });
    });

    const uploadId = result.current.uploads[0].id;

    // Pause upload
    await act(async () => {
      result.current.pauseUpload(uploadId);
    });

    expect(mockTusUpload.abort).toHaveBeenCalled();

    // Resume upload
    await act(async () => {
      result.current.resumeUpload(uploadId);
    });

    expect(mockTusUpload.start).toHaveBeenCalledTimes(2);
  });

  it('should cancel uploads', async () => {
    const { result } = renderHook(() => useUploader());
    const mockFile = createMockFile();

    await act(async () => {
      result.current.startUpload(mockFile, {
        title: 'Test Video',
        description: 'Test Description',
        tags: ['test'],
        visibility: 'public',
      });
    });

    const uploadId = result.current.uploads[0].id;

    await act(async () => {
      result.current.cancelUpload(uploadId);
    });

    expect(mockTusUpload.abort).toHaveBeenCalled();
    expect(result.current.uploads).toHaveLength(0);
    expect(mockIdbKeyval.del).toHaveBeenCalledWith(`upload-${uploadId}`);
  });

  it('should persist upload state to IndexedDB', async () => {
    const { result } = renderHook(() => useUploader());
    const mockFile = createMockFile();

    await act(async () => {
      result.current.startUpload(mockFile, {
        title: 'Test Video',
        description: 'Test Description',
        tags: ['test'],
        visibility: 'public',
      });
    });

    expect(mockIdbKeyval.set).toHaveBeenCalled();
    const setCall = mockIdbKeyval.set.mock.calls[0];
    expect(setCall[0]).toMatch(/^upload-/);
    expect(setCall[1]).toMatchObject({
      file: expect.any(Object),
      metadata: expect.any(Object),
      progress: 0,
      status: 'uploading',
    });
  });

  it('should restore uploads from IndexedDB on initialization', async () => {
    const savedUpload = {
      id: 'upload-123',
      file: createMockFile(),
      metadata: {
        title: 'Saved Video',
        description: 'Saved Description',
        tags: ['saved'],
        visibility: 'public',
      },
      progress: 25,
      status: 'paused',
      tusUrl: 'https://upload.example.com/files/123',
    };

    mockIdbKeyval.get.mockResolvedValue(savedUpload);

    const { result } = renderHook(() => useUploader());

    await waitFor(() => {
      expect(result.current.uploads).toHaveLength(1);
      expect(result.current.uploads[0]).toMatchObject({
        id: 'upload-123',
        progress: 25,
        status: 'paused',
      });
    });
  });

  it('should handle multiple concurrent uploads', async () => {
    const { result } = renderHook(() => useUploader());
    const file1 = createMockFile('video1.mp4');
    const file2 = createMockFile('video2.mp4');

    await act(async () => {
      result.current.startUpload(file1, {
        title: 'Video 1',
        description: 'Description 1',
        tags: ['test1'],
        visibility: 'public',
      });

      result.current.startUpload(file2, {
        title: 'Video 2',
        description: 'Description 2',
        tags: ['test2'],
        visibility: 'public',
      });
    });

    expect(result.current.uploads).toHaveLength(2);
    expect(result.current.isUploading).toBe(true);
    expect(mockTusUpload.start).toHaveBeenCalledTimes(2);
  });
});