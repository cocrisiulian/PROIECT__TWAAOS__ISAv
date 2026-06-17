import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { useTranslation } from 'react-i18next';
import { getMyEvents, submitForApproval, cancelEvent, deleteEvent } from '../../api/organizer.js';
import PageFrame from '../../components/layout/PageFrame.jsx';
import EventStatusBadge from '../../components/events/EventStatusBadge.jsx';
import { getPathWithLanguage, normalizeLanguage } from '../../i18n/config.js';

const TABS = ['all', 'draft', 'pending_approval', 'published', 'cancelled', 'rejected'];

export default function OrganizerDashboard() {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [tab, setTab] = useState('all');
  const [page, setPage] = useState(1);

  const localizedTo = (path) => getPathWithLanguage(path, normalizeLanguage(i18n.language));

  const params = { page, per_page: 20, ...(tab !== 'all' ? { status: tab } : {}) };
  const { data, isLoading } = useQuery({
    queryKey: ['my-events', params],
    queryFn: () => getMyEvents(params).then((r) => r.data),
  });

  const events = data?.items || [];
  const total = data?.total || 0;

  const submitMutation = useMutation({
    mutationKey: ['my-events'],
    mutationFn: (id) => submitForApproval(id),
    onSuccess: () => { toast.success(t('organizer.dashboard.messages.submitted')); },
    onError: (err) => toast.error(err.response?.data?.detail || t('organizer.dashboard.messages.actionFailed')),
  });
  const cancelMutation = useMutation({
    mutationKey: ['my-events'],
    mutationFn: (id) => cancelEvent(id),
    onSuccess: () => { toast.success(t('organizer.dashboard.messages.cancelled')); },
    onError: (err) => toast.error(err.response?.data?.detail || t('organizer.dashboard.messages.actionFailed')),
  });
  const deleteMutation = useMutation({
    mutationKey: ['my-events'],
    mutationFn: (id) => deleteEvent(id),
    onSuccess: () => { toast.success(t('organizer.dashboard.messages.deleted')); },
    onError: (err) => toast.error(err.response?.data?.detail || t('organizer.dashboard.messages.actionFailed')),
  });

  const tabLabel = (tabKey) => {
    const labels = {
      'all': t('organizer.dashboard.tabs.all'),
      'draft': t('organizer.dashboard.tabs.draft'),
      'pending_approval': t('organizer.dashboard.tabs.pending_approval'),
      'published': t('organizer.dashboard.tabs.published'),
      'cancelled': t('organizer.dashboard.tabs.cancelled'),
      'rejected': t('organizer.dashboard.tabs.rejected'),
    };
    return labels[tabKey] || tabKey;
  };

  const locale = normalizeLanguage(i18n.language) === 'ro' ? 'ro-RO' : 'en-US';
  const formatEventDate = (value) => new Intl.DateTimeFormat(locale, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(new Date(value));

  return (
    <PageFrame
      title={t('organizer.dashboard.title')}
      subtitle={t('organizer.dashboard.subtitle')}
      actions={(
        <Link
          to={localizedTo('/organizer/events/new')}
          className="usv-button-primary"
        >
          {t('organizer.dashboard.createEvent')}
        </Link>
      )}
      contentClassName="space-y-6"
    >
      <div className="flex w-fit gap-1 rounded-2xl border border-slate-200 bg-white p-1 shadow-sm">
        {TABS.map((tabKey) => (
          <button
            key={tabKey}
            onClick={() => { setTab(tabKey); setPage(1); }}
            className={`rounded-xl px-3 py-2 text-sm font-semibold transition ${tab === tabKey ? 'bg-[#1a3a5c] text-white shadow-sm' : 'text-slate-500 hover:text-slate-800'}`}
          >
            {tabLabel(tabKey)}
          </button>
        ))}
      </div>

        {isLoading ? (
          <div className="flex justify-center py-20"><div className="h-8 w-8 rounded-full border-4 border-blue-500 border-t-transparent animate-spin" /></div>
        ) : events.length === 0 ? (
          <div className="text-center py-20 text-gray-500">
            <p className="text-lg">{t('organizer.dashboard.noEvents')}</p>
            <Link to={localizedTo('/organizer/events/new')} className="mt-3 inline-block text-blue-700 hover:underline text-sm">{t('organizer.dashboard.createFirst')}</Link>
          </div>
        ) : (
          <>
            <div className="usv-card overflow-hidden">
              <table className="w-full text-sm">
                <thead className="border-b border-slate-200 bg-slate-50">
                  <tr>
                    <th className="px-4 py-3 text-left font-medium text-slate-600">{t('organizer.dashboard.tableHeaders.title')}</th>
                    <th className="hidden px-4 py-3 text-left font-medium text-slate-600 sm:table-cell">{t('organizer.dashboard.tableHeaders.date')}</th>
                    <th className="px-4 py-3 text-left font-medium text-slate-600">{t('organizer.dashboard.tableHeaders.status')}</th>
                    <th className="px-4 py-3 text-right font-medium text-slate-600">{t('organizer.dashboard.tableHeaders.actions')}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {events.map((event) => (
                    <tr key={event.id} className="hover:bg-slate-50">
                      <td className="max-w-xs px-4 py-3 font-medium text-slate-800 truncate">{event.title}</td>
                      <td className="hidden px-4 py-3 text-slate-500 sm:table-cell">
                        {event.start_datetime ? formatEventDate(event.start_datetime) : '—'}
                      </td>
                      <td className="px-4 py-3">
                        <EventStatusBadge status={event.status} />
                        {event.status === 'rejected' && (
                          <p className="mt-1 max-w-[220px] truncate text-[11px] text-red-600" title={event.rejection_reason || t('organizer.dashboard.reasonFallback')}>
                            {t('organizer.dashboard.reasonLabel')}: {event.rejection_reason || t('organizer.dashboard.reasonFallback')}
                          </p>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex flex-wrap justify-end gap-1">
                          {(event.status === 'draft' || event.status === 'rejected' || event.status === 'cancelled') && (
                            <>
                              <button onClick={() => navigate(localizedTo(`/organizer/events/${event.id}/edit`))} className="px-2 py-1 text-xs text-blue-700 hover:underline">{t('organizer.dashboard.actions.edit')}</button>
                              <button onClick={() => submitMutation.mutate(event.id)} className="px-2 py-1 text-xs text-green-700 hover:underline">
                                {event.status === 'draft' ? t('organizer.dashboard.actions.submit') : t('organizer.dashboard.actions.resubmit')}
                              </button>
                            </>
                          )}
                          {event.status === 'draft' && (
                            <button onClick={() => { if (confirm(t('organizer.dashboard.confirmDelete'))) deleteMutation.mutate(event.id); }} className="px-2 py-1 text-xs text-red-600 hover:underline">{t('organizer.dashboard.actions.delete')}</button>
                          )}
                          {event.status === 'published' && (
                            <button onClick={() => { if (confirm(t('organizer.dashboard.confirmCancel'))) cancelMutation.mutate(event.id); }} className="px-2 py-1 text-xs text-red-600 hover:underline">{t('organizer.dashboard.actions.cancel')}</button>
                          )}
                          <button onClick={() => navigate(localizedTo(`/organizer/events/${event.id}/participants`))} className="px-2 py-1 text-xs text-slate-600 hover:underline">{t('organizer.dashboard.actions.participants')}</button>
                          <button onClick={() => navigate(localizedTo(`/organizer/events/${event.id}/materials`))} className="px-2 py-1 text-xs text-slate-600 hover:underline">{t('organizer.dashboard.actions.materials')}</button>
                          <button onClick={() => navigate(localizedTo(`/organizer/events/${event.id}/stats`))} className="px-2 py-1 text-xs text-slate-600 hover:underline">{t('organizer.dashboard.actions.stats')}</button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {total > 20 && (
              <div className="flex justify-center gap-2 mt-6">
                <button onClick={() => setPage(p => p - 1)} disabled={page <= 1} className="usv-button-secondary px-3 py-1.5 text-sm">{t('organizer.dashboard.pagination.previous')}</button>
                <button onClick={() => setPage(p => p + 1)} disabled={events.length < 20} className="usv-button-secondary px-3 py-1.5 text-sm">{t('organizer.dashboard.pagination.next')}</button>
              </div>
            )}
          </>
        )}
    </PageFrame>
  );
}
