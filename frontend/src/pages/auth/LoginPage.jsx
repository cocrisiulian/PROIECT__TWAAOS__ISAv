import { useState } from 'react';
import { useNavigate, Navigate, Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useTranslation } from 'react-i18next';
import { loginStaff, getGoogleAuthUrl } from '../../api/auth.js';
import { useAuthStore } from '../../store/authStore.js';
import { getPathWithLanguage, normalizeLanguage } from '../../i18n/config.js';

function LoginPage() {
  const navigate = useNavigate();
  const { token, role, setAuth } = useAuthStore();
  const { t, i18n } = useTranslation();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  const localizedTo = (path) => getPathWithLanguage(path, normalizeLanguage(i18n.language));

  // Redirect if already logged in
  if (token) {
    if (role === 'admin') {
      return <Navigate to={localizedTo('/admin')} replace />;
    }
    if (role === 'organizer') {
      return <Navigate to={localizedTo('/organizer')} replace />;
    }
    return <Navigate to={localizedTo('/events')} replace />;
  }

  const handleGoogleSignIn = async () => {
    setGoogleLoading(true);
    try {
      const res = await getGoogleAuthUrl();
      const url = res.data?.url || res.data?.auth_url || res.data;
      window.location.href = typeof url === 'string' ? url : url.url;
    } catch (err) {
      toast.error('Could not get Google sign-in URL. Please try again.');
      setGoogleLoading(false);
    }
  };

  const handleStaffLogin = async (e) => {
    e.preventDefault();
    if (!username || !password) {
      toast.error(t('auth.login.errors.fillFields'));
      return;
    }
    setLoading(true);
    try {
      const res = await loginStaff(username, password);
      const { user, access_token, role } = res.data;
      setAuth(user, access_token, role);
      toast.success('Logged in successfully!');
      if (role === 'admin') {
        navigate(localizedTo('/admin'));
      } else {
        navigate(localizedTo('/organizer'));
      }
    } catch (err) {
      const status = err?.response?.status;
      const detail = err?.response?.data?.detail;
      let msg;

      if (status === 401) {
        msg = t('auth.login.errors.invalidCredentials');
      } else if (status === 403) {
        const detailText = typeof detail === 'string' ? detail.toLowerCase() : '';
        msg = detailText.includes('visitor')
          ? t('auth.login.errors.roleVisitor')
          : t('auth.login.errors.forbidden');
      } else {
        msg = (typeof detail === 'string' && detail) || t('auth.login.errors.loginFailed');
      }

      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4 py-12">
      <div className="max-w-4xl w-full">
        <div className="text-center mb-10">
          <h1 className="text-3xl font-bold text-navy-800 text-gray-900">{t('auth.login.title')}</h1>
          <p className="mt-2 text-gray-500">{t('auth.login.subtitle')}</p>
        </div>

        <div className="grid md:grid-cols-2 gap-8">
          {/* Google Sign In - Students */}
          <div className="bg-white rounded-2xl shadow-md p-8 flex flex-col items-center justify-center">
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-4">
              <svg className="w-8 h-8 text-blue-600" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 12c2.7 0 4.8-2.1 4.8-4.8S14.7 2.4 12 2.4 7.2 4.5 7.2 7.2 9.3 12 12 12zm0 2.4c-3.2 0-9.6 1.6-9.6 4.8v2.4h19.2v-2.4c0-3.2-6.4-4.8-9.6-4.8z" />
              </svg>
            </div>
            <h2 className="text-xl font-semibold text-gray-800 mb-2">{t('auth.login.studentSection')}</h2>
            <p className="text-sm text-gray-500 mb-6 text-center">
              {t('auth.login.studentDesc')}
            </p>
            <button
              onClick={handleGoogleSignIn}
              disabled={googleLoading}
              className="w-full flex items-center justify-center gap-3 bg-blue-600 hover:bg-blue-700 text-white font-medium px-6 py-3 rounded-lg transition disabled:opacity-50"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
              </svg>
              {googleLoading ? t('auth.login.googleRedirecting') : t('auth.login.googleSignIn')}
            </button>
            <p className="mt-4 text-xs text-gray-400">{t('auth.login.emailOnly')}</p>
          </div>

          {/* Staff Login */}
          <div className="bg-white rounded-2xl shadow-md p-8">
            <h2 className="text-xl font-semibold text-gray-800 mb-2">{t('auth.login.staffSection')}</h2>
            <p className="text-sm text-gray-500 mb-6">{t('auth.login.staffDesc')}</p>

            <form onSubmit={handleStaffLogin} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {t('auth.login.username')}
                </label>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter username"
                  autoComplete="username"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {t('auth.login.password')}
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter password"
                  autoComplete="current-password"
                />
              </div>
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-gray-800 hover:bg-gray-900 text-white font-medium px-6 py-3 rounded-lg transition disabled:opacity-50"
              >
                {loading ? t('auth.login.signingIn') : t('auth.login.signIn')}
              </button>
              <div className="flex items-center justify-between text-sm pt-2">
                <Link to={localizedTo('/signup')} className="text-blue-600 hover:text-blue-700 font-medium">
                  {t('auth.login.createAccount')}
                </Link>
                <Link to={localizedTo('/forgot-password')} className="text-gray-600 hover:text-gray-800">
                  {t('auth.login.forgotPassword')}
                </Link>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}

export default LoginPage;
