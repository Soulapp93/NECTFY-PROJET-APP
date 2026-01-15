-- Activer les extensions nécessaires pour les tâches cron
CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;

-- Créer une tâche cron qui s'exécute toutes les minutes pour vérifier et mettre à jour les statuts d'émargement
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