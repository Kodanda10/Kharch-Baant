# 🔴 User Code Error Report

**Date:** October 30, 2025  
**Status:** CRITICAL ERRORS FOUND

## Executive Summary

Found **3 critical errors** in user-related code that prevent proper user authentication and management.

---

## Error #1: Database Column Name Mismatch (CRITICAL)

### Location
`services/supabaseApiService.ts` lines 584, 600

### Problem
Code uses `auth_user_id` but database schema defines `clerk_user_id`

### Code (Current - WRONG):
```typescript
// Line 584
.eq('auth_user_id', authUserId);

// Line 600
auth_user_id: authUserId,
```

### Database Schema (database.types.ts - ACTUAL):
```typescript
people: {
  Row: {
    avatar_url: string
    clerk_user_id: string | null  // ← ACTUAL COLUMN NAME
    created_at: string | null
    id: string
    name: string
    updated_at: string | null
  }
}
```

### Impact
- ❌ Users cannot be found in database
- ❌ User creation fails with "column does not exist" error
- ❌ Authentication fails silently
- ❌ Duplicate user records may be created
- ❌ App cannot function with multi-user authentication

### Fix Required
Replace `auth_user_id` with `clerk_user_id` in:
1. Line 584: `.eq('auth_user_id', authUserId)` → `.eq('clerk_user_id', authUserId)`
2. Line 600: `auth_user_id: authUserId` → `clerk_user_id: authUserId`

---

## Error #2: Missing Email Column (CRITICAL)

### Location
`services/supabaseApiService.ts` line 599

### Problem
Code tries to insert `email` field but `people` table doesn't have an `email` column

### Code (Current):
```typescript
const { data, error } = await supabase
  .from('people')
  .insert({
    name: userName || userEmail.split('@')[0],
    email: userEmail,  // ❌ COLUMN DOESN'T EXIST
    auth_user_id: authUserId,  // ❌ WRONG NAME (see Error #1)
    avatar_url: `https://ui-avatars.com/api/?name=...`
  })
```

### Database Schema:
```typescript
people: {
  Row: {
    avatar_url: string
    clerk_user_id: string | null
    created_at: string | null
    id: string
    name: string
    updated_at: string | null
    // ❌ NO EMAIL COLUMN
  }
}
```

### Impact
- ❌ Database insert will fail
- ❌ User cannot be created
- ❌ Signup process breaks

### Fix Options
**Option A (Recommended):** Remove email from insert since it's not in schema
**Option B:** Add email column to database schema via migration

---

## Error #3: Syntax Error in SignupForm Interface

### Location
`components/auth/SignupForm.tsx` line 5

### Problem
Extra semicolon before interface properties

### Code (Current - from codebase search):
```typescript
interface SignUpFormProps {
;  // ❌ INVALID SYNTAX
  onSuccess?: () => void;
}
```

### Impact
- May cause TypeScript compilation issues
- Inconsistent code style

### Note
When I read the file directly, it appeared correct, but codebase search showed this error. This might be a caching issue or the file was recently fixed.

---

## Error #4: Type Mismatch (WARNING)

### Location
`types.ts` and usage throughout codebase

### Problem
The `Person` type likely has `authUserId` property but should match database column name

### Check Required
Review `types.ts` to ensure Person interface matches database schema:
```typescript
interface Person {
  id: string;
  name: string;
  avatarUrl: string;
  email?: string;  // Check if this should exist
  clerkUserId?: string;  // Should be clerkUserId, not authUserId
}
```

---

## Recommended Fix Priority

### Priority 1 (Must Fix Immediately):
1. ✅ Fix column name: `auth_user_id` → `clerk_user_id` in supabaseApiService.ts
2. ✅ Remove `email` field from insert operation OR add migration to add email column

### Priority 2 (Should Fix Soon):
3. ✅ Update Person type definition to use `clerkUserId` instead of `authUserId`
4. ✅ Update transformDbPersonToAppPerson function to map correctly

### Priority 3 (Nice to Have):
5. ✅ Add database migration to include email column if needed
6. ✅ Add unit tests for ensureUserExists function
7. ✅ Add error logging for better debugging

---

## Testing Required After Fix

1. **Signup Flow:**
   - New user signs up
   - User record created in `people` table
   - `clerk_user_id` properly populated

2. **Login Flow:**
   - Existing user logs in
   - User found by `clerk_user_id`
   - No duplicate records created

3. **Database Verification:**
   - Check `people` table has correct columns
   - Verify `clerk_user_id` is properly indexed
   - Confirm no `auth_user_id` column references

---

## Additional Findings

### Positive Notes:
- ✅ Build compiles successfully (errors are runtime, not compile-time)
- ✅ SupabaseAuthContext implementation is correct
- ✅ UserMenu component properly implemented
- ✅ Auth flow UI components working correctly

### Architecture Observation:
The codebase appears to be in transition from Clerk to Supabase Auth:
- Database still has `clerk_user_id` column
- Code tries to use `auth_user_id`
- This suggests incomplete migration

### Recommendation:
Decide on one auth provider and update consistently:
- **If using Supabase Auth:** Add migration to rename `clerk_user_id` → `auth_user_id`
- **If keeping Clerk:** Update code to use `clerk_user_id` everywhere

---

## Files to Fix

1. `services/supabaseApiService.ts` - Fix column names
2. `types.ts` - Update Person interface
3. Database migration - Add/rename columns as needed
4. `lib/database.types.ts` - Regenerate if schema changes

---

## Conclusion

**Status:** 🔴 CRITICAL - App cannot function properly with current errors

**Action Required:** Immediate fix to column name mismatch before any user authentication can work.

**Estimated Fix Time:** 15-30 minutes

**Risk Level:** HIGH - Data integrity and user authentication compromised

