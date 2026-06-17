import { useState } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useTranslation } from 'react-i18next';
import { signUp } from '../../api/auth.js';
import { useAuthStore } from '../../store/authStore.js';
import { getPathWithLanguage, normalizeLanguage } from '../../i18n/config.js';
import PageFrame from '../../components/layout/PageFrame.jsx';

function SignupPage() {
  const navigate = useNavigate();
  const { token, role, setAuth } = useAuthStore();
  const { t, i18n } = useTranslation();

  const localizedTo = (path) => getPathWithLanguage(path, normalizeLanguage(i18n.language));

  const [form, setForm] = useState({
    username: '',
    full_name: '',
    email: '',
    password: '',
    confirmPassword: '',
  });
  const [loading, setLoading] = useState(false);

  if (token) {
    if (role === 'admin') return <Navigate to={localizedTo('/admin')} replace />;
    if (role === 'organizer') return <Navigate to={localizedTo('/organizer')} replace />;
    if (role === 'visitor') return <Navigate to={localizedTo('/visitor/role-request')} replace />;
    return <Navigate to={localizedTo('/events')} replace />;
  }

  const onChange = (field) => (event) => {
    setForm((prev) => ({ ...prev, [field]: event.target.value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!form.username || !form.full_name || !form.email || !form.password) {
      toast.error(t('auth.signup.errors.fillAllFields'));
      return;
    }

    if (form.password !== form.confirmPassword) {
      toast.error(t('auth.signup.errors.passwordsMismatch'));
      return;
    }

    setLoading(true);
    try {
      const res = await signUp({
        username: form.username,
        full_name: form.full_name,
        email: form.email,
        password: form.password,
      });

      const { user, access_token, role: userRole } = res.data;
      setAuth(user, access_token, userRole);
      toast.success('Account created successfully!');
      navigate(localizedTo('/events'), { replace: true });
    } catch (err) {
      const msg = err.response?.data?.detail || t('auth.signup.errors.creationFailed');
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <PageFrame centered showNavbar={false}>
      <div className="usv-card usv-card-body w-full max-w-lg">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">{t('auth.signup.title')}</h1>
        <p className="text-sm text-gray-500 mb-6">{t('auth.signup.subtitle')}</p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{t('auth.signup.username')}</label>
            <input
              type="text"
              value={form.username}
              onChange={onChange('username')}
              className="usv-input"
              autoComplete="username"
              placeholder={t('auth.signup.usernamePlaceholder')}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{t('auth.signup.fullName')}</label>
            <input
              type="text"
              value={form.full_name}
              onChange={onChange('full_name')}
              className="usv-input"
              autoComplete="name"
              placeholder={t('auth.signup.fullNamePlaceholder')}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{t('auth.signup.email')}</label>
            <input
              type="email"
              value={form.email}
              onChange={onChange('email')}
              className="usv-input"
              autoComplete="email"
              placeholder={t('auth.signup.emailPlaceholder')}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{t('auth.signup.password')}</label>
            <input
              type="password"
              value={form.password}
              onChange={onChange('password')}
              className="usv-input"
              autoComplete="new-password"
              placeholder={t('auth.signup.passwordHint')}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{t('auth.signup.confirmPassword')}</label>
            <input
              type="password"
              value={form.confirmPassword}
              onChange={onChange('confirmPassword')}
              className="usv-input"
              autoComplete="new-password"
              placeholder={t('auth.signup.confirmPasswordHint')}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="usv-button-primary w-full"
          >
            {loading ? t('auth.signup.creatingAccount') : t('auth.signup.signUp')}
          </button>
        </form>

        <p className="text-sm text-gray-600 mt-6 text-center">
          {t('auth.signup.alreadyHaveAccount')}
          <Link to={localizedTo('/login')} className="text-blue-600 hover:text-blue-700 font-medium">
            {t('auth.signup.signInHere')}
          </Link>
        </p>
      </div>
    </PageFrame>
  );
}

export default SignupPage;
