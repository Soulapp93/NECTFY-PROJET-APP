
-- Ajouter la colonne color à la table formations
ALTER TABLE formations 
ADD COLUMN color text DEFAULT '#8B5CF6';

-- Mettre à jour les formations existantes avec une couleur par défaut
UPDATE formations 
SET color = '#8B5CF6' 
WHERE color IS NULL;
