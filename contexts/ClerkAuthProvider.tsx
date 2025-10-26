import React from 'react';
import { ClerkProvider } from '@clerk/clerk-react';

const clerkPubKey = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;

interface ClerkAuthProviderProps {
  children: React.ReactNode;
}

export const ClerkAuthProvider: React.FC<ClerkAuthProviderProps> = ({ children }) => {
  // Show error message if Clerk key is missing
  if (!clerkPubKey) {
    console.error('❌ CLERK KEY MISSING - Check Vercel env vars!');
    console.error('Expected: VITE_CLERK_PUBLISHABLE_KEY');
    console.error('Got:', clerkPubKey);
    
    // Use document.write as absolute fallback to ensure something renders
    if (typeof document !== 'undefined' && !document.getElementById('clerk-error-shown')) {
      const errorDiv = document.createElement('div');
      errorDiv.id = 'clerk-error-shown';
      errorDiv.style.cssText = 'position:fixed;inset:0;display:flex;align-items:center;justify-content:center;background:#0f172a;color:white;font-family:system-ui;z-index:9999;';
      errorDiv.innerHTML = `
        <div style="text-align:center;max-width:500px;padding:40px;">
          <h1 style="font-size:32px;margin-bottom:20px;color:#ef4444;">⚠️ Configuration Error</h1>
          <p style="font-size:18px;margin-bottom:20px;">Missing Clerk Publishable Key</p>
          <p style="font-size:14px;opacity:0.7;margin-bottom:20px;">
            The environment variable <code style="background:rgba(255,255,255,0.1);padding:4px 8px;border-radius:4px;">VITE_CLERK_PUBLISHABLE_KEY</code> 
            is not set.
          </p>
          <p style="font-size:12px;opacity:0.5;">
            In Vercel: Settings → Environment Variables → Add for Production → Redeploy
          </p>
        </div>
      `;
      document.body.appendChild(errorDiv);
    }
    
    return (
      <div style={{ 
        minHeight: '100vh', 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center',
        padding: '20px',
        background: '#0f172a',
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
            </code> to your environment variables in Vercel
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