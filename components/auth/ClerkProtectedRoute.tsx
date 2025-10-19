import React, { useEffect, useState } from 'react';
import { useAuth } from '@clerk/clerk-react';
import ClerkAuthLayout from './ClerkAuthLayout';

interface ClerkProtectedRouteProps {
  children: React.ReactNode;
}

const ClerkProtectedRoute: React.FC<ClerkProtectedRouteProps> = ({ children }) => {
  const { isLoaded, isSignedIn } = useAuth();
  const [loadingTime, setLoadingTime] = useState(0);
  const [showDebug, setShowDebug] = useState(false);

  useEffect(() => {
    const timer = setInterval(() => {
      setLoadingTime(prev => prev + 1);
      if (loadingTime > 10) {
        setShowDebug(true);
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [loadingTime]);

  console.log('🔍 Clerk Auth State:', { isLoaded, isSignedIn, loadingTime });

  // Show loading spinner while Clerk is loading
  if (!isLoaded) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center p-4">
        <div className="text-center max-w-md">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
          <p className="text-white mb-2">Loading authentication...</p>
          <p className="text-slate-300 text-sm">{loadingTime}s</p>
          
          {showDebug && (
            <div className="mt-6 p-4 bg-black/20 rounded-lg text-left">
              <p className="text-yellow-300 text-sm mb-2">⚠️ Taking longer than usual</p>
              <div className="text-xs text-slate-300 space-y-1">
                <p>• Check browser console for errors</p>
                <p>• Verify Clerk key in .env.local</p>
                <p>• Ensure localhost:3000 is added to Clerk dashboard</p>
              </div>
              <button
                onClick={() => window.location.reload()}
                className="mt-3 px-3 py-1 bg-blue-600 text-white text-sm rounded"
              >
                Reload Page
              </button>
            </div>
          )}
        </div>
      </div>
    );
  }

  // If user is not signed in, show auth layout
  if (!isSignedIn) {
    return <ClerkAuthLayout />;
  }

  // If user is signed in, show the protected content
  return <>{children}</>;
};

export default ClerkProtectedRoute;