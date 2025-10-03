-- Migration script to add missing columns to existing Supabase database
-- This adds only the missing columns without recreating existing tables

-- Add missing columns to groups table
DO $$
BEGIN
    -- Add group_type column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'groups' AND column_name = 'group_type') THEN
        ALTER TABLE groups ADD COLUMN group_type TEXT NOT NULL DEFAULT 'other' 
        CHECK (group_type IN ('trip', 'family_trip', 'flat_sharing', 'expense_management', 'other'));
        
        RAISE NOTICE 'Added group_type column to groups table';
    ELSE
        RAISE NOTICE 'group_type column already exists in groups table';
    END IF;
    
    -- Add trip_start_date column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'groups' AND column_name = 'trip_start_date') THEN
        ALTER TABLE groups ADD COLUMN trip_start_date DATE;
        
        RAISE NOTICE 'Added trip_start_date column to groups table';
    ELSE
        RAISE NOTICE 'trip_start_date column already exists in groups table';
    END IF;
    
    -- Add trip_end_date column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'groups' AND column_name = 'trip_end_date') THEN
        ALTER TABLE groups ADD COLUMN trip_end_date DATE;
        
        RAISE NOTICE 'Added trip_end_date column to groups table';
    ELSE
        RAISE NOTICE 'trip_end_date column already exists in groups table';
    END IF;
END $$;

-- Add constraint for trip dates (only after columns exist)
DO $$
BEGIN
    -- Drop existing constraint if it exists
    IF EXISTS (SELECT 1 FROM information_schema.table_constraints 
               WHERE table_name = 'groups' AND constraint_name = 'groups_trip_dates_check') THEN
        ALTER TABLE groups DROP CONSTRAINT groups_trip_dates_check;
    END IF;
    
    -- Add the trip dates constraint
    ALTER TABLE groups ADD CONSTRAINT groups_trip_dates_check CHECK (
        (group_type IN ('trip', 'family_trip') AND trip_start_date IS NOT NULL AND trip_end_date IS NOT NULL AND trip_start_date <= trip_end_date)
        OR (group_type NOT IN ('trip', 'family_trip') AND trip_start_date IS NULL AND trip_end_date IS NULL)
    );
    
    RAISE NOTICE 'Added trip dates constraint to groups table';
END $$;

-- Update existing groups to have a default group_type if needed
UPDATE groups SET group_type = 'other' WHERE group_type IS NULL;

-- Show final table structure
\d groups;

RAISE NOTICE 'Migration completed successfully!';