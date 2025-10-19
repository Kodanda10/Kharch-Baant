# 📊 Invite System Flow Diagram

```
┌─────────────────────────────────────────────────────────────────────────┐
│                         INVITE SYSTEM FLOW                               │
└─────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────┐
│ STEP 1: CREATE INVITE                                                    │
└─────────────────────────────────────────────────────────────────────────┘

    User (Authenticated)
           |
           v
    Click "Invite" Button
           |
           v
    createGroupInvite()
           |
           v
    ┌──────────────────────┐
    │ Generate Token       │
    │ - 32 char random     │
    │ - 30 day expiry      │
    │ - Store in DB        │
    └──────────────────────┘
           |
           v
    Share Modal Opens
           |
           v
    ┌─────────────────────────────────────────────┐
    │  📱 WhatsApp  |  💬 SMS  |  📋 Copy  |  📤 Share  │
    └─────────────────────────────────────────────┘


┌─────────────────────────────────────────────────────────────────────────┐
│ STEP 2: SHARE INVITE                                                     │
└─────────────────────────────────────────────────────────────────────────┘

    User Clicks Share Option
           |
           ├──────────┬──────────┬──────────┬──────────┐
           v          v          v          v          v
      WhatsApp      SMS       Copy      Native    Email
           |          |          |          |          |
           v          v          v          v          v
    wa.me://     sms://    Clipboard  Share API   Manual
           |          |          |          |          |
           └──────────┴──────────┴──────────┴──────────┘
                              |
                              v
              Recipient receives invite link:
              http://localhost:3000/invite/TOKEN


┌─────────────────────────────────────────────────────────────────────────┐
│ STEP 3A: UNAUTHENTICATED USER CLICKS LINK                               │
└─────────────────────────────────────────────────────────────────────────┘

    Click Invite Link
           |
           v
    App detects /invite/TOKEN
           |
           v
    Check Authentication
           |
           v
    ❌ Not Signed In
           |
           v
    validateInvite(token)
           |
           v
    ┌──────────────────────────────┐
    │  Invite Welcome Screen       │
    │  ┌────────────────────────┐  │
    │  │  👥 You're Invited!    │  │
    │  │  Join "Group Name"     │  │
    │  │                        │  │
    │  │  [Sign In to Join]     │  │
    │  │  [Create Account]      │  │
    │  └────────────────────────┘  │
    └──────────────────────────────┘
           |
           ├──────────────────┬──────────────────┐
           v                  v                  v
    [Sign In]         [Create Account]     [Close]
           |                  |                  |
           v                  v                  v
    Clerk Sign In     Clerk Sign Up        Home
           |                  |
           └──────────┬───────┘
                      v
              Authentication Success
                      |
                      v
              Continue to STEP 4


┌─────────────────────────────────────────────────────────────────────────┐
│ STEP 3B: AUTHENTICATED USER CLICKS LINK                                 │
└─────────────────────────────────────────────────────────────────────────┘

    Click Invite Link
           |
           v
    App detects /invite/TOKEN
           |
           v
    Check Authentication
           |
           v
    ✅ Already Signed In
           |
           v
    Continue to STEP 4


┌─────────────────────────────────────────────────────────────────────────┐
│ STEP 4: VALIDATE & JOIN GROUP                                           │
└─────────────────────────────────────────────────────────────────────────┘

    handleInviteAcceptance(token, personId)
           |
           v
    validateInvite(token)
           |
           ├──────────────┬──────────────┐
           v              v              v
        Valid         Expired        Invalid
           |              |              |
           v              v              v
    acceptInvite()   Error Alert    Error Alert
           |              |              |
           v              └──────┬───────┘
    ┌────────────────┐          |
    │ Database:      │          v
    │ - Add member   │    Clear URL → Home
    │ - Log invite   │
    └────────────────┘
           |
           v
    ┌────────────────────────────┐
    │ ✅ Success Alert           │
    │ "Joined [Group Name]!"     │
    └────────────────────────────┘
           |
           v
    window.location.reload()
           |
           v
    ┌────────────────────────────┐
    │ Group appears in list      │
    │ User is now a member       │
    │ Can view transactions      │
    └────────────────────────────┘


┌─────────────────────────────────────────────────────────────────────────┐
│ KEY COMPONENTS                                                           │
└─────────────────────────────────────────────────────────────────────────┘

Frontend:
  - App.tsx: Main app logic, invite detection
  - AppWithAuth: Authentication wrapper, invite welcome screen
  - GroupFormModal: Invite creation, share modal
  
Backend (Supabase):
  - createGroupInvite(): Generate token, store in DB
  - validateInvite(): Check token validity, get group info
  - acceptInvite(): Add user to group, log acceptance
  
Authentication:
  - Clerk: Sign up, sign in, session management
  - SignedIn/SignedOut: Conditional rendering
  - useUser(): Get current user info


┌─────────────────────────────────────────────────────────────────────────┐
│ SECURITY FEATURES                                                        │
└─────────────────────────────────────────────────────────────────────────┘

✅ Secure Token Generation
   - Cryptographically random 32-character tokens
   - URL-safe encoding

✅ Server-Side Validation
   - Token existence check
   - Expiration validation (30 days)
   - Max uses check (unlimited)

✅ Authentication Required
   - Must sign in/up before joining
   - User identity verified by Clerk
   - Prevents anonymous access

✅ Database Logging
   - Track who invited whom
   - Log acceptance timestamps
   - Monitor invite usage


┌─────────────────────────────────────────────────────────────────────────┐
│ ERROR HANDLING                                                           │
└─────────────────────────────────────────────────────────────────────────┘

Invalid Token → "Invite link is invalid"
Expired Token → "Invite link has expired"
Network Error → "Failed to process invite"
Already Member → "Already a member of this group"
Max Uses Reached → "Invite link has been used too many times"


┌─────────────────────────────────────────────────────────────────────────┐
│ MOBILE OPTIMIZATION                                                      │
└─────────────────────────────────────────────────────────────────────────┘

📱 WhatsApp Deep Link
   https://wa.me/?text=ENCODED_MESSAGE

💬 SMS Deep Link
   sms:?body=ENCODED_MESSAGE

📤 Native Share API
   navigator.share({ title, text, url })

🏠 PWA Integration
   - Works when app is installed
   - Handles deep links correctly
   - Smooth transition to app


┌─────────────────────────────────────────────────────────────────────────┐
│ USER EXPERIENCE FLOW                                                     │
└─────────────────────────────────────────────────────────────────────────┘

Time: 30 seconds from click to join

1. Click invite link               (0s)
2. See invite welcome screen       (1s)
3. Click "Create Account"          (2s)
4. Fill in details & submit        (20s)
5. Auto-join group                 (25s)
6. See success & group appears     (30s)

Result: Seamless, intuitive, fast! 🚀
