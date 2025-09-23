/**
 * SILPANA Database Structure Fix Script
 * 
 * This script checks and fixes the silpana table structure to match 
 * the frontend TypeScript interface expectations.
 */

import { createClient } from '@supabase/supabase-js';

// This would use your Supabase client from the app
const fixSilpanaStructure = async () => {
  // First, let's check what columns exist
  const { data: columns, error: columnsError } = await supabase
    .from('information_schema.columns')
    .select('column_name, data_type, is_nullable')
    .eq('table_name', 'silpana')
    .order('ordinal_position');

  if (columnsError) {
    console.error('Error checking columns:', columnsError);
    return;
  }

  console.log('Current silpana table columns:', columns);

  // Check if critical columns exist
  const columnNames = columns.map(col => col.column_name);
  const requiredColumns = [
    'alasan_pengaduan',
    'nik_pengaduan', 
    'nama_pengaduan',
    'nomor_telepon',
    'kategori_pengaduan',
    'sub_kategori_pengaduan',
    'deskripsi_pengaduan',
    'tindak_lanjut_pengaduan',
    'tanggal_pengaduan',
    'ticket_code',
    'ticket_status',
    'priority_level'
  ];

  const missingColumns = requiredColumns.filter(col => !columnNames.includes(col));
  const extraColumns = columnNames.filter(col => !requiredColumns.includes(col) && !['id', 'created_at', 'updated_at', 'user_id'].includes(col));

  console.log('Missing columns:', missingColumns);
  console.log('Extra columns:', extraColumns);

  // Generate SQL to fix the structure
  if (missingColumns.length > 0 || extraColumns.length > 0) {
    console.log('\n=== SQL to fix silpana table structure ===');
    
    // Add missing columns
    missingColumns.forEach(col => {
      let dataType = 'TEXT';
      let defaultValue = '';
      
      switch (col) {
        case 'tanggal_pengaduan':
          dataType = 'DATE';
          break;
        case 'ticket_status':
          dataType = 'VARCHAR(20)';
          defaultValue = " DEFAULT 'submitted'";
          break;
        case 'priority_level':
          dataType = 'VARCHAR(10)';
          defaultValue = " DEFAULT 'medium'";
          break;
        case 'is_anonymous':
          dataType = 'BOOLEAN';
          defaultValue = ' DEFAULT false';
          break;
        case 'ticket_code':
          dataType = 'VARCHAR(20)';
          break;
        case 'nik_pengaduan':
        case 'nomor_telepon':
          dataType = 'VARCHAR(20)';
          break;
        case 'kategori_pengaduan':
        case 'sub_kategori_pengaduan':
        case 'nama_pengaduan':
          dataType = 'VARCHAR(200)';
          break;
      }
      
      console.log(`ALTER TABLE silpana ADD COLUMN IF NOT EXISTS ${col} ${dataType}${defaultValue};`);
    });

    // Create indexes
    console.log('\n-- Create indexes');
    console.log('CREATE INDEX IF NOT EXISTS idx_silpana_ticket_code ON silpana(ticket_code);');
    console.log('CREATE INDEX IF NOT EXISTS idx_silpana_nik_pengaduan ON silpana(nik_pengaduan);');
    console.log('CREATE INDEX IF NOT EXISTS idx_silpana_ticket_status ON silpana(ticket_status);');
  }
};

export default fixSilpanaStructure;