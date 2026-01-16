// Utility functions for the application
import slugify from 'slugify';

/**
 * Generate a URL-safe slug from a string
 * @param text - The text to slugify
 * @returns URL-safe slug
 */
export const generateSlug = (text: string): string => {
  return slugify(text, {
    lower: true,
    strict: true,
    trim: true,
  });
};

/**
 * Validate email address format
 * @param email - Email to validate
 * @returns true if valid email format
 */
export const validateEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

/**
 * Validate phone number (basic international format)
 * @param phone - Phone number to validate
 * @returns true if valid phone format
 */
export const validatePhone = (phone: string): boolean => {
  const phoneRegex = /^[\d\s\-\+\(\)]{7,}$/;
  return phoneRegex.test(phone);
};

/**
 * Validate URL format
 * @param url - URL to validate
 * @returns true if valid URL
 */
export const validateURL = (url: string): boolean => {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
};

/**
 * Format date to readable format
 * @param date - Date to format
 * @returns Formatted date string (e.g., "Jan 16, 2026")
 */
export const formatDate = (date: Date | any): string => {
  if (!date) return '';
  const dateObj = date instanceof Date ? date : date.toDate?.();
  if (!dateObj) return '';
  
  return dateObj.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
};

/**
 * Format date with time
 * @param date - Date to format
 * @returns Formatted date time string (e.g., "Jan 16, 2026 at 2:30 PM")
 */
export const formatDateTime = (date: Date | any): string => {
  if (!date) return '';
  const dateObj = date instanceof Date ? date : date.toDate?.();
  if (!dateObj) return '';
  
  return dateObj.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

/**
 * Get time ago string (e.g., "2 hours ago")
 * @param date - Date to compare
 * @returns Relative time string
 */
export const getTimeAgo = (date: Date | any): string => {
  if (!date) return '';
  const dateObj = date instanceof Date ? date : date.toDate?.();
  if (!dateObj) return '';
  
  const seconds = Math.floor((new Date().getTime() - dateObj.getTime()) / 1000);
  
  if (seconds < 60) return 'just now';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  
  return formatDate(dateObj);
};

/**
 * Truncate text to a maximum length with ellipsis
 * @param text - Text to truncate
 * @param maxLength - Maximum length
 * @returns Truncated text
 */
export const truncateText = (text: string, maxLength: number = 100): string => {
  if (!text) return '';
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength - 3) + '...';
};

/**
 * Capitalize first letter of string
 * @param text - Text to capitalize
 * @returns Capitalized text
 */
export const capitalize = (text: string): string => {
  if (!text) return '';
  return text.charAt(0).toUpperCase() + text.slice(1).toLowerCase();
};

/**
 * Validate required field
 * @param value - Value to check
 * @returns true if value is provided
 */
export const isRequired = (value: any): boolean => {
  return value !== null && value !== undefined && value !== '';
};

/**
 * Validate all required fields in object
 * @param obj - Object to validate
 * @param requiredFields - Array of field names that are required
 * @returns Object with field names as keys and boolean as values
 */
export const validateRequiredFields = (obj: Record<string, any>, requiredFields: string[]): Record<string, boolean> => {
  const errors: Record<string, boolean> = {};
  requiredFields.forEach(field => {
    errors[field] = !isRequired(obj[field]);
  });
  return errors;
};

/**
 * Check if there are any validation errors
 * @param errors - Errors object
 * @returns true if there are errors
 */
export const hasErrors = (errors: Record<string, boolean>): boolean => {
  return Object.values(errors).some(error => error === true);
};

/**
 * Get error messages for display
 * @param errors - Errors object
 * @param labels - Labels for fields (optional)
 * @returns Array of error messages
 */
export const getErrorMessages = (errors: Record<string, boolean>, labels?: Record<string, string>): string[] => {
  return Object.entries(errors)
    .filter(([, hasError]) => hasError)
    .map(([field]) => {
      const label = labels?.[field] || field;
      return `${label} is required`;
    });
};
