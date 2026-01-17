-- Add foreign key constraint for text_book_entry_files
ALTER TABLE public.text_book_entry_files
ADD CONSTRAINT fk_text_book_entry_files_text_book_entry_id
FOREIGN KEY (text_book_entry_id) REFERENCES public.text_book_entries(id) ON DELETE CASCADE;