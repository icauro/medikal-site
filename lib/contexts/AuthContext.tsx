"use client";

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import {
  User,
  onAuthStateChanged,
  signInWithPopup,
  signOut as firebaseSignOut,
} from 'firebase/auth';
import { doc, getDoc, setDoc, updateDoc, deleteDoc, Timestamp, collection, query, where, getDocs } from 'firebase/firestore';
import { auth, db, googleProvider } from '@/lib/firebase';
import { deleteUser } from 'firebase/auth';
import { UserProfile, UserRole, AccountStatus } from '@/lib/types';

interface AuthContextType {
  user: User | null;
  userProfile: UserProfile | null;
  loading: boolean;
  signInWithGoogle: () => Promise<void>;
  logout: () => Promise<void>;
  updateUserRole: (role: UserRole) => Promise<void>;
  refreshUserProfile: () => Promise<void>;
  acceptGDPR: () => Promise<void>;
  deleteAccount: () => Promise<void>;
}

// Helper function to convert Firestore Timestamps to Date objects
const convertTimestampsToDates = (profile: any): UserProfile => {
  return {
    ...profile,
    createdAt: profile.createdAt instanceof Timestamp ? profile.createdAt.toDate() : profile.createdAt,
    updatedAt: profile.updatedAt instanceof Timestamp ? profile.updatedAt.toDate() : profile.updatedAt,
    ...(profile.adminInfo?.lastLogin && {
      adminInfo: {
        ...profile.adminInfo,
        lastLogin: profile.adminInfo.lastLogin instanceof Timestamp ? profile.adminInfo.lastLogin.toDate() : profile.adminInfo.lastLogin
      }
    })
  };
};

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
  const createUserProfile = async (firebaseUser: User) => {
    console.log('👤 [PROFILE] Creating/loading user profile...', {
      uid: firebaseUser.uid,
      email: firebaseUser.email
    });

    const userRef = doc(db, 'users', firebaseUser.uid);
    const userSnap = await getDoc(userRef);

    if (!userSnap.exists()) {
      console.log('🆕 [PROFILE] New user detected, creating profile with pending_gdpr status...');

      // Check admin email list
      const adminEmails = process.env.NEXT_PUBLIC_ADMIN_EMAILS?.split(',') || [];
      const isAdmin = adminEmails.includes(firebaseUser.email!);

      console.log('👑 [PROFILE] Admin check:', {
        email: firebaseUser.email,
        isAdmin: isAdmin,
      });

      const profile: UserProfile = {
        uid: firebaseUser.uid,
        email: firebaseUser.email!,
        displayName: firebaseUser.displayName || firebaseUser.email!.split('@')[0],
        photoURL: firebaseUser.photoURL || undefined,
        role: isAdmin ? 'admin' : null, // null until role is selected (unless admin)
        accountStatus: isAdmin ? 'active' : 'pending_gdpr', // New users need to accept GDPR first
        createdAt: new Date(),
        updatedAt: new Date(),
        // Admin gets active status immediately
        ...(isAdmin && {
          adminInfo: {
            permissions: ['manage_users', 'manage_verifications', 'manage_content'],
            lastLogin: new Date(),
          }
        }),
      };

      try {
        console.log('💾 [PROFILE] Saving new user profile to Firestore...');
        await setDoc(userRef, profile);
        console.log('✅ [PROFILE] New user profile created successfully with status:', profile.accountStatus);
        return profile;
      } catch (error) {
        console.error('❌ [PROFILE] Failed to create user profile:', error);
        throw error;
      }
    } else {
      console.log('🔄 [PROFILE] Existing user detected, updating last login...');
      const rawProfile = userSnap.data();
      const existingProfile = convertTimestampsToDates(rawProfile) as UserProfile;

      // Check if user is admin (for migration purposes)
      const adminEmails = process.env.NEXT_PUBLIC_ADMIN_EMAILS?.split(',') || [];
      const isAdmin = adminEmails.includes(firebaseUser.email!);

      // Migration: Set accountStatus to 'active' for existing users without it, or for admins
      if (!existingProfile.accountStatus || (isAdmin && existingProfile.accountStatus !== 'active')) {
        console.log('🔧 [MIGRATION] Setting accountStatus to active for existing user', { isAdmin });
        try {
          const updates: any = { 
            accountStatus: 'active',
            updatedAt: new Date() 
          };
          
          // Ensure admin role and adminInfo are set for admin users
          if (isAdmin && existingProfile.role !== 'admin') {
            console.log('👑 [MIGRATION] Upgrading user to admin role');
            updates.role = 'admin';
            updates.adminInfo = {
              permissions: ['manage_users', 'manage_verifications', 'manage_content'],
              lastLogin: new Date(),
            };
            existingProfile.role = 'admin';
            existingProfile.adminInfo = updates.adminInfo;
          }
          
          await updateDoc(userRef, updates);
          existingProfile.accountStatus = 'active';
          existingProfile.updatedAt = new Date();
          console.log('✅ [MIGRATION] accountStatus set to active');
        } catch (error) {
          console.error('❌ [MIGRATION] Failed to update accountStatus:', error);
          // Continue with existing profile even if migration fails
        }
      } else {
        // Normal update for users with accountStatus
        try {
          console.log('💾 [PROFILE] Updating user profile timestamp...');
          await updateDoc(userRef, { updatedAt: new Date() });
          existingProfile.updatedAt = new Date();
          console.log('✅ [PROFILE] User profile updated successfully');
        } catch (error) {
          console.error('❌ [PROFILE] Failed to update user profile:', error);
          throw error;
        }
      }
      
      return existingProfile;
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
      const rawProfile = userSnap.data();
      const profile = convertTimestampsToDates(rawProfile) as UserProfile;
      setUserProfile(profile);
      console.log('✅ [PROFILE] User profile refreshed successfully');
    } else {
      console.warn('⚠️ [PROFILE] No profile found in Firestore for user:', user.uid);
    }
  };

  const acceptGDPR = async () => {
    if (!user) {
      console.warn('⚠️ [AUTH] Cannot accept GDPR: No user logged in');
      return;
    }

    console.log('📋 [GDPR] User accepting GDPR consent...');

    const userRef = doc(db, 'users', user.uid);

    try {
      await updateDoc(userRef, {
        accountStatus: 'pending_role', // Move to role selection step
        gdprConsent: {
          accepted: true,
          acceptedAt: new Date(),
          version: '1.0',
        },
        updatedAt: new Date(),
      });

      if (userProfile) {
        setUserProfile({
          ...userProfile,
          accountStatus: 'pending_role',
          gdprConsent: {
            accepted: true,
            acceptedAt: new Date(),
            version: '1.0',
          },
        });
      }

      console.log('✅ [GDPR] GDPR consent accepted, moving to role selection');
    } catch (error) {
      console.error('❌ [GDPR] Failed to accept GDPR:', error);
      throw error;
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
        console.log('🔐 [AUTH] Firebase user set:', {
          uid: firebaseUser.uid,
          email: firebaseUser.email,
          displayName: firebaseUser.displayName
        });

        // Load or create user profile from Firestore
        try {
          console.log('👤 [PROFILE] Loading/creating user profile...');
          const profile = await createUserProfile(firebaseUser);
          setUserProfile(profile);
          console.log('✅ [AUTH] User authentication and profile setup complete', {
            profileRole: profile.role,
            profileStatus: profile.accountStatus,
            profileEmail: profile.email
          });
        } catch (error: unknown) {
          console.error('❌ [AUTH] Error loading user profile:', error);
          // If profile creation fails, sign out the user to avoid inconsistent state
          console.log('🚨 [AUTH] Signing out user due to profile creation failure');
          try {
            await firebaseSignOut(auth);
            setUser(null);
            setUserProfile(null);
          } catch (signOutError) {
            console.error('❌ [AUTH] Failed to sign out after profile error:', signOutError);
          }
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

  const deleteAccount = async () => {
    if (!user) {
      console.warn('⚠️ [AUTH] Cannot delete account: No user logged in');
      throw new Error('No user logged in');
    }

    console.log('🗑️ [DELETE] Starting account deletion process...', {
      uid: user.uid,
      role: userProfile?.role,
    });

    try {
      // 1. Delete user-owned data (but NOT doctor pages, clinic pages, or reviews)
      const collections = [
        'support_tickets',
        'treatment_plans',
      ];

      for (const collectionName of collections) {
        console.log(`🗑️ [DELETE] Deleting ${collectionName}...`);
        const q = query(
          collection(db, collectionName),
          where('userId', '==', user.uid)
        );
        const snapshot = await getDocs(q);
        
        const deletePromises = snapshot.docs.map(doc => deleteDoc(doc.ref));
        await Promise.all(deletePromises);
        console.log(`✅ [DELETE] Deleted ${snapshot.docs.length} ${collectionName}`);
      }

      // 2. Delete verification requests if doctor
      if (userProfile?.role === 'doctor' && userProfile.doctorInfo?.verificationRequestId) {
        console.log('🗑️ [DELETE] Deleting verification request...');
        const verificationRef = doc(db, 'verification_requests', userProfile.doctorInfo.verificationRequestId);
        await deleteDoc(verificationRef);
        console.log('✅ [DELETE] Verification request deleted');
      }

      // 3. Delete user profile from Firestore
      console.log('🗑️ [DELETE] Deleting user profile from Firestore...');
      const userRef = doc(db, 'users', user.uid);
      await deleteDoc(userRef);
      console.log('✅ [DELETE] User profile deleted');

      // 4. Delete Firebase Auth account
      console.log('🗑️ [DELETE] Deleting Firebase Authentication account...');
      await deleteUser(user);
      console.log('✅ [DELETE] Firebase Auth account deleted');

      // 5. Clear local state
      setUser(null);
      setUserProfile(null);

      console.log('✅ [DELETE] Account deletion complete');
    } catch (error: any) {
      console.error('❌ [DELETE] Error deleting account:', error);
      
      // Handle re-authentication requirement
      if (error.code === 'auth/requires-recent-login') {
        throw new Error('For security, please log out and log back in before deleting your account.');
      }
      
      throw error;
    }
  };

  const value = {
    user,
    userProfile,
    loading,
    signInWithGoogle,
    logout,
    updateUserRole,
    refreshUserProfile,
    acceptGDPR,
    deleteAccount,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};