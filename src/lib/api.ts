// API Configuration
const API_BASE_URL = import.meta.env.VITE_API_BASE || 'http://localhost:3001/api';

// API Error Types
export class APIError extends Error {
  constructor(
    message: string,
    public status: number,
    public code?: string,
    public details?: any
  ) {
    super(message);
    this.name = 'APIError';
  }
}

// Request Configuration
interface RequestConfig extends RequestInit {
  timeout?: number;
}

// API Client Class
class APIClient {
  private baseURL: string;
  private defaultTimeout: number = 10000; // 10 seconds

  constructor(baseURL: string) {
    this.baseURL = baseURL;
  }

  private async request<T>(
    endpoint: string,
    config: RequestConfig = {}
  ): Promise<T> {
    const { timeout = this.defaultTimeout, ...fetchConfig } = config;
    
    const url = `${this.baseURL}${endpoint}`;
    
    // Create abort controller for timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    try {
      const response = await fetch(url, {
        ...fetchConfig,
        signal: controller.signal,
        headers: fetchConfig.headers || {},
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new APIError(
          errorData.message || `HTTP ${response.status}`,
          response.status,
          errorData.code,
          errorData.details
        );
      }

      // Handle empty responses
      const contentType = response.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        return await response.json();
      }
      
      return response.text() as unknown as T;
    } catch (error) {
      clearTimeout(timeoutId);
      
      if (error instanceof APIError) {
        throw error;
      }
      
      if (error instanceof DOMException && error.name === 'AbortError') {
        throw new APIError('Request timeout', 408);
      }
      
      throw new APIError(
        error instanceof Error ? error.message : 'Network error',
        0
      );
    }
  }

  // HTTP Methods
  async get<T>(endpoint: string, config?: RequestConfig): Promise<T> {
    return this.request<T>(endpoint, { ...config, method: 'GET' });
  }

  async post<T>(
    endpoint: string,
    data?: any,
    config?: RequestConfig
  ): Promise<T> {
    const isFormData = data instanceof FormData;
    
    return this.request<T>(endpoint, {
      ...config,
      method: 'POST',
      body: isFormData ? data : (data ? JSON.stringify(data) : undefined),
      headers: isFormData 
        ? { ...config?.headers } // Don't set Content-Type for FormData, let browser set it
        : { 'Content-Type': 'application/json', ...config?.headers },
    });
  }

  async put<T>(
    endpoint: string,
    data?: any,
    config?: RequestConfig
  ): Promise<T> {
    return this.request<T>(endpoint, {
      ...config,
      method: 'PUT',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  async patch<T>(
    endpoint: string,
    data?: any,
    config?: RequestConfig
  ): Promise<T> {
    return this.request<T>(endpoint, {
      ...config,
      method: 'PATCH',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  async delete<T>(endpoint: string, config?: RequestConfig): Promise<T> {
    return this.request<T>(endpoint, { ...config, method: 'DELETE' });
  }

  // Authentication
  setAuthToken(_token: string) {
    // This will be implemented when we add authentication
    // For now, we'll store it in a way that can be used in requests
  }

  clearAuthToken() {
    // Clear authentication token
  }
}

// Create and export API client instance
export const apiClient = new APIClient(API_BASE_URL);

// Export as default and named export for compatibility
export const api = apiClient;
export default apiClient;

// Utility functions for common API patterns
export const createQueryKey = (resource: string, params?: Record<string, any>) => {
  if (!params) return [resource];
  return [resource, params];
};

export const handleAPIError = (error: unknown): string => {
  if (error instanceof APIError) {
    return error.message;
  }
  
  if (error instanceof Error) {
    return error.message;
  }
  
  return 'An unexpected error occurred';
};