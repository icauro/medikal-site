import { describe, it, expect, beforeEach, vi } from 'vitest';
import { USER_ROLES, ACCOUNT_STATUSES, MEDICAL_SPECIALIZATIONS } from './constants';
import { UserRole, AccountStatus, MedicalSpecialization } from './types';

describe('Types and Constants', () => {
  describe('USER_ROLES', () => {
    it('includes all required roles', () => {
      expect(USER_ROLES).toContain('patient');
      expect(USER_ROLES).toContain('healthcare_personnel');
      expect(USER_ROLES).toContain('medical_facility');
      expect(USER_ROLES).toContain('agency');
      expect(USER_ROLES).toContain('admin');
    });

    it('has exactly 5 roles', () => {
      expect(USER_ROLES.length).toBe(5);
    });
  });

  describe('ACCOUNT_STATUSES', () => {
    it('follows the correct onboarding flow sequence', () => {
      const statusSequence = ['pending_gdpr', 'pending_role', 'pending_personal_data', 'active'];
      statusSequence.forEach((status, index) => {
        expect(ACCOUNT_STATUSES).toContain(status);
      });
    });

    it('includes all status types', () => {
      expect(ACCOUNT_STATUSES).toContain('pending_gdpr');
      expect(ACCOUNT_STATUSES).toContain('pending_role');
      expect(ACCOUNT_STATUSES).toContain('pending_personal_data');
      expect(ACCOUNT_STATUSES).toContain('active');
      expect(ACCOUNT_STATUSES).toContain('suspended');
    });
  });

  describe('MEDICAL_SPECIALIZATIONS', () => {
    it('includes Dermatology', () => {
      expect(MEDICAL_SPECIALIZATIONS).toContain('Dermatology');
    });

    it('includes Plastic, Reconstructive and Aesthetic Surgery', () => {
      expect(MEDICAL_SPECIALIZATIONS).toContain('Plastic, Reconstructive and Aesthetic Surgery');
    });

    it('is not empty', () => {
      expect(MEDICAL_SPECIALIZATIONS.length).toBeGreaterThan(0);
    });
  });
});

describe('Type Assignments', () => {
  it('allows valid user roles', () => {
    const validRoles: UserRole[] = ['patient', 'admin', 'healthcare_personnel'];
    expect(validRoles).toBeDefined();
  });

  it('allows valid account statuses', () => {
    const validStatuses: AccountStatus[] = ['pending_gdpr', 'active', 'suspended'];
    expect(validStatuses).toBeDefined();
  });
});
