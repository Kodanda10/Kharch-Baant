-- Migration: Add invite system for temporary shareable links and email invitations
-- Date: 2025-10-19
-- Features: 30-day expiration, multi-use links, MailerSend integration

-- Add group_invites table for temporary shareable links
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

-- Add email_invites table for tracking email invitations
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

-- Add indexes for performance
CREATE INDEX idx_group_invites_token ON group_invites(invite_token);
CREATE INDEX idx_group_invites_group_id ON group_invites(group_id);
CREATE INDEX idx_group_invites_expires_at ON group_invites(expires_at);
CREATE INDEX idx_group_invites_active ON group_invites(is_active) WHERE is_active = true;

CREATE INDEX idx_email_invites_email ON email_invites(email);
CREATE INDEX idx_email_invites_group_id ON email_invites(group_id);
CREATE INDEX idx_email_invites_status ON email_invites(status);
CREATE INDEX idx_email_invites_group_invite_id ON email_invites(group_invite_id);

-- Add updated_at trigger for group_invites
CREATE TRIGGER update_group_invites_updated_at 
    BEFORE UPDATE ON group_invites 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Add function to clean up expired invites (optional - can be called periodically)
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

-- Add function to generate secure random tokens
CREATE OR REPLACE FUNCTION generate_invite_token()
RETURNS TEXT AS $$
BEGIN
    -- Generate 32-character URL-safe token using random bytes
    RETURN encode(gen_random_bytes(24), 'base64')::text;
END;
$$ LANGUAGE plpgsql;

-- Comment for documentation
COMMENT ON TABLE group_invites IS 'Temporary shareable invite links for groups with 30-day expiration and multi-use capability';
COMMENT ON TABLE email_invites IS 'Email invitations sent via MailerSend with delivery tracking';
COMMENT ON FUNCTION cleanup_expired_invites() IS 'Utility function to clean up expired invite links and update email invite status';
COMMENT ON FUNCTION generate_invite_token() IS 'Generate secure URL-safe random token for invite links';