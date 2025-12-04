/**
 * Authentication Context
 * Global authentication state management with React Context
 */

import React, { createContext, useContext, useReducer, useEffect, useCallback, ReactNode } from 'react';
import { apiClient, TokenManager } from '../services/api';

// User Types
export interface User {
  id: string;
  universityId: string;
  email: string;
  role: 'student' | 'professor' | 'admin';
  firstName: string;
  lastName: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// Auth State Types
export interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  isInitialized: boolean;
}

// Auth Action Types
export type AuthAction =
  | { type: 'AUTH_START' }
  | { type: 'AUTH_SUCCESS'; payload: { user: User; accessToken: string; refreshToken: string; expiresIn: number } }
  | { type: 'AUTH_FAILURE'; payload: string }
  | { type: 'AUTH_LOGOUT' }
  | { type: 'AUTH_CLEAR_ERROR' }
  | { type: 'AUTH_INITIALIZED' }
  | { type: 'AUTH_UPDATE_USER'; payload: User };

// Auth Context Type
export interface AuthContextType extends AuthState {
  login: (universityId: string, password: string) => Promise<void>;
  register: (userData: RegisterData) => Promise<void>;
  logout: () => Promise<void>;
  refreshToken: () => Promise<void>;
  updateUser: (userData: Partial<User>) => Promise<void>;
  clearError: () => void;
  checkAuthStatus: () => Promise<void>;
}

// Register Data Type
export interface RegisterData {
  universityId: string;
  email: string;
  password: string;
  role: 'student' | 'professor' | 'admin';
  firstName: string;
  lastName: string;
}

// Initial State
const initialState: AuthState = {
  user: null,
  isAuthenticated: false,
  isLoading: false,
  error: null,
  isInitialized: false,
};

// Auth Reducer
function authReducer(state: AuthState, action: AuthAction): AuthState {
  switch (action.type) {
    case 'AUTH_START':
      return {
        ...state,
        isLoading: true,
        error: null,
      };

    case 'AUTH_SUCCESS':
      console.log('AUTH_SUCCESS - Setting user:', action.payload.user);
      return {
        ...state,
        user: action.payload.user,
        isAuthenticated: true,
        isLoading: false,
        error: null,
        isInitialized: true,
      };

    case 'AUTH_FAILURE':
      return {
        ...state,
        user: null,
        isAuthenticated: false,
        isLoading: false,
        error: action.payload,
        isInitialized: true,
      };

    case 'AUTH_LOGOUT':
      return {
        ...state,
        user: null,
        isAuthenticated: false,
        isLoading: false,
        error: null,
        isInitialized: true,
      };

    case 'AUTH_CLEAR_ERROR':
      return {
        ...state,
        error: null,
      };

    case 'AUTH_INITIALIZED':
      return {
        ...state,
        isInitialized: true,
        isLoading: false,
      };

    case 'AUTH_UPDATE_USER':
      return {
        ...state,
        user: action.payload,
      };

    default:
      return state;
  }
}

// Create Context
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Auth Provider Props
interface AuthProviderProps {
  children: ReactNode;
}

// Auth Provider Component
export function AuthProvider({ children }: AuthProviderProps) {
  const [state, dispatch] = useReducer(authReducer, initialState);

  // Listen for auth logout events
  useEffect(() => {
    const handleAuthLogout = () => {
      dispatch({ type: 'AUTH_LOGOUT' });
    };

    window.addEventListener('auth:logout', handleAuthLogout);
    return () => window.removeEventListener('auth:logout', handleAuthLogout);
  }, []);

  // Refresh token function (defined early so it can be used in initializeAuth)
  const refreshTokenFunction = useCallback(async (): Promise<void> => {
    try {
      const refreshTokenValue = TokenManager.getRefreshToken();

      if (!refreshTokenValue) {
        throw new Error('No refresh token available');
      }

      const response = await apiClient.post('/auth/refresh', {
        refreshToken: refreshTokenValue
      });

      if (response.success && response.data) {
        const { user, accessToken, refreshToken: newRefreshToken, expiresIn } = response.data;

        // Store new tokens and user data
        TokenManager.setTokens(accessToken, newRefreshToken, expiresIn);
        TokenManager.setUserData(user);

        dispatch({
          type: 'AUTH_SUCCESS',
          payload: { user, accessToken, refreshToken: newRefreshToken, expiresIn }
        });
      } else {
        throw new Error('Token refresh failed');
      }
    } catch (error) {
      console.error('Token refresh error:', error);
      TokenManager.clearTokens();
      dispatch({ type: 'AUTH_LOGOUT' });
      throw error;
    }
  }, []);

  // Initialize authentication status
  const initializeAuth = useCallback(async () => {
    try {
      // Set loading state during initialization
      dispatch({ type: 'AUTH_START' });

      const token = TokenManager.getAccessToken();
      const refreshTokenValue = TokenManager.getRefreshToken();
      const storedUser = TokenManager.getUserData();

      // If no token at all, user is not logged in
      if (!token && !refreshTokenValue) {
        console.log('No tokens found - user not logged in');
        dispatch({ type: 'AUTH_INITIALIZED' });
        return;
      }

      // If token exists and is valid, use stored data immediately for fast UI
      if (token && TokenManager.isTokenValid() && storedUser) {
        console.log('Auth initialized from localStorage - User:', storedUser);
        dispatch({
          type: 'AUTH_SUCCESS',
          payload: {
            user: storedUser,
            accessToken: token,
            refreshToken: refreshTokenValue || '',
            expiresIn: 900 // 15 minutes default
          }
        });

        // Verify token is still valid with backend (silently in background)
        // This ensures we catch cases where token was invalidated server-side
        try {
          const verifyResponse = await apiClient.get('/auth/me');
          if (verifyResponse.success && verifyResponse.data?.user) {
            // Update user data if it changed
            TokenManager.setUserData(verifyResponse.data.user);
            dispatch({ type: 'AUTH_UPDATE_USER', payload: verifyResponse.data.user });
          }
        } catch (error: any) {
          // If verification fails, try to refresh token
          if (refreshTokenValue) {
            try {
              await refreshTokenFunction();
            } catch (refreshError) {
              console.warn('Token refresh failed during initialization:', refreshError);
              // Don't logout here - token might still work for some requests
              // Only logout if it's a clear authentication error (401)
              if (error?.response?.status === 401 || error?.status === 401) {
                console.warn('Authentication failed - clearing tokens');
                TokenManager.clearTokens();
                dispatch({ type: 'AUTH_LOGOUT' });
              }
            }
          } else {
            // No refresh token and verification failed - might be invalid token
            // But don't logout immediately - let user try to use the app
            console.warn('Token verification failed and no refresh token available');
          }
        }
        return;
      }

      // Token expired or invalid, but we have refresh token - try to refresh
      if (refreshTokenValue && (!token || !TokenManager.isTokenValid())) {
        console.log('Token expired, attempting refresh...');
        try {
          await refreshTokenFunction();
          // refreshTokenFunction() will dispatch AUTH_SUCCESS if successful
          return;
        } catch (error) {
          console.error('Token refresh failed during initialization:', error);
          // Refresh failed - clear tokens and mark as not authenticated
          TokenManager.clearTokens();
          dispatch({ type: 'AUTH_INITIALIZED' });
          return;
        }
      }

      // If we have token but no stored user, try to fetch from server
      if (token && TokenManager.isTokenValid() && !storedUser) {
        try {
          const response = await apiClient.get('/auth/me');

          if (response.success && response.data?.user) {
            // Store user data for future use
            TokenManager.setUserData(response.data.user);

            dispatch({
              type: 'AUTH_SUCCESS',
              payload: {
                user: response.data.user,
                accessToken: token,
                refreshToken: refreshTokenValue || '',
                expiresIn: 900 // 15 minutes default
              }
            });
            return;
          }
        } catch (error) {
          // If /auth/me fails, try to refresh token if available
          if (refreshTokenValue) {
            try {
              await refreshTokenFunction();
              return;
            } catch (refreshError) {
              console.error('Token refresh failed after /auth/me failure:', refreshError);
            }
          }

          // Both /auth/me and refresh failed - clear tokens
          console.error('Failed to fetch user data:', error);
          TokenManager.clearTokens();
          dispatch({ type: 'AUTH_INITIALIZED' });
          return;
        }
      }

      // No valid tokens and no refresh token - not authenticated
      TokenManager.clearTokens();
      dispatch({ type: 'AUTH_INITIALIZED' });
    } catch (error) {
      console.error('Auth initialization error:', error);
      // Only clear tokens if we're sure authentication is impossible
      // Don't clear if it's just a network error
      const refreshTokenValue = TokenManager.getRefreshToken();
      if (!refreshTokenValue) {
        TokenManager.clearTokens();
      }
      dispatch({ type: 'AUTH_INITIALIZED' });
    }
  }, [refreshTokenFunction]);

  // Initialize auth status on mount
  useEffect(() => {
    initializeAuth();
  }, [initializeAuth]);

  // Login function
  const login = async (universityId: string, password: string): Promise<void> => {
    try {
      dispatch({ type: 'AUTH_START' });

      const response = await apiClient.post('/auth/login', {
        universityId,
        password,
      });

      if (response.success && response.data) {
        const { user, accessToken, refreshToken, expiresIn } = response.data;

        // Store tokens and user data
        TokenManager.setTokens(accessToken, refreshToken, expiresIn);
        TokenManager.setUserData(user);

        console.log('Login successful - User data:', user);

        dispatch({
          type: 'AUTH_SUCCESS',
          payload: { user, accessToken, refreshToken, expiresIn }
        });
      } else {
        throw new Error(response.message || 'Login failed');
      }
    } catch (error: any) {
      console.error('Login error details:', error);

      // Extract error message from different error formats
      let errorMessage = 'Login failed. Please check your credentials.';

      // Check if it's a rate limit error (429)
      // ApiClient now properly extracts retryAfter, status, and message into the error object
      if (error?.code === 'RATE_LIMIT_EXCEEDED' || error?.status === 429 || error?.response?.status === 429) {
        // ApiClient's handleError already builds a proper message with retry time
        // So use it if available, otherwise build one ourselves
        if (error?.message && (error.message.includes('try again') || error.message.includes('Too many'))) {
          errorMessage = error.message;
        } else {
          // Fallback: build message from retryAfter if available
          const retryAfter = error?.retryAfter || error?.response?.data?.retryAfter || error?.data?.retryAfter;
          if (retryAfter) {
            const minutes = Math.ceil(retryAfter / 60);
            errorMessage = `Too many login attempts. Please try again in ${minutes} minute${minutes !== 1 ? 's' : ''}.`;
          } else {
            errorMessage = 'Too many login attempts. Please try again later.';
          }
        }
      }
      // Check if it's an ApiResponse with success:false (from updated apiClient)
      else if (error?.success === false && error?.message) {
        errorMessage = error.message;
      }
      // Check axios error response
      else if (error?.response?.data?.message) {
        errorMessage = error.response.data.message;
      }
      // Check if error message is directly in error object
      else if (error?.message) {
        errorMessage = error.message;
      }
      // Check if error has data property directly
      else if (error?.data?.message) {
        errorMessage = error.data.message;
      }
      // Check if error is a string
      else if (typeof error === 'string') {
        errorMessage = error;
      }

      dispatch({ type: 'AUTH_FAILURE', payload: errorMessage });
      throw new Error(errorMessage);
    }
  };

  // Register function
  const register = async (userData: RegisterData): Promise<void> => {
    try {
      dispatch({ type: 'AUTH_START' });

      const response = await apiClient.post('/auth/register', userData);

      if (response.success && response.data) {
        const { user, accessToken, refreshToken, expiresIn } = response.data;

        // Store tokens and user data
        TokenManager.setTokens(accessToken, refreshToken, expiresIn);
        TokenManager.setUserData(user);

        dispatch({
          type: 'AUTH_SUCCESS',
          payload: { user, accessToken, refreshToken, expiresIn }
        });
      } else {
        throw new Error(response.message || 'Registration failed');
      }
    } catch (error: any) {
      const errorMessage = error.message || 'Registration failed. Please try again.';
      dispatch({ type: 'AUTH_FAILURE', payload: errorMessage });
      throw error;
    }
  };

  // Logout function
  const logout = async (): Promise<void> => {
    try {
      const refreshToken = TokenManager.getRefreshToken();

      if (refreshToken) {
        await apiClient.post('/auth/logout', { refreshToken });
      }
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      // Clear tokens and state regardless of API call success
      TokenManager.clearTokens();
      dispatch({ type: 'AUTH_LOGOUT' });
    }
  };

  // Refresh token function (exposed to context)
  const refreshToken = refreshTokenFunction;

  // Update user function
  const updateUser = async (userData: Partial<User>): Promise<void> => {
    try {
      const response = await apiClient.put('/auth/profile', userData);

      if (response.success && response.data?.user) {
        // Update user data in localStorage
        TokenManager.setUserData(response.data.user);

        dispatch({ type: 'AUTH_UPDATE_USER', payload: response.data.user });
      } else {
        throw new Error(response.message || 'Profile update failed');
      }
    } catch (error: any) {
      const errorMessage = error.message || 'Profile update failed. Please try again.';
      dispatch({ type: 'AUTH_FAILURE', payload: errorMessage });
      throw error;
    }
  };

  // Clear error function
  const clearError = (): void => {
    dispatch({ type: 'AUTH_CLEAR_ERROR' });
  };

  // Check auth status function
  const checkAuthStatus = async (): Promise<void> => {
    await initializeAuth();
  };

  // Context value
  const contextValue: AuthContextType = {
    ...state,
    login,
    register,
    logout,
    refreshToken,
    updateUser,
    clearError,
    checkAuthStatus,
  };

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
}

// Custom hook to use auth context
export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);

  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }

  return context;
}

// Higher-order component for protected routes
export function withAuth<P extends object>(
  Component: React.ComponentType<P>,
  requiredRole?: 'student' | 'professor' | 'admin'
) {
  return function AuthenticatedComponent(props: P) {
    const { isAuthenticated, user, isLoading } = useAuth();

    if (isLoading) {
      return (
        <div className="flex items-center justify-center min-h-screen">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
        </div>
      );
    }

    if (!isAuthenticated) {
      return (
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-4">
              Authentication Required
            </h2>
            <p className="text-gray-600 dark:text-gray-400">
              Please log in to access this page.
            </p>
          </div>
        </div>
      );
    }

    if (requiredRole && user?.role !== requiredRole) {
      return (
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-4">
              Access Denied
            </h2>
            <p className="text-gray-600 dark:text-gray-400">
              You don't have permission to access this page.
            </p>
          </div>
        </div>
      );
    }

    return <Component {...props} />;
  };
}

export default AuthContext;
