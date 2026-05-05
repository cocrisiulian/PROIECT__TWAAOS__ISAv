import { useNavigate } from 'react-router-dom';
import { useMutation } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { useTranslation } from 'react-i18next';
import { createEvent } from '../../api/organizer.js';
import Navbar from '../../components/layout/Navbar.jsx';
import EventForm from '../../components/organizer/EventForm.jsx';
import { getPathWithLanguage, normalizeLanguage } from '../../i18n/config.js';

export default function CreateEventPage() {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();

  const localizedTo = (path) => getPathWithLanguage(path, normalizeLanguage(i18n.language));

  const mutation = useMutation({
    mutationKey: ['my-events'],
    mutationFn: createEvent,
    onSuccess: (data) => {
      toast.success(t('organizer.form.createdAsDraft'));
      navigate(localizedTo('/organizer'));
    },
    onError: (err) => toast.error(err.response?.data?.detail || t('organizer.form.createFailed')),
  });

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">{t('organizer.form.createTitle')}</h1>
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <EventForm onSubmit={(data) => mutation.mutate(data)} submitting={mutation.isPending} />
        </div>
      </div>
    </div>
  );
}
