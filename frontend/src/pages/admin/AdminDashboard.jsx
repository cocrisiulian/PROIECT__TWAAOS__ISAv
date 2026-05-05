import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import Navbar from '../../components/layout/Navbar.jsx';
import { DEFAULT_LANGUAGE, getPathWithLanguage, normalizeLanguage } from '../../i18n/config.js';

export default function AdminDashboard() {
  const navigate = useNavigate();
  const { i18n, t } = useTranslation();
  const activeLanguage = normalizeLanguage(i18n.resolvedLanguage) || DEFAULT_LANGUAGE;

  const localizedTo = (path) => getPathWithLanguage(path, activeLanguage);

  const cards = [
    {
      title: t('admin.dashboard.users'),
      description: t('admin.dashboard.usersDesc'),
      path: localizedTo('/admin/users'),
      color: 'bg-blue-500',
    },
    {
      title: t('admin.dashboard.pending'),
      description: t('admin.dashboard.pendingDesc'),
      path: localizedTo('/admin/events/pending'),
      color: 'bg-yellow-500',
    },
    {
      title: t('admin.dashboard.reports'),
      description: t('admin.dashboard.reportsDesc'),
      path: localizedTo('/admin/reports'),
      color: 'bg-green-500',
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="max-w-5xl mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold text-gray-800 mb-8">{t('admin.dashboard.title')}</h1>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {cards.map((card) => (
            <button
              key={card.path}
              onClick={() => navigate(card.path)}
              className="text-left p-6 rounded-xl shadow-md bg-white hover:shadow-lg transition border border-gray-100"
            >
              <div className={`w-10 h-10 rounded-full ${card.color} mb-4`} />
              <h2 className="text-lg font-semibold text-gray-800 mb-1">{card.title}</h2>
              <p className="text-sm text-gray-500">{card.description}</p>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
