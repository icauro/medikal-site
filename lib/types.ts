// Shared types for the application
import { 
  MEDICAL_SPECIALIZATIONS, 
  PLASTIC_SURGERY_PROCEDURES,
  HAIR_RESTORATION_PROCEDURES,
  DENTAL_TREATMENT_PROCEDURES,
  WELLNESS_PROCEDURES,
  ALL_PROCEDURES,
  PROCEDURE_TO_CATEGORY,
  MEDICAL_FACILITY_TYPES,
  USER_ROLES,
  ACCOUNT_STATUSES,
  PERSONNEL_TYPES,
  TICKET_STATUSES,
  TICKET_PRIORITIES,
  TICKET_CATEGORIES,
  TREATMENT_PLAN_STATUSES,
  TREATMENT_PLAN_PRIORITIES,
  COMMENT_SORT_TYPES
} from './constants';

// Re-export constants for convenience
export { 
  MEDICAL_SPECIALIZATIONS, 
  PLASTIC_SURGERY_PROCEDURES,
  HAIR_RESTORATION_PROCEDURES,
  DENTAL_TREATMENT_PROCEDURES,
  WELLNESS_PROCEDURES,
  ALL_PROCEDURES,
  PROCEDURE_TO_CATEGORY,
  MEDICAL_FACILITY_TYPES,
  USER_ROLES,
  ACCOUNT_STATUSES,
  PERSONNEL_TYPES,
  TICKET_STATUSES,
  TICKET_PRIORITIES,
  TICKET_CATEGORIES,
  TREATMENT_PLAN_STATUSES,
  TREATMENT_PLAN_PRIORITIES,
  COMMENT_SORT_TYPES
} from './constants';

// Type derivation from constants
export type MedicalSpecialization = typeof MEDICAL_SPECIALIZATIONS[number];
export type PlasticSurgeryProcedure = typeof PLASTIC_SURGERY_PROCEDURES[number];
export type HairRestorationProcedure = typeof HAIR_RESTORATION_PROCEDURES[number];
export type DentalTreatmentProcedure = typeof DENTAL_TREATMENT_PROCEDURES[number];
export type WellnessProcedure = typeof WELLNESS_PROCEDURES[number];
// Union type for all procedure types
export type MedicalProcedureType = PlasticSurgeryProcedure | HairRestorationProcedure | DentalTreatmentProcedure | WellnessProcedure;
export type MedicalFacilityType = typeof MEDICAL_FACILITY_TYPES[number];
export type UserRole = typeof USER_ROLES[number];
export type AccountStatus = typeof ACCOUNT_STATUSES[number];
export type PersonnelType = typeof PERSONNEL_TYPES[number];
export type TicketStatus = typeof TICKET_STATUSES[number];
export type TicketPriority = typeof TICKET_PRIORITIES[number];
export type TicketCategory = typeof TICKET_CATEGORIES[number];
export type TreatmentPlanStatus = typeof TREATMENT_PLAN_STATUSES[number];
export type TreatmentPlanPriority = typeof TREATMENT_PLAN_PRIORITIES[number];
export type CommentSortType = typeof COMMENT_SORT_TYPES[number];

export interface UserProfile {
  id: string;
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
  adminAccountData?: AdminAccountData;
  patientAccountData?: PatientAccountData;
  healthcarePersonnelAccountData?: HealthcarePersonnelAccountData;
  medicalFacilityAccountData?: MedicalFacilityAccountData;
  agencyAccountData?: AgencyAccountData;
}

export interface AdminAccountData {
  permissions: string[];
  lastLogin: Date;
}

export interface PatientAccountData {
  medicalHistory?: string[];
  preferredLanguage: string;
  country?: string;   // Optional - patient may not want to share location
  province?: string;  // Optional - patient may not want to share location
  emergencyContact?: {
    name: string;
    phone: string;
  };
}

// Healthcare Personnel Account Data (private, personnel-managed)
export interface HealthcarePersonnelAccountData {
  personnelType: PersonnelType;
  name: string;
  specialization: MedicalSpecialization;
  
  // Private Credentials & Identity
  dateOfBirth: string;
  phoneNumber: string;
  nationalIdNumber?: string;
  country: string;   // Required field
  province: string;  // Required field - state/province based on country
  bio?: string;
  photoUrl?: string;

  // Professional Credentials (Private)
  yearsOfExperience: number;

  // Education (Private)
  medicalSchool: string;
  graduationYear: number;
  certifications?: string[];

  // Employment (Private)
  currentMedicalFacility?: string;
  position: string;

  // Private Notes
  procedureTags?: MedicalProcedureType[];

  // Verification & Linking (set by admin only)
  listingId?: string; // Link to public healthcare personnel listing (admin-controlled)
  verifiedAt?: Date; //if its null, not verified
  verifiedBy?: string; // Admin email
}

// Healthcare Personnel Listing (public, admin-managed)
export interface HealthcarePersonnelListing {
  id: string;
  name: string;
  personnelType: PersonnelType;
  specialization: MedicalSpecialization;
  procedures?: MedicalProcedureType[]; // Array of offered procedures
  userId?: string; // Link to user account (admin-controlled)
  slug?: string;
  image?: string;
  country: string;   // Required field
  province?: string; // State/province based on country
  rating?: number;
  reviewCount?: number;
  googlePlaceId?: string;
  medicalFacilityIds?: string[]; // IDs of affiliated medical facilities
  createdAt: Date;
  updatedAt: Date;
  createdBy?: string; // Admin email
}

// Medical Facility Account Data (private, facility-managed)
export interface MedicalFacilityAccountData {
  // Publicly Visible basic info
  name: string;
  facilityType: MedicalFacilityType;
  address?: string;  // Optional - not required for locating facility
  country: string;
  province: string;  // Required field - state/province based on country
  phone: string;
  email: string;
  website?: string;
  description?: string;
  logoUrl?: string;
  specializations?: MedicalSpecialization[];
  services?: string[];

  // Private Business Information
  contactPerson: string;
  ownerName?: string;
  taxIdNumber?: string;
  registrationNumber?: string;
  establishedYear?: number;

  // Internal Management
  numberOfDoctors?: number;
  internalNotes?: string;
  
  // Verification & Linking (set by admin only)
  verified: boolean;
  listingId?: string; // Link to public medical facility listing (admin-controlled)
  verificationNotes?: string;
  verifiedAt?: Date;
  verifiedBy?: string; // Admin UID

  // Doctor Claims (doctors claimed by facility, pending verification)
  claimedDoctorIds?: string[]; // Pending verification
}

// Medical Facility User Data (user-specific, private)
export interface MedicalFacilityUserData {
  id: string;
  userId: string;
  facilityListingId?: string;
  image?: string;
  link?: string; // Consolidated link field
  createdAt: Date;
  updatedAt: Date;
}
export interface MedicalFacilityListing {
  id: string;
  name: string;
  facilityType: MedicalFacilityType;
  country: string;    // Required field
  province?: string;  // State/province based on country
  procedures?: MedicalProcedureType[]; // Array of offered procedures
  rating?: number;
  reviewCount?: number;
  googlePlaceId?: string;
  externalReviewLinks?: string[]; // Links to external review platforms
  userId?: string; // Link to user account (admin-controlled)
  verifiedDoctorIds?: string[]; // UIDs of verified doctors associated with this facility
  slug?: string;
  link?: string; // Consolidated link field
  verified?: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// Agency Account Data (private, agency-managed)
export interface AgencyAccountData {
  // Publicly Visible basic info
  name: string;
  address?: string;  // Optional - not required for locating agency
  country: string;
  province: string;  // Required field - state/province based on country
  phone: string;
  email: string;
  website?: string;
  description?: string;
  logoUrl?: string;
  servicesOffered?: string[];
  focusCountries?: string[];

  // Private Business Information
  contactPerson: string;
  ownerName?: string;
  taxIdNumber?: string;
  registrationNumber?: string;
  establishedYear?: number;
  
  // Internal Management
  languages?: string[];
  internalNotes?: string;
  
  // Verification & Linking (set by admin only)
  verified: boolean;
  listingId?: string; // Link to public agency listing (admin-controlled)
  verificationNotes?: string;
  verifiedAt?: Date;
  verifiedBy?: string; // Admin UID
}

// Agency Listing (public, admin-managed)
export interface AgencyListing {
  id: string;
  name: string;
  country?: string;    // Optional field
  province?: string;   // State/province based on country
  city?: string;       // City/municipality
  rating?: number;
  reviewCount?: number;
  googlePlaceId?: string;
  googleReviewsEmbedUrl?: string;
  userId?: string; // Link to user account (admin-controlled)
  slug?: string;
  image?: string;
  links?: string[];
  createdAt: Date;
  updatedAt: Date;
  createdBy?: string; // Admin UID
}

// Medical Facility-Personnel Link (for verified associations)
export interface MedicalFacilityPersonnelLink {
  id?: string;
  medicalFacilityId: string; // MedicalFacilityListing ID
  personnelId: string; // User UID with healthcarePersonnelAccountData
  claimedBy: 'medical_facility' | 'healthcare_personnel' | 'admin'; // Who initiated the claim
  verified: boolean;
  verifiedBy?: string; // Admin UID
  verifiedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

// Support Ticket System

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
  userId: string;
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
  attachments?: string[];

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

// Reddit-Style Comments System
export interface UserComment {
  id: string;
  // Note: entityId and entityType are implicit in subcollection path
  // Note: nested replies are stored in comments/{commentId}/replies subcollection
  
  // User info
  userId: string;
  userDisplayName: string;
  userPhotoUrl?: string;
  
  // Comment content
  content: string;
  
  // Voting system
  upvotes: string[]; // Array of user IDs who upvoted
  downvotes: string[]; // Array of user IDs who downvoted
  score: number; // Calculated as upvotes.length - downvotes.length
  
  // Metadata
  replyCount: number; // Number of direct replies to this comment
  isEdited: boolean;
  isDeleted: boolean;
  
  // Timestamps
  createdAt: Date;
  updatedAt: Date;
}

// Treatment Plan System

export interface DoctorResponse {
  id: string;
  doctorId: string;
  doctorName: string;
  doctorEmail: string;
  doctorSpecialization?: string;
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