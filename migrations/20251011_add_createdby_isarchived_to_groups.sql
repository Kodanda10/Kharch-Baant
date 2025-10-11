-- Add created_by and is_archived columns to groups table
ALTER TABLE groups
ADD COLUMN created_by UUID REFERENCES people(id),
ADD COLUMN is_archived BOOLEAN DEFAULT FALSE;

-- Optional: Backfill created_by for existing groups (set to a known admin or NULL)
-- UPDATE groups SET created_by = '<admin-user-id>' WHERE created_by IS NULL;

-- Add index for archived groups
CREATE INDEX IF NOT EXISTS idx_groups_is_archived ON groups(is_archived);
