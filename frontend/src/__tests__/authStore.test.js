/**
 * Tests for src/store/authStore.js
 *
 * Covers:
 *  - initial state (all null)
 *  - setAuth  : updates store, writes localStorage keys
 *  - clearAuth: resets store, removes localStorage keys
 *  - setAuth/clearAuth cycle
 *
 * NOTE: globals:true is set in vite.config.js — describe/it/expect/vi
 * are available as globals and must NOT be explicitly imported.
 */

// Mock persist to a passthrough to avoid storage event listener issues in jsdom
vi.mock('zustand/middleware', () => ({
  persist: (fn) => fn,
}));

import { useAuthStore } from '../store/authStore.js';

const FAKE_TOKEN = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJ1dWlkLTEyMyIsInJvbGUiOiJhZG1pbiIsImV4cCI6OTk5OTk5OTk5OX0.sig';
const FAKE_USER = { id: 'uuid-123', email: 'admin@usv.ro', full_name: 'Admin Test', role: 'admin', username: 'admin' };

function getState() {
  return useAuthStore.getState();
}

describe('authStore — initial state', () => {
  it('token is null initially', () => {
    getState().clearAuth();
    expect(getState().token).toBeNull();
  });

  it('user is null initially', () => {
    getState().clearAuth();
    expect(getState().user).toBeNull();
  });

  it('role is null initially', () => {
    getState().clearAuth();
    expect(getState().role).toBeNull();
  });
});

describe('authStore — setAuth', () => {
  beforeEach(() => {
    getState().clearAuth();
  });

  it('sets token in store', () => {
    getState().setAuth(FAKE_USER, FAKE_TOKEN, 'admin');
    expect(getState().token).toBe(FAKE_TOKEN);
  });

  it('sets role in store', () => {
    getState().setAuth(FAKE_USER, FAKE_TOKEN, 'admin');
    expect(getState().role).toBe('admin');
  });

  it('sets user object in store', () => {
    getState().setAuth(FAKE_USER, FAKE_TOKEN, 'admin');
    expect(getState().user).toEqual(FAKE_USER);
  });

  it('writes auth_token to localStorage', () => {
    getState().setAuth(FAKE_USER, FAKE_TOKEN, 'admin');
    expect(localStorage.getItem('auth_token')).toBe(FAKE_TOKEN);
  });

  it('writes auth_user to localStorage as JSON', () => {
    getState().setAuth(FAKE_USER, FAKE_TOKEN, 'admin');
    const stored = JSON.parse(localStorage.getItem('auth_user'));
    expect(stored).toEqual(FAKE_USER);
  });

  it('works for organizer role', () => {
    const orgUser = { ...FAKE_USER, role: 'organizer' };
    getState().setAuth(orgUser, FAKE_TOKEN, 'organizer');
    expect(getState().role).toBe('organizer');
  });
});

describe('authStore — clearAuth', () => {
  beforeEach(() => {
    // Start each test already logged in
    getState().setAuth(FAKE_USER, FAKE_TOKEN, 'admin');
  });

  it('sets token to null', () => {
    getState().clearAuth();
    expect(getState().token).toBeNull();
  });

  it('sets user to null', () => {
    getState().clearAuth();
    expect(getState().user).toBeNull();
  });

  it('sets role to null', () => {
    getState().clearAuth();
    expect(getState().role).toBeNull();
  });

  it('removes auth_token from localStorage', () => {
    getState().clearAuth();
    expect(localStorage.getItem('auth_token')).toBeNull();
  });

  it('removes auth_user from localStorage', () => {
    getState().clearAuth();
    expect(localStorage.getItem('auth_user')).toBeNull();
  });
});

describe('authStore — setAuth/clearAuth cycle', () => {
  it('can setAuth then clearAuth repeatedly without error', () => {
    for (let i = 0; i < 3; i++) {
      getState().setAuth(FAKE_USER, FAKE_TOKEN, 'admin');
      expect(getState().token).toBe(FAKE_TOKEN);
      getState().clearAuth();
      expect(getState().token).toBeNull();
    }
  });
});
