import { useNavigate } from 'react-router-dom';
import Navbar from '../../components/layout/Navbar.jsx';

export default function AdminDashboard() {
  const navigate = useNavigate();

  const cards = [
    {
      title: 'Gestionare Utilizatori',
      description: 'Adaugă, activează sau dezactivează utilizatori.',
      path: '/admin/users',
      color: 'bg-blue-500',
    },
    {
      title: 'Evenimente în Așteptare',
      description: 'Aprobă sau respinge evenimentele trimise de organizatori.',
      path: '/admin/events/pending',
      color: 'bg-yellow-500',
    },
    {
      title: 'Rapoarte',
      description: 'Vizualizează statistici și rapoarte despre platformă.',
      path: '/admin/reports',
      color: 'bg-green-500',
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="max-w-5xl mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold text-gray-800 mb-8">Panou Administrator</h1>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {cards.map((card) => (
            <button
              key={card.path}
              onClick={() => navigate(card.path)}
              className="text-left p-6 rounded-xl shadow-md bg-white hover:shadow-lg transition border border-gray-100"
            >
              <div className={`w-10 h-10 rounded-full ${card.color} mb-4`} />
              <h2 className="text-lg font-semibold text-gray-800 mb-1">{card.title}</h2>
              <p className="text-sm text-gray-500">{card.description}</p>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
