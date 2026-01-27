-- Tables for pedagogical module content/files
CREATE TABLE IF NOT EXISTS public.module_contents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  module_id uuid NOT NULL REFERENCES public.formation_modules(id) ON DELETE CASCADE,
  content_type text NOT NULL,
  title text NOT NULL,
  description text,
  content text,
  file_url text,
  file_name text,
  order_index integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_module_contents_module_id ON public.module_contents(module_id);

CREATE TABLE IF NOT EXISTS public.module_documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  module_id uuid NOT NULL REFERENCES public.formation_modules(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text,
  document_type text NOT NULL,
  file_url text,
  file_name text,
  file_size integer,
  file_type text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_module_documents_module_id ON public.module_documents(module_id);

-- Access helpers
CREATE OR REPLACE FUNCTION public.can_access_module(_module_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    public.is_current_user_admin()
    OR EXISTS (
      SELECT 1
      FROM public.formation_modules fm
      WHERE fm.id = _module_id
        AND (
          -- direct user access (student/formateur assigned)
          EXISTS (
            SELECT 1
            FROM public.user_formation_assignments ufa
            WHERE ufa.formation_id = fm.formation_id
              AND ufa.user_id = auth.uid()
          )
          -- tutor access through assigned student
          OR EXISTS (
            SELECT 1
            FROM public.tutor_student_assignments tsa
            JOIN public.user_formation_assignments ufa2 ON ufa2.user_id = tsa.student_id
            WHERE tsa.tutor_id = auth.uid()
              AND tsa.is_active = true
              AND ufa2.formation_id = fm.formation_id
          )
        )
    );
$$;

CREATE OR REPLACE FUNCTION public.can_manage_module(_module_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    public.is_current_user_admin()
    OR (
      public.get_current_user_role() = 'Formateur'
      AND public.can_access_module(_module_id)
    );
$$;

-- Enable RLS
ALTER TABLE public.module_contents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.module_documents ENABLE ROW LEVEL SECURITY;

-- Policies: module_contents
DROP POLICY IF EXISTS "Module contents: select" ON public.module_contents;
CREATE POLICY "Module contents: select"
ON public.module_contents
FOR SELECT
USING (public.can_access_module(module_id));

DROP POLICY IF EXISTS "Module contents: insert" ON public.module_contents;
CREATE POLICY "Module contents: insert"
ON public.module_contents
FOR INSERT
WITH CHECK (public.can_manage_module(module_id));

DROP POLICY IF EXISTS "Module contents: update" ON public.module_contents;
CREATE POLICY "Module contents: update"
ON public.module_contents
FOR UPDATE
USING (public.can_manage_module(module_id))
WITH CHECK (public.can_manage_module(module_id));

DROP POLICY IF EXISTS "Module contents: delete" ON public.module_contents;
CREATE POLICY "Module contents: delete"
ON public.module_contents
FOR DELETE
USING (public.can_manage_module(module_id));

-- Policies: module_documents
DROP POLICY IF EXISTS "Module documents: select" ON public.module_documents;
CREATE POLICY "Module documents: select"
ON public.module_documents
FOR SELECT
USING (public.can_access_module(module_id));

DROP POLICY IF EXISTS "Module documents: insert" ON public.module_documents;
CREATE POLICY "Module documents: insert"
ON public.module_documents
FOR INSERT
WITH CHECK (public.can_manage_module(module_id));

DROP POLICY IF EXISTS "Module documents: update" ON public.module_documents;
CREATE POLICY "Module documents: update"
ON public.module_documents
FOR UPDATE
USING (public.can_manage_module(module_id))
WITH CHECK (public.can_manage_module(module_id));

DROP POLICY IF EXISTS "Module documents: delete" ON public.module_documents;
CREATE POLICY "Module documents: delete"
ON public.module_documents
FOR DELETE
USING (public.can_manage_module(module_id));

-- updated_at triggers
DROP TRIGGER IF EXISTS trg_module_contents_updated_at ON public.module_contents;
CREATE TRIGGER trg_module_contents_updated_at
BEFORE UPDATE ON public.module_contents
FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS trg_module_documents_updated_at ON public.module_documents;
CREATE TRIGGER trg_module_documents_updated_at
BEFORE UPDATE ON public.module_documents
FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
