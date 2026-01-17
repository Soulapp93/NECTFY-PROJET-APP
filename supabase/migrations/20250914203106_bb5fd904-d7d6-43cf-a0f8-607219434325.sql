-- Check for any triggers on attendance_sheets table that might be causing issues
SELECT trigger_name, event_manipulation, action_statement 
FROM information_schema.triggers 
WHERE event_object_table = 'attendance_sheets';

-- Drop all triggers that might be causing the time comparison issue
DROP TRIGGER IF EXISTS update_attendance_status_on_read_trigger ON attendance_sheets;
DROP TRIGGER IF EXISTS update_attendance_sheet_status_trigger ON attendance_sheets;
DROP TRIGGER IF EXISTS attendance_sheet_update_trigger ON attendance_sheets;
DROP TRIGGER IF EXISTS handle_updated_at_trigger ON attendance_sheets;

-- Create a simple updated_at trigger without the complex time logic
CREATE TRIGGER attendance_sheets_updated_at
    BEFORE UPDATE ON attendance_sheets
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();