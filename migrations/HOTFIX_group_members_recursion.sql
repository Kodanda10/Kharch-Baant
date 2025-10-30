-- ================================================================
-- HOTFIX: Fix infinite recursion in group_members policies
-- Issue: SELECT policy causes circular reference when checking membership
-- ================================================================

-- 1. Drop the problematic SELECT policy
DROP POLICY IF EXISTS "Users can view group members" ON group_members;

-- 2. Create a simpler SELECT policy that doesn't cause recursion
-- Use the helper function to avoid circular reference
CREATE POLICY "Users can view group members"
ON group_members FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM group_members gm2
    WHERE gm2.group_id = group_members.group_id
    AND gm2.person_id = get_current_user_person_id()
  )
);

-- 3. Also simplify the INSERT policy to avoid recursion
DROP POLICY IF EXISTS "Users can insert group members" ON group_members;

CREATE POLICY "Users can insert group members"
ON group_members FOR INSERT
TO authenticated
WITH CHECK (
  -- User is adding themselves (using helper function to avoid recursion)
  group_members.person_id = get_current_user_person_id()
  OR
  -- User is already a member of the group (using helper function)
  EXISTS (
    SELECT 1 FROM group_members gm
    WHERE gm.group_id = group_members.group_id
    AND gm.person_id = get_current_user_person_id()
  )
);

-- Success message
DO $$
BEGIN
  RAISE NOTICE 'Fixed infinite recursion in group_members policies!';
END $$;


