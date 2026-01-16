# Modal Architecture - Admin Dashboard

## Overview

The admin dashboard uses a clear separation between **User CRUD operations** and **Listing CRUD operations**.

## Modal Types

### 1. UserCRUDModal (Single Universal Modal)

**File:** `app/admin/components/user-data/UserCRUDModal.tsx`

**Purpose:** Manages user records in the `users` collection for ALL roles.

**Dynamic Behavior:**
- Adapts its form fields based on the user's role
- Handles role switching
- Links users to their public listings
- Updates private user data (credentials, status, personal info)

**Supported Roles:**
- `patient` - Basic info, emergency contacts, preferred language
- `healthcare_personnel` - Personnel type, specialization, location, listing link
- `medical_facility` - Facility type, location, listing link  
- `agency` - Location, listing link
- `admin` - Basic role/status management

**Data Updated:**
- Collection: `users/{uid}`
- Fields: `role`, `accountStatus`, role-specific personal data

**Usage in Admin Page:**
```tsx
<UserCRUDModal
  isOpen={isUserModalOpen}
  onClose={() => setIsUserModalOpen(false)}
  user={selectedUser}
  onSuccess={fetchUsers}
/>
```

---

### 2. Listing CRUD Modals (3 Specialized Modals)

These modals manage **public listing records** that appear on the website.

#### HealthcarePersonnelListingCRUDModal
**File:** `app/admin/components/HealthcarePersonnelListingCRUDModal.tsx`
- **Collection:** `healthcare_personnel_listings`
- **Data:** Name, personnel type, specialization, bio, location, ratings, images, links
- **Modes:** Create new listing | Edit existing listing

#### MedicalFacilityListingCRUDModal
**File:** `app/admin/components/MedicalFacilityListingCRUDModal.tsx`
- **Collection:** `medical_facility_listings`
- **Data:** Name, facility type, address, location, services, specializations, ratings, images
- **Modes:** Create new listing | Edit existing listing

#### AgencyListingCRUDModal  
**File:** `app/admin/components/AgencyListingCRUDModal.tsx`
- **Collection:** `agency_listings`
- **Data:** Name, address, location, services offered, focus countries, ratings, images
- **Modes:** Create new listing | Edit existing listing

**Usage in Admin Page:**
```tsx
<HealthcarePersonnelListingCRUDModal
  isOpen={isPersonnelModalOpen}
  onClose={() => setIsPersonnelModalOpen(false)}
  openDataRecord={selectedListing}
  mode="edit" // or "create"
  onSuccess={fetchUsers}
/>
```

---

## Data Flow

### Two-Way Linking System 🔗

**CRITICAL:** All user-listing links are **bidirectional and automatically synchronized**.

#### When Linking from Listing Modal → User:
1. Admin enters `userId` in listing modal (e.g., HealthcarePersonnelListingCRUDModal)
2. On save, the modal:
   - Updates the listing document with `userId` field
   - **Automatically updates** the linked user's `personalXData.listingId` field
   - If userId changed, **unlinks** the old user by removing their listingId

#### When Linking from User Modal → Listing:
1. Admin enters `listingId` in UserCRUDModal (via search or manual entry)
2. On save, the modal:
   - Updates the user document with `personalXData.listingId` field
   - **Automatically updates** the linked listing's `userId` field
   - If listingId changed, **unlinks** the old listing by removing its userId

#### Link Integrity Rules:
- ✅ **Automatic Sync**: Both documents always know about each other
- ✅ **Orphan Prevention**: Unlinking updates both sides
- ✅ **Change Detection**: Old links are automatically removed
- ✅ **Error Resilience**: Linking errors are logged but don't block the main save
- ✅ **Logging**: All link operations logged with 🔗 [LINK] prefix

#### Data Structure:
```typescript
// User Document (users/{uid})
{
  healthcarePersonnelAccountData: {
    listingId: "listing_123" // Points to listing
  }
}

// Listing Document (healthcare_personnel_listings/{id})
{
  userId: "user_456" // Points back to user
}
```

### User Tables (All Users, Personnel, Facilities, Agencies, Patients)
1. Click Edit on user row
2. Opens `UserCRUDModal`
3. Modal dynamically shows fields based on user's role
4. On save:
   - Updates `users/{uid}` document
   - **Two-way sync**: Updates linked listing's `userId` field
   - **Unlinks old listing** if listingId changed

### Listing Tables (Personnel Listings, Facility Listings, Agency Listings)  
1. Click Edit on listing row
2. Opens corresponding `*ListingCRUDModal`
3. Modal shows listing-specific fields
4. On save:
   - Updates listing collection document
   - **Two-way sync**: Updates linked user's `listingId` field
   - **Unlinks old user** if userId changed

---

## Key Principles

### ✅ DO:
- Trust the two-way linking system - it's automatic
- Link from either side (user→listing or listing→user) - both work
- Check console logs with 🔗 [LINK] prefix for link operations

### ❌ DON'T:
- Create role-specific user modals (deprecated pattern)
- Mix user data and listing data in same modal
- Manually update both sides of a link (it's automatic)
- Update listings from the user modal (use listing modals)
- Hardcode role logic (UserCRUDModal handles this dynamically)
- Worry about orphaned links (system cleans them up automat
- Update listings from the user modal (use listing modals)
- Hardcode role logic (UserCRUDModal handles this dynamically)

---

## Migration Notes

### Deprecated Components (To Be Removed)
These components are redundant now that `UserCRUDModal` handles all roles:
- `HealthcarePersonnelUserModal.tsx`
- `MedicalFacilityUserModal.tsx`
- `AgencyUserModal.tsx`

All functionality has been consolidated into `UserCRUDModal.tsx`.

### Naming Convention
- **User Modals:** `UserCRUDModal` (singular, handles all)
- **Listing Modals:** `{Type}ListingCRUDModal` (specialized per type)

---

## Emoji Logging Conventiontwo-way linking operations
- ⚠️ `[VALIDATION]` - Form validation issues
- ✅ - Successful link sync
- 🚫 - Failed link operation
When debugging modals, use these prefixes:
- 👤 `[USER_CRUD]` - User database operations
- 📋 `[LISTING_CRUD]` - Listing database operations
- 🔗 `[LINK]` - User-listing linking operations
- ⚠️ `[VALIDATION]` - Form validation issues
 and link operations
- [ ] Add bulk listing imports
- [ ] Add listing approval workflow
- [ ] Add link health check tool to find orphaned references
## Future Enhancements

- [ ] Add batch user operations
- [ ] Add user impersonation for testing
- [ ] Add audit log for user changes
- [ ] Add bulk listing imports
- [ ] Add listing approval workflow
