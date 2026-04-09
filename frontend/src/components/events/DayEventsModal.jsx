import { format } from 'date-fns';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

export default function DayEventsModal({ date, events, isOpen, onClose }) {
  const navigate = useNavigate();

  if (!isOpen) return null;

  // Sortează evenimentele după ora de început
  const sortedEvents = [...events].sort((a, b) => {
    const timeA = new Date(a.start_datetime).getTime();
    const timeB = new Date(b.start_datetime).getTime();
    return timeA - timeB;
  });

  const handleEventClick = (eventId) => {
    onClose();
    navigate(`/events/${eventId}`);
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-lg max-w-md w-full max-h-[80vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-gradient-to-r from-blue-600 to-blue-700 text-white p-6 border-b">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-xl font-bold">
                {date?.toLocaleDateString('ro-RO', {
                  weekday: 'long',
                  day: 'numeric',
                  month: 'long',
                  year: 'numeric',
                })}
              </h2>
              <p className="text-blue-100 text-sm mt-1">
                {sortedEvents.length} {sortedEvents.length === 1 ? 'eveniment' : 'evenimente'}
              </p>
            </div>
            <button
              onClick={onClose}
              className="text-white hover:bg-blue-800 rounded-full p-2 transition"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Events List */}
        <div className="p-6">
          {sortedEvents.length === 0 ? (
            <p className="text-gray-500 text-center py-8">Nu sunt evenimente în această zi</p>
          ) : (
            <div className="space-y-3">
              {sortedEvents.map((event, index) => {
                const startTime = format(new Date(event.start_datetime), 'HH:mm');
                const endTime = format(new Date(event.end_datetime), 'HH:mm');

                return (
                  <div
                    key={event.id}
                    onClick={() => handleEventClick(event.id)}
                    className="p-4 border border-gray-200 rounded-lg hover:border-blue-500 hover:shadow-md transition cursor-pointer bg-gray-50 hover:bg-blue-50"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-baseline gap-2">
                          <span className="inline-block bg-blue-100 text-blue-800 text-xs font-semibold px-2 py-1 rounded">
                            #{index + 1}
                          </span>
                          <span className="text-sm font-semibold text-gray-700">
                            {startTime} - {endTime}
                          </span>
                        </div>
                        <h3 className="font-bold text-gray-900 mt-2 line-clamp-2">{event.title}</h3>
                        {event.location && (
                          <p className="text-sm text-gray-600 mt-1">📍 {event.location}</p>
                        )}
                      </div>
                      {event.category && (
                        <div
                          className="w-3 h-3 rounded-full ml-2 mt-1 flex-shrink-0"
                          style={{ backgroundColor: event.category.color_hex || '#3B82F6' }}
                          title={event.category.name}
                        />
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
