# 🎯 EXACT Environment Variables for Vercel

## Copy These to Vercel Dashboard

Go to: https://vercel.com/dashboard → kharch-baant → Settings → Environment Variables

### Add Each Variable:

---

**1. VITE_SUPABASE_URL**
```
https://idpukrgwryqklvcpltbg.supabase.co
```
Environments: ✅ Production ✅ Preview ✅ Development

---

**2. VITE_SUPABASE_ANON_KEY**
```
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlkcHVrcmd3cnlxa2x2Y3BsdGJnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjA3MDE5ODgsImV4cCI6MjA3NjI3Nzk4OH0.eweaxsMUJI7CmZ3SuNcXIHuuKkRRm8TxpDuFddjlDfU
```
Environments: ✅ Production ✅ Preview ✅ Development

---

**3. VITE_CLERK_PUBLISHABLE_KEY**
```
pk_test_d2FudGVkLWx5bngtNy5jbGVyay5hY2NvdW50cy5kZXYk
```
Environments: ✅ Production ✅ Preview ✅ Development

---

**4. VITE_API_MODE**
```
supabase
```
Environments: ✅ Production ✅ Preview ✅ Development

---

## Step-by-Step:

1. **Open Vercel Dashboard**
   - Go to: https://vercel.com/dashboard
   - Click on your "kharch-baant" project

2. **Navigate to Environment Variables**
   - Click "Settings" tab at the top
   - Click "Environment Variables" in the left sidebar

3. **Add Each Variable**
   - Click "Add New" button
   - Copy-paste the Name and Value from above
   - Select all three environments (Production, Preview, Development)
   - Click "Save"
   - Repeat for all 4 variables

4. **Redeploy**
   - Go to "Deployments" tab
   - Find the latest deployment
   - Click the three dots (•••) menu
   - Click "Redeploy"
   - ✅ Click "Redeploy" in the confirmation dialog

5. **Wait for Build**
   - Build will take 2-3 minutes
   - You'll see a success message when done

6. **Test Your App**
   - Visit: https://kharch-baant-phi.vercel.app/
   - You should now see the Clerk login screen!

## Additional Configuration

### Configure Clerk Domain
1. Go to: https://dashboard.clerk.com
2. Select your "wanted-lynx-7" project
3. Click "Configure" → "Domains"
4. Click "Add domain"
5. Enter: `kharch-baant-phi.vercel.app`
6. Save

This allows Clerk authentication to work on your Vercel domain.

## 🎉 Expected Result

After completing these steps:
- ✅ App loads (no more blank screen)
- ✅ Clerk sign-in screen appears
- ✅ Can sign in with your account
- ✅ Dashboard and groups load
- ✅ Invite system works
- ✅ PWA features work

---

**Follow these exact steps and your Vercel app will work perfectly!** 🚀

**Time to complete**: ~5 minutes