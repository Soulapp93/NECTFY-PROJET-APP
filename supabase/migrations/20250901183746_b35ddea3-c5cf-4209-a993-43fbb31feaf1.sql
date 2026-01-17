
-- Insérer un établissement par défaut pour les formations
INSERT INTO public.establishments (
  id,
  name,
  email,
  type,
  address,
  phone,
  website
) VALUES (
  '00000000-0000-0000-0000-000000000000',
  'Établissement par défaut',
  'contact@etablissement.com',
  'Centre de formation',
  'Adresse non spécifiée',
  'Téléphone non spécifié',
  'Site web non spécifié'
) ON CONFLICT (id) DO NOTHING;
