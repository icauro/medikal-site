# Environment Variables Setup

Create a `.env.local` file in your project root with the following variables:

## Supabase Configuration
```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

## Admin Configuration
```env
NEXT_PUBLIC_ADMIN_EMAILS=admin@example.com,another-admin@example.com
```

## How to Get Supabase Config Values

1. Go to [Supabase Dashboard](https://app.supabase.com/)
2. Select your project
3. Go to Settings > API
4. Copy the `Project URL` and `Anon Key`
5. Add them to your `.env.local`

## Admin Emails

The `NEXT_PUBLIC_ADMIN_EMAILS` should contain a comma-separated list of email addresses that should have admin privileges. Users with these emails will automatically be assigned the 'admin' role when they sign up.