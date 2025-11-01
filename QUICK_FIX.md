## 🚀 QUICK FIX - Copy & Paste This SQL

**Go to Supabase Dashboard → SQL Editor → New Query → Paste & Run:**

```sql
-- Enable Realtime (takes 10 seconds)
ALTER TABLE groups REPLICA IDENTITY FULL;
ALTER TABLE transactions REPLICA IDENTITY FULL;
ALTER TABLE payment_sources REPLICA IDENTITY FULL;
ALTER TABLE people REPLICA IDENTITY FULL;
ALTER TABLE group_members REPLICA IDENTITY FULL;

ALTER PUBLICATION supabase_realtime ADD TABLE groups;
ALTER PUBLICATION supabase_realtime ADD TABLE transactions;
ALTER PUBLICATION supabase_realtime ADD TABLE payment_sources;
ALTER PUBLICATION supabase_realtime ADD TABLE people;
ALTER PUBLICATION supabase_realtime ADD TABLE group_members;

GRANT SELECT ON groups TO anon, authenticated;
GRANT SELECT ON transactions TO anon, authenticated;
GRANT SELECT ON payment_sources TO anon, authenticated;
GRANT SELECT ON people TO anon, authenticated;
GRANT SELECT ON group_members TO anon, authenticated;
```

**Done! Refresh your deployed app and you'll see:**
- Green "Live" indicator in bottom-right corner ✅
- Expenses appear instantly without refresh ✅
- Console logs show `SUBSCRIBED` status ✅

**If you see red "Disconnected":**
1. Check Supabase Dashboard → Settings → API → Enable Realtime is ON
2. Check browser console for errors
3. Try hard refresh (Ctrl+Shift+R)
