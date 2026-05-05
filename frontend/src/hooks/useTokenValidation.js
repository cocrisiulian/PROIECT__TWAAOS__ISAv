import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore, isTokenExpired } from '../store/authStore.js';

/**
 * Hook care validează token-ul pe pagini protejate
 * Redirecționează la login dacă token-ul lipsește sau este expirat
 */
export function useTokenValidation() {
  const navigate = useNavigate();
  const { token, clearAuth } = useAuthStore();

  useEffect(() => {
    const storedToken = token || localStorage.getItem('auth_token');

    if (!storedToken || isTokenExpired(storedToken)) {
      clearAuth();
      navigate('/login', { replace: true });
    }
  }, [token, navigate, clearAuth]);

  return {
    isValid: token && !isTokenExpired(token),
  };
}
