import { useState, useCallback, useRef } from 'react';
import * as tus from 'tus-js-client';
import { set, get, del } from 'idb-keyval';
import { UploadSession, VideoMetadata } from '../types';

interface UploadOptions {
  endpoint?: string;
  chunkSize?: number;
  retryDelays?: number[];
  parallelUploads?: number;
  onProgress?: (progress: number) => void;
  onSuccess?: (uploadUrl: string) => void;
  onError?: (error: Error) => void;
}

interface UploadStats {
  speed: number; // bytes per second
  timeRemaining: number; // seconds
  bytesUploaded: number;
  totalBytes: number;
}

export function useUploader(options: UploadOptions = {}) {
  const [uploadSession, setUploadSession] = useState<UploadSession | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [uploadStats, setUploadStats] = useState<UploadStats | null>(null);

  const uploadRef = useRef<tus.Upload | null>(null);
  const startTimeRef = useRef<number>(0);
  const lastProgressRef = useRef<{ bytes: number; time: number }>({ bytes: 0, time: 0 });

  const {
    endpoint = import.meta.env.VITE_UPLOAD_TUS_ENDPOINT || 'https://tusd.tusdemo.net/files/',
    chunkSize = 8 * 1024 * 1024, // 8MB chunks
    retryDelays = [0, 3000, 5000, 10000, 20000],
    onProgress,
    onSuccess,
    onError
  } = options;

  // Generate unique session ID
  const generateSessionId = () => {
    return `upload_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  };

  // Save upload session to IndexedDB
  const saveSession = async (session: UploadSession) => {
    try {
      await set(`upload_session_${session.id}`, session);
    } catch (err) {
      console.warn('Failed to save upload session:', err);
    }
  };

  // Load upload session from IndexedDB
  const loadSession = async (sessionId: string): Promise<UploadSession | null> => {
    try {
      return await get(`upload_session_${sessionId}`);
    } catch (err) {
      console.warn('Failed to load upload session:', err);
      return null;
    }
  };

  // Remove upload session from IndexedDB
  const removeSession = async (sessionId: string) => {
    try {
      await del(`upload_session_${sessionId}`);
    } catch (err) {
      console.warn('Failed to remove upload session:', err);
    }
  };

  // Calculate upload statistics
  const updateStats = useCallback((bytesUploaded: number, totalBytes: number) => {
    const now = Date.now();
    const timeDiff = now - lastProgressRef.current.time;
    const bytesDiff = bytesUploaded - lastProgressRef.current.bytes;

    if (timeDiff > 1000) { // Update stats every second
      const speed = bytesDiff / (timeDiff / 1000);
      const remainingBytes = totalBytes - bytesUploaded;
      const timeRemaining = speed > 0 ? remainingBytes / speed : 0;

      setUploadStats({
        speed,
        timeRemaining,
        bytesUploaded,
        totalBytes
      });

      lastProgressRef.current = { bytes: bytesUploaded, time: now };
    }
  }, []);

  // Start upload
  const startUpload = useCallback(async (
    file: File, 
    metadata: Partial<VideoMetadata> = {}
  ) => {
    try {
      setError(null);
      setIsUploading(true);
      setIsPaused(false);
      startTimeRef.current = Date.now();
      lastProgressRef.current = { bytes: 0, time: Date.now() };

      const sessionId = generateSessionId();
      const session: UploadSession = {
        id: sessionId,
        file,
        progress: 0,
        status: 'uploading',
        metadata: {
          title: metadata.title || file.name,
          description: metadata.description || '',
          tags: metadata.tags || [],
          visibility: metadata.visibility || 'draft',
          thumbnail: metadata.thumbnail,
          adultContent: metadata.adultContent,
          geoBlocked: metadata.geoBlocked,
          forensicWatermark: metadata.forensicWatermark
        }
      };

      setUploadSession(session);
      await saveSession(session);

      // Create TUS upload
      const upload = new tus.Upload(file, {
        endpoint,
        chunkSize,
        retryDelays,
        metadata: {
          filename: file.name,
          filetype: file.type,
          title: session.metadata.title,
          sessionId: sessionId
        },
        onError: (error) => {
          console.error('Upload failed:', error);
          setError(error.message);
          setIsUploading(false);
          setUploadSession(prev => prev ? { ...prev, status: 'failed' } : null);
          onError?.(error);
        },
        onProgress: (bytesUploaded, bytesTotal) => {
          const progressPercent = Math.round((bytesUploaded / bytesTotal) * 100);
          setProgress(progressPercent);
          updateStats(bytesUploaded, bytesTotal);
          
          // Update session
          setUploadSession(prev => prev ? { ...prev, progress: progressPercent } : null);
          
          onProgress?.(progressPercent);
        },
        onSuccess: () => {
          console.log('Upload completed successfully');
          setIsUploading(false);
          setUploadSession(prev => prev ? { ...prev, status: 'completed', progress: 100 } : null);
          
          // Clean up session after successful upload
          removeSession(sessionId);
          
          onSuccess?.(upload.url || '');
        }
      });

      uploadRef.current = upload;
      
      // Start the upload
      upload.start();

      // Update session with TUS URL
      const updatedSession = { ...session, tusUrl: upload.url };
      setUploadSession(updatedSession);
      await saveSession(updatedSession);

    } catch (err) {
      const error = err as Error;
      console.error('Failed to start upload:', error);
      setError(error.message);
      setIsUploading(false);
      onError?.(error);
    }
  }, [endpoint, chunkSize, retryDelays, onProgress, onSuccess, onError, updateStats]);

  // Resume upload
  const resumeUpload = useCallback(async (sessionId?: string) => {
    try {
      const session = sessionId ? await loadSession(sessionId) : uploadSession;
      if (!session) {
        throw new Error('No upload session found');
      }

      setError(null);
      setIsUploading(true);
      setIsPaused(false);
      lastProgressRef.current = { bytes: (session.progress / 100) * session.file.size, time: Date.now() };

      const upload = new tus.Upload(session.file, {
        endpoint,
        chunkSize,
        retryDelays,
        resumeFromPreviousUpload: true,
        metadata: {
          filename: session.file.name,
          filetype: session.file.type,
          title: session.metadata.title,
          sessionId: session.id
        },
        onError: (error) => {
          console.error('Resume failed:', error);
          setError(error.message);
          setIsUploading(false);
          setUploadSession(prev => prev ? { ...prev, status: 'failed' } : null);
          onError?.(error);
        },
        onProgress: (bytesUploaded, bytesTotal) => {
          const progressPercent = Math.round((bytesUploaded / bytesTotal) * 100);
          setProgress(progressPercent);
          updateStats(bytesUploaded, bytesTotal);
          
          setUploadSession(prev => prev ? { ...prev, progress: progressPercent } : null);
          onProgress?.(progressPercent);
        },
        onSuccess: () => {
          console.log('Upload resumed and completed successfully');
          setIsUploading(false);
          setUploadSession(prev => prev ? { ...prev, status: 'completed', progress: 100 } : null);
          
          removeSession(session.id);
          onSuccess?.(upload.url || '');
        }
      });

      uploadRef.current = upload;
      upload.start();

    } catch (err) {
      const error = err as Error;
      console.error('Failed to resume upload:', error);
      setError(error.message);
      setIsUploading(false);
      onError?.(error);
    }
  }, [endpoint, chunkSize, retryDelays, uploadSession, onProgress, onSuccess, onError, updateStats]);

  // Pause upload
  const pauseUpload = useCallback(() => {
    if (uploadRef.current && isUploading) {
      uploadRef.current.abort();
      setIsUploading(false);
      setIsPaused(true);
      setUploadSession(prev => prev ? { ...prev, status: 'uploading' } : null);
    }
  }, [isUploading]);

  // Cancel upload
  const cancelUpload = useCallback(async () => {
    if (uploadRef.current) {
      uploadRef.current.abort();
    }
    
    if (uploadSession) {
      await removeSession(uploadSession.id);
    }
    
    setUploadSession(null);
    setIsUploading(false);
    setIsPaused(false);
    setProgress(0);
    setError(null);
    setUploadStats(null);
    uploadRef.current = null;
  }, [uploadSession]);

  // Retry failed upload
  const retryUpload = useCallback(() => {
    if (uploadSession) {
      resumeUpload();
    }
  }, [uploadSession, resumeUpload]);

  // Get all saved sessions
  const getSavedSessions = useCallback(async (): Promise<UploadSession[]> => {
    try {
      // This is a simplified version - in a real implementation,
      // you'd need to iterate through IndexedDB keys
      const sessions: UploadSession[] = [];
      // Implementation would depend on your IndexedDB structure
      return sessions;
    } catch (err) {
      console.warn('Failed to get saved sessions:', err);
      return [];
    }
  }, []);

  return {
    // State
    uploadSession,
    isUploading,
    isPaused,
    progress,
    error,
    uploadStats,
    
    // Actions
    startUpload,
    resumeUpload,
    pauseUpload,
    cancelUpload,
    retryUpload,
    getSavedSessions,
    
    // Utilities
    loadSession,
    removeSession
  };
}