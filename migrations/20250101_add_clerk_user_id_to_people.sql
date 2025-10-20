-- Add clerk_user_id column to people table
-- This will help us properly identify users and avoid duplicates

ALTER TABLE people ADD COLUMN IF NOT EXISTS clerk_user_id TEXT;

-- Add unique constraint to prevent duplicate clerk users
ALTER TABLE people ADD CONSTRAINT unique_clerk_user_id UNIQUE (clerk_user_id);

-- Add index for better performance
CREATE INDEX IF NOT EXISTS idx_people_clerk_user_id ON people(clerk_user_id);

-- Update existing records with placeholder clerk_user_id for now
-- We'll populate these properly in the next step
UPDATE people 
SET clerk_user_id = 'temp_' || id::text 
WHERE clerk_user_id IS NULL;
