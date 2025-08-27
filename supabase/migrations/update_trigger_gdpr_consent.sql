-- Update trigger to save GDPR consent from user metadata
-- This ensures consent is saved when the profile is created

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = ''
AS $$
BEGIN
  -- Create profile with GDPR consent from metadata
  INSERT INTO public.profiles (
    id, 
    username,
    gdpr_consent,
    marketing_consent,
    consent_date
  )
  VALUES (
    NEW.id, 
    NEW.raw_user_meta_data ->> 'username',
    COALESCE((NEW.raw_user_meta_data ->> 'gdpr_consent')::boolean, false),
    COALESCE((NEW.raw_user_meta_data ->> 'marketing_consent')::boolean, false),
    CASE 
      WHEN NEW.raw_user_meta_data ->> 'consent_date' IS NOT NULL 
      THEN (NEW.raw_user_meta_data ->> 'consent_date')::timestamp with time zone
      ELSE NOW()
    END
  );
  
  -- If this is the first user or has superadmin email, make them superadmin
  IF NEW.email = 'admin@carissi.com' THEN
    INSERT INTO public.user_roles (user_id, role)
    VALUES (NEW.id, 'superadmin');
  ELSE
    -- Default role for new users
    INSERT INTO public.user_roles (user_id, role)
    VALUES (NEW.id, 'player');
  END IF;
  
  RETURN NEW;
END;
$$;