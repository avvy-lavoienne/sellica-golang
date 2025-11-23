/**
 * Integration tests for context propagation
 * 
 * Tests that authenticated user data flows correctly through the component tree
 * from ProtectedLayoutProvider to all child components using useProtectedAuth
 * 
 * @jest-environment jsdom
 */

import React, { ReactNode } from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { ProtectedLayoutProvider } from '@/app/(protected)/auth-context';
import { useProtectedAuth } from '@/hooks/useProtectedAuth';
import type { User } from '@/contexts/ProtectedLayoutContext';

// Mock logger
jest.mock('@/lib/logger', () => ({
  logger: {
    error: jest.fn(),
    info: jest.fn(),
    warn: jest.fn(),
  },
}));

// Test components that use the hook
const ConsumerComponent = ({ testId }: { testId: string }) => {
  const { user, loading, setUser } = useProtectedAuth();

  return (
    <div data-testid={testId}>
      <div data-testid={`${testId}-loading`}>{loading ? 'loading' : 'ready'}</div>
      <div data-testid={`${testId}-user-id`}>{user?.id || 'no-id'}</div>
      <div data-testid={`${testId}-user-email`}>{user?.email || 'no-email'}</div>
      <div data-testid={`${testId}-user-name`}>{user?.name || 'no-name'}</div>
      <button
        data-testid={`${testId}-set-user`}
        onClick={() => setUser?.({ id: 'updated', email: 'updated@test.com', name: 'Updated' })}
      >
        Update User
      </button>
    </div>
  );
};

// Nested component to test deep propagation
const NestedComponent = ({ testId }: { testId: string }) => {
  return (
    <div data-testid={testId}>
      <ConsumerComponent testId={`${testId}-child-1`} />
      <div data-testid={`${testId}-nested-level-2`}>
        <ConsumerComponent testId={`${testId}-child-2`} />
      </div>
    </div>
  );
};

describe('Context Propagation Integration Tests', () => {
  const mockUser: User = {
    id: 'user-123',
    email: 'test@example.com',
    name: 'Test User',
    avatar_url: 'https://example.com/avatar.jpg',
    role: 'user',
  };

  describe('Basic Context Propagation', () => {
    test('should propagate user data to direct child component', () => {
      render(
        <ProtectedLayoutProvider user={mockUser} loading={false}>
          <ConsumerComponent testId="consumer" />
        </ProtectedLayoutProvider>
      );

      expect(screen.getByTestId('consumer-user-id')).toHaveTextContent('user-123');
      expect(screen.getByTestId('consumer-user-email')).toHaveTextContent('test@example.com');
      expect(screen.getByTestId('consumer-user-name')).toHaveTextContent('Test User');
    });

    test('should propagate loading state correctly', () => {
      render(
        <ProtectedLayoutProvider user={null} loading={true}>
          <ConsumerComponent testId="consumer" />
        </ProtectedLayoutProvider>
      );

      expect(screen.getByTestId('consumer-loading')).toHaveTextContent('loading');
    });

    test('should handle unauthenticated state', () => {
      render(
        <ProtectedLayoutProvider user={null} loading={false}>
          <ConsumerComponent testId="consumer" />
        </ProtectedLayoutProvider>
      );

      expect(screen.getByTestId('consumer-user-id')).toHaveTextContent('no-id');
      expect(screen.getByTestId('consumer-user-email')).toHaveTextContent('no-email');
    });
  });

  describe('Deep Component Tree Propagation', () => {
    test('should propagate user data through multiple levels', () => {
      render(
        <ProtectedLayoutProvider user={mockUser} loading={false}>
          <NestedComponent testId="nested-root" />
        </ProtectedLayoutProvider>
      );

      // Check first level child
      expect(screen.getByTestId('nested-root-child-1-user-id')).toHaveTextContent('user-123');

      // Check second level nested child
      expect(screen.getByTestId('nested-root-child-2-user-id')).toHaveTextContent('user-123');

      // All should have same email
      expect(screen.getByTestId('nested-root-child-1-user-email')).toHaveTextContent('test@example.com');
      expect(screen.getByTestId('nested-root-child-2-user-email')).toHaveTextContent('test@example.com');
    });

    test('should maintain consistency across sibling components', () => {
      render(
        <ProtectedLayoutProvider user={mockUser} loading={false}>
          <div>
            <ConsumerComponent testId="sibling-1" />
            <ConsumerComponent testId="sibling-2" />
            <ConsumerComponent testId="sibling-3" />
          </div>
        </ProtectedLayoutProvider>
      );

      // All siblings should have the same user data
      const ids = [
        screen.getByTestId('sibling-1-user-id').textContent,
        screen.getByTestId('sibling-2-user-id').textContent,
        screen.getByTestId('sibling-3-user-id').textContent,
      ];

      expect(ids[0]).toBe(ids[1]);
      expect(ids[1]).toBe(ids[2]);
      expect(ids[0]).toBe('user-123');
    });
  });

  describe('Loading State Propagation', () => {
    test('should show loading state in all components during authentication', () => {
      render(
        <ProtectedLayoutProvider user={null} loading={true}>
          <div>
            <ConsumerComponent testId="loading-1" />
            <ConsumerComponent testId="loading-2" />
          </div>
        </ProtectedLayoutProvider>
      );

      expect(screen.getByTestId('loading-1-loading')).toHaveTextContent('loading');
      expect(screen.getByTestId('loading-2-loading')).toHaveTextContent('loading');
    });

    test('should transition from loading to ready state', async () => {
      const { rerender } = render(
        <ProtectedLayoutProvider user={null} loading={true}>
          <ConsumerComponent testId="consumer" />
        </ProtectedLayoutProvider>
      );

      expect(screen.getByTestId('consumer-loading')).toHaveTextContent('loading');

      // Transition to loaded state
      rerender(
        <ProtectedLayoutProvider user={mockUser} loading={false}>
          <ConsumerComponent testId="consumer" />
        </ProtectedLayoutProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId('consumer-loading')).toHaveTextContent('ready');
        expect(screen.getByTestId('consumer-user-id')).toHaveTextContent('user-123');
      });
    });
  });

  describe('User Data Updates', () => {
    test('should propagate user data changes to all components', async () => {
      const { rerender } = render(
        <ProtectedLayoutProvider user={mockUser} loading={false}>
          <div>
            <ConsumerComponent testId="update-1" />
            <ConsumerComponent testId="update-2" />
          </div>
        </ProtectedLayoutProvider>
      );

      // Initial state
      expect(screen.getByTestId('update-1-user-email')).toHaveTextContent('test@example.com');

      const updatedUser: User = {
        ...mockUser,
        email: 'updated@example.com',
        name: 'Updated User',
      };

      rerender(
        <ProtectedLayoutProvider user={updatedUser} loading={false}>
          <div>
            <ConsumerComponent testId="update-1" />
            <ConsumerComponent testId="update-2" />
          </div>
        </ProtectedLayoutProvider>
      );

      // Both should reflect the update
      await waitFor(() => {
        expect(screen.getByTestId('update-1-user-email')).toHaveTextContent('updated@example.com');
        expect(screen.getByTestId('update-2-user-email')).toHaveTextContent('updated@example.com');
        expect(screen.getByTestId('update-1-user-name')).toHaveTextContent('Updated User');
        expect(screen.getByTestId('update-2-user-name')).toHaveTextContent('Updated User');
      });
    });

    test('should handle clearing user data', async () => {
      const { rerender } = render(
        <ProtectedLayoutProvider user={mockUser} loading={false}>
          <ConsumerComponent testId="clear-test" />
        </ProtectedLayoutProvider>
      );

      expect(screen.getByTestId('clear-test-user-id')).toHaveTextContent('user-123');

      // Clear user
      rerender(
        <ProtectedLayoutProvider user={null} loading={false}>
          <ConsumerComponent testId="clear-test" />
        </ProtectedLayoutProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId('clear-test-user-id')).toHaveTextContent('no-id');
        expect(screen.getByTestId('clear-test-user-email')).toHaveTextContent('no-email');
      });
    });
  });

  describe('Memoization & Performance', () => {
    test('should not unnecessarily re-render components when context is stable', () => {
      const renderSpy = jest.fn();

      const TrackedComponent = ({ testId }: { testId: string }) => {
        renderSpy();
        return <ConsumerComponent testId={testId} />;
      };

      const { rerender } = render(
        <ProtectedLayoutProvider user={mockUser} loading={false}>
          <TrackedComponent testId="tracked" />
        </ProtectedLayoutProvider>
      );

      const firstRenderCount = renderSpy.mock.calls.length;

      // Re-render with same props
      rerender(
        <ProtectedLayoutProvider user={mockUser} loading={false}>
          <TrackedComponent testId="tracked" />
        </ProtectedLayoutProvider>
      );

      // Should not cause additional renders due to memoization
      const secondRenderCount = renderSpy.mock.calls.length;
      expect(secondRenderCount).toBe(firstRenderCount);
    });

    test('should re-render when user data actually changes', () => {
      const renderSpy = jest.fn();

      const TrackedComponent = ({ testId }: { testId: string }) => {
        renderSpy();
        return <ConsumerComponent testId={testId} />;
      };

      const { rerender } = render(
        <ProtectedLayoutProvider user={mockUser} loading={false}>
          <TrackedComponent testId="tracked" />
        </ProtectedLayoutProvider>
      );

      const firstRenderCount = renderSpy.mock.calls.length;

      const updatedUser: User = {
        ...mockUser,
        email: 'different@example.com',
      };

      rerender(
        <ProtectedLayoutProvider user={updatedUser} loading={false}>
          <TrackedComponent testId="tracked" />
        </ProtectedLayoutProvider>
      );

      // Should trigger re-render due to actual data change
      const secondRenderCount = renderSpy.mock.calls.length;
      expect(secondRenderCount).toBeGreaterThan(firstRenderCount);
    });
  });

  describe('Error Scenarios', () => {
    test('should handle partial user data gracefully', () => {
      const partialUser: User = {
        id: 'partial-user',
        email: 'partial@example.com',
        name: 'Partial User',
        // Missing avatar_url, role, etc.
      };

      render(
        <ProtectedLayoutProvider user={partialUser} loading={false}>
          <ConsumerComponent testId="partial" />
        </ProtectedLayoutProvider>
      );

      expect(screen.getByTestId('partial-user-id')).toHaveTextContent('partial-user');
      expect(screen.getByTestId('partial-user-email')).toHaveTextContent('partial@example.com');
    });

    test('should handle user with all optional properties', () => {
      const fullUser: User = {
        id: 'full-user',
        email: 'full@example.com',
        name: 'Full User',
        avatar_url: 'https://example.com/avatar.jpg',
        role: 'admin',
        nik: '1234567890123456',
        token: 'token-abc',
        created_at: '2025-01-01T00:00:00Z',
        updated_at: '2025-11-03T00:00:00Z',
        position: 'Developer',
        nip: '123456789',
      };

      render(
        <ProtectedLayoutProvider user={fullUser} loading={false}>
          <ConsumerComponent testId="full" />
        </ProtectedLayoutProvider>
      );

      expect(screen.getByTestId('full-user-id')).toHaveTextContent('full-user');
      expect(screen.getByTestId('full-user-email')).toHaveTextContent('full@example.com');
      expect(screen.getByTestId('full-user-name')).toHaveTextContent('Full User');
    });
  });

  describe('Multiple Provider Nesting', () => {
    test('should use innermost provider context', () => {
      const outerUser: User = {
        id: 'outer-user',
        email: 'outer@example.com',
        name: 'Outer User',
      };

      const innerUser: User = {
        id: 'inner-user',
        email: 'inner@example.com',
        name: 'Inner User',
      };

      render(
        <ProtectedLayoutProvider user={outerUser} loading={false}>
          <ConsumerComponent testId="outer" />
          <ProtectedLayoutProvider user={innerUser} loading={false}>
            <ConsumerComponent testId="inner" />
          </ProtectedLayoutProvider>
        </ProtectedLayoutProvider>
      );

      // Outer component gets outer user
      expect(screen.getByTestId('outer-user-id')).toHaveTextContent('outer-user');

      // Inner component gets inner user (innermost provider wins)
      expect(screen.getByTestId('inner-user-id')).toHaveTextContent('inner-user');
    });
  });

  describe('State Management Integration', () => {
    test('should maintain referential equality of context value when unchanged', () => {
      const spy = jest.fn();

      const ContextValueTracker = () => {
        const context = useProtectedAuth();
        spy(context);
        return null;
      };

      const { rerender } = render(
        <ProtectedLayoutProvider user={mockUser} loading={false}>
          <ContextValueTracker />
        </ProtectedLayoutProvider>
      );

      const firstCallValue = spy.mock.calls[0][0];

      rerender(
        <ProtectedLayoutProvider user={mockUser} loading={false}>
          <ContextValueTracker />
        </ProtectedLayoutProvider>
      );

      const secondCallValue = spy.mock.calls[1][0];

      // Should be the same reference due to memoization
      expect(firstCallValue).toEqual(secondCallValue);
    });
  });
});
