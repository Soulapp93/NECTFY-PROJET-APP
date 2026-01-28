import { useState, useEffect, useCallback, useRef } from 'react';
import { whiteboardService, WhiteboardStroke } from '@/services/elearning/whiteboardService';

interface Point {
  x: number;
  y: number;
}

interface UseWhiteboardOptions {
  classId: string;
  userId: string;
}

export type Tool = 'pen' | 'line' | 'rect' | 'circle' | 'text' | 'eraser';

export const useWhiteboard = ({ classId, userId }: UseWhiteboardOptions) => {
  const [strokes, setStrokes] = useState<WhiteboardStroke[]>([]);
  const [currentTool, setCurrentTool] = useState<Tool>('pen');
  const [color, setColor] = useState('#000000');
  const [strokeWidth, setStrokeWidth] = useState(3);
  const [isDrawing, setIsDrawing] = useState(false);
  const [currentPoints, setCurrentPoints] = useState<Point[]>([]);
  const [startPoint, setStartPoint] = useState<Point | null>(null);
  
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const contextRef = useRef<CanvasRenderingContext2D | null>(null);
  const cleanupRef = useRef<(() => void) | null>(null);

  // Initialize canvas
  const initCanvas = useCallback((canvas: HTMLCanvasElement) => {
    canvasRef.current = canvas;
    const context = canvas.getContext('2d');
    if (context) {
      context.lineCap = 'round';
      context.lineJoin = 'round';
      context.strokeStyle = color;
      context.lineWidth = strokeWidth;
      contextRef.current = context;
    }
  }, [color, strokeWidth]);

  // Load existing strokes
  const loadStrokes = useCallback(async () => {
    const existingStrokes = await whiteboardService.getStrokes(classId);
    setStrokes(existingStrokes);
    
    // Redraw all strokes
    if (contextRef.current && canvasRef.current) {
      const canvas = canvasRef.current;
      contextRef.current.clearRect(0, 0, canvas.width, canvas.height);
      existingStrokes.forEach(stroke => drawStroke(stroke));
    }
  }, [classId]);

  // Draw a stroke on canvas
  const drawStroke = useCallback((stroke: WhiteboardStroke) => {
    const ctx = contextRef.current;
    if (!ctx || !canvasRef.current) return;

    const { stroke_data: data } = stroke;

    if (data.type === 'clear') {
      ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
      return;
    }

    ctx.save();
    ctx.strokeStyle = data.color || '#000000';
    ctx.lineWidth = data.strokeWidth || 3;

    switch (data.type) {
      case 'path':
        if (data.points && data.points.length > 1) {
          ctx.beginPath();
          ctx.moveTo(data.points[0].x, data.points[0].y);
          for (let i = 1; i < data.points.length; i++) {
            ctx.lineTo(data.points[i].x, data.points[i].y);
          }
          ctx.stroke();
        }
        break;

      case 'line':
        if (data.startX !== undefined && data.startY !== undefined && 
            data.endX !== undefined && data.endY !== undefined) {
          ctx.beginPath();
          ctx.moveTo(data.startX, data.startY);
          ctx.lineTo(data.endX, data.endY);
          ctx.stroke();
        }
        break;

      case 'rect':
        if (data.startX !== undefined && data.startY !== undefined && 
            data.width !== undefined && data.height !== undefined) {
          ctx.strokeRect(data.startX, data.startY, data.width, data.height);
        }
        break;

      case 'circle':
        if (data.startX !== undefined && data.startY !== undefined && 
            data.radius !== undefined) {
          ctx.beginPath();
          ctx.arc(data.startX, data.startY, data.radius, 0, Math.PI * 2);
          ctx.stroke();
        }
        break;

      case 'text':
        if (data.text && data.startX !== undefined && data.startY !== undefined) {
          ctx.font = `${data.fontSize || 16}px Arial`;
          ctx.fillStyle = data.color || '#000000';
          ctx.fillText(data.text, data.startX, data.startY);
        }
        break;

      case 'eraser':
        if (data.points && data.points.length > 1) {
          ctx.globalCompositeOperation = 'destination-out';
          ctx.lineWidth = (data.strokeWidth || 3) * 5;
          ctx.beginPath();
          ctx.moveTo(data.points[0].x, data.points[0].y);
          for (let i = 1; i < data.points.length; i++) {
            ctx.lineTo(data.points[i].x, data.points[i].y);
          }
          ctx.stroke();
          ctx.globalCompositeOperation = 'source-over';
        }
        break;
    }

    ctx.restore();
  }, []);

  // Subscribe to new strokes
  useEffect(() => {
    loadStrokes();

    const cleanup = whiteboardService.subscribeToWhiteboard(classId, (newStroke) => {
      if (newStroke.user_id !== userId) {
        setStrokes(prev => [...prev, newStroke]);
        drawStroke(newStroke);
      }
    });

    cleanupRef.current = cleanup;

    return () => {
      if (cleanupRef.current) {
        cleanupRef.current();
      }
    };
  }, [classId, userId, loadStrokes, drawStroke]);

  // Handle mouse/touch events
  const startDrawing = useCallback((x: number, y: number) => {
    setIsDrawing(true);
    setStartPoint({ x, y });
    setCurrentPoints([{ x, y }]);

    if (currentTool === 'pen' || currentTool === 'eraser') {
      if (contextRef.current) {
        contextRef.current.beginPath();
        contextRef.current.moveTo(x, y);
      }
    }
  }, [currentTool]);

  const draw = useCallback((x: number, y: number) => {
    if (!isDrawing) return;

    setCurrentPoints(prev => [...prev, { x, y }]);

    if ((currentTool === 'pen' || currentTool === 'eraser') && contextRef.current) {
      if (currentTool === 'eraser') {
        contextRef.current.globalCompositeOperation = 'destination-out';
        contextRef.current.lineWidth = strokeWidth * 5;
      } else {
        contextRef.current.globalCompositeOperation = 'source-over';
        contextRef.current.strokeStyle = color;
        contextRef.current.lineWidth = strokeWidth;
      }
      contextRef.current.lineTo(x, y);
      contextRef.current.stroke();
    }
  }, [isDrawing, currentTool, color, strokeWidth]);

  const endDrawing = useCallback(async (x: number, y: number) => {
    if (!isDrawing) return;
    setIsDrawing(false);

    let strokeData: WhiteboardStroke['stroke_data'];

    switch (currentTool) {
      case 'pen':
        strokeData = {
          type: 'path',
          points: currentPoints,
          color,
          strokeWidth,
        };
        break;

      case 'eraser':
        strokeData = {
          type: 'eraser',
          points: currentPoints,
          strokeWidth,
        };
        break;

      case 'line':
        strokeData = {
          type: 'line',
          startX: startPoint?.x || 0,
          startY: startPoint?.y || 0,
          endX: x,
          endY: y,
          color,
          strokeWidth,
        };
        // Draw the final line
        if (contextRef.current && startPoint) {
          contextRef.current.strokeStyle = color;
          contextRef.current.lineWidth = strokeWidth;
          contextRef.current.beginPath();
          contextRef.current.moveTo(startPoint.x, startPoint.y);
          contextRef.current.lineTo(x, y);
          contextRef.current.stroke();
        }
        break;

      case 'rect':
        const width = x - (startPoint?.x || 0);
        const height = y - (startPoint?.y || 0);
        strokeData = {
          type: 'rect',
          startX: startPoint?.x || 0,
          startY: startPoint?.y || 0,
          width,
          height,
          color,
          strokeWidth,
        };
        // Draw the final rectangle
        if (contextRef.current && startPoint) {
          contextRef.current.strokeStyle = color;
          contextRef.current.lineWidth = strokeWidth;
          contextRef.current.strokeRect(startPoint.x, startPoint.y, width, height);
        }
        break;

      case 'circle':
        const radius = Math.sqrt(
          Math.pow(x - (startPoint?.x || 0), 2) + 
          Math.pow(y - (startPoint?.y || 0), 2)
        );
        strokeData = {
          type: 'circle',
          startX: startPoint?.x || 0,
          startY: startPoint?.y || 0,
          radius,
          color,
          strokeWidth,
        };
        // Draw the final circle
        if (contextRef.current && startPoint) {
          contextRef.current.strokeStyle = color;
          contextRef.current.lineWidth = strokeWidth;
          contextRef.current.beginPath();
          contextRef.current.arc(startPoint.x, startPoint.y, radius, 0, Math.PI * 2);
          contextRef.current.stroke();
        }
        break;

      default:
        return;
    }

    // Save stroke to database
    const savedStroke = await whiteboardService.addStroke(classId, userId, strokeData);
    if (savedStroke) {
      setStrokes(prev => [...prev, savedStroke]);
    }

    setCurrentPoints([]);
    setStartPoint(null);
  }, [isDrawing, currentTool, currentPoints, startPoint, color, strokeWidth, classId, userId]);

  // Add text at position
  const addText = useCallback(async (x: number, y: number, text: string, fontSize: number = 16) => {
    const strokeData: WhiteboardStroke['stroke_data'] = {
      type: 'text',
      startX: x,
      startY: y,
      text,
      fontSize,
      color,
    };

    // Draw immediately
    if (contextRef.current) {
      contextRef.current.font = `${fontSize}px Arial`;
      contextRef.current.fillStyle = color;
      contextRef.current.fillText(text, x, y);
    }

    // Save to database
    const savedStroke = await whiteboardService.addStroke(classId, userId, strokeData);
    if (savedStroke) {
      setStrokes(prev => [...prev, savedStroke]);
    }
  }, [classId, userId, color]);

  // Clear whiteboard
  const clearWhiteboard = useCallback(async () => {
    if (contextRef.current && canvasRef.current) {
      contextRef.current.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
    }
    await whiteboardService.clearWhiteboard(classId, userId);
    setStrokes([]);
  }, [classId, userId]);

  // Get canvas as image
  const getCanvasImage = useCallback((): string | null => {
    if (canvasRef.current) {
      return canvasRef.current.toDataURL('image/png');
    }
    return null;
  }, []);

  return {
    strokes,
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
    refreshStrokes: loadStrokes,
  };
};
