import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import listPlugin from '@fullcalendar/list';
import interactionPlugin from '@fullcalendar/interaction';
import { getEvents } from '../../api/events.js';
import Navbar from '../../components/layout/Navbar.jsx';

export default function CalendarPage() {
  const navigate = useNavigate();

  const { data } = useQuery({
    queryKey: ['events-calendar'],
    queryFn: () => getEvents({ per_page: 200, page: 1 }).then((r) => r.data),
  });

  const calEvents = (data?.items || []).map((e) => ({
    id: e.id,
    title: e.title,
    start: e.start_datetime,
    end: e.end_datetime,
    backgroundColor: e.category?.color_hex || '#3B82F6',
    borderColor: e.category?.color_hex || '#3B82F6',
  }));

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">Event Calendar</h1>
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
            height="auto"
          />
        </div>
      </div>
    </div>
  );
}
