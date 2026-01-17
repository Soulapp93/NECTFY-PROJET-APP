-- Development-open policies for virtual_classes to allow creation without auth during demos
-- Note: Keep existing restrictive policies; policies are PERMISSIVE and combined with OR

-- Ensure RLS is enabled (idempotent)
ALTER TABLE public.virtual_classes ENABLE ROW LEVEL SECURITY;

-- Add permissive policies if they don't exist yet
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'virtual_classes' AND policyname = 'Allow all for development virtual_classes (SELECT)'
  ) THEN
    CREATE POLICY "Allow all for development virtual_classes (SELECT)"
    ON public.virtual_classes FOR SELECT USING (true);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'virtual_classes' AND policyname = 'Allow all for development virtual_classes (INSERT)'
  ) THEN
    CREATE POLICY "Allow all for development virtual_classes (INSERT)"
    ON public.virtual_classes FOR INSERT WITH CHECK (true);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'virtual_classes' AND policyname = 'Allow all for development virtual_classes (UPDATE)'
  ) THEN
    CREATE POLICY "Allow all for development virtual_classes (UPDATE)"
    ON public.virtual_classes FOR UPDATE USING (true) WITH CHECK (true);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'virtual_classes' AND policyname = 'Allow all for development virtual_classes (DELETE)'
  ) THEN
    CREATE POLICY "Allow all for development virtual_classes (DELETE)"
    ON public.virtual_classes FOR DELETE USING (true);
  END IF;
END $$;