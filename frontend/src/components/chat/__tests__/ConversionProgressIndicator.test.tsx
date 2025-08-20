/**
 * Conversion Progress Indicator Component Tests
 * Testing step-by-step conversion progress visualization
 */

import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import React from 'react';
import { ConversionProgressIndicator } from '../ConversionProgressIndicator';
import { ConversionStep, ConversionStatus } from '@/types/conversion';

// Mock dependencies
jest.mock('@/hooks/useSessionAnalytics');

describe('ConversionProgressIndicator', () => {
  const mockSteps: ConversionStep[] = [
    {
      id: 'validation',
      name: 'Validasi Data',
      description: 'Memvalidasi data percakapan',
      status: 'completed',
      estimatedTime: 2000,
      actualTime: 1800,
      error: undefined
    },
    {
      id: 'migration',
      name: 'Migrasi Percakapan',
      description: 'Memindahkan riwayat percakapan ke akun',
      status: 'in_progress',
      estimatedTime: 5000,
      actualTime: undefined,
      error: undefined
    },
    {
      id: 'preferences',
      name: 'Sinkronisasi Preferensi',
      description: 'Menyinkronkan pengaturan pengguna',
      status: 'pending',
      estimatedTime: 3000,
      actualTime: undefined,
      error: undefined
    },
    {
      id: 'completion',
      name: 'Finalisasi',
      description: 'Menyelesaikan proses konversi',
      status: 'pending',
      estimatedTime: 1000,
      actualTime: undefined,
      error: undefined
    }
  ];

  const defaultProps = {
    steps: mockSteps,
    currentStep: 'migration',
    overallProgress: 0.35,
    estimatedTimeRemaining: 8000,
    onCancel: jest.fn(),
    onRetry: jest.fn(),
    showDetails: true,
    className: ''
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Component Rendering', () => {
    it('should render progress indicator with all steps', () => {
      render(<ConversionProgressIndicator {...defaultProps} />);
      
      expect(screen.getByText('Proses Konversi')).toBeInTheDocument();
      expect(screen.getByText('Validasi Data')).toBeInTheDocument();
      expect(screen.getByText('Migrasi Percakapan')).toBeInTheDocument();
      expect(screen.getByText('Sinkronisasi Preferensi')).toBeInTheDocument();
      expect(screen.getByText('Finalisasi')).toBeInTheDocument();
    });

    it('should display overall progress percentage', () => {
      render(<ConversionProgressIndicator {...defaultProps} />);
      
      expect(screen.getByText('35%')).toBeInTheDocument();
    });

    it('should show estimated time remaining', () => {
      render(<ConversionProgressIndicator {...defaultProps} />);
      
      expect(screen.getByText(/8 detik/)).toBeInTheDocument();
    });

    it('should highlight current step', () => {
      render(<ConversionProgressIndicator {...defaultProps} />);
      
      const currentStepElement = screen.getByTestId('step-migration');
      expect(currentStepElement).toHaveClass('border-blue-500');
      expect(within(currentStepElement).getByTestId('step-spinner')).toBeInTheDocument();
    });
  });

  describe('Step Status Visualization', () => {
    it('should show completed steps with check icons', () => {
      render(<ConversionProgressIndicator {...defaultProps} />);
      
      const completedStep = screen.getByTestId('step-validation');
      expect(within(completedStep).getByTestId('check-icon')).toBeInTheDocument();
      expect(completedStep).toHaveClass('border-green-500');
    });

    it('should show pending steps with clock icons', () => {
      render(<ConversionProgressIndicator {...defaultProps} />);
      
      const pendingStep = screen.getByTestId('step-preferences');
      expect(within(pendingStep).getByTestId('clock-icon')).toBeInTheDocument();
      expect(pendingStep).toHaveClass('border-gray-300');
    });

    it('should show in-progress steps with spinner', () => {
      render(<ConversionProgressIndicator {...defaultProps} />);
      
      const inProgressStep = screen.getByTestId('step-migration');
      expect(within(inProgressStep).getByTestId('step-spinner')).toBeInTheDocument();
      expect(inProgressStep).toHaveClass('border-blue-500');
    });

    it('should show failed steps with error icons', () => {
      const stepsWithError = [...mockSteps];
      stepsWithError[1] = {
        ...stepsWithError[1],
        status: 'failed',
        error: 'Migration failed due to network error'
      };

      render(
        <ConversionProgressIndicator 
          {...defaultProps} 
          steps={stepsWithError}
          currentStep="migration"
        />
      );
      
      const failedStep = screen.getByTestId('step-migration');
      expect(within(failedStep).getByTestId('error-icon')).toBeInTheDocument();
      expect(failedStep).toHaveClass('border-red-500');
    });
  });

  describe('Progress Animation', () => {
    it('should animate progress bar updates', async () => {
      const { rerender } = render(<ConversionProgressIndicator {...defaultProps} />);
      
      // Update progress
      rerender(
        <ConversionProgressIndicator 
          {...defaultProps} 
          overallProgress={0.65}
          currentStep="preferences"
        />
      );
      
      await waitFor(() => {
        const progressBar = screen.getByTestId('progress-bar');
        expect(progressBar).toHaveStyle('width: 65%');
      });
    });

    it('should update estimated time dynamically', async () => {
      const { rerender } = render(<ConversionProgressIndicator {...defaultProps} />);
      
      rerender(
        <ConversionProgressIndicator 
          {...defaultProps} 
          estimatedTimeRemaining={3000}
        />
      );
      
      await waitFor(() => {
        expect(screen.getByText(/3 detik/)).toBeInTheDocument();
      });
    });
  });

  describe('Error Handling', () => {
    it('should display step-specific error messages', () => {
      const stepsWithError = [...mockSteps];
      stepsWithError[1] = {
        ...stepsWithError[1],
        status: 'failed',
        error: 'Koneksi database terputus'
      };

      render(
        <ConversionProgressIndicator 
          {...defaultProps} 
          steps={stepsWithError}
        />
      );
      
      expect(screen.getByText('Koneksi database terputus')).toBeInTheDocument();
    });

    it('should show retry button for failed steps', async () => {
      const user = userEvent.setup();
      const stepsWithError = [...mockSteps];
      stepsWithError[1] = {
        ...stepsWithError[1],
        status: 'failed',
        error: 'Network timeout'
      };

      render(
        <ConversionProgressIndicator 
          {...defaultProps} 
          steps={stepsWithError}
        />
      );
      
      const retryButton = screen.getByText('Coba Lagi');
      await user.click(retryButton);
      
      expect(defaultProps.onRetry).toHaveBeenCalledWith('migration');
    });

    it('should handle multiple step failures', () => {
      const stepsWithMultipleErrors = mockSteps.map(step => ({
        ...step,
        status: 'failed' as const,
        error: `Error in ${step.name}`
      }));

      render(
        <ConversionProgressIndicator 
          {...defaultProps} 
          steps={stepsWithMultipleErrors}
        />
      );
      
      expect(screen.getByText('Beberapa langkah gagal')).toBeInTheDocument();
      expect(screen.getByText('Coba Lagi Semua')).toBeInTheDocument();
    });
  });

  describe('User Interactions', () => {
    it('should allow cancellation during progress', async () => {
      const user = userEvent.setup();
      render(<ConversionProgressIndicator {...defaultProps} />);
      
      const cancelButton = screen.getByText('Batalkan');
      await user.click(cancelButton);
      
      expect(defaultProps.onCancel).toHaveBeenCalledTimes(1);
    });

    it('should show confirmation dialog for cancellation', async () => {
      const user = userEvent.setup();
      render(<ConversionProgressIndicator {...defaultProps} />);
      
      const cancelButton = screen.getByText('Batalkan');
      await user.click(cancelButton);
      
      expect(screen.getByText('Yakin ingin membatalkan?')).toBeInTheDocument();
      expect(screen.getByText('Ya, Batalkan')).toBeInTheDocument();
      expect(screen.getByText('Lanjutkan')).toBeInTheDocument();
    });

    it('should toggle detailed view', async () => {
      const user = userEvent.setup();
      render(<ConversionProgressIndicator {...defaultProps} showDetails={false} />);
      
      const toggleButton = screen.getByText('Tampilkan Detail');
      await user.click(toggleButton);
      
      expect(screen.getByText('Memvalidasi data percakapan')).toBeInTheDocument();
    });
  });

  describe('Time Estimation', () => {
    it('should calculate accurate time estimates', () => {
      render(<ConversionProgressIndicator {...defaultProps} />);
      
      // Should show realistic time estimates
      expect(screen.getByText(/8 detik/)).toBeInTheDocument();
    });

    it('should update estimates based on actual performance', async () => {
      const { rerender } = render(<ConversionProgressIndicator {...defaultProps} />);
      
      // Simulate faster than expected completion
      const updatedSteps = [...mockSteps];
      updatedSteps[0] = { ...updatedSteps[0], actualTime: 1000 }; // Faster than estimated 2000ms
      
      rerender(
        <ConversionProgressIndicator 
          {...defaultProps} 
          steps={updatedSteps}
          estimatedTimeRemaining={6000} // Adjusted estimate
        />
      );
      
      await waitFor(() => {
        expect(screen.getByText(/6 detik/)).toBeInTheDocument();
      });
    });

    it('should handle time estimation errors gracefully', () => {
      render(
        <ConversionProgressIndicator 
          {...defaultProps} 
          estimatedTimeRemaining={-1} // Invalid time
        />
      );
      
      expect(screen.getByText('Menghitung...')).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('should have proper ARIA attributes', () => {
      render(<ConversionProgressIndicator {...defaultProps} />);
      
      const progressBar = screen.getByRole('progressbar');
      expect(progressBar).toHaveAttribute('aria-valuenow', '35');
      expect(progressBar).toHaveAttribute('aria-valuemin', '0');
      expect(progressBar).toHaveAttribute('aria-valuemax', '100');
    });

    it('should announce progress updates to screen readers', async () => {
      const { rerender } = render(<ConversionProgressIndicator {...defaultProps} />);
      
      rerender(
        <ConversionProgressIndicator 
          {...defaultProps} 
          overallProgress={0.65}
          currentStep="preferences"
        />
      );
      
      await waitFor(() => {
        expect(screen.getByText('Sinkronisasi Preferensi sedang berlangsung')).toBeInTheDocument();
      });
    });

    it('should support keyboard navigation for interactive elements', async () => {
      const user = userEvent.setup();
      render(<ConversionProgressIndicator {...defaultProps} />);
      
      await user.tab();
      expect(screen.getByText('Batalkan')).toHaveFocus();
      
      await user.tab();
      expect(screen.getByText('Tampilkan Detail')).toHaveFocus();
    });
  });

  describe('Mobile Responsiveness', () => {
    it('should adapt layout for mobile screens', () => {
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 375,
      });

      render(<ConversionProgressIndicator {...defaultProps} />);
      
      const container = screen.getByTestId('progress-container');
      expect(container).toHaveClass('flex-col', 'sm:flex-row');
    });

    it('should show compact view on small screens', () => {
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 320,
      });

      render(<ConversionProgressIndicator {...defaultProps} showDetails={false} />);
      
      // Should show only essential information
      expect(screen.getByText('35%')).toBeInTheDocument();
      expect(screen.queryByText('Memvalidasi data percakapan')).not.toBeInTheDocument();
    });
  });

  describe('Performance', () => {
    it('should render efficiently with many steps', () => {
      const manySteps: ConversionStep[] = Array.from({ length: 20 }, (_, i) => ({
        id: `step-${i}`,
        name: `Step ${i}`,
        description: `Description for step ${i}`,
        status: i < 5 ? 'completed' : i === 5 ? 'in_progress' : 'pending',
        estimatedTime: 1000,
        actualTime: i < 5 ? 900 : undefined,
        error: undefined
      }));

      const startTime = performance.now();
      
      render(
        <ConversionProgressIndicator 
          {...defaultProps} 
          steps={manySteps}
        />
      );
      
      const renderTime = performance.now() - startTime;
      expect(renderTime).toBeLessThan(100);
    });

    it('should update progress smoothly without flickering', async () => {
      const { rerender } = render(<ConversionProgressIndicator {...defaultProps} />);
      
      // Rapid progress updates
      for (let i = 0.35; i <= 1.0; i += 0.1) {
        rerender(
          <ConversionProgressIndicator 
            {...defaultProps} 
            overallProgress={i}
          />
        );
        
        await new Promise(resolve => setTimeout(resolve, 50));
      }
      
      // Should handle rapid updates without errors
      expect(screen.getByText('100%')).toBeInTheDocument();
    });
  });

  describe('Indonesian Administrative Context', () => {
    it('should use appropriate Indonesian terminology', () => {
      render(<ConversionProgressIndicator {...defaultProps} />);
      
      expect(screen.getByText('Validasi Data')).toBeInTheDocument();
      expect(screen.getByText('Migrasi Percakapan')).toBeInTheDocument();
      expect(screen.getByText('Sinkronisasi Preferensi')).toBeInTheDocument();
      expect(screen.getByText('Finalisasi')).toBeInTheDocument();
    });

    it('should handle KTP-specific conversion steps', () => {
      const ktpSteps: ConversionStep[] = [
        {
          id: 'ktp_validation',
          name: 'Validasi Data KTP',
          description: 'Memvalidasi informasi KTP yang dibahas',
          status: 'completed',
          estimatedTime: 2000,
          actualTime: 1800,
          error: undefined
        },
        {
          id: 'document_migration',
          name: 'Migrasi Dokumen',
          description: 'Memindahkan referensi dokumen KTP',
          status: 'in_progress',
          estimatedTime: 3000,
          actualTime: undefined,
          error: undefined
        }
      ];

      render(
        <ConversionProgressIndicator 
          {...defaultProps} 
          steps={ktpSteps}
          currentStep="document_migration"
        />
      );
      
      expect(screen.getByText('Validasi Data KTP')).toBeInTheDocument();
      expect(screen.getByText('Migrasi Dokumen')).toBeInTheDocument();
    });

    it('should format time in Indonesian locale', () => {
      render(
        <ConversionProgressIndicator 
          {...defaultProps} 
          estimatedTimeRemaining={65000} // 1 minute 5 seconds
        />
      );
      
      expect(screen.getByText(/1 menit 5 detik/)).toBeInTheDocument();
    });
  });

  describe('Error Recovery', () => {
    it('should show retry options for failed steps', async () => {
      const user = userEvent.setup();
      const stepsWithError = [...mockSteps];
      stepsWithError[1] = {
        ...stepsWithError[1],
        status: 'failed',
        error: 'Koneksi database terputus'
      };

      render(
        <ConversionProgressIndicator 
          {...defaultProps} 
          steps={stepsWithError}
        />
      );
      
      expect(screen.getByText('Koneksi database terputus')).toBeInTheDocument();
      
      const retryButton = screen.getByText('Coba Lagi');
      await user.click(retryButton);
      
      expect(defaultProps.onRetry).toHaveBeenCalledWith('migration');
    });

    it('should provide detailed error information', () => {
      const stepsWithError = [...mockSteps];
      stepsWithError[1] = {
        ...stepsWithError[1],
        status: 'failed',
        error: 'Network timeout after 30 seconds'
      };

      render(
        <ConversionProgressIndicator 
          {...defaultProps} 
          steps={stepsWithError}
        />
      );
      
      expect(screen.getByText('Network timeout after 30 seconds')).toBeInTheDocument();
    });

    it('should handle network connectivity issues', () => {
      const networkError = 'Tidak ada koneksi internet';
      const stepsWithNetworkError = [...mockSteps];
      stepsWithNetworkError[1] = {
        ...stepsWithNetworkError[1],
        status: 'failed',
        error: networkError
      };

      render(
        <ConversionProgressIndicator 
          {...defaultProps} 
          steps={stepsWithNetworkError}
        />
      );
      
      expect(screen.getByText(networkError)).toBeInTheDocument();
      expect(screen.getByText('Periksa koneksi internet Anda')).toBeInTheDocument();
    });
  });

  describe('Completion States', () => {
    it('should show success state when all steps complete', () => {
      const completedSteps = mockSteps.map(step => ({
        ...step,
        status: 'completed' as const,
        actualTime: step.estimatedTime - 200
      }));

      render(
        <ConversionProgressIndicator 
          {...defaultProps} 
          steps={completedSteps}
          overallProgress={1.0}
          currentStep="completion"
        />
      );
      
      expect(screen.getByText('Konversi Berhasil!')).toBeInTheDocument();
      expect(screen.getByText('100%')).toBeInTheDocument();
      expect(screen.getByTestId('success-icon')).toBeInTheDocument();
    });

    it('should calculate total completion time', () => {
      const completedSteps = mockSteps.map(step => ({
        ...step,
        status: 'completed' as const,
        actualTime: step.estimatedTime - 200
      }));

      render(
        <ConversionProgressIndicator 
          {...defaultProps} 
          steps={completedSteps}
          overallProgress={1.0}
        />
      );
      
      // Total time should be sum of actual times
      const totalTime = completedSteps.reduce((sum, step) => sum + (step.actualTime || 0), 0);
      expect(screen.getByText(`Selesai dalam ${Math.round(totalTime / 1000)} detik`)).toBeInTheDocument();
    });
  });

  describe('Analytics Integration', () => {
    it('should track progress milestones', async () => {
      const mockTrackEvent = jest.fn();
      
      jest.doMock('@/hooks/useSessionAnalytics', () => ({
        useSessionAnalytics: () => ({
          trackEvent: mockTrackEvent
        })
      }));

      const { rerender } = render(<ConversionProgressIndicator {...defaultProps} />);
      
      // Simulate step completion
      const updatedSteps = [...mockSteps];
      updatedSteps[1] = { ...updatedSteps[1], status: 'completed', actualTime: 4500 };
      
      rerender(
        <ConversionProgressIndicator 
          {...defaultProps} 
          steps={updatedSteps}
          currentStep="preferences"
          overallProgress={0.65}
        />
      );
      
      await waitFor(() => {
        expect(mockTrackEvent).toHaveBeenCalledWith(
          'conversion_step_completed',
          'migration',
          expect.objectContaining({
            stepId: 'migration',
            actualTime: 4500,
            estimatedTime: 5000
          })
        );
      });
    });

    it('should track cancellation events', async () => {
      const mockTrackEvent = jest.fn();
      const user = userEvent.setup();
      
      jest.doMock('@/hooks/useSessionAnalytics', () => ({
        useSessionAnalytics: () => ({
          trackEvent: mockTrackEvent
        })
      }));

      render(<ConversionProgressIndicator {...defaultProps} />);
      
      await user.click(screen.getByText('Batalkan'));
      await user.click(screen.getByText('Ya, Batalkan'));
      
      expect(mockTrackEvent).toHaveBeenCalledWith(
        'conversion_cancelled',
        'user_cancelled_conversion',
        expect.objectContaining({
          currentStep: 'migration',
          progress: 0.35
        })
      );
    });
  });

  describe('Internationalization', () => {
    it('should format numbers according to Indonesian locale', () => {
      render(
        <ConversionProgressIndicator 
          {...defaultProps} 
          overallProgress={0.3567}
        />
      );
      
      expect(screen.getByText('35,7%')).toBeInTheDocument();
    });

    it('should use Indonesian time formatting', () => {
      render(
        <ConversionProgressIndicator 
          {...defaultProps} 
          estimatedTimeRemaining={125000} // 2 minutes 5 seconds
        />
      );
      
      expect(screen.getByText('2 menit 5 detik')).toBeInTheDocument();
    });
  });
});
