<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# Kharch-Baant - Shared Expense Tracker

An elegant web application to manage and track shared expenses among friends. Features a summary dashboard, transaction management, filtering, AI-powered expense categorization, and the ability to share expense summaries.

View your app in AI Studio: https://ai.studio/apps/drive/17MEhBNlszqSmbTAXpvoADC2WSNUXSTu2

## Features

- 🏠 **Dashboard Overview** - See all your groups and overall financial summary
- 👥 **Group Management** - Create and manage expense groups with multiple members
- 💰 **Smart Expense Tracking** - Add transactions with multiple split modes (equal, unequal, percentage, shares)
- 🧠 **AI-Powered Categorization** - Automatic expense category suggestions using Google Gemini AI
- 🎯 **Advanced Filtering** - Filter by category, date range, and search through descriptions
- 📊 **Real-time Balance Calculation** - See who owes what instantly
- 💳 **Payment Source Tracking** - Track different payment methods (cards, UPI, cash)
- 📱 **Responsive Design** - Works perfectly on mobile and desktop
- 🎨 **Modern UI** - Beautiful glassmorphic design with dark theme
- 📤 **Share Functionality** - Generate and share expense summaries as images

## Backend Options

The app supports two backend modes:

### 1. Mock API (Default)
- Uses in-memory data storage
- Perfect for development and testing
- No external dependencies

### 2. Supabase Backend
- PostgreSQL database with real-time capabilities
- Production-ready with proper data persistence
- Easy to set up and manage

## Quick Start

**Prerequisites:** Node.js (16 or higher)

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Set up environment variables:**
   ```bash
   cp .env.example .env.local
   ```
   
   Fill in your API keys in `.env.local`:
   ```env
   # For AI features
   GEMINI_API_KEY=your_gemini_api_key_here
   
   # API Mode: 'mock' or 'supabase'
   REACT_APP_API_MODE=mock
   
   # If using Supabase (optional)
   REACT_APP_SUPABASE_URL=your_supabase_url
   REACT_APP_SUPABASE_ANON_KEY=your_supabase_anon_key
   ```

3. **Run the app:**
   ```bash
   npm run dev
   ```

The app will be available at `http://localhost:3000`

## Supabase Setup (Optional)

For persistent data storage, follow the [Supabase Setup Guide](./SUPABASE_SETUP.md).

Quick setup:
1. Create a Supabase project
2. Run the SQL schema from `supabase-schema.sql`
3. Update your `.env.local` with Supabase credentials
4. Set `REACT_APP_API_MODE=supabase`

## API Architecture

The app uses a smart API routing system that allows seamless switching between mock and real backends:

```typescript
// The same interface works for both mock and Supabase
const groups = await api.getGroups();
const newTransaction = await api.addTransaction(groupId, transactionData);
```

**Benefits:**
- Zero UI changes needed when switching backends
- Easy development with mock data
- Production-ready with Supabase
- Type-safe with TypeScript

## Tech Stack

- **Frontend:** React 19, TypeScript, Vite
- **Styling:** Tailwind CSS (via CDN)
- **Backend:** Supabase (PostgreSQL) or Mock API
- **AI:** Google Gemini AI for expense categorization
- **Icons:** Custom SVG icon set
- **Images:** HTML2Canvas for sharing functionality

## Development

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test with both mock and Supabase modes
5. Submit a pull request

## License

MIT License - see LICENSE file for details
