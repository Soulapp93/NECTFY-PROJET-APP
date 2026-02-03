-- Activer Supabase Realtime pour les tables de messagerie
ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;
ALTER PUBLICATION supabase_realtime ADD TABLE public.message_recipients;

-- Activer aussi pour les profils utilisateurs et tuteurs (pour les changements de photo)
ALTER PUBLICATION supabase_realtime ADD TABLE public.users;
ALTER PUBLICATION supabase_realtime ADD TABLE public.tutors;