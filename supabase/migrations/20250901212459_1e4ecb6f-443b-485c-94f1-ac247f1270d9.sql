
-- Supprimer les contraintes de clés étrangères problématiques sur created_by
ALTER TABLE module_contents DROP CONSTRAINT IF EXISTS module_contents_created_by_fkey;
ALTER TABLE module_documents DROP CONSTRAINT IF EXISTS module_documents_created_by_fkey;

-- Rendre le champ created_by nullable temporairement pour éviter les erreurs
ALTER TABLE module_contents ALTER COLUMN created_by DROP NOT NULL;
ALTER TABLE module_documents ALTER COLUMN created_by DROP NOT NULL;
