-- Create storage bucket for blog assets
INSERT INTO storage.buckets (id, name, public) 
VALUES ('blog-assets', 'blog-assets', true)
ON CONFLICT (id) DO NOTHING;

-- Allow public read access
CREATE POLICY "Blog assets are publicly accessible"
ON storage.objects FOR SELECT
USING (bucket_id = 'blog-assets');

-- Allow authenticated users to upload
CREATE POLICY "Authenticated users can upload blog assets"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'blog-assets');

-- Allow authenticated users to delete their uploads
CREATE POLICY "Authenticated users can delete blog assets"
ON storage.objects FOR DELETE
USING (bucket_id = 'blog-assets');