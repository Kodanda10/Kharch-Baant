# 🔍 Invite System Debugging Checklist

If a new user still can't see the group after accepting an invite, check these items:

## 1. Check Browser Console
Open DevTools (F12) → Console tab and look for:
```
🎫 Found invite token in URL: [token]
🎫 Validating invite token: [token]
✅ Invite is valid for group: [Group Name]
✅ Successfully joined group: [Group Name]
```

## 2. Verify Database Entry

### Check group_members table:
```sql
SELECT * FROM group_members 
WHERE person_id = '[NEW_USER_PERSON_ID]' 
AND group_id = '[GROUP_ID]';
```
Should return a row if the user was added successfully.

### Check if groups are being fetched:
```sql
SELECT g.* 
FROM groups g
INNER JOIN group_members gm ON g.id = gm.group_id
WHERE gm.person_id = '[NEW_USER_PERSON_ID]';
```
Should include the invited group.

## 3. Check RLS Policies

Ensure these policies exist in Supabase:

### groups table:
```sql
-- Users can view groups they're members of
CREATE POLICY "Users can view their groups" ON groups
FOR SELECT
USING (
  id IN (
    SELECT group_id FROM group_members 
    WHERE person_id = (
      SELECT id FROM people 
      WHERE clerk_id = auth.jwt() ->> 'sub'
    )
  )
);
```

### group_members table:
```sql
-- Users can view memberships for their groups
CREATE POLICY "Users can view group members" ON group_members
FOR SELECT
USING (
  group_id IN (
    SELECT group_id FROM group_members 
    WHERE person_id = (
      SELECT id FROM people 
      WHERE clerk_id = auth.jwt() ->> 'sub'
    )
  )
);

-- Allow inserting via invite (public access for acceptInvite)
CREATE POLICY "Anyone can join via invite" ON group_members
FOR INSERT
WITH CHECK (true);
```

## 4. Check Clerk User Mapping

Verify the person record was created:
```sql
SELECT * FROM people 
WHERE clerk_id = '[CLERK_USER_ID]';
```

Should show the user's person record with matching clerk_id.

## 5. Test Query Manually

Run this in Supabase SQL Editor (as anon user):
```sql
SELECT 
  g.*,
  gm.person_id
FROM groups g
INNER JOIN group_members gm ON g.id = gm.group_id
WHERE gm.person_id = '[NEW_USER_PERSON_ID]'
ORDER BY g.created_at DESC;
```

## 6. Common Issues & Solutions

### Issue: "Already a member" error
**Cause**: User was added but RLS prevents them from seeing it
**Solution**: Check SELECT policy on groups table

### Issue: Group appears briefly then disappears
**Cause**: State management issue or re-fetch clearing state
**Solution**: Check React component re-renders

### Issue: No error but group doesn't show
**Cause**: Silent failure in getGroups()
**Solution**: Add try-catch logging in supabaseApiService.ts

### Issue: Invite works for existing users but not new signups
**Cause**: ensureUserExists() timing issue
**Solution**: Check if person record is created before acceptInvite

## 7. Enable Debug Logging

Add this to App.tsx after fetching groups:
```typescript
console.log('📊 Groups fetched for user:', {
  personId: userPerson?.id,
  groupCount: groupsData.length,
  groupIds: groupsData.map(g => g.id),
  groupNames: groupsData.map(g => g.name)
});
```

## 8. Test in Isolation

Create a minimal test:
```typescript
// In browser console after signup
const personId = '[YOUR_PERSON_ID]';
const groups = await api.getGroups(personId);
console.log('Groups:', groups);
```

## 9. Network Tab Check

1. Open DevTools → Network tab
2. Filter by "Fetch/XHR"
3. Look for the API call to fetch groups
4. Check the response - does it include the invited group?

## 10. Supabase Dashboard Check

1. Go to Supabase Dashboard
2. Authentication → Users (check if Clerk user is synced)
3. Table Editor → group_members (verify entry exists)
4. API Logs (check for errors during invite acceptance)

---

**Quick Test Command:**
```javascript
// Run in browser console after accepting invite
console.log('Current user person:', currentUserPerson);
console.log('All groups:', groups);
console.log('Selected group ID:', selectedGroupId);
```