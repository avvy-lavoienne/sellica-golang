#!/usr/bin/env tsx

/**
 * UUID Migration Script Runner
 * Executes the UUID optimization migration and validates results
 */

import dotenv from 'dotenv';
import path from 'path';

// Load environment variables
dotenv.config({ path: path.join(process.cwd(), '.env.local') });

import { MigrationRunner } from '../services/database/MigrationRunner';
import { UUIDMappingService } from '../services/auth/UUIDMappingService';

interface MigrationStats {
  startTime: Date;
  endTime: Date;
  duration: number;
  migrationsRun: number;
  sessionsProcessed: number;
  errors: number;
  success: boolean;
}

class UUIDMigrationRunner {
  private migrationRunner: MigrationRunner;
  private uuidService: UUIDMappingService;

  constructor() {
    this.migrationRunner = MigrationRunner.getInstance();
    this.uuidService = UUIDMappingService.getInstance();
  }

  async runFullMigration(): Promise<MigrationStats> {
    const startTime = new Date();
    console.log('🚀 [UUID_MIGRATION] Starting UUID optimization migration...');
    console.log(`📅 [UUID_MIGRATION] Start time: ${startTime.toISOString()}`);

    const stats: MigrationStats = {
      startTime,
      endTime: new Date(),
      duration: 0,
      migrationsRun: 0,
      sessionsProcessed: 0,
      errors: 0,
      success: false
    };

    try {
      // Step 1: Initialize migration system
      console.log('🔧 [UUID_MIGRATION] Step 1: Initializing migration system...');
      await this.migrationRunner.initialize();

      // Step 2: Run UUID migration
      console.log('🔧 [UUID_MIGRATION] Step 2: Running UUID schema migration...');
      const migrationResult = await this.migrationRunner.runUUIDMigration();
      
      if (!migrationResult.success) {
        throw new Error(`Migration failed: ${migrationResult.message}`);
      }

      stats.migrationsRun = 1;
      console.log(`✅ [UUID_MIGRATION] Schema migration completed in ${migrationResult.executionTime}ms`);

      // Step 3: Migrate existing sessions
      console.log('🔧 [UUID_MIGRATION] Step 3: Migrating existing email-based sessions...');
      const sessionMigration = await this.uuidService.migrateExistingSessions();
      
      stats.sessionsProcessed = sessionMigration.migrated;
      stats.errors = sessionMigration.errors;

      console.log(`✅ [UUID_MIGRATION] Session migration completed:`);
      console.log(`   📊 Sessions migrated: ${sessionMigration.migrated}`);
      console.log(`   ❌ Errors encountered: ${sessionMigration.errors}`);

      // Step 4: Validate migration
      console.log('🔧 [UUID_MIGRATION] Step 4: Validating migration results...');
      const validationResult = await this.validateMigration();
      
      if (!validationResult.success) {
        console.warn('⚠️ [UUID_MIGRATION] Validation warnings found:', validationResult.warnings);
      }

      // Step 5: Performance test
      console.log('🔧 [UUID_MIGRATION] Step 5: Running performance tests...');
      await this.runPerformanceTests();

      stats.endTime = new Date();
      stats.duration = stats.endTime.getTime() - stats.startTime.getTime();
      stats.success = true;

      console.log('🎉 [UUID_MIGRATION] Migration completed successfully!');
      console.log(`⏱️ [UUID_MIGRATION] Total duration: ${stats.duration}ms`);

      return stats;
    } catch (error) {
      stats.endTime = new Date();
      stats.duration = stats.endTime.getTime() - stats.startTime.getTime();
      stats.success = false;
      stats.errors++;

      console.error('❌ [UUID_MIGRATION] Migration failed:', error);
      throw error;
    }
  }

  private async validateMigration(): Promise<{ success: boolean; warnings: string[] }> {
    const warnings: string[] = [];

    try {
      // Check if migration table exists and has entries
      const migrationStatus = await this.migrationRunner.getMigrationStatus();
      
      if (migrationStatus.executed === 0) {
        warnings.push('No migrations have been executed');
      }

      if (migrationStatus.pending > 0) {
        warnings.push(`${migrationStatus.pending} migrations are still pending`);
      }

      // Test UUID mapping service
      const testEmail = 'test@example.com';
      const testUUID = await this.uuidService.getOrCreateUserUUID(testEmail);
      
      if (!this.uuidService.isValidUUID(testUUID)) {
        warnings.push('UUID mapping service is not generating valid UUIDs');
      }

      // Test UUID resolution
      const resolvedUUID = await this.uuidService.resolveToUUID(testEmail);
      if (resolvedUUID !== testUUID) {
        warnings.push('UUID resolution is not consistent');
      }

      console.log('✅ [UUID_MIGRATION] Validation completed');
      console.log(`   📊 Migration status: ${migrationStatus.executed}/${migrationStatus.total} executed`);
      console.log(`   🔍 UUID mapping test: ${testUUID.slice(0, 8)}...`);

      return {
        success: warnings.length === 0,
        warnings
      };
    } catch (error) {
      console.error('❌ [UUID_MIGRATION] Validation failed:', error);
      return {
        success: false,
        warnings: [`Validation error: ${error instanceof Error ? error.message : 'Unknown error'}`]
      };
    }
  }

  private async runPerformanceTests(): Promise<void> {
    console.log('🔧 [UUID_MIGRATION] Running performance tests...');

    try {
      // Test 1: UUID generation performance
      const uuidGenStart = performance.now();
      const testEmails = Array.from({ length: 100 }, (_, i) => `test${i}@example.com`);
      
      await Promise.all(
        testEmails.map(email => this.uuidService.getOrCreateUserUUID(email))
      );
      
      const uuidGenTime = performance.now() - uuidGenStart;
      console.log(`   ⚡ UUID generation: ${uuidGenTime.toFixed(2)}ms for 100 emails`);

      // Test 2: UUID resolution performance
      const resolveStart = performance.now();
      
      await Promise.all(
        testEmails.map(email => this.uuidService.resolveToUUID(email))
      );
      
      const resolveTime = performance.now() - resolveStart;
      console.log(`   ⚡ UUID resolution: ${resolveTime.toFixed(2)}ms for 100 emails`);

      // Test 3: Cache performance
      const cacheStats = this.uuidService.getCacheStats();
      console.log(`   💾 Cache stats: ${cacheStats.size}/${cacheStats.maxSize} entries`);

      // Performance targets validation
      const avgUuidGenTime = uuidGenTime / 100;
      const avgResolveTime = resolveTime / 100;

      if (avgUuidGenTime > 10) {
        console.warn(`⚠️ [UUID_MIGRATION] UUID generation slower than target: ${avgUuidGenTime.toFixed(2)}ms > 10ms`);
      }

      if (avgResolveTime > 5) {
        console.warn(`⚠️ [UUID_MIGRATION] UUID resolution slower than target: ${avgResolveTime.toFixed(2)}ms > 5ms`);
      }

      console.log('✅ [UUID_MIGRATION] Performance tests completed');
    } catch (error) {
      console.error('❌ [UUID_MIGRATION] Performance tests failed:', error);
    }
  }

  async rollbackMigration(): Promise<void> {
    console.log('🔄 [UUID_MIGRATION] Starting migration rollback...');

    try {
      // Clear UUID mapping cache
      this.uuidService.clearCache();
      console.log('✅ [UUID_MIGRATION] UUID mapping cache cleared');

      // Note: Database rollback would require additional SQL scripts
      console.log('⚠️ [UUID_MIGRATION] Database rollback requires manual SQL execution');
      console.log('   Run the following to rollback:');
      console.log('   DROP TABLE IF EXISTS user_uuid_mappings CASCADE;');
      console.log('   DELETE FROM migration_log WHERE migration_name = \'001_create_user_uuid_mappings\';');

    } catch (error) {
      console.error('❌ [UUID_MIGRATION] Rollback failed:', error);
      throw error;
    }
  }
}

// Main execution
async function main() {
  const runner = new UUIDMigrationRunner();

  try {
    // Check command line arguments
    const args = process.argv.slice(2);
    
    if (args.includes('--rollback')) {
      await runner.rollbackMigration();
      console.log('🎉 [UUID_MIGRATION] Rollback completed');
      return;
    }

    // Run full migration
    const stats = await runner.runFullMigration();

    // Print final summary
    console.log('\n📊 [UUID_MIGRATION] Final Summary:');
    console.log(`   ⏱️ Duration: ${stats.duration}ms`);
    console.log(`   📋 Migrations run: ${stats.migrationsRun}`);
    console.log(`   👥 Sessions processed: ${stats.sessionsProcessed}`);
    console.log(`   ❌ Errors: ${stats.errors}`);
    console.log(`   ✅ Success: ${stats.success}`);

    if (stats.success) {
      console.log('\n🎉 [UUID_MIGRATION] UUID optimization migration completed successfully!');
      console.log('   🔧 Next steps:');
      console.log('   1. Restart the application to use enhanced authentication');
      console.log('   2. Monitor logs for UUID validation errors (should be zero)');
      console.log('   3. Verify improved database performance');
    }

    process.exit(stats.success ? 0 : 1);
  } catch (error) {
    console.error('\n💥 [UUID_MIGRATION] Migration failed with error:', error);
    console.log('\n🔄 [UUID_MIGRATION] To rollback, run: npm run migrate:uuid -- --rollback');
    process.exit(1);
  }
}

// Handle unhandled rejections
process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ [UUID_MIGRATION] Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

// Run if called directly
if (require.main === module) {
  main();
}

export { UUIDMigrationRunner };
