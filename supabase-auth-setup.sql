-- Authentication Setup for Kharch-Baant
-- Run this in your Supabase SQL Editor AFTER enabling authentication in the Supabase Dashboard

-- 1. First, enable Row Level Security on all tables
ALTER TABLE people ENABLE ROW LEVEL SECURITY;
ALTER TABLE groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE group_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE payment_sources ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;

-- 2. Create user profiles table to store additional user information
CREATE TABLE IF NOT EXISTS user_profiles (
    id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
    display_name TEXT,
    avatar_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS for user profiles
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

-- 3. Add user_id columns to existing tables (if they don't exist)
DO $$ 
BEGIN
    -- Add user_id to people table
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'people' AND column_name = 'user_id') THEN
        ALTER TABLE people ADD COLUMN user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;
    END IF;
    
    -- Add user_id to groups table  
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'groups' AND column_name = 'created_by') THEN
        ALTER TABLE groups ADD COLUMN created_by UUID REFERENCES auth.users(id) ON DELETE CASCADE;
    END IF;
    
    -- Add user_id to payment_sources table
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'payment_sources' AND column_name = 'user_id') THEN
        ALTER TABLE payment_sources ADD COLUMN user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;
    END IF;
END $$;

-- 4. Create Row Level Security Policies

-- User Profiles: Users can only see and edit their own profile
CREATE POLICY "Users can view own profile" ON user_profiles
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON user_profiles
    FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile" ON user_profiles
    FOR INSERT WITH CHECK (auth.uid() = id);

-- People: Users can see people in their groups
CREATE POLICY "Users can view people in their groups" ON people
    FOR SELECT USING (
        user_id = auth.uid() OR
        EXISTS (
            SELECT 1 FROM group_members gm
            JOIN groups g ON gm.group_id = g.id
            WHERE g.created_by = auth.uid() AND gm.person_id = people.id
        )
    );

CREATE POLICY "Users can insert people" ON people
    FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their people" ON people
    FOR UPDATE USING (user_id = auth.uid());

-- Groups: Users can see groups they created or are members of
CREATE POLICY "Users can view their groups" ON groups
    FOR SELECT USING (
        created_by = auth.uid() OR
        EXISTS (
            SELECT 1 FROM group_members gm
            JOIN people p ON gm.person_id = p.id
            WHERE gm.group_id = groups.id AND p.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can insert groups" ON groups
    FOR INSERT WITH CHECK (created_by = auth.uid());

CREATE POLICY "Users can update their groups" ON groups
    FOR UPDATE USING (created_by = auth.uid());

CREATE POLICY "Users can delete their groups" ON groups
    FOR DELETE USING (created_by = auth.uid());

-- Group Members: Users can manage members of their groups
CREATE POLICY "Users can view group members" ON group_members
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM groups g
            WHERE g.id = group_members.group_id AND g.created_by = auth.uid()
        ) OR
        EXISTS (
            SELECT 1 FROM people p
            WHERE p.id = group_members.person_id AND p.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can insert group members" ON group_members
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM groups g
            WHERE g.id = group_members.group_id AND g.created_by = auth.uid()
        )
    );

CREATE POLICY "Users can delete group members" ON group_members
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM groups g
            WHERE g.id = group_members.group_id AND g.created_by = auth.uid()
        )
    );

-- Payment Sources: Users can only see their own payment sources
CREATE POLICY "Users can view own payment sources" ON payment_sources
    FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can insert payment sources" ON payment_sources
    FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own payment sources" ON payment_sources
    FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY "Users can delete own payment sources" ON payment_sources
    FOR DELETE USING (user_id = auth.uid());

-- Transactions: Users can see transactions in their groups
CREATE POLICY "Users can view group transactions" ON transactions
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM groups g
            WHERE g.id = transactions.group_id AND (
                g.created_by = auth.uid() OR
                EXISTS (
                    SELECT 1 FROM group_members gm
                    JOIN people p ON gm.person_id = p.id
                    WHERE gm.group_id = g.id AND p.user_id = auth.uid()
                )
            )
        )
    );

CREATE POLICY "Users can insert group transactions" ON transactions
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM groups g
            WHERE g.id = transactions.group_id AND (
                g.created_by = auth.uid() OR
                EXISTS (
                    SELECT 1 FROM group_members gm
                    JOIN people p ON gm.person_id = p.id
                    WHERE gm.group_id = g.id AND p.user_id = auth.uid()
                )
            )
        )
    );

CREATE POLICY "Users can update group transactions" ON transactions
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM groups g
            WHERE g.id = transactions.group_id AND (
                g.created_by = auth.uid() OR
                EXISTS (
                    SELECT 1 FROM group_members gm
                    JOIN people p ON gm.person_id = p.id
                    WHERE gm.group_id = g.id AND p.user_id = auth.uid()
                )
            )
        )
    );

CREATE POLICY "Users can delete group transactions" ON transactions
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM groups g
            WHERE g.id = transactions.group_id AND g.created_by = auth.uid()
        )
    );

-- 5. Create a trigger to automatically create user profile when user signs up
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
    INSERT INTO public.user_profiles (id, display_name, avatar_url)
    VALUES (
        NEW.id,
        COALESCE(NEW.raw_user_meta_data->>'display_name', split_part(NEW.email, '@', 1)),
        'https://i.pravatar.cc/150?u=' || NEW.id
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create the trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 6. Grant necessary permissions
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated;

-- Optional: Clean up existing test data (uncomment if you want to start fresh)
-- DELETE FROM transactions;
-- DELETE FROM group_members;
-- DELETE FROM groups;
-- DELETE FROM people;
-- DELETE FROM payment_sources;

COMMENT ON TABLE user_profiles IS 'Extended user information linked to auth.users';
COMMENT ON POLICY "Users can view their groups" ON groups IS 'Users can only see groups they created or are members of';
COMMENT ON POLICY "Users can view own payment sources" ON payment_sources IS 'Users can only access their own payment methods';