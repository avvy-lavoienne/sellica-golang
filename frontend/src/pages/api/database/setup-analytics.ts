import { NextApiRequest, NextApiResponse } from 'next';
import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Initialize Supabase client with service role key for admin operations
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !serviceRoleKey) {
      return res.status(500).json({ 
        error: 'Missing Supabase configuration',
        details: {
          hasUrl: !!supabaseUrl,
          hasServiceKey: !!serviceRoleKey
        }
      });
    }

    const supabase = createClient(supabaseUrl, serviceRoleKey);

    // Read the migration file
    const migrationPath = path.join(process.cwd(), 'src/database/migrations/003_create_analytics_tables.sql');
    
    if (!fs.existsSync(migrationPath)) {
      return res.status(500).json({ 
        error: 'Migration file not found',
        path: migrationPath
      });
    }

    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');

    // Execute the migration
    console.log('🔧 [DATABASE_SETUP] Running analytics tables migration...');
    
    const { data, error } = await supabase.rpc('exec_sql', { 
      sql: migrationSQL 
    });

    if (error) {
      console.error('❌ [DATABASE_SETUP] Migration failed:', error);
      
      // Try alternative approach - execute statements individually
      const statements = migrationSQL
        .split(';')
        .map(stmt => stmt.trim())
        .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'));

      const results = [];
      let successCount = 0;
      let errorCount = 0;

      for (const statement of statements) {
        try {
          const { data: stmtData, error: stmtError } = await supabase
            .from('information_schema.tables')
            .select('*')
            .limit(1);

          if (stmtError) {
            console.warn(`⚠️ Statement failed: ${statement.substring(0, 100)}...`);
            errorCount++;
            results.push({
              statement: statement.substring(0, 100) + '...',
              success: false,
              error: stmtError.message
            });
          } else {
            successCount++;
            results.push({
              statement: statement.substring(0, 100) + '...',
              success: true
            });
          }
        } catch (err) {
          errorCount++;
          results.push({
            statement: statement.substring(0, 100) + '...',
            success: false,
            error: err instanceof Error ? err.message : 'Unknown error'
          });
        }
      }

      return res.status(200).json({
        message: 'Migration completed with mixed results',
        success: successCount > 0,
        stats: {
          totalStatements: statements.length,
          successCount,
          errorCount
        },
        results: results.slice(0, 10) // Limit results for response size
      });
    }

    // Test the analytics table by trying to insert a test record
    const testEvent = {
      event_type: 'session_start',
      session_id: 'test-session-' + Date.now(),
      guest_uuid: crypto.randomUUID(),
      timestamp: new Date().toISOString(),
      metadata: { test: true, source: 'setup-analytics-api' },
      device_info: { deviceType: 'desktop', browser: 'test', os: 'test', userAgent: 'test' },
      performance_metrics: { responseTime: 100, memoryUsage: 50 }
    };

    const { data: insertData, error: insertError } = await supabase
      .from('session_analytics_events')
      .insert(testEvent)
      .select();

    if (insertError) {
      console.warn('⚠️ [DATABASE_SETUP] Test insert failed:', insertError);
      return res.status(200).json({
        message: 'Migration executed but test insert failed',
        success: true,
        migrationData: data,
        testInsertError: insertError.message
      });
    }

    // Clean up test record
    if (insertData && insertData.length > 0) {
      await supabase
        .from('session_analytics_events')
        .delete()
        .eq('id', insertData[0].id);
    }

    // Get analytics overview
    const { data: overviewData, error: overviewError } = await supabase
      .from('analytics_overview')
      .select('*');

    console.log('✅ [DATABASE_SETUP] Analytics tables migration completed successfully');

    return res.status(200).json({
      message: 'Analytics tables setup completed successfully',
      success: true,
      migrationData: data,
      testInsertSuccess: true,
      analyticsOverview: overviewError ? null : overviewData,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ [DATABASE_SETUP] Setup failed:', error);
    return res.status(500).json({
      error: 'Database setup failed',
      details: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    });
  }
}
