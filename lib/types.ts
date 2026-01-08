// Shared types for the application

// User types
export type UserRole = 'patient' | 'doctor' | 'admin';

export interface BaseUser {
  id: string;
  email: string;
  name: string;
  image?: string;
  role: UserRole;
  createdAt: Date | string;
  updatedAt: Date | string;
}

export interface Patient extends BaseUser {
  role: 'patient';
}

export interface DoctorUser extends BaseUser {
  role: 'doctor';
  doctorId: string; // Reference to Doctor document
}

export interface Admin extends BaseUser {
  role: 'admin';
}

export type User = Patient | DoctorUser | Admin;

// Image visibility types
export type ImageVisibility = 'doctors-only' | 'patients-and-doctors-only' | 'public';

export interface ImageItem {
  url: string; // Firebase Storage URL
  visibility: ImageVisibility; // Who can view this image
  caption?: string;
  uploadedAt: Date | string;
}

// Doctor types
export interface Doctor {
  id: string;
  slug: string;
  name: string;
  specialty: string;
  bio?: string;
  image?: string; // Public profile image
  links?: string[];
  images?: ImageItem[]; // Images with visibility controls
  clinicIds?: string[]; // References to Clinic documents
  rating?: number;
  reviewCount?: number;
  userId: string; // Reference to User document
  createdAt: Date | string;
  updatedAt: Date | string;
}

// Clinic types
export interface Clinic {
  id: string;
  name: string;
  slug: string;
  description?: string;
  location: {
    address: string;
    city: string;
    country: string;
    coordinates?: {
      lat: number;
      lng: number;
    };
  };
  contact: {
    phone?: string;
    email?: string;
    website?: string;
  };
  doctorIds: string[]; // References to Doctor documents
  moderatorIds?: string[]; // Doctor IDs who can moderate this clinic
  pendingModeratorRequests?: string[]; // Doctor IDs who requested to moderate
  createdAt: Date | string;
  updatedAt: Date | string;
}

// Review types
export interface Review {
  id: string;
  doctorId: string; // Reference to Doctor document
  patientId: string; // Reference to Patient User document
  rating: number; // 1-5
  title?: string;
  content: string;
  doctorResponse?: string; // Response from the doctor
  doctorResponseDate?: Date | string;
  commentCount?: number;
  createdAt: Date | string;
  updatedAt: Date | string;
}

// Comment types (nested comments on reviews)
export interface Comment {
  id: string;
  reviewId: string; // Reference to Review document
  patientId: string; // Reference to Patient User document
  content: string;
  parentCommentId?: string; // For nested comments (Reddit-style)
  commentCount?: number; // Number of replies to this comment
  createdAt: Date | string;
  updatedAt: Date | string;
}

// Treatment Plan Request types
export interface TreatmentPlanRequest {
  id: string;
  patientId: string; // Reference to Patient User document
  title: string;
  description: string;
  category?: string; // e.g., "Rhinoplasty", "Blepharoplasty", etc.
  status: 'pending' | 'responded' | 'completed';
  visibleTo: 'doctors' | 'clinics' | 'both';
  createdAt: Date | string;
  updatedAt: Date | string;
}

// Treatment Plan Response types
export interface TreatmentPlanResponse {
  id: string;
  requestId: string; // Reference to TreatmentPlanRequest document
  responderId: string; // Doctor or Clinic ID
  responderType: 'doctor' | 'clinic';
  plan: string; // Treatment plan description
  cost: {
    amount: number;
    currency: string;
  };
  duration?: string; // Estimated treatment duration
  paymentStatus: 'pending' | 'paid' | 'expired';
  paidAt?: Date | string;
  createdAt: Date | string;
  updatedAt: Date | string;
}

// Payment types (for treatment plan inquiries)
export interface Payment {
  id: string;
  patientId: string; // Reference to Patient User document
  responseId: string; // Reference to TreatmentPlanResponse document
  amount: number;
  currency: string;
  status: 'pending' | 'completed' | 'failed' | 'refunded';
  transactionId?: string;
  createdAt: Date | string;
  updatedAt: Date | string;
}

// Moderation types
export interface ModerationAction {
  id: string;
  adminId: string; // Reference to Admin User document
  targetType: 'review' | 'comment' | 'conversation';
  targetId: string; // ID of the moderated item
  action: 'delete' | 'edit' | 'hide' | 'approve';
  reason?: string;
  createdAt: Date | string;
}
