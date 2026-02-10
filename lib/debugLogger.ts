/**
 * Debug Logger Utility
 *
 * Wrapper around the 'debug' library with verbose level support.
 *
 * Environment Variables:
 * - DEBUG: Enable specific namespaces (e.g., "medikal:*" or "medikal:auth,medikal:profile")
 * - DEBUG_VERBOSE: Set to "true" to enable verbose output (includes debug.debug() calls)
 *
 * Usage in Browser:
 * - localStorage.setItem('DEBUG', 'medikal:*')
 * - localStorage.setItem('DEBUG_VERBOSE', 'true')
 *
 * Usage in Development:
 * - DEBUG=medikal:* npm run dev
 * - DEBUG_VERBOSE=true DEBUG=medikal:* npm run dev
 *
 * Usage in Next.js:
 * - .env.local: DEBUG=medikal:*
 * - .env.local: DEBUG_VERBOSE=true
 */

import debug from 'debug';

interface DebuggerInstance {
  debug: (message: string, ...args: any[]) => void;
  info: (message: string, ...args: any[]) => void;
  warn: (message: string, ...args: any[]) => void;
  error: (message: string, ...args: any[]) => void;
  isEnabled: () => boolean;
}

let verboseMode = false;

// Check verbose mode from multiple sources
function initVerboseMode(): void {
  if (typeof window !== 'undefined') {
    // Client-side
    verboseMode =
      localStorage.getItem('DEBUG_VERBOSE') === 'true' ||
      process.env.NEXT_PUBLIC_DEBUG_VERBOSE === 'true';
  } else {
    // Server-side
    verboseMode = process.env.DEBUG_VERBOSE === 'true';
  }
}

// Initialize on module load
initVerboseMode();

// Watch for storage changes in browser
if (typeof window !== 'undefined') {
  window.addEventListener('storage', () => initVerboseMode());
}

/**
 * Create a debug logger instance for a specific module
 *
 * @param namespace - Module name (e.g., "medikal:auth", "medikal:profile")
 * @returns DebuggerInstance with info, warn, error, and debug methods
 *
 * @example
 * const log = createDebugger('medikal:auth');
 * log.info('User signed in', { email: 'user@example.com' });
 * log.debug('Detailed debug info'); // Only shows if DEBUG_VERBOSE=true
 * log.warn('Warning message');
 * log.error('Error occurred', error);
 */
export function createDebugger(namespace: string): DebuggerInstance {
  const baseLogger = debug(namespace);
  const verboseLogger = debug(`${namespace}:verbose`);

  return {
    debug: (message: string, ...args: any[]) => {
      if (verboseMode) {
        verboseLogger(message, ...args);
      }
    },

    info: (message: string, ...args: any[]) => {
      baseLogger('ℹ️', message, ...args);
    },

    warn: (message: string, ...args: any[]) => {
      baseLogger('⚠️', message, ...args);
    },

    error: (message: string, ...args: any[]) => {
      baseLogger('❌', message, ...args);
    },

    isEnabled: () => {
      return baseLogger.enabled;
    },
  };
}

/**
 * Enable or disable verbose logging at runtime
 */
export function setVerboseMode(enabled: boolean): void {
  verboseMode = enabled;
  if (typeof window !== 'undefined') {
    if (enabled) {
      localStorage.setItem('DEBUG_VERBOSE', 'true');
    } else {
      localStorage.removeItem('DEBUG_VERBOSE');
    }
  }
}

/**
 * Get current verbose mode status
 */
export function isVerboseMode(): boolean {
  return verboseMode;
}

/**
 * Convenience wrapper to enable/disable specific debug namespace
 * Useful for toggle debugging in browser console
 */
export function setDebugNamespace(namespace: string | boolean): void {
  if (typeof window === 'undefined') return;

  if (namespace === false) {
    localStorage.removeItem('DEBUG');
  } else if (namespace === true) {
    localStorage.setItem('DEBUG', 'medikal:*');
  } else {
    localStorage.setItem('DEBUG', namespace);
  }

  // Reload debug to apply changes
  window.location.reload();
}

export default createDebugger;
