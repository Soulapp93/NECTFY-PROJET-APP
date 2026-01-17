-- Supprimer l'ancienne contrainte de vérification
ALTER TABLE module_contents 
DROP CONSTRAINT IF EXISTS module_contents_content_type_check;

-- Ajouter la nouvelle contrainte avec "lien" inclus
ALTER TABLE module_contents 
ADD CONSTRAINT module_contents_content_type_check 
CHECK (content_type IN ('cours', 'support', 'video', 'document', 'lien'));