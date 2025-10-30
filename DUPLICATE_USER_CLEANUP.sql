-- DUPLICATE USER CLEANUP SCRIPT
-- Run this in Supabase SQL Editor to fix duplicate user issues

-- First, let's see what duplicates exist
SELECT clerk_user_id, COUNT(*) as count, 
       STRING_AGG(name, ', ') as names,
       STRING_AGG(id::text, ', ') as ids
FROM people 
WHERE clerk_user_id IS NOT NULL 
GROUP BY clerk_user_id 
HAVING COUNT(*) > 1;

-- Option 1: SAFE CLEANUP (Recommended)
-- This will keep the first user and remove duplicates
-- Only run this if you see duplicates in the query above

-- Uncomment the lines below if you want to clean up duplicates:

/*
WITH duplicates AS (
  SELECT id, clerk_user_id,
         ROW_NUMBER() OVER (PARTITION BY clerk_user_id ORDER BY created_at ASC) as rn
  FROM people 
  WHERE clerk_user_id IS NOT NULL
),
to_delete AS (
  SELECT id FROM duplicates WHERE rn > 1
)
DELETE FROM people WHERE id IN (SELECT id FROM to_delete);
*/

-- Option 2: MANUAL CLEANUP
-- If you prefer to see what will be deleted first:

-- Show duplicates that would be deleted (keeps the oldest record)
WITH duplicates AS (
  SELECT id, name, clerk_user_id, created_at,
         ROW_NUMBER() OVER (PARTITION BY clerk_user_id ORDER BY created_at ASC) as rn
  FROM people 
  WHERE clerk_user_id IS NOT NULL
)
SELECT id, name, clerk_user_id, created_at, 'WOULD DELETE' as action
FROM duplicates 
WHERE rn > 1
ORDER BY clerk_user_id, created_at;

-- After reviewing, you can manually delete specific records:
-- DELETE FROM people WHERE id = 'specific-uuid-here';
