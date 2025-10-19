# 🚨 Vercel Blank Screen Fix - kharch-baant-phi.vercel.app

## Issue: Black/Blank Screen on Vercel

Your app shows a blank black screen. This is almost always due to **missing environment variables**.

## ✅ SOLUTION: Add Environment Variables to Vercel

### Step-by-Step Fix:

1. **Go to Vercel Dashboard**
   - Visit: https://vercel.com/dashboard
   - Click on your "kharch-baant" project

2. **Open Settings → Environment Variables**
   - Click "Settings" tab
   - Click "Environment Variables" in sidebar

3. **Add These Required Variables:**

   Click "Add New" for each:

   **Variable 1:**
   ```
   Name: VITE_SUPABASE_URL
   Value: https://idpukrgwryqklvcpltbg.supabase.co
   Environment: Production, Preview, Development (select all)
   ```

   **Variable 2:**
   ```
   Name: VITE_SUPABASE_ANON_KEY
   Value: [Get from your .env.local file]
   Environment: Production, Preview, Development (select all)
   ```

   **Variable 3:**
   ```
   Name: VITE_CLERK_PUBLISHABLE_KEY
   Value: [Get from your .env.local file]
   Environment: Production, Preview, Development (select all)
   ```

   **Variable 4:**
   ```
   Name: VITE_API_MODE
   Value: supabase
   Environment: Production, Preview, Development (select all)
   ```

4. **Redeploy**
   - After adding all variables, go to "Deployments" tab
   - Click the three dots (•••) on the latest deployment
   - Click "Redeploy"
   - Wait for build to complete

## 📋 Get Your Keys

### From Your Local .env.local File:

Open `e:\VS Code\Repo\Kharch-Baant\.env.local` and copy the values for:
- `VITE_SUPABASE_ANON_KEY`
- `VITE_CLERK_PUBLISHABLE_KEY`

### Or Get From Source:

**Supabase Keys:**
1. Go to: https://supabase.com/dashboard/project/idpukrgwryqklvcpltbg/settings/api
2. Copy "anon public" key

**Clerk Key:**
1. Go to: https://dashboard.clerk.com
2. Select your project
3. Go to "API Keys"
4. Copy "Publishable key" (starts with `pk_test_` or `pk_live_`)

## 🔧 Additional Configuration

After environment variables are set, also configure:

### 1. Clerk Domain Configuration
1. Go to Clerk Dashboard: https://dashboard.clerk.com
2. Configure → Domains
3. Click "Add domain"
4. Add: `kharch-baant-phi.vercel.app`
5. Save

### 2. Supabase CORS (Optional but Recommended)
1. Go to Supabase Dashboard
2. Settings → API
3. Under "API URL Configuration" → "CORS"
4. Add your domain: `https://kharch-baant-phi.vercel.app`

## ✅ Verification Steps

After redeploying:

1. Visit: https://kharch-baant-phi.vercel.app/
2. You should see the Clerk sign-in screen
3. Sign in with your account
4. App should load with your groups

## 🐛 Still Not Working?

### Check Browser Console:
1. On the blank page, press **F12**
2. Go to **Console** tab
3. Look for error messages
4. Common errors:
   - "Clerk: Missing publishableKey" → Add VITE_CLERK_PUBLISHABLE_KEY
   - "Failed to fetch" → Check Supabase URL/key
   - "CORS error" → Configure CORS in Supabase

### Check Vercel Build Logs:
1. Go to Vercel Dashboard → Deployments
2. Click on the latest deployment
3. Check if build succeeded
4. Look for any error messages

## 📝 Quick Checklist

- [ ] Added VITE_SUPABASE_URL to Vercel
- [ ] Added VITE_SUPABASE_ANON_KEY to Vercel
- [ ] Added VITE_CLERK_PUBLISHABLE_KEY to Vercel
- [ ] Added VITE_API_MODE=supabase to Vercel
- [ ] Redeployed after adding variables
- [ ] Added Vercel domain to Clerk
- [ ] Waited for build to complete (~2-3 minutes)
- [ ] Cleared browser cache and refreshed

## 🎯 Expected Result

After completing these steps, you should see:
- Clerk authentication screen
- After sign-in: Your dashboard with groups
- Full app functionality

---

**The blank screen is 99% due to missing environment variables. Follow steps above and it will work!** 🚀