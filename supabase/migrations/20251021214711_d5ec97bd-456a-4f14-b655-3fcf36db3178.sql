-- Add replied_to_message_id column to chat_messages table
ALTER TABLE public.chat_messages 
ADD COLUMN replied_to_message_id uuid REFERENCES public.chat_messages(id) ON DELETE SET NULL;

-- Create index for better performance when querying replied messages
CREATE INDEX idx_chat_messages_replied_to ON public.chat_messages(replied_to_message_id);

-- Add comment
COMMENT ON COLUMN public.chat_messages.replied_to_message_id IS 'Reference to the message being replied to (for threaded conversations)';