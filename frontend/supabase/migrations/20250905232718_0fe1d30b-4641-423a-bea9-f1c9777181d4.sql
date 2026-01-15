-- Create table for text books (cahiers de texte)
CREATE TABLE public.text_books (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  formation_id UUID NOT NULL,
  academic_year TEXT NOT NULL,
  created_by UUID,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create table for text book entries
CREATE TABLE public.text_book_entries (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  text_book_id UUID NOT NULL,
  date DATE NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  subject_matter TEXT NOT NULL,
  content TEXT,
  homework TEXT,
  instructor_id UUID,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.text_books ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.text_book_entries ENABLE ROW LEVEL SECURITY;

-- Create policies for text_books
CREATE POLICY "Allow all for development text_books" 
ON public.text_books 
FOR ALL 
USING (true);

-- Create policies for text_book_entries
CREATE POLICY "Allow all for development text_book_entries" 
ON public.text_book_entries 
FOR ALL 
USING (true);

-- Add foreign key constraints
ALTER TABLE public.text_books 
ADD CONSTRAINT text_books_formation_id_fkey 
FOREIGN KEY (formation_id) REFERENCES public.formations(id) ON DELETE CASCADE;

ALTER TABLE public.text_book_entries 
ADD CONSTRAINT text_book_entries_text_book_id_fkey 
FOREIGN KEY (text_book_id) REFERENCES public.text_books(id) ON DELETE CASCADE;

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Create triggers for automatic timestamp updates
CREATE TRIGGER update_text_books_updated_at
  BEFORE UPDATE ON public.text_books
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_text_book_entries_updated_at
  BEFORE UPDATE ON public.text_book_entries
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();