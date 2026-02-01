-- Ajouter le champ instructor_absent à la table attendance_sheets
ALTER TABLE public.attendance_sheets 
ADD COLUMN IF NOT EXISTS instructor_absent BOOLEAN NOT NULL DEFAULT false;

-- Ajouter un commentaire pour documentation
COMMENT ON COLUMN public.attendance_sheets.instructor_absent IS 'Indique si le formateur est absent pour cette session. Si true, le lien n''est envoyé qu''aux étudiants.';