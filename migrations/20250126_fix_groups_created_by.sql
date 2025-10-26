-- ================================================================
-- Fix: Make created_by in groups table nullable or properly handled
-- This allows group creation without requiring created_by
-- ================================================================

-- Check if created_by column exists and make it nullable
DO $$
BEGIN
    -- If created_by is TEXT (from Clerk), we can leave it for backwards compatibility
    -- Just ensure it's nullable
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'groups' 
        AND column_name = 'created_by'
        AND data_type = 'text'
    ) THEN
        ALTER TABLE groups ALTER COLUMN created_by DROP NOT NULL;
        RAISE NOTICE 'Made groups.created_by (TEXT) nullable';
    END IF;

    -- If created_by is UUID (person reference), make it nullable
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'groups' 
        AND column_name = 'created_by'
        AND data_type = 'uuid'
    ) THEN
        ALTER TABLE groups ALTER COLUMN created_by DROP NOT NULL;
        RAISE NOTICE 'Made groups.created_by (UUID) nullable';
    END IF;
END $$;

-- Alternative approach: Update the groups INSERT policy to be more permissive
-- This ensures authenticated users can always create groups
DROP POLICY IF EXISTS "Users can insert groups" ON groups;

CREATE POLICY "Users can insert groups"
ON groups FOR INSERT
TO authenticated
WITH CHECK (auth.uid() IS NOT NULL);

-- Grant insert permission to authenticated users
GRANT INSERT ON groups TO authenticated;

RAISE NOTICE 'Fixed groups RLS policy for creation';

