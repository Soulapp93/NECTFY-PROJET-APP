-- Create storage buckets for event files
INSERT INTO storage.buckets (id, name, public) VALUES 
  ('event-files', 'event-files', true);

-- Create RLS policies for event files
CREATE POLICY "Event files are publicly accessible" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'event-files');

CREATE POLICY "Authenticated users can upload event files" 
ON storage.objects 
FOR INSERT 
WITH CHECK (bucket_id = 'event-files' AND auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can update their event files" 
ON storage.objects 
FOR UPDATE 
USING (bucket_id = 'event-files' AND auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can delete their event files" 
ON storage.objects 
FOR DELETE 
USING (bucket_id = 'event-files' AND auth.role() = 'authenticated');