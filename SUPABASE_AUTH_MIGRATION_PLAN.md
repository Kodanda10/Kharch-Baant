# Supabase Auth Migration Plan

## 🎯 Goal
Replace Clerk authentication with Supabase Auth to simplify deployment, reduce dependencies, and consolidate authentication with the existing database backend.

---

## 📋 Current State Analysis

### What Uses Clerk Currently:
1. **Authentication Provider** (`contexts/ClerkAuthProvider.tsx`)
2. **User Hooks** (`useUser()` from `@clerk/clerk-react`)
3. **Auth Components**:
   - `SignedIn` / `SignedOut`
   - `SignInButton`
   - `UserButton`
4. **User Sync Logic** (`services/apiService.ts` → `ensureUserExists()`)
5. **Invite Flow** (checks for authenticated user before accepting invites)

### What Already Works with Supabase:
- ✅ All data storage (groups, transactions, people, payment sources)
- ✅ `people` table with user records
- ✅ Database queries and mutations
- ✅ Email service integration (MailerSend)
- ✅ Invite system (group invitations)

---

## 🏗️ Migration Steps

### **Phase 1: Setup Supabase Auth (No Code Changes Yet)**

#### 1.1 Enable Supabase Auth
- [ ] Go to Supabase Dashboard → Authentication → Settings
- [ ] Enable Email provider (already enabled by default)
- [ ] Configure email templates (optional - customize welcome/reset emails)
- [ ] Enable desired OAuth providers (Google, GitHub, etc.) - optional

#### 1.2 Create Auth Schema Migration
- [ ] Run SQL to add `auth_user_id` column to `people` table
- [ ] Add index for performance
- [ ] Create RLS policies to secure data by auth user

**SQL Migration:**
```sql
-- Add auth_user_id to people table
ALTER TABLE people 
ADD COLUMN auth_user_id UUID REFERENCES auth.users(id);

-- Add index for lookups
CREATE INDEX idx_people_auth_user_id ON people(auth_user_id);

-- Update RLS policies (examples)
ALTER TABLE people ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own person record"
ON people FOR SELECT
USING (auth.uid() = auth_user_id);

CREATE POLICY "Users can update their own person record"
ON people FOR UPDATE
USING (auth.uid() = auth_user_id);

-- Groups: Users can view groups they're members of
CREATE POLICY "Users can view their groups"
ON groups FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM people 
    WHERE people.id = ANY(groups.members) 
    AND people.auth_user_id = auth.uid()
  )
);

-- Transactions: Users can view transactions in their groups
CREATE POLICY "Users can view their transactions"
ON transactions FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM groups
    WHERE groups.id = transactions.group_id
    AND EXISTS (
      SELECT 1 FROM people
      WHERE people.id = ANY(groups.members)
      AND people.auth_user_id = auth.uid()
    )
  )
);

-- Payment sources: Users can only see their own
CREATE POLICY "Users can view their payment sources"
ON payment_sources FOR SELECT
USING (
  user_id IN (
    SELECT id FROM people WHERE auth_user_id = auth.uid()
  )
);
```

---

### **Phase 2: Create Supabase Auth Components**

#### 2.1 Create Auth Context
**File:** `contexts/SupabaseAuthContext.tsx`

```typescript
import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signUp: (email: string, password: string, fullName: string) => Promise<{ error?: string }>;
  signIn: (email: string, password: string) => Promise<{ error?: string }>;
  signOut: () => Promise<void>;
  signInWithOAuth: (provider: 'google' | 'github') => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const SupabaseAuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signUp = async (email: string, password: string, fullName: string) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
        },
      },
    });

    if (error) return { error: error.message };
    return { error: undefined };
  };

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) return { error: error.message };
    return { error: undefined };
  };

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  const signInWithOAuth = async (provider: 'google' | 'github') => {
    await supabase.auth.signInWithOAuth({
      provider,
      options: {
        redirectTo: window.location.origin,
      },
    });
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        loading,
        signUp,
        signIn,
        signOut,
        signInWithOAuth,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within a SupabaseAuthProvider');
  }
  return context;
};
```

#### 2.2 Create Auth UI Components

**File:** `components/auth/SignInForm.tsx`

```typescript
import React, { useState } from 'react';
import { useAuth } from '../../contexts/SupabaseAuthContext';

interface SignInFormProps {
  onSwitchToSignUp: () => void;
  onSuccess?: () => void;
}

export const SignInForm: React.FC<SignInFormProps> = ({ onSwitchToSignUp, onSuccess }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { signIn, signInWithOAuth } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const result = await signIn(email, password);
    
    if (result.error) {
      setError(result.error);
      setLoading(false);
    } else {
      onSuccess?.();
    }
  };

  const handleOAuthSignIn = async (provider: 'google' | 'github') => {
    setError('');
    setLoading(true);
    try {
      await signInWithOAuth(provider);
    } catch (err: any) {
      setError(err.message || 'Failed to sign in');
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md mx-auto">
      <h2 className="text-2xl font-bold text-white mb-6 text-center">Sign In</h2>
      
      {error && (
        <div className="bg-red-500/10 border border-red-500 text-red-500 px-4 py-3 rounded-lg mb-4">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="email" className="block text-sm font-medium text-slate-300 mb-2">
            Email
          </label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="w-full px-4 py-3 bg-white/5 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="you@example.com"
            disabled={loading}
          />
        </div>

        <div>
          <label htmlFor="password" className="block text-sm font-medium text-slate-300 mb-2">
            Password
          </label>
          <input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            className="w-full px-4 py-3 bg-white/5 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="••••••••"
            disabled={loading}
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-600/50 text-white font-medium py-3 px-6 rounded-lg transition-colors"
        >
          {loading ? 'Signing in...' : 'Sign In'}
        </button>
      </form>

      <div className="mt-6">
        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-slate-700"></div>
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="px-2 bg-slate-900 text-slate-400">Or continue with</span>
          </div>
        </div>

        <div className="mt-6 grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={() => handleOAuthSignIn('google')}
            disabled={loading}
            className="flex items-center justify-center gap-2 px-4 py-3 bg-white/5 hover:bg-white/10 border border-slate-700 rounded-lg text-white transition-colors"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            Google
          </button>

          <button
            type="button"
            onClick={() => handleOAuthSignIn('github')}
            disabled={loading}
            className="flex items-center justify-center gap-2 px-4 py-3 bg-white/5 hover:bg-white/10 border border-slate-700 rounded-lg text-white transition-colors"
          >
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
            </svg>
            GitHub
          </button>
        </div>
      </div>

      <p className="mt-6 text-center text-sm text-slate-400">
        Don't have an account?{' '}
        <button
          onClick={onSwitchToSignUp}
          className="text-blue-400 hover:text-blue-300 font-medium"
        >
          Sign up
        </button>
      </p>
    </div>
  );
};
```

**File:** `components/auth/SignUpForm.tsx`

```typescript
import React, { useState } from 'react';
import { useAuth } from '../../contexts/SupabaseAuthContext';

interface SignUpFormProps {
  onSwitchToSignIn: () => void;
  onSuccess?: () => void;
}

export const SignUpForm: React.FC<SignUpFormProps> = ({ onSwitchToSignIn, onSuccess }) => {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { signUp } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    setLoading(true);
    const result = await signUp(email, password, fullName);

    if (result.error) {
      setError(result.error);
      setLoading(false);
    } else {
      onSuccess?.();
    }
  };

  return (
    <div className="w-full max-w-md mx-auto">
      <h2 className="text-2xl font-bold text-white mb-6 text-center">Create Account</h2>

      {error && (
        <div className="bg-red-500/10 border border-red-500 text-red-500 px-4 py-3 rounded-lg mb-4">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="fullName" className="block text-sm font-medium text-slate-300 mb-2">
            Full Name
          </label>
          <input
            id="fullName"
            type="text"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            required
            className="w-full px-4 py-3 bg-white/5 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="John Doe"
            disabled={loading}
          />
        </div>

        <div>
          <label htmlFor="email" className="block text-sm font-medium text-slate-300 mb-2">
            Email
          </label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="w-full px-4 py-3 bg-white/5 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="you@example.com"
            disabled={loading}
          />
        </div>

        <div>
          <label htmlFor="password" className="block text-sm font-medium text-slate-300 mb-2">
            Password
          </label>
          <input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={6}
            className="w-full px-4 py-3 bg-white/5 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="••••••••"
            disabled={loading}
          />
        </div>

        <div>
          <label htmlFor="confirmPassword" className="block text-sm font-medium text-slate-300 mb-2">
            Confirm Password
          </label>
          <input
            id="confirmPassword"
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
            className="w-full px-4 py-3 bg-white/5 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="••••••••"
            disabled={loading}
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-green-600 hover:bg-green-700 disabled:bg-green-600/50 text-white font-medium py-3 px-6 rounded-lg transition-colors"
        >
          {loading ? 'Creating account...' : 'Sign Up'}
        </button>
      </form>

      <p className="mt-6 text-center text-sm text-slate-400">
        Already have an account?{' '}
        <button
          onClick={onSwitchToSignIn}
          className="text-blue-400 hover:text-blue-300 font-medium"
        >
          Sign in
        </button>
      </p>
    </div>
  );
};
```

**File:** `components/auth/AuthModal.tsx`

```typescript
import React, { useState } from 'react';
import { SignInForm } from './SignInForm';
import { SignUpForm } from './SignUpForm';

interface AuthModalProps {
  isOpen: boolean;
  defaultMode?: 'signin' | 'signup';
  onClose: () => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({ isOpen, defaultMode = 'signin', onClose }) => {
  const [mode, setMode] = useState<'signin' | 'signup'>(defaultMode);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-slate-900 rounded-2xl shadow-xl border border-slate-800 p-8 max-w-md w-full max-h-[90vh] overflow-y-auto">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-white"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        {mode === 'signin' ? (
          <SignInForm
            onSwitchToSignUp={() => setMode('signup')}
            onSuccess={onClose}
          />
        ) : (
          <SignUpForm
            onSwitchToSignIn={() => setMode('signin')}
            onSuccess={onClose}
          />
        )}
      </div>
    </div>
  );
};
```

**File:** `components/auth/UserMenu.tsx`

```typescript
import React, { useState } from 'react';
import { useAuth } from '../../contexts/SupabaseAuthContext';

export const UserMenu: React.FC = () => {
  const { user, signOut } = useAuth();
  const [isOpen, setIsOpen] = useState(false);

  if (!user) return null;

  const displayName = user.user_metadata?.full_name || user.email?.split('@')[0] || 'User';
  const initials = displayName
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center text-white font-medium hover:bg-blue-700 transition-colors"
      >
        {initials}
      </button>

      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-10"
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute right-0 mt-2 w-64 bg-slate-800 rounded-lg shadow-lg border border-slate-700 py-2 z-20">
            <div className="px-4 py-3 border-b border-slate-700">
              <p className="text-sm font-medium text-white">{displayName}</p>
              <p className="text-xs text-slate-400 truncate">{user.email}</p>
            </div>

            <button
              onClick={() => {
                signOut();
                setIsOpen(false);
              }}
              className="w-full px-4 py-2 text-left text-sm text-slate-300 hover:bg-slate-700 hover:text-white transition-colors"
            >
              Sign Out
            </button>
          </div>
        </>
      )}
    </div>
  );
};
```

---

### **Phase 3: Update Core App Files**

#### 3.1 Update `index.tsx`
Replace `ClerkAuthProvider` with `SupabaseAuthProvider`:

```typescript
import React from 'react';
import './index.css';
import ReactDOM from 'react-dom/client';
import AppWithAuth from './App';
import { SupabaseAuthProvider } from './contexts/SupabaseAuthContext';

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <SupabaseAuthProvider>
      <AppWithAuth />
    </SupabaseAuthProvider>
  </React.StrictMode>
);
```

#### 3.2 Update `App.tsx`
Replace Clerk hooks and components:

**Before (Clerk):**
```typescript
import { useUser, SignedIn, SignedOut, SignInButton, UserButton } from '@clerk/clerk-react';

const App: React.FC = () => {
  const { user } = useUser();
  const currentUser = user;
  // ...
}

const AppWithAuth: React.FC = () => {
  return (
    <>
      <SignedOut>
        {/* Sign in screen */}
      </SignedOut>
      <SignedIn>
        <App />
      </SignedIn>
    </>
  );
};
```

**After (Supabase):**
```typescript
import { useAuth } from './contexts/SupabaseAuthContext';
import { UserMenu } from './components/auth/UserMenu';
import { AuthModal } from './components/auth/AuthModal';

const App: React.FC = () => {
  const { user } = useAuth();
  const currentUser = user;
  // ... rest stays the same
  
  // Replace UserButton with UserMenu
  return (
    <div className="flex items-center gap-2">
      <UserMenu />
      <button onClick={() => setIsSettingsModalOpen(true)}>
        <SettingsIcon />
      </button>
    </div>
  );
}

const AppWithAuth: React.FC = () => {
  const { user, loading } = useAuth();
  const [showAuthModal, setShowAuthModal] = useState(false);
  
  if (loading) {
    return <div className="h-screen flex items-center justify-center">Loading...</div>;
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center p-4">
        {/* Sign in screen with button to open modal */}
        <button onClick={() => setShowAuthModal(true)}>
          Sign In to Continue
        </button>
        <AuthModal isOpen={showAuthModal} onClose={() => setShowAuthModal(false)} />
      </div>
    );
  }

  return <App />;
};
```

#### 3.3 Update `services/apiService.ts`
Update `ensureUserExists()` to use Supabase auth ID:

**Before:**
```typescript
export async function ensureUserExists(
  clerkUserId: string,
  name: string,
  email: string
): Promise<Person> {
  // Uses clerk_user_id
}
```

**After:**
```typescript
export async function ensureUserExists(
  authUserId: string,
  name: string,
  email: string
): Promise<Person> {
  // Check if person exists with this auth_user_id
  const { data: existingPeople, error: fetchError } = await supabase
    .from('people')
    .select('*')
    .eq('auth_user_id', authUserId);

  if (fetchError) throw fetchError;

  if (existingPeople && existingPeople.length > 0) {
    return existingPeople[0] as Person;
  }

  // Create new person
  const newPerson: Omit<Person, 'id'> = {
    name,
    email,
    auth_user_id: authUserId,
  };

  const { data, error: insertError } = await supabase
    .from('people')
    .insert([newPerson])
    .select()
    .single();

  if (insertError) throw insertError;
  return data as Person;
}
```

#### 3.4 Update `types.ts`
Update Person type:

```typescript
export interface Person {
  id: string;
  name: string;
  email?: string;
  auth_user_id?: string; // Replace clerk_user_id
}
```

---

### **Phase 4: Remove Clerk Dependencies**

#### 4.1 Uninstall Clerk Package
```bash
npm uninstall @clerk/clerk-react
```

#### 4.2 Delete Clerk Files
```bash
rm contexts/ClerkAuthProvider.tsx
rm components/auth/ClerkDebugComponent.tsx # if exists
```

#### 4.3 Remove Clerk Environment Variables
- Remove from `.env.local`: `VITE_CLERK_PUBLISHABLE_KEY`
- Remove from Vercel dashboard: `VITE_CLERK_PUBLISHABLE_KEY`
- Remove from `vite.config.ts` define section (line 159)

#### 4.4 Update Documentation
Remove Clerk references from:
- `README.md`
- `DEPLOYMENT_GUIDE.md`
- Any setup documentation

---

### **Phase 5: Testing Checklist**

#### Local Testing
- [ ] Sign up with email/password
- [ ] Sign in with email/password
- [ ] Sign in with Google OAuth (if enabled)
- [ ] Sign in with GitHub OAuth (if enabled)
- [ ] Sign out
- [ ] Create a group as new user
- [ ] Accept invite as new user
- [ ] Add transactions
- [ ] Verify data isolation (can't see other users' data)
- [ ] Check that welcome email is sent

#### Vercel Deployment Testing
- [ ] Build succeeds without Clerk env var
- [ ] Sign in works on production
- [ ] OAuth redirects work correctly
- [ ] Invite links work after auth
- [ ] Data loads correctly for authenticated users

---

## 📊 Migration Effort Estimate

| Phase | Effort | Risk Level |
|-------|--------|------------|
| Phase 1: Supabase Auth Setup | 1 hour | Low |
| Phase 2: Create Auth Components | 2-3 hours | Low |
| Phase 3: Update Core App | 2 hours | Medium |
| Phase 4: Remove Clerk | 30 minutes | Low |
| Phase 5: Testing | 2 hours | Medium |
| **Total** | **~8 hours** | **Low-Medium** |

---

## 🎁 Benefits After Migration

1. ✅ **Simpler Deployment** - No Clerk keys needed in Vercel
2. ✅ **Cost Savings** - No Clerk subscription (Supabase free tier is generous)
3. ✅ **Single Source of Truth** - All data + auth in Supabase
4. ✅ **Better RLS** - Native integration with Supabase Row Level Security
5. ✅ **More Control** - Full customization of auth UI and flows
6. ✅ **Fewer Dependencies** - One less external service

---

## 🚀 Ready to Start?

When you're ready to proceed, I can:
1. ✅ Run the SQL migration to add `auth_user_id` column
2. ✅ Create all auth components
3. ✅ Update App.tsx and related files
4. ✅ Remove Clerk completely
5. ✅ Test locally and deploy

**Shall I start with Phase 1?** 🎯

