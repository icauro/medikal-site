# Testing Guidelines for Medikal Site

## Quick Start

```bash
# Run all tests
npm run test

# Run tests in watch mode
npm run test -- --watch

# Run specific test file
npm run test -- ProtectedRoute.test

# Generate coverage report
npm run test:coverage

# Open test UI dashboard
npm run test:ui
```

## Test Structure

Each test file follows this pattern:

```typescript
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen } from '@testing-library/react';

describe('ComponentName', () => {
  beforeEach(() => {
    // Setup before each test
  });

  it('should do something specific', () => {
    // Arrange
    // Act
    // Assert
  });
});
```

## Testing Patterns by Type

### Component Tests
- Use `@testing-library/react` for rendering
- Mock external dependencies (hooks, API calls)
- Test user interactions with `userEvent`
- Test accessibility attributes

**File: [ProtectedRoute.test.tsx](app/components/ProtectedRoute.test.tsx)**
```typescript
// Mock the custom hook
vi.mock('@/lib/contexts/AuthContext');

// Test role-based access
it('grants access to admin users', () => {
  (useAuth as any).mockReturnValue({ 
    role: 'admin' 
  });
});
```

### Hook Tests
- Use React Testing Library's renderHook
- Test state changes and side effects
- Mock external services

**File: [lib/hooks/useUserProfile.test.ts](lib/hooks/useUserProfile.test.ts)** (create as needed)
```typescript
import { renderHook, act } from '@testing-library/react';

it('fetches user profile on mount', async () => {
  const { result } = renderHook(() => useUserProfile());
  await waitFor(() => expect(result.current.profile).toBeDefined());
});
```

### Utility/Function Tests
- No rendering needed
- Test inputs and outputs
- Test edge cases

**File: [lib/utils.test.ts](lib/utils.test.ts)**
```typescript
it('validates email correctly', () => {
  expect(validateEmail('test@example.com')).toBe(true);
  expect(validateEmail('invalid')).toBe(false);
});
```

### Constants and Types Tests
- Verify constant values
- Check type definitions
- Test enum-like structures

**File: [lib/types.test.ts](lib/types.test.ts)**
```typescript
it('includes all required roles', () => {
  expect(USER_ROLES).toContain('patient');
  expect(USER_ROLES).toContain('admin');
});
```

## Mocking Patterns

### Mocking Next.js Hooks
```typescript
vi.mock('next/navigation');
const mockPush = vi.fn();
(useRouter as any).mockReturnValue({ push: mockPush });
```

### Mocking Custom Hooks
```typescript
vi.mock('@/lib/contexts/AuthContext');
(useAuth as any).mockReturnValue({
  user: { id: '123', email: 'test@example.com' },
  loading: false,
});
```

### Mocking API Calls
```typescript
vi.mock('@/lib/supabase');
(supabase.from as any).mockReturnValue({
  select: vi.fn().mockReturnValue({
    eq: vi.fn().mockResolvedValue({ data: mockData }),
  }),
});
```

## Critical User Flows to Test

### Authentication Flow
- ✅ [ProtectedRoute.test.tsx](app/components/ProtectedRoute.test.tsx) - Role-based access control
- TODO: Google login flow
- TODO: Logout flow
- TODO: Profile creation (pending_gdpr → active)

### Onboarding State Machine
- TODO: GDPR consent (pending_gdpr → pending_role)
- TODO: Role selection (pending_role → pending_personal_data)
- TODO: Personal data submission (pending_personal_data → active)
- TODO: Redirect logic in SignupFlowManager

### Two-Way Linking (Admin)
- TODO: User ↔ Listing linking
- TODO: Automatic sync on both sides
- TODO: Permission checks (admin only)

### Support Tickets
- TODO: Create ticket (authenticated users)
- TODO: Admin response
- TODO: Status transitions

## Coverage Goals

Current coverage by module:
- Components: 30%
- Hooks: 0%
- Utils: 20%
- Auth/Security: 25%

**Target: 70%+ coverage** for core auth, components, and utilities.

## Debugging Tests

### View detailed test output
```bash
npm run test -- --reporter=verbose
```

### Use test UI for visual debugging
```bash
npm run test:ui
```

### Add debug statements
```typescript
import { screen, debug } from '@testing-library/react';

// Print DOM to console
debug();

// Or specific element
debug(screen.getByRole('button'));
```

## Common Assertions

```typescript
// Presence
expect(element).toBeInTheDocument();
expect(element).not.toBeInTheDocument();

// Text/Content
expect(screen.getByText('Hello')).toBeInTheDocument();

// Attributes
expect(button).toHaveAttribute('disabled');
expect(input).toHaveValue('text');

// Visibility
expect(element).toBeVisible();
expect(element).toHaveClass('active');

// Function calls
expect(mockFunction).toHaveBeenCalled();
expect(mockFunction).toHaveBeenCalledWith('arg');
```

## Resources

- [Vitest Docs](https://vitest.dev/)
- [React Testing Library](https://testing-library.com/react)
- [Testing Best Practices](https://kentcdodds.com/blog/common-mistakes-with-react-testing-library)
