-- Allow users to delete their own notifications
CREATE POLICY "Delete own notifications"
ON public.notifications
FOR DELETE
USING (user_id = auth.uid());

-- Enable realtime for notifications table
ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;