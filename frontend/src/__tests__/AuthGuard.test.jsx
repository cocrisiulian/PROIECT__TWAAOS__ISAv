/**
 * Tests for src/components/auth/AuthGuard.jsx
 *
 * Covers:
 *  - unauthenticated user → redirect to /login
 *  - authenticated user with correct role → renders the page (Outlet)
 *  - authenticated user with wrong role → redirect to /
 *  - token only in localStorage (Zustand not yet rehydrated) → still renders
 *  - role decoded from JWT fallback works
 *
 * NOTE: globals:true is set in vite.config.js — describe/it/expect/vi
 * are available as globals and must NOT be explicitly imported.
 */
import { render, screen } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';

// Mock persist to avoid jsdom storage event listener issues
vi.mock('zustand/middleware', () => ({
  persist: (fn) => fn,
}));

// Keep real token helpers, mock only the store hook so we control state per-test
vi.mock('../store/authStore.js', async (importOriginal) => {
  const actual = await importOriginal();

  return {
    ...actual,
    useAuthStore: vi.fn(),
  };
});

import { useAuthStore } from '../store/authStore.js';
import AuthGuard from '../components/auth/AuthGuard.jsx';

// ---- helpers ----------------------------------------------------------

const VALID_TOKEN = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9' +
  '.eyJzdWIiOiJ1dWlkLTEiLCJyb2xlIjoiYWRtaW4iLCJleHAiOjk5OTk5OTk5OTl9' +
  '.signature'; // not verified client-side

const ORG_TOKEN = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9' +
  '.eyJzdWIiOiJ1dWlkLTIiLCJyb2xlIjoib3JnYW5pemVyIiwiZXhwIjo5OTk5OTk5OTk5fQ==' +
  '.signature';

function renderWithRouter({ storeToken = null, storeRole = null, lsToken = null, lsStorage = null, allowedRoles = ['admin'] } = {}) {
  // Set up mock store returns
  useAuthStore.mockReturnValue({ token: storeToken, role: storeRole });

  // Set up localStorage
  localStorage.clear();
  if (lsToken) localStorage.setItem('auth_token', lsToken);
  if (lsStorage) localStorage.setItem('auth-storage', JSON.stringify(lsStorage));

  return render(
    <MemoryRouter initialEntries={['/admin']}>
      <Routes>
        <Route element={<AuthGuard allowedRoles={allowedRoles} />}>
          <Route path="/admin" element={<div>Admin Page</div>} />
        </Route>
        <Route path="/login" element={<div>Login Page</div>} />
        <Route path="/" element={<div>Home Page</div>} />
      </Routes>
    </MemoryRouter>
  );
}

beforeEach(() => {
  localStorage.clear();
  vi.clearAllMocks();
});

// -----------------------------------------------------------------------

describe('AuthGuard — unauthenticated', () => {
  it('redirects to /login when no token anywhere', () => {
    renderWithRouter({ storeToken: null, storeRole: null });
    // getByText throws if element not found — proves redirect happened
    screen.getByText('Login Page');
  });

  it('does NOT render the protected page when no token', () => {
    renderWithRouter({ storeToken: null, storeRole: null });
    // queryByText returns null when absent
    expect(screen.queryByText('Admin Page')).toBeNull();
  });
});

describe('AuthGuard — authenticated, correct role', () => {
  it('renders the protected page when token + role match', () => {
    renderWithRouter({ storeToken: VALID_TOKEN, storeRole: 'admin', allowedRoles: ['admin'] });
    screen.getByText('Admin Page');
  });

  it('renders when organizer accesses organizer-only route', () => {
    renderWithRouter({ storeToken: VALID_TOKEN, storeRole: 'organizer', allowedRoles: ['organizer', 'admin'] });
    screen.getByText('Admin Page');
  });

  it('admin can access organizer route (allowedRoles includes admin)', () => {
    renderWithRouter({ storeToken: VALID_TOKEN, storeRole: 'admin', allowedRoles: ['organizer', 'admin'] });
    screen.getByText('Admin Page');
  });
});

describe('AuthGuard — authenticated, wrong role', () => {
  it('redirects organizer away from admin-only route', () => {
    renderWithRouter({ storeToken: VALID_TOKEN, storeRole: 'organizer', allowedRoles: ['admin'] });
    screen.getByText('Home Page');
    expect(screen.queryByText('Admin Page')).toBeNull();
  });
});

describe('AuthGuard — localStorage fallback', () => {
  it('renders protected page when token only in localStorage (store not hydrated)', () => {
    renderWithRouter({
      storeToken: null,
      storeRole: null,
      lsToken: VALID_TOKEN,
      lsStorage: { state: { role: 'admin', token: VALID_TOKEN, user: null } },
      allowedRoles: ['admin'],
    });
    screen.getByText('Admin Page');
  });

  it('uses role from auth_user localStorage when store is empty', () => {
    localStorage.setItem('auth_user', JSON.stringify({ role: 'admin' }));
    useAuthStore.mockReturnValue({ token: null, role: null });
    render(
      <MemoryRouter initialEntries={['/admin']}>
        <Routes>
          <Route element={<AuthGuard allowedRoles={['admin']} />}>
            <Route path="/admin" element={<div>Admin Page</div>} />
          </Route>
          <Route path="/login" element={<div>Login Page</div>} />
        </Routes>
      </MemoryRouter>
    );
    // token is null → redirects to /login
    screen.getByText('Login Page');
  });

  it('reads role from JWT payload when no other source available', () => {
    // VALID_TOKEN payload: {"sub":"uuid-1","role":"admin","exp":99999999999}
    renderWithRouter({
      storeToken: null,
      storeRole: null,
      lsToken: VALID_TOKEN,
      allowedRoles: ['admin'],
    });
    // Role from JWT fallback: 'admin' → renders Admin Page
    screen.getByText('Admin Page');
  });
});
