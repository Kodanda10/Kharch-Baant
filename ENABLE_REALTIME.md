# Enable Realtime - Required Setup

Your friend's changes aren't appearing in real-time because Supabase Realtime needs to be enabled on your database tables.

## Problem
Realtime subscriptions in code are set up correctly, but the database isn't broadcasting changes.

## Solution: Run This SQL in Supabase

### Step 1: Go to Supabase Dashboard
1. Open https://supabase.com/dashboard
2. Select your project
3. Go to "SQL Editor" in the left sidebar
4. Create a new query and paste the SQL below

### Step 2: Run This SQL Script

```sql
-- ================================================
-- ENABLE SUPABASE REALTIME FOR ALL TABLES
-- ================================================

-- Step 1: Enable REPLICA IDENTITY FULL
-- This allows Realtime to send complete row data
ALTER TABLE groups REPLICA IDENTITY FULL;
ALTER TABLE transactions REPLICA IDENTITY FULL;
ALTER TABLE payment_sources REPLICA IDENTITY FULL;
ALTER TABLE people REPLICA IDENTITY FULL;
ALTER TABLE group_members REPLICA IDENTITY FULL;

-- Step 2: Add tables to realtime publication
-- This tells Supabase which tables to broadcast
ALTER PUBLICATION supabase_realtime ADD TABLE groups;
ALTER PUBLICATION supabase_realtime ADD TABLE transactions;
ALTER PUBLICATION supabase_realtime ADD TABLE payment_sources;
ALTER PUBLICATION supabase_realtime ADD TABLE people;
ALTER PUBLICATION supabase_realtime ADD TABLE group_members;

-- Step 3: Grant SELECT permissions for realtime
-- Both authenticated and anonymous users need read access
GRANT SELECT ON groups TO anon, authenticated;
GRANT SELECT ON transactions TO anon, authenticated;
GRANT SELECT ON payment_sources TO anon, authenticated;
GRANT SELECT ON people TO anon, authenticated;
GRANT SELECT ON group_members TO anon, authenticated;

-- Verify setup
SELECT schemaname, tablename 
FROM pg_publication_tables 
WHERE pubname = 'supabase_realtime';
```

### Step 3: Verify in Supabase Dashboard
1. Go to "Database" → "Replication" in the sidebar
2. You should see all 5 tables listed:
   - groups
   - transactions
   - payment_sources
   - people
   - group_members

### Step 4: Test It
1. Deploy your updated code (already done with the latest push)
2. Open your app in two different browsers (or one normal + one incognito)
3. Log in as different users
4. Add an expense in one browser
5. Watch it appear instantly in the other browser (no refresh needed!)

## What You'll See

### Before Running SQL
- Console shows: `🔌 Groups subscription status: CHANNEL_ERROR`
- Changes require page refresh
- Red "Disconnected" indicator in bottom-right

### After Running SQL
- Console shows: `🔌 Groups subscription status: SUBSCRIBED`
- Console shows: `📡 Transactions realtime event: INSERT`
- Changes appear instantly
- Green "Live" indicator in bottom-right

## Troubleshooting

### If it still doesn't work:

**Check Realtime is enabled on your project:**
1. Supabase Dashboard → Settings → API
2. Scroll to "Realtime" section
3. Make sure "Enable Realtime" is turned ON

**Check RLS policies:**
Your RLS policies should allow SELECT for authenticated users. If too restrictive, realtime won't work.

**Check browser console:**
Look for errors like:
- `CHANNEL_ERROR` - Realtime not enabled on table
- `TIMED_OUT` - Network/firewall blocking WebSocket
- `CLOSED` - Connection lost

## Files Changed in Latest Commit

1. **migrations/enable_realtime.sql** - SQL to enable realtime
2. **components/RealtimeStatus.tsx** - Visual connection indicator
3. **App.tsx** - Added RealtimeStatus component

## Alternative: Manual Polling (Not Recommended)

If you absolutely cannot enable Realtime, you can add polling as a fallback, but it's much less efficient and has delays.

---

**After running the SQL, redeploy or just hard refresh your production app. The realtime should start working immediately!**
