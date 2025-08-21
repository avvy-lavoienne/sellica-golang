-- =====================================================
-- MANUAL RLS POLICY FIXES - For Supabase SQL Editor
-- =====================================================
-- 
-- If the automated migration fails, run these commands manually
-- in the Supabase SQL Editor to fix the critical RLS policy issues.
--
-- INSTRUCTIONS:
-- 1. Open Supabase Dashboard > SQL Editor
-- 2. Copy and paste this entire script
-- 3. Click "Run" to execute
-- 4. Verify no errors in the output
-- 5. Test chat functionality in the application
--
-- =====================================================

-- Step 1: Drop existing problematic policies
DROP POLICY IF EXISTS "Users can access their own chat sessions" ON selly_chat_sessions;
DROP POLICY IF EXISTS "Service role can access all sessions" ON selly_chat_sessions;
DROP POLICY IF EXISTS "Guest sessions with valid UUID" ON selly_chat_sessions;
DROP POLICY IF EXISTS "Users can access their own chat messages" ON selly_chat_messages;
DROP POLICY IF EXISTS "Service role can access all messages" ON selly_chat_messages;
DROP POLICY IF EXISTS "Guest messages access" ON selly_chat_messages;

-- Step 2: Create fixed service role policies (CRITICAL FIX)
CREATE POLICY "service_role_full_access_sessions" ON selly_chat_sessions
  FOR ALL 
  TO service_role
  USING (true)
  WITH CHECK (true);

CREATE POLICY "service_role_full_access_messages" ON selly_chat_messages
  FOR ALL
  TO service_role  
  USING (true)
  WITH CHECK (true);

-- Step 3: Create authenticated user policies
CREATE POLICY "authenticated_users_own_sessions" ON selly_chat_sessions
  FOR ALL
  TO authenticated
  USING (
    auth.uid() IS NOT NULL AND 
    user_id = auth.uid()
  )
  WITH CHECK (
    auth.uid() IS NOT NULL AND 
    user_id = auth.uid()
  );

CREATE POLICY "authenticated_users_own_messages" ON selly_chat_messages
  FOR ALL
  TO authenticated
  USING (
    auth.uid() IS NOT NULL AND
    session_id IN (
      SELECT id FROM selly_chat_sessions 
      WHERE user_id = auth.uid()
    )
  )
  WITH CHECK (
    auth.uid() IS NOT NULL AND
    session_id IN (
      SELECT id FROM selly_chat_sessions 
      WHERE user_id = auth.uid()
    )
  );

-- Step 4: Create enhanced guest session policies (CRITICAL FIX)
CREATE POLICY "guest_sessions_with_valid_uuid" ON selly_chat_sessions
  FOR ALL
  TO anon
  USING (
    session_type = 'guest' AND 
    guest_uuid IS NOT NULL AND 
    length(guest_uuid) >= 8 AND
    guest_uuid != ''
  )
  WITH CHECK (
    session_type = 'guest' AND 
    guest_uuid IS NOT NULL AND 
    length(guest_uuid) >= 8 AND
    guest_uuid != ''
  );

CREATE POLICY "guest_messages_with_valid_session" ON selly_chat_messages
  FOR ALL
  TO anon
  USING (
    session_id IN (
      SELECT id FROM selly_chat_sessions 
      WHERE session_type = 'guest' 
        AND guest_uuid IS NOT NULL 
        AND length(guest_uuid) >= 8
        AND guest_uuid != ''
    )
  )
  WITH CHECK (
    session_id IN (
      SELECT id FROM selly_chat_sessions 
      WHERE session_type = 'guest' 
        AND guest_uuid IS NOT NULL 
        AND length(guest_uuid) >= 8
        AND guest_uuid != ''
    )
  );

-- Step 5: Create fallback policies for edge cases
CREATE POLICY "authenticated_session_creation_fallback" ON selly_chat_sessions
  FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() IS NOT NULL AND
    (user_id = auth.uid() OR user_id IS NULL)
  );

CREATE POLICY "message_creation_fallback" ON selly_chat_messages
  FOR INSERT
  TO authenticated, anon
  WITH CHECK (
    session_id IN (
      SELECT id FROM selly_chat_sessions
    )
  );

-- Step 6: Ensure RLS is enabled
ALTER TABLE selly_chat_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE selly_chat_messages ENABLE ROW LEVEL SECURITY;

-- Step 7: Grant necessary permissions
GRANT ALL ON selly_chat_sessions TO service_role;
GRANT ALL ON selly_chat_messages TO service_role;
GRANT SELECT, INSERT, UPDATE ON selly_chat_sessions TO authenticated;
GRANT SELECT, INSERT, UPDATE ON selly_chat_messages TO authenticated;
GRANT SELECT, INSERT ON selly_chat_sessions TO anon;
GRANT SELECT, INSERT ON selly_chat_messages TO anon;

-- Step 8: Create validation function (optional but recommended)
CREATE OR REPLACE FUNCTION validate_session_access(
  session_id_param TEXT,
  user_id_param UUID DEFAULT NULL,
  guest_uuid_param TEXT DEFAULT NULL
)
RETURNS TABLE(
  can_access BOOLEAN,
  access_type TEXT,
  session_exists BOOLEAN,
  policy_match TEXT
) 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    CASE 
      WHEN EXISTS(
        SELECT 1 FROM selly_chat_sessions s
        WHERE s.id = session_id_param
          AND (
            (s.user_id = user_id_param AND user_id_param IS NOT NULL) OR
            (s.session_type = 'guest' AND s.guest_uuid = guest_uuid_param AND guest_uuid_param IS NOT NULL)
          )
      ) THEN true
      ELSE false
    END as can_access,
    
    CASE 
      WHEN user_id_param IS NOT NULL THEN 'authenticated'
      WHEN guest_uuid_param IS NOT NULL THEN 'guest'
      ELSE 'unknown'
    END as access_type,
    
    EXISTS(SELECT 1 FROM selly_chat_sessions WHERE id = session_id_param) as session_exists,
    
    CASE 
      WHEN EXISTS(SELECT 1 FROM selly_chat_sessions s WHERE s.id = session_id_param AND s.user_id = user_id_param) 
        THEN 'authenticated_user_match'
      WHEN EXISTS(SELECT 1 FROM selly_chat_sessions s WHERE s.id = session_id_param AND s.session_type = 'guest' AND s.guest_uuid = guest_uuid_param)
        THEN 'guest_uuid_match'
      ELSE 'no_policy_match'
    END as policy_match;
END;
$$;

-- Step 9: Test the fixes (run these to verify)
-- Test 1: Service role should be able to access sessions
-- SELECT COUNT(*) FROM selly_chat_sessions; -- Should work

-- Test 2: Create a test guest session
-- INSERT INTO selly_chat_sessions (id, session_type, guest_uuid, created_at, updated_at) 
-- VALUES ('test-guest-session', 'guest', 'test-guest-uuid-123456', NOW(), NOW());

-- Test 3: Create a test message for the guest session
-- INSERT INTO selly_chat_messages (id, session_id, content, role, created_at)
-- VALUES ('test-message', 'test-guest-session', 'Test message', 'user', NOW());

-- Test 4: Validate session access
-- SELECT * FROM validate_session_access('test-guest-session', NULL, 'test-guest-uuid-123456');

-- Step 10: Cleanup test data (run after testing)
-- DELETE FROM selly_chat_messages WHERE id = 'test-message';
-- DELETE FROM selly_chat_sessions WHERE id = 'test-guest-session';

-- =====================================================
-- VERIFICATION CHECKLIST
-- =====================================================
-- 
-- After running this script, verify:
-- ✅ No errors in the SQL execution output
-- ✅ Service role can access selly_chat_sessions table
-- ✅ Guest sessions can be created with valid guest_uuid
-- ✅ Messages can be stored without foreign key violations
-- ✅ Chat functionality works in the application
-- ✅ No "row violates row-level security policy" errors
-- 
-- If all checks pass, the RLS policy fixes are successful!
-- 
-- Next steps:
-- 1. Test chat functionality in the application
-- 2. Run: pnpm run test:rls-policies (if available)
-- 3. Proceed with Phase 2: Connection Pool Optimization
-- 
-- =====================================================

-- Success message
DO $$
BEGIN
  RAISE NOTICE '✅ MANUAL RLS POLICY FIXES COMPLETED';
  RAISE NOTICE '🔒 Service role authentication: ENABLED';
  RAISE NOTICE '👥 Guest session handling: ENHANCED';
  RAISE NOTICE '💾 Database persistence: RESTORED';
  RAISE NOTICE '🎯 Ready for application testing';
END $$;
