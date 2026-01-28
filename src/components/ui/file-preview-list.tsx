import React, { useMemo } from 'react';
import { X, FileText, Image, FileSpreadsheet, Presentation, File, Eye } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface FilePreviewListProps {
  files: File[];
  onRemove: (index: number) => void;
  className?: string;
}

const getFileIcon = (file: File) => {
  const type = file.type.toLowerCase();
  const name = file.name.toLowerCase();
  
  if (type.startsWith('image/')) return Image;
  if (type === 'application/pdf' || name.endsWith('.pdf')) return FileText;
  if (type.includes('spreadsheet') || name.endsWith('.xlsx') || name.endsWith('.xls') || name.endsWith('.csv')) return FileSpreadsheet;
  if (type.includes('presentation') || name.endsWith('.pptx') || name.endsWith('.ppt')) return Presentation;
  if (type.includes('word') || name.endsWith('.docx') || name.endsWith('.doc')) return FileText;
  return File;
};

const formatFileSize = (bytes: number) => {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
};

const FilePreviewList: React.FC<FilePreviewListProps> = ({ files, onRemove, className }) => {
  const filePreviews = useMemo(() => {
    return files.map((file, index) => {
      const isImage = file.type.startsWith('image/');
      const preview = isImage ? URL.createObjectURL(file) : null;
      return { file, preview, index };
    });
  }, [files]);

  // Cleanup object URLs on unmount
  React.useEffect(() => {
    return () => {
      filePreviews.forEach(({ preview }) => {
        if (preview) URL.revokeObjectURL(preview);
      });
    };
  }, [filePreviews]);

  if (files.length === 0) return null;

  return (
    <div className={cn("mt-4 space-y-3", className)}>
      <h4 className="text-sm font-medium text-foreground">Fichiers sélectionnés ({files.length})</h4>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {filePreviews.map(({ file, preview, index }) => {
          const FileIcon = getFileIcon(file);
          const isImage = file.type.startsWith('image/');

          return (
            <div
              key={index}
              className="relative group flex items-center gap-3 p-3 bg-muted/50 rounded-lg border border-border hover:border-primary/50 transition-colors"
            >
              {/* Preview thumbnail */}
              <div className="flex-shrink-0 w-14 h-14 rounded-md overflow-hidden bg-background border border-border flex items-center justify-center">
                {isImage && preview ? (
                  <img
                    src={preview}
                    alt={file.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <FileIcon className="h-6 w-6 text-muted-foreground" />
                )}
              </div>

              {/* File info */}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground truncate" title={file.name}>
                  {file.name}
                </p>
                <p className="text-xs text-muted-foreground">
                  {formatFileSize(file.size)}
                </p>
                <p className="text-xs text-muted-foreground capitalize">
                  {file.type.split('/')[1] || 'Fichier'}
                </p>
              </div>

              {/* Remove button */}
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="absolute top-1 right-1 h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-destructive/10 hover:text-destructive"
                onClick={() => onRemove(index)}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default FilePreviewList;
