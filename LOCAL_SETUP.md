# Local Development Setup Guide

This guide will help you run the Kharch-Baant expense tracker app locally with both frontend and backend services.

## Prerequisites

1. **Node.js** (v18 or higher) - [Download here](https://nodejs.org/)
2. **Supabase Account** - [Sign up here](https://supabase.com) (free tier available)
3. **Git** (if cloning the repository)

## Step 1: Install Dependencies

The dependencies are already installed, but if you need to reinstall:

```bash
npm install
```

## Step 2: Set up Supabase Backend

### 2.1 Create Supabase Project

1. Go to [supabase.com](https://supabase.com) and sign in
2. Click "New Project"
3. Choose your organization
4. Enter project details:
   - **Name**: `kharch-baant` (or any name you prefer)
   - **Database Password**: Choose a strong password (save this!)
   - **Region**: Choose the closest to your location
5. Click "Create new project"
6. Wait for the project to be created (2-3 minutes)

### 2.2 Set up Database Schema

1. In your Supabase dashboard, go to **SQL Editor** (left sidebar)
2. Click "New query"
3. Copy the entire content from `supabase-schema.sql` in this project
4. Paste it into the SQL Editor
5. Click "Run" to execute the script
6. You should see "Success. No rows returned" message

### 2.3 Get API Credentials

1. In your Supabase dashboard, go to **Settings** → **API**
2. Copy the following values:
   - **Project URL** (looks like: `https://abcdefghijklmnop.supabase.co`)
   - **Anon public** key (the `anon` key, not the `service_role` key)

## Step 3: Configure Environment Variables

Create a `.env.local` file in the project root with your Supabase credentials:

```bash
# Create the environment file
touch .env.local
```

Add the following content to `.env.local`:

```env
# Supabase Configuration
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=your_anon_key_here

# Alternative naming (for compatibility)
REACT_APP_SUPABASE_URL=https://your-project-id.supabase.co
REACT_APP_SUPABASE_ANON_KEY=your_anon_key_here

# API Mode (supabase for production, mock for testing)
REACT_APP_API_MODE=supabase

# Gemini AI API Key (optional, for AI features)
GEMINI_API_KEY=your_gemini_api_key_here
```

**Replace the placeholder values with your actual Supabase credentials.**

## Step 4: Test the Setup

### 4.1 Test Supabase Connection

Run the smoke test to verify your Supabase connection:

```bash
npm run test:smoke
```

You should see output like:
```
[SMOKE PASS] {
  "ok": true,
  "steps": [
    { "step": "groups.select", "count": 0, "error": null },
    { "step": "people.select", "count": 0, "error": null }
  ]
}
```

### 4.2 Run the Development Server

Start the frontend development server:

```bash
npm run dev
```

The app will be available at:
- **Local**: http://localhost:3000
- **Network**: http://0.0.0.0:3000 (accessible from other devices on your network)

## Step 5: Verify Everything Works

1. **Open your browser** and go to `http://localhost:3000`
2. **Check the console** for any errors
3. **Look for the API status indicator** in the app (should show green/connected)
4. **Try creating a group** to test the full flow

## Troubleshooting

### Common Issues

#### 1. "Supabase credentials are missing" Error
- **Solution**: Make sure your `.env.local` file exists and has the correct variable names
- **Check**: Verify the file is in the project root directory

#### 2. "Invalid API key" Error
- **Solution**: Double-check your `VITE_SUPABASE_ANON_KEY` in `.env.local`
- **Note**: Use the `anon` key, not the `service_role` key

#### 3. "Network error" or Connection Issues
- **Solution**: Verify your `VITE_SUPABASE_URL` is correct
- **Check**: Make sure there are no extra spaces or characters

#### 4. "Table doesn't exist" Error
- **Solution**: Make sure you ran the `supabase-schema.sql` script in Supabase SQL Editor
- **Check**: Go to Supabase dashboard → Table Editor to see if tables exist

#### 5. Port 3000 Already in Use
- **Solution**: Kill the process using port 3000:
  ```bash
  lsof -ti:3000 | xargs kill -9
  ```
- **Alternative**: Change the port in `vite.config.ts`

### Debug Mode

To enable debug logging, add this to your `.env.local`:

```env
VITE_DEBUG=true
```

### Check API Mode

The app will show which API mode is active in the browser console. Look for:
```
Current API mode: supabase
```

## Development Workflow

### Running Tests

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test

# Run tests with UI
npm run test:ui

# Run tests with coverage
npm run test:coverage
```

### Building for Production

```bash
# Build the app
npm run build

# Preview the built app
npm run preview
```

### Database Management

- **View data**: Go to Supabase dashboard → Table Editor
- **Run SQL**: Go to Supabase dashboard → SQL Editor
- **Check logs**: Go to Supabase dashboard → Logs

## Next Steps

Once you have the basic setup working:

1. **Create your first group** in the app
2. **Add some transactions** to test the functionality
3. **Invite other users** (if you have their Supabase user IDs)
4. **Explore the different features** like payment sources, settlements, etc.

## Support

If you encounter issues:

1. Check the browser console for errors
2. Check the terminal where you ran `npm run dev` for errors
3. Verify your Supabase project is active and accessible
4. Make sure all environment variables are set correctly

## Architecture Overview

- **Frontend**: React + TypeScript + Vite
- **Backend**: Supabase (PostgreSQL + Real-time + Auth)
- **Styling**: Tailwind CSS
- **State Management**: React hooks
- **Testing**: Vitest + React Testing Library

The app is a single-page application (SPA) that communicates with Supabase for all data operations.
