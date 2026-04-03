import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { format } from 'date-fns';
import toast from 'react-hot-toast';
import { getMyEvents, submitForApproval, cancelEvent, deleteEvent } from '../../api/organizer.js';
import Navbar from '../../components/layout/Navbar.jsx';
import EventStatusBadge from '../../components/events/EventStatusBadge.jsx';

const TABS = ['all', 'draft', 'pending_approval', 'published', 'cancelled', 'rejected'];

export default function OrganizerDashboard() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [tab, setTab] = useState('all');
  const [page, setPage] = useState(1);

  const params = { page, per_page: 20, ...(tab !== 'all' ? { status: tab } : {}) };
  const { data, isLoading } = useQuery({
    queryKey: ['my-events', params],
    queryFn: () => getMyEvents(params).then((r) => r.data),
  });

  const events = data?.items || [];
  const total = data?.total || 0;

  const submitMutation = useMutation({
    mutationFn: (id) => submitForApproval(id),
    onSuccess: () => { toast.success('Submitted for approval'); queryClient.invalidateQueries({ queryKey: ['my-events'] }); },
    onError: (err) => toast.error(err.response?.data?.detail || 'Failed'),
  });
  const cancelMutation = useMutation({
    mutationFn: (id) => cancelEvent(id),
    onSuccess: () => { toast.success('Event cancelled'); queryClient.invalidateQueries({ queryKey: ['my-events'] }); },
    onError: (err) => toast.error(err.response?.data?.detail || 'Failed'),
  });
  const deleteMutation = useMutation({
    mutationFn: (id) => deleteEvent(id),
    onSuccess: () => { toast.success('Event deleted'); queryClient.invalidateQueries({ queryKey: ['my-events'] }); },
    onError: (err) => toast.error(err.response?.data?.detail || 'Failed'),
  });

  const tabLabel = (t) => t === 'pending_approval' ? 'Pending' : t.charAt(0).toUpperCase() + t.slice(1);

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-gray-900">My Events</h1>
          <Link
            to="/organizer/events/new"
            className="bg-blue-600 text-white text-sm font-medium px-4 py-2 rounded-lg hover:bg-blue-700 transition"
          >
            + Create Event
          </Link>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 bg-gray-100 p-1 rounded-lg mb-6 w-fit">
          {TABS.map(t => (
            <button
              key={t}
              onClick={() => { setTab(t); setPage(1); }}
              className={`px-3 py-1.5 rounded-md text-sm font-medium transition ${tab === t ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
            >
              {tabLabel(t)}
            </button>
          ))}
        </div>

        {isLoading ? (
          <div className="flex justify-center py-20"><div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" /></div>
        ) : events.length === 0 ? (
          <div className="text-center py-20 text-gray-500">
            <p className="text-lg">No events found</p>
            <Link to="/organizer/events/new" className="mt-3 inline-block text-blue-600 hover:underline text-sm">Create your first event →</Link>
          </div>
        ) : (
          <>
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b border-gray-100">
                  <tr>
                    <th className="text-left px-4 py-3 font-medium text-gray-600">Title</th>
                    <th className="text-left px-4 py-3 font-medium text-gray-600 hidden sm:table-cell">Date</th>
                    <th className="text-left px-4 py-3 font-medium text-gray-600">Status</th>
                    <th className="text-right px-4 py-3 font-medium text-gray-600">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {events.map((event) => (
                    <tr key={event.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 font-medium text-gray-800 max-w-xs truncate">{event.title}</td>
                      <td className="px-4 py-3 text-gray-500 hidden sm:table-cell">
                        {event.start_datetime ? format(new Date(event.start_datetime), 'MMM d, yyyy') : '—'}
                      </td>
                      <td className="px-4 py-3"><EventStatusBadge status={event.status} /></td>
                      <td className="px-4 py-3">
                        <div className="flex justify-end gap-1 flex-wrap">
                          {(event.status === 'draft' || event.status === 'rejected') && (
                            <>
                              <button onClick={() => navigate(`/organizer/events/${event.id}/edit`)} className="text-xs text-blue-600 hover:underline px-2 py-1">Edit</button>
                              <button onClick={() => submitMutation.mutate(event.id)} className="text-xs text-green-600 hover:underline px-2 py-1">Submit</button>
                            </>
                          )}
                          {event.status === 'draft' && (
                            <button onClick={() => { if (confirm('Delete this event?')) deleteMutation.mutate(event.id); }} className="text-xs text-red-500 hover:underline px-2 py-1">Delete</button>
                          )}
                          {event.status === 'published' && (
                            <button onClick={() => { if (confirm('Cancel this event?')) cancelMutation.mutate(event.id); }} className="text-xs text-red-500 hover:underline px-2 py-1">Cancel</button>
                          )}
                          <button onClick={() => navigate(`/organizer/events/${event.id}/participants`)} className="text-xs text-gray-600 hover:underline px-2 py-1">Participants</button>
                          <button onClick={() => navigate(`/organizer/events/${event.id}/materials`)} className="text-xs text-gray-600 hover:underline px-2 py-1">Materials</button>
                          <button onClick={() => navigate(`/organizer/events/${event.id}/stats`)} className="text-xs text-gray-600 hover:underline px-2 py-1">Stats</button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {total > 20 && (
              <div className="flex justify-center gap-2 mt-6">
                <button onClick={() => setPage(p => p - 1)} disabled={page <= 1} className="px-3 py-1.5 border rounded-lg text-sm disabled:opacity-40 hover:bg-gray-100">Previous</button>
                <button onClick={() => setPage(p => p + 1)} disabled={events.length < 20} className="px-3 py-1.5 border rounded-lg text-sm disabled:opacity-40 hover:bg-gray-100">Next</button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
