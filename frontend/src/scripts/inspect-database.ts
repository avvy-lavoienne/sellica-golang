/**
 * Database Table Inspector
 * Check what tables exist in the database
 */

import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';

// Load environment variables
config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

async function inspectDatabase(): Promise<void> {
  console.log('🔍 Inspecting database tables...');
  
  try {
    // Check for silpana-related tables specifically
    const silpanaTables = ['silpana', 'silpana_data', 'silpana_submissions', 'profiles', 'users'];
    
    for (const tableName of silpanaTables) {
      try {
        const { data, error } = await supabase
          .from(tableName)
          .select('count')
          .limit(1);
        
        if (!error) {
          console.log(`✅ Table exists: ${tableName}`);
          
          // Try to get some basic info about the table
          const { data: sampleData, error: sampleError } = await supabase
            .from(tableName)
            .select('*')
            .limit(1);
          
          if (!sampleError && sampleData && sampleData.length > 0) {
            console.log(`📋 ${tableName} sample columns:`, Object.keys(sampleData[0]));
          } else {
            console.log(`📋 ${tableName} exists but is empty or no permissions`);
          }
        } else {
          console.log(`❌ Table not found: ${tableName} (${error.message})`);
        }
      } catch (tableError) {
        console.log(`❌ Error checking ${tableName}:`, tableError);
      }
    }
    
    // Try to check what functions are available
    console.log('\n🔧 Checking available RPC functions...');
    const rpcFunctions = ['version', 'current_user', 'current_database'];
    
    for (const funcName of rpcFunctions) {
      try {
        const { data, error } = await supabase.rpc(funcName);
        if (!error) {
          console.log(`✅ Function available: ${funcName} -> ${data}`);
        } else {
          console.log(`❌ Function not available: ${funcName} (${error.message})`);
        }
      } catch (e) {
        console.log(`❌ Function error: ${funcName}`, e);
      }
    }
    
  } catch (error) {
    console.error('❌ Database inspection failed:', error);
  }
}

inspectDatabase().catch(console.error);