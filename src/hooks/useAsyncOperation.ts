import { useState, useCallback } from 'react';

interface UseAsyncOperationReturn<T> {
  data: T | null;
  isLoading: boolean;
  error: string | null;
  execute: (...args: any[]) => Promise<T | null>;
  reset: () => void;
}

export const useAsyncOperation = <T>(
  asyncFunction: (...args: any[]) => Promise<T>
): UseAsyncOperationReturn<T> => {
  const [data, setData] = useState<T | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const execute = useCallback(async (...args: any[]): Promise<T | null> => {
    setIsLoading(true);
    setError(null);
    
    try {
      const result = await asyncFunction(...args);
      setData(result);
      return result;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An unexpected error occurred';
      setError(errorMessage);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [asyncFunction]);

  const reset = useCallback(() => {
    setData(null);
    setError(null);
    setIsLoading(false);
  }, []);

  return {
    data,
    isLoading,
    error,
    execute,
    reset,
  };
};

interface UseMultipleAsyncOperationsReturn {
  operations: Record<string, {
    isLoading: boolean;
    error: string | null;
    data: any;
  }>;
  executeOperation: (operationName: string, asyncFunction: () => Promise<any>) => Promise<any>;
  resetOperation: (operationName: string) => void;
  resetAllOperations: () => void;
}

export const useMultipleAsyncOperations = (): UseMultipleAsyncOperationsReturn => {
  const [operations, setOperations] = useState<Record<string, {
    isLoading: boolean;
    error: string | null;
    data: any;
  }>>({});

  const executeOperation = useCallback(async (operationName: string, asyncFunction: () => Promise<any>) => {
    setOperations(prev => ({
      ...prev,
      [operationName]: {
        ...prev[operationName],
        isLoading: true,
        error: null,
      }
    }));

    try {
      const result = await asyncFunction();
      setOperations(prev => ({
        ...prev,
        [operationName]: {
          isLoading: false,
          error: null,
          data: result,
        }
      }));
      return result;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An unexpected error occurred';
      setOperations(prev => ({
        ...prev,
        [operationName]: {
          ...prev[operationName],
          isLoading: false,
          error: errorMessage,
        }
      }));
      throw err;
    }
  }, []);

  const resetOperation = useCallback((operationName: string) => {
    setOperations(prev => ({
      ...prev,
      [operationName]: {
        isLoading: false,
        error: null,
        data: null,
      }
    }));
  }, []);

  const resetAllOperations = useCallback(() => {
    setOperations({});
  }, []);

  return {
    operations,
    executeOperation,
    resetOperation,
    resetAllOperations,
  };
};

interface UseRetryOperationReturn<T> {
  data: T | null;
  isLoading: boolean;
  error: string | null;
  retryCount: number;
  execute: (...args: any[]) => Promise<T | null>;
  retry: () => Promise<T | null>;
  reset: () => void;
}

export const useRetryOperation = <T>(
  asyncFunction: (...args: any[]) => Promise<T>,
  maxRetries: number = 3,
  retryDelay: number = 1000
): UseRetryOperationReturn<T> => {
  const [data, setData] = useState<T | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);
  const [lastArgs, setLastArgs] = useState<any[]>([]);

  const execute = useCallback(async (...args: any[]): Promise<T | null> => {
    setLastArgs(args);
    setRetryCount(0);
    setIsLoading(true);
    setError(null);
    
    return await performOperation(args);
  }, [asyncFunction, maxRetries, retryDelay]);

  const performOperation = useCallback(async (args: any[]): Promise<T | null> => {
    try {
      const result = await asyncFunction(...args);
      setData(result);
      setRetryCount(0);
      return result;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An unexpected error occurred';
      
      if (retryCount < maxRetries) {
        setRetryCount(prev => prev + 1);
        setError(`${errorMessage} (Retry ${retryCount + 1}/${maxRetries})`);
        
        // Wait before retrying
        await new Promise(resolve => setTimeout(resolve, retryDelay));
        
        return await performOperation(args);
      } else {
        setError(errorMessage);
        setRetryCount(0);
        return null;
      }
    } finally {
      setIsLoading(false);
    }
  }, [asyncFunction, maxRetries, retryDelay, retryCount]);

  const retry = useCallback(async (): Promise<T | null> => {
    if (lastArgs.length === 0) {
      setError('No previous operation to retry');
      return null;
    }
    
    setIsLoading(true);
    setError(null);
    
    return await performOperation(lastArgs);
  }, [lastArgs, performOperation]);

  const reset = useCallback(() => {
    setData(null);
    setError(null);
    setRetryCount(0);
    setLastArgs([]);
    setIsLoading(false);
  }, []);

  return {
    data,
    isLoading,
    error,
    retryCount,
    execute,
    retry,
    reset,
  };
};
