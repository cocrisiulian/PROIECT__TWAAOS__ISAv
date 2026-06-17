import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import PageFrame from '../../components/layout/PageFrame.jsx';
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
    {
      title: 'Role Upgrade Requests',
      description: 'Manage user role upgrade requests',
      path: localizedTo('/admin/role-requests'),
      color: 'bg-purple-500',
    },
  ];

  return (
    <PageFrame
      title={t('admin.dashboard.title')}
      subtitle={t('admin.dashboard.subtitle')}
      width="5xl"
      contentClassName="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3"
    >
      {cards.map((card) => (
        <button
          key={card.path}
          onClick={() => navigate(card.path)}
          className="usv-card text-left transition hover:-translate-y-0.5 hover:shadow-[0_22px_50px_rgba(15,23,42,0.1)]"
        >
          <div className="usv-card-body">
            <div className={`mb-4 h-10 w-10 rounded-full ${card.color}`} />
            <h2 className="mb-1 text-lg font-semibold text-slate-800">{card.title}</h2>
            <p className="text-sm text-slate-500">{card.description}</p>
          </div>
        </button>
      ))}
    </PageFrame>
  );
}
