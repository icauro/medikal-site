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
  'Hospital'
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

// Medical procedures (from types.ts)
export const MEDICAL_PROCEDURES = [
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
  'Hair Transplant (Hair Restoration)',
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
