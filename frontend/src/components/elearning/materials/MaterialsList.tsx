
import React from 'react';
import { FileText, Download, Eye, Trash2, Video, Image, File } from 'lucide-react';

interface Material {
  id: number;
  name: string;
  type: 'pdf' | 'docx' | 'pptx' | 'mp4' | 'zip' | 'jpg' | 'png';
  size: string;
  uploadDate: string;
  category: string;
  uploader: string;
  downloads: number;
}

interface MaterialsListProps {
  materials: Material[];
  onDelete: (id: number) => void;
}

const MaterialsList: React.FC<MaterialsListProps> = ({ materials, onDelete }) => {
  const getFileIcon = (type: string) => {
    switch (type) {
      case 'pdf':
      case 'docx':
      case 'pptx':
        return <FileText className="h-8 w-8" />;
      case 'mp4':
        return <Video className="h-8 w-8" />;
      case 'jpg':
      case 'png':
        return <Image className="h-8 w-8" />;
      default:
        return <File className="h-8 w-8" />;
    }
  };

  const getFileColor = (type: string) => {
    switch (type) {
      case 'pdf':
        return 'bg-red-100 text-red-600';
      case 'docx':
        return 'bg-blue-100 text-blue-600';
      case 'pptx':
        return 'bg-orange-100 text-orange-600';
      case 'mp4':
        return 'bg-purple-100 text-purple-600';
      case 'zip':
        return 'bg-gray-100 text-gray-600';
      default:
        return 'bg-green-100 text-green-600';
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Nom</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Taille</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Catégorie</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Ajouté par</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {materials.map((material) => (
              <tr key={material.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center mr-3 ${getFileColor(material.type)}`}>
                      {getFileIcon(material.type)}
                    </div>
                    <span className="text-sm text-gray-900">{material.name}</span>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{material.size}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{material.category}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{material.uploader}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{material.uploadDate}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                  <div className="flex space-x-2">
                    <button className="text-purple-600 hover:text-purple-900">
                      <Download className="h-4 w-4" />
                    </button>
                    <button className="text-blue-600 hover:text-blue-900">
                      <Eye className="h-4 w-4" />
                    </button>
                    <button 
                      onClick={() => onDelete(material.id)}
                      className="text-red-600 hover:text-red-900"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default MaterialsList;
