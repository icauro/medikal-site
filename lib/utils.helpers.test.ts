import { describe, it, expect } from 'vitest';

/**
 * Example test suite for utility functions
 * Replace with actual utils from lib/utils.ts once you have utilities defined
 */

// Mock utility functions for example
const validateEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

const formatDate = (date: Date): string => {
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
};

const truncateString = (str: string, length: number): string => {
  if (str.length <= length) return str;
  return str.slice(0, length) + '...';
};

describe('Utility Functions', () => {
  describe('validateEmail', () => {
    it('validates correct email addresses', () => {
      expect(validateEmail('user@example.com')).toBe(true);
      expect(validateEmail('test.email+tag@domain.co.uk')).toBe(true);
    });

    it('rejects invalid email addresses', () => {
      expect(validateEmail('invalid.email')).toBe(false);
      expect(validateEmail('@example.com')).toBe(false);
      expect(validateEmail('user@')).toBe(false);
      expect(validateEmail('')).toBe(false);
    });
  });

  describe('formatDate', () => {
    it('formats date correctly', () => {
      const date = new Date('2026-01-22');
      expect(formatDate(date)).toBe('January 22, 2026');
    });

    it('handles different dates', () => {
      const date1 = new Date('2025-12-25');
      const date2 = new Date('2026-03-15');
      
      expect(formatDate(date1)).toContain('December');
      expect(formatDate(date2)).toContain('March');
    });
  });

  describe('truncateString', () => {
    it('truncates strings longer than specified length', () => {
      expect(truncateString('Hello World', 5)).toBe('Hello...');
      expect(truncateString('This is a long text', 10)).toBe('This is a ...');
    });

    it('does not truncate strings shorter than specified length', () => {
      expect(truncateString('Hi', 5)).toBe('Hi');
      expect(truncateString('Test', 10)).toBe('Test');
    });

    it('handles edge cases', () => {
      expect(truncateString('', 5)).toBe('');
      expect(truncateString('a', 1)).toBe('a');
    });
  });
});
