
-- Add non-activated users to establishment groups
INSERT INTO chat_group_members (group_id, user_id, role)
SELECT 
  cg.id,
  u.id,
  CASE WHEN u.role = 'Admin' THEN 'admin' ELSE 'member' END
FROM chat_groups cg
CROSS JOIN users u
WHERE cg.group_type = 'establishment'
AND u.establishment_id = cg.establishment_id
AND u.is_activated = false
AND NOT EXISTS (
  SELECT 1 FROM chat_group_members cgm
  WHERE cgm.group_id = cg.id
  AND cgm.user_id = u.id
)
ON CONFLICT (group_id, user_id) DO NOTHING;
