import React, { useState } from 'react';
import { SignIn, SignUp } from '@clerk/clerk-react';

const ClerkAuthLayout: React.FC = () => {
  const [mode, setMode] = useState<'sign-in' | 'sign-up'>('sign-in');

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center p-4">
      {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-1/2 -left-1/2 w-96 h-96 bg-purple-500/20 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-1/2 -right-1/2 w-96 h-96 bg-blue-500/20 rounded-full blur-3xl"></div>
      </div>
      
      <div className="relative z-10 w-full max-w-md">
        {/* App Logo/Title */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">💰</h1>
          <h2 className="text-2xl font-bold text-white">Kharch-Baant</h2>
          <p className="text-slate-300 text-sm">Shared Expense Tracker</p>
        </div>

        {/* Mode Switcher */}
        <div className="flex justify-center mb-6">
          <div className="bg-white/10 rounded-lg p-1 flex">
            <button
              onClick={() => setMode('sign-in')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                mode === 'sign-in'
                  ? 'bg-blue-600 text-white'
                  : 'text-slate-300 hover:text-white'
              }`}
            >
              Sign In
            </button>
            <button
              onClick={() => setMode('sign-up')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                mode === 'sign-up'
                  ? 'bg-blue-600 text-white'
                  : 'text-slate-300 hover:text-white'
              }`}
            >
              Sign Up
            </button>
          </div>
        </div>

        {/* Clerk Auth Components */}
        <div className="flex justify-center">
          {mode === 'sign-up' ? (
            <SignUp 
              routing="hash"
              afterSignUpUrl="/"
              afterSignInUrl="/"
            />
          ) : (
            <SignIn 
              routing="hash"
              afterSignInUrl="/"
              afterSignUpUrl="/"
            />
          )}
        </div>

        {/* Footer */}
        <div className="text-center mt-8">
          <p className="text-slate-400 text-xs">
            Secure authentication powered by Clerk
          </p>
        </div>
      </div>
    </div>
  );
};

export default ClerkAuthLayout;