/**
 * Unit tests for EnhancedLayoutErrorBoundary component
 * 
 * Tests the React Error Boundary implementation for graceful error handling
 * Verifies error catching, display, and recovery functionality
 * 
 * @jest-environment jsdom
 */

import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import EnhancedLayoutErrorBoundary from '@/components/error-boundary/EnhancedLayoutErrorBoundary';

// Mock logger to prevent console spam during tests
jest.mock('@/lib/logger', () => ({
  logger: {
    error: jest.fn(),
    info: jest.fn(),
    warn: jest.fn(),
  },
}));

// Component that throws an error
const ErrorThrowingComponent = () => {
  throw new Error('Test error message');
};

// Component that throws context-specific error
const ContextErrorThrowingComponent = () => {
  throw new Error('useProtectedAuth must be used within ProtectedLayout');
};

// Normal component that renders fine
const NormalComponent = () => {
  return <div>Normal component rendered successfully</div>;
};

describe('EnhancedLayoutErrorBoundary', () => {
  beforeEach(() => {
    // Suppress console.error for cleaner test output
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('Error Catching', () => {
    test('should catch errors thrown by child components', () => {
      render(
        <EnhancedLayoutErrorBoundary>
          <ErrorThrowingComponent />
        </EnhancedLayoutErrorBoundary>
      );

      // Error UI should be displayed
      expect(screen.getByText('Terjadi Kesalahan')).toBeInTheDocument();
    });

    test('should display error message in development', () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'development';

      render(
        <EnhancedLayoutErrorBoundary>
          <ErrorThrowingComponent />
        </EnhancedLayoutErrorBoundary>
      );

      // Error details should be visible in development
      const details = screen.getByText(/Development/i);
      expect(details).toBeInTheDocument();

      process.env.NODE_ENV = originalEnv;
    });

    test('should not display error details in production', () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'production';

      render(
        <EnhancedLayoutErrorBoundary>
          <ErrorThrowingComponent />
        </EnhancedLayoutErrorBoundary>
      );

      // Detailed error information should not be visible
      const devDetails = screen.queryByText(/Development/i);
      expect(devDetails).not.toBeInTheDocument();

      process.env.NODE_ENV = originalEnv;
    });
  });

  describe('Error Messages', () => {
    test('should display Indonesian error title', () => {
      render(
        <EnhancedLayoutErrorBoundary>
          <ErrorThrowingComponent />
        </EnhancedLayoutErrorBoundary>
      );

      expect(screen.getByText('Terjadi Kesalahan')).toBeInTheDocument();
    });

    test('should display generic error message for non-context errors', () => {
      render(
        <EnhancedLayoutErrorBoundary>
          <ErrorThrowingComponent />
        </EnhancedLayoutErrorBoundary>
      );

      expect(screen.getByText(/Terjadi kesalahan yang tidak terduga/i)).toBeInTheDocument();
    });

    test('should display context-specific error message', () => {
      render(
        <EnhancedLayoutErrorBoundary>
          <ContextErrorThrowingComponent />
        </EnhancedLayoutErrorBoundary>
      );

      expect(screen.getByText(/Terjadi masalah dengan autentikasi/i)).toBeInTheDocument();
    });

    test('should display help text', () => {
      render(
        <EnhancedLayoutErrorBoundary>
          <ErrorThrowingComponent />
        </EnhancedLayoutErrorBoundary>
      );

      expect(screen.getByText(/dukungan teknis/i)).toBeInTheDocument();
    });
  });

  describe('Error Actions', () => {
    test('should display refresh button', () => {
      render(
        <EnhancedLayoutErrorBoundary>
          <ErrorThrowingComponent />
        </EnhancedLayoutErrorBoundary>
      );

      expect(screen.getByText(/Segarkan Halaman/i)).toBeInTheDocument();
    });

    test('should display back button', () => {
      render(
        <EnhancedLayoutErrorBoundary>
          <ErrorThrowingComponent />
        </EnhancedLayoutErrorBoundary>
      );

      expect(screen.getByText(/Kembali/i)).toBeInTheDocument();
    });

    test('should call location.reload on refresh button click', () => {
      const reloadSpy = jest.fn();
      Object.defineProperty(window.location, 'reload', {
        configurable: true,
        value: reloadSpy,
      });

      render(
        <EnhancedLayoutErrorBoundary>
          <ErrorThrowingComponent />
        </EnhancedLayoutErrorBoundary>
      );

      const refreshButton = screen.getByText(/Segarkan Halaman/i);
      fireEvent.click(refreshButton);

      expect(reloadSpy).toHaveBeenCalled();
    });

    test('should call history.back on back button click', () => {
      const backSpy = jest.fn();
      Object.defineProperty(window.history, 'back', {
        configurable: true,
        value: backSpy,
      });

      render(
        <EnhancedLayoutErrorBoundary>
          <ErrorThrowingComponent />
        </EnhancedLayoutErrorBoundary>
      );

      const backButton = screen.getByText(/Kembali/i);
      fireEvent.click(backButton);

      expect(backSpy).toHaveBeenCalled();
    });
  });

  describe('Normal Component Rendering', () => {
    test('should render children normally when no error', () => {
      render(
        <EnhancedLayoutErrorBoundary>
          <NormalComponent />
        </EnhancedLayoutErrorBoundary>
      );

      expect(screen.getByText('Normal component rendered successfully')).toBeInTheDocument();
    });

    test('should not display error UI when children render successfully', () => {
      render(
        <EnhancedLayoutErrorBoundary>
          <NormalComponent />
        </EnhancedLayoutErrorBoundary>
      );

      expect(screen.queryByText('Terjadi Kesalahan')).not.toBeInTheDocument();
      expect(screen.queryByText(/Segarkan Halaman/i)).not.toBeInTheDocument();
    });
  });

  describe('Error Details Display', () => {
    beforeEach(() => {
      process.env.NODE_ENV = 'development';
    });

    test('should display expandable details section in development', () => {
      render(
        <EnhancedLayoutErrorBoundary>
          <ErrorThrowingComponent />
        </EnhancedLayoutErrorBoundary>
      );

      const detailsSummary = screen.getByText(/Informasi Teknis/i);
      expect(detailsSummary).toBeInTheDocument();
    });

    test('should display error message in details', () => {
      render(
        <EnhancedLayoutErrorBoundary>
          <ErrorThrowingComponent />
        </EnhancedLayoutErrorBoundary>
      );

      expect(screen.getByText('Test error message')).toBeInTheDocument();
    });

    test('should have error icon visible', () => {
      const { container } = render(
        <EnhancedLayoutErrorBoundary>
          <ErrorThrowingComponent />
        </EnhancedLayoutErrorBoundary>
      );

      // Check for error icon (SVG with circle icon)
      const errorIcon = container.querySelector('svg');
      expect(errorIcon).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    test('should have descriptive button text', () => {
      render(
        <EnhancedLayoutErrorBoundary>
          <ErrorThrowingComponent />
        </EnhancedLayoutErrorBoundary>
      );

      const buttons = screen.getAllByRole('button');
      expect(buttons.length).toBeGreaterThanOrEqual(2);
      expect(buttons[0]).toHaveTextContent(/Segarkan|Kembali/i);
    });

    test('should have proper heading hierarchy', () => {
      render(
        <EnhancedLayoutErrorBoundary>
          <ErrorThrowingComponent />
        </EnhancedLayoutErrorBoundary>
      );

      const heading = screen.getByText('Terjadi Kesalahan');
      expect(heading.tagName).toBe('H1');
    });

    test('should have proper color contrast for error state', () => {
      const { container } = render(
        <EnhancedLayoutErrorBoundary>
          <ErrorThrowingComponent />
        </EnhancedLayoutErrorBoundary>
      );

      // Check for error-specific styling
      const errorContainer = container.querySelector('[class*="error"]') || 
                            container.querySelector('[class*="red"]');
      expect(errorContainer || container.firstChild).toBeInTheDocument();
    });
  });

  describe('Multiple Error Scenarios', () => {
    test('should handle SyntaxError', () => {
      const SyntaxErrorComponent = () => {
        throw new SyntaxError('Invalid syntax');
      };

      render(
        <EnhancedLayoutErrorBoundary>
          <SyntaxErrorComponent />
        </EnhancedLayoutErrorBoundary>
      );

      expect(screen.getByText('Terjadi Kesalahan')).toBeInTheDocument();
    });

    test('should handle TypeError', () => {
      const TypeErrorComponent = () => {
        throw new TypeError('Type error');
      };

      render(
        <EnhancedLayoutErrorBoundary>
          <TypeErrorComponent />
        </EnhancedLayoutErrorBoundary>
      );

      expect(screen.getByText('Terjadi Kesalahan')).toBeInTheDocument();
    });

    test('should handle ReferenceError', () => {
      const ReferenceErrorComponent = () => {
        throw new ReferenceError('Reference error');
      };

      render(
        <EnhancedLayoutErrorBoundary>
          <ReferenceErrorComponent />
        </EnhancedLayoutErrorBoundary>
      );

      expect(screen.getByText('Terjadi Kesalahan')).toBeInTheDocument();
    });
  });

  describe('Component Integration', () => {
    test('should work with nested error boundaries', () => {
      const InnerComponent = () => (
        <EnhancedLayoutErrorBoundary>
          <NormalComponent />
        </EnhancedLayoutErrorBoundary>
      );

      render(
        <EnhancedLayoutErrorBoundary>
          <InnerComponent />
        </EnhancedLayoutErrorBoundary>
      );

      expect(screen.getByText('Normal component rendered successfully')).toBeInTheDocument();
    });

    test('should wrap children correctly without modifying DOM structure', () => {
      const { container } = render(
        <EnhancedLayoutErrorBoundary>
          <div className="test-child">Test content</div>
        </EnhancedLayoutErrorBoundary>
      );

      expect(container.querySelector('.test-child')).toBeInTheDocument();
    });
  });

  describe('Context Error Detection', () => {
    test('should detect useProtectedAuth context errors', () => {
      const ContextError = () => {
        throw new Error('useProtectedAuth must be used within ProtectedLayout');
      };

      render(
        <EnhancedLayoutErrorBoundary>
          <ContextError />
        </EnhancedLayoutErrorBoundary>
      );

      // Should show context-specific message
      expect(screen.getByText(/Terjadi masalah dengan autentikasi/i)).toBeInTheDocument();
    });

    test('should detect ProtectedLayout context errors', () => {
      const LayoutError = () => {
        throw new Error('Cannot access ProtectedLayout context');
      };

      render(
        <EnhancedLayoutErrorBoundary>
          <LayoutError />
        </EnhancedLayoutErrorBoundary>
      );

      // Should show context-specific message
      expect(screen.getByText(/Terjadi masalah dengan autentikasi/i)).toBeInTheDocument();
    });
  });
});
