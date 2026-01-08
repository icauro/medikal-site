import { initializeApp, getApps, cert, App } from "firebase-admin/app";
import { getFirestore, Firestore } from "firebase-admin/firestore";

// Initialize Firebase Admin
let app: App;

if (getApps().length === 0) {
  // Initialize with project ID (works for development)
  // For production, use service account credentials via GOOGLE_APPLICATION_CREDENTIALS env var
  // or initialize with cert() if you have service account JSON
  app = initializeApp({
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "mpturkey-ccd57",
  });
} else {
  app = getApps()[0];
}

// Initialize Firestore Admin
export const adminDb: Firestore = getFirestore(app);

export default app;
