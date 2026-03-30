/**
 * Debug Logger Utility
 *
 * Wrapper around the 'debug' library with verbose level support.
 *
 * Environment Variable:
 * - LOG_LEVEL: Controls logging verbosity
 *   - "debug": Enable all debug logging and verbose output
 *   - "info": Enable info level (no verbose)
 *   - "warn": Disable debug, show only warnings
 *   - "error": Disable debug, show only errors
 *
 * Usage in Browser:
 * - localStorage.setItem('LOG_LEVEL', 'debug')
 *
 * Usage in Next.js:
 * - .env.local: LOG_LEVEL=debug
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
let debugEnabled = false;

// Map LOG_LEVEL to feature flags
function initLogLevel(): void {
  const logLevel = typeof window !== 'undefined'
    ? localStorage.getItem('LOG_LEVEL') || process.env.NEXT_PUBLIC_LOG_LEVEL
    : process.env.LOG_LEVEL || process.env.NEXT_PUBLIC_LOG_LEVEL;

  const level = (logLevel || 'info').toLowerCase();
  
  debugEnabled = ['debug', 'info'].includes(level);
  verboseMode = level === 'debug';

  // Set debug namespace based on log level
  if (typeof window !== 'undefined' && debugEnabled) {
    process.env.DEBUG = 'medikal:*';
  }

  // Log the current log level on initialization
  if (typeof window !== 'undefined') {
    console.log(`🎯 [DEBUG LOGGER] Client-side LOG_LEVEL initialized: ${level} (verbose: ${verboseMode})`);
  } else {
    console.log(`🎯 [DEBUG LOGGER] Server-side LOG_LEVEL initialized: ${level} (verbose: ${verboseMode})`);
  }
}

// Initialize on module load
initLogLevel();

// Watch for storage changes in browser
if (typeof window !== 'undefined') {
  window.addEventListener('storage', () => initLogLevel());
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
      if (verboseMode && debugEnabled) {
        verboseLogger(message, ...args);
      }
    },

    info: (message: string, ...args: any[]) => {
      if (debugEnabled) {
        baseLogger('ℹ️', message, ...args);
      }
    },

    warn: (message: string, ...args: any[]) => {
      baseLogger('⚠️', message, ...args);
    },

    error: (message: string, ...args: any[]) => {
      baseLogger('❌', message, ...args);
    },

    isEnabled: () => {
      return debugEnabled && baseLogger.enabled;
    },
  };
}

/**
 * Enable or disable verbose logging at runtime
 */
export function setVerboseMode(enabled: boolean): void {
  const level = enabled ? 'debug' : 'info';
  if (typeof window !== 'undefined') {
    localStorage.setItem('LOG_LEVEL', level);
  }
  initLogLevel();
}

/**
 * Get current verbose mode status
 */
export function isVerboseMode(): boolean {
  return verboseMode;
}

/**
 * Set log level at runtime
 * @param level - "debug", "info", "warn", or "error"
 */
export function setLogLevel(level: 'debug' | 'info' | 'warn' | 'error'): void {
  if (typeof window !== 'undefined') {
    localStorage.setItem('LOG_LEVEL', level);
  } else {
    process.env.NEXT_PUBLIC_LOG_LEVEL = level;
  }
  initLogLevel();
}

/**
 * Get current log level
 */
export function getLogLevel(): string {
  if (typeof window !== 'undefined') {
    return localStorage.getItem('LOG_LEVEL') || process.env.NEXT_PUBLIC_LOG_LEVEL || 'info';
  }
  return process.env.NEXT_PUBLIC_LOG_LEVEL || 'info';
}

export default createDebugger;
