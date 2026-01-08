# Environment Variables Setup

Create a `.env.local` file in your project root with the following variables:

## Firebase Configuration
```env
NEXT_PUBLIC_FIREBASE_API_KEY=your_firebase_api_key_here
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project_id.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project_id.firebasestorage.app
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id
```

## Admin Configuration
```env
NEXT_PUBLIC_ADMIN_EMAILS=admin@example.com,another-admin@example.com
```

## How to Get Firebase Config Values

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project
3. Go to Project Settings (gear icon)
4. Scroll down to "Your apps" section
5. Click on the web app icon (</>) to see the config values
6. Copy the values from the `firebaseConfig` object

## Admin Emails

The `NEXT_PUBLIC_ADMIN_EMAILS` should contain a comma-separated list of email addresses that should have admin privileges. Users with these emails will automatically be assigned the 'admin' role when they sign up.