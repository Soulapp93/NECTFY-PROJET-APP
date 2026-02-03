
-- =====================================================
-- MIGRATION: Auto-création du groupe établissement et auto-inscription des membres
-- =====================================================

-- 1. Trigger pour créer automatiquement le groupe établissement lors de la création d'un établissement
CREATE OR REPLACE FUNCTION public.auto_create_establishment_group()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Créer le groupe établissement "Général"
  INSERT INTO public.chat_groups (establishment_id, name, group_type, description, is_private)
  VALUES (NEW.id, 'Général', 'establishment', 'Groupe de discussion de l''établissement', false);
  
  RETURN NEW;
END;
$$;

-- Créer le trigger sur establishments
DROP TRIGGER IF EXISTS trigger_auto_create_establishment_group ON public.establishments;
CREATE TRIGGER trigger_auto_create_establishment_group
  AFTER INSERT ON public.establishments
  FOR EACH ROW
  EXECUTE FUNCTION public.auto_create_establishment_group();

-- 2. Trigger pour auto-inscrire les nouveaux utilisateurs au groupe établissement
DROP TRIGGER IF EXISTS trigger_auto_join_establishment_group ON public.users;
CREATE TRIGGER trigger_auto_join_establishment_group
  AFTER INSERT ON public.users
  FOR EACH ROW
  EXECUTE FUNCTION public.auto_join_establishment_group();

-- 3. Trigger pour auto-inscrire les nouveaux tuteurs au groupe établissement
DROP TRIGGER IF EXISTS trigger_auto_join_establishment_group_tutor ON public.tutors;
CREATE TRIGGER trigger_auto_join_establishment_group_tutor
  AFTER INSERT ON public.tutors
  FOR EACH ROW
  EXECUTE FUNCTION public.auto_join_establishment_group_tutor();
