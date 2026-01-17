-- Enable full row data for realtime and add tables to realtime publication
ALTER TABLE public.attendance_signatures REPLICA IDENTITY FULL;
ALTER TABLE public.attendance_sheets REPLICA IDENTITY FULL;

DO $$
BEGIN
  -- Add tables to realtime publication if not already present
  ALTER PUBLICATION supabase_realtime ADD TABLE public.attendance_signatures;
EXCEPTION WHEN duplicate_object THEN
  -- already in publication
  NULL;
END $$;

DO $$
BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.attendance_sheets;
EXCEPTION WHEN duplicate_object THEN
  NULL;
END $$;