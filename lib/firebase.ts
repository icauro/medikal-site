// Import the functions you need from the SDKs you need
import { initializeApp, getApps, FirebaseApp } from "firebase/app";
import { getAuth, Auth } from "firebase/auth";
import { getFirestore, Firestore } from "firebase/firestore";
import { getStorage, FirebaseStorage } from "firebase/storage";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIza-REDACTED-BY-HISTORY-REWRITE",
  authDomain: "mpturkey-ccd57.firebaseapp.com",
  projectId: "mpturkey-ccd57",
  storageBucket: "mpturkey-ccd57.firebasestorage.app",
  messagingSenderId: "22291262944",
  appId: "1:22291262944:web:cb0b0035d011ce7ff5cf85"
};

// Initialize Firebase
// Check if Firebase app is already initialized to avoid duplicate initialization
const app: FirebaseApp = getApps().length === 0 
  ? initializeApp(firebaseConfig) 
  : getApps()[0];

// Initialize Firebase services
export const auth: Auth = getAuth(app);
export const db: Firestore = getFirestore(app);
export const storage: FirebaseStorage = getStorage(app);

// Export the app instance
export default app;
