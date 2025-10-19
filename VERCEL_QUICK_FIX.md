# 🔍 Quick Vercel Deployment Fix

## Most Likely Issues:

### 1️⃣ **Missing Environment Variables** (90% of cases)

Go to Vercel Dashboard → Settings → Environment Variables and add:

```
VITE_SUPABASE_URL = https://idpukrgwryqklvcpltbg.supabase.co
VITE_SUPABASE_ANON_KEY = [Your Key from Supabase]
VITE_CLERK_PUBLISHABLE_KEY = pk_test_... [Your Clerk Key]
VITE_API_MODE = supabase
```

**After adding, click "Redeploy" on your latest deployment!**

### 2️⃣ **Clerk Domain Not Configured**

1. Go to Clerk Dashboard: https://dashboard.clerk.com
2. Configure → Domains
3. Add your Vercel URL (e.g., `kharch-baant.vercel.app`)
4. Enable it for production

### 3️⃣ **Supabase CORS**

1. Go to Supabase Dashboard
2. Settings → API
3. Scroll to "API URL Configuration"
4. Add your Vercel domain to allowed origins

## Quick Test Commands

### Test build locally:
```bash
cd "e:\VS Code\Repo\Kharch-Baant"
npm run build
npm run preview
# Visit http://localhost:4173 to test
```

### Check for environment variable issues:
```bash
# In your local .env.local, make sure you have:
# VITE_SUPABASE_URL=...
# VITE_SUPABASE_ANON_KEY=...
# VITE_CLERK_PUBLISHABLE_KEY=...
```

## What Error Are You Seeing?

**Option A: Build Fails**
- Check Vercel build logs
- Look for missing dependencies or TypeScript errors

**Option B: Build Succeeds but App Shows Blank/Error**
- Missing environment variables
- Check browser console (F12)
- Likely Clerk or Supabase connection issue

**Option C: Authentication Issues**
- Clerk domain not configured
- Check Clerk dashboard domains

**Option D: 404 on Routes**
- Already fixed with vercel.json rewrites ✅

## Get Your Keys

### Supabase Keys:
1. Go to: https://supabase.com/dashboard/project/idpukrgwryqklvcpltbg/settings/api
2. Copy "Project URL" → This is VITE_SUPABASE_URL
3. Copy "anon public" key → This is VITE_SUPABASE_ANON_KEY

### Clerk Key:
1. Go to: https://dashboard.clerk.com
2. API Keys
3. Copy "Publishable key" → This is VITE_CLERK_PUBLISHABLE_KEY

## Tell Me More

**What specifically is not working?**
1. Is the build failing? (Red X in Vercel)
2. Does the site load but show errors?
3. Is authentication not working?
4. Something else?

Reply with the specific issue and I'll provide the exact fix! 🎯