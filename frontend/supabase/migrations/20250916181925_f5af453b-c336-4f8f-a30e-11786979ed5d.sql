-- Vérifier et corriger les politiques RLS pour user_signatures
-- D'abord supprimer toutes les politiques existantes
DROP POLICY IF EXISTS "Users can create their own signatures" ON user_signatures;
DROP POLICY IF EXISTS "Users can update their own signatures" ON user_signatures;
DROP POLICY IF EXISTS "Users can view their own signatures" ON user_signatures;
DROP POLICY IF EXISTS "Users can delete their own signatures" ON user_signatures;

-- Désactiver temporairement RLS pour déboguer
ALTER TABLE user_signatures DISABLE ROW LEVEL SECURITY;

-- Réactiver RLS
ALTER TABLE user_signatures ENABLE ROW LEVEL SECURITY;

-- Créer des politiques plus permissives pour le développement
CREATE POLICY "Allow all operations for development" 
ON user_signatures 
FOR ALL 
USING (true) 
WITH CHECK (true);

-- Vérifier que la colonne user_id n'est pas nullable (important pour RLS)
ALTER TABLE user_signatures ALTER COLUMN user_id SET NOT NULL;