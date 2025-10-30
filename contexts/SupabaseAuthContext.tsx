import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';
import { ensureUserExists } from '../services/supabaseApiService';
import { Person } from '../types';

interface AuthContextType {
  user: User | null;
  person: Person | null;
  session: Session | null;
  loading: boolean;
  isSyncing: boolean;
  signUp: (email: string, password: string, fullName: string) => Promise<{ error?: string }>;
  signIn: (email: string, password: string) => Promise<{ error?: string }>;
  signOut: () => Promise<void>;
  signInWithOAuth: (provider: 'google' | 'github') => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const SupabaseAuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [person, setPerson] = useState<Person | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [isSyncing, setIsSyncing] = useState(true);

  useEffect(() => {
    const initializeAuth = async () => {
      // Get initial session
      const { data: { session } } = await supabase.auth.getSession();
      setSession(session);
      const currentUser = session?.user ?? null;
      setUser(currentUser);
      setLoading(false);

      // Listen for auth changes
      const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
        console.log('Auth state changed:', _event, session?.user?.email);
        const currentUser = session?.user ?? null;
        setSession(session);
        setUser(currentUser);
        setLoading(false);
      });

      return () => subscription.unsubscribe();
    };

    initializeAuth();
  }, []);

  useEffect(() => {
    const syncUser = async () => {
      if (user) {
        setIsSyncing(true);
        try {
          console.log('Syncing user profile for:', user.email);
          const userProfile = await ensureUserExists(
            user.id,
            user.user_metadata.full_name || user.email.split('@')[0],
            user.email
          );
          setPerson(userProfile);
          console.log('✅ User profile synced:', userProfile);
        } catch (error) {
          console.error('Error syncing user profile:', error);
          setPerson(null); // Clear person data on error
        } finally {
          setIsSyncing(false);
        }
      } else {
        // User is logged out, clear person data
        setPerson(null);
        setIsSyncing(false);
      }
    };

    syncUser();
  }, [user]);

  const signUp = async (email: string, password: string, fullName: string) => {
    try {
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
      
      if (data.user && !data.session) {
        return { error: 'Please check your email to confirm your account before signing in.' };
      }
      
      return { error: undefined };
    } catch (err: any) {
      return { error: err.message || 'Failed to sign up' };
    }
  };

  const signIn = async (email: string, password: string) => {
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) return { error: error.message };
      return { error: undefined };
    } catch (err: any) {
      return { error: err.message || 'Failed to sign in' };
    }
  };

  const signOut = async () => {
    try {
      await supabase.auth.signOut();
      setPerson(null); // Clear person data on sign out
    } catch (err) {
      console.error('Sign out error:', err);
    }
  };

  const signInWithOAuth = async (provider: 'google' | 'github') => {
    try {
      await supabase.auth.signInWithOAuth({
        provider,
        options: {
          redirectTo: window.location.origin,
        },
      });
    } catch (err) {
      console.error('OAuth sign in error:', err);
      throw err;
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        person,
        session,
        loading,
        isSyncing,
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

