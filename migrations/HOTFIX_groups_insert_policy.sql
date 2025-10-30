-- ================================================================
-- HOTFIX: Fix groups INSERT policy to allow authenticated users to create groups
-- Issue: Users getting RLS violation when creating groups
-- ================================================================

-- Drop existing INSERT policy
DROP POLICY IF EXISTS "Users can insert groups" ON groups;

-- Create a more permissive INSERT policy for authenticated users
CREATE POLICY "Users can insert groups"
ON groups FOR INSERT
TO authenticated
WITH CHECK (true);

-- Also ensure authenticated role has INSERT permission
GRANT INSERT ON groups TO authenticated;
GRANT INSERT ON group_members TO authenticated;

-- Verify RLS is enabled
ALTER TABLE groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE group_members ENABLE ROW LEVEL SECURITY;


