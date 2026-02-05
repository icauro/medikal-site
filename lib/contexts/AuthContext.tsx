"use client";

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { User } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';
import { convertDatabaseRow, convertToSnakeCase } from '@/lib/supabase';
import { UserProfile, UserRole, AccountStatus, USER_ROLES } from '@/lib/types';

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

// Helper function to convert database row to UserProfile type
const formatUserProfile = (data: any): UserProfile => {
  return convertDatabaseRow(data) as UserProfile;
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

  // Create or update user profile in Supabase
  const createUserProfile = async (supabaseUser: User) => {
    console.log('👤 [PROFILE] Creating/loading user profile...', {
      uid: supabaseUser.id,
      email: supabaseUser.email
    });

    try {
      // Check if user profile already exists
      const { data: existingProfile, error: fetchError } = await supabase
        .from('users')
        .select('*')
        .eq('id', supabaseUser.id)
        .single();

      // PGRST116 = "not found" which is expected for new users
      if (existingProfile && !fetchError) {
        console.log('🔄 [PROFILE] Existing user detected, loading profile...');
        return formatUserProfile(existingProfile);
      }

      // If error is not "not found", it's a real database error
      if (fetchError && fetchError.code !== 'PGRST116') {
        console.error('❌ [PROFILE] Database error while checking existing profile:', {
          code: fetchError.code,
          message: fetchError.message,
          details: fetchError.details
        });
        throw fetchError;
      }

      // New user - create profile with pending_gdpr status
      console.log('🆕 [PROFILE] New user detected, creating profile with pending_gdpr status...');

      // Check admin email list
      const adminEmails = process.env.NEXT_PUBLIC_ADMIN_EMAILS?.split(',').map(e => e.trim()) || [];
      const isAdmin = adminEmails.includes(supabaseUser.email!);

      console.log('👑 [PROFILE] Admin check:', {
        email: supabaseUser.email,
        isAdmin: isAdmin,
      });

      const newProfile = {
        id: supabaseUser.id,
        email: supabaseUser.email!,
        display_name: supabaseUser.user_metadata?.name || supabaseUser.email!.split('@')[0],
        photo_url: supabaseUser.user_metadata?.avatar_url || null,
        role: isAdmin ? 'admin' : null,
        account_status: isAdmin ? 'active' : 'pending_gdpr',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      console.log('💾 [PROFILE] Preparing to insert user profile:', {
        profile: newProfile,
        convertedProfile: convertToSnakeCase(newProfile)
      });

      const { data: createdProfile, error: insertError } = await supabase
        .from('users')
        .insert([convertToSnakeCase(newProfile)])
        .select()
        .single();

      if (insertError) {
        console.error('❌ [PROFILE] Failed to create user profile:', {
          message: insertError.message,
          code: insertError.code,
          details: insertError.details,
          hint: insertError.hint,
          fullError: insertError
        });
        throw insertError;
      }

      console.log('✅ [PROFILE] New user profile created successfully');
      return formatUserProfile(createdProfile);
    } catch (error) {
      console.error('❌ [PROFILE] Error in createUserProfile:', error);
      throw error;
    }
  };

  const signInWithGoogle = async () => {
    console.log('🔐 [AUTH] Starting Google sign-in process...');

    try {
      console.log('🔐 [AUTH] Initiating Google OAuth...');
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
        },
      });

      if (error) {
        console.error('❌ [AUTH] Google OAuth error:', error);
        throw error;
      }

      console.log('✅ [AUTH] Google OAuth initiated, redirecting to sign-in...');
    } catch (error: unknown) {
      console.error('❌ [AUTH] Google sign in error:', error);
      throw error;
    }
  };

  const logout = async () => {
    console.log('🔐 [AUTH] Starting logout process...');

    try {
      console.log('🔐 [AUTH] Signing out from Supabase...');
      const { error } = await supabase.auth.signOut();
      if (error) throw error;

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
      uid: user.id,
      currentRole: userProfile?.role,
      newRole: role
    });

    try {
      // Create role-specific user data based on the selected role
      let roleUserData = {};
      let userDataIdField = '';

      switch (role) {
        case 'patient': {
          userDataIdField = 'patient_user_data_id';
          const { data: patientUserData, error: patientError } = await supabase
            .from('patient_user_data')
            .insert([{ user_id: user.id, preferred_language: 'en' }])
            .select()
            .single();
          if (patientError) throw patientError;
          roleUserData = { patient_user_data_id: patientUserData.id };
          console.log('✅ [PROFILE] Patient user data created:', patientUserData.id);
          break;
        }
        case 'healthcare_personnel': {
          userDataIdField = 'healthcare_personnel_user_data_id';
          const { data: personnelUserData, error: personnelError } = await supabase
            .from('healthcare_personnel_user_data')
            .insert([{ 
              user_id: user.id,
              personnel_type: 'Doctor',
              specialization: 'Dermatology',
              phone_number: '',
              country: '',
              province: ''
            }])
            .select()
            .single();
          if (personnelError) throw personnelError;
          roleUserData = { healthcare_personnel_user_data_id: personnelUserData.id };
          console.log('✅ [PROFILE] Healthcare personnel user data created:', personnelUserData.id);
          break;
        }
        case 'medical_facility': {
          userDataIdField = 'medical_facility_user_data_id';
          const { data: facilityUserData, error: facilityError } = await supabase
            .from('medical_facility_user_data')
            .insert([{
              user_id: user.id,
              name: '',
              facility_type: 'Clinic',
              phone: '',
              email: user.email || '',
              country: '',
              province: '',
              contact_person: ''
            }])
            .select()
            .single();
          if (facilityError) throw facilityError;
          roleUserData = { medical_facility_user_data_id: facilityUserData.id };
          console.log('✅ [PROFILE] Medical facility user data created:', facilityUserData.id);
          break;
        }
        case 'admin': {
          console.log('✅ [PROFILE] Admin role assigned (no user data table needed)');
          break;
        }
      }

      // Update user with new role, user data reference, and status
      const { data, error } = await supabase
        .from('users')
        .update(
          convertToSnakeCase({
            role,
            accountStatus: 'pending_personal_data',
            updatedAt: new Date().toISOString(),
            ...roleUserData,
          })
        )
        .eq('id', user.id)
        .select()
        .single();

      if (error) throw error;

      if (userProfile) {
        setUserProfile(formatUserProfile(data));
        console.log('✅ [PROFILE] User role updated successfully with profile reference');
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

    console.log('🔄 [PROFILE] Refreshing user profile from Supabase...');

    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', user.id)
        .single();

      if (error) {
        console.warn('⚠️ [PROFILE] Error fetching profile:', error);
        return;
      }

      if (data) {
        setUserProfile(formatUserProfile(data));
        console.log('✅ [PROFILE] User profile refreshed successfully');
      }
    } catch (error) {
      console.error('❌ [PROFILE] Error refreshing profile:', error);
    }
  };

  const acceptGDPR = async () => {
    if (!user) {
      console.warn('⚠️ [AUTH] Cannot accept GDPR: No user logged in');
      return;
    }

    console.log('📋 [GDPR] User accepting GDPR consent...');

    try {
      const { data, error } = await supabase
        .from('users')
        .update(
          convertToSnakeCase({
            accountStatus: 'pending_role',
            gdprConsent: true,
            updatedAt: new Date().toISOString(),
          })
        )
        .eq('id', user.id)
        .select()
        .single();

      if (error) throw error;

      if (userProfile) {
        setUserProfile(formatUserProfile(data));
      }

      console.log('✅ [GDPR] GDPR consent accepted, moving to role selection');
    } catch (error) {
      console.error('❌ [GDPR] Failed to accept GDPR:', error);
      throw error;
    }
  };

  useEffect(() => {
    console.log('👂 [AUTH] Setting up Supabase auth state listener...');

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      const supabaseUser = session?.user;

      if (supabaseUser) {
        console.log('🔐 [AUTH] Auth state changed: User signed in', {
          uid: supabaseUser.id,
          email: supabaseUser.email,
          provider: supabaseUser.app_metadata?.provider,
        });

        setUser(supabaseUser);

        // Load or create user profile from Supabase
        try {
          console.log('👤 [PROFILE] Loading/creating user profile...');
          const profile = await createUserProfile(supabaseUser);
          setUserProfile(profile);
          console.log('✅ [AUTH] User authentication and profile setup complete', {
            profileRole: profile.role,
            profileStatus: profile.accountStatus,
            profileEmail: profile.email
          });
        } catch (error: unknown) {
          console.error('❌ [AUTH] Error loading user profile:', error);
          // Sign out the user to avoid inconsistent state
          console.log('🚨 [AUTH] Signing out user due to profile creation failure');
          try {
            await supabase.auth.signOut();
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
      subscription?.unsubscribe();
    };
  }, []);

  const deleteAccount = async () => {
    if (!user) {
      console.warn('⚠️ [AUTH] Cannot delete account: No user logged in');
      throw new Error('No user logged in');
    }

    console.log('🗑️ [DELETE] Starting account deletion process...', {
      uid: user.id,
      role: userProfile?.role,
    });

    try {
      // 1. Delete user-owned data from Supabase
      const tables = [
        'treatment_plans',
        'support_tickets',
      ];

      for (const tableName of tables) {
        console.log(`🗑️ [DELETE] Deleting from ${tableName}...`);
        const { error } = await supabase
          .from(tableName)
          .delete()
          .eq('user_id', user.id);

        if (error) {
          console.warn(`⚠️ [DELETE] Error deleting from ${tableName}:`, error);
          // Continue with other tables
        } else {
          console.log(`✅ [DELETE] Deleted records from ${tableName}`);
        }
      }

      // 2. Delete user profile from Supabase
      console.log('🗑️ [DELETE] Deleting user profile from Supabase...');
      const { error: profileError } = await supabase
        .from('users')
        .delete()
        .eq('id', user.id);

      if (profileError) {
        console.error('❌ [DELETE] Failed to delete profile:', profileError);
        throw profileError;
      }
      console.log('✅ [DELETE] User profile deleted');

      // 3. Delete Supabase Auth account via Edge Function
      // Note: supabase.auth.admin.deleteUser() only works server-side/Edge Functions
      // For now, just log a warning and proceed - admin must manually delete auth
      console.log('⚠️ [DELETE] Auth account deletion must be done server-side via Edge Function');
      console.log('⚠️ [DELETE] Consider calling an Edge Function endpoint to delete auth account');

      // 4. Clear local state
      setUser(null);
      setUserProfile(null);

      console.log('✅ [DELETE] Account deletion complete');
    } catch (error: unknown) {
      console.error('❌ [DELETE] Error deleting account:', error);
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