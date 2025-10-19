# 🚨 Vercel Deployment Troubleshooting Guide

## Common Issues & Solutions

### 1. Check Build Logs
First, let's identify the specific error:

1. Go to your Vercel dashboard: https://vercel.com/dashboard
2. Find your project "Kharch-Baant"
3. Click on the failed deployment
4. Check the **Build Logs** for error messages

### 2. Environment Variables Not Set

**Most Common Issue**: Missing environment variables in Vercel

#### Required Environment Variables:
Go to Vercel Dashboard → Your Project → Settings → Environment Variables

Add these:
```
VITE_SUPABASE_URL=https://idpukrgwryqklvcpltbg.supabase.co
VITE_SUPABASE_ANON_KEY=[your-supabase-anon-key]
VITE_CLERK_PUBLISHABLE_KEY=[your-clerk-publishable-key]
VITE_API_MODE=supabase
```

**Important**: After adding environment variables, you MUST redeploy!

### 3. Build Command Issues

If build is failing, check these:

#### A. Missing Dependencies
```bash
# Vercel might be missing vite-plugin-pwa
# Add to package.json (should already be there after our commit)
"vite-plugin-pwa": "^0.20.5"
```

#### B. Build Timeout
If build takes too long:
- Check build logs for which step is hanging
- PWA generation might need optimization

### 4. Runtime Errors

If app builds but doesn't work:

#### A. Check Browser Console
Open deployed site → F12 → Console tab
Look for:
- ❌ CORS errors
- ❌ Missing environment variables
- ❌ Supabase connection errors
- ❌ Clerk authentication errors

#### B. Environment Variable Access
Ensure all `import.meta.env.VITE_*` variables are set in Vercel

### 5. Routing Issues (404 on refresh)

If routes don't work on refresh:
- ✅ `vercel.json` has rewrites configured (already done)
- This should work with current configuration

### 6. Supabase CORS

If you see CORS errors:

1. Go to Supabase Dashboard
2. Settings → API
3. Under "API URL Configuration"
4. Add your Vercel domain to allowed origins:
   ```
   https://your-app.vercel.app
   ```

### 7. Clerk Domain Configuration

Update Clerk to allow Vercel domain:

1. Go to Clerk Dashboard
2. Configure → Domains
3. Add your Vercel URL:
   ```
   https://your-app.vercel.app
   ```

## Quick Fix Checklist

- [ ] Environment variables added to Vercel
- [ ] Redeployed after adding env vars
- [ ] Supabase CORS configured
- [ ] Clerk domain added
- [ ] Build logs checked for specific errors
- [ ] Browser console checked for runtime errors

## Manual Deploy Command

If automatic deployment isn't working, try manual deploy:

```bash
# Install Vercel CLI
npm install -g vercel

# Login
vercel login

# Deploy
cd "e:\VS Code\Repo\Kharch-Baant"
vercel --prod
```

## Common Error Messages & Solutions

### Error: "Failed to compile"
**Solution**: Check that all imports are correct and TypeScript has no errors
```bash
npm run build
```

### Error: "Environment variable VITE_SUPABASE_URL is not defined"
**Solution**: Add environment variables in Vercel dashboard

### Error: "Clerk: Missing publishableKey"
**Solution**: Add VITE_CLERK_PUBLISHABLE_KEY to Vercel

### Error: "fetch failed" or network errors
**Solution**: 
1. Check Supabase URL is correct
2. Check CORS settings in Supabase
3. Verify Supabase project is not paused

### Error: PWA manifest issues
**Solution**: Ensure public folder is included in build
- Vercel should copy public/ to dist/ automatically

## Vercel-Specific Configuration

### Update vercel.json (already done):
```json
{
  "framework": "vite",
  "buildCommand": "npm run build",
  "outputDirectory": "dist",
  "installCommand": "npm install",
  "rewrites": [
    {
      "source": "/(.*)",
      "destination": "/index.html"
    }
  ],
  "env": {
    "VITE_SUPABASE_URL": "@supabase-url",
    "VITE_SUPABASE_ANON_KEY": "@supabase-anon-key",
    "VITE_CLERK_PUBLISHABLE_KEY": "@clerk-publishable-key",
    "VITE_API_MODE": "supabase"
  }
}
```

## Get More Details

**Tell me:**
1. What specific error message do you see in Vercel build logs?
2. Does the build succeed or fail?
3. If it builds, what happens when you visit the site?
4. Any errors in browser console?

## Next Steps

Please share:
- Screenshot of Vercel build logs (if build fails)
- Screenshot of browser console (if app loads but doesn't work)
- The error message you're seeing

Then I can provide a specific solution! 🚀