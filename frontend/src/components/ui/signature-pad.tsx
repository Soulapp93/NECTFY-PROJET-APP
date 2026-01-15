import React, { useRef, useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { RotateCcw, Check, X } from 'lucide-react';

interface SignaturePadProps {
  width?: number;
  height?: number;
  onSave: (signature: string) => void;
  onCancel: () => void;
  initialSignature?: string;
}

const SignaturePad: React.FC<SignaturePadProps> = ({
  width = 400,
  height = 200,
  onSave,
  onCancel,
  initialSignature
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [isEmpty, setIsEmpty] = useState(true);
  const [isInitialized, setIsInitialized] = useState(false);
  const [canvasSize, setCanvasSize] = useState({ width, height });

  // Responsive canvas sizing
  useEffect(() => {
    const updateSize = () => {
      if (containerRef.current) {
        const containerWidth = containerRef.current.offsetWidth - 32; // Subtract padding
        const newWidth = Math.min(width, containerWidth);
        const aspectRatio = height / width;
        const newHeight = Math.round(newWidth * aspectRatio);
        setCanvasSize({ width: newWidth, height: Math.max(newHeight, 150) });
      }
    };

    updateSize();
    window.addEventListener('resize', updateSize);
    return () => window.removeEventListener('resize', updateSize);
  }, [width, height]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const context = canvas.getContext('2d');
    if (!context) return;

    // Configuration du canvas
    context.lineCap = 'round';
    context.lineJoin = 'round';
    context.lineWidth = 2;
    context.strokeStyle = '#000000';

    // Effacer le canvas
    context.fillStyle = '#ffffff';
    context.fillRect(0, 0, canvasSize.width, canvasSize.height);

    // Charger la signature initiale si elle existe
    if (initialSignature) {
      const img = new Image();
      img.onload = () => {
        context.fillStyle = '#ffffff';
        context.fillRect(0, 0, canvasSize.width, canvasSize.height);
        context.drawImage(img, 0, 0, canvasSize.width, canvasSize.height);
        setIsEmpty(false);
      };
      img.onerror = () => {
        setIsEmpty(true);
      };
      img.src = initialSignature;
    } else {
      setIsEmpty(true);
    }
    
    setIsInitialized(true);
  }, [canvasSize.width, canvasSize.height, initialSignature]);

  const getMousePos = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };

    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    return {
      x: (e.clientX - rect.left) * scaleX,
      y: (e.clientY - rect.top) * scaleY
    };
  };

  const getTouchPos = (e: React.TouchEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };

    const rect = canvas.getBoundingClientRect();
    const touch = e.touches[0];
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    return {
      x: (touch.clientX - rect.left) * scaleX,
      y: (touch.clientY - rect.top) * scaleY
    };
  };

  const startDrawing = (pos: { x: number; y: number }) => {
    const canvas = canvasRef.current;
    const context = canvas?.getContext('2d');
    if (!context) return;

    setIsDrawing(true);
    setIsEmpty(false);
    context.beginPath();
    context.moveTo(pos.x, pos.y);
  };

  const draw = (pos: { x: number; y: number }) => {
    if (!isDrawing) return;

    const canvas = canvasRef.current;
    const context = canvas?.getContext('2d');
    if (!context) return;

    context.lineTo(pos.x, pos.y);
    context.stroke();
  };

  const stopDrawing = () => {
    setIsDrawing(false);
  };

  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    const pos = getMousePos(e);
    startDrawing(pos);
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    const pos = getMousePos(e);
    draw(pos);
  };

  const handleMouseUp = (e: React.MouseEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    stopDrawing();
  };

  const handleTouchStart = (e: React.TouchEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    const pos = getTouchPos(e);
    startDrawing(pos);
  };

  const handleTouchMove = (e: React.TouchEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    const pos = getTouchPos(e);
    draw(pos);
  };

  const handleTouchEnd = (e: React.TouchEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    stopDrawing();
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    const context = canvas?.getContext('2d');
    if (!context) return;

    context.fillStyle = '#ffffff';
    context.fillRect(0, 0, canvasSize.width, canvasSize.height);
    setIsEmpty(true);
  };

  const saveSignature = () => {
    const canvas = canvasRef.current;
    if (!canvas || isEmpty) return;

    const dataURL = canvas.toDataURL('image/png');
    onSave(dataURL);
  };

  return (
    <div ref={containerRef} className="flex flex-col items-center space-y-4 w-full max-w-full">
      <div className="border-2 border-gray-300 rounded-lg p-2 sm:p-4 bg-white w-full max-w-full overflow-hidden">
        <canvas
          ref={canvasRef}
          width={canvasSize.width}
          height={canvasSize.height}
          className="border border-gray-200 cursor-crosshair touch-none w-full"
          style={{ maxWidth: '100%', height: 'auto' }}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
        />
        <p className="text-xs sm:text-sm text-muted-foreground mt-2 text-center">
          Signez dans la zone ci-dessus
        </p>
      </div>

      <div className="flex flex-wrap justify-center gap-2 sm:gap-3 w-full">
        <Button
          variant="outline"
          size="sm"
          onClick={clearCanvas}
          disabled={isEmpty}
          className="flex items-center text-xs sm:text-sm"
        >
          <RotateCcw className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
          <span className="hidden sm:inline">Effacer</span>
          <span className="sm:hidden">Reset</span>
        </Button>
        
        <Button
          variant="outline"
          size="sm"
          onClick={onCancel}
          className="text-xs sm:text-sm"
        >
          <X className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:hidden" />
          <span>Annuler</span>
        </Button>

        <Button
          size="sm"
          onClick={saveSignature}
          disabled={isEmpty}
          className="bg-green-600 hover:bg-green-700 text-white text-xs sm:text-sm"
        >
          <Check className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
          <span className="hidden sm:inline">Valider ma signature</span>
          <span className="sm:hidden">Valider</span>
        </Button>
      </div>
    </div>
  );
};

export default SignaturePad;
