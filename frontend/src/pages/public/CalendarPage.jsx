import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useState, useMemo } from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import listPlugin from '@fullcalendar/list';
import interactionPlugin from '@fullcalendar/interaction';
import { getEvents } from '../../api/events.js';
import DayEventsModal from '../../components/events/DayEventsModal.jsx';
import Navbar from '../../components/layout/Navbar.jsx';
import './CalendarPage.css';

export default function CalendarPage() {
  const navigate = useNavigate();
  const [selectedDate, setSelectedDate] = useState(null);
  const [showDayModal, setShowDayModal] = useState(false);

  const { data } = useQuery({
    queryKey: ['events-calendar'],
    queryFn: () => getEvents({ per_page: 200, page: 1 }).then((r) => r.data),
  });

  // Organizează evenimentele pe zile pentru modal
  const eventsByDate = useMemo(() => {
    const grouped = {};
    (data?.items || []).forEach((event) => {
      const dateKey = new Date(event.start_datetime).toISOString().split('T')[0];
      if (!grouped[dateKey]) {
        grouped[dateKey] = [];
      }
      grouped[dateKey].push(event);
    });
    return grouped;
  }, [data]);

  const truncateTitle = (title, maxLength = 18) => {
    return title.length > maxLength ? title.substring(0, maxLength) + '...' : title;
  };

  const calEvents = (data?.items || []).map((e) => ({
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

  const handleDateClick = (dateInfo) => {
    const dateStr = dateInfo.dateStr;
    const date = new Date(dateStr);
    setSelectedDate(date);
    setShowDayModal(true);
  };

  const dayEventsForModal = selectedDate
    ? eventsByDate[selectedDate.toISOString().split('T')[0]] || []
    : [];

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">📅 Calendar Evenimente</h1>
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
          <FullCalendar
            plugins={[dayGridPlugin, timeGridPlugin, listPlugin, interactionPlugin]}
            initialView="dayGridMonth"
            headerToolbar={{
              left: 'prev,next today',
              center: 'title',
              right: 'dayGridMonth,timeGridWeek,listWeek',
            }}
            events={calEvents}
            eventClick={({ event }) => navigate(`/events/${event.id}`)}
            dateClick={handleDateClick}
            height="auto"
            eventDisplay="block"
            contentHeight="auto"
          />
        </div>
      </div>

      <DayEventsModal
        date={selectedDate}
        events={dayEventsForModal}
        isOpen={showDayModal}
        onClose={() => setShowDayModal(false)}
      />
    </div>
  );
}
