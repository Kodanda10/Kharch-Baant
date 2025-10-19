-- Add created_by column to groups table to track who created the group
-- This will store Clerk user IDs which are strings like "user_xxxxx"
ALTER TABLE groups ADD COLUMN created_by TEXT;

-- Add created_by column to people table as well to store Clerk user IDs
-- This allows us to link people records to Clerk authentication
ALTER TABLE people ADD COLUMN clerk_user_id TEXT UNIQUE;

-- Create index for better performance on lookups
CREATE INDEX idx_groups_created_by ON groups(created_by);
CREATE INDEX idx_people_clerk_user_id ON people(clerk_user_id);