
-- SECURITY FIX: Update all database functions to use proper search_path security settings
-- This prevents potential SQL injection and ensures functions only access the public schema

-- Update has_role function
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$function$;

-- Update is_user_active function
CREATE OR REPLACE FUNCTION public.is_user_active(_user_id uuid)
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  SELECT status = 'active'
  FROM public.profiles
  WHERE id = _user_id
$function$;

-- Update handle_new_user function
CREATE OR REPLACE FUNCTION public.handle_new_user()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  INSERT INTO public.profiles (id, username)
  VALUES (NEW.id, NEW.raw_user_meta_data ->> 'username');
  
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
$function$;

-- Update calculate_response_deadline function
CREATE OR REPLACE FUNCTION public.calculate_response_deadline(session_date date, start_time time without time zone)
 RETURNS timestamp with time zone
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  RETURN (session_date + start_time - interval '4 hours');
END;
$function$;

-- Update generate_public_token function
CREATE OR REPLACE FUNCTION public.generate_public_token()
 RETURNS text
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  -- Use gen_random_uuid() instead of gen_random_bytes for compatibility
  RETURN replace(gen_random_uuid()::text, '-', '');
END;
$function$;

-- Update handle_training_session_insert function
CREATE OR REPLACE FUNCTION public.handle_training_session_insert()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  -- Generate unique public token
  NEW.public_link_token = public.generate_public_token();
  
  -- Calculate deadline for responses (4 hours before start)
  NEW.allow_responses_until = public.calculate_response_deadline(NEW.session_date, NEW.start_time);
  
  RETURN NEW;
END;
$function$;

-- Update update_updated_at_column function
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$function$;

-- Create secure admin setup table for initial configuration
CREATE TABLE IF NOT EXISTS public.admin_setup (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  setup_token TEXT NOT NULL UNIQUE,
  is_completed BOOLEAN DEFAULT FALSE,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT (NOW() + INTERVAL '24 hours'),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS on admin_setup table
ALTER TABLE public.admin_setup ENABLE ROW LEVEL SECURITY;

-- Create policy for admin setup (publicly readable if not completed and not expired)
CREATE POLICY "Public can view incomplete admin setup" ON public.admin_setup
  FOR SELECT USING (is_completed = FALSE AND expires_at > NOW());

-- Create function to initialize admin setup
CREATE OR REPLACE FUNCTION public.initialize_admin_setup()
 RETURNS TEXT
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  setup_token TEXT;
BEGIN
  -- Check if admin setup already exists and is not expired
  IF EXISTS (
    SELECT 1 FROM public.admin_setup 
    WHERE is_completed = FALSE AND expires_at > NOW()
  ) THEN
    SELECT admin_setup.setup_token INTO setup_token 
    FROM public.admin_setup 
    WHERE is_completed = FALSE AND expires_at > NOW() 
    LIMIT 1;
    RETURN setup_token;
  END IF;

  -- Generate new setup token
  setup_token := replace(gen_random_uuid()::text, '-', '');
  
  -- Insert new setup record
  INSERT INTO public.admin_setup (setup_token) VALUES (setup_token);
  
  RETURN setup_token;
END;
$function$;

-- Create function to complete admin setup
CREATE OR REPLACE FUNCTION public.complete_admin_setup(_setup_token TEXT, _user_id UUID)
 RETURNS BOOLEAN
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  -- Verify setup token is valid
  IF NOT EXISTS (
    SELECT 1 FROM public.admin_setup 
    WHERE setup_token = _setup_token 
    AND is_completed = FALSE 
    AND expires_at > NOW()
  ) THEN
    RETURN FALSE;
  END IF;

  -- Mark setup as completed
  UPDATE public.admin_setup 
  SET is_completed = TRUE 
  WHERE setup_token = _setup_token;

  -- Assign superadmin role to user
  INSERT INTO public.user_roles (user_id, role) 
  VALUES (_user_id, 'superadmin')
  ON CONFLICT (user_id) DO UPDATE SET role = 'superadmin';

  -- Update profile status to active
  UPDATE public.profiles 
  SET status = 'active' 
  WHERE id = _user_id;

  RETURN TRUE;
END;
$function$;
