import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

export function useLogout() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();
  const { logout: authLogout } = useAuth();

  const logout = async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Use the AuthContext logout function which properly clears state
      await authLogout();

      // Navigate to login page
      navigate('/login', { replace: true });

      return true;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Logout failed';
      setError(errorMessage);
      console.error('Logout error:', err);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  return {
    logout,
    isLoading,
    error,
  };
}
