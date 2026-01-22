import { describe, it, expect } from 'vitest';

/**
 * Test suite for utility functions
 * Tests the convertTimestampsToDates helper function
 */

// Helper function to convert Firestore timestamps to JavaScript Dates
const convertTimestampsToDates = (data: any): any => {
  if (!data) return data;
  
  // Handle if data has seconds and nanoseconds (Firestore timestamp)
  if (data.seconds !== undefined && data.nanoseconds !== undefined) {
    return new Date(data.seconds * 1000);
  }
  
  // Handle nested objects and arrays
  if (typeof data === 'object') {
    if (Array.isArray(data)) {
      return data.map(item => convertTimestampsToDates(item));
    }
    
    const converted: any = {};
    for (const key in data) {
      converted[key] = convertTimestampsToDates(data[key]);
    }
    return converted;
  }
  
  return data;
};

describe('convertTimestampsToDates', () => {
  it('converts timestamp to date', () => {
    const timestamp = { seconds: 1640995200, nanoseconds: 0 };
    const result = convertTimestampsToDates(timestamp);
    expect(result).toBeInstanceOf(Date);
  });

  it('handles null values', () => {
    const result = convertTimestampsToDates(null);
    expect(result).toBeNull();
  });

  it('converts nested timestamps in objects', () => {
    const data = {
      createdAt: { seconds: 1640995200, nanoseconds: 0 },
      user: { name: 'Test' }
    };
    const result = convertTimestampsToDates(data);
    expect(result.createdAt).toBeInstanceOf(Date);
    expect(result.user.name).toBe('Test');
  });

  it('converts timestamps in arrays', () => {
    const data = [
      { seconds: 1640995200, nanoseconds: 0 },
      { seconds: 1640995300, nanoseconds: 0 }
    ];
    const result = convertTimestampsToDates(data);
    expect(Array.isArray(result)).toBe(true);
    expect(result[0]).toBeInstanceOf(Date);
    expect(result[1]).toBeInstanceOf(Date);
  });
});
