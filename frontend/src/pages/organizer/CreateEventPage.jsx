import { useNavigate } from 'react-router-dom';
import { useMutation } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { useTranslation } from 'react-i18next';
import { createEvent } from '../../api/organizer.js';
import PageFrame from '../../components/layout/PageFrame.jsx';
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
    <PageFrame
      width="5xl"
      title={t('organizer.form.createTitle')}
      contentClassName="space-y-6"
    >
      <div className="usv-card usv-card-body">
        <EventForm onSubmit={(data) => mutation.mutate(data)} submitting={mutation.isPending} />
      </div>
    </PageFrame>
  );
}
