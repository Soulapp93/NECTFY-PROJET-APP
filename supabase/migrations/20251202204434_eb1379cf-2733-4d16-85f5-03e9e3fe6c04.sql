-- Drop the old restrictive check constraint
ALTER TABLE public.establishments DROP CONSTRAINT IF EXISTS establishments_type_check;

-- Create a new check constraint that accepts all establishment types
ALTER TABLE public.establishments ADD CONSTRAINT establishments_type_check 
CHECK (type = ANY (ARRAY[
  'université'::text, 
  'école supérieure'::text, 
  'centre de formation'::text,
  'École supérieure'::text,
  'Centre de formation'::text,
  'Organisme de formation'::text,
  'Entreprise'::text,
  'Formateur indépendant'::text
]));