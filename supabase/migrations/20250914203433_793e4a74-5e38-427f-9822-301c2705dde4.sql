-- Remove duplicate trigger
DROP TRIGGER IF EXISTS update_attendance_sheets_updated_at ON attendance_sheets;

-- Keep only one clean trigger for updated_at
-- attendance_sheets_updated_at should remain

-- Verify final state
SELECT trigger_name, event_manipulation, action_statement 
FROM information_schema.triggers 
WHERE event_object_table = 'attendance_sheets';