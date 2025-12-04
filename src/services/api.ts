

/**
 * Centralized API Service Layer
 * Handles all HTTP requests with Axios configuration, interceptors, and error handling
 */

import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse, AxiosError } from 'axios';

// API Configuration with dynamic port detection
const getApiBaseUrl = () => {
  // If explicitly set in environment, use that
  const envUrl = import.meta.env.VITE_API_BASE_URL || import.meta.env.VITE_API_URL;
  if (envUrl) {
    const url = envUrl;
    // Ensure URL ends with /api if not already included
    return url.endsWith('/api') ? url : url.endsWith('/') ? `${url}api` : `${url}/api`;
  }

  // Detect hostname from current window location
  // This allows the app to work on both laptop (localhost) and phone (192.168.1.4)
  const hostname = typeof window !== 'undefined' ? window.location.hostname : 'localhost';

  // Validate hostname
  if (!hostname || hostname === '') {
    console.warn('[ApiClient] Invalid hostname, falling back to localhost');
    return 'http://localhost:3001/api';
  }

  // If hostname is not localhost or 127.0.0.1, use the same hostname for backend
  // This means the user is accessing from a different device (like a phone on the network)
  if (hostname !== 'localhost' && hostname !== '127.0.0.1') {
    // Use the same hostname for backend API (e.g., http://192.168.1.4:3001/api)
    const apiUrl = `http://${hostname}:3001/api`;
    console.log('[ApiClient] Detected network hostname, using:', apiUrl);
    return apiUrl;
  }

  // For localhost, use localhost for backend
  // In development, try to detect the backend port
  if (import.meta.env.DEV) {
    // Try common backend ports in order of preference
    const commonPorts = [3001, 3002, 3003, 3004, 3005];

    // Default to 3001 for localhost
    const apiUrl = `http://localhost:${commonPorts[0]}/api`;
    console.log('[ApiClient] Using localhost, API URL:', apiUrl);
    return apiUrl;
  }

  // Production fallback
  const apiUrl = 'http://localhost:3001/api';

  // CRITICAL: Log warning if VITE_API_BASE_URL is missing in production
  if (import.meta.env.PROD && !import.meta.env.VITE_API_BASE_URL) {
    console.error('[ApiClient] CRITICAL: VITE_API_BASE_URL is not set! App is trying to connect to localhost in production.');
    console.error('[ApiClient] Please set VITE_API_BASE_URL in your environment variables (e.g. Netlify Site Settings).');
  }

  console.log('[ApiClient] Production mode, using:', apiUrl);
  return apiUrl;
};
const API_TIMEOUT = 60000; // 60 seconds (increased for cold starts)
const MAX_RETRY_ATTEMPTS = 3;
const RETRY_DELAY = 1000; // 1 second

// API Response Types
export interface ApiResponse<T = any> {
  success: boolean;
  message: string;
  data?: T;
  error?: any;
}

export interface ApiError {
  code: string;
  message: string;
  details?: any;
  timestamp: string;
  retryAfter?: number; // Retry after time in seconds (for rate limiting)
  status?: number; // HTTP status code
}

// Token Management
class TokenManager {
  private static readonly ACCESS_TOKEN_KEY = 'accessToken';
  private static readonly REFRESH_TOKEN_KEY = 'refreshToken';
  private static readonly TOKEN_EXPIRY_KEY = 'expiresAt';
  private static readonly USER_DATA_KEY = 'userData';

  static getAccessToken(): string | null {
    return localStorage.getItem(this.ACCESS_TOKEN_KEY);
  }

  static getRefreshToken(): string | null {
    return localStorage.getItem(this.REFRESH_TOKEN_KEY);
  }

  static getTokenExpiry(): number | null {
    const expiry = localStorage.getItem(this.TOKEN_EXPIRY_KEY);
    return expiry ? parseInt(expiry) : null;
  }

  static getUserData(): any | null {
    try {
      const userData = localStorage.getItem(this.USER_DATA_KEY);

      // Check for null, undefined, or invalid string values
      if (!userData || userData === 'undefined' || userData === 'null') {
        console.log('[TokenManager] No valid user data found in localStorage');
        return null;
      }

      const parsed = JSON.parse(userData);
      console.log('[TokenManager] User data loaded from localStorage:', parsed);
      return parsed;
    } catch (error) {
      console.error('[TokenManager] Error parsing user data from localStorage:', error);
      // Clear corrupted data
      localStorage.removeItem(this.USER_DATA_KEY);
      return null;
    }
  }

  static setTokens(accessToken: string, refreshToken: string, expiresIn: number): void {
    const expiryTime = Date.now() + (expiresIn * 1000);

    localStorage.setItem(this.ACCESS_TOKEN_KEY, accessToken);
    localStorage.setItem(this.REFRESH_TOKEN_KEY, refreshToken);
    localStorage.setItem(this.TOKEN_EXPIRY_KEY, expiryTime.toString());
  }

  static setUserData(user: any): void {
    try {
      if (!user) {
        console.error('[TokenManager] Cannot store null/undefined user data');
        return;
      }
      const userData = JSON.stringify(user);
      localStorage.setItem(this.USER_DATA_KEY, userData);
      console.log('[TokenManager] User data stored to localStorage:', user);
    } catch (error) {
      console.error('[TokenManager] Error storing user data to localStorage:', error);
    }
  }

  static clearTokens(): void {
    localStorage.removeItem(this.ACCESS_TOKEN_KEY);
    localStorage.removeItem(this.REFRESH_TOKEN_KEY);
    localStorage.removeItem(this.TOKEN_EXPIRY_KEY);
    localStorage.removeItem(this.USER_DATA_KEY);
  }

  static isTokenExpired(): boolean {
    const expiry = this.getTokenExpiry();
    if (!expiry) return true;

    // Check if token expires in the next 5 minutes
    return Date.now() >= (expiry - 5 * 60 * 1000);
  }

  static isTokenValid(): boolean {
    const token = this.getAccessToken();
    const expiry = this.getTokenExpiry();

    if (!token || !expiry) return false;

    // Token is valid if expiry time is in the future (with 5 minute buffer)
    // This prevents using tokens that are about to expire
    const bufferTime = 5 * 60 * 1000; // 5 minutes
    return Date.now() < (expiry - bufferTime);
  }

  static hasValidRefreshToken(): boolean {
    const refreshToken = this.getRefreshToken();
    return !!refreshToken;
  }
}

// API Client Class
class ApiClient {
  private axiosInstance: AxiosInstance;
  private apiBaseUrl: string;
  private isRefreshing = false;
  private failedQueue: Array<{
    resolve: (value?: any) => void;
    reject: (error?: any) => void;
  }> = [];

  constructor() {
    // Calculate baseURL dynamically to ensure it works correctly
    // This is called in constructor so it uses the current window.location.hostname
    this.apiBaseUrl = getApiBaseUrl();

    console.log('[ApiClient] Initializing with baseURL:', this.apiBaseUrl);
    console.log('[ApiClient] Current hostname:', typeof window !== 'undefined' ? window.location.hostname : 'N/A');

    // Validate the computed URL
    if (!this.apiBaseUrl || (!this.apiBaseUrl.startsWith('http') && !this.apiBaseUrl.startsWith('/'))) {
      console.error('[ApiClient] Invalid API base URL:', this.apiBaseUrl);
      throw new Error(`Invalid API base URL: ${this.apiBaseUrl}`);
    }

    this.axiosInstance = axios.create({
      baseURL: this.apiBaseUrl,
      timeout: API_TIMEOUT,
      headers: {
        'Content-Type': 'application/json',
      },
      withCredentials: true, // For cookies
    });

    this.setupInterceptors();
  }

  private setupInterceptors(): void {
    // Request Interceptor
    this.axiosInstance.interceptors.request.use(
      (config: any) => {
        const token = TokenManager.getAccessToken();
        if (token) {
          // Always add token if it exists, let backend validate it
          // Backend will return 401 if token is invalid/expired, then we'll refresh
          config.headers = config.headers || {};
          config.headers.Authorization = `Bearer ${token}`;
        }

        // Normalize URL to avoid double /api when baseURL already ends with /api
        try {
          const base = (config.baseURL || this.apiBaseUrl).replace(/\/+$/, '');
          if (typeof config.url === 'string') {
            const originalUrl = config.url;
            // If base ends with /api and url starts with /api/, strip the leading /api from url
            if (base.endsWith('/api') && originalUrl.startsWith('/api/')) {
              config.url = originalUrl.replace(/^\/api\//, '/');
            }
          }
        } catch { }

        // Add request timestamp for debugging
        config.metadata = { startTime: Date.now() };

        // Debug logging for development
        if (import.meta.env.DEV) {
          console.log('[ApiClient] Request:', {
            method: config.method,
            url: config.url,
            baseURL: config.baseURL,
            fullURL: `${config.baseURL}${config.url}`
          });
          console.debug(`API Request: ${config.method?.toUpperCase()} ${config.url}`, {
            baseURL: config.baseURL,
            data: config.data
          });
        }

        return config;
      },
      (error: any) => {
        return Promise.reject(this.handleError(error));
      }
    );

    // Response Interceptor
    this.axiosInstance.interceptors.response.use(
      (response: any) => {
        // Log response time for debugging
        if (response.config.metadata?.startTime) {
          const responseTime = Date.now() - response.config.metadata.startTime;
          console.debug(`API Response Time: ${responseTime}ms for ${response.config.url}`);
        }

        // Debug logging for development
        if (import.meta.env.DEV) {
          console.debug(`API Response: ${response.status} ${response.config.url}`, response.data);
        }

        return response;
      },
      async (error: AxiosError) => {
        const originalRequest = error.config as AxiosRequestConfig & { _retry?: boolean };

        // Silently handle expected 404s - don't even log them
        const isExpected404 = (originalRequest as any)?.suppress404 === true;
        if (error.response?.status === 404 && isExpected404) {
          // Return a mock response structure that won't trigger further logging
          return Promise.reject({
            ...error,
            code: 'HTTP_404',
            response: {
              ...error.response,
              status: 404,
              data: { success: false, message: 'Not found', data: null }
            },
            isHandled: true // Flag to indicate this was handled silently
          } as any);
        }

        // Skip token refresh for auth endpoints (login, register, refresh, logout)
        const isAuthEndpoint = originalRequest.url?.includes('/auth/login') ||
          originalRequest.url?.includes('/auth/register') ||
          originalRequest.url?.includes('/auth/refresh') ||
          originalRequest.url?.includes('/auth/logout');

        // Handle 401 Unauthorized - Token refresh (only for non-auth endpoints)
        if (error.response?.status === 401 && !originalRequest._retry && !isAuthEndpoint) {
          // Skip token refresh if using mock tokens (development mode)
          const refreshToken = TokenManager.getRefreshToken();
          if (refreshToken === 'mock-refresh-token' || refreshToken?.startsWith('mock-')) {
            // In development mode with mock tokens, just redirect to login
            this.handleAuthFailure();
            return Promise.reject(this.handleError(error));
          }

          // No refresh token available - don't try to refresh
          if (!refreshToken) {
            this.handleAuthFailure();
            return Promise.reject(this.handleError(error));
          }

          if (this.isRefreshing) {
            // If already refreshing, queue the request
            return new Promise((resolve, reject) => {
              this.failedQueue.push({ resolve, reject });
            }).then(() => {
              return this.axiosInstance(originalRequest);
            }).catch((err) => {
              return Promise.reject(err);
            });
          }

          originalRequest._retry = true;
          this.isRefreshing = true;

          try {
            await this.refreshToken();
            this.processQueue(null);

            // Retry original request with new token
            const newToken = TokenManager.getAccessToken();

            if (import.meta.env.DEV) {
              console.log('[ApiClient] Retrying request after token refresh:', {
                url: originalRequest.url,
                hasNewToken: !!newToken,
                tokenLength: newToken?.length
              });
            }

            if (!newToken) {
              throw new Error('Failed to get new access token after refresh');
            }

            // Ensure headers object exists
            originalRequest.headers = originalRequest.headers || {};

            // Set the new token
            originalRequest.headers.Authorization = `Bearer ${newToken}`;

            // Keep _retry flag set to prevent infinite refresh loops
            // If the retry also fails with 401, it means the refresh token is invalid
            // and we should handle it as auth failure, not try to refresh again

            // Retry the original request with new token
            return this.axiosInstance(originalRequest);
          } catch (refreshError) {
            this.processQueue(refreshError);
            this.handleAuthFailure();
            return Promise.reject(this.handleError(refreshError));
          } finally {
            this.isRefreshing = false;
          }
        }

        return Promise.reject(this.handleError(error));
      }
    );
  }

  private async refreshToken(): Promise<void> {
    const refreshToken = TokenManager.getRefreshToken();
    if (!refreshToken) {
      throw new Error('No refresh token available');
    }

    // If using mock tokens (development mode), don't try to refresh
    // The backend doesn't support refresh tokens yet
    if (refreshToken === 'mock-refresh-token' || (refreshToken && refreshToken.startsWith('mock-'))) {
      console.warn('Mock refresh token detected - refresh token endpoint not available');
      throw new Error('Refresh token not supported in development mode');
    }

    try {
      console.log('[ApiClient] Attempting to refresh token...');

      const response = await axios.post(`${this.apiBaseUrl}/auth/refresh`, {
        refreshToken
      }, {
        withCredentials: true,
        timeout: API_TIMEOUT
      });

      console.log('[ApiClient] Refresh token response received:', {
        status: response.status,
        hasData: !!response.data,
        dataKeys: response.data ? Object.keys(response.data) : []
      });

      const responseData = response.data;

      // Handle multiple response structures:
      // 1. { success: true, data: { accessToken, refreshToken, expiresIn } }
      // 2. { success: true, data: { user, accessToken, refreshToken, expiresIn } }
      // 3. { accessToken, refreshToken, expiresIn }
      let data: any = responseData;

      // If response has a 'data' property, use it
      if (responseData.data) {
        data = responseData.data;
      }

      console.log('[ApiClient] Parsed token data:', {
        hasAccessToken: !!data.accessToken,
        hasRefreshToken: !!data.refreshToken,
        hasExpiresIn: !!data.expiresIn,
        hasUser: !!data.user,
        dataKeys: Object.keys(data)
      });

      if (!data || !data.accessToken) {
        console.error('[ApiClient] Invalid refresh response - missing accessToken:', data);
        throw new Error('Invalid refresh token response - missing accessToken');
      }

      // refreshToken is optional in response (can keep using the same one)
      const newRefreshToken = data.refreshToken || refreshToken;

      // Ensure expiresIn is a number
      const expiresIn = typeof data.expiresIn === 'number'
        ? data.expiresIn
        : parseInt(data.expiresIn) || 900; // Default 15 minutes

      TokenManager.setTokens(data.accessToken, newRefreshToken, expiresIn);

      // Update user data if provided
      if (data.user) {
        TokenManager.setUserData(data.user);
      }

      // Verify token was saved correctly
      const savedToken = TokenManager.getAccessToken();
      console.log('[ApiClient] Token refresh successful:', {
        tokenSaved: !!savedToken,
        tokenMatches: savedToken === data.accessToken,
        tokenLength: savedToken?.length
      });

      // Double-check token was saved
      if (!savedToken || savedToken !== data.accessToken) {
        throw new Error('Token was not saved correctly after refresh');
      }
    } catch (error: any) {
      console.error('[ApiClient] Token refresh failed:', {
        message: error?.message,
        response: error?.response?.data,
        status: error?.response?.status
      });
      TokenManager.clearTokens();
      throw error;
    }
  }

  private processQueue(error: any): void {
    this.failedQueue.forEach(({ resolve, reject }) => {
      if (error) {
        reject(error);
      } else {
        resolve();
      }
    });

    this.failedQueue = [];
  }

  private handleAuthFailure(): void {
    TokenManager.clearTokens();
    // clearTokens already removes USER_DATA_KEY, so no need for separate clearUserData

    // Dispatch custom event for auth failure
    window.dispatchEvent(new CustomEvent('auth:logout', {
      detail: { reason: 'Token refresh failed' }
    }));

    // Redirect to login page
    if (typeof window !== 'undefined') {
      window.location.href = '/login';
    }
  }

  private handleError(error: AxiosError): ApiError {
    const apiError: ApiError = {
      code: 'UNKNOWN_ERROR',
      message: 'An unexpected error occurred',
      timestamp: new Date().toISOString()
    };

    // Debug logging for development - skip 404 errors as they're expected for missing endpoints
    if (import.meta.env.DEV && error.response?.status !== 404) {
      console.error('API Error:', {
        message: error.message,
        code: error.code,
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data,
        config: {
          url: error.config?.url,
          method: error.config?.method,
          baseURL: error.config?.baseURL
        }
      });
    }

    if (error.response) {
      // Server responded with error status
      const response = error.response.data as any;
      apiError.code = response?.code || `HTTP_${error.response.status}`;
      apiError.message = response?.message || error.message;
      apiError.details = response?.error || response?.details || response?.errors; // Support both details and errors
      apiError.status = error.response.status;

      // Extract retryAfter for rate limiting (429 errors)
      if (error.response.status === 429) {
        apiError.retryAfter = response?.retryAfter;
        // Use retryAfterMinutes if available (from auth.middleware), otherwise calculate from retryAfter
        if (response?.retryAfterMinutes !== undefined) {
          // Message already contains minutes, use it directly if present
          if (response?.message && response.message.includes('try again')) {
            apiError.message = response.message;
          } else {
            apiError.message = `Too many login attempts. Please try again in ${response.retryAfterMinutes} minute${response.retryAfterMinutes !== 1 ? 's' : ''}.`;
          }
        } else if (apiError.retryAfter) {
          // Calculate minutes from retryAfter (seconds)
          const minutes = Math.ceil(apiError.retryAfter / 60);
          apiError.message = `Too many login attempts. Please try again in ${minutes} minute${minutes !== 1 ? 's' : ''}.`;
        }
      }
    } else if (error.request) {
      // Request was made but no response received
      apiError.code = 'NETWORK_ERROR';
      apiError.message = 'Network error - please check your connection';
      apiError.details = {
        url: error.config?.url,
        method: error.config?.method,
        baseURL: error.config?.baseURL
      };

      // Detailed logging for network errors
      console.error('[ApiClient] Network error details:', {
        message: error.message,
        code: error.code,
        url: error.config?.url,
        baseURL: error.config?.baseURL,
        fullURL: `${error.config?.baseURL}${error.config?.url}`,
        timeout: API_TIMEOUT,
        hostname: typeof window !== 'undefined' ? window.location.hostname : 'N/A',
        currentURL: typeof window !== 'undefined' ? window.location.href : 'N/A',
        suggestion: 'Check if VITE_API_BASE_URL is set correctly in environment variables.'
      });

      // Add a more visible error for the user in the console
      if (typeof window !== 'undefined') {
        console.error(`%c[Network Error] Failed to connect to ${error.config?.baseURL}`, 'background: #ff0000; color: #ffffff; padding: 4px; font-weight: bold; border-radius: 4px;');
        console.error('Possible causes:');
        console.error('1. Backend is not running or not accessible');
        console.error('2. CORS configuration on backend does not allow this origin');
        console.error('3. VITE_API_BASE_URL is missing or incorrect (currently: ' + error.config?.baseURL + ')');
      }
    } else {
      // Something else happened
      apiError.code = 'REQUEST_ERROR';
      apiError.message = error.message;
    }

    return apiError;
  }

  // HTTP Methods
  async get<T = any>(url: string, config?: AxiosRequestConfig & { suppress404?: boolean }): Promise<ApiResponse<T>> {
    // For endpoints that are expected to potentially return 404, use validateStatus to prevent error throwing
    const isExpected404 = (config as any)?.suppress404 === true;

    // Prepare config with validateStatus to accept 404 as valid response
    const modifiedConfig: AxiosRequestConfig = isExpected404
      ? {
        ...config,
        validateStatus: (status: number) => status < 500, // Accept 4xx as valid responses (don't throw)
        suppress404: true // Preserve flag for interceptor
      } as any
      : config || {};

    // Remove suppress404 from params if it exists (it should be in config, not params)
    if (modifiedConfig.params && 'suppress404' in modifiedConfig.params) {
      const params = { ...modifiedConfig.params } as any;
      delete params.suppress404;
      modifiedConfig.params = params;
    }

    try {
      if (import.meta.env?.DEV && !isExpected404) {
        console.log(`📡 [ApiClient] GET ${url}`);
      }
      const response = await this.axiosInstance.get<ApiResponse<T>>(url, modifiedConfig);

      // If it's a 404 and we're expecting it, return a safe response without logging
      if (response.status === 404 && isExpected404) {
        return { success: false, message: 'Not found', data: null } as ApiResponse<T>;
      }

      if (import.meta.env?.DEV && !isExpected404) {
        console.log(`📥 [ApiClient] GET ${url} - Response:`, {
          status: response.status,
          statusText: response.statusText,
          hasData: !!response.data,
          dataType: typeof response.data
        });
      }

      return response.data;
    } catch (error: any) {
      // Suppress 404 errors in console - they're expected for missing endpoints
      const is404 = error?.code === 'HTTP_404' || error?.response?.status === 404;
      if (is404 && isExpected404) {
        // Return safe fallback for expected 404s without logging
        return { success: false, message: 'Endpoint not available', data: null } as ApiResponse<T>;
      }

      if (!is404 && import.meta.env?.DEV) {
        console.error(`❌ [ApiClient] GET ${url} - Error:`, error);
      }
      throw error;
    }
  }

  async post<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<ApiResponse<T>> {
    try {
      if (import.meta.env?.DEV) {
        console.log(`📡 [ApiClient] POST ${url}`, data);
      }
      const response = await this.axiosInstance.post<ApiResponse<T>>(url, data, config);
      return response.data;
    } catch (error: any) {
      if (import.meta.env?.DEV) {
        console.error(`❌ [ApiClient] POST ${url} - Error:`, error);
      }

      // For 4xx errors, return structured error response instead of throwing
      if (error?.response?.status >= 400 && error?.response?.status < 500) {
        const errorData = error.response.data || {};

        // Check if error is already an ApiError object (from handleError interceptor)
        // ApiError has details field that contains the actual error message
        if ((error as any).details) {
          const errorMessage = (error as any).details || (error as any).message || 'Request failed';
          return {
            success: false,
            message: errorMessage,
            error: errorMessage,
            code: (error as any).code || `HTTP_${error.response.status}`,
            data: null
          } as ApiResponse<T>;
        }

        // Extract error message from response data - backend may send 'error' or 'message' field
        const errorMessage = errorData.error || errorData.message || error.message || 'Request failed';
        return {
          success: false,
          message: errorMessage,
          error: errorMessage,
          code: errorData.code || `HTTP_${error.response.status}`,
          data: null
        } as ApiResponse<T>;
      }

      // If it's an AxiosError with response data, extract the message
      if (error?.response?.data) {
        // Check if error has details (from ApiError)
        const errorMessage = (error as any).details || error.response.data.error || error.response.data.message || error.message || 'Request failed';
        const apiError = new Error(errorMessage);
        (apiError as any).response = error.response;
        (apiError as any).code = error.response.data.code || (error as any).code || `HTTP_${error.response?.status}`;
        throw apiError;
      }

      // For network errors or other issues
      throw error;
    }
  }

  async put<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<ApiResponse<T>> {
    try {
      const response = await this.axiosInstance.put<ApiResponse<T>>(url, data, config);
      return response.data;
    } catch (error) {
      throw error;
    }
  }

  async patch<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<ApiResponse<T>> {
    try {
      const response = await this.axiosInstance.patch<ApiResponse<T>>(url, data, config);
      return response.data;
    } catch (error) {
      throw error;
    }
  }

  async delete<T = any>(url: string, config?: AxiosRequestConfig): Promise<ApiResponse<T>> {
    try {
      const response = await this.axiosInstance.delete<ApiResponse<T>>(url, config);
      return response.data;
    } catch (error) {
      throw error;
    }
  }

  // File Upload
  async uploadFile<T = any>(url: string, file: File, onProgress?: (progress: number) => void): Promise<ApiResponse<T>> {
    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await this.axiosInstance.post<ApiResponse<T>>(url, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        onUploadProgress: (progressEvent: any) => {
          if (onProgress && progressEvent.total) {
            const progress = Math.round((progressEvent.loaded * 100) / progressEvent.total);
            onProgress(progress);
          }
        },
      });
      return response.data;
    } catch (error) {
      throw error;
    }
  }

  // Retry Logic
  async withRetry<T>(operation: () => Promise<T>, maxAttempts = MAX_RETRY_ATTEMPTS): Promise<T> {
    let lastError: any;

    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        return await operation();
      } catch (error: any) {
        lastError = error;

        // Don't retry on authentication errors
        if (error.code === 'HTTP_401' || error.code === 'HTTP_403') {
          throw error;
        }

        // Don't retry on client errors (4xx except 401, 403)
        if (error.code?.startsWith('HTTP_4')) {
          throw error;
        }

        if (attempt < maxAttempts) {
          const delay = RETRY_DELAY * Math.pow(2, attempt - 1); // Exponential backoff
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }
    }

    throw lastError;
  }

  // Health Check
  async healthCheck(): Promise<boolean> {
    try {
      const response = await this.get('/health');
      return response.success;
    } catch (error) {
      return false;
    }
  }

  // Get current instance (for advanced usage)
  getInstance(): AxiosInstance {
    return this.axiosInstance;
  }
}

// Create and export singleton instance
export const apiClient = new ApiClient();

// Export TokenManager for external use
export { TokenManager };

// Export types
export type { ApiResponse, ApiError };

// Default export
export default apiClient;
