-- Remove fields marked with //R from healthcare personnel tables
-- This migration removes:
-- From healthcare_personnel_listings:
--   - google_reviews_embed_url
--   - links
-- From healthcare_personnel_account_data (in users JSONB):
--   - licenseNumber, licenseIssuingAuthority, licenseExpirationDate
--   - medicalFacilityAddress
--   - motivation
--   - verified, verificationNotes

-- Remove columns from healthcare_personnel_listings table
ALTER TABLE public.healthcare_personnel_listings
  DROP COLUMN IF EXISTS google_reviews_embed_url,
  DROP COLUMN IF EXISTS links;

-- Note: The fields in healthcare_personnel_account_data are stored in JSONB
-- and will be handled automatically when the client no longer sends them.
-- The database will not enforce their absence, but the TypeScript types will ensure
-- they are not included in new records created by the application.

-- If you need to actively remove these fields from existing JSONB records, uncomment:
-- UPDATE public.users
-- SET healthcare_personnel_account_data =
--   healthcare_personnel_account_data - 'licenseNumber'
--   - 'licenseIssuingAuthority'
--   - 'licenseExpirationDate'
--   - 'medicalFacilityAddress'
--   - 'motivation'
--   - 'verified'
--   - 'verificationNotes'
-- WHERE role = 'healthcare_personnel' AND healthcare_personnel_account_data IS NOT NULL;
