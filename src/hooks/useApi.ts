/**
 * Generic API Hook
 * Provides a standardized way to make API calls with loading states and error handling
 */

import { useState, useCallback, useRef, useEffect } from 'react';
import { apiClient, ApiResponse, ApiError } from '../services/api';

// Hook state interface
export interface UseApiState<T> {
  data: T | null;
  loading: boolean;
  error: ApiError | null;
  success: boolean;
}

// Hook options interface
export interface UseApiOptions {
  immediate?: boolean;
  retry?: boolean;
  retryAttempts?: number;
  onSuccess?: (data: any) => void;
  onError?: (error: ApiError) => void;
  onFinally?: () => void;
}

// Generic API hook
export function useApi<T = any>(
  apiCall: () => Promise<ApiResponse<T>>,
  options: UseApiOptions = {}
) {
  const {
    immediate = false,
    retry = false,
    retryAttempts = 3,
    onSuccess,
    onError,
    onFinally
  } = options;

  const [state, setState] = useState<UseApiState<T>>({
    data: null,
    loading: false,
    error: null,
    success: false,
  });

  const isMountedRef = useRef(true);

  // Track mount/unmount state
  useEffect(() => {
    isMountedRef.current = true;  // Set to true on mount
    return () => {
      isMountedRef.current = false;  // Set to false on unmount
    };
  }, []);

  // Execute API call
  const execute = useCallback(async (...args: any[]): Promise<T | null> => {
    console.log('🚀 [useApi] execute() called, isMountedRef:', isMountedRef.current);
    
    // Don't check isMountedRef at start - React Strict Mode sets it to false during double render
    // We'll check it AFTER async operations to prevent state updates on unmounted components

    console.log('📤 [useApi] Setting loading state to true...');
    setState(prev => ({
      ...prev,
      loading: true,
      error: null,
      success: false,
    }));

    console.log('📞 [useApi] About to call apiCall()...');
    try {
      let response: ApiResponse<T>;
      
      if (retry) {
        response = await apiClient.withRetry(
          () => apiCall(),
          retryAttempts
        );
      } else {
        response = await apiCall();
      }

      console.log('🔍 [useApi] Raw API Response:', {
        success: response?.success,
        hasData: !!response?.data,
        dataType: typeof response?.data,
        dataIsArray: Array.isArray(response?.data),
        dataLength: Array.isArray(response?.data) ? response.data.length : 'N/A',
        message: response?.message,
        fullResponse: response
      });

      if (response.success) {
        console.log('✅ [useApi] Response success = true, processing data...');
        console.log('   Data to be set in state:', response.data);
        console.log('   Calling onSuccess with:', response.data);
        
        // Only update state if component is still mounted
        if (isMountedRef.current) {
          setState({
            data: response.data || null,
            loading: false,
            error: null,
            success: true,
          });
        } else {
          console.warn('   ⚠️ Component unmounted, skipping setState');
        }

        // Always call onSuccess and return data, even if unmounted
        // This allows Promise.allSettled to capture the results
        onSuccess?.(response.data);
        
        console.log('   Returning from execute():', response.data || null);
        return response.data || null;
      } else {
        console.error('❌ [useApi] Response success = false');
        console.error('   Response message:', response.message);
        console.error('   Full response:', response);
        const error: ApiError = {
          code: 'API_ERROR',
          message: response.message || 'API call failed',
          timestamp: new Date().toISOString(),
        };

        // Only update state if component is still mounted
        if (isMountedRef.current) {
          setState(prev => ({
            ...prev,
            loading: false,
            error,
            success: false,
          }));
        }

        onError?.(error);
        return null;
      }
    } catch (error: any) {
      console.error('💥 [useApi] Exception caught in execute():', {
        errorType: typeof error,
        errorMessage: error?.message,
        errorCode: error?.code,
        errorDetails: error?.details,
        fullError: error
      });

      const apiError: ApiError = {
        code: error.code || 'UNKNOWN_ERROR',
        message: error.message || 'An unexpected error occurred',
        details: error.details,
        timestamp: new Date().toISOString(),
      };

      // Only update state if component is still mounted
      if (isMountedRef.current) {
        setState(prev => ({
          ...prev,
          loading: false,
          error: apiError,
          success: false,
        }));
      }

      console.error('   Calling onError with:', apiError);
      onError?.(apiError);
      return null;
    } finally {
      if (isMountedRef.current) {
        onFinally?.();
      }
    }
  }, [apiCall, retry, retryAttempts, onSuccess, onError, onFinally]);

  // Reset state
  const reset = useCallback(() => {
    setState({
      data: null,
      loading: false,
      error: null,
      success: false,
    });
  }, []);

  // Execute immediately on mount if requested
  useEffect(() => {
    if (immediate) {
      execute();
    }
  }, [immediate, execute]);

  return {
    ...state,
    execute,
    reset,
  };
}

// Specific API hooks for common operations

// GET request hook
export function useGet<T = any>(
  url: string,
  options: UseApiOptions = {}
) {
  const apiCall = useCallback(() => apiClient.get<T>(url), [url]);
  return useApi<T>(apiCall, options);
}

// POST request hook
export function usePost<T = any>(
  url: string,
  options: UseApiOptions = {}
) {
  const apiCall = useCallback((data?: any) => apiClient.post<T>(url, data), [url]);
  return useApi<T>(apiCall, options);
}

// PUT request hook
export function usePut<T = any>(
  url: string,
  options: UseApiOptions = {}
) {
  const apiCall = useCallback((data?: any) => apiClient.put<T>(url, data), [url]);
  return useApi<T>(apiCall, options);
}

// PATCH request hook
export function usePatch<T = any>(
  url: string,
  options: UseApiOptions = {}
) {
  const apiCall = useCallback((data?: any) => apiClient.patch<T>(url, data), [url]);
  return useApi<T>(apiCall, options);
}

// DELETE request hook
export function useDelete<T = any>(
  url: string,
  options: UseApiOptions = {}
) {
  const apiCall = useCallback(() => apiClient.delete<T>(url), [url]);
  return useApi<T>(apiCall, options);
}

// File upload hook
export function useFileUpload<T = any>(
  url: string,
  options: UseApiOptions = {}
) {
  const [uploadProgress, setUploadProgress] = useState(0);

  const apiCall = useCallback((file: File) => 
    apiClient.uploadFile<T>(url, file, setUploadProgress), [url]);

  const { data, loading, error, success, execute, reset } = useApi<T>(apiCall, options);

  return {
    data,
    loading,
    error,
    success,
    uploadProgress,
    upload: execute,
    reset,
  };
}

// Paginated data hook
export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  hasMore: boolean;
}

export function usePaginatedApi<T = any>(
  url: string,
  options: UseApiOptions = {}
) {
  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const [allData, setAllData] = useState<T[]>([]);
  const [hasMore, setHasMore] = useState(true);

  const apiCall = useCallback(() => 
    apiClient.get<PaginatedResponse<T>>(`${url}?page=${page}&limit=${limit}`), 
    [url, page, limit]
  );

  const { data, loading, error, success, execute } = useApi<PaginatedResponse<T>>(apiCall, {
    ...options,
    onSuccess: (response) => {
      if (response) {
        if (page === 1) {
          setAllData(response.data);
        } else {
          setAllData(prev => [...prev, ...response.data]);
        }
        setHasMore(response.hasMore);
      }
      options.onSuccess?.(response);
    }
  });

  const loadMore = useCallback(() => {
    if (hasMore && !loading) {
      setPage(prev => prev + 1);
    }
  }, [hasMore, loading]);

  const refresh = useCallback(() => {
    setPage(1);
    setAllData([]);
    setHasMore(true);
    execute();
  }, [execute]);

  return {
    data: allData,
    loading,
    error,
    success,
    hasMore,
    page,
    loadMore,
    refresh,
    execute,
  };
}

export default useApi;
