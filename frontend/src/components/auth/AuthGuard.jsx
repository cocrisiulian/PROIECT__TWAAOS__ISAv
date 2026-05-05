import { Navigate, Outlet } from 'react-router-dom';
import { useAuthStore, isTokenExpired, getRoleFromToken } from '../../store/authStore.js';

function getRoleFromStorage() {
  try {
    const authUserRaw = localStorage.getItem('auth_user');
    if (authUserRaw) {
      const authUser = JSON.parse(authUserRaw);
      if (authUser?.role) {
        return authUser.role;
      }
    }

    const persistedRaw = localStorage.getItem('auth-storage');
    if (persistedRaw) {
      const persisted = JSON.parse(persistedRaw);
      if (persisted?.state?.role) {
        return persisted.state.role;
      }
    }
  } catch {
    return null;
  }

  return null;
}

function AuthGuard({ allowedRoles }) {
  // Read from Zustand store (in-memory)
  const { token: storeToken, role: storeRole, clearAuth } = useAuthStore();

  // Fallback to localStorage in case Zustand hasn't rehydrated yet
  const token = storeToken || localStorage.getItem('auth_token');
  const role = storeRole || getRoleFromStorage() || (token ? getRoleFromToken(token) : null);

  // Verifică dacă token-ul lipsește
  if (!token) {
    return <Navigate to="/login" replace />;
  }

  // Verifică dacă token-ul este expirat
  if (isTokenExpired(token)) {
    // Curăță starea și localStorage-ul
    clearAuth();
    return <Navigate to="/login" replace />;
  }

  // Enforce role-based redirect only after role can be determined.
  if (allowedRoles && role && !allowedRoles.includes(role)) {
    return <Navigate to="/" replace />;
  }

  return <Outlet />;
}

export default AuthGuard;