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
    <nav className="border-b border-white/10 bg-gradient-to-r from-[#14253d] via-[#1a2744] to-[#223a62] text-white shadow-[0_10px_30px_rgba(15,23,42,0.18)]">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between gap-4">
          <div className="flex items-center gap-8">
            <Link to={localizedTo('/events')} className="group flex items-center gap-3 rounded-full px-1 py-1 text-xl font-bold tracking-tight hover:opacity-95">
              <span className="flex h-9 w-9 items-center justify-center rounded-full bg-white/15 text-sm font-extrabold uppercase ring-1 ring-white/20">
                U
              </span>
              <span>{t('nav.brand')}</span>
            </Link>
            <div className="hidden md:flex items-center gap-6">
              <Link
                to={localizedTo('/events')}
                className="text-sm font-medium text-slate-200 transition hover:text-white"
              >
                {t('nav.events')}
              </Link>
              <Link
                to={localizedTo('/calendar')}
                className="text-sm font-medium text-slate-200 transition hover:text-white"
              >
                {t('nav.calendar')}
              </Link>
              {(role === 'organizer' || role === 'admin') && (
                <Link
                  to={localizedTo('/organizer')}
                  className="text-sm font-medium text-slate-200 transition hover:text-white"
                >
                  {t('nav.dashboard')}
                </Link>
              )}
              {role === 'admin' && (
                <Link
                  to={localizedTo('/admin')}
                  className="text-sm font-medium text-slate-200 transition hover:text-white"
                >
                  {t('nav.admin')}
                </Link>
              )}
            </div>
          </div>

          <div className="flex items-center gap-3">
            {token && user ? (
              <>
                <div className="flex items-center gap-2 rounded-full border border-white/10 bg-white/10 px-3 py-1.5 backdrop-blur-sm">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-400 text-sm font-bold uppercase text-[#14253d]">
                    {(user?.full_name ? user.full_name[0] : user?.username ? user.username[0] : user?.email ? user.email[0] : 'U')}
                  </div>
                  {(role === 'student' || role === 'organizer' || role === 'admin') ? (
                    <Link
                      to={localizedTo('/account')}
                      className="hidden max-w-[180px] truncate text-sm font-medium text-slate-100 transition hover:text-white sm:block"
                    >
                      {user?.full_name || user?.username || user?.email || role || t('nav.authenticated')}
                    </Link>
                  ) : (
                    <span className="hidden max-w-[180px] truncate text-sm font-medium text-slate-100 sm:block">
                      {user?.full_name || user?.username || user?.email || role || t('nav.authenticated')}
                    </span>
                  )}
                </div>
                <button
                  onClick={handleLogout}
                  className="rounded-xl border border-white/20 bg-white/5 px-4 py-2 text-sm font-semibold text-slate-100 transition hover:border-white/30 hover:bg-white/10 hover:text-white"
                >
                  {t('nav.logout')}
                </button>
              </>
            ) : token ? (
              <button
                onClick={handleLogout}
                className="rounded-xl border border-white/20 bg-white/5 px-4 py-2 text-sm font-semibold text-slate-100 transition hover:border-white/30 hover:bg-white/10 hover:text-white"
              >
                {t('nav.logout')}
              </button>
            ) : (
              <Link
                to={localizedTo('/login')}
                className="rounded-xl bg-white px-4 py-2 text-sm font-semibold text-[#14253d] transition hover:bg-slate-100"
              >
                {t('nav.login')}
              </Link>
            )}
          </div>
        </div>

        <div className="flex flex-wrap gap-3 pb-3 text-sm md:hidden">
          <Link to={localizedTo('/events')} className="text-slate-200 transition hover:text-white">{t('nav.events')}</Link>
          <Link to={localizedTo('/calendar')} className="text-slate-200 transition hover:text-white">{t('nav.calendar')}</Link>
          {(role === 'organizer' || role === 'admin') && (
            <Link to={localizedTo('/organizer')} className="text-slate-200 transition hover:text-white">{t('nav.dashboard')}</Link>
          )}
          {role === 'admin' && (
            <>
              <Link to={localizedTo('/admin')} className="text-slate-200 transition hover:text-white">{t('nav.admin')}</Link>
              <Link to={localizedTo('/admin/users')} className="text-slate-200 transition hover:text-white">{t('nav.users')}</Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}

export default Navbar;
