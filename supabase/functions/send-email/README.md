# Send Email Edge Function

This Supabase Edge Function handles email sending via MailerSend API to avoid CORS issues when sending emails from the browser.

## Environment Variables Required

Set these in your Supabase project:

```bash
MAILERSEND_API_KEY=mlsn.your_api_key_here
MAILERSEND_FROM_EMAIL=noreply@your-domain.com
```

## Deployment

```bash
# Install Supabase CLI
npm install -g supabase

# Login to Supabase
supabase login

# Link to your project
supabase link --project-ref your-project-ref

# Deploy the function
supabase functions deploy send-email
```

## Usage

The function accepts POST requests with the following structure:

```json
{
  "type": "welcome" | "group_invite" | "member_added" | "settle_up" | "new_expense",
  "data": {
    // Type-specific data
  }
}
```

### Welcome Email
```json
{
  "type": "welcome",
  "data": {
    "userName": "John Doe",
    "userEmail": "john@example.com",
    "appUrl": "https://your-app.com"
  }
}
```

### Group Invite Email
```json
{
  "type": "group_invite",
  "data": {
    "inviteeEmail": "friend@example.com",
    "inviterName": "John Doe",
    "groupName": "Trip to Paris",
    "inviteUrl": "https://your-app.com/invite/abc123",
    "expiresInDays": 30
  }
}
```

## Testing

You can test the function locally:

```bash
supabase functions serve send-email
```

Then make a POST request to:
```
http://localhost:54321/functions/v1/send-email
```
