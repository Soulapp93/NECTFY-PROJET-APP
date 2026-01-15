-- Add session_type column to schedule_slots table
ALTER TABLE public.schedule_slots
ADD COLUMN IF NOT EXISTS session_type text DEFAULT 'encadree' CHECK (session_type IN ('encadree', 'autonomie'));

-- Add comment for documentation
COMMENT ON COLUMN public.schedule_slots.session_type IS 'Type of session: encadree (with instructor, QR allowed) or autonomie (no instructor, link only)';