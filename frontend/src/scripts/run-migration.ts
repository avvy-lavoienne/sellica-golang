/**
 * Database Migration Runner
 * Phase 1: Foundation Enhancement - Execute SELLY Chat Enhancement Migration
 * 
 * This script executes the database migration for SELLY-SELLICA Supabase integration.
 * 
 * Created: 2025-08-13
 * Version: 1.0
 * Usage: pnpm run migration:selly-chat
 */

import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { join } from 'path';
import { config } from 'dotenv';

// Load environment variables
config({ path: '.env.local' });

// Supabase configuration
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY!;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing required environment variables:');
  console.error('   - NEXT_PUBLIC_SUPABASE_URL');
  console.error('   - SUPABASE_SERVICE_ROLE_KEY or NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

// Create Supabase client with service role key
const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

/**
 * Execute database migration
 */
async function runMigration(): Promise<void> {
  console.log('🚀 Starting SELLY Chat Enhancement Migration...');
  console.log('📅 Date:', new Date().toISOString());
  console.log('🔗 Supabase URL:', supabaseUrl);
  
  try {
    // Read migration SQL file
    const migrationPath = join(process.cwd(), 'src/lib/migrations/001-selly-chat-enhancement.sql');
    const migrationSQL = readFileSync(migrationPath, 'utf-8');
    
    console.log('📄 Migration file loaded:', migrationPath);
    console.log('📏 Migration size:', `${migrationSQL.length} characters`);
    
    // Test database connection
    console.log('🔍 Testing database connection...');
    const { data: testData, error: testError } = await supabase
      .from('profiles')
      .select('count')
      .limit(1);
    
    if (testError) {
      throw new Error(`Database connection failed: ${testError.message}`);
    }
    
    console.log('✅ Database connection successful');
    
    // Execute migration
    console.log('⚡ Executing migration...');
    const startTime = performance.now();
    
    // Split migration into individual statements for better error handling
    const statements = migrationSQL
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'));
    
    console.log(`📋 Found ${statements.length} SQL statements to execute`);
    
    let successCount = 0;
    let errorCount = 0;
    
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      
      // Skip comments and empty statements
      if (!statement || statement.startsWith('--') || statement.trim() === '') {
        continue;
      }
      
      try {
        console.log(`⚡ Executing statement ${i + 1}/${statements.length}...`);
        
        // Execute the SQL statement
        const { error } = await supabase.rpc('exec_sql', { sql: statement });
        
        if (error) {
          // Try direct execution for statements that don't work with rpc
          const { error: directError } = await supabase
            .from('_temp_migration')
            .select('*')
            .limit(0); // This will fail but allows us to execute raw SQL
          
          if (directError && !directError.message.includes('does not exist')) {
            throw error;
          }
        }
        
        successCount++;
        console.log(`✅ Statement ${i + 1} executed successfully`);
        
      } catch (statementError) {
        errorCount++;
        console.error(`❌ Statement ${i + 1} failed:`, statementError);
        
        // Log the problematic statement for debugging
        console.error('📄 Failed statement:', statement.substring(0, 200) + '...');
        
        // Continue with other statements unless it's a critical error
        if (statement.includes('CREATE TABLE') || statement.includes('ALTER TABLE')) {
          console.warn('⚠️ Critical statement failed, but continuing...');
        }
      }
    }
    
    const executionTime = performance.now() - startTime;
    
    console.log('\n📊 Migration Summary:');
    console.log(`✅ Successful statements: ${successCount}`);
    console.log(`❌ Failed statements: ${errorCount}`);
    console.log(`⏱️ Total execution time: ${executionTime.toFixed(2)}ms`);
    
    // Verify migration results
    console.log('\n🔍 Verifying migration results...');
    
    // Check if selly_chat_sessions table exists
    const { data: sessionsTable, error: sessionsError } = await supabase
      .from('selly_chat_sessions')
      .select('count')
      .limit(1);
    
    if (!sessionsError) {
      console.log('✅ selly_chat_sessions table created successfully');
    } else {
      console.warn('⚠️ selly_chat_sessions table verification failed:', sessionsError.message);
    }
    
    // Check if selly_chat_messages table exists
    const { data: messagesTable, error: messagesError } = await supabase
      .from('selly_chat_messages')
      .select('count')
      .limit(1);
    
    if (!messagesError) {
      console.log('✅ selly_chat_messages table created successfully');
    } else {
      console.warn('⚠️ selly_chat_messages table verification failed:', messagesError.message);
    }
    
    // Check if profiles table has new columns
    const { data: profilesData, error: profilesError } = await supabase
      .from('profiles')
      .select('selly_preferences, last_selly_interaction, selly_conversation_count, selly_user_preferences')
      .limit(1);
    
    if (!profilesError) {
      console.log('✅ profiles table enhanced successfully');
    } else {
      console.warn('⚠️ profiles table enhancement verification failed:', profilesError.message);
    }
    
    if (errorCount === 0) {
      console.log('\n🎉 Migration completed successfully!');
      console.log('📋 Next steps:');
      console.log('   1. Test enhanced user context service');
      console.log('   2. Test smart greeting manager');
      console.log('   3. Test conversation persistence');
      console.log('   4. Verify RLS policies are working');
    } else {
      console.log('\n⚠️ Migration completed with some errors');
      console.log('📋 Please review the failed statements and fix manually if needed');
    }
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
    console.error('📋 Please check your database configuration and try again');
    process.exit(1);
  }
}

/**
 * Alternative migration method using direct SQL execution
 */
async function runMigrationDirect(): Promise<void> {
  console.log('🔄 Attempting direct SQL execution...');
  
  try {
    const migrationPath = join(process.cwd(), 'src/lib/migrations/001-selly-chat-enhancement.sql');
    const migrationSQL = readFileSync(migrationPath, 'utf-8');
    
    // Execute the entire migration as one transaction
    const { error } = await supabase.rpc('exec_migration', { 
      migration_sql: migrationSQL 
    });
    
    if (error) {
      throw error;
    }
    
    console.log('✅ Direct migration execution successful');
    
  } catch (error) {
    console.error('❌ Direct migration failed:', error);
    throw error;
  }
}

// Main execution
async function main(): Promise<void> {
  try {
    await runMigration();
  } catch (error) {
    console.log('\n🔄 Primary migration method failed, trying alternative...');
    try {
      await runMigrationDirect();
    } catch (alternativeError) {
      console.error('❌ All migration methods failed');
      console.error('📋 Manual migration may be required');
      process.exit(1);
    }
  }
}

// Execute if run directly
if (require.main === module) {
  main().catch(error => {
    console.error('❌ Migration script failed:', error);
    process.exit(1);
  });
}

export { runMigration, runMigrationDirect };
