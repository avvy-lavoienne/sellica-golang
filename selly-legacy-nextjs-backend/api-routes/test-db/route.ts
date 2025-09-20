import { NextRequest, NextResponse } from 'next/server';
import { SupabaseManager } from '@/lib/database/supabaseManager';

/**
 * Test endpoint to verify Supabase database connectivity
 */
export async function GET(request: NextRequest) {
  try {
    console.log('🔍 [TEST_DB] Testing database connectivity...');
    
    // Get Supabase client from pool
    const supabaseManager = await SupabaseManager.getInstance();
    const supabase = await supabaseManager.getServiceRoleClient();
    
    if (!supabase) {
      return NextResponse.json({
        success: false,
        error: 'Failed to get Supabase client',
        timestamp: new Date().toISOString()
      }, { status: 500 });
    }
    
    // Test basic connectivity by counting records in pengajuan_bulanan table
    const { count: pengajuanCount, error: pengajuanError } = await supabase
      .from('pengajuan_bulanan')
      .select('*', { count: 'exact', head: true });
    
    if (pengajuanError) {
      console.error('❌ [TEST_DB] Error querying pengajuan_bulanan:', pengajuanError);
      return NextResponse.json({
        success: false,
        error: 'Database query failed',
        details: pengajuanError.message,
        timestamp: new Date().toISOString()
      }, { status: 500 });
    }
    
    // Test salah_rekam table
    const { count: salahRekamCount, error: salahRekamError } = await supabase
      .from('salah_rekam')
      .select('*', { count: 'exact', head: true });
    
    if (salahRekamError) {
      console.error('❌ [TEST_DB] Error querying salah_rekam:', salahRekamError);
      return NextResponse.json({
        success: false,
        error: 'Database query failed',
        details: salahRekamError.message,
        timestamp: new Date().toISOString()
      }, { status: 500 });
    }
    
    // Test adjudicate_record table
    const { count: adjudicateCount, error: adjudicateError } = await supabase
      .from('adjudicate_record')
      .select('*', { count: 'exact', head: true });
    
    if (adjudicateError) {
      console.error('❌ [TEST_DB] Error querying adjudicate_record:', adjudicateError);
      return NextResponse.json({
        success: false,
        error: 'Database query failed',
        details: adjudicateError.message,
        timestamp: new Date().toISOString()
      }, { status: 500 });
    }
    
    console.log('✅ [TEST_DB] Database connectivity test successful');
    console.log(`📊 [TEST_DB] Record counts - Pengajuan: ${pengajuanCount}, Salah Rekam: ${salahRekamCount}, Adjudicate: ${adjudicateCount}`);
    
    return NextResponse.json({
      success: true,
      message: 'Database connectivity test successful',
      data: {
        pengajuan_bulanan_count: pengajuanCount || 0,
        salah_rekam_count: salahRekamCount || 0,
        adjudicate_record_count: adjudicateCount || 0,
        total_records: (pengajuanCount || 0) + (salahRekamCount || 0) + (adjudicateCount || 0)
      },
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('❌ [TEST_DB] Database connectivity test failed:', error);
    return NextResponse.json({
      success: false,
      error: 'Database connectivity test failed',
      details: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}
