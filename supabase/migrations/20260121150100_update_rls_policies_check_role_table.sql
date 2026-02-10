-- Update RLS policies to check user role from users table instead of JWT
-- This is more reliable as the database is the source of truth

DROP POLICY IF EXISTS "Admin only write healthcare personnel listings" ON public.healthcare_personnel_listings;
CREATE POLICY "Admin only write healthcare personnel listings"
  ON public.healthcare_personnel_listings FOR INSERT
  WITH CHECK (
    EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin')
    OR (auth.jwt() ->> 'role') = 'admin'
  );

DROP POLICY IF EXISTS "Admin only update healthcare personnel listings" ON public.healthcare_personnel_listings;
CREATE POLICY "Admin only update healthcare personnel listings"
  ON public.healthcare_personnel_listings FOR UPDATE
  USING (
    EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin')
    OR (auth.jwt() ->> 'role') = 'admin'
  );

DROP POLICY IF EXISTS "Admin only write medical facility listings" ON public.medical_facility_listings;
CREATE POLICY "Admin only write medical facility listings"
  ON public.medical_facility_listings FOR INSERT
  WITH CHECK (
    EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin')
    OR (auth.jwt() ->> 'role') = 'admin'
  );

DROP POLICY IF EXISTS "Admin only update medical facility listings" ON public.medical_facility_listings;
CREATE POLICY "Admin only update medical facility listings"
  ON public.medical_facility_listings FOR UPDATE
  USING (
    EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin')
    OR (auth.jwt() ->> 'role') = 'admin'
  );

DROP POLICY IF EXISTS "Admin only write agency listings" ON public.agency_listings;
CREATE POLICY "Admin only write agency listings"
  ON public.agency_listings FOR INSERT
  WITH CHECK (
    EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin')
    OR (auth.jwt() ->> 'role') = 'admin'
  );

DROP POLICY IF EXISTS "Admin only update agency listings" ON public.agency_listings;
CREATE POLICY "Admin only update agency listings"
  ON public.agency_listings FOR UPDATE
  USING (
    EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin')
    OR (auth.jwt() ->> 'role') = 'admin'
  );

-- Update user table policies for admin operations
DROP POLICY IF EXISTS "Users can update own profile" ON public.users;
CREATE POLICY "Users can update own profile"
  ON public.users FOR UPDATE
  USING (
    auth.uid() = id 
    OR EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin')
    OR (auth.jwt() ->> 'role') = 'admin'
  );
