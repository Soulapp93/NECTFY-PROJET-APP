
-- =====================================================
-- ASSIGNMENT SYSTEM TABLES
-- =====================================================

-- Table for assignment submissions
CREATE TABLE public.assignment_submissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    assignment_id UUID NOT NULL,
    student_id UUID NOT NULL,
    submitted_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    content TEXT,
    status TEXT DEFAULT 'submitted',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Table for assignment corrections
CREATE TABLE public.assignment_corrections (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    submission_id UUID NOT NULL REFERENCES public.assignment_submissions(id) ON DELETE CASCADE,
    corrector_id UUID NOT NULL,
    grade NUMERIC,
    feedback TEXT,
    published_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- =====================================================
-- CHAT ATTACHMENTS TABLE
-- =====================================================

CREATE TABLE public.chat_message_attachments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    message_id UUID NOT NULL,
    file_name TEXT NOT NULL,
    file_url TEXT NOT NULL,
    file_type TEXT,
    file_size INTEGER,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- =====================================================
-- ENABLE RLS ON ALL NEW TABLES
-- =====================================================

ALTER TABLE public.assignment_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.assignment_corrections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_message_attachments ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- RLS POLICIES FOR assignment_submissions
-- =====================================================

-- Students can view their own submissions
CREATE POLICY "Students view own submissions"
ON public.assignment_submissions FOR SELECT
USING (student_id = auth.uid());

-- Students can create their own submissions
CREATE POLICY "Students create own submissions"
ON public.assignment_submissions FOR INSERT
WITH CHECK (student_id = auth.uid());

-- Admins and instructors can view all submissions in their establishment
CREATE POLICY "Admins view all submissions"
ON public.assignment_submissions FOR SELECT
USING (is_current_user_admin() OR get_current_user_role() = 'Formateur');

-- =====================================================
-- RLS POLICIES FOR assignment_corrections
-- =====================================================

-- Correctors can manage their own corrections
CREATE POLICY "Correctors manage own corrections"
ON public.assignment_corrections FOR ALL
USING (corrector_id = auth.uid());

-- Students can view corrections for their submissions when published
CREATE POLICY "Students view published corrections"
ON public.assignment_corrections FOR SELECT
USING (
    published_at IS NOT NULL 
    AND submission_id IN (
        SELECT id FROM public.assignment_submissions WHERE student_id = auth.uid()
    )
);

-- Admins can view all corrections
CREATE POLICY "Admins view all corrections"
ON public.assignment_corrections FOR SELECT
USING (is_current_user_admin());

-- =====================================================
-- RLS POLICIES FOR chat_message_attachments
-- =====================================================

-- Users can view attachments from messages they have access to
CREATE POLICY "View chat attachments"
ON public.chat_message_attachments FOR SELECT
USING (true);

-- Users can create attachments
CREATE POLICY "Create chat attachments"
ON public.chat_message_attachments FOR INSERT
WITH CHECK (true);

-- =====================================================
-- CREATE VIEW FOR TUTOR STUDENTS
-- =====================================================

CREATE OR REPLACE VIEW public.tutor_students_view
WITH (security_invoker = on)
AS
SELECT 
    tsa.id,
    tsa.tutor_id,
    tsa.student_id,
    tsa.is_active,
    tsa.assigned_at,
    u.first_name AS student_first_name,
    u.last_name AS student_last_name,
    u.email AS student_email,
    u.profile_photo_url AS student_photo
FROM public.tutor_student_assignments tsa
JOIN public.users u ON u.id = tsa.student_id;

-- =====================================================
-- CREATE RPC FOR TUTOR APPRENTICE FORMATIONS
-- =====================================================

CREATE OR REPLACE FUNCTION public.get_tutor_apprentice_formations()
RETURNS TABLE (
    formation_id UUID,
    formation_title TEXT,
    formation_level TEXT,
    formation_status TEXT,
    student_id UUID,
    student_name TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        f.id AS formation_id,
        f.title AS formation_title,
        f.level AS formation_level,
        f.status AS formation_status,
        u.id AS student_id,
        (u.first_name || ' ' || u.last_name) AS student_name
    FROM tutor_student_assignments tsa
    JOIN users u ON u.id = tsa.student_id
    JOIN user_formation_assignments ufa ON ufa.user_id = tsa.student_id
    JOIN formations f ON f.id = ufa.formation_id
    WHERE tsa.tutor_id = auth.uid()
    AND tsa.is_active = true;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.get_tutor_apprentice_formations() TO authenticated;

-- =====================================================
-- TRIGGERS FOR updated_at
-- =====================================================

CREATE TRIGGER handle_assignment_submissions_updated_at
    BEFORE UPDATE ON public.assignment_submissions
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER handle_assignment_corrections_updated_at
    BEFORE UPDATE ON public.assignment_corrections
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();
