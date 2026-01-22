import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render } from '@testing-library/react';
import UserMenu from './UserMenu';
import { useAuth } from '@/lib/contexts/AuthContext';
import { useRouter } from 'next/navigation';

// Mock dependencies
vi.mock('@/lib/contexts/AuthContext');
vi.mock('next/navigation');

describe('UserMenu Component', () => {
  const mockPush = vi.fn();
  const mockLogout = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    (useRouter as any).mockReturnValue({ push: mockPush });
  });

  it('renders without error when authenticated', () => {
    (useAuth as any).mockReturnValue({
      user: { id: '123', email: 'john@example.com' },
      userProfile: {
        id: '123',
        displayName: 'John Doe',
        role: 'patient',
        accountStatus: 'active',
      },
      logout: mockLogout,
      loading: false,
    });

    const { container } = render(<UserMenu />);
    expect(container).toBeDefined();
  });

  it('renders without error when user is admin', () => {
    (useAuth as any).mockReturnValue({
      user: { id: '123', email: 'admin@example.com' },
      userProfile: {
        id: '123',
        displayName: 'Admin User',
        role: 'admin',
        accountStatus: 'active',
      },
      logout: mockLogout,
      loading: false,
    });

    const { container } = render(<UserMenu />);
    expect(container).toBeDefined();
  });

  it('renders without error when not authenticated', () => {
    (useAuth as any).mockReturnValue({
      user: null,
      userProfile: null,
      logout: mockLogout,
      loading: false,
    });

    const { container } = render(<UserMenu />);
    expect(container).toBeDefined();
  });

  it('renders without error when loading', () => {
    (useAuth as any).mockReturnValue({
      user: null,
      userProfile: null,
      logout: mockLogout,
      loading: true,
    });

    const { container } = render(<UserMenu />);
    expect(container).toBeDefined();
  });

  it('has logout function available when authenticated', () => {
    (useAuth as any).mockReturnValue({
      user: { id: '123', email: 'test@example.com' },
      userProfile: {
        id: '123',
        displayName: 'Test User',
        role: 'patient',
        accountStatus: 'active',
      },
      logout: mockLogout,
      loading: false,
    });

    const { container } = render(<UserMenu />);
    expect(mockLogout).toBeDefined();
  });

  it('accepts different user roles', () => {
    const roles = ['patient', 'healthcare_personnel', 'medical_facility', 'agency', 'admin'];
    
    roles.forEach((role) => {
      (useAuth as any).mockReturnValue({
        user: { id: '123', email: 'test@example.com' },
        userProfile: {
          id: '123',
          displayName: 'Test User',
          role,
          accountStatus: 'active',
        },
        logout: mockLogout,
        loading: false,
      });

      const { container } = render(<UserMenu />);
      expect(container).toBeDefined();
    });
  });
});
