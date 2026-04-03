import { Routes, Route, Navigate } from 'react-router-dom';
import AuthGuard from './components/auth/AuthGuard.jsx';
import LoginPage from './pages/auth/LoginPage.jsx';
import GoogleCallbackPage from './pages/auth/GoogleCallbackPage.jsx';
import SignupPage from './pages/auth/SignupPage.jsx';
import ForgotPasswordPage from './pages/auth/ForgotPasswordPage.jsx';
import ResetPasswordPage from './pages/auth/ResetPasswordPage.jsx';
import EventsListPage from './pages/public/EventsListPage.jsx';
import EventDetailPage from './pages/public/EventDetailPage.jsx';
import CalendarPage from './pages/public/CalendarPage.jsx';
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

function App() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/events" replace />} />
      <Route path="/events" element={<EventsListPage />} />
      <Route path="/events/:id" element={<EventDetailPage />} />
      <Route path="/calendar" element={<CalendarPage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/signup" element={<SignupPage />} />
      <Route path="/forgot-password" element={<ForgotPasswordPage />} />
      <Route path="/reset-password" element={<ResetPasswordPage />} />
      <Route path="/auth/callback" element={<GoogleCallbackPage />} />

      {/* Organizer routes */}
      <Route element={<AuthGuard allowedRoles={['organizer', 'admin']} />}>
        <Route path="/organizer" element={<OrganizerDashboard />} />
        <Route path="/organizer/events/new" element={<CreateEventPage />} />
        <Route path="/organizer/events/:id/edit" element={<EditEventPage />} />
        <Route path="/organizer/events/:id/participants" element={<ParticipantsPage />} />
        <Route path="/organizer/events/:id/materials" element={<MaterialsPage />} />
        <Route path="/organizer/events/:id/stats" element={<EventStatsPage />} />
      </Route>

      {/* Admin routes */}
      <Route element={<AuthGuard allowedRoles={['admin']} />}>
        <Route path="/admin" element={<AdminDashboard />} />
        <Route path="/admin/users" element={<UserManagementPage />} />
        <Route path="/admin/events/pending" element={<PendingEventsPage />} />
        <Route path="/admin/reports" element={<ReportsPage />} />
      </Route>
    </Routes>
  );
}

export default App;
