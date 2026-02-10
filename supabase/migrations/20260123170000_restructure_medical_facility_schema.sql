-- Restructure medical facility schema
-- Separate user-specific data into dedicated table
-- Consolidate multiple link fields into single link field

-- Create new table for user-specific medical facility data
CREATE TABLE IF NOT EXISTS public.medical_facility_user_data (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  facility_listing_id UUID REFERENCES public.medical_facility_listings(id) ON DELETE CASCADE,

  -- User-specific data
  image TEXT,
  link TEXT, -- Consolidated link field

  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  -- Ensure one record per user per facility
  UNIQUE(user_id, facility_listing_id)
);

-- Add link column to medical_facility_listings (for public data)
ALTER TABLE public.medical_facility_listings ADD COLUMN IF NOT EXISTS link TEXT;

-- Migrate existing user data to new table (if any exists)
-- Note: This assumes existing data structure. Adjust as needed based on actual data.
INSERT INTO public.medical_facility_user_data (user_id, facility_listing_id, image, link)
SELECT
  user_id,
  id as facility_listing_id,
  image,
  CASE
    WHEN google_reviews_embed_url IS NOT NULL THEN google_reviews_embed_url
    WHEN links IS NOT NULL AND array_length(links, 1) > 0 THEN links[1]
    ELSE NULL
  END as link
FROM public.medical_facility_listings
WHERE user_id IS NOT NULL;

-- Remove old columns from medical_facility_listings
ALTER TABLE public.medical_facility_listings DROP COLUMN IF EXISTS city;
ALTER TABLE public.medical_facility_listings DROP COLUMN IF EXISTS image;
ALTER TABLE public.medical_facility_listings DROP COLUMN IF EXISTS google_reviews_embed_url;
ALTER TABLE public.medical_facility_listings DROP COLUMN IF EXISTS links;

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_medical_facility_user_data_user_id ON public.medical_facility_user_data(user_id);
CREATE INDEX IF NOT EXISTS idx_medical_facility_user_data_facility_listing_id ON public.medical_facility_user_data(facility_listing_id);

-- Enable RLS on new table
ALTER TABLE public.medical_facility_user_data ENABLE ROW LEVEL SECURITY;

-- RLS Policies for medical_facility_user_data
CREATE POLICY "Users can read their own medical facility user data"
  ON public.medical_facility_user_data FOR SELECT
  USING (auth.uid() = user_id OR (auth.jwt() ->> 'role') = 'admin');

CREATE POLICY "Users can insert their own medical facility user data"
  ON public.medical_facility_user_data FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own medical facility user data"
  ON public.medical_facility_user_data FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own medical facility user data"
  ON public.medical_facility_user_data FOR DELETE
  USING (auth.uid() = user_id);

-- Admin can do everything
CREATE POLICY "Admin can manage all medical facility user data"
  ON public.medical_facility_user_data FOR ALL
  USING ((auth.jwt() ->> 'role') = 'admin');