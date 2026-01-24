# API Folder Documentation

## Overview
The `/app/api` folder contains backend API routes for the Medikal Site application. These are Next.js API routes that handle server-side operations.

**Location**: `app/api/`  
**Type**: Next.js 16 API Routes  
**Authentication**: Supabase-based  
**Database**: Supabase PostgreSQL

---

## API Routes Structure

### 1. **Debug API** (`/api/debug`)
**Purpose**: Development and troubleshooting utility  
**Status**: ✅ Active

**Endpoints**:
- `GET /api/debug` - Check system configuration
- `POST /api/debug` - Test request/response handling

**What it does**:
- Verifies Supabase configuration is loaded
- Checks admin emails environment variable
- Returns environment status without exposing sensitive keys
- Useful for debugging during development
- Confirms Supabase migration is active

**Response Example**:
```json
{
  "status": "success",
  "message": "Debug API working - Supabase migration active",
  "timestamp": "2026-01-24T...",
  "environment": {
    "adminEmails": ["admin@example.com"],
    "adminEmailsCount": 1,
    "hasSupabaseUrl": true,
    "hasSupabaseKey": true
  }
}
```

**Usage**: Development testing, configuration verification

---

### 2. **Listings API** (`/api/listings`)
**Purpose**: Fetch all public listings data  
**Status**: ✅ Active

**Endpoints**:
- `GET /api/listings` - Fetch all healthcare listings (personnel, facilities, agencies)

**What it does**:
- Fetches healthcare personnel listings
- Fetches medical facility listings
- Fetches agency listings
- Combines results from all three types
- Returns metadata (count, error status)
- Optimized with parallel queries

**Parameters**: None (returns all public listings)

**Response Example**:
```json
{
  "healthcare_personnel": {
    "count": 42,
    "data": [
      {
        "id": "uuid",
        "name": "Dr. Ahmed Hassan",
        "slug": "dr-ahmed-hassan",
        "specialization": "Plastic, Reconstructive and Aesthetic Surgery",
        "country": "Turkey",
        "province": "Istanbul",
        "image": "https://...",
        "rating": 4.8,
        "user_id": "user-uuid"
      }
    ]
  },
  "medical_facilities": {
    "count": 28,
    "data": [...]
  },
  "agencies": {
    "count": 15,
    "data": [...]
  }
}
```

**Use Cases**:
- Populate healthcare-database page
- Feed recommendation engine
- Generate directory exports
- Analytics and reporting

---

### 3. **Upload Facilities API** (`/api/upload-facilities`)
**Purpose**: Batch facility uploads (DEPRECATED)  
**Status**: ❌ Deprecated (Returns 410 Gone)

**Why Deprecated**:
- Firebase Admin SDK removed from project
- Migration to Supabase completed
- Admin uploads now handled via UserCRUDModal in admin dashboard

**What it does now**:
- Returns 410 "Gone" status
- Explains endpoint is deprecated
- Directs users to use Supabase client API

**Migration Path**:
Instead of this API, use:
1. **Admin Dashboard** (`/admin`) - UserCRUDModal for creating medical facility accounts
2. **Supabase Direct Client** - Authenticated requests from browser/client
3. **RLS Policies** - Data access controlled by Row Level Security rules

**Old vs New Approach**:
```
OLD: POST /api/upload-facilities (Firebase Admin)
NEW: Use UserCRUDModal in /admin dashboard + Supabase client API
```

---

## API Folder Architecture

```
app/
├── api/
│   ├── debug/
│   │   └── route.ts          [GET/POST] System configuration check
│   ├── listings/
│   │   └── route.ts          [GET] Fetch all public listings
│   └── upload-facilities/
│       └── route.ts          [POST/GET] DEPRECATED - Returns 410
```

---

## How APIs Work

### Authentication
- **Debug API**: No authentication required (development utility)
- **Listings API**: No authentication required (public data only)
- **Upload Facilities**: Deprecated (formerly admin-only)

### Data Flow
```
Browser Request
    ↓
Next.js API Route (/api/...)
    ↓
Supabase Client (server-side)
    ↓
Supabase PostgreSQL Database
    ↓
Row Level Security (RLS) Policies
    ↓
Response back to Browser
```

### Performance
- Listings API uses parallel queries (Promise.all)
- Fetch time: ~100-200ms for all listings
- Results cached by browser (configurable)
- Server-side Supabase client (no session overhead)

---

## When to Use Each API

### Debug API (`/api/debug`)
✅ **Use when**:
- Troubleshooting environment configuration
- Testing Supabase connection
- Verifying admin emails are loaded
- Development debugging

### Listings API (`/api/listings`)
✅ **Use when**:
- Loading healthcare-database page
- Building search/filter features
- Generating directory pages
- Analytics and reporting
- Public-facing features that need listing data

### Upload Facilities API
❌ **DO NOT USE** - Deprecated
- Use Admin Dashboard instead (`/admin`)
- Use UserCRUDModal for creating accounts
- Use Supabase client API for data operations

---

## Error Handling

All APIs return proper HTTP status codes:

| Status | Meaning | Example |
|--------|---------|---------|
| 200 | Success | Listings fetched successfully |
| 400 | Bad Request | Invalid parameters |
| 410 | Gone (Deprecated) | Upload-facilities endpoint |
| 500 | Server Error | Supabase connection failed |

**Error Response Format**:
```json
{
  "status": "error",
  "message": "Description of what failed",
  "error": "Detailed error message",
  "timestamp": "2026-01-24T..."
}
```

---

## Environment Variables Required

For APIs to function, these must be set in `.env.local`:

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://project.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY=eyJhbGc...

# Admin Configuration
NEXT_PUBLIC_ADMIN_EMAILS=admin1@example.com,admin2@example.com
```

---

## Security Notes

### ✅ Safe
- Listings API returns public data only
- No authentication bypass possible
- Supabase RLS policies enforce access control
- Debug API doesn't expose sensitive keys (masked)

### ⚠️ Important
- Never expose SUPABASE_SERVICE_ROLE_KEY on client
- All data filtering happens at database level (RLS)
- Admin operations should use admin dashboard
- API routes are rate-limited by Next.js deployment

---

## Future Plans

### Planned APIs
- User profile endpoints (GET current user)
- Treatment plan endpoints (CRUD operations)
- Support ticket endpoints (Create/update tickets)
- Review endpoints (Create/update reviews)

### Deprecation Timeline
- Upload Facilities: Deprecated as of 2026-01-21
- Other Firebase Admin endpoints: Deprecated in phase-out

---

## Summary

The `/app/api` folder serves as the backend API layer for the Medikal Site application:

| API | Purpose | Status | Use |
|-----|---------|--------|-----|
| `/api/debug` | System config check | ✅ Active | Development |
| `/api/listings` | Fetch all listings | ✅ Active | Public data |
| `/api/upload-facilities` | Batch uploads | ❌ Deprecated | Don't use |

**Key Takeaway**: APIs are primarily for reading public listing data and debugging. Write operations (creating/updating data) now happen through Supabase client directly via the admin dashboard and authenticated forms, with security enforced by Row Level Security policies.
