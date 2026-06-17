import { useState } from 'react';
import { useNavigate, Navigate, Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useTranslation } from 'react-i18next';
import { loginStaff, getGoogleAuthUrl } from '../../api/auth.js';
import { useAuthStore } from '../../store/authStore.js';
import { getPathWithLanguage, normalizeLanguage } from '../../i18n/config.js';
import PageFrame from '../../components/layout/PageFrame.jsx';

function LoginPage() {
  const navigate = useNavigate();
  const { token, role, setAuth } = useAuthStore();
  const { t, i18n } = useTranslation();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  const localizedTo = (path) => getPathWithLanguage(path, normalizeLanguage(i18n.language));

  if (token) {
    if (role === 'admin') {
      return <Navigate to={localizedTo('/admin')} replace />;
    }
    if (role === 'organizer') {
      return <Navigate to={localizedTo('/organizer')} replace />;
    }
    if (role === 'visitor') {
      return <Navigate to={localizedTo('/visitor/role-request')} replace />;
    }
    return <Navigate to={localizedTo('/events')} replace />;
  }

  const handleGoogleSignIn = async () => {
    setGoogleLoading(true);
    try {
      const res = await getGoogleAuthUrl();
      const url = res.data?.url || res.data?.auth_url || res.data;
      window.location.href = typeof url === 'string' ? url : url.url;
    } catch (error) {
      toast.error('Could not get Google sign-in URL. Please try again.');
      setGoogleLoading(false);
    }
  };

  const handleStaffLogin = async (event) => {
    event.preventDefault();
    if (!username || !password) {
      toast.error(t('auth.login.errors.fillFields'));
      return;
    }

    setLoading(true);
    try {
      const res = await loginStaff(username, password);
      const { user, access_token, role: nextRole } = res.data;
      setAuth(user, access_token, nextRole);
      toast.success('Logged in successfully!');
      if (nextRole === 'admin') {
        navigate(localizedTo('/admin'));
      } else {
        navigate(localizedTo('/organizer'));
      }
    } catch (error) {
      const status = error?.response?.status;
      const detail = error?.response?.data?.detail;
      let message;

      if (status === 401) {
        message = t('auth.login.errors.invalidCredentials');
      } else if (status === 403) {
        const detailText = typeof detail === 'string' ? detail.toLowerCase() : '';
        message = detailText.includes('visitor')
          ? t('auth.login.errors.roleVisitor')
          : t('auth.login.errors.forbidden');
      } else {
        message = (typeof detail === 'string' && detail) || t('auth.login.errors.loginFailed');
      }

      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <PageFrame
      showNavbar={false}
      centered
      width="5xl"
      title={t('auth.login.title')}
      subtitle={t('auth.login.subtitle')}
      contentClassName="w-full"
    >
      <div className="grid gap-8 md:grid-cols-2">
        <div className="usv-card flex flex-col items-center justify-center p-8">
          <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-blue-100">
            <svg className="h-8 w-8 text-blue-600" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 12c2.7 0 4.8-2.1 4.8-4.8S14.7 2.4 12 2.4 7.2 4.5 7.2 7.2 9.3 12 12 12zm0 2.4c-3.2 0-9.6 1.6-9.6 4.8v2.4h19.2v-2.4c0-3.2-6.4-4.8-9.6-4.8z" />
            </svg>
          </div>
          <h2 className="mb-2 text-xl font-semibold text-slate-800">{t('auth.login.studentSection')}</h2>
          <p className="mb-6 text-center text-sm text-slate-500">{t('auth.login.studentDesc')}</p>
          <button
            onClick={handleGoogleSignIn}
            disabled={googleLoading}
            className="usv-button-primary w-full gap-3"
          >
            <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
            </svg>
            {googleLoading ? t('auth.login.googleRedirecting') : t('auth.login.googleSignIn')}
          </button>
          <p className="mt-4 text-xs text-slate-400">{t('auth.login.emailOnly')}</p>
        </div>

        <div className="usv-card p-8">
          <h2 className="mb-2 text-xl font-semibold text-slate-800">{t('auth.login.staffSection')}</h2>
          <p className="mb-6 text-sm text-slate-500">{t('auth.login.staffDesc')}</p>

          <form onSubmit={handleStaffLogin} className="space-y-4">
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">
                {t('auth.login.username')}
              </label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="usv-input"
                placeholder="Enter username"
                autoComplete="username"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">
                {t('auth.login.password')}
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="usv-input"
                placeholder="Enter password"
                autoComplete="current-password"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="usv-button-primary w-full"
            >
              {loading ? t('auth.login.signingIn') : t('auth.login.signIn')}
            </button>
            <div className="flex items-center justify-between pt-2 text-sm">
              <Link to={localizedTo('/signup')} className="font-medium text-blue-700 hover:text-blue-800">
                {t('auth.login.createAccount')}
              </Link>
              <Link to={localizedTo('/forgot-password')} className="text-slate-600 hover:text-slate-800">
                {t('auth.login.forgotPassword')}
              </Link>
            </div>
          </form>
        </div>
      </div>
    </PageFrame>
  );
}

export default LoginPage;
