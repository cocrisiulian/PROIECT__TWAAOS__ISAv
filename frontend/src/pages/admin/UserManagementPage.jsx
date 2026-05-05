import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getUsers, createUser, activateUser, deactivateUser, assignUserRole, deleteUser } from '../../api/admin';
import Navbar from '../../components/layout/Navbar.jsx';
import { DEFAULT_LANGUAGE, getPathWithLanguage, normalizeLanguage } from '../../i18n/config.js';

export default function UserManagementPage() {
  const queryClient = useQueryClient();
  const { i18n, t } = useTranslation();
  const activeLanguage = normalizeLanguage(i18n.resolvedLanguage) || DEFAULT_LANGUAGE;
  const localizedTo = (path) => getPathWithLanguage(path, activeLanguage);
  const [search, setSearch] = useState('');
  const [sourceFilter, setSourceFilter] = useState('all');
  const [roleFilter, setRoleFilter] = useState('all');
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ username: '', email: '', full_name: '', password: '' });
  const [feedback, setFeedback] = useState({ type: '', message: '' });

  const { data, isLoading, isFetching, refetch } = useQuery({
    queryKey: ['admin-users', search, sourceFilter, roleFilter],
    queryFn: () => {
      const params = { search, source: sourceFilter };
      if (roleFilter !== 'all') {
        params.role = roleFilter;
      }
      return getUsers(params).then((r) => r.data);
    },
  });

  const createMutation = useMutation({
    mutationKey: ['admin-users'],
    mutationFn: createUser,
    onSuccess: () => {
      setShowForm(false);
      setForm({ username: '', email: '', full_name: '', password: '' });
      setFeedback({ type: 'success', message: t('admin.users.messages.createSuccess') });
    },
    onError: (error) => {
      const detail = error?.response?.data?.detail;
      setFeedback({
        type: 'error',
        message: typeof detail === 'string' ? detail : t('admin.users.messages.createError'),
      });
    },
  });

  const toggleMutation = useMutation({
    mutationKey: ['admin-users'],
    mutationFn: ({ id, active }) => (active ? deactivateUser(id) : activateUser(id)),
    onSuccess: () => {},
  });

  const roleMutation = useMutation({
    mutationKey: ['admin-users'],
    mutationFn: ({ id, role }) => assignUserRole(id, role),
    onSuccess: () => {},
  });

  const deleteMutation = useMutation({
    mutationKey: ['admin-users'],
    mutationFn: (id) => deleteUser(id),
    onSuccess: () => {
      setFeedback({ type: 'success', message: t('admin.users.messages.deleteSuccess') });
    },
    onError: (error) => {
      const detail = error?.response?.data?.detail;
      setFeedback({
        type: 'error',
        message: typeof detail === 'string' ? detail : t('admin.users.messages.deleteError'),
      });
    },
  });

  const handleCreateUser = () => {
    const payload = {
      username: form.username.trim(),
      email: form.email.trim(),
      full_name: form.full_name.trim(),
      password: form.password,
    };

    if (!payload.username || !payload.email || !payload.full_name || !payload.password) {
      setFeedback({ type: 'error', message: t('admin.users.messages.allFieldsRequired') });
      return;
    }

    setFeedback({ type: '', message: '' });
    createMutation.mutate(payload);
  };

  const users = Array.isArray(data?.items)
    ? data.items
    : Array.isArray(data?.users)
      ? data.users
      : Array.isArray(data)
        ? data
        : [];

  const handleDeleteUser = (user) => {
    if (user.is_active) {
      setFeedback({ type: 'error', message: t('admin.users.messages.mustDeactivateFirst') });
      return;
    }

    const confirmed = window.confirm(`${t('admin.users.messages.confirmDelete')} ${user.username}?`);
    if (!confirmed) {
      return;
    }

    setFeedback({ type: '', message: '' });
    deleteMutation.mutate(user.id);
  };

  const handleRefreshUsers = async () => {
    setFeedback({ type: '', message: '' });
    await queryClient.invalidateQueries({ queryKey: ['admin-users'] });
    await refetch();
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="max-w-5xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-800">{t('admin.users.title')}</h1>
        <button
          onClick={() => {
            setFeedback({ type: '', message: '' });
            setShowForm(!showForm);
          }}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 text-sm"
        >
          {t('admin.users.newUser')}
        </button>
      </div>

      <div className="flex flex-wrap gap-2 mb-4">
        <Link to={localizedTo('/admin')} className="border px-3 py-1.5 rounded-lg text-sm text-gray-600 hover:bg-gray-100">
          {t('admin.users.dashboardLink')}
        </Link>
        <Link to={localizedTo('/admin/events/pending')} className="border px-3 py-1.5 rounded-lg text-sm text-gray-600 hover:bg-gray-100">
          {t('admin.users.pendingLink')}
        </Link>
        <Link to={localizedTo('/admin/reports')} className="border px-3 py-1.5 rounded-lg text-sm text-gray-600 hover:bg-gray-100">
          {t('admin.users.reportsLink')}
        </Link>
      </div>

      {feedback.message && (
        <div
          className={`mb-4 rounded-lg px-4 py-2 text-sm ${
            feedback.type === 'error'
              ? 'bg-red-50 text-red-700 border border-red-200'
              : 'bg-green-50 text-green-700 border border-green-200'
          }`}
        >
          {feedback.message}
        </div>
      )}

      {showForm && (
        <div className="bg-white rounded-xl shadow p-6 mb-6 border border-gray-100">
          <h2 className="font-semibold text-gray-700 mb-4">{t('admin.users.createForm')}</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <input
              className="border rounded-lg px-3 py-2 text-sm"
              placeholder={t('admin.users.namePlaceholder')}
              value={form.full_name}
              onChange={(e) => setForm({ ...form, full_name: e.target.value })}
            />
            <input
              className="border rounded-lg px-3 py-2 text-sm"
              placeholder={t('admin.users.usernamePlaceholder')}
              value={form.username}
              onChange={(e) => setForm({ ...form, username: e.target.value })}
            />
            <input
              className="border rounded-lg px-3 py-2 text-sm"
              placeholder={t('admin.users.emailPlaceholder')}
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
            />
            <input
              type="password"
              className="border rounded-lg px-3 py-2 text-sm"
              placeholder={t('admin.users.passwordPlaceholder')}
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
            />
          </div>
          <div className="mt-4 flex gap-2">
            <button
              onClick={handleCreateUser}
              disabled={createMutation.isPending}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-blue-700 disabled:opacity-50"
            >
              {t('admin.users.save')}
            </button>
            <button
              onClick={() => setShowForm(false)}
              className="border px-4 py-2 rounded-lg text-sm text-gray-600 hover:bg-gray-50"
            >
              {t('admin.users.cancel')}
            </button>
          </div>
        </div>
      )}

      <div className="mb-4">
        <div className="flex flex-col md:flex-row gap-3 md:items-center">
          <input
            className="border rounded-lg px-3 py-2 text-sm w-full md:w-80"
            placeholder={t('admin.users.searchPlaceholder')}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <select
            value={sourceFilter}
            onChange={(e) => setSourceFilter(e.target.value)}
            className="border rounded-lg px-3 py-2 text-sm w-full md:w-56"
          >
            <option value="staff">{t('admin.users.filters.source.staff')}</option>
            <option value="students">{t('admin.users.filters.source.students')}</option>
            <option value="all">{t('admin.users.filters.source.all')}</option>
          </select>
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="border rounded-lg px-3 py-2 text-sm w-full md:w-48"
          >
            <option value="all">{t('admin.users.filters.role.all')}</option>
            <option value="student">{t('admin.users.filters.role.student')}</option>
            <option value="visitor">{t('admin.users.filters.role.visitor')}</option>
            <option value="organizer">{t('admin.users.filters.role.organizer')}</option>
            <option value="admin">{t('admin.users.filters.role.admin')}</option>
          </select>
          <button
            type="button"
            onClick={handleRefreshUsers}
            disabled={isFetching}
            className="border rounded-lg px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 disabled:opacity-50"
          >
            {isFetching ? t('admin.users.refreshing') : t('admin.users.refresh')}
          </button>
        </div>
      </div>

      {isLoading ? (
        <p className="text-gray-500">{t('admin.users.loading')}</p>
      ) : (
        <div className="bg-white rounded-xl shadow overflow-hidden border border-gray-100">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-gray-600 uppercase text-xs">
              <tr>
                <th className="px-4 py-3 text-left">{t('admin.users.tableHeaders.name')}</th>
                <th className="px-4 py-3 text-left">{t('admin.users.tableHeaders.email')}</th>
                <th className="px-4 py-3 text-left">{t('admin.users.tableHeaders.role')}</th>
                <th className="px-4 py-3 text-left">{t('admin.users.tableHeaders.status')}</th>
                <th className="px-4 py-3 text-left">{t('admin.users.tableHeaders.actions')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {users.map((u) => (
                <tr key={u.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium text-gray-800">{u.full_name}</td>
                  <td className="px-4 py-3 text-gray-500">{u.email}</td>
                  <td className="px-4 py-3">
                    {u.account_type === 'google_student' ? (
                      <span className="inline-flex items-center rounded-full bg-blue-50 px-2 py-0.5 text-xs font-medium text-blue-700">
                        {t('admin.users.accountType.googleStudent')}
                      </span>
                    ) : (
                      <select
                        value={u.role}
                        onChange={(e) => roleMutation.mutate({ id: u.id, role: e.target.value })}
                        className="border rounded px-2 py-1 text-xs"
                      >
                        <option value="visitor">{t('admin.users.roles.visitor')}</option>
                        <option value="student">{t('admin.users.roles.student')}</option>
                        <option value="organizer">{t('admin.users.roles.organizer')}</option>
                        <option value="admin">{t('admin.users.roles.admin')}</option>
                      </select>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                        u.is_active ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                      }`}
                    >
                      {u.is_active ? t('admin.users.status.active') : t('admin.users.status.inactive')}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    {u.account_type === 'google_student' ? (
                      <span className="text-xs text-gray-400">{t('admin.users.readOnly')}</span>
                    ) : (
                      <div className="flex items-center gap-3">
                        <button
                          onClick={() => toggleMutation.mutate({ id: u.id, active: u.is_active })}
                          className="text-xs text-blue-600 hover:underline"
                        >
                          {u.is_active ? t('admin.users.actions.deactivate') : t('admin.users.actions.activate')}
                        </button>
                        <button
                          onClick={() => handleDeleteUser(u)}
                          disabled={u.is_active || deleteMutation.isPending}
                          className="text-xs text-red-600 hover:underline disabled:text-gray-300 disabled:no-underline"
                          title={u.is_active ? t('admin.users.messages.mustDeactivateFirst') : t('admin.users.actions.delete')}
                        >
                          {t('admin.users.actions.delete')}
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
              {users.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-4 py-6 text-center text-gray-400">
                    {t('admin.users.messages.noResults')}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
      </div>
    </div>
  );
}
