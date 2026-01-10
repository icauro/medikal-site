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




