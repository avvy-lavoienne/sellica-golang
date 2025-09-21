/**
 * Alternative Silpana Ticketing System Migration
 * Use Supabase client instead of raw SQL execution
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

async function createTablesManually(): Promise<void> {
  console.log('🛠️ Creating Silpana ticketing tables manually...');
  
  try {
    // Since we can't execute SQL directly, we'll need to create sample data
    // to let Supabase infer the table structure, or use the dashboard
    
    console.log('📋 Step 1: Create the base silpana table with sample data');
    
    // Try to create a basic silpana record to establish the table
    const sampleData = {
      id: '00000000-0000-0000-0000-000000000000', // will be replaced by actual UUID
      nama: 'Sample Entry',
      nik: '1234567890123456',
      alamat: 'Sample Address',
      no_hp: '081234567890',
      dokumen_pendukung: 'sample.pdf',
      jenis_kelamin: 'L',
      pekerjaan: 'Sample Job',
      subjek_pengaduan: 'Sample Subject',
      isi_pengaduan: 'Sample complaint content',
      status: 'pending',
      created_at: new Date().toISOString(),
      // New ticketing fields
      ticket_code: null,
      ticket_status: 'submitted',
      priority_level: 'medium',
      assigned_to: null,
      estimated_resolution: null,
      actual_resolution: null,
      resolution_notes: null,
      created_by_ip: null,
      last_updated: new Date().toISOString()
    };
    
    // Try to insert sample data (this will fail if table doesn't exist)
    const { data, error } = await supabase
      .from('silpana')
      .insert([sampleData])
      .select();
    
    if (error) {
      console.warn('⚠️ Cannot create table via insert (expected):', error.message);
      console.log('📋 Manual intervention required:');
      console.log('   1. Open Supabase Dashboard');
      console.log('   2. Go to SQL Editor');
      console.log('   3. Execute the migration SQL file manually');
      console.log('   4. File location: src/lib/migrations/002_silpana_ticketing_system.sql');
      return;
    }
    
    if (data) {
      console.log('✅ Sample data inserted, table exists:', data);
      
      // Clean up sample data
      await supabase
        .from('silpana')
        .delete()
        .eq('id', sampleData.id);
      
      console.log('✅ Sample data cleaned up');
    }
    
  } catch (error) {
    console.error('❌ Manual table creation failed:', error);
    console.log('📋 Please create tables manually in Supabase Dashboard');
  }
}

async function checkDashboardAccess(): Promise<void> {
  console.log('🔍 Checking Supabase Dashboard access instructions...');
  console.log('📋 Manual Migration Steps:');
  console.log('   1. Open https://app.supabase.com/');
  console.log('   2. Navigate to your project');
  console.log('   3. Go to SQL Editor');
  console.log('   4. Copy and paste the contents of:');
  console.log('      src/lib/migrations/002_silpana_ticketing_system.sql');
  console.log('   5. Execute the SQL');
  console.log('   6. Return here to test the migration');
  console.log('');
  console.log('🔗 Project URL:', supabaseUrl);
  console.log('');
  console.log('📄 Migration SQL file content preview:');
  
  try {
    const fs = await import('fs');
    const path = await import('path');
    const migrationPath = path.join(process.cwd(), 'src/lib/migrations/002_silpana_ticketing_system.sql');
    const migrationSQL = fs.readFileSync(migrationPath, 'utf-8');
    
    console.log('```sql');
    console.log(migrationSQL.substring(0, 500) + '...');
    console.log('```');
    
  } catch (e) {
    console.log('   (Could not read migration file - please check file exists)');
  }
}

async function main(): Promise<void> {
  console.log('🎫 Alternative Silpana Migration Approach');
  console.log('==========================================');
  
  await createTablesManually();
  console.log('');
  await checkDashboardAccess();
}

main().catch(console.error);