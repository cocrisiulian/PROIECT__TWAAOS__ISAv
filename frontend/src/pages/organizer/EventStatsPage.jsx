import { useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { getEventStats } from '../../api/organizer.js';
import PageFrame from '../../components/layout/PageFrame.jsx';

function StatCard({ label, value, sub }) {
  return (
    <div className="usv-card usv-card-body">
      <p className="text-sm text-gray-500">{label}</p>
      <p className="text-3xl font-bold text-gray-900 mt-1">{value ?? '—'}</p>
      {sub && <p className="text-xs text-gray-400 mt-1">{sub}</p>}
    </div>
  );
}

export default function EventStatsPage() {
  const { id } = useParams();

  const { data: stats, isLoading } = useQuery({
    queryKey: ['event-stats', id],
    queryFn: () => getEventStats(id).then(r => r.data),
  });

  const ratingData = stats ? [1, 2, 3, 4, 5].map(r => ({
    stars: `${r}★`,
    count: stats.rating_distribution?.[r] || 0,
  })) : [];

  const checkinRate = stats?.registration_count
    ? Math.round((stats.checked_in_count / stats.registration_count) * 100)
    : 0;

  return (
    <PageFrame width="6xl" title="Event Statistics" contentClassName="space-y-8">
      {isLoading ? (
        <div className="flex justify-center py-20">
          <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            <StatCard label="Registrations" value={stats?.registration_count} />
            <StatCard label="Checked In" value={stats?.checked_in_count} sub={`${checkinRate}% check-in rate`} />
            <StatCard label="Feedback Count" value={stats?.feedback_count} />
            <StatCard
              label="Avg Rating"
              value={stats?.avg_rating ? `${Number(stats.avg_rating).toFixed(1)} ★` : '—'}
            />
          </div>

          {ratingData.some(d => d.count > 0) && (
            <div className="usv-card usv-card-body">
              <h2 className="text-base font-semibold text-gray-800 mb-4">Rating Distribution</h2>
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={ratingData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="stars" />
                  <YAxis allowDecimals={false} />
                  <Tooltip />
                  <Bar dataKey="count" fill="#3B82F6" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </>
      )}
    </PageFrame>
  );
}
