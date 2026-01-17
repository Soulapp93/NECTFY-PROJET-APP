-- Create virtual_classes table for e-learning classes
CREATE TABLE public.virtual_classes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  establishment_id UUID NOT NULL REFERENCES establishments(id),
  title TEXT NOT NULL,
  description TEXT,
  instructor_id UUID REFERENCES users(id),
  formation_id UUID REFERENCES formations(id),
  date DATE NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  max_participants INTEGER NOT NULL DEFAULT 25,
  current_participants INTEGER NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'Programmé' CHECK (status IN ('En cours', 'Programmé', 'Terminé', 'Annulé')),
  meeting_room_id TEXT,
  recording_enabled BOOLEAN NOT NULL DEFAULT false,
  recording_url TEXT,
  materials JSONB DEFAULT '[]'::jsonb,
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.virtual_classes ENABLE ROW LEVEL SECURITY;

-- Create policies for virtual_classes
CREATE POLICY "Users can view virtual classes from their establishment" 
ON public.virtual_classes 
FOR SELECT 
USING (establishment_id = get_current_user_establishment());

CREATE POLICY "Instructors can create virtual classes" 
ON public.virtual_classes 
FOR INSERT 
WITH CHECK (
  establishment_id = get_current_user_establishment() 
  AND (instructor_id = auth.uid() OR get_current_user_role() IN ('Admin', 'Formateur'))
);

CREATE POLICY "Instructors can update their own classes or admins can update all" 
ON public.virtual_classes 
FOR UPDATE 
USING (
  establishment_id = get_current_user_establishment() 
  AND (instructor_id = auth.uid() OR get_current_user_role() IN ('Admin'))
);

CREATE POLICY "Instructors can delete their own classes or admins can delete all" 
ON public.virtual_classes 
FOR DELETE 
USING (
  establishment_id = get_current_user_establishment() 
  AND (instructor_id = auth.uid() OR get_current_user_role() IN ('Admin'))
);

-- Create virtual_class_participants table for managing participants
CREATE TABLE public.virtual_class_participants (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  virtual_class_id UUID NOT NULL REFERENCES virtual_classes(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id),
  joined_at TIMESTAMP WITH TIME ZONE,
  left_at TIMESTAMP WITH TIME ZONE,
  status TEXT NOT NULL DEFAULT 'Inscrit' CHECK (status IN ('Inscrit', 'Présent', 'Absent')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(virtual_class_id, user_id)
);

-- Enable RLS
ALTER TABLE public.virtual_class_participants ENABLE ROW LEVEL SECURITY;

-- Create policies for virtual_class_participants
CREATE POLICY "Users can view participants for classes in their establishment" 
ON public.virtual_class_participants 
FOR SELECT 
USING (virtual_class_id IN (
  SELECT id FROM virtual_classes 
  WHERE establishment_id = get_current_user_establishment()
));

CREATE POLICY "Users can join virtual classes" 
ON public.virtual_class_participants 
FOR INSERT 
WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their own participation" 
ON public.virtual_class_participants 
FOR UPDATE 
USING (user_id = auth.uid());

-- Create virtual_class_materials table for class resources
CREATE TABLE public.virtual_class_materials (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  virtual_class_id UUID NOT NULL REFERENCES virtual_classes(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  file_name TEXT NOT NULL,
  file_url TEXT NOT NULL,
  file_size INTEGER,
  file_type TEXT NOT NULL,
  uploaded_by UUID REFERENCES users(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.virtual_class_materials ENABLE ROW LEVEL SECURITY;

-- Create policies for virtual_class_materials
CREATE POLICY "Users can view materials for classes in their establishment" 
ON public.virtual_class_materials 
FOR SELECT 
USING (virtual_class_id IN (
  SELECT id FROM virtual_classes 
  WHERE establishment_id = get_current_user_establishment()
));

CREATE POLICY "Instructors can manage materials for their classes" 
ON public.virtual_class_materials 
FOR ALL 
USING (virtual_class_id IN (
  SELECT id FROM virtual_classes 
  WHERE instructor_id = auth.uid() OR get_current_user_role() IN ('Admin')
));

-- Create trigger for updating timestamps
CREATE OR REPLACE FUNCTION public.update_virtual_classes_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER update_virtual_classes_updated_at
BEFORE UPDATE ON public.virtual_classes
FOR EACH ROW
EXECUTE FUNCTION public.update_virtual_classes_updated_at();

-- Insert some sample virtual classes
INSERT INTO public.virtual_classes (
  establishment_id, title, description, instructor_id, formation_id, 
  date, start_time, end_time, max_participants, status, recording_enabled
) VALUES 
(
  'c67f6f7e-a567-4c8c-aad6-db15a4e27d65',
  'Introduction au Marketing Digital',
  'Découvrez les bases du marketing digital et les stratégies modernes',
  'bad1e18d-2b25-4fe5-b433-c20726de9a16',
  'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
  '2025-09-15',
  '14:00:00',
  '16:00:00',
  25,
  'Programmé',
  true
),
(
  'c67f6f7e-a567-4c8c-aad6-db15a4e27d65',
  'Développement React Avancé',
  'Approfondissez vos connaissances en React avec des patterns avancés',
  'bad1e18d-2b25-4fe5-b433-c20726de9a16',
  'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
  '2025-09-16',
  '10:00:00',
  '12:00:00',
  20,
  'Programmé',
  true
),
(
  'c67f6f7e-a567-4c8c-aad6-db15a4e27d65',
  'Session de Révisions - Paie',
  'Révision des concepts clés du module paie',
  'bad1e18d-2b25-4fe5-b433-c20726de9a16',
  'd1a225ab-95d0-44a3-9304-fc779e49adcf',
  '2025-09-12',
  '15:00:00',
  '17:00:00',
  15,
  'En cours',
  false
);