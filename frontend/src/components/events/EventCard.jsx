
import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import { useTranslation } from 'react-i18next';
import { getCoverImageUrl } from '../../utils/coverImage.js';
import { getPathWithLanguage, normalizeLanguage } from '../../i18n/config.js';
const MODE_BADGES = {
  physical: { label: 'In Person', classes: 'bg-purple-100 text-purple-700' },
  online: { label: 'Online', classes: 'bg-blue-100 text-blue-700' },
  hybrid: { label: 'Hybrid', classes: 'bg-teal-100 text-teal-700' },
};

function EventCard({ event, listMode = false }) {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const localizedTo = (path) => getPathWithLanguage(path, normalizeLanguage(i18n.language));

  const modeBadge = MODE_BADGES[event.participation_mode] || {
    label: event.participation_mode,
    classes: 'bg-gray-100 text-gray-600',
  };

  const formattedDate = event.start_datetime
    ? format(new Date(event.start_datetime), 'EEE, MMM d, yyyy · h:mm a')
    : '';

  const coverUrl = getCoverImageUrl(event.cover_image_url, listMode ? 'list' : 'card');

  const coverSection = (
    <div className={`relative overflow-hidden ${listMode ? 'w-full sm:w-80 h-48 sm:h-auto sm:min-h-full' : 'h-44'}`}>
      {coverUrl ? (
        <>
          <img
            src={coverUrl}
            alt=""
            aria-hidden="true"
            className="absolute inset-0 w-full h-full object-cover blur-sm scale-110 opacity-50"
          />
          <img
            src={coverUrl}
            alt={event.title}
            className="relative w-full h-full object-contain group-hover:scale-[1.02] transition duration-300"
          />
        </>
      ) : (
        <div className="w-full h-full flex items-center justify-center opacity-30 bg-gradient-to-br from-blue-300 to-indigo-400">
          <svg className="w-16 h-16 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
        </div>
      )}
    </div>
  );

  return (
    <div
      onClick={() => navigate(localizedTo(`/events/${event.id}`))}
      className={`bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden cursor-pointer hover:shadow-md hover:border-blue-200 transition group ${listMode ? 'sm:flex' : ''}`}
    >
      {coverSection}

      {/* Content */}
      <div className={`p-4 ${listMode ? 'sm:flex-1' : ''}`}>
        <div className="flex items-start justify-between gap-2 mb-2">
          <h3 className="text-base font-semibold text-gray-800 line-clamp-2 flex-1">
            {event.title}
          </h3>
          {event.is_free && (
            <span className="text-xs font-bold text-green-600 bg-green-50 px-2 py-0.5 rounded-full whitespace-nowrap">
              {t('events.eventCard.free') || 'Free'}
            </span>
          )}
        </div>

        <p className="text-xs text-gray-500 mb-2">{formattedDate}</p>

        {event.location && (
          <p className="text-xs text-gray-500 flex items-center gap-1 mb-2 truncate">
            <svg className="w-3 h-3 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            {event.location}
          </p>
        )}

        <div className="flex items-center gap-2 flex-wrap mt-3">
          <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${modeBadge.classes}`}>
            {modeBadge.label}
          </span>
          {event.category && (
            <span
              className="text-xs px-2 py-0.5 rounded-full font-medium"
              style={{
                backgroundColor: event.category.color_hex
                  ? `${event.category.color_hex}22`
                  : '#f3f4f6',
                color: event.category.color_hex || '#6b7280',
              }}
            >
              {event.category.name}
            </span>
          )}
        </div>

        {event.organizer_name && (
          <p className="mt-2 text-xs text-gray-400">by {event.organizer_name}</p>
        )}
      </div>
    </div>
  );
}

export default EventCard;
