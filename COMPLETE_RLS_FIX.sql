-- COMPLETE RLS FIX - Run this in Supabase SQL Editor
-- This will disable Row Level Security on all tables to fix the loading error

-- Disable RLS on all tables
ALTER TABLE people DISABLE ROW LEVEL SECURITY;
ALTER TABLE groups DISABLE ROW LEVEL SECURITY;
ALTER TABLE group_members DISABLE ROW LEVEL SECURITY;
ALTER TABLE transactions DISABLE ROW LEVEL SECURITY;
ALTER TABLE payment_sources DISABLE ROW LEVEL SECURITY;

-- Also disable on invite tables if they exist
ALTER TABLE group_invites DISABLE ROW LEVEL SECURITY;
ALTER TABLE email_invites DISABLE ROW LEVEL SECURITY;

-- Drop any existing problematic policies (optional - only if needed)
-- DROP POLICY IF EXISTS "Users can view people in their groups" ON people;
-- DROP POLICY IF EXISTS "Users can insert people" ON people;
-- DROP POLICY IF EXISTS "Users can update their people" ON people;

-- Verify RLS is disabled (this should return no rows)
SELECT schemaname, tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' 
AND rowsecurity = true;
