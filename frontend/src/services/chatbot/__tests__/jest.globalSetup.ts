/**
 * Jest Global Setup for SELLY AI Assistant Tests
 * Initializes test environment and shared resources
 */

export default async function globalSetup() {
  console.log('🚀 Setting up SELLY AI Assistant test environment...');
  
  // Set test environment variables
  (process.env as any).NODE_ENV = 'test';
  process.env.JEST_WORKER_ID = process.env.JEST_WORKER_ID || '1';
  
  // Mock external services
  process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://test-project.supabase.co';
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'test-anon-key-for-jest';
  process.env.NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY = 'test-service-role-key-for-jest';
  
  // AI Service configuration
  process.env.NEXT_PUBLIC_ENABLE_TENSORFLOW = 'false'; // Disable TensorFlow in tests
  process.env.NEXT_PUBLIC_ENABLE_HUGGINGFACE = 'false'; // Disable HuggingFace in tests
  process.env.GROQ_API_KEY = 'test-groq-api-key';
  
  // Performance testing configuration
  process.env.TEST_PERFORMANCE_THRESHOLD = '2000'; // 2 seconds
  process.env.TEST_CONCURRENT_LIMIT = '10';
  
  // Initialize test database schema (mock)
  global.testDatabaseSchema = {
    tables: {
      pengajuan_bulanan: {
        columns: ['id', 'user_id', 'nama_pengajuan', 'alasan_pengajuan', 'created_at'],
        primaryKey: 'id',
        foreignKeys: { user_id: 'profiles.id' }
      },
      salah_rekam: {
        columns: ['id', 'user_id', 'nik_salah_rekam', 'nama_salah_rekam', 'created_at'],
        primaryKey: 'id',
        foreignKeys: { user_id: 'profiles.id' }
      },
      adjudicate_record: {
        columns: ['id', 'user_id', 'nik_pengaju', 'nama_pengaju', 'processing_days', 'created_at'],
        primaryKey: 'id',
        foreignKeys: { user_id: 'profiles.id' }
      },
      profiles: {
        columns: ['id', 'email', 'full_name', 'created_at'],
        primaryKey: 'id',
        foreignKeys: {}
      }
    }
  };
  
  // Initialize test data cache
  global.testDataCache = new Map();
  
  // Setup performance monitoring
  global.testPerformanceMetrics = {
    totalTests: 0,
    passedTests: 0,
    failedTests: 0,
    averageTestTime: 0,
    slowTests: []
  };
  
  console.log('✅ SELLY AI Assistant test environment setup complete');
}

// Type declarations for global test utilities
declare global {
  var testDatabaseSchema: {
    tables: Record<string, {
      columns: string[];
      primaryKey: string;
      foreignKeys: Record<string, string>;
    }>;
  };
  
  var testDataCache: Map<string, any>;
  
  var testPerformanceMetrics: {
    totalTests: number;
    passedTests: number;
    failedTests: number;
    averageTestTime: number;
    slowTests: Array<{ name: string; duration: number }>;
  };
}
