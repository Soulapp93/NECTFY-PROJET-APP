-- Enable pg_cron extension if not already enabled
CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;

-- Create a cron job that runs every hour to update virtual class statuses
-- This will call our edge function to automatically mark classes as "Terminé" 
-- when they are more than 24 hours past their end time
SELECT cron.schedule(
  'update-virtual-class-status',
  '0 * * * *', -- Run every hour at minute 0
  $$
  SELECT
    net.http_post(
        url:='https://cvuyglhivifusdahoztd.supabase.co/functions/v1/update-class-status',
        headers:='{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN2dXlnbGhpdmlmdXNkYWhvenRkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTY1MDgwMjIsImV4cCI6MjA3MjA4NDAyMn0.5VAfTkUngHkzkR_ce3w1Bem30h0qAbzAcaPMaq6uaDE"}'::jsonb,
        body:='{"scheduled": true}'::jsonb
    ) as request_id;
  $$
);