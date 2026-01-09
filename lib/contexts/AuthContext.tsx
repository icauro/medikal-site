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
    console.log('👤 [PROFILE] Creating/loading user profile...', {
      uid: firebaseUser.uid,
      email: firebaseUser.email
    });

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
      console.log('🆕 [PROFILE] New user detected, creating profile...');

      // Check admin email list
      const adminEmails = process.env.NEXT_PUBLIC_ADMIN_EMAILS?.split(',') || [];
      const isAdmin = adminEmails.includes(firebaseUser.email!);

      console.log('👑 [PROFILE] Role determination:', {
        email: firebaseUser.email,
        adminEmails: adminEmails,
        isAdmin: isAdmin,
        assignedRole: isAdmin ? 'admin' : role
      });

      const profile: UserProfile = {
        ...baseProfile,
        role: isAdmin ? 'admin' : role,
        patientInfo: role === 'patient' || !isAdmin ? {
          preferredLanguage: 'en',
        } : undefined,
      };

      try {
        console.log('💾 [PROFILE] Saving new user profile to Firestore...');
        await setDoc(userRef, profile);
        console.log('✅ [PROFILE] New user profile created successfully');
        return profile;
      } catch (error) {
        console.error('❌ [PROFILE] Failed to create user profile:', error);
        throw error;
      }
    } else {
      console.log('🔄 [PROFILE] Existing user detected, updating last login...');
      const existingProfile = userSnap.data() as UserProfile;

      try {
        console.log('💾 [PROFILE] Updating user profile timestamp...');
        await updateDoc(userRef, { updatedAt: new Date() });
        existingProfile.updatedAt = new Date();
        console.log('✅ [PROFILE] User profile updated successfully');
        return existingProfile;
      } catch (error) {
        console.error('❌ [PROFILE] Failed to update user profile:', error);
        throw error;
      }
    }
  };

  const signInWithGoogle = async () => {
    console.log('🔐 [AUTH] Starting Google sign-in process...');

    try {
      console.log('🔐 [AUTH] Opening Google OAuth popup...');
      const result = await signInWithPopup(auth, googleProvider);
      const user = result.user;

      console.log('✅ [AUTH] Google OAuth successful', {
        uid: user.uid,
        email: user.email,
        displayName: user.displayName,
        provider: 'google'
      });

      console.log('🔐 [AUTH] User signed in:', user.email);
      console.log('🔐 [AUTH] Profile creation/update will be handled by auth state listener');

    } catch (error: unknown) {
      console.error('❌ [AUTH] Google sign in error:', error);
      throw error;
    }
  };

  const logout = async () => {
    console.log('🔐 [AUTH] Starting logout process...');

    try {
      console.log('🔐 [AUTH] Signing out from Firebase...');
      await firebaseSignOut(auth);
      setUser(null);
      setUserProfile(null);
      console.log('✅ [AUTH] Successfully signed out');
    } catch (error) {
      console.error('❌ [AUTH] Logout error:', error);
      throw error;
    }
  };

  const updateUserRole = async (role: UserRole) => {
    if (!user) {
      console.warn('⚠️ [AUTH] Cannot update role: No user logged in');
      return;
    }

    console.log('👑 [PROFILE] Updating user role...', {
      uid: user.uid,
      currentRole: userProfile?.role,
      newRole: role
    });

    const userRef = doc(db, 'users', user.uid);

    try {
      await updateDoc(userRef, {
        role,
        updatedAt: new Date()
      });

      if (userProfile) {
        setUserProfile({ ...userProfile, role });
        console.log('✅ [PROFILE] User role updated successfully');
      }
    } catch (error) {
      console.error('❌ [PROFILE] Failed to update user role:', error);
      throw error;
    }
  };

  const refreshUserProfile = async () => {
    if (!user) {
      console.warn('⚠️ [AUTH] Cannot refresh profile: No user logged in');
      return;
    }

    console.log('🔄 [PROFILE] Refreshing user profile from Firestore...');

    const userRef = doc(db, 'users', user.uid);
    const userSnap = await getDoc(userRef);

    if (userSnap.exists()) {
      const profile = userSnap.data() as UserProfile;
      setUserProfile(profile);
      console.log('✅ [PROFILE] User profile refreshed successfully');
    } else {
      console.warn('⚠️ [PROFILE] No profile found in Firestore for user:', user.uid);
    }
  };

  useEffect(() => {
    console.log('👂 [AUTH] Setting up Firebase auth state listener...');

    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        console.log('🔐 [AUTH] Auth state changed: User signed in', {
          uid: firebaseUser.uid,
          email: firebaseUser.email,
          displayName: firebaseUser.displayName,
          emailVerified: firebaseUser.emailVerified
        });

        setUser(firebaseUser);

        // Load or create user profile from Firestore
        try {
          console.log('👤 [PROFILE] Loading/creating user profile...');
          const profile = await createUserProfile(firebaseUser);
          setUserProfile(profile);
          console.log('✅ [AUTH] User authentication and profile setup complete');
        } catch (error: unknown) {
          console.error('❌ [AUTH] Error loading user profile:', error);
          // Still set loading to false so UI doesn't hang
        }
      } else {
        console.log('🔐 [AUTH] Auth state changed: User signed out');
        setUser(null);
        setUserProfile(null);
      }

      setLoading(false);
      console.log('🏁 [AUTH] Auth state listener initialization complete');
    });

    return () => {
      console.log('🧹 [AUTH] Cleaning up auth state listener');
      unsubscribe();
    };
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