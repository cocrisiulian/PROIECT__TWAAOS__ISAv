import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { format } from 'date-fns';
import toast from 'react-hot-toast';
import { getEvent, registerForEvent, unregisterFromEvent } from '../../api/events.js';
import { useAuthStore } from '../../store/authStore.js';
import Navbar from '../../components/layout/Navbar.jsx';
import FeedbackForm from '../../components/events/FeedbackForm.jsx';
import { getCoverImageUrl } from '../../utils/coverImage.js';
import { toPublicAssetUrl } from '../../utils/assetUrl.js';
import { getPathWithLanguage, normalizeLanguage } from '../../i18n/config.js';

const MODE_LABELS = { physical: 'In Person', online: 'Online', hybrid: 'Hybrid' };

function QRModal({ eventId, onClose, t }) {
  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl p-6 max-w-xs w-full text-center" onClick={e => e.stopPropagation()}>
        <h3 className="font-semibold text-lg mb-4">{t('public.eventDetail.qrCode')}</h3>
        <img src={`/api/v1/events/${eventId}/qr.png`} alt="QR Code" className="mx-auto w-48 h-48" />
        <p className="text-xs text-gray-500 mt-3">Scan to open this event page</p>
        <button onClick={onClose} className="mt-4 text-sm text-blue-600 hover:underline">Close</button>
      </div>
    </div>
  );
}

export default function EventDetailPage() {
  const { t, i18n } = useTranslation();
  const { id } = useParams();
  const { token, role } = useAuthStore();
  const [showQR, setShowQR] = useState(false);
  const queryClient = useQueryClient();

  const localizedTo = (path) => getPathWithLanguage(path, normalizeLanguage(i18n.language));

  const { data: event, isLoading, isError } = useQuery({
    queryKey: ['event', id],
    queryFn: () => getEvent(id).then((r) => r.data),
  });

  const registerMutation = useMutation({
    mutationKey: ['event', id],
    mutationFn: () => registerForEvent(id),
    onSuccess: (res) => {
      toast.success(res?.data?.detail || 'Registration updated');
    },
    onError: (err) => toast.error(err.response?.data?.detail || 'Failed to register'),
  });
  const unregisterMutation = useMutation({
    mutationKey: ['event', id],
    mutationFn: () => unregisterFromEvent(id),
    onSuccess: () => { toast.success('Unregistered'); },
    onError: (err) => toast.error(err.response?.data?.detail || 'Failed to unregister'),
  });

  if (isLoading) return (
    <div className="min-h-screen bg-gray-50"><Navbar />
      <div className="flex justify-center items-center py-32">
        <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
      </div>
    </div>
  );
  if (isError || !event) return (
    <div className="min-h-screen bg-gray-50"><Navbar />
      <p className="text-center text-red-500 py-20">Event not found.</p>
    </div>
  );

  const isPast = new Date(event.end_datetime) < new Date();
  const canFeedback = role === 'student' && isPast;
  const backgroundCover = getCoverImageUrl(event.cover_image_url, 'background');

  // Google Calendar URL
  const gcalUrl = (() => {
    const fmt = (d) => format(new Date(d), "yyyyMMdd'T'HHmmss");
    const p = new URLSearchParams({
      action: 'TEMPLATE',
      text: event.title,
      dates: `${fmt(event.start_datetime)}/${fmt(event.end_datetime)}`,
      details: event.description || '',
      location: event.location || '',
    });
    return `https://calendar.google.com/calendar/render?${p.toString()}`;
  })();

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      {showQR && <QRModal eventId={id} onClose={() => setShowQR(false)} t={t} />}

      {/* Cover */}
      <div className="h-56 sm:h-72 bg-gradient-to-br from-blue-300 to-indigo-400 relative overflow-hidden">
        {backgroundCover && (
          <>
            <img
              src={backgroundCover}
              alt=""
              aria-hidden="true"
              className="absolute inset-0 w-full h-full object-cover blur-sm scale-105 opacity-50"
            />
            <img
              src={backgroundCover}
              alt={event.title}
              className="absolute inset-0 w-full h-full object-contain"
            />
          </>
        )}
        <div className="absolute inset-0 bg-black/40" />
        <div className="absolute bottom-0 left-0 right-0 p-6 max-w-5xl mx-auto">
          <h1 className="text-2xl sm:text-3xl font-bold text-white">{event.title}</h1>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left - Description + Materials */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
              <h2 className="text-lg font-semibold mb-3">{t('public.eventDetail.aboutEvent')}</h2>
              <p className="text-gray-700 whitespace-pre-wrap leading-relaxed">{event.description}</p>
            </div>

            {event.materials && event.materials.length > 0 && (
              <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
                <h2 className="text-lg font-semibold mb-3">{t('public.eventDetail.materials')}</h2>
                <ul className="space-y-2">
                  {event.materials.map((m) => (
                    <li key={m.id}>
                      <a
                        href={toPublicAssetUrl(m.file_url)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 text-blue-600 hover:underline text-sm"
                      >
                        <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                        </svg>
                        {m.original_filename}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {canFeedback && (
              <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
                <h2 className="text-lg font-semibold mb-3">{t('public.eventDetail.feedback')}</h2>
                <FeedbackForm eventId={id} />
              </div>
            )}
          </div>

          {/* Right - Info Card */}
          <div className="space-y-4">
            <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100 space-y-3">
              <div>
                <p className="text-xs text-gray-500 uppercase tracking-wide font-medium">{t('public.eventDetail.date')}</p>
                <p className="text-sm font-medium mt-0.5">
                  {format(new Date(event.start_datetime), 'EEE, MMM d, yyyy')}
                </p>
                <p className="text-sm text-gray-600">
                  {format(new Date(event.start_datetime), 'h:mm a')} – {format(new Date(event.end_datetime), 'h:mm a')}
                </p>
              </div>
              {event.location && (
                <div>
                  <p className="text-xs text-gray-500 uppercase tracking-wide font-medium">{t('public.eventDetail.location')}</p>
                  <p className="text-sm mt-0.5">{event.location}</p>
                </div>
              )}
              {event.online_link && (
                <div>
                  <p className="text-xs text-gray-500 uppercase tracking-wide font-medium">Online Link</p>
                  <a href={event.online_link} target="_blank" rel="noopener noreferrer" className="text-sm text-blue-600 hover:underline">Join online</a>
                </div>
              )}
              <div>
                <p className="text-xs text-gray-500 uppercase tracking-wide font-medium">{t('public.eventDetail.time')}</p>
                <p className="text-sm mt-0.5">{MODE_LABELS[event.participation_mode] || event.participation_mode}</p>
              </div>
              {event.organizer_name && (
                <div>
                  <p className="text-xs text-gray-500 uppercase tracking-wide font-medium">{t('public.eventDetail.organizer')}</p>
                  <p className="text-sm mt-0.5">{event.organizer_name}</p>
                </div>
              )}
              {event.faculty_name && (
                <div>
                  <p className="text-xs text-gray-500 uppercase tracking-wide font-medium">Faculty</p>
                  <p className="text-sm mt-0.5">{event.faculty_name}</p>
                </div>
              )}
              {event.category && (
                <div>
                  <p className="text-xs text-gray-500 uppercase tracking-wide font-medium">Category</p>
                  <span className="inline-block mt-0.5 text-xs px-2 py-0.5 rounded-full font-medium"
                    style={{ backgroundColor: `${event.category.color_hex}22`, color: event.category.color_hex }}>
                    {event.category.name}
                  </span>
                </div>
              )}
              {event.is_free !== undefined && (
                <div>
                  <p className="text-xs text-gray-500 uppercase tracking-wide font-medium">Entry</p>
                  <p className="text-sm mt-0.5">{event.is_free ? '🟢 Free' : '🔵 Paid'}</p>
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100 space-y-2">
              <a
                href={`/api/v1/events/${id}/export.ics`}
                className="flex items-center gap-2 text-sm text-gray-700 hover:text-blue-600 hover:bg-blue-50 px-3 py-2 rounded-lg transition w-full"
              >
                📅 Download .ics
              </a>
              <a
                href={gcalUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 text-sm text-gray-700 hover:text-blue-600 hover:bg-blue-50 px-3 py-2 rounded-lg transition w-full"
              >
                📆 {t('public.eventDetail.addToCalendar')}
              </a>
              <button
                onClick={() => setShowQR(true)}
                className="flex items-center gap-2 text-sm text-gray-700 hover:text-blue-600 hover:bg-blue-50 px-3 py-2 rounded-lg transition w-full"
              >
                📱 {t('public.eventDetail.qrCode')}
              </button>
              {event.registration_link && (
                <a
                  href={event.registration_link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block text-center bg-blue-600 text-white text-sm font-medium py-2 px-4 rounded-lg hover:bg-blue-700 transition"
                >
                  {t('public.eventDetail.register')}
                </a>
              )}
              {role === 'student' && event.requires_registration && !event.registration_link && !isPast && (
                event.is_registered ? (
                  <button
                    onClick={() => unregisterMutation.mutate()}
                    disabled={unregisterMutation.isPending}
                    className="w-full text-sm text-red-600 border border-red-200 hover:bg-red-50 py-2 px-4 rounded-lg transition"
                  >
                    {t('public.eventDetail.unregister')}
                  </button>
                ) : event.is_waitlisted ? (
                  <button
                    onClick={() => unregisterMutation.mutate()}
                    disabled={unregisterMutation.isPending}
                    className="w-full text-sm text-amber-700 border border-amber-200 hover:bg-amber-50 py-2 px-4 rounded-lg transition"
                  >
                    Leave waitlist
                  </button>
                ) : (
                  <button
                    onClick={() => registerMutation.mutate()}
                    disabled={registerMutation.isPending}
                    className="w-full text-sm bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition"
                  >
                    {t('public.eventDetail.register')}
                  </button>
                )
              )}
              {role === 'student' && event.is_waitlisted && (
                <p className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
                  Locuri epuizate: ești înscris în lista de așteptare.
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
