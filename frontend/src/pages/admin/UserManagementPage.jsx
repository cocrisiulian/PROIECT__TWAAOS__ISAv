import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getUsers, createUser, activateUser, deactivateUser, assignUserRole } from '../../api/admin';
import Navbar from '../../components/layout/Navbar.jsx';

export default function UserManagementPage() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ username: '', email: '', full_name: '', password: '' });
  const [feedback, setFeedback] = useState({ type: '', message: '' });

  const { data, isLoading } = useQuery({
    queryKey: ['admin-users', search],
    queryFn: () => getUsers({ search }).then((r) => r.data),
  });

  const createMutation = useMutation({
    mutationFn: createUser,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
      setShowForm(false);
      setForm({ username: '', email: '', full_name: '', password: '' });
      setFeedback({ type: 'success', message: 'Utilizatorul a fost creat cu succes (rol implicit: visitor).' });
    },
    onError: (error) => {
      const detail = error?.response?.data?.detail;
      setFeedback({
        type: 'error',
        message: typeof detail === 'string' ? detail : 'Crearea utilizatorului a eșuat. Verifică datele introduse.',
      });
    },
  });

  const toggleMutation = useMutation({
    mutationFn: ({ id, active }) => (active ? deactivateUser(id) : activateUser(id)),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin-users'] }),
  });

  const roleMutation = useMutation({
    mutationFn: ({ id, role }) => assignUserRole(id, role),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin-users'] }),
  });

  const handleCreateUser = () => {
    const payload = {
      username: form.username.trim(),
      email: form.email.trim(),
      full_name: form.full_name.trim(),
      password: form.password,
    };

    if (!payload.username || !payload.email || !payload.full_name || !payload.password) {
      setFeedback({ type: 'error', message: 'Completează toate câmpurile pentru creare utilizator.' });
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

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="max-w-5xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Gestionare Utilizatori</h1>
        <button
          onClick={() => {
            setFeedback({ type: '', message: '' });
            setShowForm(!showForm);
          }}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 text-sm"
        >
          + Utilizator nou
        </button>
      </div>

      <div className="flex flex-wrap gap-2 mb-4">
        <Link to="/admin" className="border px-3 py-1.5 rounded-lg text-sm text-gray-600 hover:bg-gray-100">
          Dashboard admin
        </Link>
        <Link to="/admin/events/pending" className="border px-3 py-1.5 rounded-lg text-sm text-gray-600 hover:bg-gray-100">
          Evenimente în așteptare
        </Link>
        <Link to="/admin/reports" className="border px-3 py-1.5 rounded-lg text-sm text-gray-600 hover:bg-gray-100">
          Rapoarte
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
          <h2 className="font-semibold text-gray-700 mb-4">Creare utilizator</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <input
              className="border rounded-lg px-3 py-2 text-sm"
              placeholder="Nume complet"
              value={form.full_name}
              onChange={(e) => setForm({ ...form, full_name: e.target.value })}
            />
            <input
              className="border rounded-lg px-3 py-2 text-sm"
              placeholder="Username"
              value={form.username}
              onChange={(e) => setForm({ ...form, username: e.target.value })}
            />
            <input
              className="border rounded-lg px-3 py-2 text-sm"
              placeholder="Email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
            />
            <input
              type="password"
              className="border rounded-lg px-3 py-2 text-sm"
              placeholder="Parolă"
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
              Salvează
            </button>
            <button
              onClick={() => setShowForm(false)}
              className="border px-4 py-2 rounded-lg text-sm text-gray-600 hover:bg-gray-50"
            >
              Anulează
            </button>
          </div>
        </div>
      )}

      <div className="mb-4">
        <input
          className="border rounded-lg px-3 py-2 text-sm w-full md:w-72"
          placeholder="Caută utilizator..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {isLoading ? (
        <p className="text-gray-500">Se încarcă...</p>
      ) : (
        <div className="bg-white rounded-xl shadow overflow-hidden border border-gray-100">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-gray-600 uppercase text-xs">
              <tr>
                <th className="px-4 py-3 text-left">Nume</th>
                <th className="px-4 py-3 text-left">Email</th>
                <th className="px-4 py-3 text-left">Rol</th>
                <th className="px-4 py-3 text-left">Status</th>
                <th className="px-4 py-3 text-left">Acțiuni</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {users.map((u) => (
                <tr key={u.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium text-gray-800">{u.full_name}</td>
                  <td className="px-4 py-3 text-gray-500">{u.email}</td>
                  <td className="px-4 py-3">
                    <select
                      value={u.role}
                      onChange={(e) => roleMutation.mutate({ id: u.id, role: e.target.value })}
                      className="border rounded px-2 py-1 text-xs"
                    >
                      <option value="visitor">visitor</option>
                      <option value="student">student</option>
                      <option value="organizer">organizer</option>
                      <option value="admin">admin</option>
                    </select>
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                        u.is_active ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                      }`}
                    >
                      {u.is_active ? 'Activ' : 'Inactiv'}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <button
                      onClick={() => toggleMutation.mutate({ id: u.id, active: u.is_active })}
                      className="text-xs text-blue-600 hover:underline"
                    >
                      {u.is_active ? 'Dezactivează' : 'Activează'}
                    </button>
                  </td>
                </tr>
              ))}
              {users.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-4 py-6 text-center text-gray-400">
                    Niciun utilizator găsit.
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
