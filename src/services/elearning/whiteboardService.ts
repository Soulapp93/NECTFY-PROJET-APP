import { supabase } from '@/integrations/supabase/client';
import { RealtimeChannel } from '@supabase/supabase-js';

const db = supabase as any;

export interface WhiteboardStroke {
  id: string;
  virtual_class_id: string;
  user_id: string;
  stroke_data: {
    type: 'path' | 'line' | 'rect' | 'circle' | 'text' | 'eraser' | 'clear';
    points?: { x: number; y: number }[];
    color?: string;
    strokeWidth?: number;
    startX?: number;
    startY?: number;
    endX?: number;
    endY?: number;
    width?: number;
    height?: number;
    radius?: number;
    text?: string;
    fontSize?: number;
  };
  created_at: string;
}

class WhiteboardService {
  private channel: RealtimeChannel | null = null;

  // Subscribe to whiteboard updates
  subscribeToWhiteboard(
    classId: string,
    onStroke: (stroke: WhiteboardStroke) => void
  ): () => void {
    this.channel = supabase
      .channel(`whiteboard-${classId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'whiteboard_strokes',
          filter: `virtual_class_id=eq.${classId}`,
        },
        (payload: any) => {
          onStroke(payload.new as WhiteboardStroke);
        }
      )
      .subscribe();

    return () => {
      if (this.channel) {
        supabase.removeChannel(this.channel);
        this.channel = null;
      }
    };
  }

  // Get all strokes for a whiteboard
  async getStrokes(classId: string): Promise<WhiteboardStroke[]> {
    const { data, error } = await db
      .from('whiteboard_strokes')
      .select('*')
      .eq('virtual_class_id', classId)
      .order('created_at', { ascending: true });

    if (error) {
      console.error('Error fetching strokes:', error);
      return [];
    }

    return data || [];
  }

  // Add a stroke to the whiteboard
  async addStroke(
    classId: string,
    userId: string,
    strokeData: WhiteboardStroke['stroke_data']
  ): Promise<WhiteboardStroke | null> {
    const { data, error } = await db
      .from('whiteboard_strokes')
      .insert({
        virtual_class_id: classId,
        user_id: userId,
        stroke_data: strokeData,
      })
      .select()
      .single();

    if (error) {
      console.error('Error adding stroke:', error);
      return null;
    }

    return data as WhiteboardStroke;
  }

  // Clear the whiteboard
  async clearWhiteboard(classId: string, userId: string): Promise<void> {
    // Add a clear stroke to signal all clients
    await this.addStroke(classId, userId, { type: 'clear' });
    
    // Delete all previous strokes
    await db
      .from('whiteboard_strokes')
      .delete()
      .eq('virtual_class_id', classId)
      .neq('stroke_data->type', 'clear');
  }
}

export const whiteboardService = new WhiteboardService();
