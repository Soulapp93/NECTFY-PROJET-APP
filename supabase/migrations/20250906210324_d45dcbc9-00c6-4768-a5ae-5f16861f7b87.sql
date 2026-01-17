-- Create schedules table for formation schedules
CREATE TABLE public.schedules (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    formation_id UUID NOT NULL,
    title TEXT NOT NULL,
    academic_year TEXT NOT NULL DEFAULT '2025-2026',
    status TEXT NOT NULL DEFAULT 'Brouillon',
    created_by UUID NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create schedule_slots table for individual time slots
CREATE TABLE public.schedule_slots (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    schedule_id UUID NOT NULL,
    module_id UUID NULL,
    instructor_id UUID NULL,
    date DATE NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    room TEXT NULL,
    color TEXT DEFAULT '#8B5CF6',
    notes TEXT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.schedule_slots ENABLE ROW LEVEL SECURITY;

-- Create policies for schedules
CREATE POLICY "Allow all for development schedules" 
ON public.schedules 
FOR ALL 
USING (true);

-- Create policies for schedule_slots
CREATE POLICY "Allow all for development schedule_slots" 
ON public.schedule_slots 
FOR ALL 
USING (true);

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Create triggers for automatic timestamp updates
CREATE TRIGGER update_schedules_updated_at
    BEFORE UPDATE ON public.schedules
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER update_schedule_slots_updated_at
    BEFORE UPDATE ON public.schedule_slots
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();