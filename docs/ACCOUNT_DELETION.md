# Account Deletion Feature

## Overview
Users can now delete their accounts from the profile page. The deletion process varies based on user role to preserve platform integrity.

## User Interface

### Location
- **Profile Page** → Bottom of page → "Danger Zone" section

### Delete Process
1. User clicks "Delete Account" button
2. Confirmation dialog appears with warning message
3. User must type "DELETE" to confirm
4. Account is permanently deleted

## Deletion Rules by Role

### Patient Accounts
**What Gets Deleted:**
- ✅ User profile (`users/{uid}`)
- ✅ Support tickets (`support_tickets` where `userId == uid`)
- ✅ Treatment plans (`treatment_plans` where `userId == uid`)
- ✅ Firebase Authentication account

**What Stays:**
- ❌ Reviews remain (belong to the platform)

### Doctor Accounts
**What Gets Deleted:**
- ✅ User profile (`users/{uid}`)
- ✅ Support tickets (`support_tickets` where `userId == uid`)
- ✅ Treatment plans/responses (`treatment_plans` where `userId == uid`)
- ✅ Firebase Authentication account

**What Stays (Platform Property):**
- ❌ Doctor profile page (`doctors/{doctorId}`)
- ❌ Clinic information (`clinics/{clinicId}`)
- ❌ Patient reviews (`reviews` collection)
- ❌ Doctor responses to treatment plans (remain visible to patients)

### Admin Accounts
**What Gets Deleted:**
- ✅ User profile (`users/{uid}`)
- ✅ Support tickets created by admin
- ✅ Treatment plans created by admin
- ✅ Firebase Authentication account

**What Stays:**
- ❌ All admin actions/audit trails

## Technical Implementation

### AuthContext Method
```typescript
const deleteAccount = async () => {
  // 1. Delete user-owned data (support tickets, treatment plans)
  // 2. Delete user profile from Firestore
  // 3. Delete Firebase Auth account
  // 4. Clear local state
}
```

### Security Considerations

**Re-authentication Requirement:**
If the user hasn't logged in recently, Firebase may require re-authentication before account deletion:
```
Error: "For security, please log out and log back in before deleting your account."
```

**Solution:** User must log out and log back in, then attempt deletion again.

### Firestore Rules
Current rules already support:
- Users can delete their own profile: `allow write: if request.auth.uid == userId`
- Users can delete their own tickets/plans via `userId` field checks
- Admin-only deletion for doctor/clinic pages and reviews

## User Messages

### Patient Warning
> "Once you delete your account, there is no going back. All your data will be permanently deleted."

### Doctor/Admin Warning
> "Deleting your account will remove your personal data, but your doctor profile, clinic information, and reviews will remain on the site as they belong to the platform."

## Data Retention Policy

### Why Keep Doctor/Clinic/Review Data?
1. **Patient Safety**: Historical reviews help future patients make informed decisions
2. **Platform Integrity**: Doctor profiles represent professional verification work
3. **Legal Compliance**: Medical service records may need to be retained
4. **Community Value**: Aggregated data benefits the medical directory

### GDPR Compliance
- Personal identifiable information (PII) is removed from user profiles
- Doctor professional information (license, credentials) remains as public directory data
- Users are clearly informed about what data remains

## Testing Checklist

### Patient Account Deletion
- [ ] Click "Delete Account" button
- [ ] Confirmation dialog appears
- [ ] Type "DELETE" to confirm
- [ ] Account deleted successfully
- [ ] User redirected to homepage
- [ ] Cannot log in with same account
- [ ] Support tickets deleted
- [ ] Treatment plans deleted
- [ ] Reviews still visible on doctor pages

### Doctor Account Deletion
- [ ] Click "Delete Account" button
- [ ] See special warning about doctor data
- [ ] Type "DELETE" to confirm
- [ ] Account deleted successfully
- [ ] User redirected to homepage
- [ ] Cannot log in with same account
- [ ] Verification request deleted
- [ ] Support tickets deleted
- [ ] Doctor profile page still accessible (public)
- [ ] Reviews still visible

### Error Handling
- [ ] Recent login required error shows helpful message
- [ ] Cancel button works and closes dialog
- [ ] Typing wrong text shows error
- [ ] Network errors handled gracefully

## Future Enhancements

1. **Export Data**: Allow users to download their data before deletion (GDPR Article 20)
2. **Scheduled Deletion**: Option to schedule deletion for 30 days later with cancellation option
3. **Email Confirmation**: Send confirmation email before final deletion
4. **Partial Deletion**: Option to deactivate instead of delete (soft delete)
5. **Admin Audit Log**: Track all account deletions for compliance
