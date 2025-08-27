-- Add GDPR consent fields to profiles table
-- These fields track user consent for data processing

ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS gdpr_consent BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS marketing_consent BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS consent_date TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS consent_ip TEXT;

-- Create index for quick lookup of marketing consent users
CREATE INDEX IF NOT EXISTS idx_profiles_marketing_consent 
ON public.profiles(marketing_consent) 
WHERE marketing_consent = true;

-- Add comment for documentation
COMMENT ON COLUMN public.profiles.gdpr_consent IS 'Required consent for essential data processing (service emails, account management)';
COMMENT ON COLUMN public.profiles.marketing_consent IS 'Optional consent for marketing communications (newsletters, updates)';
COMMENT ON COLUMN public.profiles.consent_date IS 'When the user last updated their consent preferences';
COMMENT ON COLUMN public.profiles.consent_ip IS 'IP address when consent was given (for audit trail)';

-- Update RLS policies to allow users to update their own consent
CREATE POLICY IF NOT EXISTS "Users can update own consent" 
  ON public.profiles 
  FOR UPDATE 
  TO authenticated
  USING (auth.uid() = id);