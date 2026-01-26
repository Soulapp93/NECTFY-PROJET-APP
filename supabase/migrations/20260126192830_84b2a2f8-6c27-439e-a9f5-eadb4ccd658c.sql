-- Create messages table for internal messaging system
CREATE TABLE public.messages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  sender_id UUID NOT NULL,
  subject TEXT NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  scheduled_for TIMESTAMP WITH TIME ZONE,
  is_draft BOOLEAN NOT NULL DEFAULT false,
  is_deleted BOOLEAN DEFAULT false,
  deleted_at TIMESTAMP WITH TIME ZONE,
  attachment_count INTEGER NOT NULL DEFAULT 0
);

-- Enable RLS
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

-- Create message_recipients table
CREATE TABLE public.message_recipients (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  message_id UUID NOT NULL REFERENCES public.messages(id) ON DELETE CASCADE,
  recipient_id UUID,
  recipient_type TEXT NOT NULL DEFAULT 'user',
  is_read BOOLEAN NOT NULL DEFAULT false,
  read_at TIMESTAMP WITH TIME ZONE,
  is_favorite BOOLEAN NOT NULL DEFAULT false,
  is_archived BOOLEAN NOT NULL DEFAULT false,
  is_deleted BOOLEAN NOT NULL DEFAULT false,
  deleted_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.message_recipients ENABLE ROW LEVEL SECURITY;

-- Create message_attachments table
CREATE TABLE public.message_attachments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  message_id UUID NOT NULL REFERENCES public.messages(id) ON DELETE CASCADE,
  file_name TEXT NOT NULL,
  file_url TEXT NOT NULL,
  file_size INTEGER,
  content_type TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.message_attachments ENABLE ROW LEVEL SECURITY;

-- RLS Policies for messages
CREATE POLICY "Users can view messages they sent"
  ON public.messages FOR SELECT
  USING (sender_id = auth.uid());

CREATE POLICY "Users can create messages"
  ON public.messages FOR INSERT
  WITH CHECK (sender_id = auth.uid());

CREATE POLICY "Users can update their own messages"
  ON public.messages FOR UPDATE
  USING (sender_id = auth.uid());

CREATE POLICY "Users can delete their own messages"
  ON public.messages FOR DELETE
  USING (sender_id = auth.uid());

CREATE POLICY "Users can view messages they received"
  ON public.messages FOR SELECT
  USING (id IN (
    SELECT message_id FROM public.message_recipients 
    WHERE recipient_id = auth.uid()
  ));

-- RLS Policies for message_recipients
CREATE POLICY "Users can view their own message recipient records"
  ON public.message_recipients FOR SELECT
  USING (recipient_id = auth.uid() OR message_id IN (
    SELECT id FROM public.messages WHERE sender_id = auth.uid()
  ));

CREATE POLICY "Message senders can create recipients"
  ON public.message_recipients FOR INSERT
  WITH CHECK (message_id IN (
    SELECT id FROM public.messages WHERE sender_id = auth.uid()
  ));

CREATE POLICY "Recipients can update their own records"
  ON public.message_recipients FOR UPDATE
  USING (recipient_id = auth.uid());

CREATE POLICY "Senders can delete recipients"
  ON public.message_recipients FOR DELETE
  USING (message_id IN (
    SELECT id FROM public.messages WHERE sender_id = auth.uid()
  ));

-- RLS Policies for message_attachments
CREATE POLICY "Users can view attachments of messages they can see"
  ON public.message_attachments FOR SELECT
  USING (message_id IN (
    SELECT id FROM public.messages WHERE sender_id = auth.uid()
  ) OR message_id IN (
    SELECT message_id FROM public.message_recipients WHERE recipient_id = auth.uid()
  ));

CREATE POLICY "Senders can create attachments"
  ON public.message_attachments FOR INSERT
  WITH CHECK (message_id IN (
    SELECT id FROM public.messages WHERE sender_id = auth.uid()
  ));

CREATE POLICY "Senders can delete attachments"
  ON public.message_attachments FOR DELETE
  USING (message_id IN (
    SELECT id FROM public.messages WHERE sender_id = auth.uid()
  ));

-- Add trigger for updated_at
CREATE TRIGGER update_messages_updated_at
  BEFORE UPDATE ON public.messages
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();