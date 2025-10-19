import React from 'react';
import { ClerkProvider } from '@clerk/clerk-react';

const clerkPubKey = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;

interface ClerkAuthProviderProps {
  children: React.ReactNode;
}

export const ClerkAuthProvider: React.FC<ClerkAuthProviderProps> = ({ children }) => {
  // Show error message if Clerk key is missing
  if (!clerkPubKey) {
    return (
      <div style={{ 
        minHeight: '100vh', 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center',
        padding: '20px',
        color: 'white',
        textAlign: 'center'
      }}>
        <div>
          <h1 style={{ fontSize: '24px', marginBottom: '20px', color: '#ef4444' }}>
            ⚠️ Configuration Error
          </h1>
          <p style={{ marginBottom: '10px' }}>
            Missing Clerk Publishable Key
          </p>
          <p style={{ fontSize: '14px', opacity: 0.7 }}>
            Please add <code style={{ background: 'rgba(255,255,255,0.1)', padding: '2px 6px', borderRadius: '4px' }}>
              VITE_CLERK_PUBLISHABLE_KEY
            </code> to your environment variables
          </p>
        </div>
      </div>
    );
  }

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