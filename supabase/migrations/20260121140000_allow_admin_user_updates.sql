-- Allow admins to update user profiles for admin panel operations
-- This migration updates the RLS policy to allow admin role to manage user accounts

DROP POLICY IF EXISTS "Users can update own profile" ON public.users;

CREATE POLICY "Users can update own profile or admins can update any user"
  ON public.users FOR UPDATE
  USING (auth.uid() = id OR (auth.jwt() ->> 'role') = 'admin')
  WITH CHECK (auth.uid() = id OR (auth.jwt() ->> 'role') = 'admin');
