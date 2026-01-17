-- Create table for text book entry files
CREATE TABLE public.text_book_entry_files (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  text_book_entry_id UUID NOT NULL,
  file_name TEXT NOT NULL,
  file_url TEXT NOT NULL,
  file_size INTEGER,
  content_type TEXT,
  uploaded_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.text_book_entry_files ENABLE ROW LEVEL SECURITY;

-- Create policies for text book entry files
CREATE POLICY "Allow all for development text_book_entry_files" 
ON public.text_book_entry_files 
FOR ALL 
USING (true);

-- Add trigger for automatic timestamp updates
CREATE TRIGGER update_text_book_entry_files_updated_at
BEFORE UPDATE ON public.text_book_entry_files
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();