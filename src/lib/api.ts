// API utilities for Live Streaming Platform
import { ENV } from './env';
import type { ApiResponse } from '../types/live';

/**
 * Base API client configuration
 */
const API_CONFIG = {
  baseURL: ENV.API_BASE,
  timeout: 10000,
  credentials: 'include' as RequestCredentials,
};

/**
 * Enhanced fetch wrapper with error handling and type safety
 */
export async function apiRequest<T = any>(
  endpoint: string,
  options: RequestInit = {}
): Promise<ApiResponse<T>> {
  const url = `${API_CONFIG.baseURL}${endpoint}`;
  
  const config: RequestInit = {
    ...options,
    credentials: API_CONFIG.credentials,
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
  };

  try {
    const response = await fetch(url, config);
    
    // Handle non-JSON responses (like file uploads)
    const contentType = response.headers.get('content-type');
    const isJson = contentType?.includes('application/json');
    
    const data = isJson ? await response.json() : await response.text();
    
    if (!response.ok) {
      return {
        ok: false,
        error: data.error || data.message || `HTTP ${response.status}`,
        data: null,
      };
    }

    return {
      ok: true,
      data: isJson ? data : { message: data },
    };
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : 'Network error',
      data: null,
    };
  }
}

/**
 * GET request helper
 */
export async function apiGet<T = any>(endpoint: string): Promise<ApiResponse<T>> {
  return apiRequest<T>(endpoint, { method: 'GET' });
}

/**
 * POST request helper
 */
export async function apiPost<T = any>(
  endpoint: string,
  data?: any
): Promise<ApiResponse<T>> {
  return apiRequest<T>(endpoint, {
    method: 'POST',
    body: data ? JSON.stringify(data) : undefined,
  });
}

/**
 * PUT request helper
 */
export async function apiPut<T = any>(
  endpoint: string,
  data?: any
): Promise<ApiResponse<T>> {
  return apiRequest<T>(endpoint, {
    method: 'PUT',
    body: data ? JSON.stringify(data) : undefined,
  });
}

/**
 * DELETE request helper
 */
export async function apiDelete<T = any>(endpoint: string): Promise<ApiResponse<T>> {
  return apiRequest<T>(endpoint, { method: 'DELETE' });
}

/**
 * File upload helper
 */
export async function apiUpload<T = any>(
  endpoint: string,
  formData: FormData
): Promise<ApiResponse<T>> {
  return apiRequest<T>(endpoint, {
    method: 'POST',
    body: formData,
    headers: {}, // Let browser set Content-Type for FormData
  });
}

/**
 * Live streaming API endpoints
 */
export const liveApi = {
  // Viewer endpoints
  getFeed: () => apiGet('/bff/live/feed'),
  getStream: (id: string) => apiGet(`/bff/live/${id}`),
  getChat: (id: string, since?: number) => 
    apiGet(`/bff/live/${id}/chat${since ? `?since=${since}` : ''}`),
  sendMessage: (id: string, text: string) => 
    apiPost(`/bff/live/${id}/chat`, { text }),
  getStats: (id: string) => apiGet(`/bff/live/${id}/stats`),
  
  // Creator endpoints
  getCreatorStreams: () => apiGet('/bff/studio/live'),
  createStream: (data: any) => apiPost('/bff/studio/live', data),
  getCreatorStream: (id: string) => apiGet(`/bff/studio/live/${id}`),
  startStream: (id: string) => apiPost(`/bff/studio/live/${id}/start`),
  endStream: (id: string) => apiPost(`/bff/studio/live/${id}/end`),
  rotateKeys: (id: string) => apiPost(`/bff/studio/live/${id}/keys/rotate`),
  setSlowMode: (id: string, seconds: number) => 
    apiPost(`/bff/studio/live/${id}/slow_mode`, { seconds }),
  pinMessage: (id: string, messageId: string) => 
    apiPost(`/bff/studio/live/${id}/pin`, { messageId }),
  unpinMessage: (id: string, messageId: string) => 
    apiPost(`/bff/studio/live/${id}/unpin`, { messageId }),
  moderate: (id: string, action: any) => 
    apiPost(`/bff/studio/live/${id}/moderate`, action),
  uploadThumbnail: (id: string, formData: FormData) => 
    apiUpload(`/bff/studio/live/${id}/thumbnail`, formData),
  setThumbnailFrame: (id: string, frameAtSec: number) => 
    apiPost(`/bff/studio/live/${id}/thumbnail`, { frameAtSec }),
  updateSettings: (id: string, settings: any) => 
    apiPut(`/bff/studio/live/${id}/settings`, settings),
};

/**
 * Metrics and analytics endpoints
 */
export const metricsApi = {
  reportJoinTime: (metrics: any) => 
    apiPost('/bff/metrics/join', metrics).catch(() => {}), // Silent failure
  reportError: (error: any) => 
    apiPost('/bff/metrics/error', error).catch(() => {}), // Silent failure
};

/**
 * Age verification endpoint
 */
export const complianceApi = {
  acknowledgeAge: () => apiPost('/bff/compliance/age/ack'),
};

/**
 * Generic API client for backward compatibility
 * Provides a consistent interface for making HTTP requests
 */
export const apiClient = {
  get: async <T = any>(endpoint: string): Promise<T> => {
    const response = await apiGet<T>(endpoint);
    if (!response.ok) {
      throw new Error(response.error || 'Request failed');
    }
    return response.data as T;
  },

  post: async <T = any>(endpoint: string, data?: any): Promise<T> => {
    const response = await apiPost<T>(endpoint, data);
    if (!response.ok) {
      throw new Error(response.error || 'Request failed');
    }
    return response.data as T;
  },

  put: async <T = any>(endpoint: string, data?: any): Promise<T> => {
    const response = await apiPut<T>(endpoint, data);
    if (!response.ok) {
      throw new Error(response.error || 'Request failed');
    }
    return response.data as T;
  },

  patch: async <T = any>(endpoint: string, data?: any): Promise<T> => {
    const response = await apiPut<T>(endpoint, data); // Using PUT for PATCH
    if (!response.ok) {
      throw new Error(response.error || 'Request failed');
    }
    return response.data as T;
  },

  delete: async <T = any>(endpoint: string): Promise<T> => {
    const response = await apiDelete<T>(endpoint);
    if (!response.ok) {
      throw new Error(response.error || 'Request failed');
    }
    return response.data as T;
  },

  upload: async <T = any>(endpoint: string, formData: FormData): Promise<T> => {
    const response = await apiUpload<T>(endpoint, formData);
    if (!response.ok) {
      throw new Error(response.error || 'Request failed');
    }
    return response.data as T;
  },
};

/**
 * Error handler for API responses
 * Provides consistent error handling across the application
 */
export function handleAPIError(error: any): string {
  if (error?.response?.data?.message) {
    return error.response.data.message;
  }
  
  if (error?.message) {
    return error.message;
  }
  
  if (typeof error === 'string') {
    return error;
  }
  
  return 'An unexpected error occurred';
}