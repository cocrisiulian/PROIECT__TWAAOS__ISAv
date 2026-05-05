import { useState } from 'react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useTranslation } from 'react-i18next';
import { requestPasswordReset } from '../../api/auth.js';
import { getPathWithLanguage, normalizeLanguage } from '../../i18n/config.js';

function ForgotPasswordPage() {
  const { t, i18n } = useTranslation();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [resetToken, setResetToken] = useState('');

  const localizedTo = (path) => getPathWithLanguage(path, normalizeLanguage(i18n.language));

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!email) {
      toast.error(t('auth.forgotPassword.errors.fillEmail'));
      return;
    }

    setLoading(true);
    setResetToken('');
    try {
      const res = await requestPasswordReset(email);
      if (res.data?.reset_token) {
        setResetToken(res.data.reset_token);
      }
      toast.success(t('auth.forgotPassword.successMessage'));
    } catch (err) {
      const msg = err.response?.data?.detail || t('auth.forgotPassword.errors.processingFailed');
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4 py-12">
      <div className="bg-white rounded-2xl shadow-md p-8 w-full max-w-lg">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">{t('auth.forgotPassword.title')}</h1>
        <p className="text-sm text-gray-500 mb-6">
          {t('auth.forgotPassword.subtitle')}
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{t('auth.forgotPassword.email')}</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              autoComplete="email"
              placeholder="you@example.com"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-gray-800 hover:bg-gray-900 text-white font-medium px-6 py-3 rounded-lg transition disabled:opacity-50"
          >
            {loading ? t('auth.forgotPassword.generatingToken') : t('auth.forgotPassword.requestReset')}
          </button>
        </form>

        {resetToken && (
          <div className="mt-6 p-4 rounded-lg border border-blue-200 bg-blue-50">
            <p className="text-sm text-blue-900 font-medium mb-2">{t('auth.forgotPassword.resetToken')}</p>
            <p className="text-xs break-all text-blue-800">{resetToken}</p>
            <Link
              to={localizedTo(`/reset-password?token=${encodeURIComponent(resetToken)}`)}
              className="inline-block mt-3 text-sm text-blue-700 hover:text-blue-800 font-medium"
            >
              {t('auth.forgotPassword.continueToReset')}
            </Link>
          </div>
        )}

        <p className="text-sm text-gray-600 mt-6 text-center">
          {t('auth.forgotPassword.backToLogin')}
          <Link to={localizedTo('/login')} className="text-blue-600 hover:text-blue-700 font-medium">
            login
          </Link>
        </p>
      </div>
    </div>
  );
}

export default ForgotPasswordPage;
