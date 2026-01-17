-- Correction du warning de sécurité - installation des extensions dans le schéma extensions
CREATE SCHEMA IF NOT EXISTS extensions;

-- Supprimer les extensions du schéma public et les réinstaller dans le schéma extensions
DROP EXTENSION IF EXISTS pg_cron;
DROP EXTENSION IF EXISTS pg_net;

-- Réinstaller dans le schéma extensions
CREATE EXTENSION IF NOT EXISTS pg_cron WITH SCHEMA extensions;
CREATE EXTENSION IF NOT EXISTS pg_net WITH SCHEMA extensions;

-- Recréer la tâche cron avec le bon schéma
SELECT extensions.cron.schedule(
  'manage-attendance-timing',
  '* * * * *', -- Toutes les minutes
  $$
  SELECT
    extensions.http_post(
        url:='https://cvuyglhivifusdahoztd.supabase.co/functions/v1/manage-attendance-timing',
        headers:='{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN2dXlnbGhpdmlmdXNkYWhvenRkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTY1MDgwMjIsImV4cCI6MjA3MjA4NDAyMn0.5VAfTkUngHkzkR_ce3w1Bem30h0qAbzAcaPMaq6uaDE"}'::jsonb,
        body:=concat('{"time": "', now(), '"}')::jsonb
    ) as request_id;
  $$
);