-- Add missing module_id column to virtual_classes with FK to formation_modules
-- Safe-guards included to avoid duplicate-object errors on re-run

-- 1) Add column if not exists
ALTER TABLE public.virtual_classes
  ADD COLUMN IF NOT EXISTS module_id uuid;

-- 2) Add foreign key (ignore if it already exists)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'virtual_classes_module_id_fkey'
  ) THEN
    ALTER TABLE public.virtual_classes
      ADD CONSTRAINT virtual_classes_module_id_fkey
      FOREIGN KEY (module_id)
      REFERENCES public.formation_modules(id)
      ON DELETE SET NULL;
  END IF;
END $$;

-- 3) Index for faster filtering/joining by module
CREATE INDEX IF NOT EXISTS idx_virtual_classes_module_id
  ON public.virtual_classes(module_id);
