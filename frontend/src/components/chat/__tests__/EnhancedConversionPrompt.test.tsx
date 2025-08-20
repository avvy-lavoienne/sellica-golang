/**
 * Enhanced Conversion Prompt Component Tests
 * Comprehensive testing for enhanced guest-to-auth conversion UI
 */

import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals';
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import React from 'react';
import { EnhancedConversionPrompt } from '../EnhancedConversionPrompt';
import { ChatMessage } from '@/types/chatbot';

// Mock dependencies
jest.mock('@/hooks/useFeatureFlags', () => ({
  useFeatureFlags: () => ({
    isEnabled: jest.fn().mockReturnValue(true)
  })
}));

describe('EnhancedConversionPrompt', () => {
  const mockConversationHistory: ChatMessage[] = [
    {
      id: '1',
      content: 'Halo, saya ingin tanya tentang persyaratan KTP',
      role: 'user',
      timestamp: new Date('2024-01-15T10:00:00Z')
    },
    {
      id: '2',
      content: 'Untuk membuat KTP baru, Anda memerlukan dokumen berikut: 1) Surat pengantar dari RT/RW, 2) Fotokopi Kartu Keluarga, 3) Pas foto 3x4 sebanyak 2 lembar...',
      role: 'assistant',
      timestamp: new Date('2024-01-15T10:00:30Z')
    },
    {
      id: '3',
      content: 'Berapa lama proses pembuatan KTP?',
      role: 'user',
      timestamp: new Date('2024-01-15T10:01:00Z')
    },
    {
      id: '4',
      content: 'Proses pembuatan KTP biasanya memakan waktu 14 hari kerja setelah semua dokumen lengkap diserahkan...',
      role: 'assistant',
      timestamp: new Date('2024-01-15T10:01:30Z')
    }
  ];

  const mockConversationSummary = {
    messageCount: 4,
    duration: '5 menit',
    lastActivity: '2 menit yang lalu',
    topicsDiscussed: ['KTP', 'Persyaratan Dokumen', 'Waktu Proses'],
    keyInsights: [
      'Pertanyaan tentang persyaratan KTP',
      'Informasi waktu proses pembuatan',
      'Panduan dokumen yang diperlukan'
    ],
    estimatedValue: 'high' as const
  };

  const defaultProps = {
    isOpen: true,
    onAccept: jest.fn(),
    onDecline: jest.fn(),
    onClose: jest.fn(),
    conversationHistory: mockConversationHistory,
    conversationSummary: mockConversationSummary,
    isLoading: false,
    error: undefined
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Component Rendering', () => {
    it('should render conversion prompt when open', () => {
      render(<EnhancedConversionPrompt {...defaultProps} />);
      
      expect(screen.getByText('Simpan Percakapan Anda')).toBeInTheDocument();
      expect(screen.getByText('Daftarkan akun untuk menyimpan riwayat percakapan')).toBeInTheDocument();
    });

    it('should not render when closed', () => {
      render(<EnhancedConversionPrompt {...defaultProps} isOpen={false} />);
      
      expect(screen.queryByText('Simpan Percakapan Anda')).not.toBeInTheDocument();
    });

    it('should display conversation summary correctly', () => {
      render(<EnhancedConversionPrompt {...defaultProps} />);
      
      expect(screen.getByText('4 pesan')).toBeInTheDocument();
      expect(screen.getByText('5 menit')).toBeInTheDocument();
      expect(screen.getByText('2 menit yang lalu')).toBeInTheDocument();
    });

    it('should show conversation history preview', () => {
      render(<EnhancedConversionPrompt {...defaultProps} />);
      
      expect(screen.getByText('Halo, saya ingin tanya tentang persyaratan KTP')).toBeInTheDocument();
      expect(screen.getByText(/Untuk membuat KTP baru/)).toBeInTheDocument();
    });

    it('should display topics discussed', () => {
      render(<EnhancedConversionPrompt {...defaultProps} />);
      
      expect(screen.getByText('KTP')).toBeInTheDocument();
      expect(screen.getByText('Persyaratan Dokumen')).toBeInTheDocument();
      expect(screen.getByText('Waktu Proses')).toBeInTheDocument();
    });

    it('should show key insights', () => {
      render(<EnhancedConversionPrompt {...defaultProps} />);
      
      expect(screen.getByText('Pertanyaan tentang persyaratan KTP')).toBeInTheDocument();
      expect(screen.getByText('Informasi waktu proses pembuatan')).toBeInTheDocument();
    });
  });

  describe('User Interactions', () => {
    it('should call onAccept when user clicks accept button', async () => {
      const user = userEvent.setup();
      render(<EnhancedConversionPrompt {...defaultProps} />);
      
      const acceptButton = screen.getByText('Ya, Simpan Percakapan');
      await user.click(acceptButton);
      
      expect(defaultProps.onAccept).toHaveBeenCalledTimes(1);
    });

    it('should call onDecline when user clicks decline button', async () => {
      const user = userEvent.setup();
      render(<EnhancedConversionPrompt {...defaultProps} />);
      
      const declineButton = screen.getByText('Tidak, Terima Kasih');
      await user.click(declineButton);
      
      expect(defaultProps.onDecline).toHaveBeenCalledTimes(1);
    });

    it('should call onClose when user clicks close button', async () => {
      const user = userEvent.setup();
      render(<EnhancedConversionPrompt {...defaultProps} />);
      
      const closeButton = screen.getByLabelText('Close');
      await user.click(closeButton);
      
      expect(defaultProps.onClose).toHaveBeenCalledTimes(1);
    });

    it('should expand conversation history when clicked', async () => {
      const user = userEvent.setup();
      render(<EnhancedConversionPrompt {...defaultProps} />);
      
      const expandButton = screen.getByText('Lihat Selengkapnya');
      await user.click(expandButton);
      
      // Should show more conversation details
      expect(screen.getByText('Berapa lama proses pembuatan KTP?')).toBeInTheDocument();
    });
  });

  describe('Loading States', () => {
    it('should show loading state when isLoading is true', () => {
      render(<EnhancedConversionPrompt {...defaultProps} isLoading={true} />);
      
      expect(screen.getByText('Memproses...')).toBeInTheDocument();
      expect(screen.getByTestId('loading-spinner')).toBeInTheDocument();
    });

    it('should disable buttons when loading', () => {
      render(<EnhancedConversionPrompt {...defaultProps} isLoading={true} />);
      
      const acceptButton = screen.getByText('Memproses...');
      const declineButton = screen.getByText('Tidak, Terima Kasih');
      
      expect(acceptButton).toBeDisabled();
      expect(declineButton).toBeDisabled();
    });
  });

  describe('Error Handling', () => {
    it('should display error message when error prop is provided', () => {
      const errorMessage = 'Terjadi kesalahan saat memproses konversi';
      render(<EnhancedConversionPrompt {...defaultProps} error={errorMessage} />);
      
      expect(screen.getByText(errorMessage)).toBeInTheDocument();
      expect(screen.getByTestId('error-icon')).toBeInTheDocument();
    });

    it('should show retry option when error occurs', async () => {
      const user = userEvent.setup();
      const errorMessage = 'Network error';
      render(<EnhancedConversionPrompt {...defaultProps} error={errorMessage} />);
      
      const retryButton = screen.getByText('Coba Lagi');
      await user.click(retryButton);
      
      expect(defaultProps.onAccept).toHaveBeenCalledTimes(1);
    });
  });

  describe('Accessibility', () => {
    it('should have proper ARIA labels', () => {
      render(<EnhancedConversionPrompt {...defaultProps} />);
      
      expect(screen.getByRole('dialog')).toHaveAttribute('aria-labelledby');
      expect(screen.getByRole('dialog')).toHaveAttribute('aria-describedby');
    });

    it('should support keyboard navigation', async () => {
      const user = userEvent.setup();
      render(<EnhancedConversionPrompt {...defaultProps} />);
      
      // Tab through interactive elements
      await user.tab();
      expect(screen.getByText('Ya, Simpan Percakapan')).toHaveFocus();
      
      await user.tab();
      expect(screen.getByText('Tidak, Terima Kasih')).toHaveFocus();
    });

    it('should handle escape key to close', async () => {
      const user = userEvent.setup();
      render(<EnhancedConversionPrompt {...defaultProps} />);
      
      await user.keyboard('{Escape}');
      expect(defaultProps.onClose).toHaveBeenCalledTimes(1);
    });

    it('should have sufficient color contrast', () => {
      render(<EnhancedConversionPrompt {...defaultProps} />);
      
      // Check that important text elements have proper contrast classes
      const title = screen.getByText('Simpan Percakapan Anda');
      expect(title).toHaveClass('text-gray-900', 'dark:text-white');
    });
  });

  describe('Indonesian Localization', () => {
    it('should display all text in Indonesian', () => {
      render(<EnhancedConversionPrompt {...defaultProps} />);
      
      // Check key Indonesian phrases
      expect(screen.getByText('Simpan Percakapan Anda')).toBeInTheDocument();
      expect(screen.getByText('Ya, Simpan Percakapan')).toBeInTheDocument();
      expect(screen.getByText('Tidak, Terima Kasih')).toBeInTheDocument();
      expect(screen.getByText('Topik yang Dibahas')).toBeInTheDocument();
    });

    it('should format Indonesian administrative terms correctly', () => {
      render(<EnhancedConversionPrompt {...defaultProps} />);
      
      // Check that administrative terms are properly displayed
      expect(screen.getByText('KTP')).toBeInTheDocument();
      expect(screen.getByText('Persyaratan Dokumen')).toBeInTheDocument();
    });

    it('should use Indonesian date/time formatting', () => {
      render(<EnhancedConversionPrompt {...defaultProps} />);
      
      // Check that timestamps are formatted in Indonesian locale
      const timeElements = screen.getAllByText(/menit/);
      expect(timeElements.length).toBeGreaterThan(0);
    });
  });

  describe('Mobile Responsiveness', () => {
    it('should adapt layout for mobile screens', () => {
      // Mock mobile viewport
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 375,
      });

      render(<EnhancedConversionPrompt {...defaultProps} />);
      
      const dialog = screen.getByRole('dialog');
      expect(dialog).toHaveClass('max-w-sm', 'sm:max-w-lg');
    });

    it('should stack buttons vertically on mobile', () => {
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 375,
      });

      render(<EnhancedConversionPrompt {...defaultProps} />);
      
      const buttonContainer = screen.getByTestId('button-container');
      expect(buttonContainer).toHaveClass('flex-col', 'sm:flex-row');
    });
  });

  describe('Conversation History Preview', () => {
    it('should show limited messages initially', () => {
      render(<EnhancedConversionPrompt {...defaultProps} />);
      
      // Should show first 2 messages by default
      expect(screen.getByText('Halo, saya ingin tanya tentang persyaratan KTP')).toBeInTheDocument();
      expect(screen.getByText(/Untuk membuat KTP baru/)).toBeInTheDocument();
    });

    it('should expand to show all messages when requested', async () => {
      const user = userEvent.setup();
      render(<EnhancedConversionPrompt {...defaultProps} />);
      
      const expandButton = screen.getByText('Lihat Selengkapnya');
      await user.click(expandButton);
      
      // Should now show all 4 messages
      expect(screen.getByText('Berapa lama proses pembuatan KTP?')).toBeInTheDocument();
      expect(screen.getByText(/Proses pembuatan KTP biasanya/)).toBeInTheDocument();
    });

    it('should handle empty conversation history', () => {
      render(
        <EnhancedConversionPrompt 
          {...defaultProps} 
          conversationHistory={[]}
          conversationSummary={{
            ...mockConversationSummary,
            messageCount: 0
          }}
        />
      );
      
      expect(screen.getByText('Belum ada percakapan')).toBeInTheDocument();
    });

    it('should truncate long messages appropriately', () => {
      const longMessage: ChatMessage = {
        id: '5',
        content: 'Ini adalah pesan yang sangat panjang '.repeat(20),
        role: 'user',
        timestamp: new Date()
      };

      render(
        <EnhancedConversionPrompt 
          {...defaultProps} 
          conversationHistory={[longMessage]}
        />
      );
      
      // Should show truncated message with ellipsis
      expect(screen.getByText(/\.\.\./)).toBeInTheDocument();
    });
  });

  describe('Value Proposition Display', () => {
    it('should show conversion benefits', () => {
      render(<EnhancedConversionPrompt {...defaultProps} />);
      
      expect(screen.getByText('Riwayat percakapan tersimpan permanen')).toBeInTheDocument();
      expect(screen.getByText('Sinkronisasi multi-perangkat')).toBeInTheDocument();
      expect(screen.getByText('Rekomendasi yang dipersonalisasi')).toBeInTheDocument();
    });

    it('should highlight high-value conversations', () => {
      render(<EnhancedConversionPrompt {...defaultProps} />);
      
      // Should show high-value indicator
      expect(screen.getByTestId('value-indicator')).toHaveClass('text-green-600');
      expect(screen.getByText('Percakapan Bernilai Tinggi')).toBeInTheDocument();
    });

    it('should adapt benefits for administrative context', () => {
      render(<EnhancedConversionPrompt {...defaultProps} />);
      
      // Should show administrative-specific benefits
      expect(screen.getByText(/dokumen administrasi/i)).toBeInTheDocument();
      expect(screen.getByText(/layanan pemerintah/i)).toBeInTheDocument();
    });
  });

  describe('Analytics Integration', () => {
    it('should track prompt display event', () => {
      const mockTrackEvent = jest.fn();
      
      // Mock analytics context
      jest.doMock('@/hooks/useSessionAnalytics', () => ({
        useSessionAnalytics: () => ({
          trackEvent: mockTrackEvent
        })
      }));

      render(<EnhancedConversionPrompt {...defaultProps} />);
      
      expect(mockTrackEvent).toHaveBeenCalledWith(
        'conversion_prompt_displayed',
        'enhanced_prompt_shown',
        expect.objectContaining({
          messageCount: 4,
          conversationValue: 'high'
        })
      );
    });

    it('should track user decision events', async () => {
      const mockTrackEvent = jest.fn();
      const user = userEvent.setup();
      
      jest.doMock('@/hooks/useSessionAnalytics', () => ({
        useSessionAnalytics: () => ({
          trackEvent: mockTrackEvent
        })
      }));

      render(<EnhancedConversionPrompt {...defaultProps} />);
      
      await user.click(screen.getByText('Ya, Simpan Percakapan'));
      
      expect(mockTrackEvent).toHaveBeenCalledWith(
        'conversion_prompt_accepted',
        'user_accepted_conversion',
        expect.objectContaining({
          decisionTime: expect.any(Number)
        })
      );
    });
  });

  describe('Performance', () => {
    it('should render within performance budget', async () => {
      const startTime = performance.now();
      
      render(<EnhancedConversionPrompt {...defaultProps} />);
      
      await waitFor(() => {
        expect(screen.getByText('Simpan Percakapan Anda')).toBeInTheDocument();
      });
      
      const renderTime = performance.now() - startTime;
      expect(renderTime).toBeLessThan(100); // Should render within 100ms
    });

    it('should handle large conversation histories efficiently', () => {
      const largeHistory: ChatMessage[] = Array.from({ length: 100 }, (_, i) => ({
        id: i.toString(),
        content: `Message ${i}`,
        role: i % 2 === 0 ? 'user' : 'assistant',
        timestamp: new Date()
      }));

      const startTime = performance.now();
      
      render(
        <EnhancedConversionPrompt 
          {...defaultProps} 
          conversationHistory={largeHistory}
        />
      );
      
      const renderTime = performance.now() - startTime;
      expect(renderTime).toBeLessThan(200); // Should handle large data efficiently
    });
  });

  describe('Error Scenarios', () => {
    it('should handle network errors gracefully', () => {
      const networkError = 'Koneksi internet bermasalah';
      render(<EnhancedConversionPrompt {...defaultProps} error={networkError} />);
      
      expect(screen.getByText(networkError)).toBeInTheDocument();
      expect(screen.getByText('Coba Lagi')).toBeInTheDocument();
    });

    it('should handle conversion service errors', () => {
      const serviceError = 'Layanan konversi sedang tidak tersedia';
      render(<EnhancedConversionPrompt {...defaultProps} error={serviceError} />);
      
      expect(screen.getByText(serviceError)).toBeInTheDocument();
      expect(screen.getByText('Hubungi Dukungan')).toBeInTheDocument();
    });

    it('should provide fallback when conversation data is corrupted', () => {
      const corruptedHistory = [
        { id: '1', content: null, role: 'user', timestamp: new Date() } as any
      ];

      render(
        <EnhancedConversionPrompt 
          {...defaultProps} 
          conversationHistory={corruptedHistory}
        />
      );
      
      // Should still render without crashing
      expect(screen.getByText('Simpan Percakapan Anda')).toBeInTheDocument();
    });
  });

  describe('Indonesian Administrative Context', () => {
    it('should recognize KTP-related conversations', () => {
      render(<EnhancedConversionPrompt {...defaultProps} />);
      
      expect(screen.getByText('KTP')).toBeInTheDocument();
      expect(screen.getByTestId('administrative-context')).toHaveAttribute('data-service', 'ktp');
    });

    it('should show appropriate benefits for document services', () => {
      render(<EnhancedConversionPrompt {...defaultProps} />);
      
      expect(screen.getByText(/dokumen administrasi tersimpan/i)).toBeInTheDocument();
      expect(screen.getByText(/akses cepat ke layanan/i)).toBeInTheDocument();
    });

    it('should handle multiple administrative topics', () => {
      const multiTopicSummary = {
        ...mockConversationSummary,
        topicsDiscussed: ['KTP', 'Kartu Keluarga', 'BPJS', 'Akta Kelahiran']
      };

      render(
        <EnhancedConversionPrompt 
          {...defaultProps} 
          conversationSummary={multiTopicSummary}
        />
      );
      
      expect(screen.getByText('4 layanan dibahas')).toBeInTheDocument();
    });
  });

  describe('Dark Mode Support', () => {
    it('should apply dark mode classes correctly', () => {
      // Mock dark mode
      document.documentElement.classList.add('dark');
      
      render(<EnhancedConversionPrompt {...defaultProps} />);
      
      const dialog = screen.getByRole('dialog');
      expect(dialog).toHaveClass('dark:bg-gray-800');
      
      // Cleanup
      document.documentElement.classList.remove('dark');
    });
  });
});
