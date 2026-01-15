-- Créer un tuteur de démonstration
INSERT INTO public.tutors (
  first_name,
  last_name,
  email,
  phone,
  company_name,
  company_address,
  position,
  is_activated,
  establishment_id
) VALUES (
  'Tuteur',
  'Démo',
  'tuteur-demo@test.com',
  '0123456789',
  'Entreprise Démo',
  '123 Rue de la Démo, 75001 Paris',
  'Responsable Formation',
  true,
  (SELECT id FROM public.establishments LIMIT 1)
) ON CONFLICT (email) DO NOTHING;