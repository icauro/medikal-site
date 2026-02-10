-- Simplify medical_facility_listings schema
-- Remove admin verification tracking fields
-- Add external review links

-- Drop verification tracking columns
ALTER TABLE public.medical_facility_listings DROP COLUMN IF EXISTS verification_notes;
ALTER TABLE public.medical_facility_listings DROP COLUMN IF EXISTS verified_at;
ALTER TABLE public.medical_facility_listings DROP COLUMN IF EXISTS verified_by;
ALTER TABLE public.medical_facility_listings DROP COLUMN IF EXISTS created_by;

-- Add external review links column
ALTER TABLE public.medical_facility_listings ADD COLUMN IF NOT EXISTS external_review_links TEXT[];
