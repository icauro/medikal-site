// Shared types for the application
export interface Doctor {
  id: string;
  slug: string;
  name: string;
  specialty: string;
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




