# CRITICAL: Vercel Environment Variable Checklist

## ❌ Current Issue: React not loading, Clerk failing

Based on diagnostic output:
- React loaded? ❌ No
- Root has content? ❌ No (empty)
- Clerk not loaded - likely the issue!

## Root Cause
**Vercel is NOT reading environment variables during build**, causing the bundles to break.

## Exact Steps to Fix:

### 1. Double-Check Variable Names in Vercel Dashboard

Go to: Project Settings → Environment Variables

**Make sure these EXACT names exist** (case-sensitive!):

```
VITE_CLERK_PUBLISHABLE_KEY
VITE_SUPABASE_URL
VITE_SUPABASE_ANON_KEY
VITE_API_MODE
```

❗ Common mistakes:
- ❌ `CLERK_PUBLISHABLE_KEY` (missing VITE_ prefix)
- ❌ `vite_clerk_publishable_key` (wrong case)
- ❌ Extra spaces in variable name
- ❌ Not selected for "Production" environment

### 2. Verify Each Variable Has Value

Click on each variable and verify:
- ✅ Has a value (not empty)
- ✅ "Production" checkbox is checked
- ✅ "Preview" checkbox is checked  
- ✅ "Development" checkbox is checked

### 3. Delete Vercel Build Cache

**Option A: Via Dashboard**
1. Go to Deployments tab
2. Find latest deployment
3. Click "..." menu → "Redeploy"
4. **UNCHECK** "Use existing Build Cache"
5. Click "Redeploy"

**Option B: Project Settings**
1. Settings → General
2. Scroll to bottom
3. "Clear Build Cache" button (if available)

### 4. Verify Deployment Logs

After redeploying:
1. Go to Deployments → Latest deployment
2. Click on it to see details
3. Click "Building" to see logs
4. Search for "VITE_" in logs
5. You should see Vite picking up the env vars

### 5. Alternative: Use Vercel CLI to Deploy

If dashboard isn't working, try CLI:

```bash
npm install -g vercel
cd "e:\VS Code\Repo\Kharch-Baant"
vercel --prod
```

This will use the env vars you configured in dashboard.

## Why This Happens

Vercel caches builds aggressively. If you:
1. First deployed WITHOUT env vars
2. Then added env vars
3. Pushed new commit

Vercel might reuse cached chunks from the old build that didn't have env vars.

## Final Verification

After redeploy, check these in browser console:

```javascript
// This should show your env vars (NOT undefined)
window.location.href
// Should see the actual domain

// Check if bundles loaded
document.querySelectorAll('script[src*="assets"]').length
// Should be > 0
```

## If STILL Not Working

Share screenshot of:
1. Vercel → Settings → Environment Variables page (show all 4 variables)
2. Vercel → Latest Deployment → Build Logs (search for "VITE_")
3. Browser console errors after hard refresh (Ctrl+Shift+R)
