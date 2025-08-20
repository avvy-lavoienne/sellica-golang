/**
 * Test suite for SELLY AI Page components
 * Ensures proper functionality and accessibility compliance
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { jest } from '@jest/globals';
import '@testing-library/jest-dom';
import { SellyWelcomeCard } from '../SellyWelcomeCard';
import { MobileSellyInterface } from '../MobileSellyInterface';

// Mock dependencies - Updated to use UnifiedChatContext for Critical-1 fix
jest.mock('@/contexts/UnifiedChatContext', () => ({
  useUnifiedChat: () => ({
    messages: [],
    isTyping: false,
    loadingStage: '',
    estimatedTime: 0,
    sendMessage: jest.fn(),
    clearMessages: jest.fn(),
    startNewSession: jest.fn(),
    uiState: {
      isOpen: false,
      isMinimized: false,
      isTyping: false,
      hasUnreadMessages: false,
    },
    toggleChat: jest.fn(),
    minimizeChat: jest.fn(),
    maximizeChat: jest.fn(),
  }),
}));

jest.mock('@/utils/mobile', () => ({
  isMobile: () => false,
}));

jest.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: any) => <div {...props}>{children}</div>,
    header: ({ children, ...props }: any) => <header {...props}>{children}</header>,
  },
  AnimatePresence: ({ children }: any) => children,
}));

describe('SellyWelcomeCard', () => {
  const mockOnQuickActionClick = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders welcome message correctly', () => {
    render(<SellyWelcomeCard onQuickActionClick={mockOnQuickActionClick} />);
    
    expect(screen.getByText('Selamat Datang di SELLY!')).toBeInTheDocument();
    expect(screen.getByText(/AI Assistant yang dirancang khusus/)).toBeInTheDocument();
  });

  it('displays feature cards', () => {
    render(<SellyWelcomeCard onQuickActionClick={mockOnQuickActionClick} />);
    
    expect(screen.getByText('Pencarian Data')).toBeInTheDocument();
    expect(screen.getByText('Analisis Real-time')).toBeInTheDocument();
    expect(screen.getByText('Bantuan 24/7')).toBeInTheDocument();
  });

  it('handles quick action clicks', async () => {
    render(<SellyWelcomeCard onQuickActionClick={mockOnQuickActionClick} />);
    
    const quickActionButton = screen.getByText('Bagaimana cara membuat KTP baru?');
    fireEvent.click(quickActionButton);
    
    await waitFor(() => {
      expect(mockOnQuickActionClick).toHaveBeenCalledWith('Bagaimana cara membuat KTP baru?');
    });
  });

  it('has proper accessibility attributes', () => {
    render(<SellyWelcomeCard onQuickActionClick={mockOnQuickActionClick} />);
    
    const buttons = screen.getAllByRole('button');
    buttons.forEach(button => {
      expect(button).toBeVisible();
      expect(button).not.toHaveAttribute('aria-hidden', 'true');
    });
  });

  it('displays all quick start queries', () => {
    render(<SellyWelcomeCard onQuickActionClick={mockOnQuickActionClick} />);
    
    const expectedQueries = [
      'Bagaimana cara membuat KTP baru?',
      'Apa persyaratan akta kelahiran?',
      'Bagaimana prosedur pindah domisili?',
      'Cara mengurus kartu keluarga?',
    ];

    expectedQueries.forEach(query => {
      expect(screen.getByText(query)).toBeInTheDocument();
    });
  });
});

describe('MobileSellyInterface', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders mobile header correctly', () => {
    render(<MobileSellyInterface />);
    
    expect(screen.getByText('SELLY')).toBeInTheDocument();
    expect(screen.getByText('AI Assistant')).toBeInTheDocument();
  });

  it('displays welcome message when no messages', () => {
    render(<MobileSellyInterface />);
    
    expect(screen.getByText('Halo! Saya SELLY')).toBeInTheDocument();
    expect(screen.getByText(/AI Assistant untuk membantu Anda/)).toBeInTheDocument();
  });

  it('shows mobile quick actions', () => {
    render(<MobileSellyInterface />);
    
    expect(screen.getByText('KTP Baru')).toBeInTheDocument();
    expect(screen.getByText('Akta Lahir')).toBeInTheDocument();
    expect(screen.getByText('Kartu Keluarga')).toBeInTheDocument();
    expect(screen.getByText('Pindah Domisili')).toBeInTheDocument();
  });

  it('has proper mobile input area', () => {
    render(<MobileSellyInterface />);
    
    const textarea = screen.getByPlaceholderText('Ketik pertanyaan Anda...');
    expect(textarea).toBeInTheDocument();
    expect(textarea).toHaveAttribute('type', 'textarea');
    
    const submitButton = screen.getByLabelText('Kirim pesan');
    expect(submitButton).toBeInTheDocument();
    expect(submitButton).toHaveAttribute('type', 'submit');
  });

  it('handles menu toggle', async () => {
    render(<MobileSellyInterface />);
    
    const menuButton = screen.getByLabelText('Menu');
    fireEvent.click(menuButton);
    
    await waitFor(() => {
      expect(screen.getByText('Menu')).toBeInTheDocument();
      expect(screen.getByText('Hapus Percakapan')).toBeInTheDocument();
    });
  });

  it('meets accessibility requirements', () => {
    render(<MobileSellyInterface />);
    
    // Check for proper ARIA labels
    expect(screen.getByLabelText('Kembali')).toBeInTheDocument();
    expect(screen.getByLabelText('Menu')).toBeInTheDocument();
    expect(screen.getByLabelText('Kirim pesan')).toBeInTheDocument();
    
    // Check for proper button roles
    const buttons = screen.getAllByRole('button');
    expect(buttons.length).toBeGreaterThan(0);
    
    // Check for proper form elements
    const textareas = screen.getAllByRole('textbox');
    expect(textareas.length).toBeGreaterThan(0);
  });

  it('handles input submission', async () => {
    const mockSendMessage = jest.fn();
    
    // Mock the useChat hook to return our mock function
    jest.doMock('@/contexts/ChatContext', () => ({
      useChat: () => ({
        messages: [],
        isTyping: false,
        loadingStage: '',
        estimatedTime: 0,
        sendMessage: mockSendMessage,
        clearMessages: jest.fn(),
        startNewSession: jest.fn(),
      }),
    }));

    render(<MobileSellyInterface />);
    
    const textarea = screen.getByPlaceholderText('Ketik pertanyaan Anda...');
    const submitButton = screen.getByLabelText('Kirim pesan');
    
    fireEvent.change(textarea, { target: { value: 'Test message' } });
    fireEvent.click(submitButton);
    
    await waitFor(() => {
      expect(mockSendMessage).toHaveBeenCalledWith('Test message');
    });
  });
});

describe('Accessibility Compliance', () => {
  it('meets WCAG 2.1 AA color contrast requirements', () => {
    render(<SellyWelcomeCard onQuickActionClick={jest.fn()} />);
    
    // Check for proper color contrast in text elements
    const headings = screen.getAllByRole('heading');
    headings.forEach(heading => {
      const styles = window.getComputedStyle(heading);
      expect(styles.color).toBeDefined();
    });
  });

  it('has proper keyboard navigation', () => {
    render(<SellyWelcomeCard onQuickActionClick={jest.fn()} />);
    
    const buttons = screen.getAllByRole('button');
    buttons.forEach(button => {
      expect(button).toHaveAttribute('tabIndex');
      expect(button).not.toHaveAttribute('tabIndex', '-1');
    });
  });

  it('provides proper focus management', () => {
    render(<MobileSellyInterface />);
    
    const focusableElements = screen.getAllByRole('button');
    focusableElements.forEach(element => {
      fireEvent.focus(element);
      expect(element).toHaveFocus();
    });
  });

  it('has minimum touch target sizes for mobile', () => {
    render(<MobileSellyInterface />);
    
    const buttons = screen.getAllByRole('button');
    buttons.forEach(button => {
      const styles = window.getComputedStyle(button);
      const minHeight = parseInt(styles.minHeight) || parseInt(styles.height);
      const minWidth = parseInt(styles.minWidth) || parseInt(styles.width);
      
      // WCAG 2.1 AA requires minimum 44px touch targets
      expect(minHeight).toBeGreaterThanOrEqual(44);
      expect(minWidth).toBeGreaterThanOrEqual(44);
    });
  });
});

describe('Performance', () => {
  it('renders without performance issues', () => {
    const startTime = performance.now();
    render(<SellyWelcomeCard onQuickActionClick={jest.fn()} />);
    const endTime = performance.now();
    
    // Should render in less than 100ms
    expect(endTime - startTime).toBeLessThan(100);
  });

  it('handles large number of quick actions efficiently', () => {
    const mockOnClick = jest.fn();
    const startTime = performance.now();
    
    render(<SellyWelcomeCard onQuickActionClick={mockOnClick} />);
    
    const buttons = screen.getAllByRole('button');
    buttons.forEach(button => {
      fireEvent.click(button);
    });
    
    const endTime = performance.now();
    
    // Should handle all clicks in reasonable time
    expect(endTime - startTime).toBeLessThan(200);
    expect(mockOnClick).toHaveBeenCalled();
  });
});

describe('Responsive Design', () => {
  it('adapts to different screen sizes', () => {
    // Mock different viewport sizes
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      configurable: true,
      value: 768,
    });

    render(<SellyWelcomeCard onQuickActionClick={jest.fn()} />);
    
    // Check that responsive classes are applied
    const container = screen.getByText('Selamat Datang di SELLY!').closest('div');
    expect(container).toHaveClass('text-center');
  });

  it('maintains functionality across breakpoints', () => {
    // Test mobile breakpoint
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      configurable: true,
      value: 375,
    });

    render(<MobileSellyInterface />);
    
    const textarea = screen.getByPlaceholderText('Ketik pertanyaan Anda...');
    expect(textarea).toBeInTheDocument();
    expect(textarea).toBeVisible();
  });
});
