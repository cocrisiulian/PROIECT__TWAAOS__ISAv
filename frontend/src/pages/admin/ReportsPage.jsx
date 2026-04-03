import { useQuery } from '@tanstack/react-query';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts';
import { getEventsPerMonth, getAvgParticipation, getEventsPerOrganizer } from '../../api/admin';
import Navbar from '../../components/layout/Navbar.jsx';

function StatCard({ title, value, sub }) {
  return (
    <div className="bg-white rounded-xl shadow p-5 border border-gray-100">
      <p className="text-sm text-gray-500">{title}</p>
      <p className="text-3xl font-bold text-gray-800 mt-1">{value ?? '—'}</p>
      {sub && <p className="text-xs text-gray-400 mt-1">{sub}</p>}
    </div>
  );
}

export default function ReportsPage() {
  const { data: eventsPerMonth } = useQuery({
    queryKey: ['report-events-per-month'],
    queryFn: () => getEventsPerMonth().then((r) => r.data),
  });

  const { data: avgParticipation } = useQuery({
    queryKey: ['report-avg-participation'],
    queryFn: () => getAvgParticipation().then((r) => r.data),
  });

  const { data: eventsPerOrganizer } = useQuery({
    queryKey: ['report-events-per-organizer'],
    queryFn: () => getEventsPerOrganizer().then((r) => r.data),
  });

  const monthlyRaw = Array.isArray(eventsPerMonth?.data)
    ? eventsPerMonth.data
    : Array.isArray(eventsPerMonth)
      ? eventsPerMonth
      : [];
  const organizerRaw = Array.isArray(eventsPerOrganizer?.data)
    ? eventsPerOrganizer.data
    : Array.isArray(eventsPerOrganizer)
      ? eventsPerOrganizer
      : [];
  const avgRaw = Array.isArray(avgParticipation?.data)
    ? avgParticipation.data
    : Array.isArray(avgParticipation)
      ? avgParticipation
      : [];

  const monthlyData = monthlyRaw.map((row) => ({
    month: `${String(row.month).padStart(2, '0')}/${row.year}`,
    count: row.count ?? 0,
  }));

  const organizerData = organizerRaw.map((row) => ({
    organizer: row.full_name || row.username || '-',
    count: row.published_events ?? row.total_events ?? 0,
  }));

  const avgValue = avgRaw.length
    ? avgRaw.reduce((sum, row) => sum + (row.registration_count || 0), 0) / avgRaw.length
    : null;

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="max-w-6xl mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold text-gray-800 mb-6">Rapoarte</h1>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <StatCard
            title="Medie participanți / eveniment"
            value={avgValue !== null ? Number(avgValue).toFixed(1) : '—'}
            sub="calculat din toate evenimentele"
          />
          <StatCard
            title="Total luni cu date"
            value={monthlyData.length}
            sub="luni cu cel puțin un eveniment"
          />
          <StatCard
            title="Organizatori activi"
            value={organizerData.length}
            sub="cu cel puțin un eveniment"
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Events per month */}
          <div className="bg-white rounded-xl shadow p-5 border border-gray-100">
            <h2 className="font-semibold text-gray-700 mb-4">Evenimente pe lună</h2>
            {monthlyData.length === 0 ? (
              <p className="text-sm text-gray-400">Nu există date.</p>
            ) : (
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={monthlyData} margin={{ left: -20 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip />
                  <Bar dataKey="count" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>

          {/* Events per organizer */}
          <div className="bg-white rounded-xl shadow p-5 border border-gray-100">
            <h2 className="font-semibold text-gray-700 mb-4">Evenimente pe organizator</h2>
            {organizerData.length === 0 ? (
              <p className="text-sm text-gray-400">Nu există date.</p>
            ) : (
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={organizerData} layout="vertical" margin={{ left: 60 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis type="number" tick={{ fontSize: 12 }} />
                  <YAxis dataKey="organizer" type="category" tick={{ fontSize: 11 }} width={100} />
                  <Tooltip />
                  <Bar dataKey="count" fill="#10b981" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
