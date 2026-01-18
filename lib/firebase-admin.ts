import { initializeApp, getApps, cert, App } from "firebase-admin/app";
import { getFirestore, Firestore } from "firebase-admin/firestore";
import * as fs from 'fs';
import * as path from 'path';

// Initialize Firebase Admin
let app: App;

if (getApps().length === 0) {
  // Try to load service account key from environment variable or default path
  const serviceAccountPath = process.env.FIREBASE_SERVICE_ACCOUNT_KEY_PATH ||
                            path.join(process.cwd(), 'mpturkey-ccd57-firebase-adminsdk-fbsvc-898f0c2615.json');

  try {
    if (fs.existsSync(serviceAccountPath)) {
      console.log('🔑 Loading Firebase service account key from:', serviceAccountPath);
      const serviceAccount = JSON.parse(fs.readFileSync(serviceAccountPath, 'utf8'));

      app = initializeApp({
        credential: cert(serviceAccount),
        projectId: "mpturkey-ccd57",
      });
      console.log('✅ Firebase Admin initialized with service account key');
    } else {
      throw new Error(`Service account key not found at: ${serviceAccountPath}`);
    }
  } catch (error) {
    console.error('❌ Failed to initialize Firebase Admin:', error);
    throw error;
  }
} else {
  app = getApps()[0];
}

// Initialize Firestore Admin
export const adminDb: Firestore = getFirestore(app);

export default app;
