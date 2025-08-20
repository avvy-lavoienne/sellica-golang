/**
 * Script: Create Profile for firmanfird23@gmail.com
 * 
 * Purpose: Directly create the missing profile to fix authentication harmony
 * Usage: node src/scripts/create-firman-profile.js
 */

const { createClient } = require('@supabase/supabase-js');

// Load environment variables
require('dotenv').config({ path: '.env.local' });

async function createFirmanProfile() {
  console.log('🔧 [PROFILE_CREATOR] Starting profile creation for firmanfird23@gmail.com...');

  try {
    // Create Supabase client
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    );

    const userId = 'c395d8af-410d-4821-91f4-1fd8ec39b0e4';
    const email = 'firmanfird23@gmail.com';

    console.log(`🔍 [PROFILE_CREATOR] Creating profile for user: ${userId.slice(0, 8)}... (${email})`);

    // Check if profile already exists
    const { data: existingProfile, error: checkError } = await supabase
      .from('profiles')
      .select('id, name, email, role')
      .eq('id', userId)
      .single();

    if (!checkError && existingProfile) {
      console.log('✅ [PROFILE_CREATOR] Profile already exists:', existingProfile);
      return {
        success: true,
        action: 'already_exists',
        profile: existingProfile
      };
    }

    // Create the profile (using actual table structure)
    const profileData = {
      id: userId,
      name: 'Firman',
      role: 'user'
    };

    const { data: newProfile, error: createError } = await supabase
      .from('profiles')
      .insert(profileData)
      .select()
      .single();

    if (createError) {
      console.error('❌ [PROFILE_CREATOR] Failed to create profile:', createError);
      return {
        success: false,
        error: createError.message
      };
    }

    console.log('✅ [PROFILE_CREATOR] Profile created successfully:', newProfile);

    return {
      success: true,
      action: 'created',
      profile: newProfile
    };

  } catch (error) {
    console.error('❌ [PROFILE_CREATOR] Unexpected error:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

// Run the script
if (require.main === module) {
  createFirmanProfile()
    .then(result => {
      console.log('📊 [PROFILE_CREATOR] Result:', result);
      if (result.success) {
        console.log('🎉 [PROFILE_CREATOR] Profile creation completed successfully!');
        console.log('🚀 [PROFILE_CREATOR] You can now test SELLY chatbot with proper authentication!');
      } else {
        console.log('❌ [PROFILE_CREATOR] Profile creation failed.');
      }
      process.exit(result.success ? 0 : 1);
    })
    .catch(error => {
      console.error('💥 [PROFILE_CREATOR] Script failed:', error);
      process.exit(1);
    });
}

module.exports = { createFirmanProfile };
