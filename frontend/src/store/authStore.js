import { create } from 'zustand';
import { persist } from 'zustand/middleware';

/**
 * Decodează JWT și extrage payload-ul
 */
export function decodeToken(token) {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) {
      return null;
    }
    const base64 = parts[1].replace(/-/g, '+').replace(/_/g, '/');
    const payload = JSON.parse(window.atob(base64));
    return payload;
  } catch (error) {
    console.error('Eroare la decodarea token-ului:', error);
    return null;
  }
}

/**
 * Verifică dacă token-ul este expirat
 */
export function isTokenExpired(token) {
  if (!token) return true;
  
  const payload = decodeToken(token);
  if (!payload || !payload.exp) return true;
  
  // exp este în secunde, convertim la milisecunde și comparăm cu timp curent
  const expirationTime = payload.exp * 1000;
  const currentTime = Date.now();
  
  // Token-ul este expirat dacă exp <= current time
  return expirationTime <= currentTime;
}

/**
 * Obține rol din token
 */
export function getRoleFromToken(token) {
  const payload = decodeToken(token);
  return payload?.role || null;
}

export const useAuthStore = create(
  persist(
    (set) => ({
      user: null,
      token: null,
      role: null,

      setAuth: (user, token, role) => {
        localStorage.setItem('auth_token', token);
        localStorage.setItem('auth_user', JSON.stringify(user));
        set({ user, token, role });
      },

      clearAuth: () => {
        localStorage.removeItem('auth_token');
        localStorage.removeItem('auth_user');
        set({ user: null, token: null, role: null });
      },

      /**
       * Verifică și valideaza token-ul din storage
       * Dacă este expirat, îl șterge
       */
      validateToken: () => {
        const token = localStorage.getItem('auth_token');
        if (!token || isTokenExpired(token)) {
          localStorage.removeItem('auth_token');
          localStorage.removeItem('auth_user');
          set({ user: null, token: null, role: null });
          return false;
        }
        return true;
      },

      /**
       * Inițializează starea din storage și validează token-ul
       */
      initAuth: () => {
        const token = localStorage.getItem('auth_token');
        const userStr = localStorage.getItem('auth_user');
        
        if (!token || isTokenExpired(token)) {
          localStorage.removeItem('auth_token');
          localStorage.removeItem('auth_user');
          set({ user: null, token: null, role: null });
          return false;
        }

        try {
          const user = userStr ? JSON.parse(userStr) : null;
          const role = getRoleFromToken(token);
          set({ user, token, role });
          return true;
        } catch (error) {
          console.error('Eroare la inițializarea autentificării:', error);
          localStorage.removeItem('auth_token');
          localStorage.removeItem('auth_user');
          set({ user: null, token: null, role: null });
          return false;
        }
      },
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({
        user: state.user,
        token: state.token,
        role: state.role,
      }),
    }
  )
);
