-- Medikal Site - Complete Database Schema
-- Consolidated migration containing the full current database schema
-- This is the single source of truth for the database structure

-- ============================================================================
-- EXTENSIONS
-- ============================================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================================
-- USERS TABLE (extends Supabase auth.users)
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL UNIQUE,
  display_name TEXT,
  photo_url TEXT,
  role TEXT CHECK (role IN ('patient', 'healthcare_personnel', 'medical_facility', 'admin')),
  account_status TEXT CHECK (account_status IN ('pending_gdpr', 'pending_role', 'pending_personal_data', 'active')) DEFAULT 'pending_gdpr',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- GDPR & Privacy
  gdpr_consent JSONB,
  
  -- Role-specific user data references (two-way linked)
  patient_user_data_id UUID UNIQUE,
  healthcare_personnel_user_data_id UUID UNIQUE,
  medical_facility_user_data_id UUID UNIQUE,
  agency_user_data_id UUID UNIQUE,
  
  -- Legacy JSONB fields (kept for backward compatibility during migration)
  admin_account_data JSONB,
  patient_account_data JSONB,
  healthcare_personnel_account_data JSONB,
  medical_facility_account_data JSONB,
  agency_account_data JSONB
);

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
-- HEALTHCARE PERSONNEL USER DATA TABLE
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
-- MEDICAL FACILITY USER DATA TABLE
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
-- AGENCY USER DATA TABLE
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
-- ADD MISSING COLUMNS TO USERS TABLE (if they don't exist)
-- ============================================================================

-- Add missing columns to existing users table (idempotent)
DO $$
BEGIN
  IF NOT EXISTS(SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='users' AND column_name='patient_user_data_id') THEN
    ALTER TABLE public.users ADD COLUMN patient_user_data_id UUID UNIQUE;
  END IF;
  IF NOT EXISTS(SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='users' AND column_name='healthcare_personnel_user_data_id') THEN
    ALTER TABLE public.users ADD COLUMN healthcare_personnel_user_data_id UUID UNIQUE;
  END IF;
  IF NOT EXISTS(SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='users' AND column_name='medical_facility_user_data_id') THEN
    ALTER TABLE public.users ADD COLUMN medical_facility_user_data_id UUID UNIQUE;
  END IF;
  IF NOT EXISTS(SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='users' AND column_name='agency_user_data_id') THEN
    ALTER TABLE public.users ADD COLUMN agency_user_data_id UUID UNIQUE;
  END IF;
END $$;

-- ============================================================================
-- ADD FOREIGN KEY CONSTRAINTS TO USERS TABLE (if they don't exist)
-- ============================================================================

DO $$
BEGIN
  IF NOT EXISTS(SELECT 1 FROM information_schema.table_constraints WHERE constraint_name='users_patient_user_data_id_fkey') THEN
    ALTER TABLE public.users ADD CONSTRAINT users_patient_user_data_id_fkey FOREIGN KEY (patient_user_data_id) REFERENCES public.patient_user_data(id) ON DELETE CASCADE;
  END IF;
  IF NOT EXISTS(SELECT 1 FROM information_schema.table_constraints WHERE constraint_name='users_healthcare_personnel_user_data_id_fkey') THEN
    ALTER TABLE public.users ADD CONSTRAINT users_healthcare_personnel_user_data_id_fkey FOREIGN KEY (healthcare_personnel_user_data_id) REFERENCES public.healthcare_personnel_user_data(id) ON DELETE CASCADE;
  END IF;
  IF NOT EXISTS(SELECT 1 FROM information_schema.table_constraints WHERE constraint_name='users_medical_facility_user_data_id_fkey') THEN
    ALTER TABLE public.users ADD CONSTRAINT users_medical_facility_user_data_id_fkey FOREIGN KEY (medical_facility_user_data_id) REFERENCES public.medical_facility_user_data(id) ON DELETE CASCADE;
  END IF;
  IF NOT EXISTS(SELECT 1 FROM information_schema.table_constraints WHERE constraint_name='users_agency_user_data_id_fkey') THEN
    ALTER TABLE public.users ADD CONSTRAINT users_agency_user_data_id_fkey FOREIGN KEY (agency_user_data_id) REFERENCES public.agency_user_data(id) ON DELETE CASCADE;
  END IF;
END $$;

-- ============================================================================
-- REMOVE OLD PROFILE COLUMNS FROM USERS TABLE (if they exist)
-- ============================================================================

DO $$
BEGIN
  IF EXISTS(SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='users' AND column_name='patient_profile_id') THEN
    ALTER TABLE public.users DROP COLUMN patient_profile_id;
  END IF;
  IF EXISTS(SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='users' AND column_name='healthcare_personnel_profile_id') THEN
    ALTER TABLE public.users DROP COLUMN healthcare_personnel_profile_id;
  END IF;
  IF EXISTS(SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='users' AND column_name='medical_facility_profile_id') THEN
    ALTER TABLE public.users DROP COLUMN medical_facility_profile_id;
  END IF;
  IF EXISTS(SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='users' AND column_name='agency_profile_id') THEN
    ALTER TABLE public.users DROP COLUMN agency_profile_id;
  END IF;
END $$;

-- ============================================================================
-- PUBLIC LISTINGS (Admin-managed, publicly readable)
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.healthcare_personnel_listings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  personnel_type TEXT NOT NULL,
  specialization TEXT NOT NULL,
  slug TEXT UNIQUE,
  image TEXT,
  country TEXT NOT NULL,
  province TEXT,
  rating DECIMAL(3, 2),
  review_count INTEGER DEFAULT 0,
  google_place_id TEXT,
  google_reviews_embed_url TEXT,
  links TEXT[],
  medical_facility_ids TEXT[],
  verified BOOLEAN DEFAULT FALSE,
  verification_notes TEXT,
  verified_at TIMESTAMP WITH TIME ZONE,
  verified_by UUID REFERENCES public.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by UUID REFERENCES public.users(id)
);

CREATE TABLE IF NOT EXISTS public.medical_facility_listings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  facility_type TEXT NOT NULL,
  slug TEXT UNIQUE,
  image TEXT,
  country TEXT NOT NULL,
  province TEXT,
  city TEXT,
  rating DECIMAL(3, 2),
  review_count INTEGER DEFAULT 0,
  google_place_id TEXT,
  google_reviews_embed_url TEXT,
  links TEXT[],
  external_review_links TEXT[],
  verified BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.agency_listings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  slug TEXT UNIQUE,
  image TEXT,
  country TEXT,
  province TEXT,
  city TEXT,
  rating DECIMAL(3, 2),
  review_count INTEGER DEFAULT 0,
  verified BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by UUID REFERENCES public.users(id)
);

-- ============================================================================
-- COMMENTS & REVIEWS
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  listing_type TEXT NOT NULL CHECK (listing_type IN ('healthcare_personnel', 'medical_facility', 'agency')),
  listing_id TEXT NOT NULL,
  rating DECIMAL(3, 2) NOT NULL CHECK (rating >= 0 AND rating <= 5),
  text TEXT,
  is_deleted BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================================
-- TREATMENT PLANS
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.treatment_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  status TEXT DEFAULT 'pending',
  priority TEXT DEFAULT 'medium',
  target_budget DECIMAL(12, 2),
  preferred_date TIMESTAMP WITH TIME ZONE,
  selected_doctor_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  completed_at TIMESTAMP WITH TIME ZONE
);

CREATE TABLE IF NOT EXISTS public.treatment_plan_details (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  treatment_plan_id UUID NOT NULL REFERENCES public.treatment_plans(id) ON DELETE CASCADE,
  procedures TEXT[] NOT NULL,
  medical_history TEXT,
  medications TEXT,
  allergies TEXT,
  timeline TEXT,
  additional_notes TEXT,
  attachments TEXT[],
  medical_records TEXT[]
);

CREATE TABLE IF NOT EXISTS public.doctor_responses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  treatment_plan_id UUID NOT NULL REFERENCES public.treatment_plans(id) ON DELETE CASCADE,
  doctor_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  message TEXT,
  estimated_cost DECIMAL(12, 2),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================================
-- SUPPORT TICKETS
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.support_tickets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  status TEXT DEFAULT 'open' CHECK (status IN ('open', 'in_progress', 'resolved', 'closed')),
  priority TEXT DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
  category TEXT,
  assigned_to UUID REFERENCES public.users(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  resolved_at TIMESTAMP WITH TIME ZONE
);

CREATE TABLE IF NOT EXISTS public.ticket_replies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_id UUID NOT NULL REFERENCES public.support_tickets(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  message TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================================
-- INDEXES FOR PERFORMANCE (idempotent - handles column variations)
-- ============================================================================

-- Users indexes
CREATE INDEX IF NOT EXISTS idx_users_role ON public.users(role);
CREATE INDEX IF NOT EXISTS idx_users_email ON public.users(email);

-- User data indexes
CREATE INDEX IF NOT EXISTS idx_patient_user_data_user_id ON public.patient_user_data(user_id);
CREATE INDEX IF NOT EXISTS idx_healthcare_personnel_user_data_user_id ON public.healthcare_personnel_user_data(user_id);
CREATE INDEX IF NOT EXISTS idx_medical_facility_user_data_user_id ON public.medical_facility_user_data(user_id);
CREATE INDEX IF NOT EXISTS idx_agency_user_data_user_id ON public.agency_user_data(user_id);

-- Listings indexes
CREATE INDEX IF NOT EXISTS idx_healthcare_personnel_listings_country ON public.healthcare_personnel_listings(country);
CREATE INDEX IF NOT EXISTS idx_healthcare_personnel_listings_slug ON public.healthcare_personnel_listings(slug);
CREATE INDEX IF NOT EXISTS idx_medical_facility_listings_country ON public.medical_facility_listings(country);
CREATE INDEX IF NOT EXISTS idx_medical_facility_listings_slug ON public.medical_facility_listings(slug);
CREATE INDEX IF NOT EXISTS idx_agency_listings_slug ON public.agency_listings(slug);

-- Comments indexes
CREATE INDEX IF NOT EXISTS idx_comments_listing ON public.comments(listing_type, listing_id);
CREATE INDEX IF NOT EXISTS idx_comments_user_id ON public.comments(user_id);
CREATE INDEX IF NOT EXISTS idx_comments_is_deleted ON public.comments(is_deleted);

-- Treatment plans indexes
CREATE INDEX IF NOT EXISTS idx_treatment_plans_user_id ON public.treatment_plans(user_id);
CREATE INDEX IF NOT EXISTS idx_treatment_plans_status ON public.treatment_plans(status);

-- Doctor responses (if table exists)
DO $$
BEGIN
  IF EXISTS(SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='doctor_responses') THEN
    CREATE INDEX IF NOT EXISTS idx_doctor_responses_treatment_plan_id ON public.doctor_responses(treatment_plan_id);
    CREATE INDEX IF NOT EXISTS idx_doctor_responses_doctor_id ON public.doctor_responses(doctor_id);
  END IF;
END $$;

-- Support tickets indexes (only if columns exist)
DO $$
BEGIN
  IF EXISTS(SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='support_tickets' AND column_name='assigned_to') THEN
    CREATE INDEX IF NOT EXISTS idx_support_tickets_assigned_to ON public.support_tickets(assigned_to);
  END IF;
  CREATE INDEX IF NOT EXISTS idx_support_tickets_user_id ON public.support_tickets(user_id);
  CREATE INDEX IF NOT EXISTS idx_support_tickets_status ON public.support_tickets(status);
END $$;

-- Ticket replies (if table exists)
DO $$
BEGIN
  IF EXISTS(SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='ticket_replies') THEN
    CREATE INDEX IF NOT EXISTS idx_ticket_replies_ticket_id ON public.ticket_replies(ticket_id);
  END IF;
END $$;

-- Specialized indexes
DO $$
BEGIN
  IF EXISTS(SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='healthcare_personnel_user_data' AND column_name='current_medical_facility_id') THEN
    CREATE INDEX IF NOT EXISTS idx_healthcare_personnel_user_data_current_facility ON public.healthcare_personnel_user_data(current_medical_facility_id);
  END IF;
  IF EXISTS(SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='medical_facility_user_data' AND column_name='verified_doctor_ids') THEN
    CREATE INDEX IF NOT EXISTS idx_medical_facility_user_data_verified_doctors ON public.medical_facility_user_data USING GIN(verified_doctor_ids);
  END IF;
END $$;

-- ============================================================================
-- ROW LEVEL SECURITY (RLS) - ENABLE FOR ALL USER DATA TABLES
-- ============================================================================

-- Enable RLS on all user data tables
ALTER TABLE public.patient_user_data ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.healthcare_personnel_user_data ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.medical_facility_user_data ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.agency_user_data ENABLE ROW LEVEL SECURITY;

-- Patient User Data Policies
CREATE POLICY IF NOT EXISTS "Users can view their own patient user data" ON public.patient_user_data
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY IF NOT EXISTS "Admins can view all patient user data" ON public.patient_user_data
  FOR SELECT USING (EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin'));

CREATE POLICY IF NOT EXISTS "Users can update their own patient user data" ON public.patient_user_data
  FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY IF NOT EXISTS "Users can insert their own patient user data" ON public.patient_user_data
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Healthcare Personnel User Data Policies
CREATE POLICY IF NOT EXISTS "Users can view their own healthcare personnel user data" ON public.healthcare_personnel_user_data
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY IF NOT EXISTS "Admins can view all healthcare personnel user data" ON public.healthcare_personnel_user_data
  FOR SELECT USING (EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin'));

CREATE POLICY IF NOT EXISTS "Users can update their own healthcare personnel user data" ON public.healthcare_personnel_user_data
  FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY IF NOT EXISTS "Users can insert their own healthcare personnel user data" ON public.healthcare_personnel_user_data
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Medical Facility User Data Policies
CREATE POLICY IF NOT EXISTS "Users can view their own medical facility user data" ON public.medical_facility_user_data
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY IF NOT EXISTS "Admins can view all medical facility user data" ON public.medical_facility_user_data
  FOR SELECT USING (EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin'));

CREATE POLICY IF NOT EXISTS "Users can update their own medical facility user data" ON public.medical_facility_user_data
  FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY IF NOT EXISTS "Users can insert their own medical facility user data" ON public.medical_facility_user_data
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Agency User Data Policies
CREATE POLICY IF NOT EXISTS "Users can view their own agency user data" ON public.agency_user_data
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY IF NOT EXISTS "Admins can view all agency user data" ON public.agency_user_data
  FOR SELECT USING (EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin'));

CREATE POLICY IF NOT EXISTS "Users can update their own agency user data" ON public.agency_user_data
  FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY IF NOT EXISTS "Users can insert their own agency user data" ON public.agency_user_data
  FOR INSERT WITH CHECK (auth.uid() = user_id);
