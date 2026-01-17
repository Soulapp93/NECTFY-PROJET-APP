-- Create chat_groups table
CREATE TABLE public.chat_groups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  establishment_id UUID NOT NULL REFERENCES public.establishments(id) ON DELETE CASCADE,
  formation_id UUID REFERENCES public.formations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  group_type TEXT NOT NULL CHECK (group_type IN ('establishment', 'formation', 'private')),
  created_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
  avatar_url TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create chat_group_members table
CREATE TABLE public.chat_group_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id UUID NOT NULL REFERENCES public.chat_groups(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'member' CHECK (role IN ('admin', 'member')),
  joined_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  last_read_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(group_id, user_id)
);

-- Create chat_messages table
CREATE TABLE public.chat_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id UUID NOT NULL REFERENCES public.chat_groups(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  message_type TEXT NOT NULL DEFAULT 'text' CHECK (message_type IN ('text', 'file', 'system')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  is_deleted BOOLEAN DEFAULT false
);

-- Create chat_message_attachments table
CREATE TABLE public.chat_message_attachments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  message_id UUID NOT NULL REFERENCES public.chat_messages(id) ON DELETE CASCADE,
  file_name TEXT NOT NULL,
  file_url TEXT NOT NULL,
  file_size INTEGER,
  content_type TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create indexes for better performance
CREATE INDEX idx_chat_groups_establishment ON public.chat_groups(establishment_id);
CREATE INDEX idx_chat_groups_formation ON public.chat_groups(formation_id);
CREATE INDEX idx_chat_group_members_user ON public.chat_group_members(user_id);
CREATE INDEX idx_chat_group_members_group ON public.chat_group_members(group_id);
CREATE INDEX idx_chat_messages_group ON public.chat_messages(group_id);
CREATE INDEX idx_chat_messages_sender ON public.chat_messages(sender_id);
CREATE INDEX idx_chat_messages_created ON public.chat_messages(created_at DESC);

-- Enable RLS
ALTER TABLE public.chat_groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_group_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_message_attachments ENABLE ROW LEVEL SECURITY;

-- RLS Policies for chat_groups
CREATE POLICY "Users can view groups they are members of"
  ON public.chat_groups FOR SELECT
  USING (
    id IN (
      SELECT group_id FROM public.chat_group_members 
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create private groups in their formations"
  ON public.chat_groups FOR INSERT
  WITH CHECK (
    establishment_id = get_current_user_establishment() AND
    (group_type = 'private' AND formation_id IN (
      SELECT formation_id FROM public.user_formation_assignments 
      WHERE user_id = auth.uid()
    ))
  );

CREATE POLICY "Group admins can update their groups"
  ON public.chat_groups FOR UPDATE
  USING (
    id IN (
      SELECT group_id FROM public.chat_group_members 
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

-- RLS Policies for chat_group_members
CREATE POLICY "Users can view members of their groups"
  ON public.chat_group_members FOR SELECT
  USING (
    group_id IN (
      SELECT group_id FROM public.chat_group_members 
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can join groups"
  ON public.chat_group_members FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can leave groups"
  ON public.chat_group_members FOR DELETE
  USING (user_id = auth.uid());

-- RLS Policies for chat_messages
CREATE POLICY "Users can view messages in their groups"
  ON public.chat_messages FOR SELECT
  USING (
    group_id IN (
      SELECT group_id FROM public.chat_group_members 
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can send messages to their groups"
  ON public.chat_messages FOR INSERT
  WITH CHECK (
    sender_id = auth.uid() AND
    group_id IN (
      SELECT group_id FROM public.chat_group_members 
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete their own messages"
  ON public.chat_messages FOR UPDATE
  USING (sender_id = auth.uid());

-- RLS Policies for chat_message_attachments
CREATE POLICY "Users can view attachments in their groups"
  ON public.chat_message_attachments FOR SELECT
  USING (
    message_id IN (
      SELECT id FROM public.chat_messages 
      WHERE group_id IN (
        SELECT group_id FROM public.chat_group_members 
        WHERE user_id = auth.uid()
      )
    )
  );

CREATE POLICY "Users can add attachments to their messages"
  ON public.chat_message_attachments FOR INSERT
  WITH CHECK (
    message_id IN (
      SELECT id FROM public.chat_messages 
      WHERE sender_id = auth.uid()
    )
  );

-- Create updated_at triggers
CREATE TRIGGER update_chat_groups_updated_at
  BEFORE UPDATE ON public.chat_groups
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_chat_messages_updated_at
  BEFORE UPDATE ON public.chat_messages
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Function to create establishment group automatically
CREATE OR REPLACE FUNCTION public.create_establishment_group()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Create the establishment-wide group
  INSERT INTO public.chat_groups (
    establishment_id,
    name,
    description,
    group_type
  ) VALUES (
    NEW.id,
    'Groupe Général - ' || NEW.name,
    'Groupe de discussion pour tous les membres de l''établissement',
    'establishment'
  );
  
  RETURN NEW;
END;
$$;

-- Trigger to create establishment group when new establishment is created
CREATE TRIGGER on_establishment_created
  AFTER INSERT ON public.establishments
  FOR EACH ROW
  EXECUTE FUNCTION public.create_establishment_group();

-- Function to auto-add users to establishment group
CREATE OR REPLACE FUNCTION public.add_user_to_establishment_group()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  establishment_group_id UUID;
BEGIN
  -- Get the establishment group
  SELECT id INTO establishment_group_id
  FROM public.chat_groups
  WHERE establishment_id = NEW.establishment_id
    AND group_type = 'establishment'
  LIMIT 1;
  
  -- Add user to the group
  IF establishment_group_id IS NOT NULL THEN
    INSERT INTO public.chat_group_members (group_id, user_id, role)
    VALUES (establishment_group_id, NEW.id, 'member')
    ON CONFLICT (group_id, user_id) DO NOTHING;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Trigger to add user to establishment group when created
CREATE TRIGGER on_user_created_add_to_group
  AFTER INSERT ON public.users
  FOR EACH ROW
  EXECUTE FUNCTION public.add_user_to_establishment_group();

-- Enable realtime for chat messages
ALTER PUBLICATION supabase_realtime ADD TABLE public.chat_messages;
ALTER PUBLICATION supabase_realtime ADD TABLE public.chat_groups;
ALTER PUBLICATION supabase_realtime ADD TABLE public.chat_group_members;