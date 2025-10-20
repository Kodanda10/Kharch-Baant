-- Add user association to payment_sources table
-- This migration adds a created_by column to link payment sources to users

-- Add created_by column to payment_sources table
ALTER TABLE payment_sources 
ADD COLUMN created_by TEXT REFERENCES people(clerk_user_id);

-- Add index for better performance
CREATE INDEX idx_payment_sources_created_by ON payment_sources(created_by);

-- Update existing payment sources to be owned by a default user (optional)
-- You can uncomment and modify this if you want to assign existing payment sources to a specific user
-- UPDATE payment_sources SET created_by = 'your-default-user-id' WHERE created_by IS NULL;

-- Add comment for documentation
COMMENT ON COLUMN payment_sources.created_by IS 'Clerk user ID of the user who created this payment source';
