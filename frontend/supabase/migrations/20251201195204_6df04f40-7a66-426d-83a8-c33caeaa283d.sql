-- Add missing fields to establishments table
ALTER TABLE public.establishments
ADD COLUMN IF NOT EXISTS siret TEXT,
ADD COLUMN IF NOT EXISTS director TEXT,
ADD COLUMN IF NOT EXISTS number_of_students TEXT,
ADD COLUMN IF NOT EXISTS number_of_instructors TEXT;

-- Add comment
COMMENT ON COLUMN public.establishments.siret IS 'SIRET number of the establishment';
COMMENT ON COLUMN public.establishments.director IS 'Name of the director';
COMMENT ON COLUMN public.establishments.number_of_students IS 'Range of students (e.g. 1-10, 11-25, etc.)';
COMMENT ON COLUMN public.establishments.number_of_instructors IS 'Range of instructors';