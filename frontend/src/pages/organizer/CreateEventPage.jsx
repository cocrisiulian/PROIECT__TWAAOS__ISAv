import { useNavigate } from 'react-router-dom';
import { useMutation } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { createEvent } from '../../api/organizer.js';
import Navbar from '../../components/layout/Navbar.jsx';
import EventForm from '../../components/organizer/EventForm.jsx';

export default function CreateEventPage() {
  const navigate = useNavigate();

  const mutation = useMutation({
    mutationFn: createEvent,
    onSuccess: (data) => {
      toast.success('Event created as draft');
      navigate('/organizer');
    },
    onError: (err) => toast.error(err.response?.data?.detail || 'Failed to create event'),
  });

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">Create Event</h1>
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <EventForm onSubmit={(data) => mutation.mutate(data)} submitting={mutation.isPending} />
        </div>
      </div>
    </div>
  );
}
