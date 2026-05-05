import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { useTranslation } from 'react-i18next';
import { getMyEvents, submitForApproval, cancelEvent, deleteEvent } from '../../api/organizer.js';
import Navbar from '../../components/layout/Navbar.jsx';
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
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-gray-900">{t('organizer.dashboard.title')}</h1>
          <Link
            to={localizedTo('/organizer/events/new')}
            className="bg-blue-600 text-white text-sm font-medium px-4 py-2 rounded-lg hover:bg-blue-700 transition"
          >
            {t('organizer.dashboard.createEvent')}
          </Link>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 bg-gray-100 p-1 rounded-lg mb-6 w-fit">
          {TABS.map((tabKey) => (
            <button
              key={tabKey}
              onClick={() => { setTab(tabKey); setPage(1); }}
              className={`px-3 py-1.5 rounded-md text-sm font-medium transition ${tab === tabKey ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
            >
              {tabLabel(tabKey)}
            </button>
          ))}
        </div>

        {isLoading ? (
          <div className="flex justify-center py-20"><div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" /></div>
        ) : events.length === 0 ? (
          <div className="text-center py-20 text-gray-500">
            <p className="text-lg">{t('organizer.dashboard.noEvents')}</p>
            <Link to={localizedTo('/organizer/events/new')} className="mt-3 inline-block text-blue-600 hover:underline text-sm">{t('organizer.dashboard.createFirst')}</Link>
          </div>
        ) : (
          <>
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b border-gray-100">
                  <tr>
                    <th className="text-left px-4 py-3 font-medium text-gray-600">{t('organizer.dashboard.tableHeaders.title')}</th>
                    <th className="text-left px-4 py-3 font-medium text-gray-600 hidden sm:table-cell">{t('organizer.dashboard.tableHeaders.date')}</th>
                    <th className="text-left px-4 py-3 font-medium text-gray-600">{t('organizer.dashboard.tableHeaders.status')}</th>
                    <th className="text-right px-4 py-3 font-medium text-gray-600">{t('organizer.dashboard.tableHeaders.actions')}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {events.map((event) => (
                    <tr key={event.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 font-medium text-gray-800 max-w-xs truncate">{event.title}</td>
                      <td className="px-4 py-3 text-gray-500 hidden sm:table-cell">
                        {event.start_datetime ? formatEventDate(event.start_datetime) : '—'}
                      </td>
                      <td className="px-4 py-3">
                        <EventStatusBadge status={event.status} />
                        {event.status === 'rejected' && (
                          <p className="mt-1 text-[11px] text-red-600 max-w-[220px] truncate" title={event.rejection_reason || t('organizer.dashboard.reasonFallback')}>
                            {t('organizer.dashboard.reasonLabel')}: {event.rejection_reason || t('organizer.dashboard.reasonFallback')}
                          </p>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex justify-end gap-1 flex-wrap">
                          {(event.status === 'draft' || event.status === 'rejected' || event.status === 'cancelled') && (
                            <>
                              <button onClick={() => navigate(localizedTo(`/organizer/events/${event.id}/edit`))} className="text-xs text-blue-600 hover:underline px-2 py-1">{t('organizer.dashboard.actions.edit')}</button>
                              <button onClick={() => submitMutation.mutate(event.id)} className="text-xs text-green-600 hover:underline px-2 py-1">
                                {event.status === 'draft' ? t('organizer.dashboard.actions.submit') : t('organizer.dashboard.actions.resubmit')}
                              </button>
                            </>
                          )}
                          {event.status === 'draft' && (
                            <button onClick={() => { if (confirm(t('organizer.dashboard.confirmDelete'))) deleteMutation.mutate(event.id); }} className="text-xs text-red-500 hover:underline px-2 py-1">{t('organizer.dashboard.actions.delete')}</button>
                          )}
                          {event.status === 'published' && (
                            <button onClick={() => { if (confirm(t('organizer.dashboard.confirmCancel'))) cancelMutation.mutate(event.id); }} className="text-xs text-red-500 hover:underline px-2 py-1">{t('organizer.dashboard.actions.cancel')}</button>
                          )}
                          <button onClick={() => navigate(localizedTo(`/organizer/events/${event.id}/participants`))} className="text-xs text-gray-600 hover:underline px-2 py-1">{t('organizer.dashboard.actions.participants')}</button>
                          <button onClick={() => navigate(localizedTo(`/organizer/events/${event.id}/materials`))} className="text-xs text-gray-600 hover:underline px-2 py-1">{t('organizer.dashboard.actions.materials')}</button>
                          <button onClick={() => navigate(localizedTo(`/organizer/events/${event.id}/stats`))} className="text-xs text-gray-600 hover:underline px-2 py-1">{t('organizer.dashboard.actions.stats')}</button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {total > 20 && (
              <div className="flex justify-center gap-2 mt-6">
                <button onClick={() => setPage(p => p - 1)} disabled={page <= 1} className="px-3 py-1.5 border rounded-lg text-sm disabled:opacity-40 hover:bg-gray-100">{t('organizer.dashboard.pagination.previous')}</button>
                <button onClick={() => setPage(p => p + 1)} disabled={events.length < 20} className="px-3 py-1.5 border rounded-lg text-sm disabled:opacity-40 hover:bg-gray-100">{t('organizer.dashboard.pagination.next')}</button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
