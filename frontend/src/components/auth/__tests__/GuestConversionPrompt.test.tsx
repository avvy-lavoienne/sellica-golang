/**
 * Guest Conversion Prompt Component Tests
 * Tests for the guest-to-auth conversion UI component
 */

import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { jest } from '@jest/globals'
import { GuestConversionPrompt } from '../GuestConversionPrompt'
import { GuestSessionData, UserRegistrationData, ConversionResult } from '../types'

// Mock framer-motion
jest.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: any) => <div {...props}>{children}</div>,
  },
  AnimatePresence: ({ children }: any) => <>{children}</>,
}))

// Mock react-toastify
jest.mock('react-toastify', () => ({
  toast: {
    success: jest.fn(),
    error: jest.fn(),
  },
}))

// Mock UI components
jest.mock('@/components/ui/button', () => ({
  Button: ({ children, onClick, ...props }: any) => (
    <button onClick={onClick} {...props}>
      {children}
    </button>
  ),
}))

jest.mock('@/components/ui/card', () => ({
  Card: ({ children, ...props }: any) => <div {...props}>{children}</div>,
  CardContent: ({ children, ...props }: any) => <div {...props}>{children}</div>,
  CardDescription: ({ children, ...props }: any) => <div {...props}>{children}</div>,
  CardHeader: ({ children, ...props }: any) => <div {...props}>{children}</div>,
  CardTitle: ({ children, ...props }: any) => <h2 {...props}>{children}</h2>,
}))

jest.mock('@/components/ui/badge', () => ({
  Badge: ({ children, ...props }: any) => <span {...props}>{children}</span>,
}))

jest.mock('@/components/ui/alert', () => ({
  Alert: ({ children, ...props }: any) => <div {...props}>{children}</div>,
  AlertDescription: ({ children, ...props }: any) => <div {...props}>{children}</div>,
}))

// Mock the registration form component
jest.mock('../GuestRegistrationForm', () => ({
  GuestRegistrationForm: ({ onSubmit, onCancel }: any) => (
    <div data-testid="guest-registration-form">
      <button onClick={() => onSubmit(mockUserData)}>Submit Registration</button>
      <button onClick={onCancel}>Cancel Registration</button>
    </div>
  ),
}))

const mockGuestSessionData: GuestSessionData = {
  sessionId: 'test-session-123',
  guestUuid: 'guest-uuid-456',
  conversationHistory: [
    {
      id: '1',
      query: 'Test query 1',
      response: 'Test response 1',
      timestamp: new Date('2024-01-01'),
    },
    {
      id: '2',
      query: 'Test query 2',
      response: 'Test response 2',
      timestamp: new Date('2024-01-02'),
    },
  ],
  userPreferences: {
    language: 'id',
    theme: 'auto',
    dataFormat: 'summary',
    verbosity: 'detailed',
    notifications: true,
  },
  createdAt: new Date('2024-01-01'),
  lastAccessedAt: new Date('2024-01-10'),
  interactionCount: 5,
  conversionEligible: true,
  conversionAttempts: 0,
}

const mockUserData: UserRegistrationData = {
  email: 'test@example.com',
  password: 'TestPassword123',
  confirmPassword: 'TestPassword123',
  name: 'Test User',
  nik: '1234567890123456',
  nip: '123456789012345678',
  position: 'Test Position',
  agreeToTerms: true,
  agreeToPrivacy: true,
}

const mockConversionResult: ConversionResult = {
  success: true,
  userId: 'user-123',
  sessionId: 'session-456',
  migratedData: {
    conversationCount: 2,
    preferencesTransferred: true,
    sessionContinuity: true,
  },
}

describe('GuestConversionPrompt', () => {
  const mockOnConvert = jest.fn()
  const mockOnDismiss = jest.fn()
  const mockOnSkip = jest.fn()

  beforeEach(() => {
    jest.clearAllMocks()
    // Mock localStorage
    Object.defineProperty(window, 'localStorage', {
      value: {
        getItem: jest.fn(),
        setItem: jest.fn(),
        removeItem: jest.fn(),
      },
      writable: true,
    })
  })

  const defaultProps = {
    guestSessionData: mockGuestSessionData,
    onConvert: mockOnConvert,
    onDismiss: mockOnDismiss,
    onSkip: mockOnSkip,
  }

  describe('Initial Render', () => {
    test('renders conversion prompt with guest session data', () => {
      render(<GuestConversionPrompt {...defaultProps} />)

      expect(screen.getByText('Buat Akun SELLICA')).toBeInTheDocument()
      expect(screen.getByText(/Anda telah menggunakan SELLY sebanyak 5 kali/)).toBeInTheDocument()
      expect(screen.getByText('2 percakapan')).toBeInTheDocument()
    })

    test('shows benefits when showBenefits is true', () => {
      render(<GuestConversionPrompt {...defaultProps} showBenefits={true} />)

      expect(screen.getByText('Keuntungan membuat akun:')).toBeInTheDocument()
      expect(screen.getByText('Simpan Riwayat Chat')).toBeInTheDocument()
      expect(screen.getByText('Sinkronisasi Multi-Device')).toBeInTheDocument()
    })

    test('hides benefits when showBenefits is false', () => {
      render(<GuestConversionPrompt {...defaultProps} showBenefits={false} />)

      expect(screen.queryByText('Keuntungan membuat akun:')).not.toBeInTheDocument()
    })
  })

  describe('User Interactions', () => {
    test('triggers registration form when "Buat Akun Sekarang" is clicked', () => {
      render(<GuestConversionPrompt {...defaultProps} />)

      const createAccountButton = screen.getByText('Buat Akun Sekarang')
      fireEvent.click(createAccountButton)

      expect(screen.getByTestId('guest-registration-form')).toBeInTheDocument()
    })

    test('calls onSkip when "Nanti Saja" is clicked', () => {
      render(<GuestConversionPrompt {...defaultProps} />)

      const skipButton = screen.getByText('Nanti Saja')
      fireEvent.click(skipButton)

      expect(mockOnSkip).toHaveBeenCalledTimes(1)
    })

    test('calls onDismiss when close button is clicked', () => {
      render(<GuestConversionPrompt {...defaultProps} />)

      const closeButton = screen.getByRole('button', { name: /close/i })
      fireEvent.click(closeButton)

      expect(mockOnDismiss).toHaveBeenCalledTimes(1)
    })

    test('sets permanent dismissal in localStorage when "Jangan tampilkan lagi" is clicked', () => {
      const mockSetItem = jest.fn()
      Object.defineProperty(window, 'localStorage', {
        value: { ...window.localStorage, setItem: mockSetItem },
        writable: true,
      })

      render(<GuestConversionPrompt {...defaultProps} />)

      const permanentDismissButton = screen.getByText('Jangan tampilkan lagi')
      fireEvent.click(permanentDismissButton)

      expect(mockSetItem).toHaveBeenCalledWith('guest-conversion-dismissed', 'true')
      expect(mockOnDismiss).toHaveBeenCalledTimes(1)
    })
  })

  describe('Conversion Process', () => {
    test('handles successful conversion', async () => {
      mockOnConvert.mockResolvedValue(mockConversionResult)

      render(<GuestConversionPrompt {...defaultProps} />)

      // Start registration
      const createAccountButton = screen.getByText('Buat Akun Sekarang')
      fireEvent.click(createAccountButton)

      // Submit registration form
      const submitButton = screen.getByText('Submit Registration')
      fireEvent.click(submitButton)

      await waitFor(() => {
        expect(mockOnConvert).toHaveBeenCalledWith(mockUserData)
      })

      // Should show success state
      await waitFor(() => {
        expect(screen.getByText('Selamat!')).toBeInTheDocument()
        expect(screen.getByText(/Akun Anda berhasil dibuat/)).toBeInTheDocument()
      })
    })

    test('handles conversion error', async () => {
      const errorResult: ConversionResult = {
        success: false,
        error: 'Email sudah terdaftar',
      }
      mockOnConvert.mockResolvedValue(errorResult)

      render(<GuestConversionPrompt {...defaultProps} />)

      // Start registration
      const createAccountButton = screen.getByText('Buat Akun Sekarang')
      fireEvent.click(createAccountButton)

      // Submit registration form
      const submitButton = screen.getByText('Submit Registration')
      fireEvent.click(submitButton)

      await waitFor(() => {
        expect(screen.getByText('Email sudah terdaftar')).toBeInTheDocument()
      })

      // Should show retry option
      expect(screen.getByText('Coba Lagi')).toBeInTheDocument()
    })

    test('shows loading state during conversion', async () => {
      // Mock a delayed response
      mockOnConvert.mockImplementation(
        () => new Promise(resolve => setTimeout(() => resolve(mockConversionResult), 100))
      )

      render(<GuestConversionPrompt {...defaultProps} />)

      // Start registration
      const createAccountButton = screen.getByText('Buat Akun Sekarang')
      fireEvent.click(createAccountButton)

      // Submit registration form
      const submitButton = screen.getByText('Submit Registration')
      fireEvent.click(submitButton)

      // Should show loading state
      await waitFor(() => {
        expect(screen.getByText('Membuat Akun Anda...')).toBeInTheDocument()
      })
    })
  })

  describe('Permanent Dismissal', () => {
    test('does not render when permanently dismissed', () => {
      const mockGetItem = jest.fn().mockReturnValue('true')
      Object.defineProperty(window, 'localStorage', {
        value: { ...window.localStorage, getItem: mockGetItem },
        writable: true,
      })

      const { container } = render(<GuestConversionPrompt {...defaultProps} />)

      expect(container.firstChild).toBeNull()
    })
  })

  describe('Variant Styles', () => {
    test('applies modal variant classes', () => {
      render(<GuestConversionPrompt {...defaultProps} variant="modal" />)

      const card = screen.getByText('Buat Akun SELLICA').closest('div')
      expect(card).toHaveClass('max-w-2xl', 'mx-auto')
    })

    test('applies inline variant classes', () => {
      render(<GuestConversionPrompt {...defaultProps} variant="inline" />)

      const card = screen.getByText('Buat Akun SELLICA').closest('div')
      expect(card).toHaveClass('w-full')
    })

    test('applies banner variant classes', () => {
      render(<GuestConversionPrompt {...defaultProps} variant="banner" />)

      const card = screen.getByText('Buat Akun SELLICA').closest('div')
      expect(card).toHaveClass('w-full', 'rounded-lg')
    })
  })
})
