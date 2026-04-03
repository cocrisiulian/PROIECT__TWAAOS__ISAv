import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { getMyEvent, updateEvent } from '../../api/organizer.js';
import Navbar from '../../components/layout/Navbar.jsx';
import EventForm from '../../components/organizer/EventForm.jsx';

export default function EditEventPage() {
  const { id } = useParams();
  const navigate = useNavigate();

  const { data: event, isLoading } = useQuery({
    queryKey: ['my-event', id],
    queryFn: () => getMyEvent(id).then((r) => r.data),
  });

  const mutation = useMutation({
    mutationFn: (data) => updateEvent(id, data),
    onSuccess: () => { toast.success('Event updated'); navigate('/organizer'); },
    onError: (err) => toast.error(err.response?.data?.detail || 'Failed to update event'),
  });

  if (isLoading) return (
    <div className="min-h-screen bg-gray-50"><Navbar />
      <div className="flex justify-center py-32"><div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" /></div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">Edit Event</h1>
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          {event && (
            <EventForm
              initial={event}
              onSubmit={(data) => mutation.mutate(data)}
              submitting={mutation.isPending}
            />
          )}
        </div>
      </div>
    </div>
  );
}
