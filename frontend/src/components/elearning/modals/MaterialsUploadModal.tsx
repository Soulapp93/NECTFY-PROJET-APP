import React, { useState, useCallback } from 'react';
import { Upload, X, FileText, Image, Video, File } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { Card, CardContent } from '@/components/ui/card';
import { toast } from '@/hooks/use-toast';

interface MaterialsUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  classId: string;
  onUploadComplete?: (materials: any[]) => void;
}

interface UploadFile {
  file: File;
  progress: number;
  status: 'pending' | 'uploading' | 'completed' | 'error';
  id: string;
}

const MaterialsUploadModal: React.FC<MaterialsUploadModalProps> = ({
  isOpen,
  onClose,
  classId,
  onUploadComplete
}) => {
  const [files, setFiles] = useState<UploadFile[]>([]);
  const [dragActive, setDragActive] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  const getFileIcon = (type: string) => {
    if (type.startsWith('image/')) return <Image className="h-8 w-8" />;
    if (type.startsWith('video/')) return <Video className="h-8 w-8" />;
    if (type.includes('pdf') || type.includes('document')) return <FileText className="h-8 w-8" />;
    return <File className="h-8 w-8" />;
  };

  const getFileColor = (type: string) => {
    if (type.startsWith('image/')) return 'bg-green-100 text-green-600';
    if (type.startsWith('video/')) return 'bg-purple-100 text-purple-600';
    if (type.includes('pdf')) return 'bg-red-100 text-red-600';
    if (type.includes('document')) return 'bg-blue-100 text-blue-600';
    return 'bg-gray-100 text-gray-600';
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    const droppedFiles = Array.from(e.dataTransfer.files);
    addFiles(droppedFiles);
  }, []);

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const selectedFiles = Array.from(e.target.files);
      addFiles(selectedFiles);
    }
  };

  const addFiles = (newFiles: File[]) => {
    const uploadFiles: UploadFile[] = newFiles.map(file => ({
      file,
      progress: 0,
      status: 'pending',
      id: Math.random().toString(36).substring(7)
    }));
    
    setFiles(prev => [...prev, ...uploadFiles]);
  };

  const removeFile = (id: string) => {
    setFiles(prev => prev.filter(f => f.id !== id));
  };

  const simulateUpload = async (fileId: string) => {
    // Simuler le processus d'upload
    for (let progress = 0; progress <= 100; progress += 10) {
      await new Promise(resolve => setTimeout(resolve, 100));
      setFiles(prev => prev.map(f => 
        f.id === fileId ? { ...f, progress, status: 'uploading' as const } : f
      ));
    }
    
    setFiles(prev => prev.map(f => 
      f.id === fileId ? { ...f, status: 'completed' as const } : f
    ));
  };

  const handleUpload = async () => {
    setIsUploading(true);
    
    try {
      // Simuler l'upload de chaque fichier
      const uploadPromises = files
        .filter(f => f.status === 'pending')
        .map(f => simulateUpload(f.id));
      
      await Promise.all(uploadPromises);
      
      toast({
        title: "Upload terminé",
        description: `${files.length} fichier(s) uploadé(s) avec succès.`,
      });
      
      // Appeler le callback avec les fichiers uploadés
      if (onUploadComplete) {
        const materials = files.map(f => ({
          name: f.file.name,
          size: f.file.size,
          type: f.file.type,
          classId
        }));
        onUploadComplete(materials);
      }
      
      onClose();
      setFiles([]);
    } catch (error) {
      toast({
        title: "Erreur d'upload",
        description: "Une erreur est survenue lors de l'upload des fichiers.",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Upload de ressources</DialogTitle>
          <DialogDescription>
            Ajoutez des fichiers à partager pendant le cours
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Drop Zone */}
          <Card 
            className={`border-2 border-dashed transition-colors ${
              dragActive 
                ? 'border-primary bg-primary/10' 
                : 'border-muted-foreground/25 hover:border-muted-foreground/50'
            }`}
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
          >
            <CardContent className="p-8 text-center">
              <Upload className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <h3 className="text-lg font-medium mb-2">
                Déposez vos fichiers ici
              </h3>
              <p className="text-muted-foreground mb-4">
                ou cliquez pour sélectionner des fichiers
              </p>
              <input
                type="file"
                multiple
                onChange={handleFileInput}
                className="hidden"
                id="file-input"
                accept=".pdf,.doc,.docx,.ppt,.pptx,.jpg,.jpeg,.png,.mp4,.mov,.avi"
              />
              <Button asChild>
                <label htmlFor="file-input" className="cursor-pointer">
                  Sélectionner des fichiers
                </label>
              </Button>
              <p className="text-xs text-muted-foreground mt-2">
                Types supportés: PDF, DOC, PPT, Images, Vidéos (Max 50MB par fichier)
              </p>
            </CardContent>
          </Card>

          {/* Files List */}
          {files.length > 0 && (
            <div className="space-y-3">
              <h4 className="font-medium">Fichiers sélectionnés ({files.length})</h4>
              {files.map((uploadFile) => (
                <div key={uploadFile.id} className="flex items-center space-x-3 p-3 bg-muted/50 rounded-lg">
                  <div className={`w-10 h-10 rounded flex items-center justify-center ${getFileColor(uploadFile.file.type)}`}>
                    {getFileIcon(uploadFile.file.type)}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium truncate">
                      {uploadFile.file.name}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {formatFileSize(uploadFile.file.size)}
                    </div>
                    {uploadFile.status === 'uploading' && (
                      <Progress value={uploadFile.progress} className="mt-2" />
                    )}
                  </div>
                  
                  <div className="text-xs">
                    {uploadFile.status === 'pending' && (
                      <span className="text-muted-foreground">En attente</span>
                    )}
                    {uploadFile.status === 'uploading' && (
                      <span className="text-primary">Upload... {uploadFile.progress}%</span>
                    )}
                    {uploadFile.status === 'completed' && (
                      <span className="text-success">Terminé</span>
                    )}
                    {uploadFile.status === 'error' && (
                      <span className="text-destructive">Erreur</span>
                    )}
                  </div>
                  
                  {uploadFile.status === 'pending' && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeFile(uploadFile.id)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Actions */}
          <div className="flex justify-end space-x-2">
            <Button variant="outline" onClick={onClose}>
              Annuler
            </Button>
            {files.length > 0 && (
              <Button 
                onClick={handleUpload} 
                disabled={isUploading || files.every(f => f.status === 'completed')}
              >
                {isUploading ? 'Upload en cours...' : 'Uploader les fichiers'}
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default MaterialsUploadModal;