import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuthStore } from '../../store/authStore.js';
import { logout } from '../../api/auth.js';
import { DEFAULT_LANGUAGE, getPathWithLanguage, normalizeLanguage } from '../../i18n/config.js';

function Navbar() {
  const navigate = useNavigate();
  const { i18n, t } = useTranslation();
  const { user, token, role, clearAuth } = useAuthStore();
  const activeLanguage = normalizeLanguage(i18n.resolvedLanguage) || DEFAULT_LANGUAGE;

  const localizedTo = (path) => getPathWithLanguage(path, activeLanguage);

  const handleLogout = async () => {
    try {
      if (token) {
        await logout();
      }
    } catch {}
    clearAuth();
    navigate(localizedTo('/login'));
  };

  return (
    <nav className="bg-navy-800 bg-[#1a2744] text-white shadow-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Left: Brand + Nav Links */}
          <div className="flex items-center gap-8">
            <Link to={localizedTo('/events')} className="text-xl font-bold tracking-tight hover:opacity-90">
              {t('nav.brand')}
            </Link>
            <div className="hidden md:flex items-center gap-6">
              <Link
                to={localizedTo('/events')}
                className="text-sm font-medium text-gray-200 hover:text-white transition"
              >
                {t('nav.events')}
              </Link>
              <Link
                to={localizedTo('/calendar')}
                className="text-sm font-medium text-gray-200 hover:text-white transition"
              >
                {t('nav.calendar')}
              </Link>
              {(role === 'organizer' || role === 'admin') && (
                <Link
                  to={localizedTo('/organizer')}
                  className="text-sm font-medium text-gray-200 hover:text-white transition"
                >
                  {t('nav.dashboard')}
                </Link>
              )}
              {role === 'admin' && (
                <Link
                  to={localizedTo('/admin')}
                  className="text-sm font-medium text-gray-200 hover:text-white transition"
                >
                  {t('nav.admin')}
                </Link>
              )}
            </div>
          </div>

          {/* Right: Auth */}
          <div className="flex items-center gap-4">
            {token && user ? (
              <>
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-blue-400 flex items-center justify-center text-sm font-bold uppercase">
                    {(user?.full_name ? user.full_name[0] : user?.username ? user.username[0] : user?.email ? user.email[0] : 'U')}
                  </div>
                  {(role === 'student' || role === 'organizer' || role === 'admin') ? (
                    <Link
                      to={localizedTo('/account')}
                      className="text-sm text-gray-200 hidden sm:block hover:text-white transition"
                    >
                      {user?.full_name || user?.username || user?.email || role || t('nav.authenticated')}
                    </Link>
                  ) : (
                    <span className="text-sm text-gray-200 hidden sm:block">
                      {user?.full_name || user?.username || user?.email || role || t('nav.authenticated')}
                    </span>
                  )}
                </div>
                <button
                  onClick={handleLogout}
                  className="text-sm text-gray-300 hover:text-white border border-gray-500 hover:border-gray-300 px-3 py-1 rounded-lg transition"
                >
                  {t('nav.logout')}
                </button>
              </>
            ) : token ? (
              <button
                onClick={handleLogout}
                className="text-sm text-gray-300 hover:text-white border border-gray-500 hover:border-gray-300 px-3 py-1 rounded-lg transition"
              >
                {t('nav.logout')}
              </button>
            ) : (
              <Link
                to={localizedTo('/login')}
                className="bg-blue-500 hover:bg-blue-600 text-white text-sm font-medium px-4 py-2 rounded-lg transition"
              >
                {t('nav.login')}
              </Link>
            )}
          </div>
        </div>

        <div className="md:hidden pb-3 flex flex-wrap gap-3 text-sm">
          <Link to={localizedTo('/events')} className="text-gray-200 hover:text-white transition">{t('nav.events')}</Link>
          <Link to={localizedTo('/calendar')} className="text-gray-200 hover:text-white transition">{t('nav.calendar')}</Link>
          {(role === 'organizer' || role === 'admin') && (
            <Link to={localizedTo('/organizer')} className="text-gray-200 hover:text-white transition">{t('nav.dashboard')}</Link>
          )}
          {role === 'admin' && (
            <>
              <Link to={localizedTo('/admin')} className="text-gray-200 hover:text-white transition">{t('nav.admin')}</Link>
              <Link to={localizedTo('/admin/users')} className="text-gray-200 hover:text-white transition">{t('nav.users')}</Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}

export default Navbar;
