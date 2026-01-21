/*
 * DEPRECATED: Firebase Admin SDK
 * Migration: Converted to Supabase
 * This file is no longer used. Server-side database operations
 * should use lib/supabase.ts via API routes.
 * 
 * Timeline: 2026-01-21
 */

// Firebase Admin has been deprecated in favor of Supabase
const app: any = null;
const adminDbInstance: any = null;

// Stub implementation - all operations should use Supabase
export const getAdminDb = (): any => {
  throw new Error('Firebase Admin SDK is deprecated. Use Supabase client via API routes instead.');
};

// For backwards compatibility - throws error
export const adminDb: any = new Proxy({} as any, {
  get: (target, prop) => {
    throw new Error(`Firebase Admin method '${String(prop)}' is deprecated. Use Supabase instead.`);
  }
});

export default app;
