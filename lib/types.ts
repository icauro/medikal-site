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
}

// Authentication Types
export type UserRole = 'patient' | 'doctor' | 'admin';
export type AccountStatus = 'pending_gdpr' | 'pending_role' | 'pending_application' | 'pending_approval' | 'active' | 'suspended';

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
  doctorInfo?: DoctorInfo;
  patientInfo?: PatientInfo;
  adminInfo?: AdminInfo;
}

export interface DoctorInfo {
  specialization: string;
  clinicId?: string;
  licenseNumber: string;
  verified: boolean;
  verificationRequestId?: string; // Reference to DoctorVerificationRequest
  bio?: string;
  experience?: number;
  procedureTags?: MedicalProcedureType[]; // Medical procedures this doctor can perform
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

// Doctor Verification System
export type VerificationStatus = 'waiting' | 'approved' | 'denied';

export interface DoctorVerificationRequest {
  id?: string;
  doctorId: string; // Firebase Auth UID
  doctorEmail: string;
  doctorName: string;

  // Personal Information
  fullName: string;
  dateOfBirth: string;
  phoneNumber: string;

  // Professional Information
  medicalLicenseNumber: string;
  licenseIssuingAuthority: string;
  licenseExpirationDate: string;
  specialization: string;
  yearsOfExperience: number;

  // Education
  medicalSchool: string;
  graduationYear: number;
  certifications?: string[];

  // Employment
  currentClinic?: string;
  clinicAddress?: string;
  position: string;

  // Documents (URLs to Firebase Storage)
  licenseDocumentUrl?: string;
  certificationDocumentUrls?: string[];
  photoIdUrl?: string;

  // Additional Information
  reasonForVerification: string;
  references?: string[];

  // System fields
  status: VerificationStatus;
  submittedAt: Date;
  reviewedAt?: Date;
  reviewedBy?: string; // Admin UID who reviewed
  reviewNotes?: string;

  // Metadata
  updatedAt: Date;
}

// Support Ticket System
export type TicketStatus = 'open' | 'in_progress' | 'resolved' | 'closed';
export type TicketPriority = 'low' | 'medium' | 'high' | 'urgent';
export type TicketCategory = 
  | 'account'
  | 'billing'
  | 'technical'
  | 'doctor_verification'
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