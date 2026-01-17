
-- Créer le trigger pour créer automatiquement un groupe établissement
CREATE OR REPLACE TRIGGER create_establishment_group_trigger
AFTER INSERT ON establishments
FOR EACH ROW
EXECUTE FUNCTION create_establishment_group();

-- Créer le trigger pour ajouter automatiquement les utilisateurs au groupe (tous sauf tuteurs)
-- Les tuteurs ne sont pas dans la table users mais dans la table tutors
CREATE OR REPLACE TRIGGER add_user_to_group_trigger
AFTER INSERT ON users
FOR EACH ROW
EXECUTE FUNCTION add_user_to_establishment_group();

-- S'assurer que tous les utilisateurs existants sont dans leur groupe
INSERT INTO chat_group_members (group_id, user_id, role)
SELECT 
  cg.id,
  u.id,
  CASE WHEN u.role = 'Admin' THEN 'admin' ELSE 'member' END
FROM users u
JOIN chat_groups cg ON cg.establishment_id = u.establishment_id AND cg.group_type = 'establishment'
WHERE NOT EXISTS (
  SELECT 1 FROM chat_group_members cgm
  WHERE cgm.group_id = cg.id AND cgm.user_id = u.id
)
ON CONFLICT (group_id, user_id) DO NOTHING;
