-- Créer correctement la tâche cron après avoir installé les extensions dans le schéma extensions
-- La fonction cron.schedule reste accessible via le schéma cron même si l'extension est dans extensions

SELECT cron.schedule(
  'manage-attendance-timing',
  '* * * * *', -- Toutes les minutes  
  $$
  SELECT
    net.http_post(
        url:='https://cvuyglhivifusdahoztd.supabase.co/functions/v1/manage-attendance-timing',
        headers:='{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN2dXlnbGhpdmlmdXNkYWhvenRkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTY1MDgwMjIsImV4cCI6MjA3MjA4NDAyMn0.5VAfTkUngHkzkR_ce3w1Bem30h0qAbzAcaPMaq6uaDE"}'::jsonb,
        body:=concat('{"time": "', now(), '"}')::jsonb
    ) as request_id;
  $$
);