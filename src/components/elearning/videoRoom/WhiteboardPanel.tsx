import React, { useRef, useEffect, useCallback } from 'react';
import { 
  Pen, Square, Circle, Minus, Type, Eraser, Trash2, 
  Download, Palette, X, ChevronLeft, ChevronRight
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { useWhiteboard, Tool } from '@/hooks/useWhiteboard';
import { cn } from '@/lib/utils';

interface WhiteboardPanelProps {
  classId: string;
  userId: string;
  onClose: () => void;
  isFullscreen?: boolean;
  onToggleFullscreen?: () => void;
}

const COLORS = [
  '#000000', '#FFFFFF', '#EF4444', '#F97316', '#EAB308', 
  '#22C55E', '#3B82F6', '#8B5CF6', '#EC4899', '#6B7280'
];

const TOOLS: { tool: Tool; icon: React.ReactNode; label: string }[] = [
  { tool: 'pen', icon: <Pen className="h-4 w-4" />, label: 'Crayon' },
  { tool: 'line', icon: <Minus className="h-4 w-4" />, label: 'Ligne' },
  { tool: 'rect', icon: <Square className="h-4 w-4" />, label: 'Rectangle' },
  { tool: 'circle', icon: <Circle className="h-4 w-4" />, label: 'Cercle' },
  { tool: 'text', icon: <Type className="h-4 w-4" />, label: 'Texte' },
  { tool: 'eraser', icon: <Eraser className="h-4 w-4" />, label: 'Gomme' },
];

const WhiteboardPanel: React.FC<WhiteboardPanelProps> = ({
  classId,
  userId,
  onClose,
  isFullscreen = false,
  onToggleFullscreen,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isToolbarCollapsed, setIsToolbarCollapsed] = React.useState(false);

  const {
    currentTool,
    setCurrentTool,
    color,
    setColor,
    strokeWidth,
    setStrokeWidth,
    isDrawing,
    canvasRef,
    initCanvas,
    startDrawing,
    draw,
    endDrawing,
    addText,
    clearWhiteboard,
    getCanvasImage,
  } = useWhiteboard({ classId, userId });

  // Initialize canvas on mount
  useEffect(() => {
    if (containerRef.current) {
      const canvas = document.createElement('canvas');
      const rect = containerRef.current.getBoundingClientRect();
      canvas.width = rect.width;
      canvas.height = rect.height;
      canvas.style.width = '100%';
      canvas.style.height = '100%';
      canvas.style.cursor = 'crosshair';
      
      containerRef.current.appendChild(canvas);
      initCanvas(canvas);

      return () => {
        if (containerRef.current?.contains(canvas)) {
          containerRef.current.removeChild(canvas);
        }
      };
    }
  }, [initCanvas]);

  // Handle mouse events
  const handleMouseDown = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    if (currentTool === 'text') {
      const text = prompt('Entrez le texte:');
      if (text) {
        addText(x, y, text, 16);
      }
    } else {
      startDrawing(x, y);
    }
  }, [canvasRef, currentTool, startDrawing, addText]);

  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    const canvas = canvasRef.current;
    if (!canvas || !isDrawing) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    draw(x, y);
  }, [canvasRef, isDrawing, draw]);

  const handleMouseUp = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    endDrawing(x, y);
  }, [canvasRef, endDrawing]);

  // Handle touch events
  const handleTouchStart = useCallback((e: React.TouchEvent<HTMLDivElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const touch = e.touches[0];
    const rect = canvas.getBoundingClientRect();
    const x = touch.clientX - rect.left;
    const y = touch.clientY - rect.top;

    startDrawing(x, y);
  }, [canvasRef, startDrawing]);

  const handleTouchMove = useCallback((e: React.TouchEvent<HTMLDivElement>) => {
    const canvas = canvasRef.current;
    if (!canvas || !isDrawing) return;

    const touch = e.touches[0];
    const rect = canvas.getBoundingClientRect();
    const x = touch.clientX - rect.left;
    const y = touch.clientY - rect.top;

    draw(x, y);
  }, [canvasRef, isDrawing, draw]);

  const handleTouchEnd = useCallback((e: React.TouchEvent<HTMLDivElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const touch = e.changedTouches[0];
    const rect = canvas.getBoundingClientRect();
    const x = touch.clientX - rect.left;
    const y = touch.clientY - rect.top;

    endDrawing(x, y);
  }, [canvasRef, endDrawing]);

  // Download canvas as image
  const handleDownload = () => {
    const imageData = getCanvasImage();
    if (imageData) {
      const link = document.createElement('a');
      link.download = `whiteboard-${classId}-${Date.now()}.png`;
      link.href = imageData;
      link.click();
    }
  };

  // Handle clear
  const handleClear = () => {
    if (confirm('Êtes-vous sûr de vouloir effacer tout le tableau ?')) {
      clearWhiteboard();
    }
  };

  return (
    <TooltipProvider>
      <div className={cn(
        "flex flex-col bg-card border-l",
        isFullscreen ? "fixed inset-0 z-50" : "h-full"
      )}>
        {/* Header */}
        <div className="flex items-center justify-between p-3 border-b">
          <h3 className="font-semibold">Tableau blanc</h3>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Canvas Area */}
        <div className="flex-1 relative overflow-hidden">
          <div 
            ref={containerRef}
            className="absolute inset-0 bg-white"
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={(e) => isDrawing && handleMouseUp(e)}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
          />

          {/* Floating Toolbar */}
          <div className={cn(
            "absolute left-3 top-1/2 -translate-y-1/2 bg-card rounded-lg shadow-lg border p-2 flex flex-col gap-1 transition-all",
            isToolbarCollapsed && "translate-x-[-calc(100%-32px)]"
          )}>
            <Button
              variant="ghost"
              size="icon"
              className="absolute -right-3 top-1/2 -translate-y-1/2 h-6 w-6 rounded-full bg-card border shadow-sm"
              onClick={() => setIsToolbarCollapsed(!isToolbarCollapsed)}
            >
              {isToolbarCollapsed ? <ChevronRight className="h-3 w-3" /> : <ChevronLeft className="h-3 w-3" />}
            </Button>

            {TOOLS.map(({ tool, icon, label }) => (
              <Tooltip key={tool}>
                <TooltipTrigger asChild>
                  <Button
                    variant={currentTool === tool ? "default" : "ghost"}
                    size="icon"
                    onClick={() => setCurrentTool(tool)}
                  >
                    {icon}
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="right">{label}</TooltipContent>
              </Tooltip>
            ))}

            <div className="h-px bg-border my-1" />

            {/* Color Picker */}
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="ghost" size="icon">
                  <div 
                    className="h-5 w-5 rounded-full border-2 border-border"
                    style={{ backgroundColor: color }}
                  />
                </Button>
              </PopoverTrigger>
              <PopoverContent side="right" className="w-auto p-2">
                <div className="grid grid-cols-5 gap-1">
                  {COLORS.map((c) => (
                    <button
                      key={c}
                      className={cn(
                        "h-6 w-6 rounded-full border-2 transition-transform hover:scale-110",
                        color === c ? "border-primary" : "border-transparent"
                      )}
                      style={{ backgroundColor: c }}
                      onClick={() => setColor(c)}
                    />
                  ))}
                </div>
              </PopoverContent>
            </Popover>

            {/* Stroke Width */}
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="ghost" size="icon">
                  <div className="flex items-center justify-center">
                    <div 
                      className="rounded-full bg-foreground" 
                      style={{ width: Math.min(strokeWidth * 2, 16), height: Math.min(strokeWidth * 2, 16) }}
                    />
                  </div>
                </Button>
              </PopoverTrigger>
              <PopoverContent side="right" className="w-48">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Épaisseur: {strokeWidth}px</label>
                  <Slider
                    value={[strokeWidth]}
                    onValueChange={([value]) => setStrokeWidth(value)}
                    min={1}
                    max={20}
                    step={1}
                  />
                </div>
              </PopoverContent>
            </Popover>

            <div className="h-px bg-border my-1" />

            {/* Actions */}
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="icon" onClick={handleDownload}>
                  <Download className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="right">Télécharger</TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="icon" onClick={handleClear} className="text-destructive hover:text-destructive">
                  <Trash2 className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="right">Effacer tout</TooltipContent>
            </Tooltip>
          </div>
        </div>
      </div>
    </TooltipProvider>
  );
};

export default WhiteboardPanel;
