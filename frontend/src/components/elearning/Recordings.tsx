
import React, { useState } from 'react';
import { Play, Download, MoreVertical, Clock, Eye, Trash2, Edit, Search } from 'lucide-react';

interface Recording {
  id: number;
  title: string;
  duration: string;
  date: string;
  views: number;
  size: string;
  instructor: string;
  thumbnail: string;
}

const Recordings: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('date');

  const [recordings, setRecordings] = useState<Recording[]>([
    {
      id: 1,
      title: 'Marketing Digital - Session 1',
      duration: '2h 15m',
      date: '2024-01-10',
      views: 45,
      size: '1.2 GB',
      instructor: 'Formateur Prof',
      thumbnail: '/placeholder.svg'
    },
    {
      id: 2,
      title: 'Communication Digitale - Introduction',
      duration: '1h 30m',
      date: '2024-01-08',
      views: 32,
      size: '850 MB',
      instructor: 'Marie Dupont',
      thumbnail: '/placeholder.svg'
    },
    {
      id: 3,
      title: 'Photoshop Avancé - Techniques de base',
      duration: '3h 05m',
      date: '2024-01-05',
      views: 67,
      size: '2.1 GB',
      instructor: 'Jean Martin',
      thumbnail: '/placeholder.svg'
    },
    {
      id: 4,
      title: 'Stratégie Marketing - Analyse concurrentielle',
      duration: '1h 45m',
      date: '2024-01-03',
      views: 28,
      size: '980 MB',
      instructor: 'Formateur Prof',
      thumbnail: '/placeholder.svg'
    }
  ]);

  const filteredRecordings = recordings.filter(recording =>
    recording.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    recording.instructor.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const sortedRecordings = [...filteredRecordings].sort((a, b) => {
    switch (sortBy) {
      case 'date':
        return new Date(b.date).getTime() - new Date(a.date).getTime();
      case 'views':
        return b.views - a.views;
      case 'duration':
        return b.duration.localeCompare(a.duration);
      default:
        return 0;
    }
  });

  const handleDeleteRecording = (recordingId: number) => {
    if (confirm('Êtes-vous sûr de vouloir supprimer cet enregistrement ?')) {
      setRecordings(recordings.filter(r => r.id !== recordingId));
    }
  };

  return (
    <div>
      {/* Controls */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-6">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Rechercher un enregistrement..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            />
          </div>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
          >
            <option value="date">Trier par date</option>
            <option value="views">Trier par vues</option>
            <option value="duration">Trier par durée</option>
          </select>
        </div>
      </div>

      {/* Recordings Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {sortedRecordings.map((recording) => (
          <div key={recording.id} className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden group">
            <div className="relative">
              <div className="h-48 bg-gradient-to-br from-purple-500 to-blue-600 flex items-center justify-center">
                <Play className="h-16 w-16 text-white opacity-80" />
              </div>
              <div className="absolute top-3 left-3 bg-black bg-opacity-75 text-white px-2 py-1 rounded text-sm">
                {recording.duration}
              </div>
              <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity">
                <div className="flex space-x-1">
                  <button className="p-2 bg-white rounded-full shadow-md hover:bg-gray-50">
                    <Edit className="h-4 w-4 text-gray-600" />
                  </button>
                  <button 
                    onClick={() => handleDeleteRecording(recording.id)}
                    className="p-2 bg-white rounded-full shadow-md hover:bg-gray-50"
                  >
                    <Trash2 className="h-4 w-4 text-red-600" />
                  </button>
                </div>
              </div>
            </div>
            
            <div className="p-4">
              <h3 className="font-semibold text-gray-900 mb-2 line-clamp-2">
                {recording.title}
              </h3>
              <p className="text-sm text-gray-600 mb-3">Par {recording.instructor}</p>
              
              <div className="flex items-center justify-between text-sm text-gray-500 mb-4">
                <div className="flex items-center">
                  <Eye className="h-4 w-4 mr-1" />
                  {recording.views} vues
                </div>
                <div className="flex items-center">
                  <Clock className="h-4 w-4 mr-1" />
                  {recording.date}
                </div>
              </div>

              <div className="flex space-x-2">
                <button className="flex-1 bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg font-medium text-sm flex items-center justify-center">
                  <Play className="h-4 w-4 mr-1" />
                  Lire
                </button>
                <button className="px-4 py-2 border border-gray-300 rounded-lg text-sm hover:bg-gray-50">
                  <Download className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {sortedRecordings.length === 0 && (
        <div className="bg-gray-50 rounded-xl p-8 text-center">
          <Play className="h-12 w-12 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Aucun enregistrement trouvé</h3>
          <p className="text-gray-600">
            {searchTerm ? 'Aucun enregistrement ne correspond à votre recherche.' : 'Aucun enregistrement disponible pour le moment.'}
          </p>
        </div>
      )}
    </div>
  );
};

export default Recordings;
