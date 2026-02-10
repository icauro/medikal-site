-- This migration sets JWT claims for admin users
-- It creates a trigger that updates the auth.users app_metadata whenever a user role changes

-- Function to set JWT claims for admin users
CREATE OR REPLACE FUNCTION public.set_jwt_admin_claims()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- If the role is 'admin', update the auth.users app_metadata to set role claim
  IF NEW.role = 'admin' THEN
    UPDATE auth.users
    SET raw_app_meta_data = jsonb_set(
      COALESCE(raw_app_meta_data, '{}'::jsonb),
      '{role}',
      '"admin"'::jsonb
    )
    WHERE id = NEW.id;
  ELSE
    -- If role is not admin, remove the admin claim
    UPDATE auth.users
    SET raw_app_meta_data = raw_app_meta_data - 'role'
    WHERE id = NEW.id;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Drop trigger if it exists
DROP TRIGGER IF EXISTS set_jwt_admin_claims_trigger ON public.users;

-- Create trigger to set JWT claims when user role is updated
CREATE TRIGGER set_jwt_admin_claims_trigger
AFTER INSERT OR UPDATE ON public.users
FOR EACH ROW
EXECUTE FUNCTION public.set_jwt_admin_claims();

-- Set claims for existing admin users
UPDATE auth.users
SET raw_app_meta_data = jsonb_set(
  COALESCE(raw_app_meta_data, '{}'::jsonb),
  '{role}',
  '"admin"'::jsonb
)
WHERE id IN (SELECT id FROM public.users WHERE role = 'admin');
