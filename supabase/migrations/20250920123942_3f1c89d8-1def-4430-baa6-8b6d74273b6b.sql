-- Créer le bucket pour les fichiers d'événements
INSERT INTO storage.buckets (id, name, public) 
VALUES ('event-files', 'event-files', true)
ON CONFLICT (id) DO NOTHING;

-- Créer les politiques RLS pour les fichiers d'événements
CREATE POLICY "Anyone can upload event files"
ON storage.objects
FOR INSERT
WITH CHECK (bucket_id = 'event-files');

CREATE POLICY "Event files are publicly accessible"
ON storage.objects
FOR SELECT
USING (bucket_id = 'event-files');

CREATE POLICY "Anyone can update event files"
ON storage.objects
FOR UPDATE
USING (bucket_id = 'event-files');

CREATE POLICY "Anyone can delete event files"
ON storage.objects
FOR DELETE
USING (bucket_id = 'event-files');