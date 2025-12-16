-- Migration: Group admin and deletion requests
-- Date: 2025-11-16

-- Add created_by to groups to mark creator/admin (if not exists)
ALTER TABLE groups ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES people(id);

-- New table to track deletion requests for admin approval
CREATE TABLE IF NOT EXISTS group_deletion_requests (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  group_id UUID NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
  requested_by UUID NOT NULL REFERENCES people(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','approved','rejected')),
  approved_by UUID REFERENCES people(id),
  approved_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  -- prevent duplicate pending requests per group
  UNIQUE (group_id) DEFERRABLE INITIALLY IMMEDIATE
);

CREATE INDEX IF NOT EXISTS idx_group_deletion_requests_group_id ON group_deletion_requests(group_id);
CREATE INDEX IF NOT EXISTS idx_group_deletion_requests_status ON group_deletion_requests(status);
