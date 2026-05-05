import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { getFaculties, getDepartments, getCategories } from '../../api/events.js';
import CoverImageUploader from './CoverImageUploader.jsx';
import { parseCoverImage } from '../../utils/coverImage.js';
import { getPathWithLanguage, normalizeLanguage } from '../../i18n/config.js';

export default function EventForm({ initial = {}, onSubmit, submitting }) {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();

  const localizedTo = (path) => getPathWithLanguage(path, normalizeLanguage(i18n.language));
  const [isCoverUploadMode, setIsCoverUploadMode] = useState(false);
  const [form, setForm] = useState({
    title: '',
    description: '',
    start_datetime: '',
    end_datetime: '',
    location: '',
    online_link: '',
    participation_mode: 'physical',
    is_free: true,
    requires_registration: false,
    registration_link: '',
    max_participants: '',
    cover_image_url: '',
    faculty_id: '',
    department_id: '',
    category_id: '',
    ...initial,
  });

  // Normalize datetime fields from ISO to datetime-local format
  useEffect(() => {
    if (initial.start_datetime) {
      setForm(f => ({ ...f, start_datetime: initial.start_datetime.slice(0, 16) }));
    }
    if (initial.end_datetime) {
      setForm(f => ({ ...f, end_datetime: initial.end_datetime.slice(0, 16) }));
    }
  }, [initial.start_datetime, initial.end_datetime]);

  const { data: facultiesData } = useQuery({
    queryKey: ['faculties'],
    queryFn: () => getFaculties().then((r) => r.data),
  });
  const { data: categoriesData } = useQuery({
    queryKey: ['categories'],
    queryFn: () => getCategories().then((r) => r.data),
  });
  const { data: departments } = useQuery({
    queryKey: ['departments', form.faculty_id],
    queryFn: () => getDepartments(form.faculty_id).then((r) => r.data),
    enabled: !!form.faculty_id,
  });

  const faculties = facultiesData?.items || facultiesData || [];
  const categories = categoriesData?.items || categoriesData || [];

  const isManagedCoverValue = useMemo(() => {
    const value = form.cover_image_url;
    if (!value || typeof value !== 'string') {
      return false;
    }
    const trimmed = value.trim();
    return Boolean(trimmed) && (trimmed.startsWith('{') || trimmed.includes('/uploads/covers/'));
  }, [form.cover_image_url]);

  const modes = useMemo(() => ([
    { value: 'physical', label: t('organizer.form.modes.physical') },
    { value: 'online', label: t('organizer.form.modes.online') },
    { value: 'hybrid', label: t('organizer.form.modes.hybrid') },
  ]), [t]);

  const set = (key, value) => setForm(f => ({ ...f, [key]: value }));

  const handleSubmit = (e) => {
    e.preventDefault();
    if (new Date(form.end_datetime) <= new Date(form.start_datetime)) {
      alert(t('organizer.form.endAfterStartError'));
      return;
    }
    const payload = {
      ...form,
      faculty_id: form.faculty_id ? parseInt(form.faculty_id) : null,
      department_id: form.department_id ? parseInt(form.department_id) : null,
      category_id: form.category_id ? parseInt(form.category_id) : null,
      max_participants: form.max_participants ? parseInt(form.max_participants) : null,
    };
    onSubmit(payload);
  };

  const field = (label, key, type = 'text', props = {}) => (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
      <input
        type={type}
        value={form[key] ?? ''}
        onChange={(e) => set(key, e.target.value)}
        className={`w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 ${type === 'datetime-local' ? 'event-datetime-input' : ''}`}
        {...props}
      />
    </div>
  );

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {field(`${t('organizer.form.title')} *`, 'title', 'text', { required: true, placeholder: t('organizer.form.placeholders.title') })}

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">{t('organizer.form.description')} *</label>
        <textarea
          value={form.description}
          onChange={(e) => set('description', e.target.value)}
          rows={5}
          required
          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
          placeholder={t('organizer.form.placeholders.description')}
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {field(`${t('organizer.form.startDateTime')} *`, 'start_datetime', 'datetime-local', { required: true })}
        {field(`${t('organizer.form.endDateTime')} *`, 'end_datetime', 'datetime-local', { required: true })}
      </div>

      {field(t('organizer.form.location'), 'location', 'text', { placeholder: t('organizer.form.placeholders.location') })}
      {field(t('organizer.form.onlineLink'), 'online_link', 'url', { placeholder: t('organizer.form.placeholders.onlineLink') })}

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">{t('organizer.form.participationMode')} *</label>
        <div className="flex gap-4">
          {modes.map(m => (
            <label key={m.value} className="flex items-center gap-2 text-sm cursor-pointer">
              <input
                type="radio"
                name="participation_mode"
                value={m.value}
                checked={form.participation_mode === m.value}
                onChange={() => set('participation_mode', m.value)}
              />
              {m.label}
            </label>
          ))}
        </div>
      </div>

      <div className="flex gap-6">
        <label className="flex items-center gap-2 text-sm cursor-pointer">
          <input type="checkbox" checked={form.is_free} onChange={(e) => set('is_free', e.target.checked)} />
          {t('organizer.form.isFree')}
        </label>
        <label className="flex items-center gap-2 text-sm cursor-pointer">
          <input type="checkbox" checked={form.requires_registration} onChange={(e) => set('requires_registration', e.target.checked)} />
          {t('organizer.form.requiresRegistration')}
        </label>
      </div>

      {form.requires_registration && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pl-4 border-l-2 border-blue-200">
          {field(t('organizer.form.registrationLinkOptional'), 'registration_link', 'url', { placeholder: t('organizer.form.placeholders.registrationLink') })}
          {field(t('organizer.form.maxParticipants'), 'max_participants', 'number', { min: 1, placeholder: t('organizer.form.placeholders.maxParticipants') })}
        </div>
      )}

      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-700">{t('organizer.form.coverImage')}</label>
        <CoverImageUploader
          value={form.cover_image_url}
          onChange={(value) => set('cover_image_url', value)}
          onUploadModeChange={setIsCoverUploadMode}
          disabled={submitting}
        />
        <div className={isCoverUploadMode || isManagedCoverValue ? 'opacity-60' : ''}>
          <label className="block text-sm font-medium text-gray-700 mb-1">{t('organizer.form.coverUrlOptional')}</label>
          <input
            type="text"
            value={isManagedCoverValue ? '' : (form.cover_image_url ?? '')}
            onChange={(e) => set('cover_image_url', e.target.value)}
            placeholder={t('organizer.form.placeholders.coverUrl')}
            disabled={isCoverUploadMode || isManagedCoverValue}
            readOnly={isCoverUploadMode || isManagedCoverValue}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 disabled:bg-gray-100 disabled:text-gray-500"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">{t('organizer.form.faculty')}</label>
          <select
            value={form.faculty_id}
            onChange={(e) => { set('faculty_id', e.target.value); set('department_id', ''); }}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
          >
            <option value="">{t('organizer.form.noneOption')}</option>
            {faculties.map(f => <option key={f.id} value={f.id}>{f.short_name || f.name}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">{t('organizer.form.department')}</label>
          <select
            value={form.department_id}
            onChange={(e) => set('department_id', e.target.value)}
            disabled={!form.faculty_id}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 disabled:opacity-50"
          >
            <option value="">{t('organizer.form.noneOption')}</option>
            {(departments || []).map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">{t('organizer.form.category')}</label>
          <select
            value={form.category_id}
            onChange={(e) => set('category_id', e.target.value)}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
          >
            <option value="">{t('organizer.form.noneOption')}</option>
            {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </div>
      </div>

      <div className="flex gap-3 pt-4 border-t border-gray-100">
        <button
          type="submit"
          disabled={submitting}
          className="bg-blue-600 text-white text-sm font-medium px-6 py-2.5 rounded-lg hover:bg-blue-700 disabled:opacity-50 transition"
        >
          {submitting ? t('organizer.form.saving') : t('organizer.form.saveEvent')}
        </button>
        <button
          type="button"
          onClick={() => navigate(localizedTo('/organizer'))}
          className="text-sm text-gray-600 px-5 py-2.5 rounded-lg border border-gray-200 hover:bg-gray-100 transition"
        >
          {t('organizer.form.cancel')}
        </button>
      </div>
    </form>
  );
}
