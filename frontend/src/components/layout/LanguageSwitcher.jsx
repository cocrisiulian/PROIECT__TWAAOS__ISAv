import { useTranslation } from 'react-i18next';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  DEFAULT_LANGUAGE,
  LANGUAGE_STORAGE_KEY,
  SUPPORTED_LANGUAGES,
  getPathWithLanguage,
  normalizeLanguage,
} from '../../i18n/config.js';

function LanguageSwitcher() {
  const { i18n, t } = useTranslation();
  const location = useLocation();
  const navigate = useNavigate();

  const activeLanguage = normalizeLanguage(i18n.resolvedLanguage) || DEFAULT_LANGUAGE;

  const handleLanguageChange = async (event) => {
    const nextLanguage = normalizeLanguage(event.target.value);
    if (!nextLanguage || nextLanguage === activeLanguage) {
      return;
    }

    await i18n.changeLanguage(nextLanguage);

    if (typeof window !== 'undefined') {
      window.localStorage.setItem(LANGUAGE_STORAGE_KEY, nextLanguage);
    }

    const localizedPath = getPathWithLanguage(location.pathname, nextLanguage);
    navigate(`${localizedPath}${location.search}${location.hash}`, { replace: true });
  };

  return (
    <div className="inline-flex items-center gap-2 bg-white/95 border border-gray-200 shadow-sm rounded-lg px-2.5 py-1.5">
      <label htmlFor="language-switcher" className="text-xs font-medium text-gray-600">
        {t('common.language')}
      </label>
      <select
        id="language-switcher"
        aria-label={t('common.language')}
        value={activeLanguage}
        onChange={handleLanguageChange}
        className="text-sm font-medium border border-gray-300 rounded-md bg-white px-2 py-1 focus:outline-none focus:ring-2 focus:ring-blue-500"
      >
        {SUPPORTED_LANGUAGES.map((language) => (
          <option key={language} value={language}>
            {language === 'ro' ? t('common.romanian') : t('common.english')}
          </option>
        ))}
      </select>
    </div>
  );
}

export default LanguageSwitcher;