import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import listPlugin from '@fullcalendar/list';
import interactionPlugin from '@fullcalendar/interaction';
import { getEvents } from '../../api/events.js';
import DayEventsModal from '../../components/events/DayEventsModal.jsx';
import PageFrame from '../../components/layout/PageFrame.jsx';
import { getPathWithLanguage, normalizeLanguage } from '../../i18n/config.js';
import './CalendarPage.css';

export default function CalendarPage() {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const [selectedDate, setSelectedDate] = useState(null);

  const localizedTo = (path) => getPathWithLanguage(path, normalizeLanguage(i18n.language));
  const [selectedDateKey, setSelectedDateKey] = useState(null);
  const [showDayModal, setShowDayModal] = useState(false);

  const { data } = useQuery({
    queryKey: ['events-calendar'],
    queryFn: () => getEvents({ per_page: 100, page: 1 }).then((r) => r.data),
  });

  const toLocalDateKey = (value) => {
    const date = value instanceof Date ? value : new Date(value);
    if (Number.isNaN(date.getTime())) return null;

    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const toStartOfDay = (value) => {
    const date = value instanceof Date ? new Date(value) : new Date(value);
    if (Number.isNaN(date.getTime())) return null;
    date.setHours(0, 0, 0, 0);
    return date;
  };

  // Organizează evenimentele pe zile pentru modal
  const eventsByDate = useMemo(() => {
    const grouped = {};

    const getEventDateKeys = (startValue, endValue) => {
      const startDay = toStartOfDay(startValue);
      if (!startDay) return [];

      const rawEndDay = toStartOfDay(endValue);
      const endDay = rawEndDay && rawEndDay >= startDay ? rawEndDay : startDay;

      const keys = [];
      const cursor = new Date(startDay);
      while (cursor <= endDay) {
        const key = toLocalDateKey(cursor);
        if (key) keys.push(key);
        cursor.setDate(cursor.getDate() + 1);
      }

      return keys;
    };

    (data?.items || []).forEach((event) => {
      const dateKeys = getEventDateKeys(event.start_datetime, event.end_datetime);
      dateKeys.forEach((dateKey) => {
        if (!grouped[dateKey]) {
          grouped[dateKey] = [];
        }
        grouped[dateKey].push(event);
      });
    });

    return grouped;
  }, [data]);

  const truncateTitle = (title, maxLength = 18) => {
    return title.length > maxLength ? title.substring(0, maxLength) + '...' : title;
  };

  const calEvents = useMemo(() => {
    const sortedEvents = [...(data?.items || [])].sort((a, b) => {
      const aStart = new Date(a.start_datetime).getTime();
      const bStart = new Date(b.start_datetime).getTime();
      return aStart - bStart;
    });

    return sortedEvents.map((e) => ({
      id: e.id,
      title: truncateTitle(e.title),
      start: e.start_datetime,
      end: e.end_datetime,
      backgroundColor: e.category?.color_hex || '#3B82F6',
      borderColor: e.category?.color_hex || '#3B82F6',
      extendedProps: {
        fullTitle: e.title,
        location: e.location,
        category: e.category,
      },
    }));
  }, [data]);

  const handleDateClick = (dateInfo) => {
    setSelectedDate(dateInfo.date);
    setSelectedDateKey(dateInfo.dateStr);
    setShowDayModal(true);
  };

  const dayEventsForModal = selectedDateKey
    ? eventsByDate[selectedDateKey] || []
    : [];

  return (
    <PageFrame width="7xl" title={t('public.calendar.title')} contentClassName="space-y-6">
      <div className="usv-card p-4">
        <FullCalendar
          plugins={[dayGridPlugin, timeGridPlugin, listPlugin, interactionPlugin]}
          initialView="dayGridMonth"
          headerToolbar={{
            left: 'prev,next today',
            center: 'title',
            right: 'dayGridMonth,timeGridWeek,listWeek',
          }}
          events={calEvents}
          eventOrder="start,-duration,title"
          eventOrderStrict={true}
          eventMinHeight={44}
          slotEventOverlap={false}
          expandRows={true}
          eventClick={({ event }) => navigate(localizedTo(`/events/${event.id}`))}
          dateClick={handleDateClick}
          height="auto"
          eventDisplay="block"
          contentHeight="auto"
        />
      </div>

      <DayEventsModal
        date={selectedDate}
        events={dayEventsForModal}
        isOpen={showDayModal}
        onClose={() => setShowDayModal(false)}
      />
    </PageFrame>
  );
}
