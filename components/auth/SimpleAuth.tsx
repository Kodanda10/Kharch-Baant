import React, { useState } from 'react';

interface SimpleAuthProps {
  children: React.ReactNode;
}

// Temporary bypass for testing - remove when Clerk is working
const SimpleAuth: React.FC<SimpleAuthProps> = ({ children }) => {
  const [isSignedIn, setIsSignedIn] = useState(false);
  const [email, setEmail] = useState('');

  if (!isSignedIn) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center p-4">
        <div className="bg-white/10 backdrop-blur-md rounded-2xl p-8 shadow-lg border border-white/20 max-w-md w-full">
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-white mb-2">💰</h1>
            <h2 className="text-2xl font-bold text-white">Kharch-Baant</h2>
            <p className="text-slate-300 text-sm">Quick Demo Access</p>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Email (any email for demo)
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="your@email.com"
              />
            </div>

            <button
              onClick={() => {
                if (email) {
                  setIsSignedIn(true);
                }
              }}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-4 rounded-lg transition-colors"
            >
              Enter App (Demo Mode)
            </button>

            <p className="text-slate-400 text-xs text-center">
              This is a temporary bypass while Clerk is being configured
            </p>
          </div>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};

export default SimpleAuth;