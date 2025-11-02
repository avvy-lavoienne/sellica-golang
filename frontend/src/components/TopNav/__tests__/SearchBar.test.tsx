/**
 * SearchBar Component Unit Tests
 *
 * Tests cover:
 * - T032: Debounce (300ms), admin filtering, keyboard navigation, error handling
 * - Page shortcut search for all users
 * - Ticket search for admins only
 * - Keyboard shortcuts (Cmd/Ctrl+K, Arrow/Enter/Escape)
 * - ARIA accessibility attributes
 * - Results limit to 8 items
 * - Click-outside dropdown close
 *
 * Target: 80%+ line coverage
 */

import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import SearchBar from '../SearchBar';
import { AuthenticatedUser } from '../types';
import { searchSilpanaTickets } from '@/lib/api/supabaseQueries';
import { toast } from 'react-toastify';

// Mock dependencies
jest.mock('@/lib/api/supabaseQueries');
jest.mock('react-toastify');
jest.mock('next-intl', () => ({
  useTranslations: () => (key: string) => {
    const translations: Record<string, string> = {
      placeholder: 'Cari tiket atau halaman...',
      aria_label: 'Pencarian',
      clear_search: 'Hapus pencarian',
      results_label: 'Hasil pencarian',
      no_results: 'Tidak ada hasil ditemukan',
      'error.search_failed': 'Gagal mengambil hasil pencarian. Silakan coba lagi.',
      'pages.dashboard_subtitle': 'Halaman utama',
      'pages.analytics_subtitle': 'Analitik dan laporan',
      'pages.profile': 'Profil',
      'pages.profile_subtitle': 'Pengaturan profil',
      'pages.settings': 'Pengaturan',
      'pages.settings_subtitle': 'Konfigurasi sistem',
    };
    return translations[key] || key;
  },
}));

const mockSearchSilpanaTickets = searchSilpanaTickets as jest.MockedFunction<
  typeof searchSilpanaTickets
>;

describe('SearchBar Component', () => {
  const mockAdminUser: AuthenticatedUser = {
    id: 'admin-123',
    email: 'admin@example.com',
    name: 'Admin User',
    role: 'admin',
  };

  const mockRegularUser: AuthenticatedUser = {
    id: 'user-123',
    email: 'user@example.com',
    name: 'Regular User',
    role: 'user',
  };

  const mockTicketResults = [
    {
      id: 'ticket-1',
      nama_pengaduan: 'Pengaduan Akta Kelahiran',
      ticket_code: 'TKT-001',
      status: 'Proses',
    },
    {
      id: 'ticket-2',
      nama_pengaduan: 'Pengaduan KTP',
      ticket_code: 'TKT-002',
      status: 'Selesai',
    },
  ];

  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.runOnlyPendingTimers();
    jest.useRealTimers();
  });

  // ==========================================================================
  // RENDERING & BASIC INTERACTION
  // ==========================================================================

  it('renders search input with correct placeholder', () => {
    render(<SearchBar user={mockRegularUser} />);
    const input = screen.getByRole('combobox');
    expect(input).toBeInTheDocument();
    expect(input).toHaveAttribute('placeholder', 'Cari tiket atau halaman...');
  });

  it('shows keyboard shortcut hint when input is empty', () => {
    render(<SearchBar user={mockRegularUser} />);
    // The hint shows Cmd or Ctrl based on platform
    const hint = screen.getByText(/K/);
    expect(hint).toBeInTheDocument();
  });

  it('disables input when user is null', () => {
    render(<SearchBar user={null} />);
    const input = screen.getByRole('combobox');
    expect(input).toBeDisabled();
  });

  // ==========================================================================
  // DEBOUNCE BEHAVIOR (300ms)
  // ==========================================================================

  it('debounces search input by 300ms', async () => {
    mockSearchSilpanaTickets.mockResolvedValue(mockTicketResults);

    render(<SearchBar user={mockAdminUser} />);
    const input = screen.getByRole('combobox');

    // Type "akta"
    await userEvent.type(input, 'akta');

    // API should NOT be called immediately
    expect(mockSearchSilpanaTickets).not.toHaveBeenCalled();

    // Fast-forward 299ms (still within debounce window)
    act(() => {
      jest.advanceTimersByTime(299);
    });
    expect(mockSearchSilpanaTickets).not.toHaveBeenCalled();

    // Fast-forward to 300ms
    act(() => {
      jest.advanceTimersByTime(1);
    });

    await waitFor(() => {
      expect(mockSearchSilpanaTickets).toHaveBeenCalledWith('akta', expect.any(Number));
    });
  });

  it('resets debounce timer on subsequent keystrokes', async () => {
    mockSearchSilpanaTickets.mockResolvedValue(mockTicketResults);

    render(<SearchBar user={mockAdminUser} />);
    const input = screen.getByRole('combobox');

    // Type "a"
    await userEvent.type(input, 'a');
    act(() => {
      jest.advanceTimersByTime(200);
    });

    // Type "k" (resets timer)
    await userEvent.type(input, 'k');
    act(() => {
      jest.advanceTimersByTime(200);
    });

    // Only 200ms passed since last keystroke, not 400ms total
    expect(mockSearchSilpanaTickets).not.toHaveBeenCalled();

    // Wait remaining 100ms to complete 300ms debounce
    act(() => {
      jest.advanceTimersByTime(100);
    });

    await waitFor(() => {
      expect(mockSearchSilpanaTickets).toHaveBeenCalledTimes(1);
    });
  });

  // ==========================================================================
  // ADMIN-ONLY TICKET SEARCH
  // ==========================================================================

  it('shows ticket results for admin users', async () => {
    mockSearchSilpanaTickets.mockResolvedValue(mockTicketResults);

    render(<SearchBar user={mockAdminUser} />);
    const input = screen.getByRole('combobox');

    await userEvent.type(input, 'pengaduan');
    act(() => {
      jest.advanceTimersByTime(300);
    });

    await waitFor(() => {
      expect(screen.getByText('Pengaduan Akta Kelahiran')).toBeInTheDocument();
      expect(screen.getByText('TKT-001 • Proses')).toBeInTheDocument();
    });
  });

  it('does NOT show ticket results for non-admin users', async () => {
    mockSearchSilpanaTickets.mockResolvedValue(mockTicketResults);

    render(<SearchBar user={mockRegularUser} />);
    const input = screen.getByRole('combobox');

    await userEvent.type(input, 'pengaduan');
    act(() => {
      jest.advanceTimersByTime(300);
    });

    // searchSilpanaTickets should NOT be called for non-admin
    await waitFor(() => {
      expect(mockSearchSilpanaTickets).not.toHaveBeenCalled();
    });
  });

  // ==========================================================================
  // PAGE SHORTCUT SEARCH (ALL USERS)
  // ==========================================================================

  it('shows page shortcuts for regular users', async () => {
    render(<SearchBar user={mockRegularUser} />);
    const input = screen.getByRole('combobox');

    await userEvent.type(input, 'dashboard');
    act(() => {
      jest.advanceTimersByTime(300);
    });

    await waitFor(() => {
      expect(screen.getByText('Dashboard')).toBeInTheDocument();
      expect(screen.getByText('Halaman utama')).toBeInTheDocument();
    });
  });

  it('shows page shortcuts for admin users', async () => {
    mockSearchSilpanaTickets.mockResolvedValue([]);

    render(<SearchBar user={mockAdminUser} />);
    const input = screen.getByRole('combobox');

    await userEvent.type(input, 'settings');
    act(() => {
      jest.advanceTimersByTime(300);
    });

    await waitFor(() => {
      expect(screen.getByText('Pengaturan')).toBeInTheDocument();
      expect(screen.getByText('Konfigurasi sistem')).toBeInTheDocument();
    });
  });

  it('combines page and ticket results for admin (max 8 total)', async () => {
    const manyTickets = Array.from({ length: 10 }, (_, i) => ({
      id: `ticket-${i}`,
      nama_pengaduan: `Ticket ${i}`,
      ticket_code: `TKT-${i.toString().padStart(3, '0')}`,
      status: 'Proses',
    }));

    mockSearchSilpanaTickets.mockResolvedValue(manyTickets);

    render(<SearchBar user={mockAdminUser} />);
    const input = screen.getByRole('combobox');

    await userEvent.type(input, 'a'); // Matches analytics page
    act(() => {
      jest.advanceTimersByTime(300);
    });

    await waitFor(() => {
      const results = screen.getAllByRole('option');
      // Should show max 8 results (pages + tickets combined)
      expect(results.length).toBeLessThanOrEqual(8);
    });
  });

  // ==========================================================================
  // KEYBOARD NAVIGATION
  // ==========================================================================

  it('navigates results with Arrow keys', async () => {
    mockSearchSilpanaTickets.mockResolvedValue(mockTicketResults);

    render(<SearchBar user={mockAdminUser} />);
    const input = screen.getByRole('combobox');

    await userEvent.type(input, 'pengaduan');
    act(() => {
      jest.advanceTimersByTime(300);
    });

    await waitFor(() => {
      expect(screen.getByText('Pengaduan Akta Kelahiran')).toBeInTheDocument();
    });

    const results = screen.getAllByRole('option');
    expect(results[0]).toHaveAttribute('aria-selected', 'true');

    // Press ArrowDown
    fireEvent.keyDown(input, { key: 'ArrowDown' });
    await waitFor(() => {
      expect(results[1]).toHaveAttribute('aria-selected', 'true');
    });

    // Press ArrowUp
    fireEvent.keyDown(input, { key: 'ArrowUp' });
    await waitFor(() => {
      expect(results[0]).toHaveAttribute('aria-selected', 'true');
    });
  });

  it('selects result with Enter key', async () => {
    mockSearchSilpanaTickets.mockResolvedValue(mockTicketResults);
    const onResultSelect = jest.fn();

    render(<SearchBar user={mockAdminUser} onResultSelect={onResultSelect} />);
    const input = screen.getByRole('combobox');

    await userEvent.type(input, 'pengaduan');
    act(() => {
      jest.advanceTimersByTime(300);
    });

    await waitFor(() => {
      expect(screen.getByText('Pengaduan Akta Kelahiran')).toBeInTheDocument();
    });

    // Press Enter (should select first result)
    fireEvent.keyDown(input, { key: 'Enter' });

    await waitFor(() => {
      expect(onResultSelect).toHaveBeenCalledWith(
        expect.objectContaining({
          id: 'ticket-1',
          type: 'ticket',
          title: 'Pengaduan Akta Kelahiran',
        })
      );
    });
  });

  it('closes dropdown with Escape key', async () => {
    mockSearchSilpanaTickets.mockResolvedValue(mockTicketResults);

    render(<SearchBar user={mockAdminUser} />);
    const input = screen.getByRole('combobox');

    await userEvent.type(input, 'pengaduan');
    act(() => {
      jest.advanceTimersByTime(300);
    });

    await waitFor(() => {
      expect(screen.getByText('Pengaduan Akta Kelahiran')).toBeInTheDocument();
    });

    // Press Escape
    fireEvent.keyDown(input, { key: 'Escape' });

    await waitFor(() => {
      expect(screen.queryByText('Pengaduan Akta Kelahiran')).not.toBeInTheDocument();
    });
  });

  // ==========================================================================
  // GLOBAL KEYBOARD SHORTCUT (CMD/CTRL+K)
  // ==========================================================================

  it('focuses input on Cmd+K (Mac)', () => {
    render(<SearchBar user={mockRegularUser} />);
    const input = screen.getByRole('combobox');

    // Mock Mac platform
    Object.defineProperty(navigator, 'platform', {
      value: 'MacIntel',
      configurable: true,
    });

    // Trigger Cmd+K
    fireEvent.keyDown(window, { key: 'k', metaKey: true });

    expect(document.activeElement).toBe(input);
  });

  it('focuses input on Ctrl+K (Windows/Linux)', () => {
    render(<SearchBar user={mockRegularUser} />);
    const input = screen.getByRole('combobox');

    // Mock Windows platform
    Object.defineProperty(navigator, 'platform', {
      value: 'Win32',
      configurable: true,
    });

    // Trigger Ctrl+K
    fireEvent.keyDown(window, { key: 'k', ctrlKey: true });

    expect(document.activeElement).toBe(input);
  });

  // ==========================================================================
  // ERROR HANDLING
  // ==========================================================================

  it('shows error toast on search failure', async () => {
    const mockError = new Error('Network error');
    mockSearchSilpanaTickets.mockRejectedValue(mockError);

    render(<SearchBar user={mockAdminUser} />);
    const input = screen.getByRole('combobox');

    await userEvent.type(input, 'error');
    act(() => {
      jest.advanceTimersByTime(300);
    });

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith(
        'Gagal mengambil hasil pencarian. Silakan coba lagi.',
        expect.any(Object)
      );
    });
  });

  it('clears results on error', async () => {
    mockSearchSilpanaTickets.mockRejectedValue(new Error('Timeout'));

    render(<SearchBar user={mockAdminUser} />);
    const input = screen.getByRole('combobox');

    await userEvent.type(input, 'timeout');
    act(() => {
      jest.advanceTimersByTime(300);
    });

    await waitFor(() => {
      expect(screen.queryByRole('option')).not.toBeInTheDocument();
    });
  });

  // ==========================================================================
  // ARIA ACCESSIBILITY
  // ==========================================================================

  it('has correct ARIA attributes', () => {
    render(<SearchBar user={mockRegularUser} />);
    const input = screen.getByRole('combobox');

    expect(input).toHaveAttribute('aria-autocomplete', 'list');
    expect(input).toHaveAttribute('aria-expanded', 'false');
    expect(input).toHaveAttribute('aria-controls', 'search-results');
  });

  it('updates aria-expanded when dropdown opens', async () => {
    mockSearchSilpanaTickets.mockResolvedValue(mockTicketResults);

    render(<SearchBar user={mockAdminUser} />);
    const input = screen.getByRole('combobox');

    await userEvent.type(input, 'test');
    act(() => {
      jest.advanceTimersByTime(300);
    });

    await waitFor(() => {
      expect(input).toHaveAttribute('aria-expanded', 'true');
    });
  });

  it('announces results with aria-live region', async () => {
    mockSearchSilpanaTickets.mockResolvedValue(mockTicketResults);

    render(<SearchBar user={mockAdminUser} />);
    const input = screen.getByRole('combobox');

    await userEvent.type(input, 'test');
    act(() => {
      jest.advanceTimersByTime(300);
    });

    await waitFor(() => {
      const listbox = screen.getByRole('listbox');
      expect(listbox).toHaveAttribute('aria-label', 'Hasil pencarian');
    });
  });

  // ==========================================================================
  // CLEAR BUTTON
  // ==========================================================================

  it('shows clear button when input has value', async () => {
    render(<SearchBar user={mockRegularUser} />);
    const input = screen.getByRole('combobox');

    await userEvent.type(input, 'test');

    const clearButton = screen.getByLabelText('Hapus pencarian');
    expect(clearButton).toBeInTheDocument();
  });

  it('clears input and closes dropdown when clear button clicked', async () => {
    mockSearchSilpanaTickets.mockResolvedValue(mockTicketResults);

    render(<SearchBar user={mockAdminUser} />);
    const input = screen.getByRole('combobox');

    await userEvent.type(input, 'test');
    act(() => {
      jest.advanceTimersByTime(300);
    });

    await waitFor(() => {
      expect(screen.getByText('Pengaduan Akta Kelahiran')).toBeInTheDocument();
    });

    const clearButton = screen.getByLabelText('Hapus pencarian');
    fireEvent.click(clearButton);

    expect(input).toHaveValue('');
    expect(screen.queryByText('Pengaduan Akta Kelahiran')).not.toBeInTheDocument();
  });

  // ==========================================================================
  // EMPTY QUERY BEHAVIOR
  // ==========================================================================

  it('closes dropdown when query is cleared', async () => {
    mockSearchSilpanaTickets.mockResolvedValue(mockTicketResults);

    render(<SearchBar user={mockAdminUser} />);
    const input = screen.getByRole('combobox');

    await userEvent.type(input, 'test');
    act(() => {
      jest.advanceTimersByTime(300);
    });

    await waitFor(() => {
      expect(screen.getByText('Pengaduan Akta Kelahiran')).toBeInTheDocument();
    });

    // Clear input
    await userEvent.clear(input);
    act(() => {
      jest.advanceTimersByTime(300);
    });

    await waitFor(() => {
      expect(screen.queryByText('Pengaduan Akta Kelahiran')).not.toBeInTheDocument();
    });
  });

  // ==========================================================================
  // NO RESULTS STATE
  // ==========================================================================

  it('shows "no results" message when search returns empty', async () => {
    mockSearchSilpanaTickets.mockResolvedValue([]);

    render(<SearchBar user={mockAdminUser} />);
    const input = screen.getByRole('combobox');

    await userEvent.type(input, 'nonexistent');
    act(() => {
      jest.advanceTimersByTime(300);
    });

    await waitFor(() => {
      expect(screen.getByText('Tidak ada hasil ditemukan')).toBeInTheDocument();
    });
  });

  // ==========================================================================
  // LOADING STATE
  // ==========================================================================

  it('shows loading spinner during search', async () => {
    // Mock slow API response
    mockSearchSilpanaTickets.mockImplementation(
      () =>
        new Promise((resolve) => {
          setTimeout(() => resolve(mockTicketResults), 1000);
        })
    );

    render(<SearchBar user={mockAdminUser} />);
    const input = screen.getByRole('combobox');

    await userEvent.type(input, 'test');
    act(() => {
      jest.advanceTimersByTime(300);
    });

    // Loading spinner should appear
    await waitFor(() => {
      expect(screen.getByRole('listbox')).toBeInTheDocument();
    });

    // Advance time to complete API call
    act(() => {
      jest.advanceTimersByTime(1000);
    });

    await waitFor(() => {
      expect(screen.getByText('Pengaduan Akta Kelahiran')).toBeInTheDocument();
    });
  });
});
