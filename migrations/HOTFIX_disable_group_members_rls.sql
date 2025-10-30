-- ================================================================
-- EMERGENCY FIX: Temporarily simplify group_members RLS
-- This will help us identify where the recursion is happening
-- ================================================================

-- Step 1: Drop ALL policies on group_members
DROP POLICY IF EXISTS "Users can view group members" ON group_members;
DROP POLICY IF EXISTS "Users can insert group members" ON group_members;
DROP POLICY IF EXISTS "Users can delete group members" ON group_members;
DROP POLICY IF EXISTS "Users can update group members" ON group_members;

-- Step 2: Create VERY simple policies without any subqueries
-- For INSERT: Allow any authenticated user to insert (we'll restrict later)
CREATE POLICY "group_members_insert_simple"
ON group_members FOR INSERT
TO authenticated
WITH CHECK (true);

-- For SELECT: Allow any authenticated user to view (we'll restrict later)
CREATE POLICY "group_members_select_simple"
ON group_members FOR SELECT
TO authenticated
USING (true);

-- Step 3: Verify the helper function exists and works
DO $$
DECLARE
  test_result UUID;
BEGIN
  -- Test if function exists
  SELECT get_current_user_person_id() INTO test_result;
  RAISE NOTICE 'Helper function works! Returns: %', test_result;
EXCEPTION
  WHEN OTHERS THEN
    RAISE NOTICE 'Helper function error: %', SQLERRM;
END $$;

-- Success message
SELECT 'Group members RLS simplified - try creating group now!' AS status;


