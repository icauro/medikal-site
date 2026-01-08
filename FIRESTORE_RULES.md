# Firestore Security Rules

## Current Issue
You're getting "Missing or insufficient permissions" because your Firestore security rules don't allow read/write operations from the client SDK.

## How to Fix

### Option 1: Update Rules in Firebase Console (Recommended for Quick Fix)

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project: **mpturkey-ccd57**
3. Navigate to **Firestore Database** → **Rules** tab
4. Replace the existing rules with the following:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Allow public read access to doctors collection
    match /doctors/{doctorId} {
      allow read: if true;
      allow write: if true; // For development only - restrict in production!
    }
    
    // Add other collections as needed
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
    
    // Deny all other access by default
    match /{document=**} {
      allow read, write: if false;
    }
  }
}
```

5. Click **Publish** to save the rules

### Option 2: More Secure Rules (For Production)

For production, you should use authentication-based rules:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Doctors collection - public read, authenticated write
    match /doctors/{doctorId} {
      allow read: if true; // Anyone can read doctors
      allow create: if request.auth != null; // Only authenticated users can create
      allow update, delete: if request.auth != null; // Only authenticated users can modify
    }
    
    // Users collection - users can only read/write their own data
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
    
    // Add other collections as needed
  }
}
```

## Important Notes

⚠️ **For Development**: Option 1 will work immediately but is not secure for production.

⚠️ **For Production**: Use Option 2 or implement proper authentication and role-based access control (admin-only for creating doctors).

## Testing

After updating the rules:
1. Wait a few seconds for the rules to propagate
2. Refresh your application
3. Try creating a doctor again

The rules should now allow the operations to succeed!
