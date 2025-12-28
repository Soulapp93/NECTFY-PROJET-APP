import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Canvas as FabricCanvas, PencilBrush, Circle, Rect, FabricText, FabricObject } from 'fabric';
import { 
  Pencil, Highlighter, Square, CircleIcon, Type, Eraser, 
  Undo2, Redo2, Trash2, Save, X, Palette
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';

interface AnnotationLayerProps {
  isActive: boolean;
  onToggle: () => void;
  onSave?: (dataUrl: string) => void;
  width: number;
  height: number;
}

type Tool = 'select' | 'pen' | 'highlighter' | 'rectangle' | 'circle' | 'text' | 'eraser';

const COLORS = [
  '#ef4444', '#f97316', '#eab308', '#22c55e', '#3b82f6', '#8b5cf6', '#ec4899',
  '#000000', '#ffffff', '#6b7280'
];

const AnnotationLayer: React.FC<AnnotationLayerProps> = ({
  isActive,
  onToggle,
  onSave,
  width,
  height
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fabricCanvasRef = useRef<FabricCanvas | null>(null);
  
  const [activeTool, setActiveTool] = useState<Tool>('pen');
  const [color, setColor] = useState('#ef4444');
  const [brushSize, setBrushSize] = useState(3);
  const [history, setHistory] = useState<string[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);

  // Initialize Fabric canvas
  useEffect(() => {
    if (!canvasRef.current || !isActive) return;

    const canvas = new FabricCanvas(canvasRef.current, {
      width,
      height,
      backgroundColor: 'transparent',
      selection: activeTool === 'select',
      isDrawingMode: activeTool === 'pen' || activeTool === 'highlighter'
    });

    // Initialize brush
    if (canvas.freeDrawingBrush) {
      canvas.freeDrawingBrush.color = color;
      canvas.freeDrawingBrush.width = brushSize;
    }

    fabricCanvasRef.current = canvas;

    // Save initial state
    saveToHistory();

    return () => {
      canvas.dispose();
      fabricCanvasRef.current = null;
    };
  }, [isActive, width, height]);

  // Update brush settings
  useEffect(() => {
    const canvas = fabricCanvasRef.current;
    if (!canvas) return;

    canvas.isDrawingMode = activeTool === 'pen' || activeTool === 'highlighter';
    canvas.selection = activeTool === 'select';

    if (canvas.freeDrawingBrush) {
      if (activeTool === 'highlighter') {
        canvas.freeDrawingBrush.color = color + '80'; // 50% opacity
        canvas.freeDrawingBrush.width = brushSize * 3;
      } else {
        canvas.freeDrawingBrush.color = color;
        canvas.freeDrawingBrush.width = brushSize;
      }
    }
  }, [activeTool, color, brushSize]);

  const saveToHistory = useCallback(() => {
    const canvas = fabricCanvasRef.current;
    if (!canvas) return;

    const json = JSON.stringify(canvas.toJSON());
    setHistory(prev => {
      const newHistory = prev.slice(0, historyIndex + 1);
      return [...newHistory, json];
    });
    setHistoryIndex(prev => prev + 1);
  }, [historyIndex]);

  const undo = useCallback(() => {
    const canvas = fabricCanvasRef.current;
    if (!canvas || historyIndex <= 0) return;

    const newIndex = historyIndex - 1;
    canvas.loadFromJSON(JSON.parse(history[newIndex]), () => {
      canvas.renderAll();
      setHistoryIndex(newIndex);
    });
  }, [history, historyIndex]);

  const redo = useCallback(() => {
    const canvas = fabricCanvasRef.current;
    if (!canvas || historyIndex >= history.length - 1) return;

    const newIndex = historyIndex + 1;
    canvas.loadFromJSON(JSON.parse(history[newIndex]), () => {
      canvas.renderAll();
      setHistoryIndex(newIndex);
    });
  }, [history, historyIndex]);

  const clearCanvas = useCallback(() => {
    const canvas = fabricCanvasRef.current;
    if (!canvas) return;

    canvas.clear();
    canvas.backgroundColor = 'transparent';
    canvas.renderAll();
    saveToHistory();
  }, [saveToHistory]);

  const addShape = useCallback((tool: Tool) => {
    const canvas = fabricCanvasRef.current;
    if (!canvas) return;

    let shape: FabricObject | null = null;

    if (tool === 'rectangle') {
      shape = new Rect({
        left: width / 2 - 50,
        top: height / 2 - 50,
        width: 100,
        height: 100,
        fill: 'transparent',
        stroke: color,
        strokeWidth: brushSize
      });
    } else if (tool === 'circle') {
      shape = new Circle({
        left: width / 2 - 50,
        top: height / 2 - 50,
        radius: 50,
        fill: 'transparent',
        stroke: color,
        strokeWidth: brushSize
      });
    } else if (tool === 'text') {
      shape = new FabricText('Texte', {
        left: width / 2 - 30,
        top: height / 2 - 10,
        fontSize: 24,
        fill: color,
        editable: true
      });
    }

    if (shape) {
      canvas.add(shape);
      canvas.setActiveObject(shape);
      canvas.renderAll();
      saveToHistory();
      setActiveTool('select');
    }
  }, [width, height, color, brushSize, saveToHistory]);

  const handleToolClick = (tool: Tool) => {
    setActiveTool(tool);
    
    if (tool === 'rectangle' || tool === 'circle' || tool === 'text') {
      addShape(tool);
    } else if (tool === 'eraser') {
      const canvas = fabricCanvasRef.current;
      if (canvas) {
        const activeObject = canvas.getActiveObject();
        if (activeObject) {
          canvas.remove(activeObject);
          canvas.renderAll();
          saveToHistory();
        }
      }
    }
  };

  const handleSave = () => {
    const canvas = fabricCanvasRef.current;
    if (!canvas || !onSave) return;

    const dataUrl = canvas.toDataURL({ multiplier: 1, format: 'png', quality: 1 });
    onSave(dataUrl);
  };

  if (!isActive) return null;

  return (
    <div className="absolute inset-0 z-50 pointer-events-none">
      {/* Canvas */}
      <canvas
        ref={canvasRef}
        className="absolute inset-0 pointer-events-auto"
        style={{ touchAction: 'none' }}
      />

      {/* Toolbar */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-1 bg-background/95 backdrop-blur-sm rounded-full px-3 py-2 shadow-lg border pointer-events-auto">
        {/* Tools */}
        <Button
          variant={activeTool === 'select' ? 'secondary' : 'ghost'}
          size="icon"
          onClick={() => setActiveTool('select')}
          className="h-8 w-8"
          title="Sélectionner"
        >
          <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M3 3l7.07 16.97 2.51-7.39 7.39-2.51L3 3z" />
          </svg>
        </Button>

        <Button
          variant={activeTool === 'pen' ? 'secondary' : 'ghost'}
          size="icon"
          onClick={() => setActiveTool('pen')}
          className="h-8 w-8"
          title="Stylo"
        >
          <Pencil className="h-4 w-4" />
        </Button>

        <Button
          variant={activeTool === 'highlighter' ? 'secondary' : 'ghost'}
          size="icon"
          onClick={() => setActiveTool('highlighter')}
          className="h-8 w-8"
          title="Surligneur"
        >
          <Highlighter className="h-4 w-4" />
        </Button>

        <Button
          variant="ghost"
          size="icon"
          onClick={() => handleToolClick('rectangle')}
          className="h-8 w-8"
          title="Rectangle"
        >
          <Square className="h-4 w-4" />
        </Button>

        <Button
          variant="ghost"
          size="icon"
          onClick={() => handleToolClick('circle')}
          className="h-8 w-8"
          title="Cercle"
        >
          <CircleIcon className="h-4 w-4" />
        </Button>

        <Button
          variant="ghost"
          size="icon"
          onClick={() => handleToolClick('text')}
          className="h-8 w-8"
          title="Texte"
        >
          <Type className="h-4 w-4" />
        </Button>

        <Button
          variant="ghost"
          size="icon"
          onClick={() => handleToolClick('eraser')}
          className="h-8 w-8"
          title="Supprimer la sélection"
        >
          <Eraser className="h-4 w-4" />
        </Button>

        <div className="w-px h-6 bg-border mx-1" />

        {/* Color picker */}
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <div 
                className="h-5 w-5 rounded-full border-2 border-border" 
                style={{ backgroundColor: color }}
              />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-2">
            <div className="grid grid-cols-5 gap-1">
              {COLORS.map((c) => (
                <button
                  key={c}
                  onClick={() => setColor(c)}
                  className={cn(
                    "h-6 w-6 rounded-full border-2 transition-transform hover:scale-110",
                    color === c ? "border-primary ring-2 ring-primary/20" : "border-border"
                  )}
                  style={{ backgroundColor: c }}
                />
              ))}
            </div>
            <div className="mt-2 pt-2 border-t">
              <label className="text-xs text-muted-foreground">Taille</label>
              <Slider
                value={[brushSize]}
                min={1}
                max={20}
                step={1}
                onValueChange={([v]) => setBrushSize(v)}
                className="mt-1"
              />
            </div>
          </PopoverContent>
        </Popover>

        <div className="w-px h-6 bg-border mx-1" />

        {/* History */}
        <Button
          variant="ghost"
          size="icon"
          onClick={undo}
          disabled={historyIndex <= 0}
          className="h-8 w-8"
          title="Annuler"
        >
          <Undo2 className="h-4 w-4" />
        </Button>

        <Button
          variant="ghost"
          size="icon"
          onClick={redo}
          disabled={historyIndex >= history.length - 1}
          className="h-8 w-8"
          title="Rétablir"
        >
          <Redo2 className="h-4 w-4" />
        </Button>

        <Button
          variant="ghost"
          size="icon"
          onClick={clearCanvas}
          className="h-8 w-8 hover:text-destructive"
          title="Effacer tout"
        >
          <Trash2 className="h-4 w-4" />
        </Button>

        <div className="w-px h-6 bg-border mx-1" />

        {/* Save & Close */}
        {onSave && (
          <Button
            variant="ghost"
            size="icon"
            onClick={handleSave}
            className="h-8 w-8 text-green-600"
            title="Sauvegarder"
          >
            <Save className="h-4 w-4" />
          </Button>
        )}

        <Button
          variant="ghost"
          size="icon"
          onClick={onToggle}
          className="h-8 w-8"
          title="Fermer les annotations"
        >
          <X className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
};

export default AnnotationLayer;
