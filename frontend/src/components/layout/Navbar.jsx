import { Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore.js';
import { logout } from '../../api/auth.js';

function Navbar() {
  const navigate = useNavigate();
  const { user, token, role, clearAuth } = useAuthStore();

  const handleLogout = async () => {
    try {
      if (token) {
        await logout();
      }
    } catch {}
    clearAuth();
    navigate('/login');
  };

  return (
    <nav className="bg-navy-800 bg-[#1a2744] text-white shadow-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Left: Brand + Nav Links */}
          <div className="flex items-center gap-8">
            <Link to="/events" className="text-xl font-bold tracking-tight hover:opacity-90">
              USV Events
            </Link>
            <div className="hidden md:flex items-center gap-6">
              <Link
                to="/events"
                className="text-sm font-medium text-gray-200 hover:text-white transition"
              >
                Events
              </Link>
              <Link
                to="/calendar"
                className="text-sm font-medium text-gray-200 hover:text-white transition"
              >
                Calendar
              </Link>
              {(role === 'organizer' || role === 'admin') && (
                <Link
                  to="/organizer"
                  className="text-sm font-medium text-gray-200 hover:text-white transition"
                >
                  Dashboard
                </Link>
              )}
              {role === 'admin' && (
                <Link
                  to="/admin"
                  className="text-sm font-medium text-gray-200 hover:text-white transition"
                >
                  Admin
                </Link>
              )}
            </div>
          </div>

          {/* Right: Auth */}
          <div className="flex items-center gap-4">
            {token && user ? (
              <>
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-blue-400 flex items-center justify-center text-sm font-bold uppercase">
                    {(user?.full_name ? user.full_name[0] : user?.username ? user.username[0] : user?.email ? user.email[0] : 'U')}
                  </div>
                  <span className="text-sm text-gray-200 hidden sm:block">
                    {user?.full_name || user?.username || user?.email || role || 'Authenticated'}
                  </span>
                </div>
                <button
                  onClick={handleLogout}
                  className="text-sm text-gray-300 hover:text-white border border-gray-500 hover:border-gray-300 px-3 py-1 rounded-lg transition"
                >
                  Logout
                </button>
              </>
            ) : token ? (
              <button
                onClick={handleLogout}
                className="text-sm text-gray-300 hover:text-white border border-gray-500 hover:border-gray-300 px-3 py-1 rounded-lg transition"
              >
                Logout
              </button>
            ) : (
              <Link
                to="/login"
                className="bg-blue-500 hover:bg-blue-600 text-white text-sm font-medium px-4 py-2 rounded-lg transition"
              >
                Login
              </Link>
            )}
          </div>
        </div>

        <div className="md:hidden pb-3 flex flex-wrap gap-3 text-sm">
          <Link to="/events" className="text-gray-200 hover:text-white transition">Events</Link>
          <Link to="/calendar" className="text-gray-200 hover:text-white transition">Calendar</Link>
          {(role === 'organizer' || role === 'admin') && (
            <Link to="/organizer" className="text-gray-200 hover:text-white transition">Dashboard</Link>
          )}
          {role === 'admin' && (
            <>
              <Link to="/admin" className="text-gray-200 hover:text-white transition">Admin</Link>
              <Link to="/admin/users" className="text-gray-200 hover:text-white transition">Users</Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}

export default Navbar;
