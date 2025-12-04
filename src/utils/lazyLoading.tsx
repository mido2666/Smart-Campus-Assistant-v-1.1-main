import React, { lazy, ComponentType, Suspense } from 'react';
import { 
  LoadingSkeleton,
  CardSkeleton,
  TableSkeleton,
  StatsSkeleton,
  ListSkeleton,
  ChartSkeleton,
  FormSkeleton,
  ProfileSkeleton,
  NotificationSkeleton
} from '../components/common/LoadingSkeleton';

/**
 * Higher-order component for lazy loading with loading fallback
 */
export function withLazyLoading<T extends ComponentType<any>>(
  importFunc: () => Promise<{ default: T }>,
  fallback?: ComponentType
) {
  const LazyComponent = lazy(importFunc);
  
  const WrappedComponent = (props: any) => {
    const FallbackComponent = fallback || (() => (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-mutedDark">Loading...</p>
        </div>
      </div>
    ));

    return (
      <LazyComponent
        {...props}
        fallback={<FallbackComponent />}
      />
    );
  };

  WrappedComponent.displayName = `withLazyLoading(${LazyComponent.displayName || LazyComponent.name})`;
  
  return WrappedComponent;
}

/**
 * Lazy load a component with a specific loading skeleton
 */
export function withSkeletonLoading<T extends ComponentType<any>>(
  importFunc: () => Promise<{ default: T }>,
  skeletonType: 'card' | 'table' | 'stats' | 'list' | 'chart' | 'form' | 'profile' | 'notification' = 'card'
) {
  // Add null check for importFunc
  if (!importFunc || typeof importFunc !== 'function') {
    console.error('withSkeletonLoading: importFunc is not a valid function', importFunc);
    return () => <div>Error: Invalid component import</div>;
  }

  const LazyComponent = lazy(importFunc);
  
  const WrappedComponent = (props: any) => {
    const getSkeletonComponent = () => {
      try {
        switch (skeletonType) {
          case 'card':
            return <CardSkeleton />;
          case 'table':
            return <TableSkeleton />;
          case 'stats':
            return <StatsSkeleton />;
          case 'list':
            return <ListSkeleton />;
          case 'chart':
            return <ChartSkeleton />;
          case 'form':
            return <FormSkeleton />;
          case 'profile':
            return <ProfileSkeleton />;
          case 'notification':
            return <NotificationSkeleton />;
          default:
            return <CardSkeleton />;
        }
      } catch (error) {
        console.error('Error rendering skeleton component:', error);
        return <div className="animate-pulse bg-gray-200 rounded h-4 w-full"></div>;
      }
    };

    return (
      <Suspense fallback={getSkeletonComponent()}>
        <LazyComponent {...props} />
      </Suspense>
    );
  };

  WrappedComponent.displayName = `withSkeletonLoading(${LazyComponent.displayName || LazyComponent.name})`;
  
  return WrappedComponent;
}

/**
 * Preload a component with priority support
 */
export function preloadComponent<T extends ComponentType<any>>(
  importFunc: () => Promise<{ default: T }>,
  priority: 'high' | 'low' = 'low'
) {
  return () => {
    const preload = () => {
      importFunc().catch((error) => {
        console.warn('Failed to preload component:', error);
      });
    };

    if (priority === 'high') {
      // High priority: preload immediately
      preload();
    } else {
      // Low priority: use requestIdleCallback or setTimeout
      if ('requestIdleCallback' in window) {
        requestIdleCallback(preload, { timeout: 2000 });
      } else {
        setTimeout(preload, 100);
      }
    }
  };
}

/**
 * Lazy load with error boundary
 */
export function withErrorBoundary<T extends ComponentType<any>>(
  importFunc: () => Promise<{ default: T }>,
  errorFallback?: ComponentType<{ error: Error; retry: () => void }>
) {
  const LazyComponent = lazy(importFunc);
  
  const WrappedComponent = (props: any) => {
    const ErrorFallback = errorFallback || (() => (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="text-red-500 mb-4">
            <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <p className="text-gray-600 dark:text-mutedDark mb-4">Failed to load component</p>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    ));

    return (
      <LazyComponent
        {...props}
        fallback={<LoadingSkeleton.CardSkeleton />}
        errorFallback={ErrorFallback}
      />
    );
  };

  WrappedComponent.displayName = `withErrorBoundary(${LazyComponent.displayName || LazyComponent.name})`;
  
  return WrappedComponent;
}

/**
 * Route-based code splitting with enhanced preloading
 */
export const createLazyRoute = <T extends ComponentType<any>>(
  importFunc: () => Promise<{ default: T }>,
  options: {
    skeletonType?: 'card' | 'table' | 'stats' | 'list' | 'chart' | 'form' | 'profile' | 'notification';
    preload?: boolean;
    preloadPriority?: 'high' | 'low';
  } = {}
) => {
  const { skeletonType = 'card', preload = false, preloadPriority = 'low' } = options;
  
  const LazyComponent = withSkeletonLoading(importFunc, skeletonType);
  
  if (preload) {
    // Preload the component with specified priority
    preloadComponent(importFunc, preloadPriority)();
  }
  
  return LazyComponent;
};

/**
 * Get preload function for a route
 */
export function getRoutePreloader<T extends ComponentType<any>>(
  importFunc: () => Promise<{ default: T }>
) {
  return preloadComponent(importFunc, 'low');
}

export default withLazyLoading;
