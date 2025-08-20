/**
 * Conversion Success Onboarding Component Tests
 * Testing post-conversion feature introduction and onboarding flow
 */

import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import React from 'react';
import { ConversionSuccessOnboarding } from '../ConversionSuccessOnboarding';

// Mock dependencies
jest.mock('@/hooks/useSessionAnalytics');
jest.mock('@/hooks/useFeatureFlags');

describe('ConversionSuccessOnboarding', () => {
  const mockConversionResult = {
    success: true,
    newSessionId: 'auth-session-123',
    preservedData: {
      messageCount: 8,
      topicsDiscussed: ['KTP', 'Kartu Keluarga'],
      duration: 300000, // 5 minutes
      lastActivity: new Date('2024-01-15T10:05:00Z')
    },
    newFeatures: [
      'conversation_history',
      'cross_device_sync',
      'personalized_recommendations',
      'priority_support'
    ],
    userId: 'user123'
  };

  const defaultProps = {
    isOpen: true,
    conversionResult: mockConversionResult,
    onComplete: jest.fn(),
    onSkip: jest.fn(),
    onFeatureExplore: jest.fn(),
    className: ''
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Component Rendering', () => {
    it('should render success onboarding when open', () => {
      render(<ConversionSuccessOnboarding {...defaultProps} />);
      
      expect(screen.getByText('Selamat! Akun Berhasil Dibuat')).toBeInTheDocument();
      expect(screen.getByText('Percakapan Anda telah tersimpan dengan aman')).toBeInTheDocument();
    });

    it('should not render when closed', () => {
      render(<ConversionSuccessOnboarding {...defaultProps} isOpen={false} />);
      
      expect(screen.queryByText('Selamat! Akun Berhasil Dibuat')).not.toBeInTheDocument();
    });

    it('should display preserved conversation data', () => {
      render(<ConversionSuccessOnboarding {...defaultProps} />);
      
      expect(screen.getByText('8 pesan tersimpan')).toBeInTheDocument();
      expect(screen.getByText('5 menit percakapan')).toBeInTheDocument();
      expect(screen.getByText('2 topik dibahas')).toBeInTheDocument();
    });

    it('should show new features available', () => {
      render(<ConversionSuccessOnboarding {...defaultProps} />);
      
      expect(screen.getByText('Riwayat Percakapan')).toBeInTheDocument();
      expect(screen.getByText('Sinkronisasi Multi-Perangkat')).toBeInTheDocument();
      expect(screen.getByText('Rekomendasi Personal')).toBeInTheDocument();
      expect(screen.getByText('Dukungan Prioritas')).toBeInTheDocument();
    });
  });

  describe('Onboarding Flow', () => {
    it('should navigate through onboarding steps', async () => {
      const user = userEvent.setup();
      render(<ConversionSuccessOnboarding {...defaultProps} />);
      
      // Should start at step 1
      expect(screen.getByText('Langkah 1 dari 4')).toBeInTheDocument();
      
      // Navigate to next step
      await user.click(screen.getByText('Lanjutkan'));
      
      expect(screen.getByText('Langkah 2 dari 4')).toBeInTheDocument();
    });

    it('should allow skipping onboarding', async () => {
      const user = userEvent.setup();
      render(<ConversionSuccessOnboarding {...defaultProps} />);
      
      await user.click(screen.getByText('Lewati'));
      
      expect(defaultProps.onSkip).toHaveBeenCalledTimes(1);
    });

    it('should complete onboarding flow', async () => {
      const user = userEvent.setup();
      render(<ConversionSuccessOnboarding {...defaultProps} />);
      
      // Navigate through all steps
      for (let i = 0; i < 4; i++) {
        await user.click(screen.getByText('Lanjutkan'));
      }
      
      expect(defaultProps.onComplete).toHaveBeenCalledTimes(1);
    });

    it('should allow going back to previous steps', async () => {
      const user = userEvent.setup();
      render(<ConversionSuccessOnboarding {...defaultProps} />);
      
      // Go to step 2
      await user.click(screen.getByText('Lanjutkan'));
      expect(screen.getByText('Langkah 2 dari 4')).toBeInTheDocument();
      
      // Go back to step 1
      await user.click(screen.getByText('Kembali'));
      expect(screen.getByText('Langkah 1 dari 4')).toBeInTheDocument();
    });
  });

  describe('Feature Exploration', () => {
    it('should allow exploring individual features', async () => {
      const user = userEvent.setup();
      render(<ConversionSuccessOnboarding {...defaultProps} />);
      
      const exploreButton = screen.getByText('Jelajahi Fitur');
      await user.click(exploreButton);
      
      expect(defaultProps.onFeatureExplore).toHaveBeenCalledWith('conversation_history');
    });

    it('should show feature demonstrations', async () => {
      const user = userEvent.setup();
      render(<ConversionSuccessOnboarding {...defaultProps} />);
      
      // Navigate to feature demo step
      await user.click(screen.getByText('Lanjutkan')); // Step 2
      
      expect(screen.getByText('Demo Fitur')).toBeInTheDocument();
      expect(screen.getByTestId('feature-demo')).toBeInTheDocument();
    });

    it('should provide interactive feature tutorials', async () => {
      const user = userEvent.setup();
      render(<ConversionSuccessOnboarding {...defaultProps} />);
      
      // Navigate to tutorial step
      await user.click(screen.getByText('Lanjutkan')); // Step 2
      await user.click(screen.getByText('Lanjutkan')); // Step 3
      
      expect(screen.getByText('Tutorial Interaktif')).toBeInTheDocument();
      
      const tutorialButton = screen.getByText('Mulai Tutorial');
      await user.click(tutorialButton);
      
      expect(screen.getByTestId('interactive-tutorial')).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('should have proper ARIA attributes', () => {
      render(<ConversionSuccessOnboarding {...defaultProps} />);
      
      const dialog = screen.getByRole('dialog');
      expect(dialog).toHaveAttribute('aria-labelledby');
      expect(dialog).toHaveAttribute('aria-describedby');
    });

    it('should support keyboard navigation', async () => {
      const user = userEvent.setup();
      render(<ConversionSuccessOnboarding {...defaultProps} />);
      
      await user.tab();
      expect(screen.getByText('Lanjutkan')).toHaveFocus();
      
      await user.tab();
      expect(screen.getByText('Lewati')).toHaveFocus();
    });

    it('should announce step changes to screen readers', async () => {
      const user = userEvent.setup();
      render(<ConversionSuccessOnboarding {...defaultProps} />);
      
      await user.click(screen.getByText('Lanjutkan'));
      
      expect(screen.getByText('Langkah 2 dari 4')).toHaveAttribute('aria-live', 'polite');
    });

    it('should have sufficient color contrast', () => {
      render(<ConversionSuccessOnboarding {...defaultProps} />);
      
      const title = screen.getByText('Selamat! Akun Berhasil Dibuat');
      expect(title).toHaveClass('text-gray-900', 'dark:text-white');
    });
  });

  describe('Mobile Responsiveness', () => {
    it('should adapt layout for mobile screens', () => {
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 375,
      });

      render(<ConversionSuccessOnboarding {...defaultProps} />);
      
      const container = screen.getByTestId('onboarding-container');
      expect(container).toHaveClass('max-w-sm', 'sm:max-w-2xl');
    });

    it('should stack feature cards vertically on mobile', () => {
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 375,
      });

      render(<ConversionSuccessOnboarding {...defaultProps} />);
      
      const featureGrid = screen.getByTestId('feature-grid');
      expect(featureGrid).toHaveClass('grid-cols-1', 'sm:grid-cols-2');
    });
  });

  describe('Indonesian Localization', () => {
    it('should display all text in Indonesian', () => {
      render(<ConversionSuccessOnboarding {...defaultProps} />);
      
      expect(screen.getByText('Selamat! Akun Berhasil Dibuat')).toBeInTheDocument();
      expect(screen.getByText('Percakapan Anda telah tersimpan dengan aman')).toBeInTheDocument();
      expect(screen.getByText('Fitur Baru Tersedia')).toBeInTheDocument();
      expect(screen.getByText('Lanjutkan')).toBeInTheDocument();
      expect(screen.getByText('Lewati')).toBeInTheDocument();
    });

    it('should use Indonesian administrative terminology', () => {
      render(<ConversionSuccessOnboarding {...defaultProps} />);
      
      expect(screen.getByText('Riwayat Percakapan')).toBeInTheDocument();
      expect(screen.getByText('Dukungan Prioritas')).toBeInTheDocument();
    });

    it('should format preserved data in Indonesian', () => {
      render(<ConversionSuccessOnboarding {...defaultProps} />);
      
      expect(screen.getByText('8 pesan tersimpan')).toBeInTheDocument();
      expect(screen.getByText('5 menit percakapan')).toBeInTheDocument();
    });
  });

  describe('Feature Highlighting', () => {
    it('should highlight conversation history feature', () => {
      render(<ConversionSuccessOnboarding {...defaultProps} />);
      
      const historyFeature = screen.getByTestId('feature-conversation_history');
      expect(historyFeature).toHaveClass('border-green-200');
      expect(within(historyFeature).getByText('Riwayat Percakapan')).toBeInTheDocument();
    });

    it('should show cross-device sync benefits', () => {
      render(<ConversionSuccessOnboarding {...defaultProps} />);
      
      const syncFeature = screen.getByTestId('feature-cross_device_sync');
      expect(within(syncFeature).getByText('Sinkronisasi Multi-Perangkat')).toBeInTheDocument();
      expect(within(syncFeature).getByText('Akses dari HP, tablet, atau komputer')).toBeInTheDocument();
    });

    it('should emphasize personalized recommendations', () => {
      render(<ConversionSuccessOnboarding {...defaultProps} />);
      
      const recommendationsFeature = screen.getByTestId('feature-personalized_recommendations');
      expect(within(recommendationsFeature).getByText('Rekomendasi Personal')).toBeInTheDocument();
    });
  });

  describe('Analytics Integration', () => {
    it('should track onboarding start event', () => {
      const mockTrackEvent = jest.fn();
      
      jest.doMock('@/hooks/useSessionAnalytics', () => ({
        useSessionAnalytics: () => ({
          trackEvent: mockTrackEvent
        })
      }));

      render(<ConversionSuccessOnboarding {...defaultProps} />);
      
      expect(mockTrackEvent).toHaveBeenCalledWith(
        'conversion_onboarding_started',
        'onboarding_displayed',
        expect.objectContaining({
          newSessionId: 'auth-session-123',
          preservedMessageCount: 8
        })
      );
    });

    it('should track step progression', async () => {
      const mockTrackEvent = jest.fn();
      const user = userEvent.setup();
      
      jest.doMock('@/hooks/useSessionAnalytics', () => ({
        useSessionAnalytics: () => ({
          trackEvent: mockTrackEvent
        })
      }));

      render(<ConversionSuccessOnboarding {...defaultProps} />);
      
      await user.click(screen.getByText('Lanjutkan'));
      
      expect(mockTrackEvent).toHaveBeenCalledWith(
        'onboarding_step_completed',
        'step_1_completed',
        expect.objectContaining({
          stepId: 'welcome',
          timeSpent: expect.any(Number)
        })
      );
    });

    it('should track feature exploration', async () => {
      const mockTrackEvent = jest.fn();
      const user = userEvent.setup();
      
      jest.doMock('@/hooks/useSessionAnalytics', () => ({
        useSessionAnalytics: () => ({
          trackEvent: mockTrackEvent
        })
      }));

      render(<ConversionSuccessOnboarding {...defaultProps} />);
      
      await user.click(screen.getByText('Jelajahi Fitur'));
      
      expect(mockTrackEvent).toHaveBeenCalledWith(
        'onboarding_feature_explored',
        'conversation_history_explored',
        expect.objectContaining({
          featureId: 'conversation_history'
        })
      );
    });
  });

  describe('Error Handling', () => {
    it('should handle missing conversion result gracefully', () => {
      render(
        <ConversionSuccessOnboarding 
          {...defaultProps} 
          conversionResult={null}
        />
      );
      
      expect(screen.getByText('Konversi berhasil')).toBeInTheDocument();
      expect(screen.queryByText('8 pesan tersimpan')).not.toBeInTheDocument();
    });

    it('should handle incomplete conversion data', () => {
      const incompleteResult = {
        success: true,
        newSessionId: 'auth-session-123',
        preservedData: {
          messageCount: 0
        },
        newFeatures: [],
        userId: 'user123'
      };

      render(
        <ConversionSuccessOnboarding 
          {...defaultProps} 
          conversionResult={incompleteResult}
        />
      );
      
      expect(screen.getByText('Akun berhasil dibuat')).toBeInTheDocument();
    });

    it('should show fallback when feature data is unavailable', () => {
      const resultWithoutFeatures = {
        ...mockConversionResult,
        newFeatures: []
      };

      render(
        <ConversionSuccessOnboarding 
          {...defaultProps} 
          conversionResult={resultWithoutFeatures}
        />
      );
      
      expect(screen.getByText('Fitur premium tersedia')).toBeInTheDocument();
    });
  });

  describe('Feature Demonstrations', () => {
    it('should show conversation history demo', async () => {
      const user = userEvent.setup();
      render(<ConversionSuccessOnboarding {...defaultProps} />);
      
      // Navigate to feature demo step
      await user.click(screen.getByText('Lanjutkan'));
      
      expect(screen.getByText('Riwayat Percakapan Anda')).toBeInTheDocument();
      expect(screen.getByTestId('conversation-history-demo')).toBeInTheDocument();
    });

    it('should demonstrate cross-device sync', async () => {
      const user = userEvent.setup();
      render(<ConversionSuccessOnboarding {...defaultProps} />);
      
      // Navigate to sync demo
      await user.click(screen.getByText('Lanjutkan')); // Step 2
      await user.click(screen.getByText('Lanjutkan')); // Step 3
      
      expect(screen.getByText('Sinkronisasi Multi-Perangkat')).toBeInTheDocument();
      expect(screen.getByTestId('device-sync-demo')).toBeInTheDocument();
    });

    it('should show personalization features', async () => {
      const user = userEvent.setup();
      render(<ConversionSuccessOnboarding {...defaultProps} />);
      
      // Navigate to personalization step
      for (let i = 0; i < 3; i++) {
        await user.click(screen.getByText('Lanjutkan'));
      }
      
      expect(screen.getByText('Rekomendasi Personal')).toBeInTheDocument();
      expect(screen.getByTestId('personalization-demo')).toBeInTheDocument();
    });
  });

  describe('Interactive Elements', () => {
    it('should allow trying features during onboarding', async () => {
      const user = userEvent.setup();
      render(<ConversionSuccessOnboarding {...defaultProps} />);
      
      await user.click(screen.getByText('Lanjutkan')); // Go to feature demo
      
      const tryFeatureButton = screen.getByText('Coba Sekarang');
      await user.click(tryFeatureButton);
      
      expect(defaultProps.onFeatureExplore).toHaveBeenCalledWith('conversation_history');
    });

    it('should provide feature tooltips', async () => {
      const user = userEvent.setup();
      render(<ConversionSuccessOnboarding {...defaultProps} />);
      
      const infoIcon = screen.getByTestId('feature-info-conversation_history');
      await user.hover(infoIcon);
      
      await waitFor(() => {
        expect(screen.getByText('Semua percakapan Anda tersimpan dan dapat diakses kapan saja')).toBeInTheDocument();
      });
    });

    it('should handle feature unavailability', () => {
      const resultWithUnavailableFeatures = {
        ...mockConversionResult,
        newFeatures: ['conversation_history'] // Only one feature available
      };

      render(
        <ConversionSuccessOnboarding 
          {...defaultProps} 
          conversionResult={resultWithUnavailableFeatures}
        />
      );
      
      expect(screen.getByText('Riwayat Percakapan')).toBeInTheDocument();
      expect(screen.queryByText('Sinkronisasi Multi-Perangkat')).not.toBeInTheDocument();
    });
  });

  describe('Progress Tracking', () => {
    it('should show onboarding progress', async () => {
      const user = userEvent.setup();
      render(<ConversionSuccessOnboarding {...defaultProps} />);
      
      expect(screen.getByText('Langkah 1 dari 4')).toBeInTheDocument();
      
      await user.click(screen.getByText('Lanjutkan'));
      expect(screen.getByText('Langkah 2 dari 4')).toBeInTheDocument();
    });

    it('should update progress bar', async () => {
      const user = userEvent.setup();
      render(<ConversionSuccessOnboarding {...defaultProps} />);
      
      const progressBar = screen.getByTestId('onboarding-progress');
      expect(progressBar).toHaveStyle('width: 25%'); // Step 1 of 4
      
      await user.click(screen.getByText('Lanjutkan'));
      
      await waitFor(() => {
        expect(progressBar).toHaveStyle('width: 50%'); // Step 2 of 4
      });
    });

    it('should show completion progress', async () => {
      const user = userEvent.setup();
      render(<ConversionSuccessOnboarding {...defaultProps} />);
      
      // Complete all steps
      for (let i = 0; i < 4; i++) {
        await user.click(screen.getByText('Lanjutkan'));
      }
      
      expect(screen.getByText('Onboarding Selesai!')).toBeInTheDocument();
      expect(screen.getByTestId('completion-celebration')).toBeInTheDocument();
    });
  });

  describe('Indonesian Administrative Context', () => {
    it('should highlight administrative service benefits', () => {
      render(<ConversionSuccessOnboarding {...defaultProps} />);
      
      expect(screen.getByText(/layanan administrasi/i)).toBeInTheDocument();
      expect(screen.getByText(/dokumen pemerintah/i)).toBeInTheDocument();
    });

    it('should show KTP-specific onboarding when relevant', () => {
      const ktpConversionResult = {
        ...mockConversionResult,
        preservedData: {
          ...mockConversionResult.preservedData,
          topicsDiscussed: ['KTP', 'Persyaratan Dokumen']
        }
      };

      render(
        <ConversionSuccessOnboarding 
          {...defaultProps} 
          conversionResult={ktpConversionResult}
        />
      );
      
      expect(screen.getByText('Informasi KTP tersimpan')).toBeInTheDocument();
    });

    it('should adapt messaging for different administrative services', () => {
      const bpjsConversionResult = {
        ...mockConversionResult,
        preservedData: {
          ...mockConversionResult.preservedData,
          topicsDiscussed: ['BPJS', 'Pendaftaran Kesehatan']
        }
      };

      render(
        <ConversionSuccessOnboarding 
          {...defaultProps} 
          conversionResult={bpjsConversionResult}
        />
      );
      
      expect(screen.getByText('Informasi BPJS tersimpan')).toBeInTheDocument();
    });
  });

  describe('Performance', () => {
    it('should render onboarding efficiently', () => {
      const startTime = performance.now();
      
      render(<ConversionSuccessOnboarding {...defaultProps} />);
      
      const renderTime = performance.now() - startTime;
      expect(renderTime).toBeLessThan(150);
    });

    it('should handle step transitions smoothly', async () => {
      const user = userEvent.setup();
      render(<ConversionSuccessOnboarding {...defaultProps} />);
      
      const startTime = performance.now();
      
      await user.click(screen.getByText('Lanjutkan'));
      
      const transitionTime = performance.now() - startTime;
      expect(transitionTime).toBeLessThan(100);
    });
  });

  describe('Completion Scenarios', () => {
    it('should handle successful onboarding completion', async () => {
      const user = userEvent.setup();
      render(<ConversionSuccessOnboarding {...defaultProps} />);
      
      // Complete all steps
      for (let i = 0; i < 4; i++) {
        await user.click(screen.getByText('Lanjutkan'));
      }
      
      expect(defaultProps.onComplete).toHaveBeenCalledWith({
        completed: true,
        stepsCompleted: 4,
        featuresExplored: expect.any(Array),
        completionTime: expect.any(Number)
      });
    });

    it('should handle partial completion when skipped', async () => {
      const user = userEvent.setup();
      render(<ConversionSuccessOnboarding {...defaultProps} />);
      
      await user.click(screen.getByText('Lanjutkan')); // Complete step 1
      await user.click(screen.getByText('Lewati')); // Skip remaining
      
      expect(defaultProps.onSkip).toHaveBeenCalledWith({
        completed: false,
        stepsCompleted: 1,
        skippedAt: 'step_2'
      });
    });
  });
});
