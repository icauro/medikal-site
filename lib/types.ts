// Shared types for the application
export type DoctorSpecialty = 
  | 'Plastic, Reconstructive and Aesthetic Surgery'
  | 'Dermatology';

export const DOCTOR_SPECIALTIES: DoctorSpecialty[] = [
  'Plastic, Reconstructive and Aesthetic Surgery',
  'Dermatology',
];

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

  // Non-surgical aesthetic procedures
  'Botox Injections (Botulinum Toxin)',
  'Dermal Fillers (Soft Tissue Fillers)',
  'Chemical Peel (Chemexfoliation)',
  'Laser Skin Resurfacing',
  'Microdermabrasion',
  'Lip Augmentation (Lip Fillers)',
  'Non-Surgical Nose Job (Liquid Rhinoplasty)',
] as const;

export type MedicalProcedureType = typeof MEDICAL_PROCEDURES[number];

export interface Doctor {
  id: string;
  slug: string;
  name: string;
  specialty: DoctorSpecialty;
  bio?: string;
  image?: string;
  clinic?: string;
  rating?: number;
  googlePlaceId?: string; // Google Maps Place ID for embedding reviews/maps
}

export type MedicalFacilityType = 'Solo Practice' | 'Polyclinic' | 'Clinic' | 'Health Center' | 'Hospital';

export const MEDICAL_FACILITY_TYPES: MedicalFacilityType[] = [
  'Solo Practice',
  'Polyclinic',
  'Clinic',
  'Health Center',
  'Hospital'
];

// Authentication Types
export type UserRole = 'patient' | 'healthcare_personnel' | 'admin' | 'medical_facility' | 'agency';
export type AccountStatus = 'pending_gdpr' | 'pending_role' | 'pending_personal_data' | 'active' | 'suspended';

export type PersonnelType = 'Doctor' | 'Patient Coordinator';

export interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  photoURL?: string;
  role: UserRole | null; // null until role is selected
  accountStatus: AccountStatus;
  createdAt: Date;
  updatedAt: Date;

  // GDPR & Privacy
  gdprConsent?: {
    accepted: boolean;
    acceptedAt: Date;
    version: string; // e.g., "1.0"
  };

  // Role-specific fields
  personnelInfo?: PersonnelInfo; // @deprecated - use personalHealthcarePersonnelData instead
  personalHealthcarePersonnelData?: PersonalHealthcarePersonnelData;
  patientInfo?: PatientInfo;
  adminInfo?: AdminInfo;
  personalMedicalFacilityData?: PersonalMedicalFacilityData;
  personalAgencyData?: PersonalAgencyData;
}

export interface PersonnelInfo {
  personnelType: PersonnelType;
  specialization: string;
  medicalFacilityId?: string;
  licenseNumber: string;
  verified: boolean;
  bio?: string;
  experience?: number;
  procedureTags?: MedicalProcedureType[]; // Medical procedures this personnel can perform
}

export interface PatientInfo {
  medicalHistory?: string[];
  preferredLanguage: string;
  emergencyContact?: {
    name: string;
    phone: string;
  };
}

export interface AdminInfo {
  permissions: string[];
  lastLogin: Date;
}

// Personal Healthcare Personnel Data (private, personnel-managed)
export interface PersonalHealthcarePersonnelData {
  // Personnel Type
  personnelType: PersonnelType;

  // Personal Information
  name: string;
  dateOfBirth: string;
  phoneNumber: string;
  photoUrl?: string;

  // Professional Information
  licenseNumber: string;
  licenseIssuingAuthority: string;
  licenseExpirationDate: string;
  specialization: DoctorSpecialty;
  yearsOfExperience: number;

  // Education
  medicalSchool: string;
  graduationYear: number;
  certifications?: string[];

  // Employment
  currentMedicalFacility?: string;
  medicalFacilityAddress?: string;
  position: string;

  // Additional Information
  bio?: string;
  motivation?: string;
  procedureTags?: MedicalProcedureType[];

  // Verification & Linking (set by admin only)
  verified: boolean;
  openHealthcarePersonnelDataId?: string; // Link to openHealthcarePersonnelData (admin-controlled)
  verificationNotes?: string;
  verifiedAt?: Date;
  verifiedBy?: string; // Admin UID
}

// Open Healthcare Personnel Data (public, admin-managed)
export interface OpenHealthcarePersonnelData {
  id: string;
  name: string;
  personnelType: PersonnelType;
  specialty: DoctorSpecialty;
  personalHealthcarePersonnelDataId?: string; // Link to user's personalHealthcarePersonnelData (admin-controlled)
  slug?: string;
  bio?: string;
  image?: string;
  rating?: number;
  reviewCount?: number;
  googlePlaceId?: string;
  links?: string[];
  images?: string[];
  medicalFacilityIds?: string[];
  createdAt: Date;
  updatedAt: Date;
  createdBy?: string; // Admin UID
}

// Medical Facility Information (previously Clinic)
export interface PersonalMedicalFacilityData {
  // Basic Information
  name: string;
  type: MedicalFacilityType;
  contactPerson: string;
  phone: string;
  email: string;
  address: string;
  city: string;
  country: string;

  // Business Information
  registrationNumber?: string;
  establishedYear?: number;
  website?: string;
  description?: string;
  specialties?: DoctorSpecialty[];
  
  // Media
  logoUrl?: string;
  images?: string[];

  // Staff & Services
  numberOfDoctors?: number;
  services?: string[];
  
  // Verification & Linking (set by admin only)
  verified: boolean;
  openMedicalFacilityDataId?: string; // Link to openMedicalFacilityData (admin-controlled)
  verificationNotes?: string;
  verifiedAt?: Date;
  verifiedBy?: string; // Admin UID

  // Doctor Claims (doctors claimed by facility, pending verification)
  claimedDoctorIds?: string[]; // Pending verification
}

// Open Medical Facility Data (public, admin-managed)
export interface OpenMedicalFacilityData {
  id: string;
  name: string;
  type: MedicalFacilityType;
  address: string;
  city?: string;
  country?: string;
  phone?: string;
  email?: string;
  website?: string;
  description?: string;
  specialties?: DoctorSpecialty[];
  personalMedicalFacilityDataId?: string; // Link to user's personalMedicalFacilityData (admin-controlled)
  verifiedDoctorIds?: string[]; // UIDs of verified doctors associated with this facility
  slug?: string;
  createdAt: Date;
  updatedAt: Date;
  createdBy?: string; // Admin UID
}

// Agency Information (deprecated - use PersonalAgencyData)
export interface AgencyInfo {
  name: string;
  contactPerson: string;
  phone: string;
  email?: string;
  website?: string;
  description?: string;
  verified: boolean;
}

// Personal Agency Data (private, agency-managed)
export interface PersonalAgencyData {
  // Basic Information
  name: string;
  contactPerson: string;
  phone: string;
  email: string;
  address: string;
  city: string;
  country: string;

  // Business Information
  registrationNumber?: string;
  establishedYear?: number;
  website?: string;
  description?: string;
  servicesOffered?: string[];
  
  // Media
  logoUrl?: string;
  images?: string[];

  // Specialization
  focusCountries?: string[];
  languages?: string[];
  
  // Verification & Linking (set by admin only)
  verified: boolean;
  openAgencyDataId?: string; // Link to openAgencyData (admin-controlled)
  verificationNotes?: string;
  verifiedAt?: Date;
  verifiedBy?: string; // Admin UID
}

// Open Agency Data (public, admin-managed)
export interface OpenAgencyData {
  id: string;
  name: string;
  country: string;
  city?: string;
  address?: string;
  phone?: string;
  email?: string;
  website?: string;
  description?: string;
  servicesOffered?: string[];
  focusCountries?: string[];
  personalAgencyDataId?: string; // Link to user's personalAgencyData (admin-controlled)
  slug?: string;
  createdAt: Date;
  updatedAt: Date;
  createdBy?: string; // Admin UID
}

// Medical Facility-Personnel Link (for verified associations)
export interface MedicalFacilityPersonnelLink {
  id?: string;
  medicalFacilityId: string; // OpenMedicalFacilityData ID
  personnelId: string; // User UID with personalHealthcarePersonnelData
  claimedBy: 'medical_facility' | 'healthcare_personnel' | 'admin'; // Who initiated the claim
  verified: boolean;
  verifiedBy?: string; // Admin UID
  verifiedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

// Support Ticket System
export type TicketStatus = 'open' | 'in_progress' | 'resolved' | 'closed';
export type TicketPriority = 'low' | 'medium' | 'high' | 'urgent';
export type TicketCategory = 
  | 'account'
  | 'billing'
  | 'technical'
  | 'general'
  | 'medical_question';

export interface TicketMessage {
  id: string;
  authorId: string;
  authorName: string;
  authorRole: UserRole;
  content: string;
  attachments?: string[];
  isInternal?: boolean; // Admin-only notes
  createdAt: Date;
}

export interface SupportTicket {
  id?: string;
  userId: string; // Firebase Auth UID
  userEmail: string;
  userName: string;
  userRole: UserRole;
  
  // Ticket details
  subject: string;
  category: TicketCategory;
  description: string;
  priority: TicketPriority;
  status: TicketStatus;
  
  // Attachments
  attachments?: string[]; // URLs to Firebase Storage
  
  // Threading/Conversation
  messages: TicketMessage[];
  
  // Admin handling
  assignedTo?: string; // Admin UID
  resolvedBy?: string; // Admin UID
  resolutionNotes?: string;
  
  // Timestamps
  createdAt: Date;
  updatedAt: Date;
  resolvedAt?: Date;
  closedAt?: Date;
}

// Treatment Plan System
export type TreatmentPlanStatus = 'pending' | 'reviewed' | 'approved' | 'rejected' | 'completed';
export type TreatmentPlanPriority = 'low' | 'medium' | 'high' | 'urgent';

export interface DoctorResponse {
  id: string;
  doctorId: string;
  doctorName: string;
  doctorEmail: string;
  doctorSpecialty?: string;
  response: string;
  attachments?: string[];
  recommendedTreatment?: string;
  estimatedCost?: number;
  estimatedDuration?: string;
  createdAt: Date;
}

export interface TreatmentPlan {
  id?: string;
  userId: string;
  userEmail: string;
  userName: string;
  
  // Treatment Request Details
  title: string;
  description: string;
  medicalCondition: string;
  currentSymptoms: string;
  desiredOutcome: string;
  procedureTags: MedicalProcedureType[]; // Medical procedures patient is interested in
  budget?: number;
  preferredDate?: Date;
  
  // Attachments
  attachments?: string[];
  medicalRecords?: string[];
  
  // Status
  status: TreatmentPlanStatus;
  priority: TreatmentPlanPriority;
  
  // Doctor Responses
  responses: DoctorResponse[];
  selectedDoctorId?: string;
  
  // Timestamps
  createdAt: Date;
  updatedAt: Date;
  completedAt?: Date;
}