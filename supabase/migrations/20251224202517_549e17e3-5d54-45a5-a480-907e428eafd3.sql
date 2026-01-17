-- Tutor access to text books + related data

-- 1) text_books: tutors can view text books of their active students' formations
ALTER TABLE public.text_books ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Tutors view student text books" ON public.text_books;
CREATE POLICY "Tutors view student text books"
ON public.text_books
FOR SELECT
USING (
  formation_id IN (
    SELECT ufa.formation_id
    FROM public.user_formation_assignments ufa
    WHERE ufa.user_id IN (
      SELECT tsa.student_id
      FROM public.tutor_student_assignments tsa
      WHERE tsa.tutor_id = auth.uid()
        AND tsa.is_active = true
    )
  )
);

-- 2) text_book_entries: tutors can view entries for accessible text books
ALTER TABLE public.text_book_entries ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Tutors view student text book entries" ON public.text_book_entries;
CREATE POLICY "Tutors view student text book entries"
ON public.text_book_entries
FOR SELECT
USING (
  text_book_id IN (
    SELECT tb.id
    FROM public.text_books tb
    WHERE tb.formation_id IN (
      SELECT ufa.formation_id
      FROM public.user_formation_assignments ufa
      WHERE ufa.user_id IN (
        SELECT tsa.student_id
        FROM public.tutor_student_assignments tsa
        WHERE tsa.tutor_id = auth.uid()
          AND tsa.is_active = true
      )
    )
  )
);

-- 3) text_book_entry_files: tutors can view files for entries they can access
ALTER TABLE public.text_book_entry_files ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Tutors view student text book entry files" ON public.text_book_entry_files;
CREATE POLICY "Tutors view student text book entry files"
ON public.text_book_entry_files
FOR SELECT
USING (
  text_book_entry_id IN (
    SELECT e.id
    FROM public.text_book_entries e
    WHERE e.text_book_id IN (
      SELECT tb.id
      FROM public.text_books tb
      WHERE tb.formation_id IN (
        SELECT ufa.formation_id
        FROM public.user_formation_assignments ufa
        WHERE ufa.user_id IN (
          SELECT tsa.student_id
          FROM public.tutor_student_assignments tsa
          WHERE tsa.tutor_id = auth.uid()
            AND tsa.is_active = true
        )
      )
    )
  )
);

-- 4) formation_modules: tutors can view modules for their students' formations (needed by TextBookDetail)
ALTER TABLE public.formation_modules ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Tutors view student formation modules" ON public.formation_modules;
CREATE POLICY "Tutors view student formation modules"
ON public.formation_modules
FOR SELECT
USING (
  formation_id IN (
    SELECT ufa.formation_id
    FROM public.user_formation_assignments ufa
    WHERE ufa.user_id IN (
      SELECT tsa.student_id
      FROM public.tutor_student_assignments tsa
      WHERE tsa.tutor_id = auth.uid()
        AND tsa.is_active = true
    )
  )
);
