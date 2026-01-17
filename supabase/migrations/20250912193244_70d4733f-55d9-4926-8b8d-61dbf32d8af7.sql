-- Create messages table
CREATE TABLE public.messages (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  sender_id uuid NOT NULL,
  subject text NOT NULL,
  content text NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  scheduled_for timestamp with time zone,
  is_draft boolean NOT NULL DEFAULT false,
  attachment_count integer DEFAULT 0
);

-- Create message recipients table
CREATE TABLE public.message_recipients (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  message_id uuid NOT NULL REFERENCES messages(id) ON DELETE CASCADE,
  recipient_id uuid, -- user_id for individual messages, formation_id for group messages
  recipient_type text NOT NULL, -- 'user', 'formation', 'all_instructors'
  is_read boolean DEFAULT false,
  read_at timestamp with time zone,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Create message attachments table
CREATE TABLE public.message_attachments (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  message_id uuid NOT NULL REFERENCES messages(id) ON DELETE CASCADE,
  file_name text NOT NULL,
  file_url text NOT NULL,
  file_size integer,
  content_type text,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.message_recipients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.message_attachments ENABLE ROW LEVEL SECURITY;

-- RLS Policies for messages
CREATE POLICY "Users can view messages they sent or received"
ON public.messages FOR SELECT
USING (
  sender_id = auth.uid() OR 
  id IN (
    SELECT message_id FROM message_recipients 
    WHERE (
      recipient_type = 'user' AND recipient_id = auth.uid()
    ) OR (
      recipient_type = 'formation' AND recipient_id IN (
        SELECT formation_id FROM user_formation_assignments WHERE user_id = auth.uid()
      )
    ) OR (
      recipient_type = 'all_instructors' AND auth.uid() IN (
        SELECT id FROM users WHERE role = 'Formateur'
      )
    )
  )
);

CREATE POLICY "Users can create their own messages"
ON public.messages FOR INSERT
WITH CHECK (sender_id = auth.uid());

CREATE POLICY "Users can update their own messages"
ON public.messages FOR UPDATE
USING (sender_id = auth.uid());

-- RLS Policies for message recipients
CREATE POLICY "Users can view their message recipients"
ON public.message_recipients FOR SELECT
USING (
  message_id IN (
    SELECT id FROM messages WHERE sender_id = auth.uid()
  ) OR 
  (recipient_type = 'user' AND recipient_id = auth.uid()) OR
  (recipient_type = 'formation' AND recipient_id IN (
    SELECT formation_id FROM user_formation_assignments WHERE user_id = auth.uid()
  )) OR
  (recipient_type = 'all_instructors' AND auth.uid() IN (
    SELECT id FROM users WHERE role = 'Formateur'
  ))
);

CREATE POLICY "Users can create message recipients for their messages"
ON public.message_recipients FOR INSERT
WITH CHECK (
  message_id IN (SELECT id FROM messages WHERE sender_id = auth.uid())
);

CREATE POLICY "Users can update read status for their received messages"
ON public.message_recipients FOR UPDATE
USING (
  (recipient_type = 'user' AND recipient_id = auth.uid()) OR
  (recipient_type = 'formation' AND recipient_id IN (
    SELECT formation_id FROM user_formation_assignments WHERE user_id = auth.uid()
  )) OR
  (recipient_type = 'all_instructors' AND auth.uid() IN (
    SELECT id FROM users WHERE role = 'Formateur'
  ))
);

-- RLS Policies for attachments
CREATE POLICY "Users can view attachments for accessible messages"
ON public.message_attachments FOR SELECT
USING (
  message_id IN (
    SELECT id FROM messages WHERE sender_id = auth.uid()
  ) OR
  message_id IN (
    SELECT mr.message_id FROM message_recipients mr
    WHERE (
      mr.recipient_type = 'user' AND mr.recipient_id = auth.uid()
    ) OR (
      mr.recipient_type = 'formation' AND mr.recipient_id IN (
        SELECT formation_id FROM user_formation_assignments WHERE user_id = auth.uid()
      )
    ) OR (
      mr.recipient_type = 'all_instructors' AND auth.uid() IN (
        SELECT id FROM users WHERE role = 'Formateur'
      )
    )
  )
);

CREATE POLICY "Users can create attachments for their messages"
ON public.message_attachments FOR INSERT
WITH CHECK (
  message_id IN (SELECT id FROM messages WHERE sender_id = auth.uid())
);

-- Trigger for updating messages updated_at
CREATE OR REPLACE FUNCTION update_messages_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_messages_updated_at
BEFORE UPDATE ON public.messages
FOR EACH ROW
EXECUTE FUNCTION update_messages_updated_at();

-- Create indexes for better performance
CREATE INDEX idx_messages_sender_id ON messages(sender_id);
CREATE INDEX idx_messages_created_at ON messages(created_at);
CREATE INDEX idx_message_recipients_message_id ON message_recipients(message_id);
CREATE INDEX idx_message_recipients_recipient ON message_recipients(recipient_type, recipient_id);
CREATE INDEX idx_message_attachments_message_id ON message_attachments(message_id);