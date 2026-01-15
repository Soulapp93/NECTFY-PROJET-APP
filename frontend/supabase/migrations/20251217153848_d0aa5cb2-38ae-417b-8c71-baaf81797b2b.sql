-- Corriger le nom de l'établissement démo pour retirer NECTFY
UPDATE establishments 
SET name = 'Établissement Démo' 
WHERE name = 'Établissement Démo NECTFY';