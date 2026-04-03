import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { format } from 'date-fns';
import toast from 'react-hot-toast';
import { getParticipants, checkIn, exportParticipants } from '../../api/organizer.js';
import Navbar from '../../components/layout/Navbar.jsx';

export default function ParticipantsPage() {
  const { id } = useParams();
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);

  const { data, isLoading } = useQuery({
    queryKey: ['participants', id, page],
    queryFn: () => getParticipants(id, { page, per_page: 25 }).then(r => r.data),
  });

  const checkInMutation = useMutation({
    mutationFn: (regId) => checkIn(id, regId),
    onSuccess: () => { toast.success('Checked in!'); queryClient.invalidateQueries(['participants', id]); },
    onError: (err) => toast.error(err.response?.data?.detail || 'Failed'),
  });

  const handleExport = async () => {
    try {
      const blob = await exportParticipants(id);
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `participants-${id}.csv`;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      toast.error('Export failed');
    }
  };

  const participants = data?.items || [];
  const total = data?.total || 0;

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Participants</h1>
            <p className="text-sm text-gray-500 mt-1">{total} registered</p>
          </div>
          <button
            onClick={handleExport}
            className="text-sm text-white bg-green-600 hover:bg-green-700 px-4 py-2 rounded-lg transition"
          >
            Export CSV
          </button>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-20"><div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" /></div>
        ) : participants.length === 0 ? (
          <p className="text-center text-gray-500 py-20">No participants yet.</p>
        ) : (
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Name</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600 hidden sm:table-cell">Email</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600 hidden md:table-cell">Registered</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Checked In</th>
                  <th className="text-right px-4 py-3 font-medium text-gray-600">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {participants.map((p) => (
                  <tr key={p.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 font-medium">{p.student_name}</td>
                    <td className="px-4 py-3 text-gray-500 hidden sm:table-cell">{p.student_email}</td>
                    <td className="px-4 py-3 text-gray-500 hidden md:table-cell">
                      {p.registered_at ? format(new Date(p.registered_at), 'MMM d, yyyy h:mm a') : '—'}
                    </td>
                    <td className="px-4 py-3">
                      {p.checked_in ? (
                        <span className="text-green-600 font-medium">✓ Yes</span>
                      ) : (
                        <span className="text-gray-400">No</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right">
                      {!p.checked_in && (
                        <button
                          onClick={() => checkInMutation.mutate(p.id)}
                          disabled={checkInMutation.isPending}
                          className="text-xs bg-blue-600 text-white px-3 py-1.5 rounded-lg hover:bg-blue-700 disabled:opacity-50"
                        >
                          Check In
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {total > 25 && (
              <div className="flex justify-center gap-2 p-4 border-t border-gray-100">
                <button onClick={() => setPage(p => p - 1)} disabled={page <= 1} className="px-3 py-1.5 border rounded-lg text-sm disabled:opacity-40 hover:bg-gray-100">Previous</button>
                <button onClick={() => setPage(p => p + 1)} disabled={participants.length < 25} className="px-3 py-1.5 border rounded-lg text-sm disabled:opacity-40 hover:bg-gray-100">Next</button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
