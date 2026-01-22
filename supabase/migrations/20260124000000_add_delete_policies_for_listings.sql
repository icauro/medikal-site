-- Add DELETE policies for listing tables
-- Admins only can delete medical facility listings
DROP POLICY IF EXISTS "Admin only delete medical facility listings" ON public.medical_facility_listings;
CREATE POLICY "Admin only delete medical facility listings"
  ON public.medical_facility_listings FOR DELETE
  USING (
    EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin')
    OR (auth.jwt() ->> 'role') = 'admin'
  );

-- Admins only can delete healthcare personnel listings
DROP POLICY IF EXISTS "Admin only delete healthcare personnel listings" ON public.healthcare_personnel_listings;
CREATE POLICY "Admin only delete healthcare personnel listings"
  ON public.healthcare_personnel_listings FOR DELETE
  USING (
    EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin')
    OR (auth.jwt() ->> 'role') = 'admin'
  );

-- Admins only can delete agency listings
DROP POLICY IF EXISTS "Admin only delete agency listings" ON public.agency_listings;
CREATE POLICY "Admin only delete agency listings"
  ON public.agency_listings FOR DELETE
  USING (
    EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin')
    OR (auth.jwt() ->> 'role') = 'admin'
  );
