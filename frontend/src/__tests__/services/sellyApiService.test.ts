import { jest } from '@jest/globals';
import { SellyApiService } from '../../services/selly/sellyApiService';

// Helper function to create mock Response objects
const createMockResponse = (options: {
  ok: boolean;
  status: number;
  statusText?: string;
  json?: () => Promise<any>;
}): Response => {
  return {
    ok: options.ok,
    status: options.status,
    statusText: options.statusText || '',
    json: options.json || (() => Promise.resolve({})),
    headers: new Headers(),
    redirected: false,
    type: 'basic',
    url: '',
    clone: jest.fn(),
    text: jest.fn(),
    arrayBuffer: jest.fn(),
    blob: jest.fn(),
    formData: jest.fn(),
    body: null,
    bodyUsed: false,
    bytes: jest.fn(),
  } as unknown as Response;
};

// Mock the global fetch function
const mockFetch = jest.fn() as jest.MockedFunction<typeof fetch>;
global.fetch = mockFetch;

// Mock console methods to avoid noise in test output
const mockConsoleError = jest.spyOn(console, 'error').mockImplementation(() => {});
const mockConsoleLog = jest.spyOn(console, 'log').mockImplementation(() => {});
const mockConsoleWarn = jest.spyOn(console, 'warn').mockImplementation(() => {});

describe('SellyApiService - Backend Disconnection Fallback Tests', () => {
  beforeEach(() => {
    mockFetch.mockClear();
    mockConsoleError.mockClear();
    mockConsoleLog.mockClear();
    mockConsoleWarn.mockClear();
  });

  afterAll(() => {
    mockConsoleError.mockRestore();
    mockConsoleLog.mockRestore();
    mockConsoleWarn.mockRestore();
  });

  describe('Network Failure Scenarios', () => {
    it('should handle network errors and generate backend disconnection fallback', async () => {
      // Simulate network failure that triggers backend disconnection detection
      const networkError = new Error('Failed to fetch');
      mockFetch.mockRejectedValueOnce(networkError);
      mockFetch.mockRejectedValueOnce(networkError); // Second attempt

      const response = await SellyApiService.processMessage(
        'Halo, saya butuh bantuan dengan KTP',
        { userId: 'test-user-123' }
      );

      // Verify backend disconnection fallback response is generated
      expect(response).toContain('SELLY AI Assistant - Disdukcapil Garut');
      expect(response).toContain('sedang mengalami gangguan koneksi');
      expect(response).toContain('+62-851-8304-3205');
      expect(response).toContain('WhatsApp');
      expect(response).toContain('Terima kasih atas kesabaran Anda');
      
      // Verify error was logged
      expect(mockConsoleError).toHaveBeenCalled();
    });

    it('should handle HTTP 500 errors and generate fallback response', async () => {
      // Simulate server error
      mockFetch.mockResolvedValueOnce(createMockResponse({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error',
        json: async () => ({ error: 'Server error' }),
      }));

      const response = await SellyApiService.processMessage(
        'Bagaimana cara membuat paspor?',
        { userId: 'test-user-123' }
      );

      // Verify fallback response is generated (should use intelligent fallback for non-connection errors)
      expect(response).toBeDefined();
      expect(response).toContain('Halo! Saya SELLY');
    });

    it('should handle timeout scenarios and generate fallback response', async () => {
      // Simulate timeout error that triggers backend timeout detection
      const timeoutError = new Error('Timeout');
      timeoutError.name = 'AbortError';
      mockFetch.mockRejectedValueOnce(timeoutError);
      mockFetch.mockRejectedValueOnce(timeoutError); // Second attempt

      const response = await SellyApiService.processMessage(
        'Syarat membuat KTP elektronik',
        { userId: 'test-user-123' }
      );

      // Verify backend disconnection fallback response is generated
      expect(response).toContain('SELLY AI Assistant - Disdukcapil Garut');
      expect(response).toContain('sedang mengalami gangguan koneksi');
    });
  });

  describe('Fallback Response Validation', () => {
    it('should generate culturally appropriate fallback responses in Indonesian', async () => {
      // Use error that triggers backend disconnection fallback
      const networkError = new Error('Failed to fetch');
      mockFetch.mockRejectedValueOnce(networkError);
      mockFetch.mockRejectedValueOnce(networkError); // Second attempt

      const response = await SellyApiService.processMessage(
        'Test message',
        { userId: 'test-user-123' }
      );

      // Verify response is in Indonesian and culturally appropriate
      expect(response).toContain('Selamat');
      expect(response).toContain('SELLY');
      expect(response).toContain('Disdukcapil Garut');
      expect(response).toContain('Terima kasih');
      expect(response).toContain('kesabaran');
      
      // Verify contact information is included
      expect(response).toContain('+62-851-8304-3205');
      expect(response).toContain('WhatsApp');
    });

    it('should use intelligent fallback for non-connection errors', async () => {
      // Simulate a different type of error that doesn't trigger backend disconnection
      mockFetch.mockResolvedValueOnce(createMockResponse({
        ok: true,
        status: 200,
        json: async () => ({
          success: false,
          error: 'Processing error'
        }),
      }));

      const response = await SellyApiService.processMessage(
        'Halo',
        { userId: 'test-user-123' }
      );

      // Should use intelligent fallback, not backend disconnection fallback
      expect(response).toContain('Halo! Saya SELLY');
      expect(response).not.toContain('sedang mengalami gangguan koneksi');
    });
  });

  describe('Connection Status Indicators', () => {
    it('should track connection status during disconnection events', async () => {
      // First call succeeds
      mockFetch.mockResolvedValueOnce(createMockResponse({
        ok: true,
        status: 200,
        json: async () => ({
          success: true,
          response: 'Normal response from backend',
        }),
      }));

      // Second call fails with connection error - mock for both attempts
      const disconnectionError = new Error('BACKEND_DISCONNECTED');
      mockFetch.mockRejectedValueOnce(disconnectionError);
      mockFetch.mockRejectedValueOnce(disconnectionError); // Second attempt

      // First successful call
      const response1 = await SellyApiService.processMessage(
        'Test message 1',
        { userId: 'test-user-123' }
      );
      expect(response1).toBe('Normal response from backend');

      // Second failed call should trigger backend disconnection fallback after retries
      const response2 = await SellyApiService.processMessage(
        'Test message 2',
        { userId: 'test-user-123' }
      );
      expect(response2).toContain('sedang mengalami gangguan koneksi');
    });

    it('should handle mixed success/failure scenarios gracefully', async () => {
      // Alternate between success and failure
      const disconnectionError = new Error('BACKEND_DISCONNECTED');
      mockFetch
        .mockResolvedValueOnce(createMockResponse({
          ok: true,
          status: 200,
          json: async () => ({
            success: true,
            response: 'Success response 1',
          }),
        }))
        .mockRejectedValueOnce(disconnectionError) // First attempt for Test 2
        .mockRejectedValueOnce(disconnectionError) // Second attempt for Test 2
        .mockResolvedValueOnce(createMockResponse({
          ok: true,
          status: 200,
          json: async () => ({
            success: true,
            response: 'Success response 2',
          }),
        }));

      const responses = await Promise.all([
        SellyApiService.processMessage('Test 1', { userId: 'test-user-123' }),
        SellyApiService.processMessage('Test 2', { userId: 'test-user-123' }),
        SellyApiService.processMessage('Test 3', { userId: 'test-user-123' }),
      ]);

      // Verify mixed responses
      expect(responses[0]).toBe('Success response 1');
      expect(responses[1]).toContain('sedang mengalami gangguan koneksi'); // Fallback after retries
      expect(responses[2]).toBe('Success response 2');
    });
  });

  describe('Automatic Reconnection Behavior', () => {
    it('should attempt to reconnect after temporary failures', async () => {
      // First call fails - mock both attempts for the first message
      const disconnectionError = new Error('BACKEND_DISCONNECTED');
      mockFetch.mockRejectedValueOnce(disconnectionError);
      mockFetch.mockRejectedValueOnce(disconnectionError); // Second attempt for first message
      
      // Second call succeeds after reconnection
      mockFetch.mockResolvedValueOnce(createMockResponse({
        ok: true,
        status: 200,
        json: async () => ({
          success: true,
          response: 'Reconnected successfully',
        }),
      }));

      const response1 = await SellyApiService.processMessage(
        'Test reconnection 1',
        { userId: 'test-user-123' }
      );
      expect(response1).toContain('sedang mengalami gangguan koneksi'); // Fallback after retries

      const response2 = await SellyApiService.processMessage(
        'Test reconnection 2',
        { userId: 'test-user-123' }
      );
      expect(response2).toBe('Reconnected successfully'); // Back to normal
    });

    it('should handle persistent failures with appropriate fallback', async () => {
      // Multiple consecutive failures - mock each call with two rejections (for retries)
      const disconnectionError = new Error('BACKEND_DISCONNECTED');
      mockFetch.mockRejectedValue(disconnectionError); // This will always return the same error

      // Make multiple calls - each will trigger two attempts due to retries
      const responses = await Promise.all([
        SellyApiService.processMessage('Test 1', { userId: 'test-user-123' }),
        SellyApiService.processMessage('Test 2', { userId: 'test-user-123' }),
        SellyApiService.processMessage('Test 3', { userId: 'test-user-123' }),
      ]);

      // All responses should be backend disconnection fallback responses
      responses.forEach(response => {
        expect(response).toContain('sedang mengalami gangguan koneksi');
      });

      // Verify multiple error logs - 3 calls * 2 attempts each = 6 error logs
      expect(mockConsoleError).toHaveBeenCalledTimes(6);
    });
  });

  describe('Health Check Functionality', () => {
    it('should return true for successful health check', async () => {
      mockFetch.mockResolvedValueOnce(createMockResponse({
        ok: true,
        status: 200,
      }));

      const isHealthy = await SellyApiService.healthCheck();
      expect(isHealthy).toBe(true);
    });

    it('should return false for failed health check', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Health check failed'));

      const isHealthy = await SellyApiService.healthCheck();
      expect(isHealthy).toBe(false);
      expect(mockConsoleWarn).toHaveBeenCalled();
    });
  });
});