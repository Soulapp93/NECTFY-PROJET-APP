-- ================================================
-- SYSTÈME E-LEARNING 100% NATIF WEBRTC
-- ================================================

-- Table des sessions de classe virtuelle
CREATE TABLE public.virtual_classes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  formation_id UUID NOT NULL REFERENCES public.formations(id) ON DELETE CASCADE,
  module_id UUID REFERENCES public.formation_modules(id) ON DELETE SET NULL,
  instructor_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  establishment_id UUID NOT NULL REFERENCES public.establishments(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  status TEXT NOT NULL DEFAULT 'Programmé' CHECK (status IN ('Programmé', 'En cours', 'Terminé', 'Annulé')),
  max_participants INTEGER DEFAULT 50,
  current_participants INTEGER DEFAULT 0,
  recording_enabled BOOLEAN DEFAULT false,
  screen_sharing_enabled BOOLEAN DEFAULT true,
  whiteboard_enabled BOOLEAN DEFAULT true,
  chat_enabled BOOLEAN DEFAULT true,
  started_at TIMESTAMP WITH TIME ZONE,
  ended_at TIMESTAMP WITH TIME ZONE,
  created_by UUID REFERENCES public.users(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Index pour optimisation
CREATE INDEX idx_virtual_classes_formation ON public.virtual_classes(formation_id);
CREATE INDEX idx_virtual_classes_instructor ON public.virtual_classes(instructor_id);
CREATE INDEX idx_virtual_classes_date ON public.virtual_classes(date);
CREATE INDEX idx_virtual_classes_status ON public.virtual_classes(status);
CREATE INDEX idx_virtual_classes_establishment ON public.virtual_classes(establishment_id);

-- Table des participants aux sessions
CREATE TABLE public.virtual_class_participants (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  virtual_class_id UUID NOT NULL REFERENCES public.virtual_classes(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'Inscrit' CHECK (status IN ('Inscrit', 'En attente', 'Présent', 'Absent', 'Expulsé')),
  joined_at TIMESTAMP WITH TIME ZONE,
  left_at TIMESTAMP WITH TIME ZONE,
  is_muted BOOLEAN DEFAULT false,
  is_video_off BOOLEAN DEFAULT false,
  is_hand_raised BOOLEAN DEFAULT false,
  role TEXT DEFAULT 'participant' CHECK (role IN ('host', 'co-host', 'participant')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(virtual_class_id, user_id)
);

CREATE INDEX idx_vcp_virtual_class ON public.virtual_class_participants(virtual_class_id);
CREATE INDEX idx_vcp_user ON public.virtual_class_participants(user_id);

-- Table de signalisation WebRTC (pour l'échange SDP/ICE)
CREATE TABLE public.webrtc_signals (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  virtual_class_id UUID NOT NULL REFERENCES public.virtual_classes(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL,
  receiver_id UUID, -- NULL = broadcast to all
  signal_type TEXT NOT NULL CHECK (signal_type IN ('offer', 'answer', 'ice-candidate', 'renegotiate', 'leave', 'mute', 'unmute', 'video-on', 'video-off', 'hand-raise', 'hand-lower')),
  signal_data JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Index pour récupération rapide des signaux
CREATE INDEX idx_webrtc_signals_class ON public.webrtc_signals(virtual_class_id);
CREATE INDEX idx_webrtc_signals_receiver ON public.webrtc_signals(receiver_id);
CREATE INDEX idx_webrtc_signals_created ON public.webrtc_signals(created_at DESC);

-- Cleanup automatique des vieux signaux (garder 1h max)
CREATE OR REPLACE FUNCTION public.cleanup_old_webrtc_signals()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  DELETE FROM public.webrtc_signals 
  WHERE created_at < now() - interval '1 hour';
END;
$$;

-- Table des messages de chat en temps réel pour les sessions
CREATE TABLE public.virtual_class_messages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  virtual_class_id UUID NOT NULL REFERENCES public.virtual_classes(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  message_type TEXT DEFAULT 'text' CHECK (message_type IN ('text', 'file', 'system')),
  file_url TEXT,
  file_name TEXT,
  is_pinned BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE INDEX idx_vcm_virtual_class ON public.virtual_class_messages(virtual_class_id);
CREATE INDEX idx_vcm_created ON public.virtual_class_messages(created_at DESC);

-- Table des enregistrements
CREATE TABLE public.virtual_class_recordings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  virtual_class_id UUID NOT NULL REFERENCES public.virtual_classes(id) ON DELETE CASCADE,
  file_url TEXT NOT NULL,
  file_name TEXT NOT NULL,
  file_size BIGINT,
  duration_seconds INTEGER,
  recorded_by UUID REFERENCES public.users(id),
  status TEXT DEFAULT 'processing' CHECK (status IN ('processing', 'ready', 'failed')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE INDEX idx_vcr_virtual_class ON public.virtual_class_recordings(virtual_class_id);

-- Table pour le tableau blanc collaboratif
CREATE TABLE public.whiteboard_strokes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  virtual_class_id UUID NOT NULL REFERENCES public.virtual_classes(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  stroke_data JSONB NOT NULL, -- Points, couleur, épaisseur, etc.
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE INDEX idx_whiteboard_class ON public.whiteboard_strokes(virtual_class_id);

-- Table des matériaux/ressources partagées
CREATE TABLE public.virtual_class_materials (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  virtual_class_id UUID NOT NULL REFERENCES public.virtual_classes(id) ON DELETE CASCADE,
  uploaded_by UUID REFERENCES public.users(id),
  file_name TEXT NOT NULL,
  file_url TEXT NOT NULL,
  file_size INTEGER,
  file_type TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE INDEX idx_vcmat_virtual_class ON public.virtual_class_materials(virtual_class_id);

-- Enable RLS on all tables
ALTER TABLE public.virtual_classes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.virtual_class_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.webrtc_signals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.virtual_class_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.virtual_class_recordings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.whiteboard_strokes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.virtual_class_materials ENABLE ROW LEVEL SECURITY;

-- RLS Policies for virtual_classes
CREATE POLICY "Admins manage virtual classes"
ON public.virtual_classes FOR ALL
USING (is_current_user_admin() AND establishment_id = get_current_user_establishment());

CREATE POLICY "Instructors manage own classes"
ON public.virtual_classes FOR ALL
USING (instructor_id = auth.uid());

CREATE POLICY "View formation virtual classes"
ON public.virtual_classes FOR SELECT
USING (
  formation_id IN (
    SELECT formation_id FROM public.user_formation_assignments WHERE user_id = auth.uid()
  )
  OR establishment_id = get_current_user_establishment()
);

-- RLS Policies for participants
CREATE POLICY "Manage own participation"
ON public.virtual_class_participants FOR ALL
USING (user_id = auth.uid());

CREATE POLICY "Admins manage participants"
ON public.virtual_class_participants FOR ALL
USING (
  is_current_user_admin() 
  OR virtual_class_id IN (
    SELECT id FROM public.virtual_classes WHERE instructor_id = auth.uid()
  )
);

CREATE POLICY "View class participants"
ON public.virtual_class_participants FOR SELECT
USING (
  virtual_class_id IN (
    SELECT id FROM public.virtual_classes 
    WHERE formation_id IN (
      SELECT formation_id FROM public.user_formation_assignments WHERE user_id = auth.uid()
    )
  )
);

-- RLS Policies for WebRTC signals
CREATE POLICY "Send signals in joined classes"
ON public.webrtc_signals FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.virtual_class_participants 
    WHERE virtual_class_id = webrtc_signals.virtual_class_id 
    AND user_id = auth.uid()
  )
  OR EXISTS (
    SELECT 1 FROM public.virtual_classes 
    WHERE id = webrtc_signals.virtual_class_id 
    AND instructor_id = auth.uid()
  )
);

CREATE POLICY "Receive signals for me"
ON public.webrtc_signals FOR SELECT
USING (
  receiver_id = auth.uid() 
  OR receiver_id IS NULL
);

CREATE POLICY "Delete own signals"
ON public.webrtc_signals FOR DELETE
USING (sender_id = auth.uid());

-- RLS Policies for chat messages
CREATE POLICY "Send messages in classes"
ON public.virtual_class_messages FOR INSERT
WITH CHECK (sender_id = auth.uid());

CREATE POLICY "View class messages"
ON public.virtual_class_messages FOR SELECT
USING (
  virtual_class_id IN (
    SELECT vcp.virtual_class_id FROM public.virtual_class_participants vcp WHERE vcp.user_id = auth.uid()
    UNION
    SELECT vc.id FROM public.virtual_classes vc WHERE vc.instructor_id = auth.uid()
  )
);

CREATE POLICY "Delete own messages"
ON public.virtual_class_messages FOR DELETE
USING (sender_id = auth.uid());

-- RLS Policies for recordings
CREATE POLICY "View class recordings"
ON public.virtual_class_recordings FOR SELECT
USING (
  virtual_class_id IN (
    SELECT vcp.virtual_class_id FROM public.virtual_class_participants vcp WHERE vcp.user_id = auth.uid()
    UNION
    SELECT vc.id FROM public.virtual_classes vc WHERE vc.instructor_id = auth.uid()
  )
);

CREATE POLICY "Manage recordings"
ON public.virtual_class_recordings FOR ALL
USING (
  recorded_by = auth.uid() 
  OR is_current_user_admin()
);

-- RLS for whiteboard
CREATE POLICY "Whiteboard access"
ON public.whiteboard_strokes FOR ALL
USING (
  virtual_class_id IN (
    SELECT vcp.virtual_class_id FROM public.virtual_class_participants vcp WHERE vcp.user_id = auth.uid()
    UNION
    SELECT vc.id FROM public.virtual_classes vc WHERE vc.instructor_id = auth.uid()
  )
);

-- RLS for materials
CREATE POLICY "View class materials"
ON public.virtual_class_materials FOR SELECT
USING (
  virtual_class_id IN (
    SELECT vcp.virtual_class_id FROM public.virtual_class_participants vcp WHERE vcp.user_id = auth.uid()
    UNION
    SELECT vc.id FROM public.virtual_classes vc WHERE vc.instructor_id = auth.uid()
  )
);

CREATE POLICY "Manage materials"
ON public.virtual_class_materials FOR ALL
USING (uploaded_by = auth.uid() OR is_current_user_admin());

-- Enable Realtime for WebRTC signaling and chat
ALTER PUBLICATION supabase_realtime ADD TABLE public.webrtc_signals;
ALTER PUBLICATION supabase_realtime ADD TABLE public.virtual_class_messages;
ALTER PUBLICATION supabase_realtime ADD TABLE public.virtual_class_participants;
ALTER PUBLICATION supabase_realtime ADD TABLE public.whiteboard_strokes;

-- Trigger for updated_at
CREATE TRIGGER update_virtual_classes_updated_at
BEFORE UPDATE ON public.virtual_classes
FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER update_vcp_updated_at
BEFORE UPDATE ON public.virtual_class_participants
FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER update_vcr_updated_at
BEFORE UPDATE ON public.virtual_class_recordings
FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();