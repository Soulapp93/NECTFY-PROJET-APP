-- Supprimer l'ancienne assignation tuteur-étudiant avec l'ancien ID tuteur
DELETE FROM tutor_student_assignments WHERE tutor_id = '018787c0-6fa7-4008-aea9-909b30ee09ed';

-- Supprimer l'ancien enregistrement tuteur orphelin  
DELETE FROM tutors WHERE id = '018787c0-6fa7-4008-aea9-909b30ee09ed';