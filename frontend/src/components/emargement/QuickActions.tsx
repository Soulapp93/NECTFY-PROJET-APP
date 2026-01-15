
import React from 'react';
import { Plus, Send, Download, FileText } from 'lucide-react';

const QuickActions = () => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
            <Plus className="h-6 w-6 text-purple-600" />
          </div>
          <span className="text-sm text-gray-500">Action</span>
        </div>
        <h3 className="font-medium text-gray-900 mb-2">Créer émargement</h3>
        <p className="text-sm text-gray-600 mb-4">Nouvelle feuille d'émargement</p>
        <button className="w-full bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 text-sm font-medium">
          Créer
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
            <Send className="h-6 w-6 text-blue-600" />
          </div>
          <span className="text-sm text-gray-500">Action</span>
        </div>
        <h3 className="font-medium text-gray-900 mb-2">Envoyer pour signature</h3>
        <p className="text-sm text-gray-600 mb-4">Signature électronique</p>
        <button className="w-full bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 text-sm font-medium">
          Envoyer
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
            <Download className="h-6 w-6 text-green-600" />
          </div>
          <span className="text-sm text-gray-500">Action</span>
        </div>
        <h3 className="font-medium text-gray-900 mb-2">Télécharger PDF</h3>
        <p className="text-sm text-gray-600 mb-4">Exporter en PDF</p>
        <button className="w-full bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 text-sm font-medium">
          Télécharger
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
            <FileText className="h-6 w-6 text-orange-600" />
          </div>
          <span className="text-sm text-gray-500">Archive</span>
        </div>
        <h3 className="font-medium text-gray-900 mb-2">Archiver</h3>
        <p className="text-sm text-gray-600 mb-4">Sauvegarder définitivement</p>
        <button className="w-full bg-orange-600 text-white px-4 py-2 rounded-lg hover:bg-orange-700 text-sm font-medium">
          Archiver
        </button>
      </div>
    </div>
  );
};

export default QuickActions;
