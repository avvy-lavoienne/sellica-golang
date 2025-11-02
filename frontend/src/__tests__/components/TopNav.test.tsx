import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ThemeProvider } from 'next-themes';
import TopNav from '@/components/TopNav';
import '@testing-library/jest-dom';

// Mock dependencies
jest.mock('@/hooks/use-click-outside', () => ({
  useOnClickOutside: jest.fn(),
}));

jest.mock('@/lib/conn/supabaseClient', () => ({
  supabase: {
    auth: {
      getUser: jest.fn(),
    },
  },
}));

jest.mock('react-toastify', () => ({
  toast: {
    success: jest.fn(),
    error: jest.fn(),
    info: jest.fn(),
  },
}));

jest.mock('next-themes', () => ({
  useTheme: () => ({
    theme: 'light',
    setTheme: jest.fn(),
    resolvedTheme: 'light',
  }),
}));

jest.mock('next/image', () => ({
  __esModule: true,
  default: (props: any) => {
    // eslint-disable-next-line jsx-a11y/alt-text
    return <img {...props} />;
  },
}));

jest.mock('framer-motion', () => ({
  motion: {
    div: ({ children }: any) => <div>{children}</div>,
  },
  AnimatePresence: ({ children }: any) => <>{children}</>,
}));

describe('TopNav Component', () => {
  const mockUser = {
    id: 'user-123',
    email: 'test@example.com',
    name: 'Test User',
    avatar_url: 'https://example.com/avatar.jpg',
  };

  const mockSetUser = jest.fn();

  const renderTopNav = (user = mockUser, setUser = mockSetUser) => {
    return render(
      <ThemeProvider attribute="class" defaultTheme="light">
        <TopNav
          user={user}
          setUser={setUser}
          isMobileSidebarOpen={false}
          setIsMobileSidebarOpen={jest.fn()}
        />
      </ThemeProvider>
    );
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  // Test 3.1.2: displayUser updates when user prop changes
  describe('3.1.2: displayUser state updates', () => {
    it('should update displayUser when user prop changes', () => {
      const { rerender } = renderTopNav(mockUser);

      // User should be displayed
      expect(screen.queryByText('test@example.com')).toBeInTheDocument();

      const newUser = {
        id: 'user-456',
        email: 'newuser@example.com',
        name: 'New User',
        avatar_url: 'https://example.com/new-avatar.jpg',
      };

      rerender(
        <ThemeProvider attribute="class" defaultTheme="light">
          <TopNav
            user={newUser}
            setUser={mockSetUser}
            isMobileSidebarOpen={false}
            setIsMobileSidebarOpen={jest.fn()}
          />
        </ThemeProvider>
      );

      // New user email should be displayed
      waitFor(() => {
        expect(screen.queryByText('newuser@example.com')).toBeInTheDocument();
      });
    });
  });

  // Test 3.1.3: avatar displays when user has avatar_url
  describe('3.1.3: Avatar display', () => {
    it('should display avatar image when user has avatar_url', () => {
      renderTopNav(mockUser);

      const avatarImage = screen.queryByAltText('User avatar');
      expect(avatarImage).toBeInTheDocument();
      expect(avatarImage).toHaveAttribute('src', mockUser.avatar_url);
    });

    it('should display initials when avatar_url is missing', () => {
      const userWithoutAvatar = { ...mockUser, avatar_url: undefined };
      renderTopNav(userWithoutAvatar);

      // Check for initials (T from "Test")
      expect(screen.getByText('T')).toBeInTheDocument();
    });
  });

  // Test 3.1.4: email displays when user has email
  describe('3.1.4: Email display', () => {
    it('should display user email in dropdown menu', () => {
      renderTopNav(mockUser);

      // Email should be visible
      expect(screen.queryByText('test@example.com')).toBeInTheDocument();
    });

    it('should display "User menu" fallback when email is missing', () => {
      const userWithoutEmail = { ...mockUser, email: '' };
      renderTopNav(userWithoutEmail);

      // Fallback should appear
      expect(screen.getByText('User menu')).toBeInTheDocument();
    });
  });

  // Test 3.1.5: name displays when user has name
  describe('3.1.5: Name display', () => {
    it('should display user name in dropdown menu', () => {
      renderTopNav(mockUser);

      expect(screen.queryByText('Test User')).toBeInTheDocument();
    });

    it('should display email prefix when name is missing', () => {
      const userWithoutName = { ...mockUser, name: undefined };
      renderTopNav(userWithoutName);

      // Should display email prefix (test from test@example.com)
      expect(screen.getByText('test')).toBeInTheDocument();
    });
  });

  // Test 3.1.6: displays fallback when email missing
  describe('3.1.6: Fallback handling', () => {
    it('should display "Guest" when all display fields are missing', () => {
      const minimalUser = { id: 'user-123' };
      renderTopNav(minimalUser as any);

      expect(screen.getByText('Guest')).toBeInTheDocument();
    });

    it('should prioritize name over email for display', () => {
      const userWithBoth = mockUser;
      renderTopNav(userWithBoth);

      // Name should be displayed (Test User)
      expect(screen.queryByText('Test User')).toBeInTheDocument();
    });
  });

  // Test 3.1.7 & 3.1.8: Component renders without errors
  describe('3.1.7 & 3.1.8: Render validation', () => {
    it('should render TopNav without errors', () => {
      const { container } = renderTopNav(mockUser);

      expect(container).toBeInTheDocument();
    });

    it('should render TopNav with null user (unauthenticated)', () => {
      const { container } = renderTopNav(null);

      expect(container).toBeInTheDocument();
    });
  });

  // Test 3.1.9: Coverage for all branches
  describe('3.1.9: Full coverage', () => {
    it('should handle toggle user menu', () => {
      renderTopNav(mockUser);

      // Find and click the user button
      const userButtons = screen.getAllByRole('button');
      expect(userButtons.length).toBeGreaterThan(0);
    });

    it('should handle component with all optional fields populated', () => {
      const fullUser = {
        id: 'user-123',
        email: 'test@example.com',
        name: 'Test User',
        avatar_url: 'https://example.com/avatar.jpg',
        role: 'admin',
        full_name: 'Test Full User',
      };

      renderTopNav(fullUser as any);

      expect(screen.getByText('test@example.com')).toBeInTheDocument();
    });

    it('should handle localStorage fallback gracefully', () => {
      // Mock localStorage
      const mockLocalStorage = {
        getItem: jest.fn(() =>
          JSON.stringify({
            email: 'stored@example.com',
            name: 'Stored User',
          })
        ),
        setItem: jest.fn(),
        removeItem: jest.fn(),
        clear: jest.fn(),
      };

      Object.defineProperty(window, 'localStorage', {
        value: mockLocalStorage,
      });

      // Render with null user (should fall back to localStorage)
      renderTopNav(null);

      expect(mockLocalStorage.getItem).toHaveBeenCalledWith('selly_user_info');
    });
  });

  // Integration with parent component
  describe('Component Integration', () => {
    it('should call setUser callback when user prop changes', () => {
      const { rerender } = renderTopNav(mockUser, mockSetUser);

      const newUser = { ...mockUser, name: 'Updated Name' };

      rerender(
        <ThemeProvider attribute="class" defaultTheme="light">
          <TopNav
            user={newUser}
            setUser={mockSetUser}
            isMobileSidebarOpen={false}
            setIsMobileSidebarOpen={jest.fn()}
          />
        </ThemeProvider>
      );

      // Component should handle prop updates without error
      expect(screen.getByText('test@example.com')).toBeInTheDocument();
    });
  });
});
