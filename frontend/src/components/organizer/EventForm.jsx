import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { getFaculties, getDepartments, getCategories } from '../../api/events.js';

const MODES = [
  { value: 'physical', label: 'In Person' },
  { value: 'online', label: 'Online' },
  { value: 'hybrid', label: 'Hybrid' },
];

export default function EventForm({ initial = {}, onSubmit, submitting }) {
  const navigate = useNavigate();
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

  const set = (key, value) => setForm(f => ({ ...f, [key]: value }));

  const handleSubmit = (e) => {
    e.preventDefault();
    if (new Date(form.end_datetime) <= new Date(form.start_datetime)) {
      alert('End date/time must be after start date/time.');
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
        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
        {...props}
      />
    </div>
  );

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {field('Title *', 'title', 'text', { required: true, placeholder: 'Event title' })}

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Description *</label>
        <textarea
          value={form.description}
          onChange={(e) => set('description', e.target.value)}
          rows={5}
          required
          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
          placeholder="Describe the event..."
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {field('Start Date & Time *', 'start_datetime', 'datetime-local', { required: true })}
        {field('End Date & Time *', 'end_datetime', 'datetime-local', { required: true })}
      </div>

      {field('Location', 'location', 'text', { placeholder: 'e.g. Room C210, Building C' })}
      {field('Online Link', 'online_link', 'url', { placeholder: 'https://meet.google.com/...' })}

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Participation Mode *</label>
        <div className="flex gap-4">
          {MODES.map(m => (
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
          Free entry
        </label>
        <label className="flex items-center gap-2 text-sm cursor-pointer">
          <input type="checkbox" checked={form.requires_registration} onChange={(e) => set('requires_registration', e.target.checked)} />
          Requires registration
        </label>
      </div>

      {form.requires_registration && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pl-4 border-l-2 border-blue-200">
          {field('Registration Link (optional)', 'registration_link', 'url')}
          {field('Max Participants (optional)', 'max_participants', 'number', { min: 1, placeholder: 'Unlimited' })}
        </div>
      )}

      {field('Cover Image URL', 'cover_image_url', 'url', { placeholder: 'https://...' })}

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Faculty</label>
          <select
            value={form.faculty_id}
            onChange={(e) => { set('faculty_id', e.target.value); set('department_id', ''); }}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
          >
            <option value="">— None —</option>
            {faculties.map(f => <option key={f.id} value={f.id}>{f.short_name || f.name}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Department</label>
          <select
            value={form.department_id}
            onChange={(e) => set('department_id', e.target.value)}
            disabled={!form.faculty_id}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 disabled:opacity-50"
          >
            <option value="">— None —</option>
            {(departments || []).map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
          <select
            value={form.category_id}
            onChange={(e) => set('category_id', e.target.value)}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
          >
            <option value="">— None —</option>
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
          {submitting ? 'Saving…' : 'Save Event'}
        </button>
        <button
          type="button"
          onClick={() => navigate('/organizer')}
          className="text-sm text-gray-600 px-5 py-2.5 rounded-lg border border-gray-200 hover:bg-gray-100 transition"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}
