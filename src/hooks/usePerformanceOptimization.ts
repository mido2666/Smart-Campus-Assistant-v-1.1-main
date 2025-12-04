/**
 * Performance Optimization Hook
 * Comprehensive performance optimization utilities for React components
 */

import { useState, useEffect, useCallback, useMemo, useRef, useLayoutEffect } from 'react';
import { performanceMonitor } from '../utils/performance';
import { cache } from '../utils/cache';

// Debounce hook
export const useDebounce = <T>(value: T, delay: number): T => {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
};

// Throttle hook
export const useThrottle = <T extends (...args: any[]) => any>(
  callback: T,
  delay: number
): T => {
  const lastRun = useRef(Date.now());

  return useCallback(
    ((...args: any[]) => {
      if (Date.now() - lastRun.current >= delay) {
        callback(...args);
        lastRun.current = Date.now();
      }
    }) as T,
    [callback, delay]
  );
};

// Memoization hook with custom equality function
export const useMemoizedValue = <T>(
  factory: () => T,
  deps: React.DependencyList,
  equalityFn?: (a: T, b: T) => boolean
): T => {
  const ref = useRef<{ deps: React.DependencyList; value: T }>();

  if (!ref.current || !areEqual(ref.current.deps, deps)) {
    ref.current = { deps, value: factory() };
  }

  return ref.current.value;
};

// Custom equality function for dependencies
const areEqual = (a: React.DependencyList, b: React.DependencyList): boolean => {
  if (a.length !== b.length) return false;
  return a.every((val, index) => val === b[index]);
};

// Virtual scrolling hook
export const useVirtualScroll = (
  itemCount: number,
  itemHeight: number,
  containerHeight: number,
  overscan: number = 5
) => {
  const [scrollTop, setScrollTop] = useState(0);

  const visibleStart = Math.floor(scrollTop / itemHeight);
  const visibleEnd = Math.min(
    visibleStart + Math.ceil(containerHeight / itemHeight),
    itemCount
  );

  const startIndex = Math.max(0, visibleStart - overscan);
  const endIndex = Math.min(itemCount, visibleEnd + overscan);

  const visibleItems = useMemo(() => {
    const items = [];
    for (let i = startIndex; i < endIndex; i++) {
      items.push({
        index: i,
        top: i * itemHeight,
        height: itemHeight
      });
    }
    return items;
  }, [startIndex, endIndex, itemHeight]);

  const totalHeight = itemCount * itemHeight;

  const handleScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    setScrollTop(e.currentTarget.scrollTop);
  }, []);

  return {
    visibleItems,
    totalHeight,
    handleScroll,
    startIndex,
    endIndex
  };
};

// Intersection observer hook
export const useIntersectionObserver = (
  options: IntersectionObserverInit = {}
) => {
  const [isIntersecting, setIsIntersecting] = useState(false);
  const [hasIntersected, setHasIntersected] = useState(false);
  const ref = useRef<HTMLElement>(null);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsIntersecting(entry.isIntersecting);
        if (entry.isIntersecting && !hasIntersected) {
          setHasIntersected(true);
        }
      },
      options
    );

    observer.observe(element);

    return () => {
      observer.unobserve(element);
    };
  }, [options, hasIntersected]);

  return { ref, isIntersecting, hasIntersected };
};

// Resize observer hook
export const useResizeObserver = () => {
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });
  const ref = useRef<HTMLElement>(null);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    const resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const { width, height } = entry.contentRect;
        setDimensions({ width, height });
      }
    });

    resizeObserver.observe(element);

    return () => {
      resizeObserver.unobserve(element);
    };
  }, []);

  return { ref, dimensions };
};

// Performance monitoring hook
export const usePerformanceMonitoring = (componentName: string) => {
  const renderStartTime = useRef<number>(0);
  const renderCount = useRef<number>(0);

  useLayoutEffect(() => {
    renderStartTime.current = performance.now();
  });

  useEffect(() => {
    const renderTime = performance.now() - renderStartTime.current;
    renderCount.current += 1;

    performanceMonitor.trackSyncFunction(`RENDER_${componentName}`, () => {
      // Render completed
    }, {
      renderTime,
      renderCount: renderCount.current
    });

    // Warn about slow renders
    if (renderTime > 16) { // 60fps threshold
      console.warn(`Slow render detected in ${componentName}: ${renderTime.toFixed(2)}ms`);
    }
  });

  return {
    renderCount: renderCount.current
  };
};

// Caching hook
export const useCachedValue = <T>(
  key: string,
  factory: () => Promise<T>,
  ttl?: number
) => {
  const [value, setValue] = useState<T | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const fetchValue = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const cached = await cache.get<T>(key);
      if (cached !== null) {
        setValue(cached);
        setLoading(false);
        return;
      }

      const newValue = await factory();
      await cache.set(key, newValue, ttl);
      setValue(newValue);
    } catch (err) {
      setError(err as Error);
    } finally {
      setLoading(false);
    }
  }, [key, factory, ttl]);

  useEffect(() => {
    fetchValue();
  }, [fetchValue]);

  const refresh = useCallback(() => {
    cache.delete(key);
    fetchValue();
  }, [key, fetchValue]);

  return { value, loading, error, refresh };
};

// Lazy loading hook
export const useLazyLoad = (
  threshold: number = 0.1,
  rootMargin: string = '50px'
) => {
  const [isVisible, setIsVisible] = useState(false);
  const [hasLoaded, setHasLoaded] = useState(false);
  const ref = useRef<HTMLElement>(null);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !hasLoaded) {
          setIsVisible(true);
          setHasLoaded(true);
          observer.unobserve(element);
        }
      },
      { threshold, rootMargin }
    );

    observer.observe(element);

    return () => {
      observer.unobserve(element);
    };
  }, [threshold, rootMargin, hasLoaded]);

  return { ref, isVisible, hasLoaded };
};

// Image optimization hook
export const useOptimizedImage = (
  src: string,
  options: {
    lazy?: boolean;
    placeholder?: string;
    quality?: number;
    format?: 'webp' | 'jpeg' | 'png';
  } = {}
) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);
  const { ref, isVisible } = useLazyLoad();

  const optimizedSrc = useMemo(() => {
    if (!src) return src;

    // Add optimization parameters
    const url = new URL(src);
    if (options.quality) {
      url.searchParams.set('q', options.quality.toString());
    }
    if (options.format) {
      url.searchParams.set('f', options.format);
    }

    return url.toString();
  }, [src, options.quality, options.format]);

  const handleLoad = useCallback(() => {
    setIsLoaded(true);
  }, []);

  const handleError = useCallback(() => {
    setHasError(true);
  }, []);

  return {
    ref,
    src: options.lazy ? (isVisible ? optimizedSrc : options.placeholder) : optimizedSrc,
    isLoaded,
    hasError,
    isVisible,
    onLoad: handleLoad,
    onError: handleError
  };
};

// Bundle splitting hook
export const useBundleSplitting = <T>(
  importFunc: () => Promise<T>,
  options: {
    preload?: boolean;
    preloadDelay?: number;
  } = {}
) => {
  const [module, setModule] = useState<T | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const loadModule = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const loadedModule = await importFunc();
      setModule(loadedModule);
    } catch (err) {
      setError(err as Error);
    } finally {
      setLoading(false);
    }
  }, [importFunc]);

  useEffect(() => {
    if (options.preload && options.preloadDelay) {
      const timer = setTimeout(loadModule, options.preloadDelay);
      return () => clearTimeout(timer);
    }
  }, [loadModule, options.preload, options.preloadDelay]);

  return { module, loading, error, loadModule };
};

// Memory optimization hook
export const useMemoryOptimization = () => {
  const [memoryUsage, setMemoryUsage] = useState<NodeJS.MemoryUsage | null>(null);

  useEffect(() => {
    const updateMemoryUsage = () => {
      setMemoryUsage(process.memoryUsage());
    };

    updateMemoryUsage();
    const interval = setInterval(updateMemoryUsage, 5000);

    return () => clearInterval(interval);
  }, []);

  const optimizeMemory = useCallback(() => {
    // Force garbage collection if available
    if (typeof window !== 'undefined' && (window as any).gc) {
      (window as any).gc();
    }

    // Clear caches
    cache.clear();
  }, []);

  return { memoryUsage, optimizeMemory };
};

// Export all hooks
export default {
  useDebounce,
  useThrottle,
  useMemoizedValue,
  useVirtualScroll,
  useIntersectionObserver,
  useResizeObserver,
  usePerformanceMonitoring,
  useCachedValue,
  useLazyLoad,
  useOptimizedImage,
  useBundleSplitting,
  useMemoryOptimization
};
