import { createClient, SupabaseClient } from "@supabase/supabase-js";

// Initialize Supabase client - allow missing vars during build
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY;

// Create client with dummy values if env vars are missing (for build-time prerendering)
// At runtime, these MUST be defined or Supabase queries will fail
export const supabase: SupabaseClient = createClient(
  supabaseUrl || "https://placeholder.supabase.co",
  supabaseAnonKey || "placeholder_key",
  {
    auth: {
      // Persist session to localStorage for faster subsequent loads
      persistSession: true,
      // Auto-refresh tokens in background
      autoRefreshToken: true,
    },
  }
);

// Helper: Convert snake_case from database to camelCase for TypeScript types
const snakeToCamel = (str: string): string => {
  return str.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase());
};

// Helper: Convert database row to match TypeScript interfaces (snake_case → camelCase)
export const convertDatabaseRow = (data: any): any => {
  if (!data || typeof data !== 'object') return data;
  
  const converted: any = {};
  
  for (const [key, value] of Object.entries(data)) {
    const camelKey = snakeToCamel(key);
    
    // Convert ISO strings to Date objects for known date fields
    if (['createdAt', 'updatedAt', 'verifiedAt', 'acceptedAt', 'verifiedAt', 'statusChangedAt'].includes(camelKey) && typeof value === 'string') {
      converted[camelKey] = new Date(value);
    } else if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
      // Recursively convert nested objects
      converted[camelKey] = convertDatabaseRow(value);
    } else {
      converted[camelKey] = value;
    }
  }
  
  // Handle special JSONB fields that have nested dates
  if (converted.adminAccountData?.lastLogin && typeof converted.adminAccountData.lastLogin === 'string') {
    converted.adminAccountData.lastLogin = new Date(converted.adminAccountData.lastLogin);
  }
  if (converted.gdprConsent?.acceptedAt && typeof converted.gdprConsent.acceptedAt === 'string') {
    converted.gdprConsent.acceptedAt = new Date(converted.gdprConsent.acceptedAt);
  }
  
  return converted;
};

// Helper: Convert database timestamps to Date objects (legacy, now calls convertDatabaseRow)
export const convertTimestampsToDates = (data: any): any => {
  return convertDatabaseRow(data);
};

// Helper: Convert camelCase to snake_case for database operations
export const camelToSnake = (str: string): string => {
  return str.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);
};

// Helper: Convert object keys from camelCase to snake_case
export const convertToSnakeCase = (obj: any): any => {
  if (!obj || typeof obj !== 'object') return obj;
  if (Array.isArray(obj)) return obj.map(item => convertToSnakeCase(item));
  
  const converted: any = {};
  for (const [key, value] of Object.entries(obj)) {
    const snakeKey = camelToSnake(key);
    converted[snakeKey] = typeof value === 'object' && !Array.isArray(value) ? convertToSnakeCase(value) : value;
  }
  return converted;
};

// Helper: Get current user
export const getCurrentUser = async () => {
  const { data, error } = await supabase.auth.getUser();
  if (error) throw error;
  return data.user;
};

// Helper: Sign in with Google
export const signInWithGoogle = async () => {
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo: `${window.location.origin}/auth/callback`,
      queryParams: {
        prompt: "select_account",
      },
    },
  });
  if (error) throw error;
  return data;
};

// Helper: Sign out
export const signOut = async () => {
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
};

// Helper: Get session
export const getSession = async () => {
  const { data, error } = await supabase.auth.getSession();
  if (error) throw error;
  return data.session;
};
