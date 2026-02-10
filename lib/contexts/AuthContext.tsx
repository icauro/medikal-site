"use client";

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { User } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';
import { convertDatabaseRow, convertToSnakeCase } from '@/lib/supabase';
import { UserProfile, UserRole, AccountStatus, USER_ROLES } from '@/lib/types';
import { createDebugger } from '@/lib/debugLogger';

const log = createDebugger('medikal:auth');

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
    log.debug('Creating/loading user profile', { uid: supabaseUser.id, email: supabaseUser.email });

    try {
      // Check if user profile already exists
      const { data: existingProfile, error: fetchError } = await supabase
        .from('users')
        .select('*')
        .eq('id', supabaseUser.id)
        .single();

      // PGRST116 = "not found" which is expected for new users
      if (existingProfile && !fetchError) {
        log.debug('Existing user detected, loading profile');
        return convertDatabaseRow(existingProfile) as UserProfile;
      }

      // If error is not "not found", it's a real database error
      if (fetchError && fetchError.code !== 'PGRST116') {
        log.error('Database error while checking existing profile', {
          code: fetchError.code,
          message: fetchError.message,
        });
        throw fetchError;
      }

      // New user - create profile with pending_gdpr status
      log.debug('New user detected, creating profile with pending_gdpr status');
      const adminEmails = process.env.NEXT_PUBLIC_ADMIN_EMAILS?.split(',').map(e => e.trim()) || [];
      const isAdmin = adminEmails.includes(supabaseUser.email!);

      log.debug('Admin check', { email: supabaseUser.email, isAdmin });

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

      const { data: createdProfile, error: insertError } = await supabase
        .from('users')
        .insert([convertToSnakeCase(newProfile)])
        .select()
        .single();

      if (insertError) {
        log.error('Failed to create user profile', { message: insertError.message });
        throw insertError;
      }

      log.info('New user profile created successfully');
      return convertDatabaseRow(createdProfile) as UserProfile;
    } catch (error) {
      log.error('Error in createUserProfile', error);
      throw error;
    }
  };

  const signInWithGoogle = async () => {
    log.debug('Starting Google sign-in process');
    try {
      setLoading(true);
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
        },
      });

      if (error) {
        log.error('Google OAuth error', error);
        throw error;
      }

      log.info('Google OAuth initiated, redirecting to sign-in');
    } catch (error: unknown) {
      setLoading(false);
      log.error('Google sign in error', error);
      throw error;
    }
  };

  const logout = async () => {
    log.debug('Starting logout process');
    try {
      setLoading(true);
      const { error } = await supabase.auth.signOut();
      if (error) throw error;

      setUser(null);
      setUserProfile(null);
      log.info('Successfully signed out');
    } catch (error) {
      setLoading(false);
      log.error('Logout error', error);
      throw error;
    }
  };

  const updateUserRole = async (role: UserRole) => {
    if (!user) {
      log.warn('Cannot update role: No user logged in');
      return;
    }

    log.debug('Updating user role', { uid: user.id, newRole: role });

    try {
      const { data, error } = await supabase
        .from('users')
        .update(
          convertToSnakeCase({
            role,
            accountStatus: 'pending_personal_data',
            updatedAt: new Date().toISOString(),
          })
        )
        .eq('id', user.id)
        .select()
        .single();

      if (error) throw error;

      if (data) {
        setUserProfile(convertDatabaseRow(data) as UserProfile);
        log.info('User role updated successfully');
      }
    } catch (error) {
      log.error('Failed to update user role', error);
      throw error;
    }
  };

  const refreshUserProfile = async () => {
    if (!user) {
      log.warn('Cannot refresh profile: No user logged in');
      return;
    }

    log.debug('Refreshing user profile from Supabase');

    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', user.id)
        .single();

      if (error) {
        log.warn('Error fetching profile', error);
        return;
      }

      if (data) {
        setUserProfile(convertDatabaseRow(data) as UserProfile);
        log.info('User profile refreshed successfully');
      }
    } catch (error) {
      log.error('Error refreshing profile', error);
    }
  };

  const acceptGDPR = async () => {
    if (!user) {
      log.warn('Cannot accept GDPR: No user logged in');
      return;
    }

    log.debug('User accepting GDPR consent');

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

      if (data) {
        setUserProfile(convertDatabaseRow(data) as UserProfile);
      }

      log.info('GDPR consent accepted, moving to role selection');
    } catch (error) {
      log.error('Failed to accept GDPR', error);
      throw error;
    }
  };

  useEffect(() => {
    log.debug('Setting up Supabase auth state listener');

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      const supabaseUser = session?.user;

      if (supabaseUser) {
        log.info('Auth state changed: User signed in', {
          uid: supabaseUser.id,
          email: supabaseUser.email,
          provider: supabaseUser.app_metadata?.provider,
        });
        setUser(supabaseUser);

        // Load or create user profile from Supabase
        try {
          log.debug('Loading/creating user profile');
          const profile = await createUserProfile(supabaseUser);
          setUserProfile(profile);
          log.info('User authentication and profile setup complete', {
            profileRole: profile.role,
            profileStatus: profile.accountStatus,
          });
        } catch (error: unknown) {
          log.error('Error loading user profile', error);
          // Sign out the user to avoid inconsistent state
          log.warn('Signing out user due to profile creation failure');
          try {
            await supabase.auth.signOut();
            setUser(null);
            setUserProfile(null);
          } catch (signOutError) {
            log.error('Failed to sign out after profile error', signOutError);
          }
        }
      } else {
        log.info('Auth state changed: User signed out');
        setUser(null);
        setUserProfile(null);
      }

      setLoading(false);
      log.debug('Auth state listener initialization complete');
    });

    return () => {
      log.debug('Cleaning up auth state listener');
      subscription?.unsubscribe();
    };
  }, []);

  const deleteAccount = async () => {
    if (!user) {
      log.warn('Cannot delete account: No user logged in');
      throw new Error('No user logged in');
    }

    log.debug('Starting account deletion process', { uid: user.id, role: userProfile?.role });

    try {
      // 1. Delete user-owned data from Supabase
      const tables = [
        'treatment_plans',
        'support_tickets',
      ];

      for (const tableName of tables) {
        log.debug(`Deleting from ${tableName}`);
        const { error } = await supabase
          .from(tableName)
          .delete()
          .eq('user_id', user.id);

        if (error) {
          log.warn(`Error deleting from ${tableName}`, error);
          // Continue with other tables
        } else {
          log.debug(`Deleted records from ${tableName}`);
        }
      }

      // 2. Delete user profile from Supabase
      log.debug('Deleting user profile from Supabase');
      const { error: profileError } = await supabase
        .from('users')
        .delete()
        .eq('id', user.id);

      if (profileError) {
        log.error('Failed to delete profile', profileError);
        throw profileError;
      }
      log.debug('User profile deleted');

      // 3. Delete Supabase Auth account via Edge Function
      // Note: supabase.auth.admin.deleteUser() only works server-side/Edge Functions
      log.warn('Auth account deletion must be done server-side via Edge Function');

      // 4. Clear local state
      setUser(null);
      setUserProfile(null);

      log.info('Account deletion complete');
    } catch (error: unknown) {
      log.error('Error deleting account', error);
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