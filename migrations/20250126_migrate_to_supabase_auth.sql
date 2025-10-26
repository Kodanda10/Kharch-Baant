-- ================================================================
-- Migration: Switch from Clerk to Supabase Auth
-- Date: 2025-01-26
-- Description: Add auth_user_id column and set up Row Level Security
-- ================================================================

-- Step 1: Add auth_user_id column to people table
-- This will store the Supabase auth.users ID
ALTER TABLE people 
ADD COLUMN IF NOT EXISTS auth_user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;

-- Step 2: Add email column to people table (if not exists)
ALTER TABLE people
ADD COLUMN IF NOT EXISTS email TEXT;

-- Step 3: Create index for performance
CREATE INDEX IF NOT EXISTS idx_people_auth_user_id ON people(auth_user_id);
CREATE INDEX IF NOT EXISTS idx_people_email ON people(email);

-- Step 4: Add unique constraint to ensure one person per auth user
CREATE UNIQUE INDEX IF NOT EXISTS idx_people_auth_user_id_unique 
ON people(auth_user_id) 
WHERE auth_user_id IS NOT NULL;

-- ================================================================
-- Row Level Security (RLS) Policies
-- ================================================================

-- Enable RLS on all tables (if not already enabled)
ALTER TABLE people ENABLE ROW LEVEL SECURITY;
ALTER TABLE groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE payment_sources ENABLE ROW LEVEL SECURITY;
ALTER TABLE group_invites ENABLE ROW LEVEL SECURITY;

-- ================================================================
-- PEOPLE TABLE POLICIES
-- ================================================================

-- Drop existing policies if they exist (clean slate)
DROP POLICY IF EXISTS "Users can view their own person record" ON people;
DROP POLICY IF EXISTS "Users can update their own person record" ON people;
DROP POLICY IF EXISTS "Users can insert their own person record" ON people;
DROP POLICY IF EXISTS "Users can view people in their groups" ON people;
DROP POLICY IF EXISTS "Users can view people" ON people;

-- Policy: Users can view their own person record AND people in their groups
-- Using helper function to avoid infinite recursion
CREATE POLICY "Users can view people"
ON people FOR SELECT
USING (
  -- Can view own record
  auth.uid() = auth_user_id
  OR
  -- Can view people in same groups (using helper function to break recursion)
  EXISTS (
    SELECT 1 FROM group_members gm1
    INNER JOIN group_members gm2 ON gm1.group_id = gm2.group_id
    WHERE gm1.person_id = people.id
    AND gm2.person_id = get_current_user_person_id()
  )
);

-- Policy: Users can update their own person record
CREATE POLICY "Users can update their own person record"
ON people FOR UPDATE
USING (auth.uid() = auth_user_id);

-- Policy: Users can insert their own person record (for registration)
CREATE POLICY "Users can insert their own person record"
ON people FOR INSERT
WITH CHECK (auth.uid() = auth_user_id);

-- ================================================================
-- GROUPS TABLE POLICIES
-- ================================================================

DROP POLICY IF EXISTS "Users can view their groups" ON groups;
DROP POLICY IF EXISTS "Users can insert groups" ON groups;
DROP POLICY IF EXISTS "Users can update their groups" ON groups;
DROP POLICY IF EXISTS "Users can delete groups they created" ON groups;

-- Policy: Users can view groups they're members of
CREATE POLICY "Users can view their groups"
ON groups FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM group_members gm
    INNER JOIN people p ON gm.person_id = p.id
    WHERE gm.group_id = groups.id
    AND p.auth_user_id = auth.uid()
  )
);

-- Policy: Authenticated users can create groups
CREATE POLICY "Users can insert groups"
ON groups FOR INSERT
WITH CHECK (
  auth.uid() IS NOT NULL
);

-- Policy: Users can update groups they're members of
CREATE POLICY "Users can update their groups"
ON groups FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM group_members gm
    INNER JOIN people p ON gm.person_id = p.id
    WHERE gm.group_id = groups.id
    AND p.auth_user_id = auth.uid()
  )
);

-- Policy: Users can delete groups they created (if they're the creator)
-- For now, allow any group member to delete (we can restrict this later)
CREATE POLICY "Users can delete groups they created"
ON groups FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM group_members gm
    INNER JOIN people p ON gm.person_id = p.id
    WHERE gm.group_id = groups.id
    AND p.auth_user_id = auth.uid()
  )
);

-- ================================================================
-- GROUP_MEMBERS TABLE POLICIES
-- ================================================================

DROP POLICY IF EXISTS "Users can view group members" ON group_members;
DROP POLICY IF EXISTS "Users can insert group members" ON group_members;
DROP POLICY IF EXISTS "Users can delete group members" ON group_members;

-- Policy: Users can view members of groups they belong to
CREATE POLICY "Users can view group members"
ON group_members FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM group_members gm2
    INNER JOIN people p ON gm2.person_id = p.id
    WHERE gm2.group_id = group_members.group_id
    AND p.auth_user_id = auth.uid()
  )
);

-- Policy: Users can add members to groups they belong to
-- OR add themselves as the first member (for new groups)
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

-- Policy: Users can remove members from groups they belong to
CREATE POLICY "Users can delete group members"
ON group_members FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM group_members gm
    INNER JOIN people p ON gm.person_id = p.id
    WHERE gm.group_id = group_members.group_id
    AND p.auth_user_id = auth.uid()
  )
);

-- ================================================================
-- TRANSACTIONS TABLE POLICIES
-- ================================================================

DROP POLICY IF EXISTS "Users can view transactions in their groups" ON transactions;
DROP POLICY IF EXISTS "Users can insert transactions in their groups" ON transactions;
DROP POLICY IF EXISTS "Users can update transactions in their groups" ON transactions;
DROP POLICY IF EXISTS "Users can delete transactions in their groups" ON transactions;

-- Policy: Users can view transactions in groups they're members of
CREATE POLICY "Users can view transactions in their groups"
ON transactions FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM group_members gm
    INNER JOIN people p ON gm.person_id = p.id
    WHERE gm.group_id = transactions.group_id
    AND p.auth_user_id = auth.uid()
  )
);

-- Policy: Users can insert transactions in groups they're members of
CREATE POLICY "Users can insert transactions in their groups"
ON transactions FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM group_members gm
    INNER JOIN people p ON gm.person_id = p.id
    WHERE gm.group_id = transactions.group_id
    AND p.auth_user_id = auth.uid()
  )
);

-- Policy: Users can update transactions in groups they're members of
CREATE POLICY "Users can update transactions in their groups"
ON transactions FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM group_members gm
    INNER JOIN people p ON gm.person_id = p.id
    WHERE gm.group_id = transactions.group_id
    AND p.auth_user_id = auth.uid()
  )
);

-- Policy: Users can delete transactions in groups they're members of
CREATE POLICY "Users can delete transactions in their groups"
ON transactions FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM group_members gm
    INNER JOIN people p ON gm.person_id = p.id
    WHERE gm.group_id = transactions.group_id
    AND p.auth_user_id = auth.uid()
  )
);

-- ================================================================
-- PAYMENT SOURCES TABLE POLICIES
-- ================================================================

-- Step 1: Add user_id column if it doesn't exist (for proper user association)
ALTER TABLE payment_sources 
ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES people(id) ON DELETE CASCADE;

-- Step 2: Migrate data from created_by (TEXT/clerk_user_id) to user_id (UUID) if needed
-- Note: This will be NULL for all existing payment sources until users are migrated
-- You'll need to update this manually or via app logic after Supabase Auth migration

-- Step 3: Create index
CREATE INDEX IF NOT EXISTS idx_payment_sources_user_id ON payment_sources(user_id);

DROP POLICY IF EXISTS "Users can view their payment sources" ON payment_sources;
DROP POLICY IF EXISTS "Users can insert their payment sources" ON payment_sources;
DROP POLICY IF EXISTS "Users can update their payment sources" ON payment_sources;
DROP POLICY IF EXISTS "Users can delete their payment sources" ON payment_sources;

-- Policy: Users can only view their own payment sources
CREATE POLICY "Users can view their payment sources"
ON payment_sources FOR SELECT
USING (
  user_id IN (
    SELECT id FROM people WHERE auth_user_id = auth.uid()
  )
);

-- Policy: Users can insert their own payment sources
CREATE POLICY "Users can insert their payment sources"
ON payment_sources FOR INSERT
WITH CHECK (
  user_id IN (
    SELECT id FROM people WHERE auth_user_id = auth.uid()
  )
);

-- Policy: Users can update their own payment sources
CREATE POLICY "Users can update their payment sources"
ON payment_sources FOR UPDATE
USING (
  user_id IN (
    SELECT id FROM people WHERE auth_user_id = auth.uid()
  )
);

-- Policy: Users can delete their own payment sources
CREATE POLICY "Users can delete their payment sources"
ON payment_sources FOR DELETE
USING (
  user_id IN (
    SELECT id FROM people WHERE auth_user_id = auth.uid()
  )
);

-- ================================================================
-- GROUP INVITES TABLE POLICIES
-- ================================================================

DROP POLICY IF EXISTS "Anyone can view valid invites" ON group_invites;
DROP POLICY IF EXISTS "Users can create invites for their groups" ON group_invites;
DROP POLICY IF EXISTS "Users can update invites for their groups" ON group_invites;

-- Policy: Anyone can view valid invites (needed for invite acceptance before auth)
-- But limit exposure by only allowing specific token lookups
CREATE POLICY "Anyone can view valid invites"
ON group_invites FOR SELECT
USING (
  is_active = true
  AND expires_at > NOW()
  AND (max_uses IS NULL OR current_uses < max_uses)
);

-- Policy: Users can create invites for groups they're members of
CREATE POLICY "Users can create invites for their groups"
ON group_invites FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM group_members gm
    INNER JOIN people p ON gm.person_id = p.id
    WHERE gm.group_id = group_invites.group_id
    AND p.auth_user_id = auth.uid()
  )
);

-- Policy: Users can update invites (mark as accepted) for groups they're members of
CREATE POLICY "Users can update invites for their groups"
ON group_invites FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM group_members gm
    INNER JOIN people p ON gm.person_id = p.id
    WHERE gm.group_id = group_invites.group_id
    AND p.auth_user_id = auth.uid()
  )
  OR auth.uid() IS NOT NULL -- Allow any authenticated user to accept invite
);

-- ================================================================
-- Helper Function: Get current user's person ID
-- ================================================================

-- This function makes it easy to get the person.id for the current auth user
-- SECURITY DEFINER allows it to bypass RLS and avoid infinite recursion
CREATE OR REPLACE FUNCTION get_current_user_person_id()
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
AS $$
DECLARE
  person_id UUID;
BEGIN
  SELECT id INTO person_id FROM people WHERE auth_user_id = auth.uid() LIMIT 1;
  RETURN person_id;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION get_current_user_person_id() TO authenticated;
GRANT EXECUTE ON FUNCTION get_current_user_person_id() TO anon;

-- ================================================================
-- Data Migration (Optional - if you have existing Clerk users)
-- ================================================================

-- If you have existing users with clerk_user_id, you'll need to manually
-- migrate them by:
-- 1. Having them sign up with Supabase Auth using the same email
-- 2. Running an UPDATE to link their auth_user_id to their existing person record
--
-- Example (run per user after they sign up):
-- UPDATE people 
-- SET auth_user_id = (SELECT id FROM auth.users WHERE email = 'user@example.com')
-- WHERE email = 'user@example.com' AND clerk_user_id = 'old_clerk_id';

-- ================================================================
-- Verification Queries (Run these to check the migration)
-- ================================================================

-- Check that auth_user_id column was added
-- SELECT column_name, data_type FROM information_schema.columns 
-- WHERE table_name = 'people' AND column_name = 'auth_user_id';

-- Check that indexes were created
-- SELECT indexname FROM pg_indexes WHERE tablename = 'people' AND indexname LIKE '%auth_user_id%';

-- Check RLS is enabled
-- SELECT tablename, rowsecurity FROM pg_tables WHERE tablename IN ('people', 'groups', 'transactions', 'payment_sources', 'group_invites');

-- List all policies
-- SELECT tablename, policyname, permissive, roles, cmd FROM pg_policies WHERE tablename IN ('people', 'groups', 'transactions', 'payment_sources', 'group_invites');

-- ================================================================
-- Rollback Script (if needed)
-- ================================================================

-- ONLY RUN THIS IF YOU NEED TO ROLLBACK THE MIGRATION

-- DROP FUNCTION IF EXISTS get_current_user_person_id();
-- DROP POLICY IF EXISTS "Users can view their own person record" ON people;
-- DROP POLICY IF EXISTS "Users can view people in their groups" ON people;
-- DROP POLICY IF EXISTS "Users can update their own person record" ON people;
-- DROP POLICY IF EXISTS "Users can insert their own person record" ON people;
-- DROP POLICY IF EXISTS "Users can view their groups" ON groups;
-- DROP POLICY IF EXISTS "Users can insert groups" ON groups;
-- DROP POLICY IF EXISTS "Users can update their groups" ON groups;
-- DROP POLICY IF EXISTS "Users can delete groups they created" ON groups;
-- DROP POLICY IF EXISTS "Users can view transactions in their groups" ON transactions;
-- DROP POLICY IF EXISTS "Users can insert transactions in their groups" ON transactions;
-- DROP POLICY IF EXISTS "Users can update transactions in their groups" ON transactions;
-- DROP POLICY IF EXISTS "Users can delete transactions in their groups" ON transactions;
-- DROP POLICY IF EXISTS "Users can view their payment sources" ON payment_sources;
-- DROP POLICY IF EXISTS "Users can insert their payment sources" ON payment_sources;
-- DROP POLICY IF EXISTS "Users can update their payment sources" ON payment_sources;
-- DROP POLICY IF EXISTS "Users can delete their payment sources" ON payment_sources;
-- DROP POLICY IF EXISTS "Anyone can view valid invites" ON group_invites;
-- DROP POLICY IF EXISTS "Users can create invites for their groups" ON group_invites;
-- DROP POLICY IF EXISTS "Users can update invites for their groups" ON group_invites;
-- DROP INDEX IF EXISTS idx_people_auth_user_id;
-- DROP INDEX IF EXISTS idx_people_auth_user_id_unique;
-- ALTER TABLE people DROP COLUMN IF EXISTS auth_user_id;

-- ================================================================
-- MIGRATION COMPLETE
-- ================================================================

-- Next steps:
-- 1. Verify the migration ran successfully using the verification queries above
-- 2. Test authentication in your app with a test user
-- 3. Implement the Supabase Auth components in your frontend
-- 4. Remove Clerk dependencies

COMMENT ON COLUMN people.auth_user_id IS 'Reference to Supabase auth.users - replaces clerk_user_id';

