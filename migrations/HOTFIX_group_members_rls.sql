-- ================================================================
-- HOTFIX: Fix group_members RLS policy to allow creating new groups
-- Issue: Users couldn't add themselves as first member of new groups
-- ================================================================

-- Drop the old restrictive policy
DROP POLICY IF EXISTS "Users can insert group members" ON group_members;

-- Create new policy that allows:
-- 1. Users to add themselves (for new group creation)
-- 2. Existing members to add others
CREATE POLICY "Users can insert group members"
ON group_members FOR INSERT
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

