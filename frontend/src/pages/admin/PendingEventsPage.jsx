import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getPendingEvents, approveEvent, rejectEvent } from '../../api/admin';
import Navbar from '../../components/layout/Navbar.jsx';

export default function PendingEventsPage() {
  const queryClient = useQueryClient();
  const [rejectId, setRejectId] = useState(null);
  const [reason, setReason] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['pending-events'],
    queryFn: () => getPendingEvents().then((r) => r.data),
  });

  const approveMutation = useMutation({
    mutationFn: approveEvent,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['pending-events'] }),
  });

  const rejectMutation = useMutation({
    mutationFn: ({ id, reason }) => rejectEvent(id, reason),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pending-events'] });
      setRejectId(null);
      setReason('');
    },
  });

  const events = Array.isArray(data?.items)
    ? data.items
    : Array.isArray(data?.events)
      ? data.events
      : Array.isArray(data)
        ? data
        : [];

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="max-w-5xl mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold text-gray-800 mb-6">Evenimente în Așteptare</h1>

        {isLoading ? (
          <p className="text-gray-500">Se încarcă...</p>
        ) : events.length === 0 ? (
          <div className="bg-white rounded-xl shadow p-8 text-center text-gray-400 border border-gray-100">
            Nu există evenimente în așteptare.
          </div>
        ) : (
          <div className="space-y-4">
            {events.map((event) => (
              <div key={event.id} className="bg-white rounded-xl shadow p-5 border border-gray-100">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h2 className="font-semibold text-gray-800 text-lg">{event.title}</h2>
                    <p className="text-sm text-gray-500 mt-1">{event.description}</p>
                    <div className="flex gap-4 mt-2 text-xs text-gray-400">
                      <span>📅 {event.start_date ? new Date(event.start_date).toLocaleDateString('ro-RO') : '-'}</span>
                      <span>📍 {event.location || '-'}</span>
                      <span>👤 {event.organizer_name || event.organizer?.full_name || '-'}</span>
                    </div>
                  </div>
                  <div className="flex gap-2 shrink-0">
                    <button
                      onClick={() => approveMutation.mutate(event.id)}
                      disabled={approveMutation.isPending}
                      className="bg-green-600 text-white px-3 py-1.5 rounded-lg text-sm hover:bg-green-700 disabled:opacity-50"
                    >
                      Aprobă
                    </button>
                    <button
                      onClick={() => setRejectId(event.id)}
                      className="bg-red-50 text-red-600 border border-red-200 px-3 py-1.5 rounded-lg text-sm hover:bg-red-100"
                    >
                      Respinge
                    </button>
                  </div>
                </div>
 
                {rejectId === event.id && (
                  <div className="mt-4 border-t pt-4">
                    <textarea
                      className="border rounded-lg px-3 py-2 text-sm w-full"
                      rows={2}
                      placeholder="Motiv respingere (opțional)"
                      value={reason}
                      onChange={(e) => setReason(e.target.value)}
                    />
                    <div className="flex gap-2 mt-2">
                      <button
                        onClick={() => rejectMutation.mutate({ id: event.id, reason })}
                        disabled={rejectMutation.isPending}
                        className="bg-red-600 text-white px-3 py-1.5 rounded-lg text-sm hover:bg-red-700 disabled:opacity-50"
                      >
                        Confirmă respingerea
                      </button>
                      <button
                        onClick={() => { setRejectId(null); setReason(''); }}
                        className="border px-3 py-1.5 rounded-lg text-sm text-gray-600 hover:bg-gray-50"
                      >
                        Anulează
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
