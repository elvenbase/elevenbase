-- Creare cron job per l'automazione training (eseguito ogni ora)
SELECT cron.schedule(
    'training-automation',
    '0 * * * *', -- ogni ora
    $$
    SELECT
      net.http_post(
          url:='https://rjgzvogrvvsejytqafih.supabase.co/functions/v1/training-automation',
          headers:='{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJqZ3p2b2dydnZzZWp5dHFhZmloIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTM5Nzc1NDEsImV4cCI6MjA2OTU1MzU0MX0.04zXdZ_uvN4NiUjmrT6gXRt1C_GM3znok-pR7MdzXaw"}'::jsonb,
          body:='{"automated": true}'::jsonb
      ) as request_id;
    $$
);