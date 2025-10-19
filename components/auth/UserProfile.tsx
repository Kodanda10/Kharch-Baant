import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';

interface UserProfileProps {
  onClose: () => void;
}

const UserProfile: React.FC<UserProfileProps> = ({ onClose }) => {
  const { user, signOut, loading } = useAuth();
  const [isSigningOut, setIsSigningOut] = useState(false);

  const handleSignOut = async () => {
    setIsSigningOut(true);
    await signOut();
    setIsSigningOut(false);
    onClose();
  };

  const displayName = user?.user_metadata?.display_name || user?.email?.split('@')[0] || 'User';
  const email = user?.email;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-slate-800 rounded-2xl p-6 w-full max-w-md">
        <div className="text-center mb-6">
          <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full mx-auto mb-4 flex items-center justify-center">
            <span className="text-white text-xl font-bold">
              {displayName.charAt(0).toUpperCase()}
            </span>
          </div>
          <h2 className="text-xl font-bold text-white">{displayName}</h2>
          <p className="text-slate-300 text-sm">{email}</p>
        </div>

        <div className="space-y-4">
          <div className="bg-slate-700/50 rounded-lg p-4">
            <h3 className="text-white font-medium mb-2">Account Info</h3>
            <div className="text-sm text-slate-300 space-y-1">
              <p><span className="text-slate-400">User ID:</span> {user?.id?.slice(0, 8)}...</p>
              <p><span className="text-slate-400">Created:</span> {new Date(user?.created_at || '').toLocaleDateString()}</p>
              <p><span className="text-slate-400">Status:</span> <span className="text-green-400">Active</span></p>
            </div>
          </div>

          <div className="space-y-3">
            <button
              onClick={handleSignOut}
              disabled={isSigningOut}
              className="w-full bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white font-medium py-3 px-4 rounded-lg transition-colors"
            >
              {isSigningOut ? 'Signing out...' : 'Sign Out'}
            </button>

            <button
              onClick={onClose}
              className="w-full bg-slate-600 hover:bg-slate-700 text-white font-medium py-3 px-4 rounded-lg transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserProfile;