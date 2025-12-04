import { useEffect, useMemo, memo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles: ('student' | 'professor' | 'admin' | 'STUDENT' | 'PROFESSOR' | 'ADMIN')[];
}

// Memoized ProtectedRoute component for better performance
export const ProtectedRoute = memo(function ProtectedRoute({ children, allowedRoles }: ProtectedRouteProps) {
  const { user, isAuthenticated, isLoading, isInitialized } = useAuth();
  const navigate = useNavigate();

  // Memoize role checking to avoid recalculating on every render
  const roleCheck = useMemo(() => {
    if (!user?.role) return { userRole: null, isAllowed: false };
    
    const userRole = user.role.toLowerCase();
    const normalizedAllowedRoles = allowedRoles.map(r => r.toLowerCase());
    const isAllowed = normalizedAllowedRoles.includes(userRole);
    
    return { userRole, isAllowed };
  }, [user?.role, allowedRoles]);

  // Memoize auth state to avoid unnecessary redirects
  // Wait for initialization to complete before redirecting
  const shouldRedirect = useMemo(() => {
    // Don't redirect while loading or initializing
    if (isLoading || !isInitialized) return null;
    
    // Only redirect after initialization is complete
    if (!isAuthenticated || !user) return '/login';
    if (!roleCheck.isAllowed) {
      // Redirect to appropriate dashboard based on actual role
      if (roleCheck.userRole === 'student') return '/student-dashboard';
      if (roleCheck.userRole === 'professor' || roleCheck.userRole === 'admin') return '/professor-dashboard';
      return '/login';
    }
    return null; // No redirect needed
  }, [isLoading, isInitialized, isAuthenticated, user, roleCheck.isAllowed, roleCheck.userRole]);

  useEffect(() => {
    if (shouldRedirect) {
      // Only log in development
      if (import.meta.env?.DEV) {
        if (shouldRedirect === '/login') {
          console.log('ProtectedRoute: User not authenticated, redirecting to login');
        } else {
          console.log(`ProtectedRoute: User role "${roleCheck.userRole}" not allowed. Redirecting to ${shouldRedirect}`);
        }
      }
      navigate(shouldRedirect, { replace: true });
    }
  }, [shouldRedirect, navigate, roleCheck.userRole]);

  // Show loading while checking auth or during initialization
  if (isLoading || !isInitialized) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-darkBg">
        <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-amber-600"></div>
      </div>
    );
  }

  // Early return if not authenticated or not allowed (only after initialization)
  if (!isAuthenticated || !user || !roleCheck.isAllowed) {
    return null;
  }

  return <>{children}</>;
});

