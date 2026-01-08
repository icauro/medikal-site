"use client";

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import {
  User,
  onAuthStateChanged,
  signInWithPopup,
  signOut as firebaseSignOut,
} from 'firebase/auth';
import { doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';
import { auth, db, googleProvider } from '@/lib/firebase';
import { UserProfile, UserRole } from '@/lib/types';

interface AuthContextType {
  user: User | null;
  userProfile: UserProfile | null;
  loading: boolean;
  signInWithGoogle: () => Promise<void>;
  logout: () => Promise<void>;
  updateUserRole: (role: UserRole) => Promise<void>;
  refreshUserProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider = ({ children }: AuthProviderProps) => {
  const [user, setUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  // Create or update user profile in Firestore
  const createUserProfile = async (firebaseUser: User, role: UserRole = 'patient') => {
    const userRef = doc(db, 'users', firebaseUser.uid);
    const userSnap = await getDoc(userRef);

    const baseProfile = {
      uid: firebaseUser.uid,
      email: firebaseUser.email!,
      displayName: firebaseUser.displayName || firebaseUser.email!.split('@')[0],
      photoURL: firebaseUser.photoURL || undefined,
      role,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    if (!userSnap.exists()) {
      // New user - set default role based on email or other criteria
      const adminEmails = process.env.NEXT_PUBLIC_ADMIN_EMAILS?.split(',') || [];
      const isAdmin = adminEmails.includes(firebaseUser.email!);

      const profile: UserProfile = {
        ...baseProfile,
        role: isAdmin ? 'admin' : role,
        patientInfo: role === 'patient' || !isAdmin ? {
          preferredLanguage: 'en',
        } : undefined,
      };
      await setDoc(userRef, profile);
      return profile;
    } else {
      // Existing user - update last login
      const existingProfile = userSnap.data() as UserProfile;
      existingProfile.updatedAt = new Date();
      await updateDoc(userRef, { updatedAt: new Date() });
      return existingProfile;
    }
  };

  const signInWithGoogle = async () => {
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const user = result.user;

      // Profile will be created/loaded by the auth state listener
      console.log('User signed in:', user.email);
    } catch (error) {
      console.error('Google sign in error:', error);
      throw error;
    }
  };

  const logout = async () => {
    try {
      await firebaseSignOut(auth);
      setUser(null);
      setUserProfile(null);
    } catch (error) {
      console.error('Logout error:', error);
      throw error;
    }
  };

  const updateUserRole = async (role: UserRole) => {
    if (!user) return;

    const userRef = doc(db, 'users', user.uid);
    await updateDoc(userRef, {
      role,
      updatedAt: new Date()
    });

    if (userProfile) {
      setUserProfile({ ...userProfile, role });
    }
  };

  const refreshUserProfile = async () => {
    if (!user) return;

    const userRef = doc(db, 'users', user.uid);
    const userSnap = await getDoc(userRef);

    if (userSnap.exists()) {
      setUserProfile(userSnap.data() as UserProfile);
    }
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        setUser(firebaseUser);

        // Load or create user profile from Firestore
        try {
          const profile = await createUserProfile(firebaseUser);
          setUserProfile(profile);
        } catch (error) {
          console.error('Error loading user profile:', error);
        }
      } else {
        setUser(null);
        setUserProfile(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const value = {
    user,
    userProfile,
    loading,
    signInWithGoogle,
    logout,
    updateUserRole,
    refreshUserProfile,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};