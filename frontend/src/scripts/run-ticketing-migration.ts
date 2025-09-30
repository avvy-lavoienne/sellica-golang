/**
 * Silpana Ticketing System Migration Runner
 * Phase 1: Ticketing System Implementation - Execute Silpana Ticketing Migration
 * 
 * This script executes the database migration for Silpana Ticketing System.
 * 
 * Created: 2025-09-21
 * Version: 1.0
 * Usage: pnpm run migration:silpana-ticketing
 */

import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { join } from 'path';
import { config } from 'dotenv';

// Load environment variables
config({ path: '.env.local' });

// Supabase configuration
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing required environment variables:');
  console.error('   - NEXT_PUBLIC_SUPABASE_URL');
  console.error('   - SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

// Create Supabase client with service role key
const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
  db: {
    schema: 'public',
  },
});

/**
 * Execute database migration for Silpana Ticketing System
 */
async function runTicketingMigration(): Promise<void> {
  console.log('🎫 Starting Silpana Ticketing System Migration...');
  console.log('📅 Date:', new Date().toISOString());
  console.log('🔗 Supabase URL:', supabaseUrl);
  
  try {
    // Test database connection first
    console.log('🔍 Testing database connection...');
    const { data: testData, error: testError } = await supabase
      .from('profiles')
      .select('count')
      .limit(1);
    
    if (testError) {
      console.log('⚠️ profiles table not found, trying alternative table...');
      // Try alternative table for connection test
      const { data: altData, error: altError } = await supabase
        .rpc('version'); // Test with simple function
      
      if (altError) {
        throw new Error(`Database connection failed: ${altError.message}`);
      }
    }
    
    console.log('✅ Database connection successful');
    
    // Read migration SQL file
    const migrationPath = join(process.cwd(), 'src/lib/migrations/002_silpana_ticketing_system.sql');
    console.log('📄 Reading migration file:', migrationPath);
    
    const migrationSQL = readFileSync(migrationPath, 'utf-8');
    console.log('📏 Migration size:', `${migrationSQL.length} characters`);
    
    // Execute migration using Supabase SQL editor approach
    console.log('⚡ Executing ticketing system migration...');
    const startTime = performance.now();
    
    let successCount = 0;
    let errorCount = 0;
    
    // Execute the entire migration as one SQL block
    try {
      console.log('⚡ Executing complete migration SQL...');
      
      // Use the simplest approach - execute the SQL directly
      const { data, error } = await supabase.rpc('exec_sql', { 
        sql: migrationSQL 
      });
      
      if (error) {
        console.warn('⚠️ RPC approach failed, trying alternative execution...');
        console.error('RPC Error:', error.message);
        
        // Alternative: try executing line by line for better error isolation
        const lines = migrationSQL
          .split('\n')
          .map(line => line.trim())
          .filter(line => line.length > 0 && !line.startsWith('--'));
        
        let currentStatement = '';
        
        for (const line of lines) {
          currentStatement += line + '\n';
          
          // Execute when we hit a semicolon (end of statement)
          if (line.endsWith(';')) {
            try {
              const { error: lineError } = await supabase.rpc('exec_sql', { 
                sql: currentStatement.trim() 
              });
              
              if (lineError) {
                console.warn(`⚠️ Statement failed: ${currentStatement.substring(0, 100)}...`);
                console.warn(`Error: ${lineError.message}`);
                errorCount++;
              } else {
                successCount++;
              }
            } catch (e) {
              console.warn(`⚠️ Exception executing: ${currentStatement.substring(0, 100)}...`);
              errorCount++;
            }
            
            currentStatement = '';
            await new Promise(resolve => setTimeout(resolve, 50)); // Small delay
          }
        }
        
        console.log(`📊 Line-by-line execution: ${successCount} success, ${errorCount} errors`);
        
      } else {
        console.log('✅ Complete migration executed successfully');
        successCount = 1;
      }
      
    } catch (migrationError) {
      console.error('❌ Migration execution failed:', migrationError);
      errorCount = 1;
      throw migrationError;
    }
    
    const executionTime = performance.now() - startTime;
    
    console.log('\n📊 Migration Summary:');
    console.log(`✅ Successful operations: ${successCount}`);
    console.log(`❌ Failed operations: ${errorCount}`);
    console.log(`⏱️ Total execution time: ${executionTime.toFixed(2)}ms`);
    
    // Verify migration results
    console.log('\n🔍 Verifying ticketing system migration results...');
    
    // Check if silpana_data table has new columns
    console.log('📋 Checking silpana_data table enhancements...');
    const { data: silpanaCheck, error: silpanaError } = await supabase
      .from('silpana_data')
      .select('ticket_code, ticket_status, priority_level, assigned_to, estimated_resolution, last_updated')
      .limit(1);
    
    if (!silpanaError) {
      console.log('✅ silpana_data table enhanced successfully');
    } else {
      console.warn('⚠️ silpana_data table enhancement verification failed:', silpanaError.message);
    }
    
    // Check if ticket_history table exists
    console.log('📋 Checking ticket_history table...');
    const { data: historyCheck, error: historyError } = await supabase
      .from('ticket_history')
      .select('count')
      .limit(1);
    
    if (!historyError) {
      console.log('✅ ticket_history table created successfully');
    } else {
      console.warn('⚠️ ticket_history table verification failed:', historyError.message);
    }
    
    // Check if ticket_communication table exists
    console.log('📋 Checking ticket_communication table...');
    const { data: commCheck, error: commError } = await supabase
      .from('ticket_communication')
      .select('count')
      .limit(1);
    
    if (!commError) {
      console.log('✅ ticket_communication table created successfully');
    } else {
      console.warn('⚠️ ticket_communication table verification failed:', commError.message);
    }
    
    // Test ticket code generation function
    console.log('📋 Testing ticket code generation function...');
    try {
      const { data: ticketCodeTest, error: ticketCodeError } = await supabase
        .rpc('generate_ticket_code');
      
      if (!ticketCodeError && ticketCodeTest) {
        console.log('✅ Ticket code generation function working:', ticketCodeTest);
      } else {
        console.warn('⚠️ Ticket code generation function test failed:', ticketCodeError?.message);
      }
    } catch (tcError) {
      console.warn('⚠️ Could not test ticket code generation function:', tcError);
    }
    
    if (errorCount === 0) {
      console.log('\n🎉 Silpana Ticketing System Migration completed successfully!');
      console.log('📋 Next steps:');
      console.log('   1. Test ticket creation with unique codes');
      console.log('   2. Test ticket lookup functionality');
      console.log('   3. Test status update and history logging');
      console.log('   4. Verify RLS policies for ticket access');
      console.log('   5. Test real-time subscriptions for ticket updates');
    } else {
      console.log('\n⚠️ Migration completed with some errors');
      console.log('📋 Please review the failed operations and fix manually if needed');
      console.log('📋 Consider running individual SQL statements in Supabase dashboard');
    }
    
  } catch (error) {
    console.error('❌ Ticketing Migration failed:', error);
    console.error('📋 Please check your database configuration and migration file');
    throw error;
  }
}

/**
 * Rollback ticketing system migration
 */
async function rollbackTicketingMigration(): Promise<void> {
  console.log('↩️ Starting Silpana Ticketing System Rollback...');
  
  try {
    // Read rollback SQL file
    const rollbackPath = join(process.cwd(), 'src/lib/migrations/rollback_002_silpana_ticketing_system.sql');
    console.log('📄 Reading rollback file:', rollbackPath);
    
    const rollbackSQL = readFileSync(rollbackPath, 'utf-8');
    console.log('📏 Rollback size:', `${rollbackSQL.length} characters`);
    
    // Execute rollback
    const { error } = await supabase.rpc('exec_sql', { 
      sql: rollbackSQL 
    });
    
    if (error) {
      throw error;
    }
    
    console.log('✅ Rollback completed successfully');
    
  } catch (error) {
    console.error('❌ Rollback failed:', error);
    throw error;
  }
}

// Main execution
async function main(): Promise<void> {
  const args = process.argv.slice(2);
  const isRollback = args.includes('--rollback');
  
  try {
    if (isRollback) {
      await rollbackTicketingMigration();
    } else {
      await runTicketingMigration();
    }
  } catch (error) {
    console.error('❌ Migration script failed:', error);
    console.error('📋 Manual intervention may be required');
    process.exit(1);
  }
}

// Execute if run directly
if (require.main === module) {
  main().catch(error => {
    console.error('❌ Migration runner failed:', error);
    process.exit(1);
  });
}

export { runTicketingMigration, rollbackTicketingMigration };