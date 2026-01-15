-- Remove the remaining problematic trigger
DROP TRIGGER IF EXISTS trigger_update_attendance_status ON attendance_sheets;

-- Also drop the problematic function that was being called
DROP FUNCTION IF EXISTS public.update_attendance_status_on_read();

-- Verify no more triggers remain on attendance_sheets
SELECT trigger_name, event_manipulation, action_statement 
FROM information_schema.triggers 
WHERE event_object_table = 'attendance_sheets';