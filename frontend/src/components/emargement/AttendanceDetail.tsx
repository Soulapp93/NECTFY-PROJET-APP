
import React from 'react';
import { CheckCircle } from 'lucide-react';

interface Student {
  id: number;
  name: string;
  present: boolean;
  signedAt: string | null;
}

interface AttendanceDetailProps {
  students: Student[];
}

const AttendanceDetail: React.FC<AttendanceDetailProps> = ({ students }) => {
  const presentStudents = students.filter(s => s.present).length;
  const absentStudents = students.length - presentStudents;
  const attendanceRate = Math.round((presentStudents / students.length) * 100);

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100">
      <div className="p-6 border-b border-gray-200">
        <h2 className="text-xl font-semibold text-gray-900">Détail des présences - Marketing Digital (15/01/2024)</h2>
      </div>
      
      <div className="p-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-4">Liste des étudiants</h3>
            <div className="space-y-3">
              {students.map((student) => (
                <div key={student.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                      student.present ? 'bg-green-100' : 'bg-red-100'
                    }`}>
                      {student.present ? (
                        <CheckCircle className="h-5 w-5 text-green-600" />
                      ) : (
                        <span className="text-red-600 font-bold">X</span>
                      )}
                    </div>
                    <span className="text-sm font-medium text-gray-900">{student.name}</span>
                  </div>
                  <div className="text-sm text-gray-500">
                    {student.present ? `Émargé à ${student.signedAt}` : 'Absent'}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-4">Statistiques</h3>
            <div className="space-y-4">
              <div className="p-4 bg-green-50 rounded-lg">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-green-800">Présents</span>
                  <span className="text-2xl font-bold text-green-600">{presentStudents}</span>
                </div>
              </div>
              <div className="p-4 bg-red-50 rounded-lg">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-red-800">Absents</span>
                  <span className="text-2xl font-bold text-red-600">{absentStudents}</span>
                </div>
              </div>
              <div className="p-4 bg-blue-50 rounded-lg">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-blue-800">Taux de présence</span>
                  <span className="text-2xl font-bold text-blue-600">{attendanceRate}%</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AttendanceDetail;
