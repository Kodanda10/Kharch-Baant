# 🧪 Invite System Testing Guide

## 🎯 Testing the Enhanced Invite System

Your dev server is running at:
- **Local**: http://localhost:3000/
- **Network**: http://192.168.1.13:3000/ (for mobile testing)

## 📋 Step-by-Step Testing

### Test 1: Create an Invite Link

1. **Sign in** to the app
2. **Create or select a group**
3. Click the **"Invite"** button (should appear after group is saved)
4. You should see the **Share Modal** with:
   - ✅ WhatsApp button (green)
   - ✅ SMS button (blue)
   - ✅ Copy Link button (indigo)
   - ✅ More Options button (gray)
   - ✅ Link preview with expiration notice

### Test 2: WhatsApp Sharing

1. Click **"Share via WhatsApp"**
2. WhatsApp Web should open with pre-filled message:
   ```
   🎉 You're invited to join "[Group Name]" on Kharch Baant!
   
   Track and split expenses together easily. Click the link below to join:
   
   http://localhost:3000/invite/TOKEN
   
   ✨ New users can sign up instantly!
   ⏰ Link expires in 30 days
   ```
3. ✅ Verify the message format looks good
4. ✅ Verify the link is clickable

### Test 3: SMS Sharing (Mobile Only)

1. Open app on Android: `http://192.168.1.13:3000/`
2. Create/select a group
3. Click **"Invite"** → **"Share via SMS"**
4. SMS app should open with pre-filled message
5. ✅ Verify message is properly formatted

### Test 4: Copy Link

1. Click **"Copy Link"**
2. You should see alert: "Invite message copied to clipboard!"
3. Paste in a text editor
4. ✅ Verify full message is copied
5. ✅ Verify invite link is included

### Test 5: Native Share (Mobile Only)

1. Open app on mobile device
2. Click **"Invite"** → **"More Options"**
3. Native share sheet should appear
4. ✅ Options include: WhatsApp, SMS, Email, etc.
5. ✅ Share to any app successfully

### Test 6: Unauthenticated Invite Click

1. **Sign out** of the app (or open in incognito)
2. Paste an invite link in browser:
   ```
   http://localhost:3000/invite/TOKEN
   ```
3. You should see **custom invite welcome screen**:
   - 👥 User icon with blue background
   - "You're Invited!" heading
   - Group name: 'Join "[Group Name]"'
   - Two buttons: "Sign In to Join Group" and "Create Account & Join"
   - Notice: "After signing in, you'll automatically join the group"

### Test 7: New User Sign Up Flow

1. From invite welcome screen, click **"Create Account & Join"**
2. Clerk sign-up modal should appear
3. Create a new account (use different email)
4. After successful sign-up:
   - ✅ You should see success message: "Successfully joined group '[Group Name]'!"
   - ✅ Page should reload
   - ✅ New group should appear in your groups list
   - ✅ Invite URL should be cleared from address bar

### Test 8: Existing User Sign In Flow

1. From invite welcome screen, click **"Sign In to Join Group"**
2. Clerk sign-in modal should appear
3. Sign in with existing credentials
4. After successful sign-in:
   - ✅ You should see success message: "Successfully joined group '[Group Name]'!"
   - ✅ Page should reload
   - ✅ Group should appear in your groups list
   - ✅ URL should be cleared

### Test 9: Already Authenticated User

1. While **signed in**, paste an invite link in address bar:
   ```
   http://localhost:3000/invite/TOKEN
   ```
2. App should:
   - ✅ Automatically validate the invite
   - ✅ Show success message if valid
   - ✅ Add you to the group
   - ✅ Refresh the page
   - ✅ Clear the invite URL

### Test 10: Invalid/Expired Invite

1. Use an invalid token:
   ```
   http://localhost:3000/invite/INVALID_TOKEN_12345
   ```
2. You should see:
   - ✅ Error alert: "Invite link is invalid: [reason]"
   - ✅ URL cleared from address bar
   - ✅ Redirected to home screen

### Test 11: Multi-Channel Share Test

**Test WhatsApp on Desktop:**
```bash
# Copy invite URL
http://localhost:3000/invite/YOUR_TOKEN

# Open WhatsApp Web
# Paste message in a chat
# Verify link is clickable and formatted correctly
```

**Test SMS on Android:**
```bash
# Open app on Android: http://192.168.1.13:3000/
# Use "Share via SMS"
# Send to yourself or test number
# Click the link in SMS
# Verify invite welcome screen appears
```

**Test Email Share:**
```bash
# Copy link using "Copy Link" button
# Paste in email client
# Send to test email
# Click link in email
# Verify redirect works correctly
```

## 🎨 Visual Checklist

### Share Modal UI
- [ ] Modal opens smoothly
- [ ] Buttons have correct colors (green, blue, indigo, gray)
- [ ] Icons display correctly
- [ ] Link preview is readable
- [ ] Expiration notice is visible
- [ ] Close button works

### Invite Welcome Screen (Unauthenticated)
- [ ] Purple gradient background
- [ ] Blue user icon circle
- [ ] "You're Invited!" heading visible
- [ ] Group name displays correctly
- [ ] Both buttons visible and styled
- [ ] Explanatory text is clear
- [ ] Responsive on mobile

### Success Flow
- [ ] Success alert appears
- [ ] Group appears in list
- [ ] Data refreshes automatically
- [ ] URL clears properly
- [ ] No console errors

## 🐛 Common Issues & Solutions

### Issue: WhatsApp doesn't open
**Solution**: Make sure WhatsApp Web is accessible. Try:
```javascript
// Manual test in console
window.open('https://wa.me/?text=Test', '_blank');
```

### Issue: SMS doesn't work on desktop
**Expected**: SMS protocol only works on mobile devices with SMS capability

### Issue: Invite link doesn't auto-join
**Check**:
1. Are you signed in?
2. Is the invite token valid?
3. Check browser console for errors
4. Verify `validateInvite` and `acceptInvite` API calls succeed

### Issue: Share modal doesn't appear
**Check**:
1. Is the group saved (has an ID)?
2. Check console for errors
3. Verify `createGroupInvite` API call succeeds

## 📱 Mobile Testing Recommendations

### Android Testing
1. Open Chrome on Android
2. Navigate to: `http://192.168.1.13:3000/`
3. Test all share methods
4. Test "Add to Home Screen" (PWA)
5. Verify invite links work when app is installed

### iOS Testing (Safari)
1. Open Safari on iPhone
2. Navigate to your local IP address
3. Test WhatsApp deep link
4. Test SMS sharing
5. Test native share sheet

## ✅ Success Criteria

Your invite system is working correctly if:

1. ✅ **Creation**: Invite links generate successfully
2. ✅ **Sharing**: All share methods work (WhatsApp, SMS, Copy, Native)
3. ✅ **Authentication**: Unauthenticated users see custom welcome screen
4. ✅ **Sign Up**: New users can create accounts and auto-join
5. ✅ **Sign In**: Existing users can sign in and auto-join
6. ✅ **Auto-Join**: Authenticated users auto-join when clicking links
7. ✅ **Validation**: Invalid/expired links show appropriate errors
8. ✅ **UX**: Smooth flow with clear messaging throughout
9. ✅ **Mobile**: Works seamlessly on Android/iOS devices
10. ✅ **PWA**: Functions correctly when installed as PWA

## 🚀 Next Steps After Testing

Once all tests pass:

1. **Deploy to production** (Vercel/Netlify)
2. **Update environment variables** with production URL
3. **Test on real mobile devices** with production URL
4. **Share with beta testers** to gather feedback
5. **Monitor invite analytics** to track usage

## 📊 Testing Checklist Summary

- [ ] Invite link creation
- [ ] WhatsApp sharing
- [ ] SMS sharing
- [ ] Copy link functionality
- [ ] Native share (mobile)
- [ ] Unauthenticated invite screen
- [ ] New user sign-up + auto-join
- [ ] Existing user sign-in + auto-join
- [ ] Already-authenticated auto-join
- [ ] Invalid/expired link handling
- [ ] Mobile responsive design
- [ ] PWA compatibility
- [ ] Error handling
- [ ] URL clearing after join
- [ ] Data refresh after join

## 🎉 Happy Testing!

Your enhanced invite system with WhatsApp/SMS sharing and Clerk authentication is ready for testing. Follow this guide systematically to ensure everything works perfectly before production deployment!