/**
 * Jest Setup Configuration for SELLY AI Assistant Tests
 * Global test utilities, mocks, and custom matchers
 */

import 'jest-extended';

// Global test timeout for async operations
jest.setTimeout(30000);

// Mock console methods to reduce noise in tests
const originalConsoleLog = console.log;
const originalConsoleWarn = console.warn;
const originalConsoleError = console.error;

// Store original methods for restoration
global.originalConsole = {
  log: originalConsoleLog,
  warn: originalConsoleWarn,
  error: originalConsoleError
};

// Mock console methods during tests (can be overridden per test)
if (process.env.NODE_ENV === 'test') {
  console.log = jest.fn();
  console.warn = jest.fn();
  console.error = jest.fn();
}

// Global test utilities
global.testUtils = {
  // Restore console for debugging specific tests
  restoreConsole: () => {
    console.log = originalConsoleLog;
    console.warn = originalConsoleWarn;
    console.error = originalConsoleError;
  },
  
  // Mock console again
  mockConsole: () => {
    console.log = jest.fn();
    console.warn = jest.fn();
    console.error = jest.fn();
  },
  
  // Wait for async operations
  waitFor: (ms: number) => new Promise(resolve => setTimeout(resolve, ms)),
  
  // Generate test data
  generateMockData: {
    pengajuanBulanan: (count: number = 5) => Array.from({ length: count }, (_, i) => ({
      id: `test-pengajuan-${i + 1}`,
      user_id: `test-user-${i + 1}`,
      nama_pengajuan: `Test Pengajuan ${i + 1}`,
      alasan_pengajuan: 'Test reason',
      nik_pengaju: `123456789${i}`,
      nama_pengaju: `Test User ${i + 1}`,
      tanggal_pengajuan: new Date(2024, 0, i + 1).toISOString().split('T')[0],
      estimasi_tanggal_perekaman: new Date(2024, 0, i + 15).toISOString().split('T')[0],
      is_ready_to_record: i % 2 === 0,
      created_at: new Date(2024, 0, i + 1).toISOString()
    })),
    
    salahRekam: (count: number = 5) => Array.from({ length: count }, (_, i) => ({
      id: `test-salah-rekam-${i + 1}`,
      user_id: `test-user-${i + 1}`,
      nik_salah_rekam: `987654321${i}`,
      nama_salah_rekam: `Test Salah Rekam ${i + 1}`,
      nik_pemilik_biometric: `111222333${i}`,
      nama_pemilik_biometric: `Test Biometric ${i + 1}`,
      tanggal_perekaman: new Date(2024, 0, i + 1).toISOString().split('T')[0],
      is_ready_to_record: i % 3 === 0,
      created_at: new Date(2024, 0, i + 1).toISOString()
    })),
    
    adjudicateRecord: (count: number = 5) => Array.from({ length: count }, (_, i) => ({
      id: `test-adjudicate-${i + 1}`,
      user_id: `test-user-${i + 1}`,
      nik_pengaju: `555666777${i}`,
      nama_pengaju: `Test Adjudicate ${i + 1}`,
      tanggal_pengajuan: new Date(2024, 0, i + 1).toISOString().split('T')[0],
      estimasi_tanggal_perekaman: new Date(2024, 0, i + 30).toISOString().split('T')[0],
      is_ready_to_record: i % 4 === 0,
      processing_days: (i + 1) * 10,
      created_at: new Date(2024, 0, i + 1).toISOString()
    }))
  }
};

// Custom Jest matchers for SELLY-specific assertions
expect.extend({
  // Check if response contains Indonesian text
  toContainIndonesianText(received: string) {
    const indonesianWords = [
      'pengajuan', 'data', 'berapa', 'tampilkan', 'bulan', 'minggu', 'hari',
      'yang', 'dan', 'atau', 'dengan', 'dari', 'untuk', 'pada', 'di',
      'adalah', 'akan', 'sudah', 'belum', 'masih', 'telah', 'sedang'
    ];
    
    const hasIndonesianWords = indonesianWords.some(word => 
      received.toLowerCase().includes(word)
    );
    
    return {
      message: () => 
        `expected "${received}" to contain Indonesian text`,
      pass: hasIndonesianWords
    };
  },
  
  // Check if response time is within acceptable limits
  toBeWithinPerformanceThreshold(received: number, threshold: number = 2000) {
    return {
      message: () => 
        `expected ${received}ms to be within performance threshold of ${threshold}ms`,
      pass: received <= threshold
    };
  },
  
  // Check if response has proper structure
  toHaveValidResponseStructure(received: any) {
    const hasContent = typeof received.content === 'string' && received.content.length > 0;
    const hasType = ['text', 'data', 'chart', 'table', 'stats', 'administrative'].includes(received.type);
    const hasMetadata = received.metadata && typeof received.metadata === 'object';
    
    return {
      message: () => 
        `expected response to have valid structure (content: ${hasContent}, type: ${hasType}, metadata: ${hasMetadata})`,
      pass: hasContent && hasType && hasMetadata
    };
  },
  
  // Check if temporal query result is valid
  toHaveValidTemporalStructure(received: any) {
    const hasQueryType = received.queryType && 
      ['temporal_aggregation', 'temporal_filter', 'temporal_analysis'].includes(received.queryType);
    
    const hasDateRange = !received.dateRange || (
      received.dateRange.startDate instanceof Date &&
      received.dateRange.endDate instanceof Date &&
      received.dateRange.startDate <= received.dateRange.endDate
    );
    
    const hasValidConditions = !received.conditions || (
      Array.isArray(received.conditions) &&
      received.conditions.every((c: any) => 
        c.type && c.operator && c.value !== undefined && c.unit && c.description
      )
    );
    
    return {
      message: () => 
        `expected temporal query result to have valid structure`,
      pass: hasQueryType && hasDateRange && hasValidConditions
    };
  },
  
  // Check if NLP result has proper entity extraction
  toHaveValidNLPStructure(received: any) {
    const hasEntities = Array.isArray(received.entities);
    const hasIntent = received.intent && 
      typeof received.intent.type === 'string' &&
      typeof received.intent.confidence === 'number' &&
      received.intent.confidence >= 0 && received.intent.confidence <= 1;
    
    const hasContext = received.context && typeof received.context === 'object';
    
    return {
      message: () => 
        `expected NLP result to have valid structure`,
      pass: hasEntities && hasIntent && hasContext
    };
  }
});

// Global mocks for external dependencies
jest.mock('@supabase/supabase-js', () => ({
  createClient: jest.fn(() => ({
    from: jest.fn(() => ({
      select: jest.fn().mockReturnThis(),
      insert: jest.fn().mockReturnThis(),
      update: jest.fn().mockReturnThis(),
      delete: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      neq: jest.fn().mockReturnThis(),
      gt: jest.fn().mockReturnThis(),
      gte: jest.fn().mockReturnThis(),
      lt: jest.fn().mockReturnThis(),
      lte: jest.fn().mockReturnThis(),
      like: jest.fn().mockReturnThis(),
      ilike: jest.fn().mockReturnThis(),
      in: jest.fn().mockReturnThis(),
      order: jest.fn().mockReturnThis(),
      limit: jest.fn().mockReturnThis(),
      range: jest.fn().mockReturnThis(),
      single: jest.fn(() => Promise.resolve({ data: null, error: null })),
      then: jest.fn(() => Promise.resolve({ data: [], error: null }))
    })),
    auth: {
      getUser: jest.fn(() => Promise.resolve({ data: { user: null }, error: null })),
      signInWithPassword: jest.fn(() => Promise.resolve({ data: null, error: null })),
      signUp: jest.fn(() => Promise.resolve({ data: null, error: null })),
      signOut: jest.fn(() => Promise.resolve({ error: null }))
    }
  }))
}));

// Mock environment variables
process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://test.supabase.co';
process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'test-anon-key';
process.env.NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY = 'test-service-role-key';
(process.env as any).NODE_ENV = 'test';

// Performance monitoring for tests
const performanceTracker = {
  testStartTimes: new Map<string, number>(),
  
  startTest: (testName: string) => {
    performanceTracker.testStartTimes.set(testName, performance.now());
  },
  
  endTest: (testName: string) => {
    const startTime = performanceTracker.testStartTimes.get(testName);
    if (startTime) {
      const duration = performance.now() - startTime;
      if (duration > 5000) { // Warn for tests taking longer than 5 seconds
        console.warn(`⚠️ Slow test detected: ${testName} took ${duration.toFixed(2)}ms`);
      }
      performanceTracker.testStartTimes.delete(testName);
    }
  }
};

global.performanceTracker = performanceTracker;

// Setup and teardown hooks
beforeEach(() => {
  // Clear all mocks before each test
  jest.clearAllMocks();
  
  // Start performance tracking
  const testName = expect.getState().currentTestName || 'unknown';
  performanceTracker.startTest(testName);
});

afterEach(() => {
  // End performance tracking
  const testName = expect.getState().currentTestName || 'unknown';
  performanceTracker.endTest(testName);
});

// Global error handler for unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

// Export types for TypeScript support
declare global {
  namespace jest {
    interface Matchers<R> {
      toContainIndonesianText(): R;
      toBeWithinPerformanceThreshold(threshold?: number): R;
      toHaveValidResponseStructure(): R;
      toHaveValidTemporalStructure(): R;
      toHaveValidNLPStructure(): R;
    }
  }
  
  var testUtils: {
    restoreConsole: () => void;
    mockConsole: () => void;
    waitFor: (ms: number) => Promise<void>;
    generateMockData: {
      pengajuanBulanan: (count?: number) => any[];
      salahRekam: (count?: number) => any[];
      adjudicateRecord: (count?: number) => any[];
    };
  };
  
  var performanceTracker: {
    startTest: (testName: string) => void;
    endTest: (testName: string) => void;
  };
  
  var originalConsole: {
    log: typeof console.log;
    warn: typeof console.warn;
    error: typeof console.error;
  };
}
