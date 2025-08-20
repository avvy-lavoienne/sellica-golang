/**
 * Guest-to-Auth Conversion Integration Tests
 * End-to-end testing of the complete conversion workflow
 */

import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { jest } from '@jest/globals'
import { ChatProvider } from '@/contexts/ChatContext'
import { GuestConversionTrigger } from '@/components/chatbot/GuestConversionTrigger'

// Mock all external dependencies
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
  }),
}))

jest.mock('react-toastify', () => ({
  toast: {
    success: jest.fn(),
    error: jest.fn(),
  },
}))

jest.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: any) => <div {...props}>{children}</div>,
  },
  AnimatePresence: ({ children }: any) => <>{children}</>,
}))

// Mock Supabase
const mockSupabase = {
  auth: {
    signUp: jest.fn(),
    getSession: jest.fn(),
    admin: {
      deleteUser: jest.fn(),
    },
  },
  from: jest.fn(() => ({
    insert: jest.fn().mockResolvedValue({ error: null }),
    select: jest.fn(),
    eq: jest.fn(),
    single: jest.fn(),
  })),
}

jest.mock('@/lib/conn/supabaseClient', () => ({
  supabase: mockSupabase,
}))

// Mock session manager
const mockSessionManager = {
  getInstance: jest.fn(),
  getSession: jest.fn(),
  createSession: jest.fn(),
  updateSession: jest.fn(),
  deleteSession: jest.fn(),
}

jest.mock('@/services/session/unifiedSessionManager', () => ({
  UnifiedSessionManager: mockSessionManager,
}))

// Mock chat history hook
jest.mock('@/hooks/useChatHistory', () => ({
  useChatHistory: () => ({
    currentSession: {
      id: 'guest-session-123',
      messages: [],
    },
    config: {},
    isLoading: false,
    error: null,
    addMessage: jest.fn(),
    updateMessageStatus: jest.fn(),
    clearMessages: jest.fn(),
    startNewSession: jest.fn(),
    switchSession: jest.fn(),
    deleteSession: jest.fn(),
    getSessions: jest.fn(),
    updateConfig: jest.fn(),
  }),
}))

// Mock UI components
jest.mock('@/components/ui/button', () => ({
  Button: ({ children, onClick, disabled, ...props }: any) => (
    <button onClick={onClick} disabled={disabled} {...props}>
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

jest.mock('@/components/ui/input', () => ({
  Input: ({ onChange, ...props }: any) => (
    <input
      onChange={(e) => onChange?.(e.target.value)}
      {...props}
    />
  ),
}))

jest.mock('@/components/ui/label', () => ({
  Label: ({ children, ...props }: any) => <label {...props}>{children}</label>,
}))

jest.mock('@/components/ui/checkbox', () => ({
  Checkbox: ({ onCheckedChange, ...props }: any) => (
    <input
      type="checkbox"
      onChange={(e) => onCheckedChange?.(e.target.checked)}
      {...props}
    />
  ),
}))

jest.mock('@/components/ui/badge', () => ({
  Badge: ({ children, ...props }: any) => <span {...props}>{children}</span>,
}))

jest.mock('@/components/ui/alert', () => ({
  Alert: ({ children, ...props }: any) => <div {...props}>{children}</div>,
  AlertDescription: ({ children, ...props }: any) => <div {...props}>{children}</div>,
}))

jest.mock('@/components/auth/FormField', () => ({
  FormField: ({ label, value, onChange, type = 'text', ...props }: any) => (
    <div>
      <label>{label}</label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange?.(e.target.value)}
        {...props}
      />
    </div>
  ),
}))

jest.mock('@/components/auth/PasswordStrengthIndicator', () => ({
  PasswordStrengthIndicator: () => <div>Password strength indicator</div>,
}))

// Test wrapper component
function TestWrapper({ children }: { children: React.ReactNode }) {
  return (
    <ChatProvider userId={null}>
      {children}
    </ChatProvider>
  )
}

describe('Guest Conversion Integration', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    
    // Setup localStorage mock
    Object.defineProperty(window, 'localStorage', {
      value: {
        getItem: jest.fn(),
        setItem: jest.fn(),
        removeItem: jest.fn(),
      },
      writable: true,
    })

    // Setup session manager mocks
    mockSessionManager.getInstance.mockReturnValue(mockSessionManager)
    
    // Mock guest session data
    mockSessionManager.getSession.mockResolvedValue({
      id: 'guest-session-123',
      type: 'guest',
      guestUuid: 'guest-uuid-456',
      conversationHistory: [
        {
          id: '1',
          query: 'Test query 1',
          response: 'Test response 1',
          timestamp: new Date(),
        },
        {
          id: '2',
          query: 'Test query 2',
          response: 'Test response 2',
          timestamp: new Date(),
        },
        {
          id: '3',
          query: 'Test query 3',
          response: 'Test response 3',
          timestamp: new Date(),
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
      lastAccessedAt: new Date(),
      conversionEligible: true,
      conversionAttempts: 0,
    })

    // Mock current session ID in localStorage
    ;(window.localStorage.getItem as jest.Mock).mockImplementation((key) => {
      if (key === 'selly_current_session_id') return 'guest-session-123'
      if (key === 'guest-conversion-dismissed') return null
      return null
    })
  })

  test('complete guest-to-auth conversion flow', async () => {
    // Mock successful Supabase operations
    mockSupabase.auth.signUp.mockResolvedValue({
      data: {
        user: {
          id: 'user-123',
          email: 'test@example.com',
        },
      },
      error: null,
    })

    mockSessionManager.createSession.mockResolvedValue({
      id: 'auth-session-456',
      type: 'authenticated',
    })

    render(
      <TestWrapper>
        <GuestConversionTrigger />
      </TestWrapper>
    )

    // Wait for component to load and show conversion prompt
    await waitFor(() => {
      expect(screen.getByText('Buat Akun SELLICA')).toBeInTheDocument()
    })

    // Click "Buat Akun Sekarang" to start registration
    const createAccountButton = screen.getByText('Buat Akun Sekarang')
    fireEvent.click(createAccountButton)

    // Should show registration form
    await waitFor(() => {
      expect(screen.getByText('Informasi Akun')).toBeInTheDocument()
    })

    // Fill in email
    const emailInput = screen.getByLabelText('Email')
    fireEvent.change(emailInput, { target: { value: 'test@example.com' } })

    // Fill in password
    const passwordInput = screen.getByLabelText('Password')
    fireEvent.change(passwordInput, { target: { value: 'TestPassword123' } })

    // Fill in confirm password
    const confirmPasswordInput = screen.getByLabelText('Konfirmasi Password')
    fireEvent.change(confirmPasswordInput, { target: { value: 'TestPassword123' } })

    // Click next to go to personal information
    const nextButton = screen.getByText('Lanjutkan')
    fireEvent.click(nextButton)

    // Should show personal information step
    await waitFor(() => {
      expect(screen.getByText('Informasi Pribadi')).toBeInTheDocument()
    })

    // Fill in name
    const nameInput = screen.getByLabelText('Nama Lengkap')
    fireEvent.change(nameInput, { target: { value: 'Test User' } })

    // Click next to go to agreements
    const nextButton2 = screen.getByText('Lanjutkan')
    fireEvent.click(nextButton2)

    // Should show agreements step
    await waitFor(() => {
      expect(screen.getByText('Persetujuan')).toBeInTheDocument()
    })

    // Accept terms and privacy
    const termsCheckbox = screen.getByLabelText(/Syarat dan Ketentuan/)
    const privacyCheckbox = screen.getByLabelText(/Kebijakan Privasi/)
    
    fireEvent.click(termsCheckbox)
    fireEvent.click(privacyCheckbox)

    // Submit the form
    const submitButton = screen.getByText('Buat Akun')
    fireEvent.click(submitButton)

    // Should show loading state
    await waitFor(() => {
      expect(screen.getByText('Membuat Akun Anda...')).toBeInTheDocument()
    })

    // Should eventually show success state
    await waitFor(() => {
      expect(screen.getByText('Selamat!')).toBeInTheDocument()
    }, { timeout: 5000 })

    // Verify Supabase was called correctly
    expect(mockSupabase.auth.signUp).toHaveBeenCalledWith({
      email: 'test@example.com',
      password: 'TestPassword123',
      options: {
        data: {
          name: 'Test User',
          nik: null,
          nip: null,
          position: null,
        },
      },
    })

    // Verify session operations
    expect(mockSessionManager.createSession).toHaveBeenCalledWith('authenticated', {
      userId: 'user-123',
      userEmail: 'test@example.com',
      initialContext: expect.objectContaining({
        conversationHistory: expect.any(Array),
        userPreferences: expect.any(Object),
      }),
    })

    expect(mockSessionManager.deleteSession).toHaveBeenCalledWith('guest-session-123')
  })

  test('handles conversion errors gracefully', async () => {
    // Mock Supabase error
    mockSupabase.auth.signUp.mockResolvedValue({
      data: { user: null },
      error: { message: 'User already registered' },
    })

    render(
      <TestWrapper>
        <GuestConversionTrigger />
      </TestWrapper>
    )

    // Go through the conversion flow quickly
    await waitFor(() => {
      expect(screen.getByText('Buat Akun SELLICA')).toBeInTheDocument()
    })

    fireEvent.click(screen.getByText('Buat Akun Sekarang'))

    await waitFor(() => {
      expect(screen.getByText('Informasi Akun')).toBeInTheDocument()
    })

    // Fill required fields and submit
    fireEvent.change(screen.getByLabelText('Email'), { target: { value: 'test@example.com' } })
    fireEvent.change(screen.getByLabelText('Password'), { target: { value: 'TestPassword123' } })
    fireEvent.change(screen.getByLabelText('Konfirmasi Password'), { target: { value: 'TestPassword123' } })
    fireEvent.click(screen.getByText('Lanjutkan'))

    await waitFor(() => {
      fireEvent.change(screen.getByLabelText('Nama Lengkap'), { target: { value: 'Test User' } })
      fireEvent.click(screen.getByText('Lanjutkan'))
    })

    await waitFor(() => {
      fireEvent.click(screen.getByLabelText(/Syarat dan Ketentuan/))
      fireEvent.click(screen.getByLabelText(/Kebijakan Privasi/))
      fireEvent.click(screen.getByText('Buat Akun'))
    })

    // Should show error message
    await waitFor(() => {
      expect(screen.getByText('Email sudah terdaftar')).toBeInTheDocument()
    })

    // Should show retry option
    expect(screen.getByText('Coba Lagi')).toBeInTheDocument()
  })

  test('respects permanent dismissal', () => {
    // Mock permanent dismissal
    ;(window.localStorage.getItem as jest.Mock).mockImplementation((key) => {
      if (key === 'guest-conversion-dismissed') return 'true'
      return null
    })

    const { container } = render(
      <TestWrapper>
        <GuestConversionTrigger />
      </TestWrapper>
    )

    // Should not render anything
    expect(container.firstChild).toBeNull()
  })
})
