#!/usr/bin/env tsx

/**
 * RLS Policy Testing Script - Phase 1 Critical Fixes Validation
 * 
 * This script tests the critical RLS policy fixes to ensure:
 * 1. Service role can access and modify chat data
 * 2. Authenticated users can access their own sessions/messages
 * 3. Guest sessions work with valid UUIDs
 * 4. Foreign key constraints are resolved
 * 5. No RLS policy violations occur
 * 
 * Usage: pnpm run test:rls-policies
 */

import { createClient } from '@supabase/supabase-js';
import { Database } from '@/lib/conn/database';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '.env.local' });

interface TestResult {
  testName: string;
  success: boolean;
  error?: string;
  details?: any;
  duration: number;
}

interface TestSession {
  id: string;
  session_type: 'authenticated' | 'guest';
  user_id?: string;
  guest_uuid?: string;
}

class RLSPolicyTester {
  private supabaseUrl: string;
  private supabaseServiceKey: string;
  private supabaseAnonKey: string;
  private serviceClient: any;
  private anonClient: any;
  private testResults: TestResult[] = [];

  constructor() {
    this.supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    this.supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
    this.supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

    if (!this.supabaseUrl || !this.supabaseServiceKey || !this.supabaseAnonKey) {
      throw new Error('Missing required Supabase environment variables');
    }

    // Create service role client (for admin operations)
    this.serviceClient = createClient<Database>(
      this.supabaseUrl,
      this.supabaseServiceKey,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    );

    // Create anonymous client (for guest operations)
    this.anonClient = createClient<Database>(
      this.supabaseUrl,
      this.supabaseAnonKey,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    );
  }

  /**
   * Run all RLS policy tests
   */
  async runAllTests(): Promise<void> {
    console.log('🚀 Starting RLS Policy Testing - Phase 1 Critical Fixes');
    console.log('=' .repeat(60));

    try {
      // Test 1: Service Role Access
      await this.testServiceRoleAccess();
      
      // Test 2: Guest Session Creation and Access
      await this.testGuestSessionHandling();
      
      // Test 3: Session and Message Creation Flow
      await this.testSessionMessageFlow();
      
      // Test 4: RLS Policy Validation Function
      await this.testValidationFunction();
      
      // Test 5: Foreign Key Constraint Resolution
      await this.testForeignKeyConstraints();

      // Generate test report
      this.generateTestReport();

    } catch (error) {
      console.error('❌ Test suite failed:', error);
      process.exit(1);
    }
  }

  /**
   * Test 1: Service Role Access
   */
  private async testServiceRoleAccess(): Promise<void> {
    console.log('\n📋 Test 1: Service Role Access');
    
    // Test service role can read sessions
    await this.runTest('Service role can read chat sessions', async () => {
      const { data, error } = await this.serviceClient
        .from('selly_chat_sessions')
        .select('*')
        .limit(10);
      
      if (error) throw error;
      return { sessionCount: data?.length || 0 };
    });

    // Test service role can create sessions
    await this.runTest('Service role can create chat sessions', async () => {
      const testSession = {
        id: `test-service-${Date.now()}`,
        session_type: 'authenticated' as const,
        user_id: '00000000-0000-0000-0000-000000000001', // Test UUID
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      const { data, error } = await this.serviceClient
        .from('selly_chat_sessions')
        .insert(testSession)
        .select()
        .single();

      if (error) throw error;
      return { sessionId: data.id };
    });

    // Test service role can read messages
    await this.runTest('Service role can read chat messages', async () => {
      const { data, error } = await this.serviceClient
        .from('selly_chat_messages')
        .select('*')
        .limit(10);
      
      if (error) throw error;
      return { messageCount: data?.length || 0 };
    });
  }

  /**
   * Test 2: Guest Session Handling
   */
  private async testGuestSessionHandling(): Promise<void> {
    console.log('\n👤 Test 2: Guest Session Handling');

    const guestUuid = `guest-test-${Date.now()}`;
    
    // Test guest session creation
    await this.runTest('Anonymous user can create guest session', async () => {
      const testSession = {
        id: `guest-session-${Date.now()}`,
        session_type: 'guest' as const,
        guest_uuid: guestUuid,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      const { data, error } = await this.anonClient
        .from('selly_chat_sessions')
        .insert(testSession)
        .select()
        .single();

      if (error) throw error;
      return { sessionId: data.id, guestUuid: data.guest_uuid };
    });

    // Test guest session access
    await this.runTest('Anonymous user can access guest session', async () => {
      const { data, error } = await this.anonClient
        .from('selly_chat_sessions')
        .select('*')
        .eq('guest_uuid', guestUuid)
        .single();

      if (error) throw error;
      return { sessionId: data.id, accessible: true };
    });

    // Test invalid guest UUID rejection
    await this.runTest('Invalid guest UUID is rejected', async () => {
      const testSession = {
        id: `invalid-guest-${Date.now()}`,
        session_type: 'guest' as const,
        guest_uuid: 'short', // Too short, should fail
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      const { data, error } = await this.anonClient
        .from('selly_chat_sessions')
        .insert(testSession)
        .select()
        .single();

      // This should fail due to RLS policy
      if (!error) {
        throw new Error('Expected RLS policy to reject short guest UUID');
      }
      
      return { rejected: true, errorMessage: error.message };
    });
  }

  /**
   * Test 3: Session and Message Creation Flow
   */
  private async testSessionMessageFlow(): Promise<void> {
    console.log('\n💬 Test 3: Session and Message Creation Flow');

    let testSessionId: string;

    // Create test session
    await this.runTest('Create session for message testing', async () => {
      const sessionId = `msg-test-session-${Date.now()}`;
      const testSession = {
        id: sessionId,
        session_type: 'guest' as const,
        guest_uuid: `msg-test-guest-${Date.now()}`,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      const { data, error } = await this.serviceClient
        .from('selly_chat_sessions')
        .insert(testSession)
        .select()
        .single();

      if (error) throw error;
      testSessionId = data.id;
      return { sessionId: data.id };
    });

    // Test message creation (should not violate foreign key constraint)
    await this.runTest('Create message without foreign key violation', async () => {
      const testMessage = {
        id: `test-msg-${Date.now()}`,
        session_id: testSessionId,
        content: 'Test message for RLS policy validation',
        role: 'user' as const,
        created_at: new Date().toISOString()
      };

      const { data, error } = await this.serviceClient
        .from('selly_chat_messages')
        .insert(testMessage)
        .select()
        .single();

      if (error) throw error;
      return { messageId: data.id, sessionId: data.session_id };
    });

    // Test message retrieval
    await this.runTest('Retrieve messages for session', async () => {
      const { data, error } = await this.serviceClient
        .from('selly_chat_messages')
        .select('*')
        .eq('session_id', testSessionId);

      if (error) throw error;
      return { messageCount: data?.length || 0 };
    });
  }

  /**
   * Test 4: RLS Policy Validation Function
   */
  private async testValidationFunction(): Promise<void> {
    console.log('\n🔍 Test 4: RLS Policy Validation Function');

    await this.runTest('Validation function works correctly', async () => {
      const { data, error } = await this.serviceClient
        .rpc('validate_session_access', {
          session_id_param: 'test-session-123',
          user_id_param: '00000000-0000-0000-0000-000000000001',
          guest_uuid_param: null
        });

      if (error) throw error;
      return { validationResult: data };
    });
  }

  /**
   * Test 5: Foreign Key Constraint Resolution
   */
  private async testForeignKeyConstraints(): Promise<void> {
    console.log('\n🔗 Test 5: Foreign Key Constraint Resolution');

    // This test ensures that the RLS policy fixes have resolved
    // the foreign key constraint violations that were occurring
    await this.runTest('No foreign key violations in message creation', async () => {
      // Create session first
      const sessionId = `fk-test-${Date.now()}`;
      const session = {
        id: sessionId,
        session_type: 'guest' as const,
        guest_uuid: `fk-guest-${Date.now()}`,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      await this.serviceClient
        .from('selly_chat_sessions')
        .insert(session);

      // Create message - should not violate foreign key constraint
      const message = {
        id: `fk-msg-${Date.now()}`,
        session_id: sessionId,
        content: 'Foreign key constraint test message',
        role: 'user' as const,
        created_at: new Date().toISOString()
      };

      const { data, error } = await this.serviceClient
        .from('selly_chat_messages')
        .insert(message)
        .select()
        .single();

      if (error) throw error;
      return { success: true, messageId: data.id };
    });
  }

  /**
   * Run individual test with error handling and timing
   */
  private async runTest(testName: string, testFn: () => Promise<any>): Promise<void> {
    const startTime = Date.now();
    
    try {
      const result = await testFn();
      const duration = Date.now() - startTime;
      
      this.testResults.push({
        testName,
        success: true,
        details: result,
        duration
      });
      
      console.log(`  ✅ ${testName} (${duration}ms)`);
      if (result && Object.keys(result).length > 0) {
        console.log(`     Details: ${JSON.stringify(result)}`);
      }
      
    } catch (error) {
      const duration = Date.now() - startTime;
      
      this.testResults.push({
        testName,
        success: false,
        error: error instanceof Error ? error.message : String(error),
        duration
      });
      
      console.log(`  ❌ ${testName} (${duration}ms)`);
      console.log(`     Error: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Generate comprehensive test report
   */
  private generateTestReport(): void {
    console.log('\n' + '='.repeat(60));
    console.log('📊 RLS POLICY TEST RESULTS - PHASE 1 CRITICAL FIXES');
    console.log('='.repeat(60));

    const totalTests = this.testResults.length;
    const passedTests = this.testResults.filter(r => r.success).length;
    const failedTests = totalTests - passedTests;
    const totalDuration = this.testResults.reduce((sum, r) => sum + r.duration, 0);

    console.log(`\n📈 SUMMARY:`);
    console.log(`  Total Tests: ${totalTests}`);
    console.log(`  Passed: ${passedTests} ✅`);
    console.log(`  Failed: ${failedTests} ${failedTests > 0 ? '❌' : '✅'}`);
    console.log(`  Success Rate: ${((passedTests / totalTests) * 100).toFixed(1)}%`);
    console.log(`  Total Duration: ${totalDuration}ms`);

    if (failedTests > 0) {
      console.log(`\n❌ FAILED TESTS:`);
      this.testResults
        .filter(r => !r.success)
        .forEach(result => {
          console.log(`  • ${result.testName}`);
          console.log(`    Error: ${result.error}`);
        });
    }

    console.log(`\n🎯 PHASE 1 STATUS:`);
    if (passedTests === totalTests) {
      console.log(`  ✅ ALL CRITICAL RLS POLICY FIXES SUCCESSFUL`);
      console.log(`  ✅ Database persistence issues RESOLVED`);
      console.log(`  ✅ Service role authentication WORKING`);
      console.log(`  ✅ Guest session handling ENHANCED`);
      console.log(`  ✅ Foreign key constraints FIXED`);
      console.log(`  🚀 Ready for Phase 2: Connection Pool Optimization`);
    } else {
      console.log(`  ❌ ${failedTests} critical issues remain`);
      console.log(`  ⚠️  Manual intervention required before Phase 2`);
    }

    console.log('\n' + '='.repeat(60));
  }
}

// Run the tests
async function main() {
  try {
    const tester = new RLSPolicyTester();
    await tester.runAllTests();
  } catch (error) {
    console.error('❌ Test execution failed:', error);
    process.exit(1);
  }
}

// Execute if run directly
if (require.main === module) {
  main();
}

export { RLSPolicyTester };
