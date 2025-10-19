import React from 'react';
import { ClerkProvider } from '@clerk/clerk-react';

const clerkPubKey = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;

if (!clerkPubKey) {
  throw new Error('Missing Clerk Publishable Key');
}

interface ClerkAuthProviderProps {
  children: React.ReactNode;
}

export const ClerkAuthProvider: React.FC<ClerkAuthProviderProps> = ({ children }) => {
  return (
    <ClerkProvider 
      publishableKey={clerkPubKey}
      signInUrl="/sign-in"
      signUpUrl="/sign-up"
    >
      {children}
    </ClerkProvider>
  );
};