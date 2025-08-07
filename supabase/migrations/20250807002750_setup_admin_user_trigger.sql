-- Setup admin user trigger for andrea.camolese@me.com
-- This trigger will automatically assign admin role when the user registers

-- Create function to handle admin user setup
CREATE OR REPLACE FUNCTION handle_admin_user_setup()
RETURNS TRIGGER AS $$
BEGIN
  -- Check if the new user is andrea.camolese@me.com
  IF NEW.email = 'andrea.camolese@me.com' THEN
    -- Insert admin role for this user
    INSERT INTO user_roles (user_id, role, created_at, updated_at)
    VALUES (NEW.id, 'admin', NOW(), NOW())
    ON CONFLICT (user_id, role) DO NOTHING;
    
    -- Log the admin assignment
    RAISE NOTICE 'Admin role assigned to user: %', NEW.email;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger to automatically assign admin role
DROP TRIGGER IF EXISTS on_auth_user_created_admin ON auth.users;
CREATE TRIGGER on_auth_user_created_admin
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION handle_admin_user_setup();

-- Also create a function to manually assign admin role
CREATE OR REPLACE FUNCTION assign_admin_role(user_email TEXT)
RETURNS BOOLEAN AS $$
DECLARE
  user_id UUID;
BEGIN
  -- Get user ID
  SELECT id INTO user_id
  FROM auth.users
  WHERE email = user_email;
  
  -- If user doesn't exist, return false
  IF user_id IS NULL THEN
    RAISE NOTICE 'User not found: %', user_email;
    RETURN FALSE;
  END IF;
  
  -- Assign admin role
  INSERT INTO user_roles (user_id, role, created_at, updated_at)
  VALUES (user_id, 'admin', NOW(), NOW())
  ON CONFLICT (user_id, role) DO NOTHING;
  
  RAISE NOTICE 'Admin role assigned to user: %', user_email;
  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION assign_admin_role(TEXT) TO authenticated;
