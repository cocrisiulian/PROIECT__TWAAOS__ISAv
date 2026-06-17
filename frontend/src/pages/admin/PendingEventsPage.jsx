import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getAllEvents, approveEvent, rejectEvent } from '../../api/admin';
import PageFrame from '../../components/layout/PageFrame.jsx';
import { DEFAULT_LANGUAGE, getPathWithLanguage, normalizeLanguage } from '../../i18n/config.js';

export default function PendingEventsPage() {
  const queryClient = useQueryClient();
  const { i18n, t } = useTranslation();
  const activeLanguage = normalizeLanguage(i18n.resolvedLanguage) || DEFAULT_LANGUAGE;
  const localizedTo = (path) => getPathWithLanguage(path, activeLanguage);
  const dateLocale = activeLanguage === 'ro' ? 'ro-RO' : 'en-US';
  const [rejectId, setRejectId] = useState(null);
  const [reason, setReason] = useState('');
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  const statusOptions = [
    { value: 'all', label: t('admin.pending.allStatuses') || 'Toate statusurile' },
    { value: 'draft', label: t('events.statusBadge.draft') },
    { value: 'pending_approval', label: t('events.statusBadge.pending_approval') },
    { value: 'published', label: t('events.statusBadge.published') },
    { value: 'rejected', label: t('events.statusBadge.rejected') },
    { value: 'cancelled', label: t('events.statusBadge.cancelled') },
  ];

  const { data, isLoading } = useQuery({
    queryKey: ['admin-events', search, statusFilter],
    queryFn: () => getAllEvents({
      search,
      status: statusFilter,
      page: 1,
      per_page: 500,
    }).then((r) => r.data),
  });

  const approveMutation = useMutation({
    mutationKey: ['admin-events'],
    mutationFn: approveEvent,
    onSuccess: () => {},
  });

  const rejectMutation = useMutation({
    mutationKey: ['admin-events'],
    mutationFn: ({ id, reason }) => rejectEvent(id, reason),
    onSuccess: () => {
      setRejectId(null);
      setReason('');
    },
  });

  const events = Array.isArray(data?.items)
    ? data.items
    : Array.isArray(data?.events)
      ? data.events
      : Array.isArray(data)
        ? data
        : [];

  const visibleEvents = events
    .slice()
    .sort((a, b) => new Date(a.start_datetime).getTime() - new Date(b.start_datetime).getTime());

  return (
    <PageFrame width="6xl" title={t('admin.pending.title')} contentClassName="space-y-6">
      <div className="flex flex-wrap gap-2">
        <Link to={localizedTo('/admin')} className="border px-3 py-1.5 rounded-lg text-sm text-gray-600 hover:bg-gray-100">
          {t('admin.users.dashboardLink')}
        </Link>
        <Link to={localizedTo('/admin/users')} className="border px-3 py-1.5 rounded-lg text-sm text-gray-600 hover:bg-gray-100">
          {t('admin.users.title')}
        </Link>
        <Link to={localizedTo('/admin/reports')} className="border px-3 py-1.5 rounded-lg text-sm text-gray-600 hover:bg-gray-100">
          {t('admin.users.reportsLink')}
        </Link>
      </div>

      <div className="flex flex-col sm:flex-row gap-4">
        <input
          type="text"
          placeholder={t('admin.pending.searchPlaceholder') || 'Cauta event...'}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="flex-1 border rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="border rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 min-w-40"
        >
          {statusOptions.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>

      {isLoading ? (
        <p className="text-gray-500">{t('admin.pending.loading')}</p>
      ) : visibleEvents.length === 0 ? (
        <div className="usv-card usv-card-body text-center text-gray-400">
          {t('admin.pending.noEvents')}
        </div>
      ) : (
        <div className="usv-card overflow-hidden">
          <div className="grid grid-cols-12 gap-4 bg-gray-50 px-6 py-3 border-b border-gray-200 text-sm font-semibold text-gray-700">
            <div className="col-span-3">{t('admin.pending.tableHeaders.title')}</div>
            <div className="col-span-2">{t('admin.pending.tableHeaders.organizer')}</div>
            <div className="col-span-2">{t('admin.pending.tableHeaders.timestamp')}</div>
            <div className="col-span-1">{t('admin.pending.tableHeaders.status')}</div>
            <div className="col-span-2">{t('admin.pending.tableHeaders.location')}</div>
            <div className="col-span-2">{t('admin.pending.tableHeaders.actions')}</div>
          </div>

          <div className="divide-y divide-gray-200">
            {visibleEvents.map((event) => (
              <div key={event.id}>
                <div className="grid grid-cols-12 gap-4 px-6 py-4 items-center hover:bg-gray-50 transition">
                  <div className="col-span-3">
                    <p className="font-semibold text-gray-800 text-sm">{event.title}</p>
                    <p className="text-xs text-gray-500 mt-1 line-clamp-1">{event.description}</p>
                  </div>
                  <div className="col-span-2">
                    <p className="text-sm text-gray-700">{event.organizer_name || event.organizer?.full_name || '-'}</p>
                  </div>
                  <div className="col-span-2">
                    <p className="text-sm text-gray-700">
                      {event.start_datetime ? new Date(event.start_datetime).toLocaleString(dateLocale, {
                        year: 'numeric',
                        month: '2-digit',
                        day: '2-digit',
                        hour: '2-digit',
                        minute: '2-digit',
                      }) : '-'}
                    </p>
                  </div>
                  <div className="col-span-1">
                    <span className="inline-flex rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-700">
                      {event.status ? t(`events.statusBadge.${event.status}`, { defaultValue: event.status }) : '-'}
                    </span>
                  </div>
                  <div className="col-span-2">
                    <p className="text-sm text-gray-700">{event.location || '-'}</p>
                  </div>
                  <div className="col-span-2 flex gap-2 justify-end">
                    {event.status === 'pending_approval' ? (
                      <>
                        <button
                          onClick={() => approveMutation.mutate(event.id)}
                          disabled={approveMutation.isPending}
                          className="bg-green-600 text-white px-3 py-1.5 rounded-lg text-sm hover:bg-green-700 disabled:opacity-50 transition"
                        >
                          {t('admin.pending.approve')}
                        </button>
                        <button
                          onClick={() => setRejectId(event.id)}
                          className="bg-red-50 text-red-600 border border-red-200 px-3 py-1.5 rounded-lg text-sm hover:bg-red-100 transition"
                        >
                          {t('admin.pending.reject')}
                        </button>
                      </>
                    ) : (
                      <span className="text-xs text-gray-400">{t('admin.pending.readOnly')}</span>
                    )}
                  </div>
                </div>

                {rejectId === event.id && event.status === 'pending_approval' && (
                  <div className="grid grid-cols-12 gap-4 px-6 py-4 bg-red-50 border-b border-red-200">
                    <div className="col-span-12">
                      <p className="text-sm font-semibold text-gray-700 mb-2">{t('admin.pending.rejectReason')}</p>
                      <textarea
                        className="border rounded-lg px-3 py-2 text-sm w-full focus:outline-none focus:ring-2 focus:ring-red-500"
                        rows={2}
                        placeholder={t('admin.pending.rejectReasonPlaceholder')}
                        value={reason}
                        onChange={(e) => setReason(e.target.value)}
                      />
                      <div className="flex gap-2 mt-3">
                        <button
                          onClick={() => rejectMutation.mutate({ id: event.id, reason })}
                          disabled={rejectMutation.isPending}
                          className="bg-red-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-red-700 disabled:opacity-50 transition"
                        >
                          {t('admin.pending.confirmReject')}
                        </button>
                        <button
                          onClick={() => {
                            setRejectId(null);
                            setReason('');
                          }}
                          className="border border-gray-300 px-4 py-2 rounded-lg text-sm text-gray-600 hover:bg-gray-100 transition"
                        >
                          {t('admin.users.cancel')}
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </PageFrame>
  );
}
