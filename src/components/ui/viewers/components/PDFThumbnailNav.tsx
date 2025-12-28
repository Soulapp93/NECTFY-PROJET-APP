import React, { useRef, useEffect, useState } from 'react';
import { Document, Page, pdfjs } from 'react-pdf';
import { ChevronLeft, ChevronRight, Grid3X3, List } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';

interface PDFThumbnailNavProps {
  fileUrl: string;
  numPages: number;
  currentPage: number;
  onPageChange: (page: number) => void;
  isOpen: boolean;
  onToggle: () => void;
}

const PDFThumbnailNav: React.FC<PDFThumbnailNavProps> = ({
  fileUrl,
  numPages,
  currentPage,
  onPageChange,
  isOpen,
  onToggle
}) => {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [visiblePages, setVisiblePages] = useState<number[]>([]);

  // Calculate which pages to render based on current view
  useEffect(() => {
    const startPage = Math.max(1, currentPage - 5);
    const endPage = Math.min(numPages, currentPage + 5);
    const pages = [];
    for (let i = startPage; i <= endPage; i++) {
      pages.push(i);
    }
    setVisiblePages(pages);
  }, [currentPage, numPages]);

  // Scroll to current page thumbnail
  useEffect(() => {
    if (scrollRef.current && isOpen) {
      const thumbnail = scrollRef.current.querySelector(`[data-page="${currentPage}"]`);
      if (thumbnail) {
        thumbnail.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }
    }
  }, [currentPage, isOpen]);

  if (!isOpen) {
    return (
      <Button
        variant="outline"
        size="sm"
        onClick={onToggle}
        className="absolute left-4 top-1/2 -translate-y-1/2 z-50 bg-background/95 backdrop-blur-sm shadow-lg"
      >
        <Grid3X3 className="h-4 w-4 mr-2" />
        Pages
      </Button>
    );
  }

  return (
    <div className="w-40 bg-background/95 backdrop-blur-sm border-r flex flex-col shrink-0">
      <div className="flex items-center justify-between p-2 border-b">
        <span className="text-xs font-medium">Pages</span>
        <Button variant="ghost" size="icon" onClick={onToggle} className="h-6 w-6">
          <ChevronLeft className="h-4 w-4" />
        </Button>
      </div>
      
      <ScrollArea className="flex-1">
        <div ref={scrollRef} className="p-2 space-y-2">
          {Array.from({ length: numPages }, (_, i) => i + 1).map((pageNum) => (
            <button
              key={pageNum}
              data-page={pageNum}
              onClick={() => onPageChange(pageNum)}
              className={cn(
                "w-full aspect-[3/4] rounded-md border-2 overflow-hidden transition-all hover:border-primary/50",
                pageNum === currentPage 
                  ? "border-primary ring-2 ring-primary/20" 
                  : "border-border"
              )}
            >
              {visiblePages.includes(pageNum) ? (
                <Document file={fileUrl} loading={null} error={null}>
                  <Page
                    pageNumber={pageNum}
                    width={120}
                    renderTextLayer={false}
                    renderAnnotationLayer={false}
                    loading={
                      <div className="w-full h-full bg-muted animate-pulse" />
                    }
                  />
                </Document>
              ) : (
                <div className="w-full h-full bg-muted flex items-center justify-center">
                  <span className="text-xs text-muted-foreground">{pageNum}</span>
                </div>
              )}
              <div className="text-xs text-center py-1 bg-background border-t">
                {pageNum}
              </div>
            </button>
          ))}
        </div>
      </ScrollArea>

      {/* Quick navigation */}
      <div className="p-2 border-t flex items-center justify-center gap-2">
        <Button
          variant="outline"
          size="icon"
          onClick={() => onPageChange(Math.max(1, currentPage - 1))}
          disabled={currentPage <= 1}
          className="h-7 w-7"
        >
          <ChevronLeft className="h-3 w-3" />
        </Button>
        <span className="text-xs tabular-nums">
          {currentPage}/{numPages}
        </span>
        <Button
          variant="outline"
          size="icon"
          onClick={() => onPageChange(Math.min(numPages, currentPage + 1))}
          disabled={currentPage >= numPages}
          className="h-7 w-7"
        >
          <ChevronRight className="h-3 w-3" />
        </Button>
      </div>
    </div>
  );
};

export default PDFThumbnailNav;
