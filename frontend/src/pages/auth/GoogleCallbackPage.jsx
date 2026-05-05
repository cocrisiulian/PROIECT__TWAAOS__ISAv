import { useEffect, useRef, useState } from 'react';
import { useNavigate, useSearchParams, Link, useParams, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { handleGoogleCallback } from '../../api/auth.js';
import { useAuthStore } from '../../store/authStore.js';
import { getPathWithLanguage, normalizeLanguage, extractLanguageFromPath } from '../../i18n/config.js';

const CALLBACK_STORAGE_PREFIX = 'google_oauth_callback:';

function getCallbackStorageKey(code, state) {
  return `${CALLBACK_STORAGE_PREFIX}${code}:${state}`;
}

function GoogleCallbackPage() {
  const { t, i18n } = useTranslation();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const location = useLocation();
  const setAuth = useAuthStore((s) => s.setAuth);
  const [error, setError] = useState(null);
  const settledRef = useRef(false);

  const localizedTo = (path) => getPathWithLanguage(path, normalizeLanguage(i18n.language));

  useEffect(() => {
    // Check if the current path is already localized (e.g., starts with /ro/ or /en/)
    // We don't use useParams() here because the route structure in App.jsx 
    // uses literal paths for languages instead of a :lang parameter.
    const currentPathLang = extractLanguageFromPath(location.pathname);
    const isLocalized = !!currentPathLang;
    
    if (!isLocalized) {
      return;
    }


    const oauthError = searchParams.get('error');
    const oauthErrorDescription = searchParams.get('error_description');
    const code = searchParams.get('code');
    const state = searchParams.get('state');
    const callbackKey = code && state ? getCallbackStorageKey(code, state) : null;

    if (oauthError) {
      setError(oauthErrorDescription || 'Google authentication was cancelled or failed.');
      return;
    }

    if (!code || !state) {
      setError('Missing authorization data from Google.');
      return;
    }

    // Check if this specific code/state has already been successfully processed in this session
    if (callbackKey && window.sessionStorage.getItem(callbackKey) === 'done') {
      navigate(localizedTo('/events'), { replace: true });
      return;
    }

    // Prevent multiple concurrent requests for the same code/state
    if (callbackKey && window.sessionStorage.getItem(callbackKey) === 'pending') {
      return;
    }

    if (callbackKey) {
      window.sessionStorage.setItem(callbackKey, 'pending');
    }

    let isActive = true;

    handleGoogleCallback(code, state)
      .then((res) => {
        if (callbackKey) {
          window.sessionStorage.setItem(callbackKey, 'done');
        }

        // Even if component is unmounted (isActive = false), we should still
        // complete the auth and navigate if this was a valid response.
        // We use settledRef to ensure we only do this once.
        if (settledRef.current) return;
        settledRef.current = true;

        const { user = null, access_token, role } = res.data;
        setAuth(user, access_token, role);
        navigate(localizedTo('/events'), { replace: true });
      })
      .catch((err) => {
        if (!isActive || settledRef.current) return;

        if (callbackKey) {
          window.sessionStorage.removeItem(callbackKey);
        }

        const msg =
          err.response?.data?.detail ||
          'Authentication failed. Please try again.';
        setError(msg);
      });


    return () => {
      isActive = false;
    };
  }, [location.pathname, navigate, searchParams, setAuth]);


  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="bg-white rounded-2xl shadow-md p-8 max-w-md w-full text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </div>
          <h2 className="text-xl font-semibold text-gray-800 mb-2">Authentication Error</h2>
          <p className="text-gray-500 mb-6">{error}</p>
          <Link
            to={localizedTo('/login')}
            className="inline-block bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition"
          >
            Back to Login
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
        <p className="text-gray-600">Completing sign in...</p>
      </div>
    </div>
  );
}

export default GoogleCallbackPage;
