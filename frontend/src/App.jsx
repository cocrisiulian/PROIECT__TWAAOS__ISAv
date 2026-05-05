import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Routes, Route, Navigate, useLocation, useNavigate, useParams } from 'react-router-dom';
import { useAuthStore } from './store/authStore.js';
import AuthGuard from './components/auth/AuthGuard.jsx';
import LoginPage from './pages/auth/LoginPage.jsx';
import GoogleCallbackPage from './pages/auth/GoogleCallbackPage.jsx';
import SignupPage from './pages/auth/SignupPage.jsx';
import ForgotPasswordPage from './pages/auth/ForgotPasswordPage.jsx';
import ResetPasswordPage from './pages/auth/ResetPasswordPage.jsx';
import EventsListPage from './pages/public/EventsListPage.jsx';
import EventDetailPage from './pages/public/EventDetailPage.jsx';
import CalendarPage from './pages/public/CalendarPage.jsx';
import AccountManagementPage from './pages/account/AccountManagementPage.jsx';
import OrganizerDashboard from './pages/organizer/OrganizerDashboard.jsx';
import CreateEventPage from './pages/organizer/CreateEventPage.jsx';
import EditEventPage from './pages/organizer/EditEventPage.jsx';
import ParticipantsPage from './pages/organizer/ParticipantsPage.jsx';
import MaterialsPage from './pages/organizer/MaterialsPage.jsx';
import EventStatsPage from './pages/organizer/EventStatsPage.jsx';
import AdminDashboard from './pages/admin/AdminDashboard.jsx';
import UserManagementPage from './pages/admin/UserManagementPage.jsx';
import PendingEventsPage from './pages/admin/PendingEventsPage.jsx';
import ReportsPage from './pages/admin/ReportsPage.jsx';
import {
  DEFAULT_LANGUAGE,
  SUPPORTED_LANGUAGES,
  getPathWithLanguage,
  normalizeLanguage,
  extractLanguageFromPath,
} from './i18n/config.js';

function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="events" replace />} />
      <Route path="events" element={<EventsListPage />} />
      <Route path="events/:id" element={<EventDetailPage />} />
      <Route path="calendar" element={<CalendarPage />} />
      <Route path="login" element={<LoginPage />} />
      <Route path="signup" element={<SignupPage />} />
      <Route path="forgot-password" element={<ForgotPasswordPage />} />
      <Route path="reset-password" element={<ResetPasswordPage />} />
      <Route path="auth/callback" element={<GoogleCallbackPage />} />

      {/* Account routes */}
      <Route element={<AuthGuard allowedRoles={['student', 'organizer', 'admin']} />}>
        <Route path="account" element={<AccountManagementPage />} />
      </Route>

      {/* Organizer routes */}
      <Route element={<AuthGuard allowedRoles={['organizer', 'admin']} />}>
        <Route path="organizer" element={<OrganizerDashboard />} />
        <Route path="organizer/events/new" element={<CreateEventPage />} />
        <Route path="organizer/events/:id/edit" element={<EditEventPage />} />
        <Route path="organizer/events/:id/participants" element={<ParticipantsPage />} />
        <Route path="organizer/events/:id/materials" element={<MaterialsPage />} />
        <Route path="organizer/events/:id/stats" element={<EventStatsPage />} />
      </Route>

      {/* Admin routes */}
      <Route element={<AuthGuard allowedRoles={['admin']} />}>
        <Route path="admin" element={<AdminDashboard />} />
        <Route path="admin/users" element={<UserManagementPage />} />
        <Route path="admin/events/pending" element={<PendingEventsPage />} />
        <Route path="admin/reports" element={<ReportsPage />} />
      </Route>

      <Route path="*" element={<Navigate to="events" replace />} />
    </Routes>
  );
}

function LanguageAwareApp() {
  const { i18n } = useTranslation();
  const location = useLocation();
  const navigate = useNavigate();
  const lang = extractLanguageFromPath(location.pathname);

  useEffect(() => {
    const routeLanguage = normalizeLanguage(lang);

    if (lang && !routeLanguage) {
      const fallbackPath = getPathWithLanguage(location.pathname, DEFAULT_LANGUAGE);
      navigate(`${fallbackPath}${location.search}${location.hash}`, { replace: true });
      return;
    }

    if (!routeLanguage) {
      const currentLanguage = normalizeLanguage(i18n.resolvedLanguage) || DEFAULT_LANGUAGE;
      const localizedPath = getPathWithLanguage(location.pathname, currentLanguage);

      if (localizedPath !== location.pathname) {
        navigate(`${localizedPath}${location.search}${location.hash}`, { replace: true });
      }
      return;
    }

    if (routeLanguage !== normalizeLanguage(i18n.resolvedLanguage)) {
      i18n.changeLanguage(routeLanguage);
    }
  }, [i18n, lang, location.hash, location.pathname, location.search, navigate]);


  return (
    <AppRoutes />
  );
}

function App() {
  const { initAuth } = useAuthStore();

  // Inițializează autentificarea la încărcarea aplicației
  useEffect(() => {
    initAuth();
  }, [initAuth]);

  return (
    <Routes>
      {SUPPORTED_LANGUAGES.map((language) => (
        <Route key={language} path={`/${language}/*`} element={<LanguageAwareApp />} />
      ))}
      <Route path="/*" element={<LanguageAwareApp />} />
    </Routes>
  );
}

export default App;
