
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

interface MaterialCardProps {
  material: Material;
  onDelete: (id: number) => void;
}

const MaterialCard: React.FC<MaterialCardProps> = ({ material, onDelete }) => {
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
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-shadow group">
      <div className="flex items-center justify-between mb-4">
        <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${getFileColor(material.type)}`}>
          {getFileIcon(material.type)}
        </div>
        <div className="opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            onClick={() => onDelete(material.id)}
            className="p-1 text-gray-400 hover:text-red-600 rounded"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      </div>
      
      <h4 className="font-medium text-gray-900 mb-2 line-clamp-2 text-sm">
        {material.name}
      </h4>
      
      <div className="space-y-1 mb-4">
        <p className="text-xs text-gray-500">{material.size}</p>
        <p className="text-xs text-gray-500">Par {material.uploader}</p>
        <p className="text-xs text-gray-500">{material.downloads} téléchargements</p>
      </div>

      <div className="flex space-x-2">
        <button className="flex-1 bg-purple-600 hover:bg-purple-700 text-white px-3 py-2 rounded-lg text-xs">
          <Download className="h-3 w-3 mr-1 inline" />
          Télécharger
        </button>
        <button className="px-3 py-2 border border-gray-300 rounded-lg text-xs hover:bg-gray-50">
          <Eye className="h-3 w-3" />
        </button>
      </div>
    </div>
  );
};

export default MaterialCard;
