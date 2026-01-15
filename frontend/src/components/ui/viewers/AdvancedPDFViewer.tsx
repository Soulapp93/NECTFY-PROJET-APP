import React, { useState, useEffect, useRef, useCallback } from 'react';
import { 
  X, ZoomIn, ZoomOut, Download, Maximize2, Minimize2, RotateCw, 
  ChevronLeft, ChevronRight, Search, Bookmark, BookmarkPlus,
  Highlighter, MessageSquare, Presentation, Grid3X3, List,
  Printer, ExternalLink, Loader2, FileWarning, Copy, Share2,
  StickyNote, PenTool, Trash2, Eye, EyeOff, PanelLeftClose, PanelLeft
} from 'lucide-react';
import { Document, Page, pdfjs } from 'react-pdf';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

import 'react-pdf/dist/Page/AnnotationLayer.css';
import 'react-pdf/dist/Page/TextLayer.css';

import { configurePdfJsWorker } from '@/lib/pdfWorker';

// Configure PDF.js worker using a local/bundled worker (avoids CDN issues)
configurePdfJsWorker(pdfjs);


interface Annotation {
  id: string;
  pageNumber: number;
  type: 'highlight' | 'note' | 'underline';
  content?: string;
  color: string;
  x: number;
  y: number;
  width?: number;
  height?: number;
  createdAt: Date;
}

interface Bookmark {
  id: string;
  pageNumber: number;
  title: string;
  createdAt: Date;
}

interface AdvancedPDFViewerProps {
  fileUrl: string;
  fileName: string;
  isOpen: boolean;
  onClose: () => void;
  onShare?: (url: string) => void;
}

const AdvancedPDFViewer: React.FC<AdvancedPDFViewerProps> = ({
  fileUrl,
  fileName,
  isOpen,
  onClose,
  onShare
}) => {
  // State for PDF
  const [numPages, setNumPages] = useState<number>(0);
  const [pageNumber, setPageNumber] = useState<number>(1);
  const [scale, setScale] = useState<number>(1.0);
  const [rotation, setRotation] = useState<number>(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Prevent infinite loading states
  const loadingRef = useRef<boolean>(true);
  useEffect(() => {
    loadingRef.current = loading;
  }, [loading]);

  useEffect(() => {
    if (!isOpen) return;

    // Reset when file changes / viewer opens
    setLoading(true);
    setError(null);

    const watchdogId = window.setTimeout(() => {
      if (!loadingRef.current) return;
      setLoading(false);
      setError('Le document met trop de temps à charger. Essayez de l’ouvrir dans un nouvel onglet ou de le télécharger.');
      toast.error('Chargement trop long');
    }, 20000);

    return () => window.clearTimeout(watchdogId);
  }, [isOpen, fileUrl]);

  // State for features
  const [showThumbnails, setShowThumbnails] = useState(true);
  const [showAnnotations, setShowAnnotations] = useState(true);
  const [isPresentationMode, setIsPresentationMode] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<number[]>([]);
  const [currentSearchIndex, setCurrentSearchIndex] = useState(0);
  const [isSearching, setIsSearching] = useState(false);

  // Annotations & Bookmarks
  const [annotations, setAnnotations] = useState<Annotation[]>([]);
  const [bookmarks, setBookmarks] = useState<Bookmark[]>([]);
  const [activeAnnotationTool, setActiveAnnotationTool] = useState<'highlight' | 'note' | 'underline' | null>(null);
  const [selectedColor, setSelectedColor] = useState('#FFEB3B');
  const [newNoteContent, setNewNoteContent] = useState('');
  const [pendingNotePosition, setPendingNotePosition] = useState<{x: number, y: number} | null>(null);

  // View mode
  const [viewMode, setViewMode] = useState<'single' | 'grid'>('single');

  // Refs
  const containerRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const documentRef = useRef<any>(null);

  // Colors for annotations
  const annotationColors = ['#FFEB3B', '#4CAF50', '#2196F3', '#F44336', '#E91E63', '#9C27B0'];

  // LocalStorage can throw in some environments (Safari private mode, blocked storage, quota exceeded).
  const safeStorage = {
    getItem: (key: string) => {
      try {
        return window.localStorage.getItem(key);
      } catch {
        return null;
      }
    },
    setItem: (key: string, value: string) => {
      try {
        window.localStorage.setItem(key, value);
      } catch {
        // ignore
      }
    },
    removeItem: (key: string) => {
      try {
        window.localStorage.removeItem(key);
      } catch {
        // ignore
      }
    },
  };

  // Load annotations from localStorage
  useEffect(() => {
    if (isOpen && fileName) {
      const savedAnnotations = safeStorage.getItem(`pdf-annotations-${fileName}`);
      const savedBookmarks = safeStorage.getItem(`pdf-bookmarks-${fileName}`);
      try {
        if (savedAnnotations) setAnnotations(JSON.parse(savedAnnotations));
        if (savedBookmarks) setBookmarks(JSON.parse(savedBookmarks));
      } catch {
        // Ignore corrupted storage payloads
      }
    }
  }, [isOpen, fileName]);

  // Save annotations to localStorage
  useEffect(() => {
    if (fileName && annotations.length > 0) {
      safeStorage.setItem(`pdf-annotations-${fileName}`, JSON.stringify(annotations));
    }
  }, [annotations, fileName]);

  useEffect(() => {
    if (fileName && bookmarks.length > 0) {
      safeStorage.setItem(`pdf-bookmarks-${fileName}`, JSON.stringify(bookmarks));
    }
  }, [bookmarks, fileName]);

  // Fullscreen handling
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;

      if (e.key === 'Escape') {
        if (isPresentationMode) {
          setIsPresentationMode(false);
        } else if (isFullscreen) {
          exitFullscreen();
        } else {
          onClose();
        }
      }
      
      if (isPresentationMode || viewMode === 'single') {
        if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
          e.preventDefault();
          goToPreviousPage();
        }
        if (e.key === 'ArrowRight' || e.key === 'ArrowDown' || e.key === ' ') {
          e.preventDefault();
          goToNextPage();
        }
      }

      if ((e.ctrlKey || e.metaKey) && e.key === 'f') {
        e.preventDefault();
        setIsSearching(true);
      }

      if ((e.ctrlKey || e.metaKey) && e.key === 'b') {
        e.preventDefault();
        addBookmark();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, isPresentationMode, isFullscreen, pageNumber, numPages, onClose]);

  if (!isOpen) return null;

  const onDocumentLoadSuccess = ({ numPages }: { numPages: number }) => {
    setNumPages(numPages);
    setLoading(false);
    setError(null);
  };

  const onDocumentLoadError = (error: Error) => {
    console.error('PDF load error:', error);
    setError("Impossible de charger le document PDF. Essayez d'ouvrir dans un nouvel onglet.");
    setLoading(false);
    toast.error('Erreur lors du chargement du document');
  };

  const goToNextPage = () => {
    if (pageNumber < numPages) setPageNumber(pageNumber + 1);
  };

  const goToPreviousPage = () => {
    if (pageNumber > 1) setPageNumber(pageNumber - 1);
  };

  const handleZoomIn = () => setScale(prev => Math.min(prev + 0.25, 3.0));
  const handleZoomOut = () => setScale(prev => Math.max(prev - 0.25, 0.5));
  const handleRotate = () => setRotation(prev => (prev + 90) % 360);

  const toggleFullscreen = async () => {
    if (!containerRef.current) return;
    try {
      if (!document.fullscreenElement) {
        await containerRef.current.requestFullscreen();
      } else {
        await exitFullscreen();
      }
    } catch (err) {
      console.error('Fullscreen error:', err);
      toast.error('Erreur mode plein écran');
    }
  };

  const exitFullscreen = async () => {
    if (document.fullscreenElement) {
      await document.exitFullscreen();
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

  const handlePrint = () => {
    const printWindow = window.open(fileUrl, '_blank');
    if (printWindow) {
      printWindow.onload = () => printWindow.print();
    }
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

  // Search functionality
  const handleSearch = useCallback(async () => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      return;
    }

    // Simple search - finds pages containing the text
    // In a real implementation, you'd use pdf.js text content extraction
    const results: number[] = [];
    for (let i = 1; i <= numPages; i++) {
      // This is a placeholder - real implementation would extract text from each page
      results.push(i);
    }
    
    setSearchResults(results.slice(0, 10));
    if (results.length > 0) {
      setPageNumber(results[0]);
      toast.info(`${results.length} résultat(s) trouvé(s)`);
    } else {
      toast.info('Aucun résultat trouvé');
    }
  }, [searchQuery, numPages]);

  const goToNextSearchResult = () => {
    if (searchResults.length > 0) {
      const nextIndex = (currentSearchIndex + 1) % searchResults.length;
      setCurrentSearchIndex(nextIndex);
      setPageNumber(searchResults[nextIndex]);
    }
  };

  const goToPreviousSearchResult = () => {
    if (searchResults.length > 0) {
      const prevIndex = currentSearchIndex === 0 ? searchResults.length - 1 : currentSearchIndex - 1;
      setCurrentSearchIndex(prevIndex);
      setPageNumber(searchResults[prevIndex]);
    }
  };

  // Bookmark functionality
  const addBookmark = () => {
    const existingBookmark = bookmarks.find(b => b.pageNumber === pageNumber);
    if (existingBookmark) {
      toast.info('Cette page est déjà dans vos marque-pages');
      return;
    }

    const newBookmark: Bookmark = {
      id: `bookmark-${Date.now()}`,
      pageNumber,
      title: `Page ${pageNumber}`,
      createdAt: new Date()
    };
    setBookmarks(prev => [...prev, newBookmark]);
    toast.success('Marque-page ajouté');
  };

  const removeBookmark = (id: string) => {
    setBookmarks(prev => prev.filter(b => b.id !== id));
    toast.success('Marque-page supprimé');
  };

  const goToBookmark = (pageNum: number) => {
    setPageNumber(pageNum);
    setShowThumbnails(false);
  };

  // Annotation functionality
  const handlePageClick = (e: React.MouseEvent<HTMLDivElement>, pageNum: number) => {
    if (!activeAnnotationTool) return;

    const rect = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;

    if (activeAnnotationTool === 'note') {
      setPendingNotePosition({ x, y });
    } else {
      const newAnnotation: Annotation = {
        id: `annotation-${Date.now()}`,
        pageNumber: pageNum,
        type: activeAnnotationTool,
        color: selectedColor,
        x,
        y,
        width: activeAnnotationTool === 'highlight' ? 20 : 15,
        height: activeAnnotationTool === 'highlight' ? 3 : 0.5,
        createdAt: new Date()
      };
      setAnnotations(prev => [...prev, newAnnotation]);
      toast.success('Annotation ajoutée');
    }
  };

  const addNoteAnnotation = () => {
    if (!pendingNotePosition || !newNoteContent.trim()) return;

    const newAnnotation: Annotation = {
      id: `annotation-${Date.now()}`,
      pageNumber,
      type: 'note',
      content: newNoteContent,
      color: selectedColor,
      x: pendingNotePosition.x,
      y: pendingNotePosition.y,
      createdAt: new Date()
    };
    setAnnotations(prev => [...prev, newAnnotation]);
    setNewNoteContent('');
    setPendingNotePosition(null);
    toast.success('Note ajoutée');
  };

  const removeAnnotation = (id: string) => {
    setAnnotations(prev => prev.filter(a => a.id !== id));
    toast.success('Annotation supprimée');
  };

  const clearAllAnnotations = () => {
    setAnnotations([]);
    safeStorage.removeItem(`pdf-annotations-${fileName}`);
    toast.success('Toutes les annotations supprimées');
  };

  // Presentation mode
  const togglePresentationMode = () => {
    setIsPresentationMode(prev => !prev);
    if (!isPresentationMode) {
      setShowThumbnails(false);
      setScale(1.5);
      toast.info('Mode présentation activé. Utilisez les flèches pour naviguer.');
    } else {
      setScale(1.0);
    }
  };

  const getZoomPercentage = () => Math.round(scale * 100);

  // Render annotations overlay
  const renderAnnotations = (pageNum: number) => {
    if (!showAnnotations) return null;

    const pageAnnotations = annotations.filter(a => a.pageNumber === pageNum);

    return (
      <div className="absolute inset-0 pointer-events-none">
        {pageAnnotations.map(annotation => (
          <div
            key={annotation.id}
            className="absolute pointer-events-auto cursor-pointer group"
            style={{
              left: `${annotation.x}%`,
              top: `${annotation.y}%`,
              ...(annotation.type === 'highlight' && {
                width: `${annotation.width}%`,
                height: `${annotation.height}%`,
                backgroundColor: annotation.color,
                opacity: 0.4
              }),
              ...(annotation.type === 'underline' && {
                width: `${annotation.width}%`,
                height: `${annotation.height}%`,
                backgroundColor: annotation.color
              }),
              ...(annotation.type === 'note' && {
                width: '24px',
                height: '24px'
              })
            }}
          >
            {annotation.type === 'note' && (
              <Popover>
                <PopoverTrigger asChild>
                  <div 
                    className="w-6 h-6 rounded-full flex items-center justify-center cursor-pointer shadow-lg"
                    style={{ backgroundColor: annotation.color }}
                  >
                    <StickyNote className="h-3 w-3 text-white" />
                  </div>
                </PopoverTrigger>
                <PopoverContent className="w-64 p-3">
                  <p className="text-sm mb-2">{annotation.content}</p>
                  <Button 
                    size="sm" 
                    variant="destructive" 
                    onClick={() => removeAnnotation(annotation.id)}
                    className="w-full"
                  >
                    <Trash2 className="h-3 w-3 mr-1" />
                    Supprimer
                  </Button>
                </PopoverContent>
              </Popover>
            )}
            {(annotation.type === 'highlight' || annotation.type === 'underline') && (
              <button
                className="absolute -right-2 -top-2 w-4 h-4 bg-destructive rounded-full items-center justify-center hidden group-hover:flex"
                onClick={() => removeAnnotation(annotation.id)}
              >
                <X className="h-2 w-2 text-white" />
              </button>
            )}
          </div>
        ))}
      </div>
    );
  };

  // Render sidebar
  const renderSidebar = () => {
    if (isPresentationMode) return null;

    return (
      <div className={`${showThumbnails ? 'w-64' : 'w-0'} transition-all duration-300 overflow-hidden bg-muted/50 border-r border-border flex flex-col`}>
        {showThumbnails && (
          <>
            {/* Tabs */}
            <div className="flex border-b border-border">
              <button 
                className="flex-1 py-2 px-3 text-xs font-medium hover:bg-muted flex items-center justify-center gap-1"
                onClick={() => {}}
              >
                <Grid3X3 className="h-3 w-3" />
                Pages
              </button>
              <button 
                className="flex-1 py-2 px-3 text-xs font-medium hover:bg-muted flex items-center justify-center gap-1"
                onClick={() => {}}
              >
                <Bookmark className="h-3 w-3" />
                Signets ({bookmarks.length})
              </button>
            </div>

            {/* Thumbnails / Bookmarks */}
            <ScrollArea className="flex-1">
              <div className="p-2 space-y-2">
                {/* Bookmarks section */}
                {bookmarks.length > 0 && (
                  <div className="mb-4">
                    <h4 className="text-xs font-semibold text-muted-foreground mb-2 px-1">Marque-pages</h4>
                    {bookmarks.map(bookmark => (
                      <div
                        key={bookmark.id}
                        className="flex items-center justify-between p-2 rounded-lg bg-background hover:bg-muted cursor-pointer group mb-1"
                        onClick={() => goToBookmark(bookmark.pageNumber)}
                      >
                        <div className="flex items-center gap-2">
                          <Bookmark className="h-3 w-3 text-primary" />
                          <span className="text-xs">{bookmark.title}</span>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-5 w-5 opacity-0 group-hover:opacity-100"
                          onClick={(e) => {
                            e.stopPropagation();
                            removeBookmark(bookmark.id);
                          }}
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}

                {/* Page thumbnails */}
                <h4 className="text-xs font-semibold text-muted-foreground mb-2 px-1">Toutes les pages</h4>
                {Array.from(new Array(numPages), (_, index) => (
                  <div
                    key={`thumb_${index + 1}`}
                    onClick={() => setPageNumber(index + 1)}
                    className={`cursor-pointer p-1 rounded-lg transition-all border-2 ${
                      pageNumber === index + 1
                        ? 'border-primary bg-primary/10'
                        : 'border-transparent hover:border-muted-foreground/30'
                    }`}
                  >
                    <Document
                      file={{ url: fileUrl }}
                      options={{ disableRange: true, disableStream: true }}
                      loading=""
                    >
                      <Page
                        pageNumber={index + 1}
                        width={220}
                        renderTextLayer={false}
                        renderAnnotationLayer={false}
                        className="shadow-sm rounded"
                      />
                    </Document>
                    <div className="flex items-center justify-center gap-1 text-xs text-muted-foreground mt-1">
                      <span>{index + 1}</span>
                      {bookmarks.some(b => b.pageNumber === index + 1) && (
                        <Bookmark className="h-3 w-3 text-primary fill-primary" />
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </>
        )}
      </div>
    );
  };

  // Presentation mode overlay
  if (isPresentationMode) {
    return (
      <div
        ref={containerRef}
        className="fixed inset-0 z-50 bg-black flex flex-col"
      >
        {/* Minimal toolbar */}
        <div className="absolute top-4 right-4 z-10 flex items-center gap-2 bg-black/50 backdrop-blur-sm rounded-full px-4 py-2">
          <span className="text-white text-sm">
            {pageNumber} / {numPages}
          </span>
          <Button
            variant="ghost"
            size="icon"
            onClick={togglePresentationMode}
            className="text-white hover:bg-white/20 h-8 w-8"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Navigation arrows */}
        <button
          onClick={goToPreviousPage}
          disabled={pageNumber <= 1}
          className="absolute left-4 top-1/2 -translate-y-1/2 z-10 p-3 rounded-full bg-white/10 hover:bg-white/20 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
        >
          <ChevronLeft className="h-8 w-8 text-white" />
        </button>

        <button
          onClick={goToNextPage}
          disabled={pageNumber >= numPages}
          className="absolute right-4 top-1/2 -translate-y-1/2 z-10 p-3 rounded-full bg-white/10 hover:bg-white/20 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
        >
          <ChevronRight className="h-8 w-8 text-white" />
        </button>

        {/* PDF Content */}
        <div className="flex-1 flex items-center justify-center overflow-hidden">
          <Document
            file={{ url: fileUrl }}
            options={{ disableRange: true, disableStream: true }}
            onLoadSuccess={onDocumentLoadSuccess}
            onLoadError={onDocumentLoadError}
            loading={
              <div className="flex items-center justify-center">
                <Loader2 className="w-8 h-8 animate-spin text-white" />
              </div>
            }
          >
            <Page
              pageNumber={pageNumber}
              scale={scale}
              rotate={rotation}
              renderTextLayer={false}
              renderAnnotationLayer={false}
              className="shadow-2xl"
            />
          </Document>
        </div>
      </div>
    );
  }

  return (
    <TooltipProvider>
      <div
        ref={containerRef}
        className="fixed inset-0 z-50 flex flex-col bg-background"
      >
        {/* Toolbar */}
        <div className="flex items-center justify-between px-3 py-2 bg-card border-b border-border flex-shrink-0">
          {/* Left side */}
          <div className="flex items-center gap-2">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setShowThumbnails(!showThumbnails)}
                  className="h-8 w-8"
                >
                  {showThumbnails ? <PanelLeftClose className="h-4 w-4" /> : <PanelLeft className="h-4 w-4" />}
                </Button>
              </TooltipTrigger>
              <TooltipContent>Panneau latéral</TooltipContent>
            </Tooltip>

            <div className="h-6 w-px bg-border" />

            <span className="text-sm font-medium truncate max-w-[200px]">{fileName}</span>
            
            {!loading && !error && (
              <>
                <div className="h-6 w-px bg-border" />
                
                {/* Page navigation */}
                <div className="flex items-center gap-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={goToPreviousPage}
                    disabled={pageNumber <= 1}
                    className="h-8 w-8"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  
                  <div className="flex items-center gap-1">
                    <Input
                      type="number"
                      value={pageNumber}
                      onChange={(e) => {
                        const page = parseInt(e.target.value);
                        if (page >= 1 && page <= numPages) {
                          setPageNumber(page);
                        }
                      }}
                      className="w-12 h-7 text-center text-sm"
                      min={1}
                      max={numPages}
                    />
                    <span className="text-sm text-muted-foreground">/ {numPages}</span>
                  </div>
                  
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={goToNextPage}
                    disabled={pageNumber >= numPages}
                    className="h-8 w-8"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </>
            )}
          </div>

          {/* Center - Annotation tools */}
          <div className="flex items-center gap-1">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant={activeAnnotationTool === 'highlight' ? 'secondary' : 'ghost'}
                  size="icon"
                  onClick={() => setActiveAnnotationTool(activeAnnotationTool === 'highlight' ? null : 'highlight')}
                  className="h-8 w-8"
                >
                  <Highlighter className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Surligner</TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant={activeAnnotationTool === 'underline' ? 'secondary' : 'ghost'}
                  size="icon"
                  onClick={() => setActiveAnnotationTool(activeAnnotationTool === 'underline' ? null : 'underline')}
                  className="h-8 w-8"
                >
                  <PenTool className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Souligner</TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant={activeAnnotationTool === 'note' ? 'secondary' : 'ghost'}
                  size="icon"
                  onClick={() => setActiveAnnotationTool(activeAnnotationTool === 'note' ? null : 'note')}
                  className="h-8 w-8"
                >
                  <MessageSquare className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Ajouter une note</TooltipContent>
            </Tooltip>

            {/* Color picker */}
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <div 
                    className="w-4 h-4 rounded-full border-2 border-border"
                    style={{ backgroundColor: selectedColor }}
                  />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-2">
                <div className="flex gap-1">
                  {annotationColors.map(color => (
                    <button
                      key={color}
                      className={`w-6 h-6 rounded-full border-2 ${selectedColor === color ? 'border-foreground' : 'border-transparent'}`}
                      style={{ backgroundColor: color }}
                      onClick={() => setSelectedColor(color)}
                    />
                  ))}
                </div>
              </PopoverContent>
            </Popover>

            <div className="h-6 w-px bg-border mx-1" />

            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setShowAnnotations(!showAnnotations)}
                  className="h-8 w-8"
                >
                  {showAnnotations ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                </Button>
              </TooltipTrigger>
              <TooltipContent>{showAnnotations ? 'Masquer annotations' : 'Afficher annotations'}</TooltipContent>
            </Tooltip>

            {annotations.length > 0 && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={clearAllAnnotations}
                    className="h-8 w-8 text-destructive"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Effacer toutes les annotations</TooltipContent>
              </Tooltip>
            )}
          </div>

          {/* Right side */}
          <div className="flex items-center gap-1">
            {/* Search */}
            <Popover open={isSearching} onOpenChange={setIsSearching}>
              <PopoverTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <Search className="h-4 w-4" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-80" align="end">
                <div className="space-y-2">
                  <div className="flex gap-2">
                    <Input
                      placeholder="Rechercher dans le document..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                      className="flex-1"
                    />
                    <Button onClick={handleSearch} size="icon">
                      <Search className="h-4 w-4" />
                    </Button>
                  </div>
                  {searchResults.length > 0 && (
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">
                        {currentSearchIndex + 1} / {searchResults.length}
                      </span>
                      <div className="flex gap-1">
                        <Button variant="outline" size="icon" className="h-7 w-7" onClick={goToPreviousSearchResult}>
                          <ChevronLeft className="h-3 w-3" />
                        </Button>
                        <Button variant="outline" size="icon" className="h-7 w-7" onClick={goToNextSearchResult}>
                          <ChevronRight className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              </PopoverContent>
            </Popover>

            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant={bookmarks.some(b => b.pageNumber === pageNumber) ? 'secondary' : 'ghost'}
                  size="icon"
                  onClick={addBookmark}
                  className="h-8 w-8"
                >
                  {bookmarks.some(b => b.pageNumber === pageNumber) ? (
                    <Bookmark className="h-4 w-4 fill-current" />
                  ) : (
                    <BookmarkPlus className="h-4 w-4" />
                  )}
                </Button>
              </TooltipTrigger>
              <TooltipContent>Ajouter aux marque-pages (Ctrl+B)</TooltipContent>
            </Tooltip>

            <div className="h-6 w-px bg-border" />

            {/* Zoom controls */}
            <Button variant="ghost" size="icon" onClick={handleZoomOut} className="h-8 w-8">
              <ZoomOut className="h-4 w-4" />
            </Button>
            <span className="text-xs w-12 text-center">{getZoomPercentage()}%</span>
            <Button variant="ghost" size="icon" onClick={handleZoomIn} className="h-8 w-8">
              <ZoomIn className="h-4 w-4" />
            </Button>

            <Button variant="ghost" size="icon" onClick={handleRotate} className="h-8 w-8">
              <RotateCw className="h-4 w-4" />
            </Button>

            <div className="h-6 w-px bg-border" />

            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant={isPresentationMode ? 'secondary' : 'ghost'}
                  size="icon"
                  onClick={togglePresentationMode}
                  className="h-8 w-8"
                >
                  <Presentation className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Mode présentation</TooltipContent>
            </Tooltip>

            <Button variant="ghost" size="icon" onClick={toggleFullscreen} className="h-8 w-8">
              {isFullscreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
            </Button>

            <div className="h-6 w-px bg-border" />

            <Button variant="ghost" size="icon" onClick={handleShare} className="h-8 w-8">
              <Share2 className="h-4 w-4" />
            </Button>

            <Button variant="ghost" size="icon" onClick={handlePrint} className="h-8 w-8">
              <Printer className="h-4 w-4" />
            </Button>

            <Button variant="ghost" size="icon" onClick={handleDownload} className="h-8 w-8">
              <Download className="h-4 w-4" />
            </Button>

            <Button variant="ghost" size="icon" onClick={() => window.open(fileUrl, '_blank')} className="h-8 w-8">
              <ExternalLink className="h-4 w-4" />
            </Button>

            <div className="h-6 w-px bg-border" />

            <Button variant="ghost" size="icon" onClick={onClose} className="h-8 w-8">
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Main content */}
        <div className="flex-1 flex overflow-hidden">
          {/* Sidebar */}
          {renderSidebar()}

          {/* PDF Content */}
          <div className="flex-1 overflow-auto bg-muted/30" ref={contentRef}>
            {error ? (
              <div className="flex flex-col items-center justify-center h-full p-8">
                <FileWarning className="w-16 h-16 mb-4 text-destructive" />
                <div className="text-lg mb-2 text-destructive font-medium">Erreur de chargement</div>
                <p className="text-sm text-muted-foreground mb-4 text-center max-w-md">{error}</p>
                <div className="flex gap-2">
                  <Button onClick={() => { setError(null); setLoading(true); }} variant="outline">
                    <RotateCw className="h-4 w-4 mr-2" />
                    Réessayer
                  </Button>
                  <Button onClick={() => window.open(fileUrl, '_blank')} variant="outline">
                    <ExternalLink className="h-4 w-4 mr-2" />
                    Ouvrir dans un nouvel onglet
                  </Button>
                  <Button onClick={handleDownload}>
                    <Download className="h-4 w-4 mr-2" />
                    Télécharger
                  </Button>
                </div>
              </div>
            ) : (
              <div className="min-h-full flex items-start justify-center p-8">
                <div
                  className="relative"
                  onClick={(e) => handlePageClick(e, pageNumber)}
                  style={{ cursor: activeAnnotationTool ? 'crosshair' : 'default' }}
                >
                  <Document
                    ref={documentRef}
                    file={{ url: fileUrl }}
                    options={{ disableRange: true, disableStream: true }}
                    onLoadSuccess={onDocumentLoadSuccess}
                    onLoadError={onDocumentLoadError}
                    loading={
                      <div className="flex items-center justify-center h-[70vh]">
                        <div className="flex flex-col items-center gap-3">
                          <Loader2 className="w-8 h-8 animate-spin text-primary" />
                          <span className="text-sm text-muted-foreground">Chargement du document...</span>
                        </div>
                      </div>
                    }
                    error={
                      <div className="flex flex-col items-center justify-center h-[70vh] p-8">
                        <FileWarning className="w-16 h-16 mb-4 text-destructive" />
                        <div className="text-lg mb-2 text-destructive font-medium">Erreur de chargement</div>
                      </div>
                    }
                  >
                    <Page
                      pageNumber={pageNumber}
                      scale={scale}
                      rotate={rotation}
                      renderTextLayer={true}
                      renderAnnotationLayer={true}
                      className="shadow-2xl rounded-lg overflow-hidden"
                      loading={
                        <div className="flex items-center justify-center p-8">
                          <Loader2 className="w-6 h-6 animate-spin text-primary mr-2" />
                          <span className="text-sm text-muted-foreground">Chargement de la page...</span>
                        </div>
                      }
                    />
                  </Document>

                  {/* Annotations overlay */}
                  {!loading && renderAnnotations(pageNumber)}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Note input modal */}
        {pendingNotePosition && (
          <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center">
            <div className="bg-card rounded-lg p-4 w-80 shadow-xl">
              <h3 className="text-sm font-medium mb-2">Ajouter une note</h3>
              <Textarea
                value={newNoteContent}
                onChange={(e) => setNewNoteContent(e.target.value)}
                placeholder="Votre note..."
                className="mb-3"
                rows={3}
              />
              <div className="flex gap-2 justify-end">
                <Button variant="outline" size="sm" onClick={() => setPendingNotePosition(null)}>
                  Annuler
                </Button>
                <Button size="sm" onClick={addNoteAnnotation}>
                  Ajouter
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Active tool indicator */}
        {activeAnnotationTool && (
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-card border border-border rounded-full px-4 py-2 shadow-lg flex items-center gap-2">
            <div 
              className="w-3 h-3 rounded-full"
              style={{ backgroundColor: selectedColor }}
            />
            <span className="text-sm">
              {activeAnnotationTool === 'highlight' && 'Mode surlignage'}
              {activeAnnotationTool === 'underline' && 'Mode soulignement'}
              {activeAnnotationTool === 'note' && 'Mode note - Cliquez pour ajouter'}
            </span>
            <Button 
              variant="ghost" 
              size="icon" 
              className="h-5 w-5"
              onClick={() => setActiveAnnotationTool(null)}
            >
              <X className="h-3 w-3" />
            </Button>
          </div>
        )}
      </div>
    </TooltipProvider>
  );
};

export default AdvancedPDFViewer;