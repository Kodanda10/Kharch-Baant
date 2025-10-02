# Supabase Backend Setup Guide

This guide will help you set up Supabase as the backend for Kharch-Baant.

## Prerequisites

1. Create a free Supabase account at [supabase.com](https://supabase.com)
2. Create a new project in your Supabase dashboard

## Step 1: Set up the Database Schema

1. Go to your Supabase project dashboard
2. Navigate to the **SQL Editor** in the left sidebar
3. Copy the entire content of `supabase-schema.sql` from this project
4. Paste it into the SQL Editor and run the script
5. This will create all necessary tables, indexes, and sample data

## Step 2: Get Your Project Credentials

1. In your Supabase dashboard, go to **Settings** → **API**
2. Copy the following values:
   - **Project URL** (looks like: `https://your-project-id.supabase.co`)
   - **Anon public** key (the `anon` key, not the `service_role` key)

## Step 3: Configure Environment Variables

1. Copy `.env.example` to `.env.local`:
   ```bash
   cp .env.example .env.local
   ```

2. Fill in your Supabase credentials in `.env.local`:
   ```env
   REACT_APP_SUPABASE_URL=https://your-project-id.supabase.co
   REACT_APP_SUPABASE_ANON_KEY=your_anon_key_here
   REACT_APP_API_MODE=supabase
   GEMINI_API_KEY=your_gemini_api_key_here
   ```

## Step 4: Test the Integration

1. Make sure you have the dependencies installed:
   ```bash
   npm install
   ```

2. Start the development server:
   ```bash
   npm run dev
   ```

3. The app should now be using Supabase as the backend!

## Switching Between Mock and Supabase

You can easily switch between the mock API and Supabase by changing the `REACT_APP_API_MODE` in your `.env.local`:

- `REACT_APP_API_MODE=mock` - Uses the in-memory mock data
- `REACT_APP_API_MODE=supabase` - Uses Supabase backend

## Database Tables Created

The schema creates the following tables:

- **people** - User profiles with names and avatars
- **groups** - Expense groups with names and currencies
- **group_members** - Junction table linking people to groups
- **transactions** - All expense transactions with detailed split information
- **payment_sources** - Payment methods (cards, UPI, cash, etc.)

## Row Level Security (RLS)

The schema includes RLS policies that currently allow all operations. In a production environment, you should:

1. Set up proper authentication with Supabase Auth
2. Create restrictive RLS policies based on user authentication
3. Remove the "Allow all operations" policies

## Real-time Features (Future Enhancement)

Supabase supports real-time subscriptions. You can extend the app to:

- Show live updates when group members add expenses
- Real-time balance updates
- Live notifications for new transactions

Example real-time subscription:
```typescript
supabase
  .channel('transactions')
  .on('postgres_changes', {
    event: 'INSERT',
    schema: 'public',
    table: 'transactions'
  }, (payload) => {
    console.log('New transaction!', payload);
  })
  .subscribe();
```

## Troubleshooting

### Common Issues:

1. **"Invalid API key"** - Check that your SUPABASE_ANON_KEY is correct
2. **"Network error"** - Verify your SUPABASE_URL is correct
3. **"Row Level Security policy violation"** - Make sure RLS policies are set up correctly
4. **"Table doesn't exist"** - Ensure you've run the schema script in Supabase SQL Editor

### Checking API Mode:

Add this to any component to verify which API mode is active:
```typescript
console.log('Current API mode:', process.env.REACT_APP_API_MODE);
```

## Performance Considerations

- Supabase automatically handles connection pooling
- Indexes are created for optimal query performance
- Consider implementing pagination for large datasets
- Use Supabase's built-in caching for better performance

## Security Best Practices

1. Never commit your `.env.local` file to version control
2. Use environment-specific API keys
3. Implement proper RLS policies for production
4. Consider using Supabase Auth for user management
5. Validate all inputs on both client and server side

## Next Steps

Once you have the basic setup working, consider:

1. Adding user authentication
2. Implementing real-time features
3. Adding data validation triggers
4. Setting up backup and recovery
5. Monitoring with Supabase's built-in analytics