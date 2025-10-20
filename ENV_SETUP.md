# Environment Variables Setup

Copy this to create your `.env.local` file:

```env
# Clerk Authentication
VITE_CLERK_PUBLISHABLE_KEY=pk_test_your_clerk_publishable_key_here

# Supabase Configuration
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key_here

# API Mode (always 'supabase' for production)
VITE_API_MODE=supabase

# Google Gemini AI (Optional - for expense category suggestions)
VITE_GEMINI_API_KEY=your_gemini_api_key_here

# App URL (for invite links and email redirects)
VITE_APP_URL=http://localhost:3000

# MailerSend Configuration (for email notifications)
VITE_MAILERSEND_API_KEY=your_mailersend_api_key_here
VITE_MAILERSEND_FROM_EMAIL=noreply@your-verified-domain.com

# MailerSend Template IDs (optional - will use default HTML if not provided)
VITE_MAILERSEND_TEMPLATE_WELCOME=
VITE_MAILERSEND_TEMPLATE_GROUP_INVITE=
VITE_MAILERSEND_TEMPLATE_MEMBER_ADDED=
VITE_MAILERSEND_TEMPLATE_SETTLE_UP=
VITE_MAILERSEND_TEMPLATE_NEW_EXPENSE=
```

## How to Get These Values

### MailerSend API Key
1. Go to [MailerSend](https://www.mailersend.com/)
2. Sign up for free account (12,000 emails/month free)
3. Verify your domain or use their sandbox
4. Go to **Settings** → **API Tokens**
5. Create a new token with "Full Access"
6. Copy the token to `VITE_MAILERSEND_API_KEY`

### From Email Address
1. In MailerSend dashboard, go to **Domains**
2. Either verify your own domain OR use sandbox
3. Use format: `noreply@your-domain.com` (if verified)
4. Or use: `your-identifier@trial-xxxxx.mlsender.net` (sandbox)

### Email Templates (Optional)
The app includes beautiful default HTML templates, so you don't need to create templates in MailerSend dashboard unless you want custom designs.

If you want to use MailerSend's template editor:
1. Go to **Email** → **Templates** in MailerSend dashboard
2. Create templates for each notification type
3. Copy template IDs to the env vars above

