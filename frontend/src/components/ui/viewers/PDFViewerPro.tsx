import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Loader2, AlertTriangle, ExternalLink } from 'lucide-react';
import { Document, Page, pdfjs } from 'react-pdf';
import { Button } from '@/components/ui/button';

import 'react-pdf/dist/Page/AnnotationLayer.css';
import 'react-pdf/dist/Page/TextLayer.css';

// PDF.js worker configuration - must happen before any PDF rendering
// Using CDN worker for maximum compatibility across all platforms
const PDFJS_VERSION = pdfjs.version;
pdfjs.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${PDFJS_VERSION}/pdf.worker.min.mjs`;

// Detect iOS for fallback strategy
const isIOS = (): boolean => {
  if (typeof navigator === 'undefined') return false;
  return /iPad|iPhone|iPod/.test(navigator.userAgent);
};

interface PDFViewerProProps {
  fileUrl: string;
  zoom: number;
  page: number;
  onPageChange: (page: number) => void;
  onPagesLoaded: (numPages: number) => void;
  onError: (message: string) => void;
  retryKey?: number;
}

type RenderStrategy = 'react-pdf' | 'google-viewer' | 'native-embed';

const PDFViewerPro: React.FC<PDFViewerProProps> = ({
  fileUrl,
  zoom,
  page,
  onPageChange,
  onPagesLoaded,
  onError,
  retryKey = 0
}) => {
  const [strategy, setStrategy] = useState<RenderStrategy>('react-pdf');
  const [isLoading, setIsLoading] = useState(true);
  const [numPages, setNumPages] = useState(0);
  const [hasTriedFallback, setHasTriedFallback] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Determine initial strategy based on device
  useEffect(() => {
    // On iOS, react-pdf has known issues with workers - use Google Viewer
    if (isIOS()) {
      setStrategy('google-viewer');
    } else {
      setStrategy('react-pdf');
    }
    setIsLoading(true);
    setHasTriedFallback(false);
  }, [fileUrl, retryKey]);

  const handleReactPdfSuccess = useCallback(({ numPages: n }: { numPages: number }) => {
    setNumPages(n);
    setIsLoading(false);
    onPagesLoaded(n);
  }, [onPagesLoaded]);

  const handleReactPdfError = useCallback((error: Error) => {
    console.error('react-pdf error:', error);
    
    // Try fallback strategies
    if (!hasTriedFallback) {
      setHasTriedFallback(true);
      setStrategy('google-viewer');
      setIsLoading(true);
    } else {
      onError('Impossible de charger le PDF. Essayez de l\'ouvrir dans un nouvel onglet.');
    }
  }, [hasTriedFallback, onError]);

  const handleIframeLoad = useCallback(() => {
    setIsLoading(false);
    // For iframe strategies, we can't know page count
    onPagesLoaded(1);
  }, [onPagesLoaded]);

  const handleIframeError = useCallback(() => {
    if (strategy === 'google-viewer' && !hasTriedFallback) {
      setHasTriedFallback(true);
      setStrategy('native-embed');
      setIsLoading(true);
    } else {
      onError('Impossible de charger le PDF');
    }
  }, [strategy, hasTriedFallback, onError]);

  const openInNewTab = () => {
    window.open(fileUrl, '_blank', 'noopener,noreferrer');
  };

  const scale = zoom / 100;

  // React-PDF strategy (best quality, but can fail on iOS)
  if (strategy === 'react-pdf') {
    return (
      <div 
        ref={containerRef}
        className="flex-1 w-full h-full bg-muted overflow-auto flex items-start justify-center p-4"
      >
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-muted/50 z-10">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        )}
        <Document
          key={`${fileUrl}-${retryKey}`}
          file={fileUrl}
          onLoadSuccess={handleReactPdfSuccess}
          onLoadError={handleReactPdfError}
          loading={null}
          error={null}
        >
          <Page
            pageNumber={page}
            scale={scale}
            renderTextLayer
            renderAnnotationLayer
            className="shadow-2xl rounded-lg"
            onRenderSuccess={() => setIsLoading(false)}
          />
        </Document>
      </div>
    );
  }

  // Google Docs Viewer strategy (works on all platforms)
  if (strategy === 'google-viewer') {
    const googleViewerUrl = `https://docs.google.com/viewer?url=${encodeURIComponent(fileUrl)}&embedded=true`;
    
    return (
      <div className="flex-1 w-full h-full bg-muted relative">
        {isLoading && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-muted z-10">
            <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
            <p className="text-sm text-muted-foreground">Chargement du PDF...</p>
          </div>
        )}
        <iframe
          key={`google-${fileUrl}-${retryKey}`}
          src={googleViewerUrl}
          className="w-full h-full border-0"
          title="PDF Viewer"
          onLoad={handleIframeLoad}
          onError={handleIframeError}
          sandbox="allow-scripts allow-same-origin allow-popups"
        />
      </div>
    );
  }

  // Native embed fallback (last resort)
  if (strategy === 'native-embed') {
    return (
      <div className="flex-1 w-full h-full bg-muted relative flex flex-col">
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-muted z-10">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        )}
        <object
          key={`native-${fileUrl}-${retryKey}`}
          data={fileUrl}
          type="application/pdf"
          className="flex-1 w-full h-full"
          onLoad={handleIframeLoad}
        >
          <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
            <AlertTriangle className="h-12 w-12 text-amber-500 mb-4" />
            <p className="text-muted-foreground mb-4">
              Votre navigateur ne supporte pas l'affichage PDF intégré.
            </p>
            <Button onClick={openInNewTab}>
              <ExternalLink className="h-4 w-4 mr-2" />
              Ouvrir dans un nouvel onglet
            </Button>
          </div>
        </object>
      </div>
    );
  }

  return null;
};

export default PDFViewerPro;
