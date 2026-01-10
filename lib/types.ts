// Shared types for the application
export type DoctorSpecialty = 
  | 'Plastic, Reconstructive and Aesthetic Surgery'
  | 'Dermatology';

export const DOCTOR_SPECIALTIES: DoctorSpecialty[] = [
  'Plastic, Reconstructive and Aesthetic Surgery',
  'Dermatology',
];

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

export interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  photoURL?: string;
  role: UserRole;
  createdAt: Date;
  updatedAt: Date;

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
  bio?: string;
  experience?: number;
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




