-- User preferences table to store per-user dashboard layout and settings
CREATE TABLE IF NOT EXISTS public.user_preferences (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  key text NOT NULL,
  value jsonb NOT NULL DEFAULT '{}'::jsonb,
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, key)
);

ALTER TABLE public.user_preferences ENABLE ROW LEVEL SECURITY;

-- Allow users to manage their own preferences
DROP POLICY IF EXISTS "users can view own preferences" ON public.user_preferences;
CREATE POLICY "users can view own preferences" ON public.user_preferences
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "users can upsert own preferences" ON public.user_preferences;
CREATE POLICY "users can upsert own preferences" ON public.user_preferences
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "users can update own preferences" ON public.user_preferences;
CREATE POLICY "users can update own preferences" ON public.user_preferences
  FOR UPDATE USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_user_preferences_user_key ON public.user_preferences(user_id, key);
