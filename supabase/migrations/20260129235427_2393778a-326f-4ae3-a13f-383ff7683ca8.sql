-- Create a table for free meetings (réunions libres)
CREATE TABLE public.meetings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  establishment_id UUID NOT NULL REFERENCES public.establishments(id) ON DELETE CASCADE,
  created_by UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  scheduled_at TIMESTAMP WITH TIME ZONE NOT NULL,
  duration_minutes INTEGER NOT NULL DEFAULT 60,
  status TEXT NOT NULL DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'in_progress', 'ended', 'cancelled')),
  room_name TEXT,
  room_url TEXT,
  max_participants INTEGER DEFAULT 100,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create meeting participants table
CREATE TABLE public.meeting_participants (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  meeting_id UUID NOT NULL REFERENCES public.meetings(id) ON DELETE CASCADE,
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  formation_id UUID REFERENCES public.formations(id) ON DELETE CASCADE,
  participant_role TEXT, -- For role-based invitations: 'Formateur', 'Étudiant', etc.
  invitation_type TEXT NOT NULL CHECK (invitation_type IN ('individual', 'formation', 'role')),
  joined_at TIMESTAMP WITH TIME ZONE,
  left_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  CONSTRAINT meeting_participant_check CHECK (
    (invitation_type = 'individual' AND user_id IS NOT NULL) OR
    (invitation_type = 'formation' AND formation_id IS NOT NULL) OR
    (invitation_type = 'role' AND participant_role IS NOT NULL)
  )
);

-- Enable RLS
ALTER TABLE public.meetings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.meeting_participants ENABLE ROW LEVEL SECURITY;

-- RLS Policies for meetings
CREATE POLICY "Admins manage meetings"
  ON public.meetings
  FOR ALL
  USING (
    establishment_id = public.get_current_user_establishment() 
    AND public.is_current_user_admin()
  );

CREATE POLICY "View meetings in establishment"
  ON public.meetings
  FOR SELECT
  USING (establishment_id = public.get_current_user_establishment());

-- RLS Policies for meeting participants
CREATE POLICY "Admins manage meeting participants"
  ON public.meeting_participants
  FOR ALL
  USING (
    meeting_id IN (
      SELECT id FROM public.meetings 
      WHERE establishment_id = public.get_current_user_establishment()
        AND public.is_current_user_admin()
    )
  );

CREATE POLICY "View meeting participants"
  ON public.meeting_participants
  FOR SELECT
  USING (
    meeting_id IN (
      SELECT id FROM public.meetings 
      WHERE establishment_id = public.get_current_user_establishment()
    )
  );

-- Create indexes for performance
CREATE INDEX idx_meetings_establishment ON public.meetings(establishment_id);
CREATE INDEX idx_meetings_scheduled_at ON public.meetings(scheduled_at);
CREATE INDEX idx_meeting_participants_meeting ON public.meeting_participants(meeting_id);
CREATE INDEX idx_meeting_participants_user ON public.meeting_participants(user_id);

-- Enable realtime for meetings
ALTER PUBLICATION supabase_realtime ADD TABLE public.meetings;
ALTER PUBLICATION supabase_realtime ADD TABLE public.meeting_participants;

-- Trigger for updated_at
CREATE TRIGGER update_meetings_updated_at
  BEFORE UPDATE ON public.meetings
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();