-- Add DELETE policy for medical facility listings
-- This allows admin users to delete facility listings

DROP POLICY IF EXISTS "Admin only delete medical facility listings" ON public.medical_facility_listings;
CREATE POLICY "Admin only delete medical facility listings"
  ON public.medical_facility_listings FOR DELETE
  USING (
    EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin')
    OR (auth.jwt() ->> 'role') = 'admin'
  );