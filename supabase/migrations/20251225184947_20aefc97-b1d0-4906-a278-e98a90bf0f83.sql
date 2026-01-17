-- Add columns to message_recipients for favorites, archive, and trash functionality
ALTER TABLE public.message_recipients 
ADD COLUMN IF NOT EXISTS is_favorite boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS is_archived boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS is_deleted boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS deleted_at timestamp with time zone;

-- Add index for faster queries on these columns
CREATE INDEX IF NOT EXISTS idx_message_recipients_is_favorite ON public.message_recipients(recipient_id, is_favorite) WHERE is_favorite = true;
CREATE INDEX IF NOT EXISTS idx_message_recipients_is_archived ON public.message_recipients(recipient_id, is_archived) WHERE is_archived = true;
CREATE INDEX IF NOT EXISTS idx_message_recipients_is_deleted ON public.message_recipients(recipient_id, is_deleted) WHERE is_deleted = true;

-- Add column to messages table for sender's deleted messages
ALTER TABLE public.messages 
ADD COLUMN IF NOT EXISTS is_deleted boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS deleted_at timestamp with time zone;