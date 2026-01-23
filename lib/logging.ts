/**
 * Database Operation Logging Utility
 * 
 * Provides structured logging for Supabase database operations,
 * especially useful for debugging RLS policy rejections and auth errors.
 */

interface DatabaseErrorContext {
  operation: 'INSERT' | 'UPDATE' | 'DELETE' | 'SELECT';
  table: string;
  userId?: string;
  userRole?: string;
  recordId?: string | number;
  error: any;
  additionalContext?: Record<string, any>;
}

interface DatabaseSuccessContext {
  operation: 'INSERT' | 'UPDATE' | 'DELETE' | 'SELECT';
  table: string;
  recordId?: string | number;
  recordCount?: number;
  userId?: string;
  message?: string;
}

/**
 * Extract meaningful error info from Supabase errors
 * 
 * Helps identify:
 * - RLS policy rejections (permission denied)
 * - Auth failures
 * - Network issues
 * - Validation errors
 */
export function parseSupabaseError(error: any): {
  code?: string;
  message: string;
  isRLSRejection: boolean;
  isAuthError: boolean;
  isNetworkError: boolean;
  details?: string;
  hint?: string;
} {
  if (!error) {
    return {
      message: 'Unknown error',
      isRLSRejection: false,
      isAuthError: false,
      isNetworkError: false,
    };
  }

  const message = error.message || String(error);
  const code = error.code || error.status;
  const details = error.details || '';
  const hint = error.hint || '';

  const isRLSRejection =
    message.includes('permission denied') ||
    message.includes('new row violates') ||
    code === '42501' || // PostgreSQL permission denied code
    details.includes('policy');

  const isAuthError =
    message.includes('JWT') ||
    message.includes('unauthorized') ||
    message.includes('invalid_grant') ||
    code === '401' ||
    code === 'PGRST301';

  const isNetworkError =
    message.includes('Network') ||
    message.includes('timeout') ||
    message.includes('Failed to fetch') ||
    code === 'NETWORK_ERROR';

  return {
    code: String(code),
    message,
    isRLSRejection,
    isAuthError,
    isNetworkError,
    details: details || undefined,
    hint: hint || undefined,
  };
}

/**
 * Log a rejected database operation (with full context)
 * 
 * This helps identify:
 * - Which operations are being rejected
 * - Why they're being rejected (RLS, auth, network)
 * - User context at time of rejection
 */
export function logDatabaseRejection(context: DatabaseErrorContext): void {
  const parsed = parseSupabaseError(context.error);

  const errorType = parsed.isRLSRejection
    ? '🔒 RLS POLICY REJECTION'
    : parsed.isAuthError
      ? '🔐 AUTH FAILURE'
      : parsed.isNetworkError
        ? '⚠️ NETWORK ERROR'
        : '🚫 DATABASE ERROR';

  console.error(`${errorType} [${context.table.toUpperCase()}]`, {
    operation: context.operation,
    table: context.table,
    recordId: context.recordId,
    userId: context.userId,
    userRole: context.userRole,
    errorCode: parsed.code,
    errorMessage: parsed.message,
    errorDetails: parsed.details,
    errorHint: parsed.hint,
    timestamp: new Date().toISOString(),
    ...context.additionalContext,
  });

  // For RLS rejections, add extra debugging info
  if (parsed.isRLSRejection) {
    console.warn(`⚠️ RLS Policy Check:`, {
      message:
        'User may not have permission for this operation. Check Supabase RLS policies.',
      table: context.table,
      operation: context.operation,
      userRole: context.userRole,
      requiresAdmin:
        context.userRole !== 'admin' &&
        ['DELETE', 'UPDATE', 'INSERT'].includes(context.operation),
    });
  }

  // For auth failures, suggest checking auth context
  if (parsed.isAuthError) {
    console.warn(`⚠️ Auth Check:`, {
      message:
        'User may not be authenticated or session may have expired. Check AuthContext.',
      userId: context.userId || 'NOT_SET',
      suggestion: 'Verify user is logged in and auth token is valid',
    });
  }
}

/**
 * Log a successful database operation
 */
export function logDatabaseSuccess(context: DatabaseSuccessContext): void {
  const emoji =
    context.operation === 'DELETE'
      ? '🗑️'
      : context.operation === 'INSERT'
        ? '➕'
        : context.operation === 'UPDATE'
          ? '✏️'
          : '📖';

  console.log(
    `✅ ${emoji} [${context.table.toUpperCase()}] ${context.operation} succeeded`,
    {
      operation: context.operation,
      table: context.table,
      recordId: context.recordId,
      recordCount: context.recordCount,
      userId: context.userId,
      message: context.message,
      timestamp: new Date().toISOString(),
    }
  );
}

/**
 * Wrap a Supabase operation with automatic error logging
 * 
 * Usage:
 * ```
 * const { data, error } = await withDatabaseLogging(
 *   supabase.from('listings').delete().eq('id', id),
 *   {
 *     operation: 'DELETE',
 *     table: 'listings',
 *     recordId: id,
 *     userId: currentUser?.id,
 *     userRole: currentUser?.role,
 *   }
 * );
 * ```
 */
export async function withDatabaseLogging<T>(
  operation: Promise<{ data: T; error: any }>,
  context: Omit<DatabaseErrorContext, 'error'>
): Promise<{ data: T; error: any }> {
  const result = await operation;

  if (result.error) {
    logDatabaseRejection({
      ...context,
      error: result.error,
    });
  } else {
    logDatabaseSuccess({
      operation: context.operation,
      table: context.table,
      recordId: context.recordId,
      userId: context.userId,
    });
  }

  return result;
}

/**
 * Create a standard error message for UI display
 * Shows user-friendly error messages while logging full details
 */
export function getErrorMessageForUI(error: any, defaultMessage: string): string {
  const parsed = parseSupabaseError(error);

  if (parsed.isRLSRejection) {
    return 'You do not have permission to perform this action. Contact an administrator.';
  }

  if (parsed.isAuthError) {
    return 'Your session has expired. Please log in again.';
  }

  if (parsed.isNetworkError) {
    return 'Network connection error. Please check your internet and try again.';
  }

  // Return specific error if available, otherwise default
  return parsed.message || defaultMessage;
}
