# Debug Logging Guide

This project uses the `debug` library with a custom wrapper for verbose logging control.

## Environment Variables

### `DEBUG`
Enables specific debug namespaces. Supports wildcards.

```bash
# Enable all medikal logs
DEBUG=medikal:*

# Enable specific modules
DEBUG=medikal:auth,medikal:profile,medikal:r2

# Enable with environment variable
# .env.local
DEBUG=medikal:*
```

### `DEBUG_VERBOSE` (Verbose Mode)
Enables verbose logging (log.debug calls). Useful for deep debugging during development.

```bash
# Enable verbose logging
DEBUG_VERBOSE=true

# .env.local
DEBUG_VERBOSE=true
```

## Browser Usage

Open browser console and execute:

```javascript
// Enable all medikal logs
localStorage.setItem('DEBUG', 'medikal:*');

// Enable verbose mode
localStorage.setItem('DEBUG_VERBOSE', 'true');

// Disable
localStorage.removeItem('DEBUG');
localStorage.removeItem('DEBUG_VERBOSE');

// Check status
console.log(localStorage.getItem('DEBUG'));
```

## Usage in Code

### Creating a Logger

```typescript
import { createDebugger } from '@/lib/debugLogger';

const log = createDebugger('medikal:mymodule');
```

### Logging Levels

```typescript
// Debug level (only shows if DEBUG_VERBOSE=true)
log.debug('Detailed info', { userId, details });

// Info level (always shows if namespace is enabled)
log.info('Important action', { status, result });

// Warning level
log.warn('Potential issue', error);

// Error level
log.error('Error occurred', error);
```

### Grouping Related Logs

```typescript
log.group('User Authentication', () => {
  log.debug('Checking credentials');
  log.info('User signed in');
  log.debug('Loading profile');
});
```

### Check if Debug Enabled

```typescript
import { createDebugger } from '@/lib/debugLogger';

const log = createDebugger('medikal:auth');

if (log.isEnabled()) {
  console.log('Debug is enabled for this namespace');
}
```

## Available Namespaces

| Namespace | Module | Purpose |
|-----------|--------|---------|
| `medikal:auth` | AuthContext | Authentication & user profile |
| `medikal:r2` | lib/r2.ts | Cloudflare R2 uploads |
| `medikal:profile` | Profile pages | Profile operations |
| `medikal:upload` | useImageUpload hook | Image upload handling |
| `medikal:api` | API routes | API endpoint logging |

## Environment Setup

### Development (.env.local)

```env
# Enable all debug namespaces
DEBUG=medikal:*

# Enable verbose logging
DEBUG_VERBOSE=true
```

### Production

Leave `DEBUG` and `DEBUG_VERBOSE` unset. Logs will not be printed even if code contains logging calls.

## Tips

1. **Start with `medikal:*`** - Enable all logs to see what's happening
2. **Use verbose mode** - Add `DEBUG_VERBOSE=true` for detailed debugging
3. **Filter by namespace** - `DEBUG=medikal:auth,medikal:r2` to focus on specific areas
4. **Dynamically toggle** - Use localStorage in browser console to toggle without reloading

## Performance

- Zero overhead in production
- Minimal overhead in development (only if namespace is enabled)
- `log.debug()` calls are completely ignored if `DEBUG_VERBOSE` is not set
- No third-party services or network calls

## Migration Status

✅ Complete:
- `lib/contexts/AuthContext.tsx`

In Progress:
- `lib/r2.ts`
- `lib/hooks/useImageUpload.ts`
- `app/treatment-plan/page.tsx`
- `app/support/page.tsx`

See AGENTS.md documentation synchronization rules for more details.
