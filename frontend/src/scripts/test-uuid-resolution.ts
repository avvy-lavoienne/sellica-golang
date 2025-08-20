/**
 * Test Script: UUID Mismatch Resolution
 * 
 * Purpose: Test the UUID mismatch resolution functionality
 * Usage: Run this script to verify that UUID mismatches are properly resolved
 */

import { supabase } from '@/lib/conn/supabaseClient';
import { getUUIDMismatchResolver } from '@/services/auth/UUIDMismatchResolver';

async function testUUIDResolution() {
  console.log('🧪 [UUID_TEST] Starting UUID mismatch resolution test...');

  try {
    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      console.error('❌ [UUID_TEST] No authenticated user found');
      return;
    }

    console.log(`🔍 [UUID_TEST] Testing for user: ${user.id.slice(0, 8)} (${user.email})`);

    // Check current profile status
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();

    console.log('📊 [UUID_TEST] Current status:');
    console.log(`  - Auth User ID: ${user.id}`);
    console.log(`  - Auth Email: ${user.email}`);
    console.log(`  - Profile exists: ${!profileError && profile ? 'YES' : 'NO'}`);
    
    if (profile) {
      console.log(`  - Profile ID: ${profile.id}`);
      console.log(`  - Profile Email: ${profile.email}`);
      console.log(`  - UUID Match: ${profile.id === user.id ? 'YES' : 'NO'}`);
    }

    // Test the resolver
    console.log('\n🔧 [UUID_TEST] Testing UUID mismatch resolver...');
    const resolver = getUUIDMismatchResolver();
    const result = await resolver.resolveUserUUIDMismatch(user.id, user.email || undefined);

    console.log('📊 [UUID_TEST] Resolution result:');
    console.log(`  - Success: ${result.success}`);
    console.log(`  - Action: ${result.action}`);
    console.log(`  - User ID: ${result.userId.slice(0, 8)}`);
    console.log(`  - Email: ${result.email}`);
    
    if (result.error) {
      console.log(`  - Error: ${result.error}`);
    }
    
    if (result.details) {
      console.log(`  - Details:`, result.details);
    }

    // Check profile status after resolution
    console.log('\n🔍 [UUID_TEST] Checking profile status after resolution...');
    const { data: updatedProfile, error: updatedProfileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();

    if (!updatedProfileError && updatedProfile) {
      console.log('✅ [UUID_TEST] Profile now exists:');
      console.log(`  - Profile ID: ${updatedProfile.id}`);
      console.log(`  - Profile Name: ${updatedProfile.name}`);
      console.log(`  - Profile Email: ${updatedProfile.email}`);
      console.log(`  - Profile Role: ${updatedProfile.role}`);
      console.log(`  - UUID Match: ${updatedProfile.id === user.id ? 'YES' : 'NO'}`);
    } else {
      console.log('❌ [UUID_TEST] Profile still does not exist');
      if (updatedProfileError) {
        console.log(`  - Error: ${updatedProfileError.message}`);
      }
    }

    console.log('\n✅ [UUID_TEST] Test completed');

  } catch (error) {
    console.error('❌ [UUID_TEST] Test failed:', error);
  }
}

// Export for use in other scripts
export { testUUIDResolution };

// Run if called directly
if (require.main === module) {
  testUUIDResolution().catch(console.error);
}
