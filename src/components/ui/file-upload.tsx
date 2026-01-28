
import React, { useRef, useState } from 'react';
import { Upload, X, File } from 'lucide-react';
import { cn } from '@/lib/utils';

interface FileUploadProps {
  onFileSelect: (files: File[]) => void;
  multiple?: boolean;
  accept?: string;
  maxSize?: number; // in MB
  className?: string;
  disabled?: boolean;
  clearAfterSelect?: boolean; // Clear the file list immediately after selection
}

const FileUpload: React.FC<FileUploadProps> = ({
  onFileSelect,
  multiple = false,
  accept = "*/*",
  maxSize = 10,
  className,
  disabled = false,
  clearAfterSelect = false
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);

  const handleFileSelection = (files: FileList | null) => {
    if (!files || disabled) return;
    
    const fileArray = Array.from(files);
    const validFiles = fileArray.filter(file => {
      if (file.size > maxSize * 1024 * 1024) {
        alert(`Le fichier ${file.name} est trop volumineux (max: ${maxSize}MB)`);
        return false;
      }
      return true;
    });

    // Si clearAfterSelect, on n'affiche pas les fichiers sélectionnés (pour les uploads immédiats comme les photos de profil)
    if (!clearAfterSelect) {
      setSelectedFiles(validFiles);
    }
    onFileSelect(validFiles);
    
    // Reset l'input pour permettre de re-sélectionner le même fichier
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    if (!disabled) {
      handleFileSelection(e.dataTransfer.files);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    if (!disabled) {
      setIsDragOver(true);
    }
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const removeFile = (index: number) => {
    if (disabled) return;
    const newFiles = selectedFiles.filter((_, i) => i !== index);
    setSelectedFiles(newFiles);
    onFileSelect(newFiles);
  };

  return (
    <div className={cn("space-y-4", className)}>
      <div
        className={cn(
          "border-2 border-dashed rounded-lg p-6 text-center transition-colors",
          disabled 
            ? "border-muted bg-muted/50 cursor-not-allowed opacity-60" 
            : isDragOver 
              ? "border-primary bg-primary/10 cursor-pointer" 
              : "border-border hover:border-primary/50 cursor-pointer"
        )}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onClick={() => !disabled && fileInputRef.current?.click()}
      >
        <Upload className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
        <p className="text-sm text-muted-foreground">
          Glissez-déposez {multiple ? 'des fichiers' : 'un fichier'} ou cliquez pour parcourir
        </p>
        <p className="text-xs text-muted-foreground/70 mt-1">
          Taille max: {maxSize}MB
        </p>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        multiple={multiple}
        accept={accept}
        onChange={(e) => handleFileSelection(e.target.files)}
        className="hidden"
        disabled={disabled}
      />

      {selectedFiles.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-sm font-medium text-foreground">Fichiers sélectionnés:</h4>
          {selectedFiles.map((file, index) => (
            <div key={index} className="flex items-center justify-between bg-muted p-2 rounded">
              <div className="flex items-center space-x-2">
                <File className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm text-foreground">{file.name}</span>
                <span className="text-xs text-muted-foreground">
                  ({(file.size / 1024 / 1024).toFixed(2)} MB)
                </span>
              </div>
              <button
                onClick={() => removeFile(index)}
                className="text-destructive hover:text-destructive/80"
                disabled={disabled}
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default FileUpload;
