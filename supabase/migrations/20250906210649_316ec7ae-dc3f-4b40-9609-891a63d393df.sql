-- Add missing foreign key constraints for schedules and schedule_slots tables

-- Add foreign key constraint from schedules to formations
ALTER TABLE public.schedules
ADD CONSTRAINT schedules_formation_id_fkey 
FOREIGN KEY (formation_id) REFERENCES public.formations(id) ON DELETE CASCADE;

-- Add foreign key constraint from schedule_slots to schedules
ALTER TABLE public.schedule_slots
ADD CONSTRAINT schedule_slots_schedule_id_fkey 
FOREIGN KEY (schedule_id) REFERENCES public.schedules(id) ON DELETE CASCADE;

-- Add foreign key constraint from schedule_slots to formation_modules (optional)
ALTER TABLE public.schedule_slots
ADD CONSTRAINT schedule_slots_module_id_fkey 
FOREIGN KEY (module_id) REFERENCES public.formation_modules(id) ON DELETE SET NULL;

-- Add foreign key constraint from schedule_slots to users (instructor)
ALTER TABLE public.schedule_slots
ADD CONSTRAINT schedule_slots_instructor_id_fkey 
FOREIGN KEY (instructor_id) REFERENCES public.users(id) ON DELETE SET NULL;