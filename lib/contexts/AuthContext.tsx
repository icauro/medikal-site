"use client";

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { Session, User } from '@supabase/supabase-js';
import { supabase, convertTimestampsToDates, signInWithGoogle, signOut as supabaseSignOut } from '@/lib/supabase';
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
      // Check if user profile exists
      console.log('🔍 [PROFILE] Checking if user profile exists in database...');
      const { data: existingProfile, error: fetchError } = await supabase
        .from('users')
        .select('*')
        .eq('id', supabaseUser.id)
        .single();

      console.log('🔍 [PROFILE] Database query result:', {
        hasData: !!existingProfile,
        error: fetchError,
        errorCode: fetchError?.code,
        errorMessage: fetchError?.message
      });

      if (fetchError && fetchError.code !== 'PGRST116') {
        throw fetchError; // PGRST116 means no rows found, which is expected for new users
      }

      if (!existingProfile) {
        console.log('🆕 [PROFILE] New user detected, creating profile with pending_gdpr status...');

        // Check admin email list
        const adminEmails = process.env.NEXT_PUBLIC_ADMIN_EMAILS?.split(',') || [];
        const isAdmin = adminEmails.includes(supabaseUser.email!);

        console.log('👑 [PROFILE] Admin check:', {
          email: supabaseUser.email,
          adminEmails: adminEmails,
          isAdmin: isAdmin,
        });

        const profile: UserProfile = {
          id: supabaseUser.id,
          email: supabaseUser.email!,
          displayName: supabaseUser.user_metadata?.display_name || supabaseUser.email!.split('@')[0],
          photoURL: supabaseUser.user_metadata?.avatar_url || undefined,
          role: isAdmin ? 'admin' : null,
          accountStatus: isAdmin ? 'active' : 'pending_gdpr',
          createdAt: new Date(),
          updatedAt: new Date(),
          ...(isAdmin && {
            adminAccountData: {
              permissions: ['manage_users', 'manage_content'],
              lastLogin: new Date(),
            }
          }),
        };

        try {
          console.log('💾 [PROFILE] Saving new user profile to Supabase...');
          console.log('📝 [PROFILE] User data to insert:', {
            id: supabaseUser.id,
            email: supabaseUser.email,
            displayName: profile.displayName,
            accountStatus: profile.accountStatus,
          });

          console.log('🔧 [PROFILE] Executing INSERT query...');

          const { error: insertError, data } = await supabase
            .from('users')
            .insert([{
              id: supabaseUser.id,
              email: supabaseUser.email,
              display_name: profile.displayName,
              photo_url: profile.photoURL,
              role: profile.role,
              account_status: profile.accountStatus,
              created_at: profile.createdAt.toISOString(),
              updated_at: profile.updatedAt.toISOString(),
              gdpr_consent: profile.gdprConsent || null,
              admin_account_data: profile.adminAccountData || null,
            }]);

          console.log('🔧 [PROFILE] INSERT result:', {
            error: insertError,
            hasData: !!data,
            dataLength: Array.isArray(data) ? data.length : 'not array'
          });

          if (insertError) {
            // Handle duplicate key error - profile might have been created by another auth state change
            if (insertError.code === '23505') {
              console.log('⚠️ [PROFILE] Duplicate key error, profile might already exist. Retrying SELECT...');

              // Retry SELECT to get existing profile
              const { data: retryData, error: retryError } = await supabase
                .from('users')
                .select('*')
                .eq('id', supabaseUser.id)
                .single();

              if (!retryError && retryData) {
                console.log('✅ [PROFILE] Found existing profile after duplicate key error');
                return convertTimestampsToDates(retryData) as UserProfile;
              }
            }

            console.error('🔴 [PROFILE] Insert error details:', {
              fullError: JSON.stringify(insertError),
              message: insertError?.message || 'No message',
              code: insertError?.code || 'No code',
              hint: insertError?.hint || 'No hint',
              details: insertError?.details || 'No details',
              status: (insertError as any)?.status || 'No status',
            });
            throw insertError;
          }
          console.log('✅ [PROFILE] New user profile created successfully with status:', profile.accountStatus);
          console.log('📊 [PROFILE] Insert response:', data);
          return profile;
        } catch (error) {
          console.error('❌ [PROFILE] Failed to create user profile:', error);
          if (error instanceof Error) {
            console.error('   Error message:', error.message);
            console.error('   Stack:', error.stack);
          } else {
            console.error('   Full error object:', JSON.stringify(error));
          }
          throw error;
        }
      } else {
        console.log('🔄 [PROFILE] Existing user detected, updating last login...');
        const rawProfile = existingProfile;
        const existingUserProfile = convertTimestampsToDates(rawProfile) as UserProfile;

        // Check if user is admin (for migration purposes)
        const adminEmails = process.env.NEXT_PUBLIC_ADMIN_EMAILS?.split(',') || [];
        const isAdmin = adminEmails.includes(supabaseUser.email!);

        if (!existingUserProfile.accountStatus || (isAdmin && existingUserProfile.accountStatus !== 'active')) {
          console.log('🔧 [MIGRATION] Setting accountStatus to active for existing user', { isAdmin });
          try {
            const updates: any = {
              account_status: 'active',
              updated_at: new Date().toISOString()
            };

            if (isAdmin && existingUserProfile.role !== 'admin') {
              console.log('👑 [MIGRATION] Upgrading user to admin role');
              updates.role = 'admin';
              updates.admin_account_data = {
                permissions: ['manage_users', 'manage_content'],
                lastLogin: new Date().toISOString(),
              };
              existingUserProfile.role = 'admin';
              existingUserProfile.adminAccountData = updates.admin_account_data;
            }

            const { error: updateError } = await supabase
              .from('users')
              .update(updates)
              .eq('id', supabaseUser.id);

            if (updateError) throw updateError;
            existingUserProfile.accountStatus = 'active';
            existingUserProfile.updatedAt = new Date();
            console.log('✅ [MIGRATION] accountStatus set to active');
          } catch (error) {
            console.error('❌ [MIGRATION] Failed to update accountStatus:', error);
          }
        } else {
          try {
            console.log('💾 [PROFILE] Updating user profile timestamp...');
            const { error: updateError } = await supabase
              .from('users')
              .update({ updated_at: new Date().toISOString() })
              .eq('id', supabaseUser.id);

            if (updateError) throw updateError;
            existingUserProfile.updatedAt = new Date();
            console.log('✅ [PROFILE] User profile updated successfully');
          } catch (error) {
            console.error('❌ [PROFILE] Failed to update user profile:', error);
            throw error;
          }
        }

        return existingUserProfile;
      }
    } catch (error) {
      console.error('❌ [PROFILE] Unexpected error in createUserProfile:', error);
      throw error;
    }
  };

  const handleSignInWithGoogle = async () => {
    console.log('🔐 [AUTH] Starting Google sign-in process...');

    try {
      console.log('🔐 [AUTH] Opening Google OAuth popup...');
      await signInWithGoogle();
      console.log('✅ [AUTH] Google OAuth successful');
    } catch (error: unknown) {
      console.error('❌ [AUTH] Google sign in error:', error);
      throw error;
    }
  };

  const handleLogout = async () => {
    console.log('🔐 [AUTH] Starting logout process...');

    try {
      console.log('🔐 [AUTH] Signing out from Supabase...');
      await supabaseSignOut();
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
      id: user.id,
      currentRole: userProfile?.role,
      newRole: role
    });

    try {
      const { error } = await supabase
        .from('users')
        .update({
          role,
          updated_at: new Date().toISOString()
        })
        .eq('id', user.id);

      if (error) throw error;

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

    console.log('🔄 [PROFILE] Refreshing user profile from Supabase...');

    try {
      const { data: profileData, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', user.id)
        .single();

      if (error) throw error;

      if (profileData) {
        const profile = convertTimestampsToDates(profileData) as UserProfile;
        setUserProfile(profile);
        console.log('✅ [PROFILE] User profile refreshed successfully');
      } else {
        console.warn('⚠️ [PROFILE] No profile found in Supabase for user:', user.id);
      }
    } catch (error) {
      console.error('❌ [PROFILE] Failed to refresh profile:', error);
      throw error;
    }
  };

  const acceptGDPR = async () => {
    if (!user) {
      console.warn('⚠️ [AUTH] Cannot accept GDPR: No user logged in');
      return;
    }

    console.log('📋 [GDPR] User accepting GDPR consent...');

    try {
      const { error } = await supabase
        .from('users')
        .update({
          account_status: 'pending_role',
          gdpr_consent: {
            accepted: true,
            acceptedAt: new Date().toISOString(),
            version: '1.0',
          },
          updated_at: new Date().toISOString(),
        })
        .eq('id', user.id);

      if (error) throw error;

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

      // Refresh user profile to ensure SignupFlowManager gets updated data
      await refreshUserProfile();

      console.log('✅ [GDPR] GDPR consent accepted, SignupFlowManager will handle navigation');
    } catch (error) {
      console.error('❌ [GDPR] Failed to accept GDPR:', error);
      throw error;
    }
  };

  useEffect(() => {
    console.log('👂 [AUTH] Setting up Supabase auth state listener...');

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('🔐 [AUTH] Auth state change detected:', {
        event,
        hasSession: !!session,
        hasUser: !!(session?.user),
        userId: session?.user?.id,
        userEmail: session?.user?.email
      });

      if (session && session.user) {
        const supabaseUser = session.user;
        console.log('🔐 [AUTH] Auth state changed: User signed in', {
          uid: supabaseUser.id,
          email: supabaseUser.email,
          displayName: supabaseUser.user_metadata?.display_name,
          emailVerified: supabaseUser.email_confirmed_at
        });

        setUser(supabaseUser);
        console.log('🔐 [AUTH] Supabase user set:', {
          uid: supabaseUser.id,
          email: supabaseUser.email,
          displayName: supabaseUser.user_metadata?.display_name
        });

        // Load or create user profile from Supabase
        try {
          console.log('👤 [PROFILE] Loading/creating user profile...');
          const profile = await createUserProfile(supabaseUser);
          setUserProfile(profile);

          // Prevent flash: If active user is on role selection page, redirect immediately
          if (profile.accountStatus === 'active' && typeof window !== 'undefined' && window.location.pathname === '/signup/role-selection') {
            console.log('🔄 [AUTH] Active user on role selection page, redirecting to profile to prevent flash');
            window.location.href = '/profile';
            return;
          }

          console.log('✅ [AUTH] User authentication and profile setup complete', {
            profileRole: profile.role,
            profileStatus: profile.accountStatus,
            profileEmail: profile.email
          });
        } catch (error: unknown) {
          console.error('❌ [AUTH] Error loading user profile:', error);
          console.log('🚨 [AUTH] Profile creation/loading failed, signing out user');

          // Clear local state first to prevent loading state issues
          setUser(null);
          setUserProfile(null);
          setLoading(false);

          try {
            await supabaseSignOut();
            console.log('✅ [AUTH] Successfully signed out after profile error');
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
      // 1. Delete user-owned data (but NOT listings or reviews)
      const collections = ['support_tickets', 'treatment_plans'];

      for (const tableName of collections) {
        console.log(`🗑️ [DELETE] Deleting ${tableName}...`);
        const { data, error: deleteError } = await supabase
          .from(tableName)
          .delete()
          .eq('user_id', user.id);

        if (deleteError) throw deleteError;
        console.log(`✅ [DELETE] Deleted ${tableName}`);
      }

      // 2. Mark user's comments as deleted (temporary solution until is_deleted column is added)
      console.log('🗑️ [DELETE] Marking user comments as deleted...');
      const { error: commentError } = await supabase
        .from('comments')
        .update({
          content: '[This comment was deleted by the user]',
          updated_at: new Date().toISOString()
        })
        .eq('user_id', user.id);

      if (commentError) {
        console.warn('⚠️ [DELETE] Failed to update comments, continuing with deletion:', commentError);
        // Don't throw error for comments, continue with deletion
      } else {
        console.log('✅ [DELETE] Marked user comments as deleted');
      }

      // 3. Delete user profile from Supabase
      console.log('🗑️ [DELETE] Deleting user profile from Supabase...');
      const { error: profileError } = await supabase
        .from('users')
        .delete()
        .eq('id', user.id);

      if (profileError) throw profileError;
      console.log('✅ [DELETE] User profile deleted');

      // 4. Supabase Auth account will be automatically deleted when user profile is deleted
      // Note: admin.deleteUser() requires service role key, which we don't have in client-side
      console.log('ℹ️ [DELETE] Supabase Auth account will be auto-deleted when profile is removed');

      // 5. Sign out locally (this will clear the session)
      console.log('🗑️ [DELETE] Signing out locally...');
      await supabaseSignOut();

      // 6. Clear local state
      setUser(null);
      setUserProfile(null);

      console.log('✅ [DELETE] Account deletion complete');
    } catch (error: any) {
      console.error('❌ [DELETE] Error deleting account:', error);
      throw error;
    }
  };

  const value = {
    user,
    userProfile,
    loading,
    signInWithGoogle: handleSignInWithGoogle,
    logout: handleLogout,
    updateUserRole,
    refreshUserProfile,
    acceptGDPR,
    deleteAccount,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};