# External Library Usage Guide

This document lists all external libraries installed in the Medikal-Site project and how to use them correctly. **AI agents must use these libraries instead of creating custom solutions.**

## Production Dependencies

### 1. **Next.js** (^16.1.1)
**Purpose:** Full-stack React framework with App Router, server components, and built-in optimization.

**When to Use:**
- Page routing and navigation
- Server-side rendering and static generation
- API route handlers
- Image optimization (`next/image`)
- Link component for client-side navigation

**Import Examples:**
```typescript
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
```

**Documentation:** `.next-docs/` folder (see AGENTS.md)

---

### 2. **React** (^19.2.3) & **React DOM** (^19.2.3)
**Purpose:** UI library for building components with hooks and state management.

**When to Use:**
- Create functional components
- Use hooks (useState, useEffect, useContext, etc.)
- Create component composition
- Event handling

**Import Examples:**
```typescript
import { useState, useEffect, useContext, ReactNode } from 'react';
```

**DO NOT:** Create custom hooks when React hooks exist for the same purpose.

---

### 3. **Supabase** (@supabase/supabase-js ^2.38.0)
**Purpose:** Backend-as-a-service for authentication, database, and real-time features.

**When to Use:**
- User authentication (OAuth, email/password)
- Database queries (CRUD operations)
- Real-time subscriptions
- User session management
- RLS (Row Level Security) checks

**Import Examples:**
```typescript
import { supabase } from '@/lib/supabase';

// Query data
const { data, error } = await supabase
  .from('users')
  .select('*')
  .eq('id', userId)
  .single();

// Auth operations
await supabase.auth.signInWithOAuth({ provider: 'google' });
```

**Location:** `lib/supabase.ts` (already configured)

**DO NOT:** Create custom authentication or database wrappers without checking existing implementation.

---

### 4. **AWS SDK S3 Client** (@aws-sdk/client-s3 ^3.616.0)
**Purpose:** Interact with S3-compatible storage (Cloudflare R2 in this project).

**When to Use:**
- Upload files to R2
- Delete files from R2
- Check if files exist in R2

**Import Examples:**
```typescript
import { S3Client, PutObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
```

**Location:** `lib/r2.ts` (pre-configured wrapper exists)

**Recommended Approach:** Use the wrapper functions in `lib/r2.ts` instead of calling S3Client directly:
```typescript
import { uploadFileToR2, deleteFileFromR2, fileExistsInR2 } from '@/lib/r2';

const fileUrl = await uploadFileToR2(file, 'documents');
```

**DO NOT:** Create custom R2 utilities; use `lib/r2.ts`.

---

### 5. **React Easy Crop** (^5.5.6)
**Purpose:** Client-side image cropping UI component.

**When to Use:**
- User-facing image crop interface
- Preview before upload
- Aspect ratio locking

**Import Examples:**
```typescript
import Reactcrop from 'react-easy-crop';

<Reactcrop
  image={imageSrc}
  crop={crop}
  onCropChange={setCrop}
  aspectRatio={1}
/>
```

**Location:** Used in `components/ImageCropModal.tsx`

**DO NOT:** Don't try to implement custom crop functionality; use this library.

---

### 6. **Debug** (^4.4.3) with @types/debug
**Purpose:** Namespace-based debugging with environment variable control.

**When to Use:**
- Logging in development mode
- Conditional verbose logging
- Namespace-based log filtering

**Import Examples:**
```typescript
import { createDebugger } from '@/lib/debugLogger';

const log = createDebugger('medikal:auth');
log.info('User signed in', { userId });
log.debug('Detailed info'); // Only if DEBUG_VERBOSE=true
log.warn('Warning message');
log.error('Error occurred', error);
```

**Environment Variables:**
```bash
DEBUG=medikal:*              # Enable specific namespaces
DEBUG_VERBOSE=true           # Enable verbose logging
```

**Location:** Wrapper at `lib/debugLogger.ts`

**DO NOT:** Don't use `console.log()` directly; use the debug wrapper.

---

### 7. **Slugify** (^1.6.6)
**Purpose:** Convert strings to URL-friendly slugs.

**When to Use:**
- Generate URL slugs from names/titles
- Create readable URLs
- Normalize strings for URLs

**Import Examples:**
```typescript
import slug from 'slugify';

const urlSlug = slug('John Doe Hospital', { lower: true });
// Result: 'john-doe-hospital'
```

**DO NOT:** Don't create custom slug functions; use slugify.

---

### 8. **Country State City** (^3.2.1)
**Purpose:** Geolocation data (countries, states, cities).

**When to Use:**
- Populate country/state/city dropdowns
- Validate locations
- Geographic data lookups

**Import Examples:**
```typescript
import { getCountries, getStatesByCountryCode, getCitiesByCountryCode } from 'country-state-city';

const countries = getCountries();
const states = getStatesByCountryCode('US');
```

**DO NOT:** Don't hardcode location lists; use this library.

---

## Development Dependencies

### 9. **TypeScript** (^5)
**Purpose:** Type safety and code quality.

**When to Use:**
- Define interfaces for data types
- Type component props with `Readonly<{ ... }>`
- Type function parameters and return values
- Avoid `any` type

**Code Style:**
```typescript
interface ComponentProps {
  title: string;
  count?: number;
  onAction: (id: string) => void;
}

export default function Component({ title, count, onAction }: Readonly<ComponentProps>) {
  // Component logic
}
```

**DO NOT:** Don't use `any` types; define proper interfaces.

---

### 10. **Tailwind CSS** (@tailwindcss/postcss ^4)
**Purpose:** Utility-first CSS framework.

**When to Use:**
- All styling (NO custom CSS)
- Responsive design
- Component theming

**Import:** Already configured in `globals.css`

**Code Style:**
```tsx
<div className="flex items-center justify-between bg-blue-500 p-4 hover:bg-blue-600">
  <h1 className="text-2xl font-bold text-white">Title</h1>
</div>
```

**DO NOT:** Don't create custom CSS files or use inline styles; use Tailwind classes.

---

### 11. **Vitest** (^1.1.0) + Testing Library
**Purpose:** Unit and integration testing.

**When to Use:**
- Test React components
- Test utility functions
- Test hooks and context

**Import Examples:**
```typescript
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
```

**File Location:** Place tests in same directory as source with `.test.tsx` suffix

**DO NOT:** Don't skip tests for new features; write tests alongside code.

---

### 12. **ESLint** (^9) + Next.js Config
**Purpose:** Code quality and consistency.

**Configuration:** Uses Next.js ESLint config for automatic linting.

**Run:** `npm run lint`

**DO NOT:** Don't ignore linting errors; fix them before committing.

---

## Custom Wrappers (Use These, Not the Raw Libraries)

### `lib/supabase.ts`
Pre-configured Supabase client. **Always import from here, not directly from @supabase/supabase-js.**

```typescript
import { supabase } from '@/lib/supabase';
```

### `lib/r2.ts`
Pre-configured R2 wrapper with utility functions.

```typescript
import { uploadFileToR2, deleteFileFromR2, fileExistsInR2 } from '@/lib/r2';
```

### `lib/debugLogger.ts`
Debug wrapper for consistent logging across the project.

```typescript
import { createDebugger } from '@/lib/debugLogger';
const log = createDebugger('medikal:modulename');
```

---

## What NOT to Do

❌ **Don't create custom solutions for:**
- Authentication (use Supabase)
- Database operations (use Supabase)
- File uploads (use AWS SDK via `lib/r2.ts`)
- Image cropping (use react-easy-crop)
- URL slugs (use slugify)
- Location data (use country-state-city)
- Logging (use debug wrapper)
- Styling (use Tailwind CSS)
- Image optimization (use Next.js Image)
- Navigation (use Next.js Link and useRouter)

❌ **Don't:**
- Add custom CSS files
- Use inline styles
- Use `console.log()` for logging
- Hardcode location lists
- Create custom authentication
- Write custom database wrappers
- Use `any` types in TypeScript

---

## Adding New Libraries

If a new library needs to be added:

1. Check if existing libraries already solve the problem
2. Verify the library is actively maintained
3. Check bundle size impact
4. Update this file with the new library
5. Create a wrapper in `lib/` if it's a core library (auth, storage, logging)
6. Document the import path and usage examples
7. Add to `.agents/rules/external-library-usage.md`

---

## Summary for AI Agents

✅ **Always:**
- Check this file first when implementing a feature
- Use existing libraries from package.json
- Follow the import examples provided
- Use wrapper functions from `lib/` directory
- Reference the correct documentation
- Follow the code style for each library

❌ **Never:**
- Create custom solutions if a library exists
- Import from package.json without checking this guide
- Use `any` types or raw console.log
- Skip testing or linting
- Ignore TypeScript errors
- Add custom CSS or styles outside Tailwind

---

**Last Updated:** February 10, 2026  
**See Also:** [Code Style Guide](./.agents/rules/code-style-guide.md), [Documentation Synchronization](./.agents/rules/code-style-guide.md#7-documentation-synchronization)
