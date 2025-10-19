-- ============================================================================
-- COMPLETE KHARCH-BAANT DATABASE MIGRATION SCRIPT
-- ============================================================================
-- This script includes:
-- 1. Original schema from supabase-schema.sql
-- 2. All applied migrations (created_by, is_archived, clerk_user_id)
-- 3. NEW: Invite system (group_invites, email_invites)
-- 4. Sample data (optional - can be commented out for production)
-- 
-- Run this script in your NEW Supabase project's SQL Editor
-- Date: 2025-10-19
-- ============================================================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto"; -- For secure random token generation

-- ============================================================================
-- CORE TABLES
-- ============================================================================

-- Create people table (with Clerk integration)
CREATE TABLE people (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    avatar_url TEXT NOT NULL,
    clerk_user_id TEXT UNIQUE, -- For Clerk authentication integration
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create groups table (with ownership and archiving)
CREATE TABLE groups (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    currency TEXT NOT NULL DEFAULT 'USD',
    group_type TEXT NOT NULL CHECK (group_type IN ('trip', 'family_trip', 'flat_sharing', 'expense_management', 'other')),
    trip_start_date DATE,
    trip_end_date DATE,
    created_by TEXT, -- Clerk user ID of the creator
    is_archived BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Constraints for trip dates
    CHECK (
        (group_type IN ('trip', 'family_trip') AND trip_start_date IS NOT NULL AND trip_end_date IS NOT NULL AND trip_start_date <= trip_end_date)
        OR (group_type NOT IN ('trip', 'family_trip') AND trip_start_date IS NULL AND trip_end_date IS NULL)
    )
);

-- Create group_members junction table
CREATE TABLE group_members (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    group_id UUID NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
    person_id UUID NOT NULL REFERENCES people(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(group_id, person_id)
);

-- Create payment_sources table (with active status)
CREATE TABLE payment_sources (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('Credit Card', 'UPI', 'Cash', 'Other')),
    details JSONB,
    is_active BOOLEAN DEFAULT TRUE, -- Added from migration
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create transactions table (with type and enhanced fields)
CREATE TABLE transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    group_id UUID NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
    description TEXT NOT NULL,
    amount DECIMAL(12,2) NOT NULL CHECK (amount > 0),
    paid_by_id UUID NOT NULL REFERENCES people(id),
    date DATE NOT NULL,
    tag TEXT NOT NULL CHECK (tag IN ('Food', 'Groceries', 'Transport', 'Travel', 'Housing', 'Utilities', 'Entertainment', 'Shopping', 'Health', 'Other')),
    payment_source_id UUID REFERENCES payment_sources(id),
    comment TEXT,
    split_mode TEXT NOT NULL CHECK (split_mode IN ('equal', 'unequal', 'percentage', 'shares')),
    split_participants JSONB NOT NULL,
    type TEXT NOT NULL DEFAULT 'expense' CHECK (type IN ('expense', 'settlement', 'adjustment')), -- Added from migration
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================================
-- INVITE SYSTEM TABLES (NEW)
-- ============================================================================

-- Group invites table for temporary shareable links
CREATE TABLE group_invites (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    group_id UUID NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
    invite_token TEXT NOT NULL UNIQUE, -- URL-safe random token (32 chars)
    invited_by UUID NOT NULL REFERENCES people(id),
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT (NOW() + INTERVAL '30 days'),
    max_uses INTEGER DEFAULT NULL, -- NULL = unlimited uses, otherwise specific limit
    current_uses INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Constraints
    CHECK (current_uses >= 0),
    CHECK (max_uses IS NULL OR max_uses > 0)
);

-- Email invites table for tracking email invitations
CREATE TABLE email_invites (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    group_id UUID NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
    group_invite_id UUID NOT NULL REFERENCES group_invites(id) ON DELETE CASCADE,
    email TEXT NOT NULL,
    invited_by UUID NOT NULL REFERENCES people(id),
    sent_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- MailerSend integration fields
    mailersend_message_id TEXT, -- Track MailerSend message ID for delivery status
    mailersend_status TEXT DEFAULT 'sent' CHECK (mailersend_status IN ('sent', 'delivered', 'opened', 'clicked', 'bounced', 'failed')),
    
    -- Invitation status
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'expired')),
    accepted_at TIMESTAMP WITH TIME ZONE,
    accepted_by UUID REFERENCES people(id),
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Ensure no duplicate email invites for same group
    UNIQUE(group_id, email)
);

-- ============================================================================
-- INDEXES FOR PERFORMANCE
-- ============================================================================

-- Core table indexes
CREATE INDEX idx_people_clerk_user_id ON people(clerk_user_id);
CREATE INDEX idx_groups_created_by ON groups(created_by);
CREATE INDEX idx_groups_is_archived ON groups(is_archived);
CREATE INDEX idx_group_members_group_id ON group_members(group_id);
CREATE INDEX idx_group_members_person_id ON group_members(person_id);
CREATE INDEX idx_transactions_group_id ON transactions(group_id);
CREATE INDEX idx_transactions_paid_by_id ON transactions(paid_by_id);
CREATE INDEX idx_transactions_date ON transactions(date);
CREATE INDEX idx_transactions_tag ON transactions(tag);
CREATE INDEX idx_payment_sources_is_active ON payment_sources(is_active) WHERE is_active = true;

-- Invite system indexes
CREATE INDEX idx_group_invites_token ON group_invites(invite_token);
CREATE INDEX idx_group_invites_group_id ON group_invites(group_id);
CREATE INDEX idx_group_invites_expires_at ON group_invites(expires_at);
CREATE INDEX idx_group_invites_active ON group_invites(is_active) WHERE is_active = true;
CREATE INDEX idx_email_invites_email ON email_invites(email);
CREATE INDEX idx_email_invites_group_id ON email_invites(group_id);
CREATE INDEX idx_email_invites_status ON email_invites(status);
CREATE INDEX idx_email_invites_group_invite_id ON email_invites(group_invite_id);

-- ============================================================================
-- TRIGGERS AND FUNCTIONS
-- ============================================================================

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Add updated_at triggers to all tables
CREATE TRIGGER update_people_updated_at BEFORE UPDATE ON people FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_groups_updated_at BEFORE UPDATE ON groups FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_payment_sources_updated_at BEFORE UPDATE ON payment_sources FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_transactions_updated_at BEFORE UPDATE ON transactions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_group_invites_updated_at BEFORE UPDATE ON group_invites FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to clean up expired invites
CREATE OR REPLACE FUNCTION cleanup_expired_invites()
RETURNS INTEGER AS $$
DECLARE
    deleted_count INTEGER;
BEGIN
    -- Deactivate expired invite links
    UPDATE group_invites 
    SET is_active = false, updated_at = NOW()
    WHERE expires_at < NOW() AND is_active = true;
    
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    
    -- Update email invites status for expired invites
    UPDATE email_invites 
    SET status = 'expired'
    WHERE group_invite_id IN (
        SELECT id FROM group_invites 
        WHERE expires_at < NOW() AND is_active = false
    ) AND status = 'pending';
    
    RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

-- Function to generate secure random tokens
CREATE OR REPLACE FUNCTION generate_invite_token()
RETURNS TEXT AS $$
BEGIN
    -- Generate 32-character URL-safe token using random bytes
    RETURN encode(gen_random_bytes(24), 'base64')::text;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- SAMPLE DATA (OPTIONAL - Remove for production)
-- ============================================================================

-- Insert sample people (comment out for production)
-- INSERT INTO people (id, name, avatar_url) VALUES
--     ('00000000-0000-0000-0000-000000000001', 'You', 'https://i.pravatar.cc/150?u=p1'),
--     ('00000000-0000-0000-0000-000000000002', 'Alice', 'https://i.pravatar.cc/150?u=p2'),
--     ('00000000-0000-0000-0000-000000000003', 'Bob', 'https://i.pravatar.cc/150?u=p3'),
--     ('00000000-0000-0000-0000-000000000004', 'Charlie', 'https://i.pravatar.cc/150?u=p4'),
--     ('00000000-0000-0000-0000-000000000005', 'Diana', 'https://i.pravatar.cc/150?u=p5');

-- Insert sample groups (comment out for production)
-- INSERT INTO groups (id, name, currency, group_type, created_by) VALUES
--     ('00000000-0000-0000-0000-000000000001', 'Sample Trip', 'USD', 'trip', NULL),
--     ('00000000-0000-0000-0000-000000000002', 'Household Expenses', 'USD', 'flat_sharing', NULL);

-- ============================================================================
-- DOCUMENTATION COMMENTS
-- ============================================================================

COMMENT ON TABLE people IS 'User profiles with Clerk authentication integration';
COMMENT ON TABLE groups IS 'Expense groups with ownership and archiving support';
COMMENT ON TABLE group_members IS 'Many-to-many relationship between groups and people';
COMMENT ON TABLE transactions IS 'Financial transactions with flexible split modes';
COMMENT ON TABLE payment_sources IS 'Payment methods (cards, UPI, cash, etc.)';
COMMENT ON TABLE group_invites IS 'Temporary shareable invite links for groups with 30-day expiration and multi-use capability';
COMMENT ON TABLE email_invites IS 'Email invitations sent via MailerSend with delivery tracking';

COMMENT ON FUNCTION cleanup_expired_invites() IS 'Utility function to clean up expired invite links and update email invite status';
COMMENT ON FUNCTION generate_invite_token() IS 'Generate secure URL-safe random token for invite links';

-- ============================================================================
-- MIGRATION COMPLETE
-- ============================================================================
-- Your database now includes:
-- ✅ All original tables (people, groups, transactions, payment_sources)
-- ✅ All applied migrations (clerk_user_id, created_by, is_archived, type fields)
-- ✅ NEW: Complete invite system (group_invites, email_invites)
-- ✅ Performance indexes for all tables
-- ✅ Triggers for automatic timestamp updates
-- ✅ Utility functions for invite management
-- ✅ Proper constraints and data validation
-- 
-- Next steps:
-- 1. Update your .env.local with new Supabase project credentials
-- 2. Regenerate TypeScript types for the new database
-- 3. Test the application with the new database
-- ============================================================================