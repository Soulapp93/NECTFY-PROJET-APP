import React, { useState, useEffect } from 'react';
import { 
  X, Download, Maximize2, Minimize2, 
  Folder, File, FileText, Image, Music, Video, FileCode,
  ChevronRight, ChevronDown, Share2, Archive, FolderOpen
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { toast } from 'sonner';

interface ArchiveEntry {
  name: string;
  path: string;
  isDirectory: boolean;
  size: number;
  compressedSize?: number;
  lastModified?: Date;
}

interface ArchiveViewerProps {
  fileUrl: string;
  fileName: string;
  isOpen: boolean;
  onClose: () => void;
  onShare?: (url: string) => void;
}

const ArchiveViewer: React.FC<ArchiveViewerProps> = ({
  fileUrl,
  fileName,
  isOpen,
  onClose,
  onShare
}) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [entries, setEntries] = useState<ArchiveEntry[]>([]);
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set());
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [totalSize, setTotalSize] = useState(0);
  const [fileCount, setFileCount] = useState(0);
  const [folderCount, setFolderCount] = useState(0);

  const containerRef = React.useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen) return;

    const loadArchive = async () => {
      setLoading(true);
      setError(false);

      try {
        // Fetch the archive file
        const response = await fetch(fileUrl);
        if (!response.ok) throw new Error('Failed to fetch');
        
        const blob = await response.blob();
        const arrayBuffer = await blob.arrayBuffer();

        // Import JSZip dynamically
        const JSZip = (await import('jszip')).default;
        const zip = await JSZip.loadAsync(arrayBuffer);

        const archiveEntries: ArchiveEntry[] = [];
        let total = 0;
        let files = 0;
        let folders = 0;

        zip.forEach((relativePath, zipEntry) => {
          if (!zipEntry.dir) {
            files++;
            // @ts-ignore
            total += zipEntry._data?.uncompressedSize || 0;
          } else {
            folders++;
          }

          archiveEntries.push({
            name: zipEntry.name.split('/').filter(Boolean).pop() || zipEntry.name,
            path: relativePath,
            isDirectory: zipEntry.dir,
            // @ts-ignore
            size: zipEntry._data?.uncompressedSize || 0,
            // @ts-ignore
            compressedSize: zipEntry._data?.compressedSize || 0,
            lastModified: zipEntry.date
          });
        });

        // Sort: directories first, then alphabetically
        archiveEntries.sort((a, b) => {
          if (a.isDirectory && !b.isDirectory) return -1;
          if (!a.isDirectory && b.isDirectory) return 1;
          return a.path.localeCompare(b.path);
        });

        setEntries(archiveEntries);
        setTotalSize(total);
        setFileCount(files);
        setFolderCount(folders);
        setLoading(false);
      } catch (err) {
        console.error('Error loading archive:', err);
        setError(true);
        setLoading(false);
        toast.error('Impossible de charger l\'archive');
      }
    };

    loadArchive();
  }, [fileUrl, isOpen]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;

      if (e.key === 'Escape') {
        if (isFullscreen) {
          exitFullscreen();
        } else {
          onClose();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, isFullscreen, onClose]);

  if (!isOpen) return null;

  const toggleFullscreen = async () => {
    if (!containerRef.current) return;
    try {
      if (!document.fullscreenElement) {
        await containerRef.current.requestFullscreen();
        setIsFullscreen(true);
      } else {
        await exitFullscreen();
      }
    } catch (err) {
      console.error('Fullscreen error:', err);
    }
  };

  const exitFullscreen = async () => {
    if (document.fullscreenElement) {
      await document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  const handleDownload = () => {
    fetch(fileUrl)
      .then(response => response.blob())
      .then(blob => {
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = fileName;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
        toast.success('Téléchargement démarré');
      })
      .catch(() => {
        window.open(fileUrl, '_blank');
      });
  };

  const handleShare = () => {
    if (onShare) {
      onShare(fileUrl);
    } else {
      navigator.clipboard.writeText(fileUrl).then(() => {
        toast.success('Lien copié dans le presse-papier');
      });
    }
  };

  const toggleFolder = (path: string) => {
    setExpandedFolders(prev => {
      const newSet = new Set(prev);
      if (newSet.has(path)) {
        newSet.delete(path);
      } else {
        newSet.add(path);
      }
      return newSet;
    });
  };

  const formatSize = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  const getFileIcon = (name: string, isDirectory: boolean) => {
    if (isDirectory) {
      return <FolderOpen className="h-4 w-4 text-yellow-500" />;
    }

    const ext = name.split('.').pop()?.toLowerCase() || '';
    
    const imageExts = ['jpg', 'jpeg', 'png', 'gif', 'bmp', 'svg', 'webp', 'ico'];
    const audioExts = ['mp3', 'wav', 'ogg', 'flac', 'm4a', 'aac'];
    const videoExts = ['mp4', 'webm', 'mov', 'avi', 'mkv', 'wmv'];
    const codeExts = ['js', 'jsx', 'ts', 'tsx', 'py', 'java', 'c', 'cpp', 'h', 'html', 'css', 'json', 'xml', 'php', 'rb', 'go', 'rs'];
    const textExts = ['txt', 'md', 'log', 'csv', 'rtf'];

    if (imageExts.includes(ext)) return <Image className="h-4 w-4 text-green-500" />;
    if (audioExts.includes(ext)) return <Music className="h-4 w-4 text-purple-500" />;
    if (videoExts.includes(ext)) return <Video className="h-4 w-4 text-red-500" />;
    if (codeExts.includes(ext)) return <FileCode className="h-4 w-4 text-blue-500" />;
    if (textExts.includes(ext)) return <FileText className="h-4 w-4 text-gray-500" />;
    
    return <File className="h-4 w-4 text-muted-foreground" />;
  };

  // Build tree structure
  const buildTree = () => {
    const tree: Map<string, ArchiveEntry[]> = new Map();
    tree.set('', []);

    entries.forEach(entry => {
      const parts = entry.path.split('/').filter(Boolean);
      
      if (parts.length === 1) {
        tree.get('')!.push(entry);
      } else {
        const parentPath = parts.slice(0, -1).join('/') + '/';
        if (!tree.has(parentPath)) {
          tree.set(parentPath, []);
        }
        tree.get(parentPath)!.push(entry);
      }
    });

    return tree;
  };

  const renderEntry = (entry: ArchiveEntry, depth: number = 0) => {
    const tree = buildTree();
    const childEntries = tree.get(entry.path) || [];
    const isExpanded = expandedFolders.has(entry.path);

    return (
      <div key={entry.path}>
        <div 
          className={`flex items-center gap-2 px-2 py-1.5 hover:bg-muted/50 rounded-lg cursor-pointer transition-colors ${
            entry.isDirectory ? 'font-medium' : ''
          }`}
          style={{ paddingLeft: `${depth * 16 + 8}px` }}
          onClick={() => entry.isDirectory && toggleFolder(entry.path)}
        >
          {entry.isDirectory && (
            <span className="w-4 h-4 flex items-center justify-center">
              {isExpanded ? (
                <ChevronDown className="h-3 w-3" />
              ) : (
                <ChevronRight className="h-3 w-3" />
              )}
            </span>
          )}
          
          {!entry.isDirectory && <span className="w-4" />}
          
          {getFileIcon(entry.name, entry.isDirectory)}
          
          <span className="flex-1 text-sm truncate">{entry.name}</span>
          
          {!entry.isDirectory && (
            <span className="text-xs text-muted-foreground">
              {formatSize(entry.size)}
            </span>
          )}
        </div>

        {entry.isDirectory && isExpanded && (
          <div>
            {childEntries.map(child => renderEntry(child, depth + 1))}
          </div>
        )}
      </div>
    );
  };

  const rootEntries = entries.filter(e => {
    const parts = e.path.split('/').filter(Boolean);
    return parts.length === 1;
  });

  return (
    <div
      ref={containerRef}
      className="fixed inset-0 z-50 bg-background flex flex-col"
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-card/50 backdrop-blur-sm flex-shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center">
            <Archive className="h-5 w-5 text-white" />
          </div>
          <div>
            <h2 className="text-sm font-medium truncate max-w-md">{fileName}</h2>
            <div className="flex items-center gap-3 text-xs text-muted-foreground">
              <span>{fileCount} fichiers</span>
              <span>•</span>
              <span>{folderCount} dossiers</span>
              <span>•</span>
              <span>{formatSize(totalSize)} total</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" onClick={handleShare} className="h-8 w-8">
            <Share2 className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon" onClick={handleDownload} className="h-8 w-8">
            <Download className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon" onClick={toggleFullscreen} className="h-8 w-8">
            {isFullscreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
          </Button>
          <div className="h-6 w-px bg-border" />
          <Button variant="ghost" size="icon" onClick={onClose} className="h-8 w-8">
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Content */}
      <ScrollArea className="flex-1">
        {loading && (
          <div className="flex items-center justify-center h-full">
            <div className="flex flex-col items-center gap-3">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              <span className="text-sm text-muted-foreground">Analyse de l'archive...</span>
            </div>
          </div>
        )}

        {error && (
          <div className="flex flex-col items-center justify-center h-full p-8">
            <Archive className="w-16 h-16 mb-4 text-destructive" />
            <div className="text-lg mb-2 text-destructive">Erreur de lecture</div>
            <p className="text-sm text-muted-foreground mb-4">Impossible d'analyser cette archive</p>
            <Button onClick={handleDownload} variant="outline">
              <Download className="h-4 w-4 mr-2" />
              Télécharger
            </Button>
          </div>
        )}

        {!loading && !error && (
          <div className="p-4">
            {/* Stats bar */}
            <div className="flex items-center gap-4 mb-4 p-3 bg-muted/30 rounded-lg">
              <div className="flex items-center gap-2">
                <Folder className="h-4 w-4 text-yellow-500" />
                <span className="text-sm">{folderCount} dossiers</span>
              </div>
              <div className="flex items-center gap-2">
                <File className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm">{fileCount} fichiers</span>
              </div>
              <div className="flex items-center gap-2">
                <Archive className="h-4 w-4 text-primary" />
                <span className="text-sm">{formatSize(totalSize)}</span>
              </div>
            </div>

            {/* File tree */}
            <div className="space-y-0.5">
              {rootEntries.map(entry => renderEntry(entry))}
            </div>

            {entries.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                <Archive className="h-12 w-12 mx-auto mb-3 opacity-50" />
                <p>Archive vide</p>
              </div>
            )}
          </div>
        )}
      </ScrollArea>
    </div>
  );
};

export default ArchiveViewer;