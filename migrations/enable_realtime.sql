-- Enable Realtime for all tables
-- This script enables Supabase Realtime for the main tables

-- Enable replica identity FULL for realtime to send complete row data
ALTER TABLE groups REPLICA IDENTITY FULL;
ALTER TABLE transactions REPLICA IDENTITY FULL;
ALTER TABLE payment_sources REPLICA IDENTITY FULL;
ALTER TABLE people REPLICA IDENTITY FULL;
ALTER TABLE group_members REPLICA IDENTITY FULL;

-- Enable realtime publication (Supabase automatically creates 'supabase_realtime' publication)
-- Add tables to the realtime publication
ALTER PUBLICATION supabase_realtime ADD TABLE groups;
ALTER PUBLICATION supabase_realtime ADD TABLE transactions;
ALTER PUBLICATION supabase_realtime ADD TABLE payment_sources;
ALTER PUBLICATION supabase_realtime ADD TABLE people;
ALTER PUBLICATION supabase_realtime ADD TABLE group_members;

-- Grant realtime access
GRANT SELECT ON groups TO anon, authenticated;
GRANT SELECT ON transactions TO anon, authenticated;
GRANT SELECT ON payment_sources TO anon, authenticated;
GRANT SELECT ON people TO anon, authenticated;
GRANT SELECT ON group_members TO anon, authenticated;
