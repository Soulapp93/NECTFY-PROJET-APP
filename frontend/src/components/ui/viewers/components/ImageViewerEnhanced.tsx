import React from 'react';
import { ZoomIn, ZoomOut, RotateCcw, RotateCw, Maximize, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { useImageTransform } from '../hooks/useImageTransform';
import { cn } from '@/lib/utils';

interface ImageViewerEnhancedProps {
  src: string;
  alt: string;
  onLoad?: () => void;
  onError?: () => void;
  className?: string;
  showControls?: boolean;
}

const ImageViewerEnhanced: React.FC<ImageViewerEnhancedProps> = ({
  src,
  alt,
  onLoad,
  onError,
  className,
  showControls = true
}) => {
  const {
    transform,
    containerRef,
    zoomIn,
    zoomOut,
    setZoom,
    rotateLeft,
    rotateRight,
    reset,
    handlers
  } = useImageTransform({ minScale: 0.25, maxScale: 5 });

  const zoomPercentage = Math.round(transform.scale * 100);

  // Separate handlers to avoid type conflicts
  const { onClick, ...gestureHandlers } = handlers;

  return (
    <div className={cn("flex flex-col h-full w-full", className)}>
      {/* Image container with gestures */}
      <div
        ref={containerRef}
        className="flex-1 flex items-center justify-center overflow-hidden bg-black/95 cursor-grab active:cursor-grabbing touch-none"
        onMouseDown={gestureHandlers.onMouseDown}
        onMouseMove={gestureHandlers.onMouseMove}
        onMouseUp={gestureHandlers.onMouseUp}
        onMouseLeave={gestureHandlers.onMouseLeave}
        onTouchStart={(e) => {
          gestureHandlers.onTouchStart(e);
          onClick(); // Handle double tap
        }}
        onTouchMove={gestureHandlers.onTouchMove}
        onTouchEnd={gestureHandlers.onTouchEnd}
        onWheel={gestureHandlers.onWheel}
      >
        <img
          src={src}
          alt={alt}
          className="max-w-full max-h-full object-contain select-none pointer-events-none transition-transform duration-100"
          style={{
            transform: `translate(${transform.x}px, ${transform.y}px) scale(${transform.scale}) rotate(${transform.rotation}deg)`,
            transformOrigin: 'center center'
          }}
          onLoad={onLoad}
          onError={onError}
          draggable={false}
        />
      </div>

      {/* Controls toolbar */}
      {showControls && (
        <div className="flex items-center justify-center gap-2 p-3 bg-background/95 backdrop-blur-sm border-t">
          {/* Zoom controls */}
          <div className="flex items-center gap-1 bg-muted/50 rounded-lg px-2 py-1">
            <Button
              variant="ghost"
              size="icon"
              onClick={zoomOut}
              disabled={transform.scale <= 0.25}
              className="h-8 w-8"
              title="Zoom arrière"
            >
              <ZoomOut className="h-4 w-4" />
            </Button>
            
            <div className="w-24 px-2">
              <Slider
                value={[transform.scale]}
                min={0.25}
                max={5}
                step={0.1}
                onValueChange={([value]) => setZoom(value)}
                className="cursor-pointer"
              />
            </div>
            
            <Button
              variant="ghost"
              size="icon"
              onClick={zoomIn}
              disabled={transform.scale >= 5}
              className="h-8 w-8"
              title="Zoom avant"
            >
              <ZoomIn className="h-4 w-4" />
            </Button>
            
            <span className="text-xs font-medium w-12 text-center tabular-nums text-muted-foreground">
              {zoomPercentage}%
            </span>
          </div>

          {/* Rotation controls */}
          <div className="flex items-center gap-1 bg-muted/50 rounded-lg px-2 py-1">
            <Button
              variant="ghost"
              size="icon"
              onClick={rotateLeft}
              className="h-8 w-8"
              title="Rotation gauche"
            >
              <RotateCcw className="h-4 w-4" />
            </Button>
            
            <span className="text-xs font-medium w-10 text-center tabular-nums text-muted-foreground">
              {transform.rotation}°
            </span>
            
            <Button
              variant="ghost"
              size="icon"
              onClick={rotateRight}
              className="h-8 w-8"
              title="Rotation droite"
            >
              <RotateCw className="h-4 w-4" />
            </Button>
          </div>

          {/* Reset */}
          <Button
            variant="ghost"
            size="icon"
            onClick={reset}
            className="h-8 w-8"
            title="Réinitialiser"
          >
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>
      )}
    </div>
  );
};

export default ImageViewerEnhanced;
