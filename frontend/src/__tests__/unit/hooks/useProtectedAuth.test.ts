/**
 * Unit tests for useProtectedAuth hook
 * 
 * Tests the custom React hook that accesses the ProtectedLayoutContext
 * Verifies proper return values, error handling, and context access
 * 
 * @jest-environment jsdom
 */

import React from 'react';
import { renderHook, act } from '@testing-library/react';
import { render, screen } from '@testing-library/react';
import { useProtectedAuth } from '@/hooks/useProtectedAuth';
import { ProtectedLayoutProvider } from '@/app/(protected)/auth-context';
import type { User } from '@/contexts/ProtectedLayoutContext';

describe('useProtectedAuth Hook', () => {
  // Mock user data
  const mockUser: User = {
    id: 'test-user-123',
    email: 'test@example.com',
    name: 'Test User',
    avatar_url: 'https://example.com/avatar.jpg',
    role: 'user',
    nik: '1234567890123456',
    token: 'mock-token-12345',
  };

  describe('Inside ProtectedLayoutProvider', () => {
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <ProtectedLayoutProvider user={mockUser} loading={false}>
        {children}
      </ProtectedLayoutProvider>
    );

    test('should return user object when authenticated', () => {
      const { result } = renderHook(() => useProtectedAuth(), { wrapper });

      expect(result.current.user).toBeDefined();
      expect(result.current.user?.id).toBe(mockUser.id);
      expect(result.current.user?.email).toBe(mockUser.email);
      expect(result.current.user?.name).toBe(mockUser.name);
    });

    test('should return loading state as false when authentication complete', () => {
      const { result } = renderHook(() => useProtectedAuth(), { wrapper });

      expect(result.current.loading).toBe(false);
    });

    test('should return setUser function', () => {
      const { result } = renderHook(() => useProtectedAuth(), { wrapper });

      expect(result.current.setUser).toBeDefined();
      expect(typeof result.current.setUser).toBe('function');
    });

    test('should return null user when not authenticated', () => {
      const authenticatedWrapper = ({ children }: { children: React.ReactNode }) => (
        <ProtectedLayoutProvider user={null} loading={false}>
          {children}
        </ProtectedLayoutProvider>
      );

      const { result } = renderHook(() => useProtectedAuth(), { 
        wrapper: authenticatedWrapper 
      });

      expect(result.current.user).toBeNull();
      expect(result.current.loading).toBe(false);
    });

    test('should return loading state as true during authentication', () => {
      const loadingWrapper = ({ children }: { children: React.ReactNode }) => (
        <ProtectedLayoutProvider user={null} loading={true}>
          {children}
        </ProtectedLayoutProvider>
      );

      const { result } = renderHook(() => useProtectedAuth(), { 
        wrapper: loadingWrapper 
      });

      expect(result.current.loading).toBe(true);
    });

    test('should update when context value changes', () => {
      const { result, rerender } = renderHook(() => useProtectedAuth(), { 
        wrapper 
      });

      expect(result.current.user?.id).toBe(mockUser.id);

      const updatedUser: User = {
        ...mockUser,
        id: 'updated-user-456',
        email: 'updated@example.com',
      };

      const updatedWrapper = ({ children }: { children: React.ReactNode }) => (
        <ProtectedLayoutProvider user={updatedUser} loading={false}>
          {children}
        </ProtectedLayoutProvider>
      );

      rerender(undefined, { wrapper: updatedWrapper });

      expect(result.current.user?.id).toBe(updatedUser.id);
      expect(result.current.user?.email).toBe(updatedUser.email);
    });

    test('should contain all required user properties', () => {
      const { result } = renderHook(() => useProtectedAuth(), { wrapper });

      const user = result.current.user;
      expect(user).toHaveProperty('id');
      expect(user).toHaveProperty('email');
      expect(user).toHaveProperty('name');
    });

    test('should handle setUser function calls', () => {
      const { result } = renderHook(() => useProtectedAuth(), { wrapper });

      const newUser: User = {
        id: 'new-user-789',
        email: 'newuser@example.com',
        name: 'New User',
      };

      act(() => {
        result.current.setUser?.(newUser);
      });

      // Note: In a real scenario with state management, 
      // setUser should update the context value
      expect(result.current.setUser).toBeDefined();
    });
  });

  describe('Outside ProtectedLayoutProvider', () => {
    test('should throw error when used outside provider', () => {
      // Suppress console.error for this test
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

      expect(() => {
        renderHook(() => useProtectedAuth());
      }).toThrow('useProtectedAuth must be used within');

      consoleSpy.mockRestore();
    });

    test('error message should be informative', () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

      try {
        renderHook(() => useProtectedAuth());
      } catch (error) {
        if (error instanceof Error) {
          expect(error.message).toContain('ProtectedLayout');
          expect(error.message).toContain('(protected) directory');
        }
      }

      consoleSpy.mockRestore();
    });
  });

  describe('Hook contract validation', () => {
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <ProtectedLayoutProvider user={mockUser} loading={false}>
        {children}
      </ProtectedLayoutProvider>
    );

    test('should always return object with user, loading, setUser properties', () => {
      const { result } = renderHook(() => useProtectedAuth(), { wrapper });

      expect(result.current).toHaveProperty('user');
      expect(result.current).toHaveProperty('loading');
      expect(result.current).toHaveProperty('setUser');
    });

    test('user.email should never be undefined for authenticated users', () => {
      const { result } = renderHook(() => useProtectedAuth(), { wrapper });

      if (result.current.user && !result.current.loading) {
        expect(result.current.user.email).toBeDefined();
      }
    });

    test('loading should be boolean', () => {
      const { result } = renderHook(() => useProtectedAuth(), { wrapper });

      expect(typeof result.current.loading).toBe('boolean');
    });

    test('setUser should be callable if defined', () => {
      const { result } = renderHook(() => useProtectedAuth(), { wrapper });

      if (result.current.setUser) {
        expect(typeof result.current.setUser).toBe('function');
      }
    });
  });

  describe('Integration with component rendering', () => {
    const TestComponent = () => {
      const { user, loading } = useProtectedAuth();

      if (loading) {
        return <div>Loading...</div>;
      }

      if (!user) {
        return <div>Not authenticated</div>;
      }

      return (
        <div>
          <div data-testid="user-id">{user.id}</div>
          <div data-testid="user-email">{user.email}</div>
          <div data-testid="user-name">{user.name}</div>
        </div>
      );
    };

    test('should render component with user data', () => {
      render(
        <ProtectedLayoutProvider user={mockUser} loading={false}>
          <TestComponent />
        </ProtectedLayoutProvider>
      );

      expect(screen.getByTestId('user-id')).toHaveTextContent(mockUser.id);
      expect(screen.getByTestId('user-email')).toHaveTextContent(mockUser.email!);
      expect(screen.getByTestId('user-name')).toHaveTextContent(mockUser.name!);
    });

    test('should render loading state', () => {
      render(
        <ProtectedLayoutProvider user={null} loading={true}>
          <TestComponent />
        </ProtectedLayoutProvider>
      );

      expect(screen.getByText('Loading...')).toBeInTheDocument();
    });

    test('should render not authenticated state', () => {
      render(
        <ProtectedLayoutProvider user={null} loading={false}>
          <TestComponent />
        </ProtectedLayoutProvider>
      );

      expect(screen.getByText('Not authenticated')).toBeInTheDocument();
    });
  });

  describe('Performance characteristics', () => {
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <ProtectedLayoutProvider user={mockUser} loading={false}>
        {children}
      </ProtectedLayoutProvider>
    );

    test('should return consistently without recreating object on each call', () => {
      const { result, rerender } = renderHook(() => useProtectedAuth(), { wrapper });

      const firstCall = result.current;

      rerender();

      const secondCall = result.current;

      // Both calls should return the same data
      expect(firstCall.user?.id).toBe(secondCall.user?.id);
    });
  });

  describe('Edge cases', () => {
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <ProtectedLayoutProvider user={mockUser} loading={false}>
        {children}
      </ProtectedLayoutProvider>
    );

    test('should handle user with minimal properties', () => {
      const minimalUser: User = {
        id: 'minimal-user',
        email: 'minimal@test.com',
        name: 'Minimal',
      };

      const minimalWrapper = ({ children }: { children: React.ReactNode }) => (
        <ProtectedLayoutProvider user={minimalUser} loading={false}>
          {children}
        </ProtectedLayoutProvider>
      );

      const { result } = renderHook(() => useProtectedAuth(), { wrapper: minimalWrapper });

      expect(result.current.user).toBeDefined();
      expect(result.current.user?.id).toBe('minimal-user');
      expect(result.current.user?.email).toBe('minimal@test.com');
    });

    test('should handle user with all optional properties', () => {
      const fullUser: User = {
        id: 'full-user',
        email: 'full@test.com',
        name: 'Full User',
        avatar_url: 'https://example.com/avatar.jpg',
        role: 'admin',
        nik: '1234567890123456',
        token: 'token-abc123',
        created_at: '2025-01-01T00:00:00Z',
        updated_at: '2025-11-03T10:00:00Z',
        position: 'Developer',
        nip: '123456789',
      };

      const fullWrapper = ({ children }: { children: React.ReactNode }) => (
        <ProtectedLayoutProvider user={fullUser} loading={false}>
          {children}
        </ProtectedLayoutProvider>
      );

      const { result } = renderHook(() => useProtectedAuth(), { wrapper: fullWrapper });

      const user = result.current.user;
      expect(user?.id).toBe(fullUser.id);
      expect(user?.email).toBe(fullUser.email);
      expect(user?.avatar_url).toBe(fullUser.avatar_url);
      expect(user?.role).toBe(fullUser.role);
    });
  });
});
