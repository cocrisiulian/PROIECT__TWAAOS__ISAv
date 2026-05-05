import { useMemo, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import Navbar from '../../components/layout/Navbar.jsx';
import LanguageSwitcher from '../../components/layout/LanguageSwitcher.jsx';
import { getMyAccountOverview, updateMyAccountProfile } from '../../api/account.js';
import { getDepartments, getFaculties } from '../../api/events.js';
import { getMyEvents } from '../../api/organizer.js';
import { getEventsPerMonth, getPendingEvents, getUsers } from '../../api/admin.js';
import { useAuthStore } from '../../store/authStore.js';
import { getPathWithLanguage, normalizeLanguage } from '../../i18n/config.js';

function getCurrentMonthValue() {
  const now = new Date();
  const month = `${now.getMonth() + 1}`.padStart(2, '0');
  return `${now.getFullYear()}-${month}`;
}

export default function AccountManagementPage() {
  const { t, i18n } = useTranslation();
  const { role, token } = useAuthStore();
  const queryClient = useQueryClient();
  const [selectedMonth, setSelectedMonth] = useState(getCurrentMonthValue());
  const [fullName, setFullName] = useState('');
  const [facultyId, setFacultyId] = useState('');
  const [departmentId, setDepartmentId] = useState('');
  const [saveMessage, setSaveMessage] = useState('');

  const [year, month] = selectedMonth.split('-').map((value) => parseInt(value, 10));
  const locale = normalizeLanguage(i18n.language) === 'en' ? 'en-GB' : 'ro-RO';
  const canAccessAccount = role === 'student' || role === 'organizer' || role === 'admin';
  const isAccountQueryEnabled = Boolean(token) && canAccessAccount;

  const accountQuery = useQuery({
    queryKey: ['account-overview', year, month],
    queryFn: () => getMyAccountOverview(year, month).then((response) => response.data),
    enabled: isAccountQueryEnabled,
    onSuccess: (data) => {
      setFullName(data.profile.full_name || '');
      setFacultyId(data.profile.faculty_id ? String(data.profile.faculty_id) : '');
      setDepartmentId(data.profile.department_id ? String(data.profile.department_id) : '');
    },
  });

  const facultiesQuery = useQuery({
    queryKey: ['faculties-account'],
    queryFn: () => getFaculties().then((response) => response.data),
    enabled: role === 'student',
  });

  const departmentsQuery = useQuery({
    queryKey: ['departments-account', facultyId],
    queryFn: () => getDepartments(Number(facultyId)).then((response) => response.data),
    enabled: role === 'student' && Boolean(facultyId),
  });

  const organizerEventsQuery = useQuery({
    queryKey: ['account-organizer-events'],
    queryFn: () => getMyEvents({ page: 1, per_page: 100 }).then((response) => response.data),
    enabled: isAccountQueryEnabled && role === 'organizer',
  });

  const adminUsersQuery = useQuery({
    queryKey: ['account-admin-users'],
    queryFn: () => getUsers({ page: 1, per_page: 100 }).then((response) => response.data),
    enabled: isAccountQueryEnabled && role === 'admin',
  });

  const adminPendingQuery = useQuery({
    queryKey: ['account-admin-pending'],
    queryFn: () => getPendingEvents({ page: 1, per_page: 100 }).then((response) => response.data),
    enabled: isAccountQueryEnabled && role === 'admin',
  });

  const adminMonthlyQuery = useQuery({
    queryKey: ['account-admin-monthly'],
    queryFn: () => getEventsPerMonth().then((response) => response.data),
    enabled: isAccountQueryEnabled && role === 'admin',
  });

  const saveMutation = useMutation({
    mutationKey: ['profile'],
    mutationFn: (payload) => updateMyAccountProfile(payload).then((response) => response.data),
    onSuccess: () => {
      setSaveMessage(t('account.profile.saveSuccess'));
    },
    onError: (error) => {
      setSaveMessage(error?.response?.data?.detail || t('account.profile.saveError'));
    },
  });

  const monthLabel = useMemo(() => {
    if (!year || !month) return selectedMonth;
    const date = new Date(year, month - 1, 1);
    return date.toLocaleDateString(locale, { month: 'long', year: 'numeric' });
  }, [locale, month, selectedMonth, year]);

  const submitProfile = (event) => {
    event.preventDefault();
    setSaveMessage('');

    if (!token || !canAccessAccount) {
      setSaveMessage(t('account.loadError'));
      return;
    }

    if ((fullName || '').trim().length < 2) {
      setSaveMessage(t('account.profile.saveError'));
      return;
    }

    const payload = {
      full_name: fullName.trim(),
    };

    if (role === 'student') {
      payload.faculty_id = facultyId ? Number(facultyId) : null;
      payload.department_id = departmentId ? Number(departmentId) : null;
    }

    saveMutation.mutate(payload);
  };

  const profile = accountQuery.data?.profile;
  const stats = accountQuery.data?.monthly_stats;
  const monthEvents = accountQuery.data?.month_events || [];

  const statusLabel = (status) => t(`account.events.status.${status}`, status);
  const checkedInLabel = (checkedIn) => checkedIn ? t('account.events.checkedInYes') : t('account.events.checkedInNo');

  const organizerEvents = organizerEventsQuery.data?.items || [];
  const organizerSummary = useMemo(() => {
    const summary = {
      total: organizerEvents.length,
      published: organizerEvents.filter((event) => event.status === 'published').length,
      pending: organizerEvents.filter((event) => event.status === 'pending_approval').length,
      drafts: organizerEvents.filter((event) => event.status === 'draft').length,
    };
    return summary;
  }, [organizerEvents]);

  const adminUsersTotal = adminUsersQuery.data?.total || adminUsersQuery.data?.items?.length || 0;
  const adminPendingTotal = adminPendingQuery.data?.total || adminPendingQuery.data?.items?.length || 0;
  const adminMonthlyRows = adminMonthlyQuery.data || [];
  const adminTotalEvents = adminMonthlyRows.reduce(
    (accumulator, row) => accumulator + Number(row.total_events || row.count || 0),
    0
  );

  if (!canAccessAccount) {
    return (
      <div className="min-h-screen bg-slate-50">
        <Navbar />
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
          <div className="rounded-xl border border-amber-200 bg-amber-50 p-6 text-amber-800">
            {t('account.noAccess')}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-slate-900">{t('account.title')}</h1>
            <p className="text-slate-600">{t('account.subtitle')}</p>
          </div>
          <div className="self-start md:self-auto rounded-lg border border-slate-200 bg-white px-3 py-2">
            <LanguageSwitcher />
          </div>
        </div>

        {accountQuery.isLoading ? (
          <div className="rounded-xl border border-slate-200 bg-white p-8 text-center text-slate-500">
            {t('account.loading')}
          </div>
        ) : accountQuery.isError ? (
          <div className="rounded-xl border border-red-200 bg-red-50 p-6 text-red-700">
            {t('account.loadError')}
          </div>
        ) : (
          <>
            <section className="grid grid-cols-1 xl:grid-cols-3 gap-6">
              <article className="xl:col-span-2 rounded-xl border border-slate-200 bg-white p-6">
                <h2 className="text-lg font-semibold text-slate-900 mb-4">{t('account.profile.title')}</h2>
                <form onSubmit={submitProfile} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <label className="flex flex-col gap-1 text-sm text-slate-700">
                      {t('account.profile.fullName')}
                      <input
                        value={fullName}
                        onChange={(event) => setFullName(event.target.value)}
                        className="rounded-lg border border-slate-300 px-3 py-2"
                      />
                    </label>
                    <label className="flex flex-col gap-1 text-sm text-slate-700">
                      {t('account.profile.email')}
                      <input
                        value={profile?.email || ''}
                        disabled
                        className="rounded-lg border border-slate-200 bg-slate-100 px-3 py-2 text-slate-600"
                      />
                    </label>
                    {role === 'student' && (
                      <>
                        <label className="flex flex-col gap-1 text-sm text-slate-700">
                          {t('account.profile.faculty')}
                          <select
                            value={facultyId}
                            onChange={(event) => {
                              const nextFacultyId = event.target.value;
                              setFacultyId(nextFacultyId);
                              setDepartmentId('');
                            }}
                            className="rounded-lg border border-slate-300 px-3 py-2 bg-white"
                          >
                            <option value="">{t('account.profile.selectFaculty')}</option>
                            {(facultiesQuery.data || []).map((faculty) => (
                              <option key={faculty.id} value={faculty.id}>{faculty.name}</option>
                            ))}
                          </select>
                        </label>
                        <label className="flex flex-col gap-1 text-sm text-slate-700">
                          {t('account.profile.department')}
                          <select
                            value={departmentId}
                            onChange={(event) => setDepartmentId(event.target.value)}
                            disabled={!facultyId}
                            className="rounded-lg border border-slate-300 px-3 py-2 bg-white disabled:bg-slate-100"
                          >
                            <option value="">{t('account.profile.selectDepartment')}</option>
                            {(departmentsQuery.data || []).map((department) => (
                              <option key={department.id} value={department.id}>{department.name}</option>
                            ))}
                          </select>
                        </label>
                      </>
                    )}
                  </div>

                  <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                    <button
                      type="submit"
                      disabled={saveMutation.isPending}
                      className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-60"
                    >
                      {saveMutation.isPending ? t('account.profile.saving') : t('account.profile.save')}
                    </button>
                    {saveMessage && <p className="text-sm text-slate-600">{saveMessage}</p>}
                  </div>
                </form>
              </article>

              <article className="rounded-xl border border-slate-200 bg-white p-6">
                <h2 className="text-lg font-semibold text-slate-900 mb-3">{t('account.generalInfo.title')}</h2>
                <div className="space-y-2 text-sm text-slate-700">
                  <p><span className="font-medium">{t('account.generalInfo.memberSince')}:</span> {profile?.member_since ? new Date(profile.member_since).toLocaleDateString(locale) : '-'}</p>
                  <p><span className="font-medium">{t('account.generalInfo.role')}:</span> {role || '-'}</p>
                  {role === 'student' && (
                    <>
                      <p><span className="font-medium">{t('account.generalInfo.faculty')}:</span> {profile?.faculty_name || '-'}</p>
                      <p><span className="font-medium">{t('account.generalInfo.department')}:</span> {profile?.department_name || '-'}</p>
                    </>
                  )}
                </div>
              </article>
            </section>

            {role === 'student' && (
              <>
                <section className="rounded-xl border border-slate-200 bg-white p-6 space-y-4">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                <h2 className="text-lg font-semibold text-slate-900">{t('account.monthlyStats.title')}</h2>
                <div className="flex items-center gap-3">
                  <label className="text-sm text-slate-700">{t('account.monthlyStats.month')}</label>
                  <input
                    type="month"
                    value={selectedMonth}
                    onChange={(event) => setSelectedMonth(event.target.value)}
                    className="rounded-lg border border-slate-300 px-3 py-2"
                  />
                </div>
              </div>

              <p className="text-sm text-slate-500">{monthLabel}</p>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="rounded-lg bg-blue-50 p-4 border border-blue-100">
                  <p className="text-sm text-blue-700">{t('account.monthlyStats.totalRegistrations')}</p>
                  <p className="text-2xl font-bold text-blue-900">{stats?.total_registrations || 0}</p>
                </div>
                <div className="rounded-lg bg-emerald-50 p-4 border border-emerald-100">
                  <p className="text-sm text-emerald-700">{t('account.monthlyStats.attended')}</p>
                  <p className="text-2xl font-bold text-emerald-900">{stats?.attended_events || 0}</p>
                </div>
                <div className="rounded-lg bg-amber-50 p-4 border border-amber-100">
                  <p className="text-sm text-amber-700">{t('account.monthlyStats.waitlisted')}</p>
                  <p className="text-2xl font-bold text-amber-900">{stats?.waitlisted_events || 0}</p>
                </div>
              </div>
            </section>

            <section className="rounded-xl border border-slate-200 bg-white p-6">
              <h2 className="text-lg font-semibold text-slate-900 mb-4">{t('account.events.title')}</h2>

              {monthEvents.length === 0 ? (
                <p className="text-slate-500">{t('account.events.empty')}</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-slate-200 text-slate-600">
                        <th className="text-left py-2 pr-3">{t('account.events.headers.event')}</th>
                        <th className="text-left py-2 pr-3">{t('account.events.headers.date')}</th>
                        <th className="text-left py-2 pr-3">{t('account.events.headers.status')}</th>
                        <th className="text-left py-2">{t('account.events.headers.checkIn')}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {monthEvents.map((event) => (
                        <tr key={event.id} className="border-b border-slate-100">
                          <td className="py-3 pr-3">
                            <a
                              href={getPathWithLanguage(`/events/${event.id}`, normalizeLanguage(i18n.language))}
                              className="text-blue-700 hover:text-blue-900 hover:underline"
                            >
                              {event.title}
                            </a>
                          </td>
                          <td className="py-3 pr-3 text-slate-700">{new Date(event.start_datetime).toLocaleDateString(locale)}</td>
                          <td className="py-3 pr-3 text-slate-700">{statusLabel(event.registration_status)}</td>
                          <td className="py-3 text-slate-700">{checkedInLabel(event.checked_in)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </section>
              </>
            )}

            {role === 'organizer' && (
              <section className="rounded-xl border border-slate-200 bg-white p-6 space-y-4">
                <h2 className="text-lg font-semibold text-slate-900">{t('account.organizer.title')}</h2>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div className="rounded-lg bg-blue-50 p-4 border border-blue-100">
                    <p className="text-sm text-blue-700">{t('account.organizer.total')}</p>
                    <p className="text-2xl font-bold text-blue-900">{organizerSummary.total}</p>
                  </div>
                  <div className="rounded-lg bg-emerald-50 p-4 border border-emerald-100">
                    <p className="text-sm text-emerald-700">{t('account.organizer.published')}</p>
                    <p className="text-2xl font-bold text-emerald-900">{organizerSummary.published}</p>
                  </div>
                  <div className="rounded-lg bg-amber-50 p-4 border border-amber-100">
                    <p className="text-sm text-amber-700">{t('account.organizer.pending')}</p>
                    <p className="text-2xl font-bold text-amber-900">{organizerSummary.pending}</p>
                  </div>
                  <div className="rounded-lg bg-slate-100 p-4 border border-slate-200">
                    <p className="text-sm text-slate-700">{t('account.organizer.drafts')}</p>
                    <p className="text-2xl font-bold text-slate-900">{organizerSummary.drafts}</p>
                  </div>
                </div>
              </section>
            )}

            {role === 'admin' && (
              <section className="rounded-xl border border-slate-200 bg-white p-6 space-y-4">
                <h2 className="text-lg font-semibold text-slate-900">{t('account.admin.title')}</h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="rounded-lg bg-indigo-50 p-4 border border-indigo-100">
                    <p className="text-sm text-indigo-700">{t('account.admin.totalUsers')}</p>
                    <p className="text-2xl font-bold text-indigo-900">{adminUsersTotal}</p>
                  </div>
                  <div className="rounded-lg bg-amber-50 p-4 border border-amber-100">
                    <p className="text-sm text-amber-700">{t('account.admin.pendingEvents')}</p>
                    <p className="text-2xl font-bold text-amber-900">{adminPendingTotal}</p>
                  </div>
                  <div className="rounded-lg bg-emerald-50 p-4 border border-emerald-100">
                    <p className="text-sm text-emerald-700">{t('account.admin.totalEvents')}</p>
                    <p className="text-2xl font-bold text-emerald-900">{adminTotalEvents}</p>
                  </div>
                </div>
              </section>
            )}
          </>
        )}
      </div>
    </div>
  );
}
