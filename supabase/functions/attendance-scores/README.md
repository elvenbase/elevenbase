# attendance-scores (Edge Function)

POST to compute and store daily attendance scores for players. Optional query param `?date=YYYY-MM-DD` to target a specific date (defaults to today). Stores results in `attendance_scores`.

Environment: requires `SUPABASE_URL`, `SUPABASE_ANON_KEY` (provided automatically in Supabase Edge Functions) and Authorization header if protected.