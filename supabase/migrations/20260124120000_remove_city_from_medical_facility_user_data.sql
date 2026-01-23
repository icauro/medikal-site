-- Remove city field from medical_facility_user_data table
-- City information should come from the medical facility listing, not user data

ALTER TABLE public.medical_facility_user_data DROP COLUMN IF EXISTS city;
