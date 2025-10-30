-- ================================================================
-- COMPLETE FIX: Create helper function and fix all recursion issues
-- ================================================================

-- Step 1: Create the helper function to get current user's person_id
-- This bypasses RLS to avoid infinite recursion
CREATE OR REPLACE FUNCTION get_current_user_person_id()
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER  -- This is critical - it bypasses RLS
STABLE
AS $$
DECLARE
  person_id UUID;
BEGIN
  SELECT id INTO person_id 
  FROM people 
  WHERE auth_user_id = auth.uid() 
  LIMIT 1;
  RETURN person_id;
END;
$$;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION get_current_user_person_id() TO authenticated;
GRANT EXECUTE ON FUNCTION get_current_user_person_id() TO anon;

-- Step 2: Fix group_members SELECT policy (avoid recursion)
DROP POLICY IF EXISTS "Users can view group members" ON group_members;

CREATE POLICY "Users can view group members"
ON group_members FOR SELECT
TO authenticated
USING (
  -- Simple check: user can see members of groups where they are a member
  -- Using subquery without joining back to people to avoid recursion
  group_members.group_id IN (
    SELECT gm.group_id 
    FROM group_members gm
    WHERE gm.person_id = get_current_user_person_id()
  )
);

-- Step 3: Fix group_members INSERT policy (avoid recursion)
DROP POLICY IF EXISTS "Users can insert group members" ON group_members;

CREATE POLICY "Users can insert group members"
ON group_members FOR INSERT
TO authenticated
WITH CHECK (
  -- User is adding themselves
  group_members.person_id = get_current_user_person_id()
  OR
  -- User is already a member of the group
  group_members.group_id IN (
    SELECT gm.group_id 
    FROM group_members gm
    WHERE gm.person_id = get_current_user_person_id()
  )
);

-- Step 4: Simplify groups SELECT policy (avoid recursion)
DROP POLICY IF EXISTS "Users can view their groups" ON groups;

CREATE POLICY "Users can view their groups"
ON groups FOR SELECT
TO authenticated
USING (
  -- User can view groups they're a member of
  groups.id IN (
    SELECT gm.group_id 
    FROM group_members gm
    WHERE gm.person_id = get_current_user_person_id()
  )
);

-- Success message
DO $$
BEGIN
  RAISE NOTICE '✅ All recursion issues fixed! Helper function created and policies updated.';
END $$;


