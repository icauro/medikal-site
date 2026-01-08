# Admin Login Setup Guide

This guide will help you set up admin authentication for your medical site.

## 1. Install Dependencies

First, install NextAuth.js (Auth.js):

```bash
npm install next-auth
```

## 2. Set Up Environment Variables

Create a `.env.local` file in the root of your project with the following variables:

```env
# NextAuth Configuration
NEXTAUTH_SECRET=your-secret-key-here-generate-with-openssl-rand-base64-32
NEXTAUTH_URL=http://localhost:3000

# Google OAuth Credentials
# Get these from: https://console.cloud.google.com/apis/credentials
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret

# Admin Emails (comma-separated list of emails that should have admin access)
ADMIN_EMAILS=admin@example.com,another-admin@example.com
```

### Generate NEXTAUTH_SECRET:

Run this command to generate a secure secret:
```bash
openssl rand -base64 32
```

### Get Google OAuth Credentials:

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Enable the Google+ API
4. Go to "Credentials" → "Create Credentials" → "OAuth client ID"
5. Configure the consent screen if prompted
6. Set application type to "Web application"
7. Add authorized redirect URI: `http://localhost:3000/api/auth/callback/google`
8. Copy the Client ID and Client Secret to your `.env.local` file

## 3. File Structure

The following files have been created:

- `lib/authOptions.ts` - NextAuth configuration with Google provider
- `lib/auth.ts` - Helper functions to get session
- `middleware.ts` - Route protection middleware
- `app/api/auth/[...nextauth]/route.ts` - NextAuth API route handler
- `app/admin/login/page.tsx` - Admin login page
- `app/admin/page.tsx` - Admin dashboard (protected)
- `app/admin/SignOutButton.tsx` - Sign out button component

## 4. How It Works

1. **Admin Login**: Users visit `/admin/login` and sign in with Google
2. **Role Check**: The system checks if the user's email is in the `ADMIN_EMAILS` list
3. **Session Management**: If authorized, a session is created with role="admin"
4. **Route Protection**: Middleware protects `/admin/*` routes, allowing only admins
5. **Dashboard Access**: Admin users can access `/admin` dashboard

## 5. Customization

### Change Admin Emails:
Edit the `ADMIN_EMAILS` in `.env.local` or modify the `signIn` callback in `lib/authOptions.ts` to check against a database.

### Add More Providers:
You can add other OAuth providers (GitHub, Facebook, etc.) in `lib/authOptions.ts`:

```typescript
import GitHub from "next-auth/providers/github";

providers: [
  Google({...}),
  GitHub({
    clientId: process.env.GITHUB_CLIENT_ID!,
    clientSecret: process.env.GITHUB_CLIENT_SECRET!,
  }),
]
```

### Database Integration:
To store user roles in a database instead of environment variables:

1. Check user role in the `signIn` callback in `lib/authOptions.ts`
2. Query your database for the user's role
3. Assign the role to the user object

## 6. Testing

1. Start your development server: `npm run dev`
2. Visit `http://localhost:3000/admin/login`
3. Sign in with a Google account that's in your `ADMIN_EMAILS` list
4. You should be redirected to `/admin` dashboard
5. Try accessing `/admin` without logging in - you'll be redirected to login

## 7. Security Notes

- Never commit `.env.local` to version control
- Use strong, randomly generated `NEXTAUTH_SECRET`
- Keep your OAuth client secrets secure
- In production, update `NEXTAUTH_URL` to your production domain
- Consider implementing additional security measures like 2FA for admin accounts
