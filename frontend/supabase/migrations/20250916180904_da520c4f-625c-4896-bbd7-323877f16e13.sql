-- Corriger les politiques RLS pour user_signatures
-- Supprimer les anciennes politiques
DROP POLICY IF EXISTS "Users can create their own signatures" ON user_signatures;
DROP POLICY IF EXISTS "Users can update their own signatures" ON user_signatures;
DROP POLICY IF EXISTS "Users can view their own signatures" ON user_signatures;
DROP POLICY IF EXISTS "Users can delete their own signatures" ON user_signatures;

-- Créer les nouvelles politiques avec la bonne syntaxe
CREATE POLICY "Users can create their own signatures"
  ON user_signatures
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own signatures"
  ON user_signatures
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view their own signatures"
  ON user_signatures
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own signatures"
  ON user_signatures
  FOR DELETE
  USING (auth.uid() = user_id);