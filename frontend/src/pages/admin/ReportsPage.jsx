import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useQuery } from '@tanstack/react-query';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts';
import { getEventsPerMonth, getAvgParticipation, getEventsPerOrganizer, getAllEvents } from '../../api/admin';
import PageFrame from '../../components/layout/PageFrame.jsx';
import { DEFAULT_LANGUAGE, getPathWithLanguage, normalizeLanguage } from '../../i18n/config.js';

function StatCard({ title, value, sub }) {
  return (
    <div className="usv-card usv-card-body">
      <p className="text-sm text-gray-500">{title}</p>
      <p className="text-3xl font-bold text-gray-800 mt-1">{value ?? '—'}</p>
      {sub && <p className="text-xs text-gray-400 mt-1">{sub}</p>}
    </div>
  );
}

export default function ReportsPage() {
  const { i18n, t } = useTranslation();
  const activeLanguage = normalizeLanguage(i18n.resolvedLanguage) || DEFAULT_LANGUAGE;
  const localizedTo = (path) => getPathWithLanguage(path, activeLanguage);
  const dateLocale = activeLanguage === 'ro' ? 'ro-RO' : 'en-US';
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  const { data: eventsPerMonth } = useQuery({
    queryKey: ['report-events-per-month'],
    queryFn: () => getEventsPerMonth().then((r) => r.data),
  });

  const { data: avgParticipation } = useQuery({
    queryKey: ['report-avg-participation'],
    queryFn: () => getAvgParticipation().then((r) => r.data),
  });

  const { data: eventsPerOrganizer } = useQuery({
    queryKey: ['report-events-per-organizer'],
    queryFn: () => getEventsPerOrganizer().then((r) => r.data),
  });

  const { data: allEventsData, isLoading: eventsLoading } = useQuery({
    queryKey: ['all-events', search, statusFilter],
    queryFn: () => getAllEvents({ search, status: statusFilter !== 'all' ? statusFilter : undefined }).then((r) => r.data),
  });

  const monthlyRaw = Array.isArray(eventsPerMonth?.data)
    ? eventsPerMonth.data
    : Array.isArray(eventsPerMonth)
      ? eventsPerMonth
      : [];
  const organizerRaw = Array.isArray(eventsPerOrganizer?.data)
    ? eventsPerOrganizer.data
    : Array.isArray(eventsPerOrganizer)
      ? eventsPerOrganizer
      : [];
  const avgRaw = Array.isArray(avgParticipation?.data)
    ? avgParticipation.data
    : Array.isArray(avgParticipation)
      ? avgParticipation
      : [];

  const monthlyData = monthlyRaw.map((row) => ({
    month: `${String(row.month).padStart(2, '0')}/${row.year}`,
    count: row.count ?? 0,
  }));

  const organizerData = organizerRaw.map((row) => ({
    organizer: row.full_name || row.username || '-',
    count: row.published_events ?? row.total_events ?? 0,
  }));

  const avgValue = avgRaw.length
    ? avgRaw.reduce((sum, row) => sum + (row.registration_count || 0), 0) / avgRaw.length
    : null;

  const allEvents = Array.isArray(allEventsData?.items)
    ? allEventsData.items
    : Array.isArray(allEventsData?.events)
      ? allEventsData.events
      : Array.isArray(allEventsData)
        ? allEventsData
        : [];

  // Helper function to get status badge
  const getStatusBadge = (status) => {
    const statusMap = {
      approved: { label: t('admin.reports.approved'), color: 'bg-green-100 text-green-800' },
      pending: { label: t('admin.reports.pending'), color: 'bg-yellow-100 text-yellow-800' },
      rejected: { label: t('admin.reports.rejected'), color: 'bg-red-100 text-red-800' },
      deleted: { label: t('admin.reports.deleted'), color: 'bg-gray-100 text-gray-800' },
      cancelled: { label: t('admin.reports.cancelled'), color: 'bg-orange-100 text-orange-800' },
    };
    const mapped = statusMap[status?.toLowerCase()] || { label: status || '—', color: 'bg-gray-100 text-gray-800' };
    return mapped;
  };

  return (
    <PageFrame width="7xl" title={t('admin.reports.title')} contentClassName="space-y-6">
      <div className="flex flex-wrap gap-2">
        <Link to={localizedTo('/admin')} className="border px-3 py-1.5 rounded-lg text-sm text-gray-600 hover:bg-gray-100">
          {t('admin.users.dashboardLink')}
        </Link>
        <Link to={localizedTo('/admin/events/pending')} className="border px-3 py-1.5 rounded-lg text-sm text-gray-600 hover:bg-gray-100">
          {t('admin.users.pendingLink')}
        </Link>
        <Link to={localizedTo('/admin/users')} className="border px-3 py-1.5 rounded-lg text-sm text-gray-600 hover:bg-gray-100">
          {t('admin.users.title')}
        </Link>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <StatCard
          title={t('admin.reports.avgParticipants')}
          value={avgValue !== null ? Number(avgValue).toFixed(1) : '—'}
          sub={t('admin.reports.avgParticipantsSub')}
        />
        <StatCard
          title={t('admin.reports.monthsWithData')}
          value={monthlyData.length}
          sub={t('admin.reports.monthsWithDataSub')}
        />
        <StatCard
          title={t('admin.reports.activeOrganizers')}
          value={organizerData.length}
          sub={t('admin.reports.activeOrganizersSub')}
        />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="usv-card usv-card-body">
          <h2 className="font-semibold text-gray-700 mb-4">{t('admin.reports.monthlyChart')}</h2>
          {monthlyData.length === 0 ? (
            <p className="text-sm text-gray-400">{t('admin.reports.noData')}</p>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={monthlyData} margin={{ left: -20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip />
                <Bar dataKey="count" fill="#3b82f6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        <div className="usv-card usv-card-body">
          <h2 className="font-semibold text-gray-700 mb-4">{t('admin.reports.organizerChart')}</h2>
          {organizerData.length === 0 ? (
            <p className="text-sm text-gray-400">{t('admin.reports.noData')}</p>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={organizerData} layout="vertical" margin={{ left: 60 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis type="number" tick={{ fontSize: 12 }} />
                <YAxis dataKey="organizer" type="category" tick={{ fontSize: 11 }} width={100} />
                <Tooltip />
                <Bar dataKey="count" fill="#10b981" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      <div className="usv-card overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
          <h2 className="font-semibold text-gray-700 mb-4">{t('admin.reports.allEvents') || 'Raport Complet - Toate Evenimentele'}</h2>
          <div className="flex flex-col sm:flex-row gap-4">
            <input
              type="text"
              placeholder={t('admin.pending.searchPlaceholder')}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="flex-1 border rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="border rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 min-w-40"
            >
              <option value="all">{t('admin.reports.allStatuses')}</option>
              <option value="approved">{t('admin.reports.approved')}</option>
              <option value="pending">{t('admin.reports.pending')}</option>
              <option value="rejected">{t('admin.reports.rejected')}</option>
              <option value="deleted">{t('admin.reports.deleted')}</option>
              <option value="cancelled">{t('admin.reports.cancelled')}</option>
            </select>
          </div>
        </div>

        {eventsLoading ? (
          <div className="px-6 py-8 text-center text-gray-500">
            {t('admin.pending.loading')}
          </div>
        ) : allEvents.length === 0 ? (
          <div className="px-6 py-8 text-center text-gray-400">
            {t('admin.pending.noEvents')}
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            <div className="grid grid-cols-12 gap-4 px-6 py-3 bg-gray-50 text-sm font-semibold text-gray-700 border-b border-gray-200">
              <div className="col-span-3">{t('admin.reports.tableHeaders.title')}</div>
              <div className="col-span-2">{t('admin.reports.tableHeaders.organizer')}</div>
              <div className="col-span-2">{t('admin.reports.tableHeaders.date')}</div>
              <div className="col-span-2">{t('admin.reports.tableHeaders.status')}</div>
              <div className="col-span-3">{t('admin.reports.tableHeaders.registrations')}</div>
            </div>

            {allEvents.map((event) => (
              <div key={event.id} className="grid grid-cols-12 gap-4 px-6 py-4 items-center hover:bg-gray-50 transition">
                <div className="col-span-3">
                  <p className="font-semibold text-gray-800 text-sm">{event.title}</p>
                  <p className="text-xs text-gray-500 mt-1 line-clamp-1">{event.description}</p>
                </div>
                <div className="col-span-2">
                  <p className="text-sm text-gray-700">{event.organizer_name || event.organizer?.full_name || '-'}</p>
                </div>
                <div className="col-span-2">
                  <p className="text-sm text-gray-700">
                    {event.start_date ? new Date(event.start_date).toLocaleDateString(dateLocale) : '-'}
                  </p>
                </div>
                <div className="col-span-2">
                  <span className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${getStatusBadge(event.status).color}`}>
                    {getStatusBadge(event.status).label}
                  </span>
                </div>
                <div className="col-span-3">
                  <p className="text-sm text-gray-700">{event.registration_count ?? 0} {t('admin.reports.registrationsSuffix')}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </PageFrame>
  );
}
