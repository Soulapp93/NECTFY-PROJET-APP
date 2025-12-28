import { useState, useCallback, useRef, useEffect } from 'react';

interface ImageTransform {
  scale: number;
  rotation: number;
  x: number;
  y: number;
}

interface UseImageTransformOptions {
  minScale?: number;
  maxScale?: number;
  onTransformChange?: (transform: ImageTransform) => void;
}

export const useImageTransform = (options: UseImageTransformOptions = {}) => {
  const { minScale = 0.5, maxScale = 5, onTransformChange } = options;
  
  const [transform, setTransform] = useState<ImageTransform>({
    scale: 1,
    rotation: 0,
    x: 0,
    y: 0
  });
  
  const containerRef = useRef<HTMLDivElement>(null);
  const lastDistance = useRef<number>(0);
  const lastCenter = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const isDragging = useRef(false);
  const lastPosition = useRef<{ x: number; y: number }>({ x: 0, y: 0 });

  // Zoom in/out handlers
  const zoomIn = useCallback(() => {
    setTransform(prev => {
      const newScale = Math.min(prev.scale + 0.25, maxScale);
      return { ...prev, scale: newScale };
    });
  }, [maxScale]);

  const zoomOut = useCallback(() => {
    setTransform(prev => {
      const newScale = Math.max(prev.scale - 0.25, minScale);
      return { ...prev, scale: newScale };
    });
  }, [minScale]);

  const setZoom = useCallback((scale: number) => {
    setTransform(prev => ({
      ...prev,
      scale: Math.max(minScale, Math.min(maxScale, scale))
    }));
  }, [minScale, maxScale]);

  // Rotation handlers
  const rotateLeft = useCallback(() => {
    setTransform(prev => ({
      ...prev,
      rotation: (prev.rotation - 90) % 360
    }));
  }, []);

  const rotateRight = useCallback(() => {
    setTransform(prev => ({
      ...prev,
      rotation: (prev.rotation + 90) % 360
    }));
  }, []);

  // Reset transform
  const reset = useCallback(() => {
    setTransform({ scale: 1, rotation: 0, x: 0, y: 0 });
  }, []);

  // Pan handlers
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (transform.scale > 1) {
      isDragging.current = true;
      lastPosition.current = { x: e.clientX, y: e.clientY };
    }
  }, [transform.scale]);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!isDragging.current) return;
    
    const dx = e.clientX - lastPosition.current.x;
    const dy = e.clientY - lastPosition.current.y;
    
    setTransform(prev => ({
      ...prev,
      x: prev.x + dx,
      y: prev.y + dy
    }));
    
    lastPosition.current = { x: e.clientX, y: e.clientY };
  }, []);

  const handleMouseUp = useCallback(() => {
    isDragging.current = false;
  }, []);

  // Touch handlers for pinch-to-zoom
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    if (e.touches.length === 2) {
      const touch1 = e.touches[0];
      const touch2 = e.touches[1];
      lastDistance.current = Math.hypot(
        touch2.clientX - touch1.clientX,
        touch2.clientY - touch1.clientY
      );
      lastCenter.current = {
        x: (touch1.clientX + touch2.clientX) / 2,
        y: (touch1.clientY + touch2.clientY) / 2
      };
    } else if (e.touches.length === 1 && transform.scale > 1) {
      isDragging.current = true;
      lastPosition.current = {
        x: e.touches[0].clientX,
        y: e.touches[0].clientY
      };
    }
  }, [transform.scale]);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (e.touches.length === 2) {
      e.preventDefault();
      const touch1 = e.touches[0];
      const touch2 = e.touches[1];
      
      const distance = Math.hypot(
        touch2.clientX - touch1.clientX,
        touch2.clientY - touch1.clientY
      );
      
      if (lastDistance.current > 0) {
        const scaleDelta = distance / lastDistance.current;
        setTransform(prev => ({
          ...prev,
          scale: Math.max(minScale, Math.min(maxScale, prev.scale * scaleDelta))
        }));
      }
      
      lastDistance.current = distance;
    } else if (e.touches.length === 1 && isDragging.current) {
      const dx = e.touches[0].clientX - lastPosition.current.x;
      const dy = e.touches[0].clientY - lastPosition.current.y;
      
      setTransform(prev => ({
        ...prev,
        x: prev.x + dx,
        y: prev.y + dy
      }));
      
      lastPosition.current = {
        x: e.touches[0].clientX,
        y: e.touches[0].clientY
      };
    }
  }, [minScale, maxScale]);

  const handleTouchEnd = useCallback(() => {
    lastDistance.current = 0;
    isDragging.current = false;
  }, []);

  // Wheel zoom
  const handleWheel = useCallback((e: React.WheelEvent) => {
    if (e.ctrlKey || e.metaKey) {
      e.preventDefault();
      const delta = -e.deltaY * 0.01;
      setTransform(prev => ({
        ...prev,
        scale: Math.max(minScale, Math.min(maxScale, prev.scale + delta))
      }));
    }
  }, [minScale, maxScale]);

  // Double tap to zoom
  const lastTap = useRef<number>(0);
  const handleDoubleTap = useCallback(() => {
    const now = Date.now();
    if (now - lastTap.current < 300) {
      // Double tap detected
      if (transform.scale > 1) {
        reset();
      } else {
        setTransform(prev => ({ ...prev, scale: 2 }));
      }
    }
    lastTap.current = now;
  }, [transform.scale, reset]);

  useEffect(() => {
    onTransformChange?.(transform);
  }, [transform, onTransformChange]);

  return {
    transform,
    containerRef,
    zoomIn,
    zoomOut,
    setZoom,
    rotateLeft,
    rotateRight,
    reset,
    handlers: {
      onMouseDown: handleMouseDown,
      onMouseMove: handleMouseMove,
      onMouseUp: handleMouseUp,
      onMouseLeave: handleMouseUp,
      onTouchStart: handleTouchStart,
      onTouchMove: handleTouchMove,
      onTouchEnd: handleTouchEnd,
      onWheel: handleWheel,
      onClick: handleDoubleTap
    }
  };
};
