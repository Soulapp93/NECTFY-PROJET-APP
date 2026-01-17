-- Ajouter les contraintes de clé étrangère manquantes pour les feuilles d'émargement

-- Ajouter la contrainte de clé étrangère vers la table formations
ALTER TABLE public.attendance_sheets 
ADD CONSTRAINT fk_attendance_sheets_formation 
FOREIGN KEY (formation_id) REFERENCES public.formations(id) ON DELETE CASCADE;

-- Ajouter la contrainte de clé étrangère vers la table schedule_slots
ALTER TABLE public.attendance_sheets 
ADD CONSTRAINT fk_attendance_sheets_schedule_slot 
FOREIGN KEY (schedule_slot_id) REFERENCES public.schedule_slots(id) ON DELETE CASCADE;

-- Ajouter la contrainte de clé étrangère vers la table users (instructeur)
ALTER TABLE public.attendance_sheets 
ADD CONSTRAINT fk_attendance_sheets_instructor 
FOREIGN KEY (instructor_id) REFERENCES public.users(id) ON DELETE SET NULL;

-- Ajouter la contrainte de clé étrangère pour les signatures vers attendance_sheets
ALTER TABLE public.attendance_signatures 
ADD CONSTRAINT fk_attendance_signatures_sheet 
FOREIGN KEY (attendance_sheet_id) REFERENCES public.attendance_sheets(id) ON DELETE CASCADE;

-- Ajouter la contrainte de clé étrangère pour les signatures vers users
ALTER TABLE public.attendance_signatures 
ADD CONSTRAINT fk_attendance_signatures_user 
FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;