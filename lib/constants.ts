// Centralized constants for the application
import { Country } from "country-state-city";

// Countries list - cached at module level for performance
export const COUNTRIES = Country.getAllCountries();

// Medical specializations
export const MEDICAL_SPECIALIZATIONS = [
  'Plastic, Reconstructive and Aesthetic Surgery',
  'Dermatology',
] as const;

// Medical facility types
export const MEDICAL_FACILITY_TYPES = [
  'Solo Practice',
  'Polyclinic',
  'Clinic',
  'Health Center',
  'Hospital',
  'Medical Center',
  'Private Oral and Dental Health Center',
  'Private Oral and Dental Health Polyclinic',
  'Private Oral and Dental Health Hospital'
] as const;

// User roles
export const USER_ROLES = ['patient', 'healthcare_personnel', 'admin', 'medical_facility', 'agency'] as const;

// Account statuses
export const ACCOUNT_STATUSES = ['pending_gdpr', 'pending_role', 'pending_personal_data', 'active', 'suspended'] as const;

// Personnel types
export const PERSONNEL_TYPES = ['Doctor', 'Patient Coordinator'] as const;

// Ticket related constants
export const TICKET_STATUSES = ['open', 'in_progress', 'resolved', 'closed'] as const;
export const TICKET_PRIORITIES = ['low', 'medium', 'high', 'urgent'] as const;
export const TICKET_CATEGORIES = [
  'account',
  'billing',
  'technical',
  'general',
  'medical_question'
] as const;

// Treatment plan constants
export const TREATMENT_PLAN_STATUSES = ['pending', 'reviewed', 'approved', 'rejected', 'completed'] as const;
export const TREATMENT_PLAN_PRIORITIES = ['low', 'medium', 'high', 'urgent'] as const;

// Comment sorting
export const COMMENT_SORT_TYPES = ['top', 'newest', 'oldest'] as const;

// Plastic Surgery procedures
export const PLASTIC_SURGERY_PROCEDURES = [
  'Rhinoplasty (Nose Job)',
  'Blepharoplasty (Eyelid Surgery)',
  'Rhytidectomy (Face Lift)',
  'Mentoplasty (Chin Surgery)',
  'Sliding Genioplasty (Osseous Chin Surgery)',
  'Otoplasty (Ear Surgery)',
  'Brow Lift (Forehead Lift)',
  'Cheek Augmentation (Malar Augmentation)',
  'Mammoplasty (Breast Surgery)',
  'Breast Augmentation (Breast Implants)',
  'Breast Reduction (Reduction Mammoplasty)',
  'Breast Lift (Mastopexy)',
  'Gynecomastia Surgery (Male Breast Reduction)',
  'Abdominoplasty (Tummy Tuck)',
  'Liposuction (Fat Removal)',
  'Brachioplasty (Arm Lift)',
  'Thighplasty (Thigh Lift)',
  'Brazilian Butt Lift (Fat Transfer)',
  'Body Lift (Body Contouring)',
  'Labiaplasty (Labia Minora Reduction)',
  'Scar Revision Surgery',
  'Fat Transfer (Fat Grafting)',
  'Botox Injections (Botulinum Toxin)',
  'Dermal Fillers (Soft Tissue Fillers)',
  'Chemical Peel (Chemexfoliation)',
  'Laser Skin Resurfacing',
  'Microdermabrasion',
  'Lip Augmentation (Lip Fillers)',
  'Non-Surgical Nose Job (Liquid Rhinoplasty)',
] as const;

// Hair Restoration procedures
export const HAIR_RESTORATION_PROCEDURES = [
  'Hair Transplant (FUT - Follicular Unit Transplantation)',
  'Hair Transplant (FUE - Follicular Unit Extraction)',
  'Hair Transplant (DHI - Direct Hair Implantation)',
  'Scalp Micropigmentation (SMP)',
  'Platelet-Rich Plasma (PRP) Hair Treatment',
  'Low-Level Laser Therapy (LLLT)',
  'Hair Loss Assessment and Consultation',
  'Hair Restoration Surgery',
] as const;

// Dental Treatment procedures
export const DENTAL_TREATMENT_PROCEDURES = [
  'General Dentistry Check-up',
  'Professional Cleaning (Prophylaxis)',
  'Dental Filling (Composite/Amalgam)',
  'Root Canal Treatment (Endodontic)',
  'Tooth Extraction',
  'Wisdom Tooth Extraction',
  'Dental Crown (Cap)',
  'Dental Bridge',
  'Dental Implant Placement',
  'Implant-Supported Crown',
  'Teeth Whitening (Bleaching)',
  'Gum Disease Treatment (Scaling & Root Planing)',
  'Orthodontic Treatment (Braces)',
  'Clear Aligner Treatment (Invisalign)',
  'Veneers (Porcelain)',
  'Cosmetic Bonding',
] as const;

// Wellness & Check-Up procedures
export const WELLNESS_PROCEDURES = [
  'Full Body Health Check-up',
  'Annual Physical Examination',
  'Blood Pressure Screening',
  'Cholesterol Screening',
  'Blood Sugar (Glucose) Testing',
  'Complete Blood Count (CBC)',
  'Liver Function Tests',
  'Kidney Function Tests',
  'Thyroid Function Tests (TSH, T3, T4)',
  'Cardiac Health Screening',
  'Cancer Screening (Mammography, Colonoscopy)',
  'Skin Cancer Screening',
  'Vaccination and Immunizations',
  'Nutritional Counseling',
  'Weight Management Consultation',
  'Stress Management and Mental Health Screening',
] as const;

export const PROCEDURE_CATEGORIES = [
  'Plastic and Reconstructive Surgery',
  'Hair Restoration',
  'Dental Treatments',
  'Wellness & Check-Up Procedures',
] as const;

// Combined all procedure arrays for easy access
export const ALL_PROCEDURES = [
  ...PLASTIC_SURGERY_PROCEDURES,
  ...HAIR_RESTORATION_PROCEDURES,
  ...DENTAL_TREATMENT_PROCEDURES,
  ...WELLNESS_PROCEDURES,
] as const;

// Map procedures to their categories for filtering/searching
export const PROCEDURE_TO_CATEGORY = {
  ...Object.fromEntries(PLASTIC_SURGERY_PROCEDURES.map(p => [p, 'Plastic and Reconstructive Surgery'] as const)),
  ...Object.fromEntries(HAIR_RESTORATION_PROCEDURES.map(p => [p, 'Hair Restoration'] as const)),
  ...Object.fromEntries(DENTAL_TREATMENT_PROCEDURES.map(p => [p, 'Dental Treatments'] as const)),
  ...Object.fromEntries(WELLNESS_PROCEDURES.map(p => [p, 'Wellness & Check-Up Procedures'] as const)),
} as const;