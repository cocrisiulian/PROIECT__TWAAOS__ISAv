import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { useTranslation } from 'react-i18next';
import { getMyEvent, updateEvent } from '../../api/organizer.js';
import Navbar from '../../components/layout/Navbar.jsx';
import EventForm from '../../components/organizer/EventForm.jsx';
import { getPathWithLanguage, normalizeLanguage } from '../../i18n/config.js';

export default function EditEventPage() {
  const { t, i18n } = useTranslation();
  const { id } = useParams();
  const navigate = useNavigate();
  const localizedTo = (path) => getPathWithLanguage(path, normalizeLanguage(i18n.language));

  const { data: event, isLoading } = useQuery({
    queryKey: ['my-event', id],
    queryFn: () => getMyEvent(id).then((r) => r.data),
  });

  const mutation = useMutation({
    mutationKey: ['my-event', id],
    mutationFn: (data) => updateEvent(id, data),
    onSuccess: () => { toast.success(t('organizer.form.successUpdate')); navigate(localizedTo('/organizer')); },
    onError: (err) => toast.error(err.response?.data?.detail || t('organizer.form.updateFailed')),
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
        <h1 className="text-2xl font-bold text-gray-900 mb-6">{t('organizer.form.editTitle')}</h1>
        {event?.status === 'rejected' && (
          <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            <strong>{t('organizer.form.rejectedReasonLabel')}:</strong> {event?.rejection_reason || t('organizer.dashboard.reasonFallback')}
          </div>
        )}
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
