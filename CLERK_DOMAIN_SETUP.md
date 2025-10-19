# Clerk Domain Configuration Required

## Issue: Blank Screen Even With Environment Variables

If you're still seeing a blank screen after adding environment variables, **Clerk needs your Vercel domain to be whitelisted**.

## Fix Steps:

### 1. Go to Clerk Dashboard
Visit: https://dashboard.clerk.com/

### 2. Select Your Application
Click on your "Kharch Baant" application (or "wanted-lynx-7")

### 3. Go to Domains Settings
Navigate to: **Configure → Domains** (in left sidebar)

### 4. Add Your Vercel Domain
Look for section: **"Allowed Origins (CORS)"** or **"Frontend API URLs"**

Add your Vercel URL:
```
https://kharch-baant-psi.vercel.app
```

Also add any other Vercel preview URLs like:
```
https://kharch-baant-*.vercel.app
```

### 5. Save Changes
Click "Save" or "Add Domain"

### 6. Wait & Test
- Wait 1-2 minutes for Clerk to propagate changes
- Clear browser cache (Ctrl+Shift+Delete)
- Visit your Vercel app again

## Alternative: Check Clerk Settings

### Development URLs
In Clerk Dashboard → Configure → Domains:
- Make sure "Development" mode is enabled OR
- Add your Vercel domain to "Production" allowed origins

### Common Issue
Clerk blocks requests from domains not in its whitelist for security reasons. Without your Vercel domain added, Clerk authentication will fail silently.

## Quick Test
Open browser DevTools (F12) → Console tab
Look for errors containing:
- "CORS"
- "Clerk"
- "blocked"
- "origin not allowed"

## If Still Not Working

Try this diagnostic approach:

1. **Check if JavaScript is loading at all**:
   - Open DevTools → Console
   - Type: `console.log('test')`
   - If this works, JavaScript is running

2. **Check for Clerk errors**:
   - Look for red errors in Console
   - Copy the error message and share it

3. **Check Network tab**:
   - Open DevTools → Network tab
   - Refresh page
   - Look for failed requests (red)
   - Check if clerk requests are failing

4. **Verify environment variables are actually in build**:
   - In Console, type: `import.meta.env`
   - You should see your VITE_ variables
   - If they're undefined, Vercel didn't include them

## Most Likely Issue
🎯 **Clerk domain not whitelisted** - This is the #1 cause of blank screens after env vars are added.
