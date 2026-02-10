-- Create role-specific user data tables with two-way linking to users table
-- This migration establishes the new architecture where each role has its own table

-- ============================================================================
-- PATIENT USER DATA TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.patient_user_data (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES public.users(id) ON DELETE CASCADE,
  
  -- Personal Information
  medical_history TEXT[],
  preferred_language TEXT DEFAULT 'en',
  phone_number TEXT,
  date_of_birth TEXT,
  
  -- Location
  country TEXT,
  province TEXT,
  city TEXT,
  
  -- Emergency Contact
  emergency_contact_name TEXT,
  emergency_contact_phone TEXT,
  
  -- Preferences & Interests
  interested_procedures TEXT[],
  preferred_facilities TEXT[],
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================================
-- HEALTHCARE PERSONNEL PROFILES TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.healthcare_personnel_user_data (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES public.users(id) ON DELETE CASCADE,
  
  -- Basic Information
  personnel_type TEXT NOT NULL,
  specialization TEXT NOT NULL,
  phone_number TEXT NOT NULL,
  date_of_birth TEXT,
  
  -- Location
  country TEXT NOT NULL,
  province TEXT NOT NULL,
  city TEXT,
  
  -- Bio & Professional Info
  bio TEXT,
  photo_url TEXT,
  years_of_experience INTEGER,
  
  -- Education
  medical_school TEXT,
  graduation_year INTEGER,
  certifications TEXT[],
  national_id_number TEXT,
  
  -- Employment
  current_medical_facility_id UUID,
  position TEXT,
  
  -- Procedure Specializations
  procedure_tags TEXT[],
  
  -- Verification & Linking
  listing_id UUID,
  verified_at TIMESTAMP WITH TIME ZONE,
  verified_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================================
-- MEDICAL FACILITY PROFILES TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.medical_facility_user_data (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES public.users(id) ON DELETE CASCADE,
  
  -- Basic Information
  name TEXT NOT NULL,
  facility_type TEXT NOT NULL,
  phone TEXT NOT NULL,
  email TEXT NOT NULL,
  
  -- Location
  country TEXT NOT NULL,
  province TEXT NOT NULL,
  city TEXT,
  address TEXT,
  
  -- Public Information
  website TEXT,
  description TEXT,
  logo_url TEXT,
  specializations TEXT[],
  services TEXT[],
  
  -- Business Information
  contact_person TEXT NOT NULL,
  owner_name TEXT,
  tax_id_number TEXT,
  registration_number TEXT,
  established_year INTEGER,
  
  -- Management
  number_of_doctors INTEGER,
  internal_notes TEXT,
  
  -- Verification & Linking
  listing_id UUID,
  verified BOOLEAN DEFAULT FALSE,
  verification_notes TEXT,
  verified_at TIMESTAMP WITH TIME ZONE,
  verified_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
  
  -- Associated Healthcare Personnel
  claimed_doctor_ids UUID[],
  verified_doctor_ids UUID[],
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================================
-- AGENCY PROFILES TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.agency_user_data (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES public.users(id) ON DELETE CASCADE,
  
  -- Basic Information
  name TEXT NOT NULL,
  phone TEXT NOT NULL,
  email TEXT NOT NULL,
  
  -- Location
  country TEXT NOT NULL,
  province TEXT NOT NULL,
  city TEXT,
  address TEXT,
  
  -- Public Information
  website TEXT,
  description TEXT,
  logo_url TEXT,
  services_offered TEXT[],
  focus_countries TEXT[],
  
  -- Business Information
  contact_person TEXT NOT NULL,
  owner_name TEXT,
  tax_id_number TEXT,
  registration_number TEXT,
  established_year INTEGER,
  
  -- Management
  internal_notes TEXT,
  
  -- Verification & Linking
  listing_id UUID,
  verified BOOLEAN DEFAULT FALSE,
  verification_notes TEXT,
  verified_at TIMESTAMP WITH TIME ZONE,
  verified_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================================
-- ALTER USERS TABLE - Add role-specific user data ID references
-- ============================================================================

ALTER TABLE public.users
  ADD COLUMN IF NOT EXISTS patient_user_data_id UUID UNIQUE REFERENCES public.patient_user_data(id) ON DELETE CASCADE,
  ADD COLUMN IF NOT EXISTS healthcare_personnel_user_data_id UUID UNIQUE REFERENCES public.healthcare_personnel_user_data(id) ON DELETE CASCADE,
  ADD COLUMN IF NOT EXISTS medical_facility_user_data_id UUID UNIQUE REFERENCES public.medical_facility_user_data(id) ON DELETE CASCADE,
  ADD COLUMN IF NOT EXISTS agency_user_data_id UUID UNIQUE REFERENCES public.agency_user_data(id) ON DELETE CASCADE;

-- ============================================================================
-- INDEXES for Foreign Keys (Performance)
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_patient_user_data_user_id ON public.patient_user_data(user_id);
CREATE INDEX IF NOT EXISTS idx_healthcare_personnel_user_data_user_id ON public.healthcare_personnel_user_data(user_id);
CREATE INDEX IF NOT EXISTS idx_medical_facility_user_data_user_id ON public.medical_facility_user_data(user_id);
CREATE INDEX IF NOT EXISTS idx_agency_user_data_user_id ON public.agency_user_data(user_id);

CREATE INDEX IF NOT EXISTS idx_healthcare_personnel_user_data_current_facility ON public.healthcare_personnel_user_data(current_medical_facility_id);
CREATE INDEX IF NOT EXISTS idx_medical_facility_user_data_verified_doctors ON public.medical_facility_user_data USING GIN(verified_doctor_ids);

-- ============================================================================
-- ROW LEVEL SECURITY POLICIES
-- ============================================================================

-- Patient Profiles RLS
ALTER TABLE public.patient_user_data ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own patient profile" ON public.patient_user_data
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all patient profiles" ON public.patient_user_data
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "Users can update their own patient profile" ON public.patient_user_data
  FOR UPDATE USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can insert their own patient profile" ON public.patient_user_data
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Healthcare Personnel Profiles RLS
ALTER TABLE public.healthcare_personnel_user_data ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own healthcare personnel profile" ON public.healthcare_personnel_user_data
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all healthcare personnel profiles" ON public.healthcare_personnel_user_data
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "Users can update their own healthcare personnel profile" ON public.healthcare_personnel_user_data
  FOR UPDATE USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can insert their own healthcare personnel profile" ON public.healthcare_personnel_user_data
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Medical Facility Profiles RLS
ALTER TABLE public.medical_facility_user_data ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own medical facility profile" ON public.medical_facility_user_data
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all medical facility profiles" ON public.medical_facility_user_data
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "Users can update their own medical facility profile" ON public.medical_facility_user_data
  FOR UPDATE USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can insert their own medical facility profile" ON public.medical_facility_user_data
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Agency Profiles RLS
ALTER TABLE public.agency_user_data ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own agency profile" ON public.agency_user_data
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all agency profiles" ON public.agency_user_data
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "Users can update their own agency profile" ON public.agency_user_data
  FOR UPDATE USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can insert their own agency profile" ON public.agency_user_data
  FOR INSERT WITH CHECK (auth.uid() = user_id);

