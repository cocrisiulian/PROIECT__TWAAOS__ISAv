import { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { getEvents } from '../../api/events.js';
import EventCard from '../../components/events/EventCard.jsx';
import EventFilters from '../../components/events/EventFilters.jsx';
import Navbar from '../../components/layout/Navbar.jsx';

function Spinner() {
  return (
    <div className="flex justify-center items-center py-20">
      <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
    </div>
  );
}

export default function EventsListPage() {
  const { t } = useTranslation();
  const [searchParams, setSearchParams] = useSearchParams();
  const [viewMode, setViewMode] = useState('grid');

  const page = parseInt(searchParams.get('page') || '1', 10);

  const filters = {
    search: searchParams.get('search') || undefined,
    faculty_id: searchParams.get('faculty_id') || undefined,
    category_id: searchParams.get('category_id') || undefined,
    participation_mode: searchParams.get('participation_mode') || undefined,
    is_free: searchParams.get('is_free') === 'true' ? true : undefined,
    requires_registration: searchParams.get('requires_registration') === 'true' ? true : undefined,
    date_from: searchParams.get('date_from') || undefined,
    date_to: searchParams.get('date_to') || undefined,
    or_filters: searchParams.get('or_filters') || undefined,
    page,
    per_page: 12,
  };

  const { data, isLoading, isError } = useQuery({
    queryKey: ['events', filters],
      queryFn: () => getEvents(filters).then(r => r.data),
    });

    const events = data?.items || [];
  const total = data?.total || 0;
  const totalPages = Math.ceil(total / 12);

  const setPage = (p) => {
    searchParams.set('page', p);
    setSearchParams(searchParams);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{t('public.eventsList.title')}</h1>
            <p className="text-sm text-gray-500 mt-1">{total} {t('public.eventsList.found')}</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-2 rounded-lg ${viewMode === 'grid' ? 'bg-blue-100 text-blue-700' : 'text-gray-400 hover:text-gray-700'}`}
              title={t('public.eventsList.gridView')}
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
              </svg>
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-2 rounded-lg ${viewMode === 'list' ? 'bg-blue-100 text-blue-700' : 'text-gray-400 hover:text-gray-700'}`}
              title={t('public.eventsList.listView')}
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
              </svg>
            </button>
          </div>
        </div>

        <div className="flex gap-6">
          {/* Filters Sidebar */}
          <aside className="w-64 shrink-0 hidden lg:block">
            <EventFilters />
          </aside>

          {/* Events Grid/List */}
          <main className="flex-1 min-w-0">
            {isLoading ? (
              <Spinner />
            ) : isError ? (
              <p className="text-center text-red-500 py-20">{t('public.eventsList.loadError')}</p>
            ) : events.length === 0 ? (
              <div className="text-center py-20 text-gray-500">
                <svg className="w-16 h-16 mx-auto mb-4 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <p className="text-lg font-medium">{t('public.eventsList.noEvents')}</p>
                <p className="text-sm mt-1">{t('public.eventsList.adjustFilters')}</p>
              </div>
            ) : (
              <>
                <div className={viewMode === 'grid'
                  ? 'grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5'
                  : 'flex flex-col gap-4'
                }>
                  {events.map((event) => (
                    <EventCard key={event.id} event={event} listMode={viewMode === 'list'} />
                  ))}
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="flex justify-center items-center gap-2 mt-8">
                    <button
                      onClick={() => setPage(page - 1)}
                      disabled={page <= 1}
                      className="px-3 py-1.5 rounded-lg border text-sm disabled:opacity-40 hover:bg-gray-100"
                    >
                      {t('public.eventsList.previous')}
                    </button>
                    <span className="text-sm text-gray-600">{t('public.eventsList.pageOf', { page, total: totalPages })}</span>
                    <button
                      onClick={() => setPage(page + 1)}
                      disabled={page >= totalPages}
                      className="px-3 py-1.5 rounded-lg border text-sm disabled:opacity-40 hover:bg-gray-100"
                    >
                      {t('public.eventsList.next')}
                    </button>
                  </div>
                )}
              </>
            )}
          </main>
        </div>
      </div>
    </div>
  );
}
