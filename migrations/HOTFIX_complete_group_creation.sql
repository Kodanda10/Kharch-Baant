-- ================================================================
-- COMPLETE HOTFIX: Allow group creation for authenticated users
-- Run this in Supabase SQL Editor
-- ================================================================

-- 1. Fix groups table INSERT policy
DROP POLICY IF EXISTS "Users can insert groups" ON groups;

CREATE POLICY "Users can insert groups"
ON groups FOR INSERT
TO authenticated
WITH CHECK (true);  -- Any authenticated user can create a group

-- 2. Fix group_members table INSERT policy
DROP POLICY IF EXISTS "Users can insert group members" ON group_members;

CREATE POLICY "Users can insert group members"
ON group_members FOR INSERT
TO authenticated
WITH CHECK (
  -- User is adding themselves (allows initial group member addition)
  EXISTS (
    SELECT 1 FROM people p
    WHERE p.id = group_members.person_id
    AND p.auth_user_id = auth.uid()
  )
  OR
  -- User is already a member of the group (allows adding others)
  EXISTS (
    SELECT 1 FROM group_members gm
    INNER JOIN people p ON gm.person_id = p.id
    WHERE gm.group_id = group_members.group_id
    AND p.auth_user_id = auth.uid()
  )
);

-- 3. Ensure permissions are granted
GRANT INSERT ON groups TO authenticated;
GRANT INSERT ON group_members TO authenticated;
GRANT SELECT ON groups TO authenticated;
GRANT SELECT ON group_members TO authenticated;
GRANT SELECT ON people TO authenticated;

-- 4. Verify RLS is enabled on both tables
ALTER TABLE groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE group_members ENABLE ROW LEVEL SECURITY;

-- Success message
DO $$
BEGIN
  RAISE NOTICE 'Group creation policies updated successfully!';
END $$;


