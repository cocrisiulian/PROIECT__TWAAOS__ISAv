import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import ro from './locales/ro.json';
import en from './locales/en.json';

export const SUPPORTED_LANGUAGES = ['ro', 'en'];
export const DEFAULT_LANGUAGE = 'ro';
export const LANGUAGE_STORAGE_KEY = 'app_language';

export function normalizeLanguage(language) {
  if (!language || typeof language !== 'string') {
    return null;
  }

  const normalized = language.toLowerCase().split('-')[0];
  return SUPPORTED_LANGUAGES.includes(normalized) ? normalized : null;
}

export function extractLanguageFromPath(pathname = '') {
  const firstSegment = pathname.split('/').filter(Boolean)[0];
  return normalizeLanguage(firstSegment);
}

export function getPathWithLanguage(pathname = '/', language = DEFAULT_LANGUAGE) {
  const validLanguage = normalizeLanguage(language) || DEFAULT_LANGUAGE;
  const segments = pathname.split('/').filter(Boolean);
  const hasLanguagePrefix = segments.length > 0 && SUPPORTED_LANGUAGES.includes(segments[0]);
  const restSegments = hasLanguagePrefix ? segments.slice(1) : segments;
  const suffix = restSegments.length > 0 ? `/${restSegments.join('/')}` : '';
  return `/${validLanguage}${suffix}`;
}

function detectInitialLanguage() {
  if (typeof window === 'undefined') {
    return DEFAULT_LANGUAGE;
  }

  const pathLanguage = extractLanguageFromPath(window.location.pathname);
  if (pathLanguage) {
    return pathLanguage;
  }

  const storedLanguage = normalizeLanguage(window.localStorage.getItem(LANGUAGE_STORAGE_KEY));
  if (storedLanguage) {
    return storedLanguage;
  }

  const browserLanguage = normalizeLanguage(window.navigator.language);
  return browserLanguage || DEFAULT_LANGUAGE;
}

i18n
  .use(initReactI18next)
  .init({
    resources: {
      ro: { translation: ro },
      en: { translation: en },
    },
    lng: detectInitialLanguage(),
    fallbackLng: DEFAULT_LANGUAGE,
    supportedLngs: SUPPORTED_LANGUAGES,
    interpolation: {
      escapeValue: false,
    },
  });

i18n.on('languageChanged', (language) => {
  const normalized = normalizeLanguage(language) || DEFAULT_LANGUAGE;

  if (typeof document !== 'undefined') {
    document.documentElement.lang = normalized;
  }

  if (typeof window !== 'undefined') {
    window.localStorage.setItem(LANGUAGE_STORAGE_KEY, normalized);
  }
});

if (typeof document !== 'undefined') {
  document.documentElement.lang = normalizeLanguage(i18n.resolvedLanguage) || DEFAULT_LANGUAGE;
}

export default i18n;