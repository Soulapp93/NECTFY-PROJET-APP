-- Fix migration: policies creation without IF NOT EXISTS

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'attendance_link_delivery_status') THEN
    CREATE TYPE public.attendance_link_delivery_status AS ENUM ('pending','sent','failed');
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS public.attendance_link_deliveries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  attendance_sheet_id UUID NOT NULL REFERENCES public.attendance_sheets(id) ON DELETE CASCADE,
  student_id UUID NOT NULL,
  status public.attendance_link_delivery_status NOT NULL DEFAULT 'pending',
  attempts INTEGER NOT NULL DEFAULT 0,
  message_id UUID NULL REFERENCES public.messages(id) ON DELETE SET NULL,
  last_error TEXT NULL,
  last_attempt_at TIMESTAMPTZ NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (attendance_sheet_id, student_id)
);

ALTER TABLE public.attendance_link_deliveries ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins can view attendance link deliveries" ON public.attendance_link_deliveries;
DROP POLICY IF EXISTS "Admins can create attendance link deliveries" ON public.attendance_link_deliveries;
DROP POLICY IF EXISTS "Admins can update attendance link deliveries" ON public.attendance_link_deliveries;
DROP POLICY IF EXISTS "Admins can delete attendance link deliveries" ON public.attendance_link_deliveries;

CREATE POLICY "Admins can view attendance link deliveries"
ON public.attendance_link_deliveries
FOR SELECT
USING (public.is_current_user_admin());

CREATE POLICY "Admins can create attendance link deliveries"
ON public.attendance_link_deliveries
FOR INSERT
WITH CHECK (public.is_current_user_admin());

CREATE POLICY "Admins can update attendance link deliveries"
ON public.attendance_link_deliveries
FOR UPDATE
USING (public.is_current_user_admin());

CREATE POLICY "Admins can delete attendance link deliveries"
ON public.attendance_link_deliveries
FOR DELETE
USING (public.is_current_user_admin());

DROP TRIGGER IF EXISTS trg_attendance_link_deliveries_updated_at ON public.attendance_link_deliveries;
CREATE TRIGGER trg_attendance_link_deliveries_updated_at
BEFORE UPDATE ON public.attendance_link_deliveries
FOR EACH ROW
EXECUTE FUNCTION public.handle_updated_at();

CREATE INDEX IF NOT EXISTS idx_attendance_link_deliveries_sheet ON public.attendance_link_deliveries(attendance_sheet_id);
CREATE INDEX IF NOT EXISTS idx_attendance_link_deliveries_student ON public.attendance_link_deliveries(student_id);
