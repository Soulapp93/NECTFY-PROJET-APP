-- Ensure all establishments have a chat group
DO $$
DECLARE
  est RECORD;
  new_group_id UUID;
BEGIN
  -- For each establishment that doesn't have a group
  FOR est IN 
    SELECT e.id, e.name 
    FROM establishments e
    WHERE NOT EXISTS (
      SELECT 1 FROM chat_groups cg 
      WHERE cg.establishment_id = e.id 
      AND cg.group_type = 'establishment'
    )
  LOOP
    -- Create the establishment group
    INSERT INTO chat_groups (
      establishment_id,
      name,
      description,
      group_type,
      is_active
    ) VALUES (
      est.id,
      'Groupe Général - ' || est.name,
      'Groupe de discussion pour tous les membres de l''établissement',
      'establishment',
      true
    ) RETURNING id INTO new_group_id;
    
    -- Add all activated users from this establishment to the group
    INSERT INTO chat_group_members (group_id, user_id, role)
    SELECT 
      new_group_id,
      u.id,
      CASE WHEN u.role = 'Admin' THEN 'admin' ELSE 'member' END
    FROM users u
    WHERE u.establishment_id = est.id
    AND u.is_activated = true
    ON CONFLICT (group_id, user_id) DO NOTHING;
    
    -- Add sample messages
    INSERT INTO chat_messages (group_id, sender_id, content, message_type, created_at)
    SELECT 
      new_group_id,
      u.id,
      CASE 
        WHEN row_number() OVER (ORDER BY u.created_at) = 1 THEN 'Bonjour à tous ! 👋 Bienvenue dans notre groupe d''établissement'
        WHEN row_number() OVER (ORDER BY u.created_at) = 2 THEN 'Salut ! Super d''avoir ce groupe pour communiquer ensemble'
        WHEN row_number() OVER (ORDER BY u.created_at) = 3 THEN 'Est-ce que quelqu''un aurait le planning de cette semaine ?'
        WHEN row_number() OVER (ORDER BY u.created_at) = 4 THEN 'N''oubliez pas la réunion de demain à 14h en salle 204 📅'
        WHEN row_number() OVER (ORDER BY u.created_at) = 5 THEN 'Merci pour le rappel ! Je serai présent'
        ELSE 'Bonne journée à tous !'
      END,
      'text',
      NOW() - (interval '1 hour' * (6 - row_number() OVER (ORDER BY u.created_at)))
    FROM users u
    WHERE u.establishment_id = est.id
    AND u.is_activated = true
    LIMIT 6;
    
  END LOOP;
END $$;

-- Also ensure existing establishment groups have all users as members
INSERT INTO chat_group_members (group_id, user_id, role)
SELECT 
  cg.id,
  u.id,
  CASE WHEN u.role = 'Admin' THEN 'admin' ELSE 'member' END
FROM chat_groups cg
CROSS JOIN users u
WHERE cg.group_type = 'establishment'
AND u.establishment_id = cg.establishment_id
AND u.is_activated = true
AND NOT EXISTS (
  SELECT 1 FROM chat_group_members cgm
  WHERE cgm.group_id = cg.id
  AND cgm.user_id = u.id
)
ON CONFLICT (group_id, user_id) DO NOTHING;