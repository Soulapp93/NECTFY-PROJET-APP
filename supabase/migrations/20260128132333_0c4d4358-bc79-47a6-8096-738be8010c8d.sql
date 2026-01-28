
-- Supprimer l'ancienne politique restrictive
DROP POLICY IF EXISTS "Create own notifications" ON public.notifications;

-- Créer une nouvelle politique qui permet:
-- 1. Les utilisateurs de créer des notifications pour eux-mêmes
-- 2. Les admins de créer des notifications pour les utilisateurs de leur établissement
CREATE POLICY "Create notifications"
ON public.notifications
FOR INSERT
WITH CHECK (
  user_id = auth.uid()
  OR (
    is_current_user_admin()
    AND user_id IN (
      SELECT id FROM users WHERE establishment_id = get_current_user_establishment()
    )
  )
);
