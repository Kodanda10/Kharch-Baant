-- Kharch-Baant Database Schema for Supabase
-- Run this script in your Supabase SQL Editor

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create people table
CREATE TABLE people (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    avatar_url TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create groups table
CREATE TABLE groups (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    currency TEXT NOT NULL DEFAULT 'USD',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create group_members junction table
CREATE TABLE group_members (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    group_id UUID NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
    person_id UUID NOT NULL REFERENCES people(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(group_id, person_id)
);

-- Create payment_sources table
CREATE TABLE payment_sources (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('Credit Card', 'UPI', 'Cash', 'Other')),
    details JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create transactions table
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
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX idx_group_members_group_id ON group_members(group_id);
CREATE INDEX idx_group_members_person_id ON group_members(person_id);
CREATE INDEX idx_transactions_group_id ON transactions(group_id);
CREATE INDEX idx_transactions_paid_by_id ON transactions(paid_by_id);
CREATE INDEX idx_transactions_date ON transactions(date);
CREATE INDEX idx_transactions_tag ON transactions(tag);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Add updated_at triggers
CREATE TRIGGER update_people_updated_at BEFORE UPDATE ON people FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_groups_updated_at BEFORE UPDATE ON groups FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_payment_sources_updated_at BEFORE UPDATE ON payment_sources FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_transactions_updated_at BEFORE UPDATE ON transactions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Insert initial sample data
-- First, insert people with specific UUIDs for consistency
INSERT INTO people (id, name, avatar_url) VALUES
    ('00000000-0000-0000-0000-000000000001', 'You', 'https://i.pravatar.cc/150?u=p1'),
    ('00000000-0000-0000-0000-000000000002', 'Alice', 'https://i.pravatar.cc/150?u=p2'),
    ('00000000-0000-0000-0000-000000000003', 'Bob', 'https://i.pravatar.cc/150?u=p3'),
    ('00000000-0000-0000-0000-000000000004', 'Charlie', 'https://i.pravatar.cc/150?u=p4'),
    ('00000000-0000-0000-0000-000000000005', 'Diana', 'https://i.pravatar.cc/150?u=p5');

-- Insert groups with specific UUIDs
INSERT INTO groups (id, name, currency) VALUES
    ('10000000-0000-0000-0000-000000000001', 'Trip to Bali', 'INR'),
    ('10000000-0000-0000-0000-000000000002', 'Apartment Bills', 'EUR'),
    ('10000000-0000-0000-0000-000000000003', 'Weekend Getaway', 'USD');

-- Insert group members using the UUIDs
INSERT INTO group_members (group_id, person_id) VALUES
    ('10000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001'),
    ('10000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000002'),
    ('10000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000003'),
    ('10000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000001'),
    ('10000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000004'),
    ('10000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000005'),
    ('10000000-0000-0000-0000-000000000003', '00000000-0000-0000-0000-000000000001'),
    ('10000000-0000-0000-0000-000000000003', '00000000-0000-0000-0000-000000000002'),
    ('10000000-0000-0000-0000-000000000003', '00000000-0000-0000-0000-000000000004'),
    ('10000000-0000-0000-0000-000000000003', '00000000-0000-0000-0000-000000000005');

-- Insert payment source with UUID
INSERT INTO payment_sources (id, name, type) VALUES
    ('20000000-0000-0000-0000-000000000001', 'Cash', 'Cash');

-- Insert transactions with proper UUIDs
INSERT INTO transactions (id, group_id, description, amount, paid_by_id, date, tag, split_mode, split_participants) VALUES
    ('30000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000001', 'Flight tickets', 50000, '00000000-0000-0000-0000-000000000001', '2024-07-10', 'Travel', 'equal', '[{"personId": "00000000-0000-0000-0000-000000000001", "value": 1}, {"personId": "00000000-0000-0000-0000-000000000002", "value": 1}, {"personId": "00000000-0000-0000-0000-000000000003", "value": 1}]'),
    ('30000000-0000-0000-0000-000000000002', '10000000-0000-0000-0000-000000000001', 'Hotel booking', 75000, '00000000-0000-0000-0000-000000000002', '2024-07-11', 'Housing', 'equal', '[{"personId": "00000000-0000-0000-0000-000000000001", "value": 1}, {"personId": "00000000-0000-0000-0000-000000000002", "value": 1}, {"personId": "00000000-0000-0000-0000-000000000003", "value": 1}]'),
    ('30000000-0000-0000-0000-000000000003', '10000000-0000-0000-0000-000000000001', 'Dinner at fancy restaurant', 12000, '00000000-0000-0000-0000-000000000003', '2024-07-12', 'Food', 'equal', '[{"personId": "00000000-0000-0000-0000-000000000001", "value": 1}, {"personId": "00000000-0000-0000-0000-000000000002", "value": 1}, {"personId": "00000000-0000-0000-0000-000000000003", "value": 1}]'),
    ('30000000-0000-0000-0000-000000000004', '10000000-0000-0000-0000-000000000002', 'Electricity Bill', 75, '00000000-0000-0000-0000-000000000004', '2024-07-01', 'Utilities', 'equal', '[{"personId": "00000000-0000-0000-0000-000000000001", "value": 1}, {"personId": "00000000-0000-0000-0000-000000000004", "value": 1}, {"personId": "00000000-0000-0000-0000-000000000005", "value": 1}]'),
    ('30000000-0000-0000-0000-000000000005', '10000000-0000-0000-0000-000000000002', 'Internet Bill', 50, '00000000-0000-0000-0000-000000000001', '2024-07-05', 'Utilities', 'equal', '[{"personId": "00000000-0000-0000-0000-000000000001", "value": 1}, {"personId": "00000000-0000-0000-0000-000000000004", "value": 1}, {"personId": "00000000-0000-0000-0000-000000000005", "value": 1}]'),
    ('30000000-0000-0000-0000-000000000006', '10000000-0000-0000-0000-000000000003', 'Gas for the car', 60, '00000000-0000-0000-0000-000000000002', '2024-07-15', 'Transport', 'equal', '[{"personId": "00000000-0000-0000-0000-000000000001", "value": 1}, {"personId": "00000000-0000-0000-0000-000000000002", "value": 1}, {"personId": "00000000-0000-0000-0000-000000000004", "value": 1}]'),
    ('30000000-0000-0000-0000-000000000007', '10000000-0000-0000-0000-000000000003', 'Groceries for the trip', 120, '00000000-0000-0000-0000-000000000001', '2024-07-15', 'Groceries', 'equal', '[{"personId": "00000000-0000-0000-0000-000000000001", "value": 1}, {"personId": "00000000-0000-0000-0000-000000000002", "value": 1}, {"personId": "00000000-0000-0000-0000-000000000004", "value": 1}, {"personId": "00000000-0000-0000-0000-000000000005", "value": 1}]');

-- Enable Row Level Security (RLS) for future authentication
ALTER TABLE people ENABLE ROW LEVEL SECURITY;
ALTER TABLE groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE group_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE payment_sources ENABLE ROW LEVEL SECURITY;

-- For now, allow all operations (you can restrict this later with proper auth)
CREATE POLICY "Allow all operations" ON people FOR ALL USING (true);
CREATE POLICY "Allow all operations" ON groups FOR ALL USING (true);
CREATE POLICY "Allow all operations" ON group_members FOR ALL USING (true);
CREATE POLICY "Allow all operations" ON transactions FOR ALL USING (true);
CREATE POLICY "Allow all operations" ON payment_sources FOR ALL USING (true);