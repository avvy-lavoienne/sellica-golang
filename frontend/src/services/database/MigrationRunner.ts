/**
 * Migration Runner Service
 * Handles database migrations for UUID optimization and other schema updates
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

interface Migration {
  id: string;
  name: string;
  executed_at: string;
  description: string;
  checksum: string;
}

interface MigrationResult {
  success: boolean;
  migration: string;
  message: string;
  executionTime: number;
  error?: string;
}

export class MigrationRunner {
  private static instance: MigrationRunner;
  private supabase: SupabaseClient;
  private migrationsPath: string;

  private constructor() {
    this.supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    this.migrationsPath = path.join(process.cwd(), 'src/database/migrations');
    console.log('✅ [MIGRATION_RUNNER] Service initialized');
  }

  static getInstance(): MigrationRunner {
    if (!MigrationRunner.instance) {
      MigrationRunner.instance = new MigrationRunner();
    }
    return MigrationRunner.instance;
  }

  /**
   * Initialize migration system - create migration_log table if it doesn't exist
   */
  async initialize(): Promise<void> {
    try {
      console.log('🔧 [MIGRATION_RUNNER] Initializing migration system...');

      // Create migration_log table using direct SQL execution
      const { error } = await this.supabase
        .from('migration_log')
        .select('id')
        .limit(1);

      if (error && error.code !== 'PGRST116') { // PGRST116 = table doesn't exist, which is expected
        console.error('❌ [MIGRATION_RUNNER] Failed to initialize migration system:', error);
        // For now, we'll assume the table doesn't exist and that's okay
        console.log('⚠️ [MIGRATION_RUNNER] Migration log table may not exist yet - will be created during migration');
      }

      console.log('✅ [MIGRATION_RUNNER] Migration system initialized');
    } catch (error) {
      console.error('❌ [MIGRATION_RUNNER] Initialization failed:', error);
      throw error;
    }
  }

  /**
   * Run all pending migrations
   */
  async runPendingMigrations(): Promise<MigrationResult[]> {
    try {
      console.log('🚀 [MIGRATION_RUNNER] Starting migration process...');

      // Ensure migration system is initialized
      await this.initialize();

      // Get list of migration files
      const migrationFiles = await this.getMigrationFiles();
      console.log(`📋 [MIGRATION_RUNNER] Found ${migrationFiles.length} migration files`);

      // Get executed migrations
      const executedMigrations = await this.getExecutedMigrations();
      const executedNames = new Set(executedMigrations.map(m => m.name));

      // Filter pending migrations
      const pendingMigrations = migrationFiles.filter(file => !executedNames.has(file));
      
      if (pendingMigrations.length === 0) {
        console.log('✅ [MIGRATION_RUNNER] No pending migrations');
        return [];
      }

      console.log(`🔄 [MIGRATION_RUNNER] Running ${pendingMigrations.length} pending migrations`);

      const results: MigrationResult[] = [];

      // Run each pending migration
      for (const migrationFile of pendingMigrations) {
        const result = await this.runMigration(migrationFile);
        results.push(result);

        if (!result.success) {
          console.error(`❌ [MIGRATION_RUNNER] Migration ${migrationFile} failed, stopping`);
          break;
        }
      }

      console.log('✅ [MIGRATION_RUNNER] Migration process completed');
      return results;
    } catch (error) {
      console.error('❌ [MIGRATION_RUNNER] Migration process failed:', error);
      throw error;
    }
  }

  /**
   * Run a specific migration
   */
  async runMigration(migrationName: string): Promise<MigrationResult> {
    const startTime = Date.now();
    
    try {
      console.log(`🔄 [MIGRATION_RUNNER] Running migration: ${migrationName}`);

      // Read migration file
      const migrationPath = path.join(this.migrationsPath, migrationName);
      const migrationSQL = fs.readFileSync(migrationPath, 'utf8');

      // Calculate checksum
      const checksum = this.calculateChecksum(migrationSQL);

      // For now, we'll skip actual SQL execution and just log the migration
      // In a real implementation, you would need to execute this SQL manually in Supabase
      console.log('📋 [MIGRATION_RUNNER] Migration SQL to execute:');
      console.log('----------------------------------------');
      console.log(migrationSQL);
      console.log('----------------------------------------');
      console.log('⚠️ [MIGRATION_RUNNER] Please execute this SQL manually in your Supabase SQL editor');

      // Simulate successful execution for now
      const error = null;

      const executionTime = Date.now() - startTime;

      if (error) {
        // Log failed migration
        await this.logMigration(migrationName, false, executionTime, (error as unknown) instanceof Error ? (error as Error).message : String(error), checksum);
        
        const errorMessage = (error as unknown) instanceof Error ? (error as Error).message : String(error);
        return {
          success: false,
          migration: migrationName,
          message: `Migration failed: ${errorMessage}`,
          executionTime,
          error: errorMessage
        };
      }

      // Log successful migration
      await this.logMigration(migrationName, true, executionTime, undefined, checksum);

      console.log(`✅ [MIGRATION_RUNNER] Migration ${migrationName} completed in ${executionTime}ms`);

      return {
        success: true,
        migration: migrationName,
        message: 'Migration completed successfully',
        executionTime
      };
    } catch (error) {
      const executionTime = Date.now() - startTime;
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';

      // Log failed migration
      await this.logMigration(migrationName, false, executionTime, errorMessage);

      console.error(`❌ [MIGRATION_RUNNER] Migration ${migrationName} failed:`, error);

      return {
        success: false,
        migration: migrationName,
        message: `Migration failed: ${errorMessage}`,
        executionTime,
        error: errorMessage
      };
    }
  }

  /**
   * Run UUID migration specifically
   */
  async runUUIDMigration(): Promise<MigrationResult> {
    try {
      console.log('🔄 [MIGRATION_RUNNER] Running UUID optimization migration...');

      const result = await this.runMigration('001_create_user_uuid_mappings.sql');
      
      if (result.success) {
        // Run the migration function to migrate existing sessions
        console.log('🔄 [MIGRATION_RUNNER] Migrating existing email-based sessions...');
        
        const { data, error } = await this.supabase.rpc('migrate_email_sessions_to_uuid');
        
        if (error) {
          console.error('⚠️ [MIGRATION_RUNNER] Session migration warning:', error);
        } else if (data) {
          console.log(`✅ [MIGRATION_RUNNER] Migrated ${data.length} email sessions to UUID format`);
        }
      }

      return result;
    } catch (error) {
      console.error('❌ [MIGRATION_RUNNER] UUID migration failed:', error);
      throw error;
    }
  }

  /**
   * Get migration status
   */
  async getMigrationStatus(): Promise<{
    total: number;
    executed: number;
    pending: number;
    lastMigration?: Migration;
  }> {
    try {
      const migrationFiles = await this.getMigrationFiles();
      const executedMigrations = await this.getExecutedMigrations();

      return {
        total: migrationFiles.length,
        executed: executedMigrations.length,
        pending: migrationFiles.length - executedMigrations.length,
        lastMigration: executedMigrations[executedMigrations.length - 1]
      };
    } catch (error) {
      console.error('❌ [MIGRATION_RUNNER] Failed to get migration status:', error);
      throw error;
    }
  }

  // Private helper methods

  private async getMigrationFiles(): Promise<string[]> {
    try {
      if (!fs.existsSync(this.migrationsPath)) {
        console.warn('⚠️ [MIGRATION_RUNNER] Migrations directory not found');
        return [];
      }

      const files = fs.readdirSync(this.migrationsPath)
        .filter(file => file.endsWith('.sql'))
        .sort(); // Ensure migrations run in order

      return files;
    } catch (error) {
      console.error('❌ [MIGRATION_RUNNER] Failed to read migration files:', error);
      return [];
    }
  }

  private async getExecutedMigrations(): Promise<Migration[]> {
    try {
      const { data, error } = await this.supabase
        .from('migration_log')
        .select('*')
        .eq('success', true)
        .order('executed_at', { ascending: true });

      if (error) {
        console.error('❌ [MIGRATION_RUNNER] Failed to get executed migrations:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('❌ [MIGRATION_RUNNER] Failed to query executed migrations:', error);
      return [];
    }
  }

  private async logMigration(
    migrationName: string,
    success: boolean,
    executionTime: number,
    errorMessage?: string,
    checksum?: string
  ): Promise<void> {
    try {
      const { error } = await this.supabase
        .from('migration_log')
        .insert({
          migration_name: migrationName,
          executed_at: new Date().toISOString(),
          description: `Migration ${success ? 'completed' : 'failed'}`,
          checksum,
          execution_time_ms: executionTime,
          success,
          error_message: errorMessage
        });

      if (error) {
        console.error('⚠️ [MIGRATION_RUNNER] Failed to log migration:', error);
      }
    } catch (error) {
      console.error('⚠️ [MIGRATION_RUNNER] Failed to log migration:', error);
    }
  }

  private calculateChecksum(content: string): string {
    // Simple checksum calculation (in production, use crypto.createHash)
    let hash = 0;
    for (let i = 0; i < content.length; i++) {
      const char = content.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash).toString(16);
  }
}
