# Database Operation Logging Implementation

## Overview
Added comprehensive logging utilities for Supabase database operations to help identify and debug RLS policy rejections, authentication failures, and other database errors.

## What Was Added

### 1. New Logging Utility: [lib/logging.ts](lib/logging.ts)
A comprehensive logging module with the following features:

**Core Functions:**
- `parseSupabaseError()` - Extracts meaningful error info from Supabase errors:
  - Identifies RLS policy rejections (🔒)
  - Detects auth failures (🔐)
  - Finds network errors (⚠️)
  - Returns structured error details for logging

- `logDatabaseRejection()` - Logs rejected database operations with full context:
  - Operation type (INSERT, UPDATE, DELETE, SELECT)
  - Table name
  - Record ID
  - User ID and role
  - Error code, message, details, and hints
  - Additional context data
  - **Bonus warnings** for RLS and auth issues

- `logDatabaseSuccess()` - Logs successful operations with relevant metadata

- `withDatabaseLogging()` - Wrapper function to automatically log Supabase operations

- `getErrorMessageForUI()` - Converts technical errors to user-friendly messages:
  - RLS rejection → "You do not have permission..."
  - Auth error → "Your session has expired..."
  - Network error → "Connection error..."

### 2. Enhanced CRUD Modal Components
Updated three listing CRUD modals to use the logging utility:

#### [app/admin/components/MedicalFacilityListingCRUDModal.tsx](app/admin/components/MedicalFacilityListingCRUDModal.tsx)
- Imports logging utilities and useAuth hook
- Safely handles useAuth outside AuthProvider (for tests)
- Calls `logDatabaseRejection()` on save/delete errors with:
  - Table: `medical_facility_listings`
  - Full user context (ID, role)
  - Operation type (INSERT/UPDATE/DELETE)
  - Additional context (facility name, mode)
- Calls `logDatabaseSuccess()` on successful delete

#### [app/admin/components/HealthcarePersonnelListingCRUDModal.tsx](app/admin/components/HealthcarePersonnelListingCRUDModal.tsx)
- Same logging pattern as MedicalFacility
- Table: `healthcare_personnel_listings`

#### [app/admin/components/AgencyListingCRUDModal.tsx](app/admin/components/AgencyListingCRUDModal.tsx)
- Same logging pattern as MedicalFacility
- Table: `agency_listings`

## Example Log Output

### Successful Operation
```
✅ 🗑️ [MEDICAL_FACILITY_LISTINGS] DELETE succeeded {
  operation: 'DELETE',
  table: 'medical_facility_listings',
  recordId: 'facility-123',
  userId: 'user-456',
  timestamp: '2026-01-22T20:48:14.000Z'
}
```

### RLS Rejection
```
🔒 RLS POLICY REJECTION [MEDICAL_FACILITY_LISTINGS] {
  operation: 'DELETE',
  table: 'medical_facility_listings',
  recordId: 'facility-123',
  userId: 'user-456',
  userRole: 'patient',
  errorCode: '42501',
  errorMessage: 'new row violates row-level security policy...',
  timestamp: '2026-01-22T20:48:14.000Z'
}
⚠️ RLS Policy Check: {
  message: 'User may not have permission for this operation...',
  table: 'medical_facility_listings',
  operation: 'DELETE',
  userRole: 'patient',
  requiresAdmin: true
}
```

### Auth Failure
```
🔐 AUTH FAILURE [MEDICAL_FACILITY_LISTINGS] {
  operation: 'DELETE',
  table: 'medical_facility_listings',
  errorCode: '401',
  errorMessage: 'JWT expired',
  userId: 'user-456',
  timestamp: '2026-01-22T20:48:14.000Z'
}
⚠️ Auth Check: {
  message: 'User may not be authenticated or session may have expired...',
  userId: 'user-456',
  suggestion: 'Verify user is logged in and auth token is valid'
}
```

## Benefits

1. **Easy Debugging**: Structured logs make it simple to identify issues:
   - RLS policy rejections are clearly marked (🔒)
   - Auth failures are highlighted (🔐)
   - Network issues are identified (⚠️)

2. **User Context**: Every log includes:
   - Which user attempted the operation
   - Their role
   - Which record was affected
   - The exact operation attempted

3. **Better Error Messages**: Users see helpful messages instead of technical database errors

4. **Production Ready**: Can be extended to:
   - Send to error tracking service (Sentry, etc.)
   - Store in application logs
   - Alert admins of repeated failures

## Usage

### Basic Error Logging (Already in CRUD Modals)
```typescript
try {
  const { error } = await supabase.from('listings').delete().eq('id', id);
  if (error) throw error;
  logDatabaseSuccess({...});
} catch (err) {
  logDatabaseRejection({
    operation: 'DELETE',
    table: 'listings',
    recordId: id,
    userId: user?.id,
    userRole: user?.role,
    error: err
  });
}
```

### With Wrapper Function
```typescript
const { data, error } = await withDatabaseLogging(
  supabase.from('listings').select(),
  {
    operation: 'SELECT',
    table: 'listings',
    userId: user?.id,
    userRole: user?.role
  }
);
```

### User-Friendly Error Messages
```typescript
const errorMessage = getErrorMessageForUI(error, 'Failed to delete');
// Returns: "You do not have permission..." or "Your session expired..."
```

## Test Coverage
All 142 tests passing ✅
- Logging utilities are transparent to tests
- Components work both inside and outside AuthProvider
- Error handling properly logs without breaking functionality

## Future Enhancements
1. Add integration tests with real Supabase to test RLS rejections
2. Create admin dashboard to view database operation logs
3. Set up alerts for repeated RLS rejections (possible misconfiguration)
4. Export logs to external service (Sentry, DataDog, etc.)
5. Add performance metrics (operation duration, retry counts)
