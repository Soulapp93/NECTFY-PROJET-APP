import React, { useState, useEffect } from 'react';
import { 
  X, Download, Maximize2, Minimize2, Copy, 
  FileText, Share2, Search, Code, Type,
  ChevronUp, ChevronDown
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { toast } from 'sonner';

interface TextViewerProps {
  fileUrl: string;
  fileName: string;
  isOpen: boolean;
  onClose: () => void;
  onShare?: (url: string) => void;
}

const TextViewer: React.FC<TextViewerProps> = ({
  fileUrl,
  fileName,
  isOpen,
  onClose,
  onShare
}) => {
  const [content, setContent] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showLineNumbers, setShowLineNumbers] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<number[]>([]);
  const [currentSearchIndex, setCurrentSearchIndex] = useState(0);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [fontSize, setFontSize] = useState(14);
  const [wordWrap, setWordWrap] = useState(true);

  const containerRef = React.useRef<HTMLDivElement>(null);

  const getFileExtension = () => {
    return fileName.split('.').pop()?.toLowerCase() || 'txt';
  };

  const isMarkdown = () => {
    const ext = getFileExtension();
    return ['md', 'markdown', 'mdown', 'mkd'].includes(ext);
  };

  const isCode = () => {
    const ext = getFileExtension();
    return ['js', 'jsx', 'ts', 'tsx', 'py', 'java', 'c', 'cpp', 'h', 'hpp', 
            'css', 'scss', 'less', 'html', 'xml', 'json', 'yaml', 'yml',
            'sh', 'bash', 'sql', 'php', 'rb', 'go', 'rs', 'swift'].includes(ext);
  };

  // Fetch content
  useEffect(() => {
    if (!isOpen) return;

    const fetchContent = async () => {
      setLoading(true);
      setError(false);

      try {
        const response = await fetch(fileUrl);
        if (!response.ok) throw new Error('Failed to fetch');
        const text = await response.text();
        setContent(text);
        setLoading(false);
      } catch (err) {
        console.error('Error fetching text file:', err);
        setError(true);
        setLoading(false);
        toast.error('Impossible de charger le fichier');
      }
    };

    fetchContent();
  }, [fileUrl, isOpen]);

  // Search functionality
  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      return;
    }

    const lines = content.split('\n');
    const results: number[] = [];
    
    lines.forEach((line, index) => {
      if (line.toLowerCase().includes(searchQuery.toLowerCase())) {
        results.push(index);
      }
    });

    setSearchResults(results);
    setCurrentSearchIndex(0);
  }, [searchQuery, content]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;

      if (e.key === 'Escape') {
        if (isSearchOpen) {
          setIsSearchOpen(false);
        } else if (isFullscreen) {
          exitFullscreen();
        } else {
          onClose();
        }
      }

      if ((e.ctrlKey || e.metaKey) && e.key === 'f') {
        e.preventDefault();
        setIsSearchOpen(true);
      }

      if ((e.ctrlKey || e.metaKey) && e.key === '+') {
        e.preventDefault();
        setFontSize(prev => Math.min(prev + 2, 24));
      }

      if ((e.ctrlKey || e.metaKey) && e.key === '-') {
        e.preventDefault();
        setFontSize(prev => Math.max(prev - 2, 10));
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, isSearchOpen, isFullscreen, onClose]);

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
    const blob = new Blob([content], { type: 'text/plain' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
    toast.success('Téléchargement démarré');
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(content).then(() => {
      toast.success('Contenu copié dans le presse-papier');
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

  const goToNextSearchResult = () => {
    if (searchResults.length > 0) {
      const nextIndex = (currentSearchIndex + 1) % searchResults.length;
      setCurrentSearchIndex(nextIndex);
      scrollToLine(searchResults[nextIndex]);
    }
  };

  const goToPreviousSearchResult = () => {
    if (searchResults.length > 0) {
      const prevIndex = currentSearchIndex === 0 ? searchResults.length - 1 : currentSearchIndex - 1;
      setCurrentSearchIndex(prevIndex);
      scrollToLine(searchResults[prevIndex]);
    }
  };

  const scrollToLine = (lineIndex: number) => {
    const lineElement = document.getElementById(`line-${lineIndex}`);
    if (lineElement) {
      lineElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  };

  const highlightText = (text: string, lineIndex: number) => {
    if (!searchQuery.trim()) return text;

    const regex = new RegExp(`(${searchQuery})`, 'gi');
    const parts = text.split(regex);

    return parts.map((part, i) => {
      if (part.toLowerCase() === searchQuery.toLowerCase()) {
        const isCurrentResult = searchResults[currentSearchIndex] === lineIndex;
        return (
          <mark 
            key={i} 
            className={`${isCurrentResult ? 'bg-primary text-primary-foreground' : 'bg-yellow-300 text-yellow-900'} rounded px-0.5`}
          >
            {part}
          </mark>
        );
      }
      return part;
    });
  };

  const lines = content.split('\n');

  // Simple markdown rendering
  const renderMarkdownLine = (line: string, index: number) => {
    // Headers
    if (line.startsWith('# ')) {
      return <h1 className="text-2xl font-bold mb-2">{highlightText(line.slice(2), index)}</h1>;
    }
    if (line.startsWith('## ')) {
      return <h2 className="text-xl font-bold mb-2">{highlightText(line.slice(3), index)}</h2>;
    }
    if (line.startsWith('### ')) {
      return <h3 className="text-lg font-bold mb-2">{highlightText(line.slice(4), index)}</h3>;
    }

    // Bold and italic
    let processedLine = line;
    
    // Code inline
    if (processedLine.includes('`')) {
      const parts = processedLine.split(/`([^`]+)`/);
      return (
        <p className="mb-1">
          {parts.map((part, i) => 
            i % 2 === 1 ? (
              <code key={i} className="bg-muted px-1 py-0.5 rounded text-sm font-mono">{part}</code>
            ) : (
              <span key={i}>{highlightText(part, index)}</span>
            )
          )}
        </p>
      );
    }

    // Lists
    if (line.startsWith('- ') || line.startsWith('* ')) {
      return (
        <li className="ml-4 list-disc">{highlightText(line.slice(2), index)}</li>
      );
    }

    // Numbered lists
    if (/^\d+\.\s/.test(line)) {
      return (
        <li className="ml-4 list-decimal">{highlightText(line.replace(/^\d+\.\s/, ''), index)}</li>
      );
    }

    // Blockquote
    if (line.startsWith('> ')) {
      return (
        <blockquote className="border-l-4 border-primary pl-4 italic text-muted-foreground">
          {highlightText(line.slice(2), index)}
        </blockquote>
      );
    }

    // Horizontal rule
    if (line === '---' || line === '***' || line === '___') {
      return <hr className="my-4 border-border" />;
    }

    // Empty line
    if (line.trim() === '') {
      return <div className="h-4" />;
    }

    return <p className="mb-1">{highlightText(line, index)}</p>;
  };

  return (
    <div
      ref={containerRef}
      className="fixed inset-0 z-50 bg-background flex flex-col"
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2 border-b border-border bg-card/50 backdrop-blur-sm flex-shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center">
            {isCode() ? (
              <Code className="h-4 w-4 text-primary-foreground" />
            ) : (
              <FileText className="h-4 w-4 text-primary-foreground" />
            )}
          </div>
          <div>
            <h2 className="text-sm font-medium truncate max-w-md">{fileName}</h2>
            <span className="text-xs text-muted-foreground">
              {lines.length} lignes • {getFileExtension().toUpperCase()}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-1">
          {/* Search toggle */}
          <Button
            variant={isSearchOpen ? 'secondary' : 'ghost'}
            size="icon"
            onClick={() => setIsSearchOpen(!isSearchOpen)}
            className="h-8 w-8"
          >
            <Search className="h-4 w-4" />
          </Button>

          {/* Toggle line numbers */}
          <Button
            variant={showLineNumbers ? 'secondary' : 'ghost'}
            size="icon"
            onClick={() => setShowLineNumbers(!showLineNumbers)}
            className="h-8 w-8"
            title="Numéros de ligne"
          >
            <Type className="h-4 w-4" />
          </Button>

          {/* Font size controls */}
          <div className="flex items-center gap-1 px-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setFontSize(prev => Math.max(prev - 2, 10))}
              className="h-7 w-7"
            >
              <span className="text-xs">A-</span>
            </Button>
            <span className="text-xs w-8 text-center">{fontSize}px</span>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setFontSize(prev => Math.min(prev + 2, 24))}
              className="h-7 w-7"
            >
              <span className="text-xs">A+</span>
            </Button>
          </div>

          <div className="h-6 w-px bg-border" />

          <Button variant="ghost" size="icon" onClick={handleCopy} className="h-8 w-8">
            <Copy className="h-4 w-4" />
          </Button>
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

      {/* Search bar */}
      {isSearchOpen && (
        <div className="flex items-center gap-2 px-4 py-2 bg-muted/50 border-b border-border">
          <Search className="h-4 w-4 text-muted-foreground" />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Rechercher..."
            className="flex-1 h-8"
            autoFocus
          />
          {searchResults.length > 0 && (
            <>
              <span className="text-xs text-muted-foreground">
                {currentSearchIndex + 1} / {searchResults.length}
              </span>
              <Button variant="ghost" size="icon" className="h-7 w-7" onClick={goToPreviousSearchResult}>
                <ChevronUp className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="icon" className="h-7 w-7" onClick={goToNextSearchResult}>
                <ChevronDown className="h-4 w-4" />
              </Button>
            </>
          )}
          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setIsSearchOpen(false)}>
            <X className="h-4 w-4" />
          </Button>
        </div>
      )}

      {/* Content */}
      <ScrollArea className="flex-1">
        {loading && (
          <div className="flex items-center justify-center h-full">
            <div className="flex flex-col items-center gap-3">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              <span className="text-sm text-muted-foreground">Chargement...</span>
            </div>
          </div>
        )}

        {error && (
          <div className="flex flex-col items-center justify-center h-full p-8">
            <FileText className="w-16 h-16 mb-4 text-destructive" />
            <div className="text-lg mb-2 text-destructive">Erreur de chargement</div>
            <Button onClick={() => window.open(fileUrl, '_blank')} variant="outline">
              Ouvrir dans un nouvel onglet
            </Button>
          </div>
        )}

        {!loading && !error && (
          <div className="p-4">
            {isMarkdown() ? (
              <div className="prose prose-sm dark:prose-invert max-w-none" style={{ fontSize }}>
                {lines.map((line, index) => (
                  <div key={index} id={`line-${index}`}>
                    {renderMarkdownLine(line, index)}
                  </div>
                ))}
              </div>
            ) : (
              <div 
                className={`font-mono ${wordWrap ? 'whitespace-pre-wrap' : 'whitespace-pre overflow-x-auto'}`}
                style={{ fontSize }}
              >
                {lines.map((line, index) => (
                  <div 
                    key={index} 
                    id={`line-${index}`}
                    className={`flex hover:bg-muted/50 ${
                      searchResults.includes(index) ? 'bg-primary/10' : ''
                    }`}
                  >
                    {showLineNumbers && (
                      <span className="w-12 flex-shrink-0 text-right pr-4 text-muted-foreground select-none border-r border-border mr-4">
                        {index + 1}
                      </span>
                    )}
                    <span className="flex-1">
                      {highlightText(line || ' ', index)}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </ScrollArea>
    </div>
  );
};

export default TextViewer;