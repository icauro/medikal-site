-- Supabase Database Schema for Medikal Site
-- This file documents all required tables and their structure

-- ============================================================================
-- AUTH
-- ============================================================================
-- Note: Supabase Auth manages users, sessions, and authentication
-- No need to manually create auth tables - they're managed by Supabase

-- ============================================================================
-- CORE TABLES
-- ============================================================================

-- users table (extends Supabase auth.users)
CREATE TABLE IF NOT EXISTS public.users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL UNIQUE,
  display_name TEXT,
  photo_url TEXT,
  role TEXT CHECK (role IN ('patient', 'healthcare_personnel', 'medical_facility', 'agency', 'admin')),
  account_status TEXT CHECK (account_status IN ('pending_gdpr', 'pending_role', 'pending_personal_data', 'active')) DEFAULT 'pending_gdpr',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- GDPR & Privacy
  gdpr_consent JSONB,  -- {accepted: boolean, acceptedAt: ISO8601, version: string}
  
  -- Role-specific data (JSONB for flexibility)
  admin_account_data JSONB,  -- {permissions: string[], lastLogin: ISO8601}
  patient_account_data JSONB,  -- {medicalHistory: [], preferredLanguage, country, province, emergencyContact}
  healthcare_personnel_account_data JSONB,  -- {personnelType, specialization, licenseNumber, etc}
  medical_facility_account_data JSONB,  -- {facilityType, licenseNumber, etc}
  agency_account_data JSONB  -- {agencyType, licenseNumber, etc}
);

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
  links TEXT[],  -- Array of URLs
  medical_facility_ids TEXT[],  -- Array of facility IDs
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
  verified BOOLEAN DEFAULT FALSE,
  verification_notes TEXT,
  verified_at TIMESTAMP WITH TIME ZONE,
  verified_by UUID REFERENCES public.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by UUID REFERENCES public.users(id)
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
  listing_type TEXT NOT NULL,  -- 'healthcare_personnel', 'medical_facility', 'agency'
  listing_id UUID NOT NULL,
  parent_comment_id UUID REFERENCES public.comments(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  listing_type TEXT NOT NULL,  -- 'healthcare_personnel', 'medical_facility', 'agency'
  listing_id UUID NOT NULL,
  rating INTEGER CHECK (rating >= 1 AND rating <= 5),
  review_text TEXT,
  status TEXT CHECK (status IN ('draft', 'pending', 'published', 'rejected')) DEFAULT 'draft',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================================
-- SUPPORT & TICKETS
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.support_tickets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  category TEXT NOT NULL,
  priority TEXT CHECK (priority IN ('low', 'medium', 'high', 'urgent')) DEFAULT 'medium',
  status TEXT CHECK (status IN ('open', 'in_progress', 'on_hold', 'resolved', 'closed')) DEFAULT 'open',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.ticket_responses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_id UUID NOT NULL REFERENCES public.support_tickets(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  response_text TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================================
-- TREATMENT PLANS
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.treatment_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  procedure_type TEXT,
  status TEXT CHECK (status IN ('draft', 'submitted', 'under_review', 'approved', 'rejected', 'completed')) DEFAULT 'draft',
  priority TEXT CHECK (priority IN ('low', 'medium', 'high', 'urgent')) DEFAULT 'medium',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.treatment_plan_responses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  treatment_plan_id UUID NOT NULL REFERENCES public.treatment_plans(id) ON DELETE CASCADE,
  responder_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  response_text TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================================
-- INDEXES
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_users_email ON public.users(email);
CREATE INDEX IF NOT EXISTS idx_users_role ON public.users(role);
CREATE INDEX IF NOT EXISTS idx_healthcare_personnel_listings_slug ON public.healthcare_personnel_listings(slug);
CREATE INDEX IF NOT EXISTS idx_medical_facility_listings_slug ON public.medical_facility_listings(slug);
CREATE INDEX IF NOT EXISTS idx_agency_listings_slug ON public.agency_listings(slug);
CREATE INDEX IF NOT EXISTS idx_comments_listing ON public.comments(listing_type, listing_id);
CREATE INDEX IF NOT EXISTS idx_comments_user ON public.comments(user_id);
CREATE INDEX IF NOT EXISTS idx_reviews_listing ON public.reviews(listing_type, listing_id);
CREATE INDEX IF NOT EXISTS idx_reviews_status ON public.reviews(status);
CREATE INDEX IF NOT EXISTS idx_support_tickets_user ON public.support_tickets(user_id);
CREATE INDEX IF NOT EXISTS idx_support_tickets_status ON public.support_tickets(status);
CREATE INDEX IF NOT EXISTS idx_treatment_plans_user ON public.treatment_plans(user_id);
CREATE INDEX IF NOT EXISTS idx_treatment_plans_status ON public.treatment_plans(status);

-- ============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================================================

-- Enable RLS on all tables
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.healthcare_personnel_listings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.medical_facility_listings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.agency_listings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.support_tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ticket_responses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.treatment_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.treatment_plan_responses ENABLE ROW LEVEL SECURITY;

-- Users: Can only read own profile, admin can read all
CREATE POLICY "Users can read own profile"
  ON public.users FOR SELECT
  USING (auth.uid() = id OR (auth.jwt() ->> 'role') = 'admin');

CREATE POLICY "Users can update own profile"
  ON public.users FOR UPDATE
  USING (auth.uid() = id);

-- Public Listings: Everyone can read, only admin can write
CREATE POLICY "Anyone can read listings"
  ON public.healthcare_personnel_listings FOR SELECT
  USING (true);

CREATE POLICY "Admin only write listings"
  ON public.healthcare_personnel_listings FOR INSERT
  WITH CHECK ((auth.jwt() ->> 'role') = 'admin');

CREATE POLICY "Admin only update listings"
  ON public.healthcare_personnel_listings FOR UPDATE
  USING ((auth.jwt() ->> 'role') = 'admin');

-- Similar policies for medical_facility_listings and agency_listings
CREATE POLICY "Anyone can read medical facility listings"
  ON public.medical_facility_listings FOR SELECT
  USING (true);

CREATE POLICY "Admin only write medical facility listings"
  ON public.medical_facility_listings FOR INSERT
  WITH CHECK ((auth.jwt() ->> 'role') = 'admin');

CREATE POLICY "Admin only update medical facility listings"
  ON public.medical_facility_listings FOR UPDATE
  USING ((auth.jwt() ->> 'role') = 'admin');

CREATE POLICY "Anyone can read agency listings"
  ON public.agency_listings FOR SELECT
  USING (true);

CREATE POLICY "Admin only write agency listings"
  ON public.agency_listings FOR INSERT
  WITH CHECK ((auth.jwt() ->> 'role') = 'admin');

CREATE POLICY "Admin only update agency listings"
  ON public.agency_listings FOR UPDATE
  USING ((auth.jwt() ->> 'role') = 'admin');

-- Comments: Anyone authenticated can read, users can only write own comments
CREATE POLICY "Anyone can read comments"
  ON public.comments FOR SELECT
  USING (true);

CREATE POLICY "Authenticated users can create comments"
  ON public.comments FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own comments"
  ON public.comments FOR UPDATE
  USING (auth.uid() = user_id OR (auth.jwt() ->> 'role') = 'admin');

-- Support Tickets: Users can only read own, admin can read all
CREATE POLICY "Users can read own tickets"
  ON public.support_tickets FOR SELECT
  USING (auth.uid() = user_id OR (auth.jwt() ->> 'role') = 'admin');

CREATE POLICY "Authenticated users can create tickets"
  ON public.support_tickets FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own tickets"
  ON public.support_tickets FOR UPDATE
  USING (auth.uid() = user_id OR (auth.jwt() ->> 'role') = 'admin');

-- Treatment Plans: Users can read own, admin can read all
CREATE POLICY "Users can read own treatment plans"
  ON public.treatment_plans FOR SELECT
  USING (auth.uid() = user_id OR (auth.jwt() ->> 'role') = 'admin');

CREATE POLICY "Authenticated users can create treatment plans"
  ON public.treatment_plans FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own treatment plans"
  ON public.treatment_plans FOR UPDATE
  USING (auth.uid() = user_id OR (auth.jwt() ->> 'role') = 'admin');
