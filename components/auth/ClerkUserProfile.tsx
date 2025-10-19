import React from 'react';
import { useUser, useClerk } from '@clerk/clerk-react';

interface ClerkUserProfileProps {
  onClose: () => void;
}

const ClerkUserProfile: React.FC<ClerkUserProfileProps> = ({ onClose }) => {
  const { user } = useUser();
  const { signOut } = useClerk();

  const handleSignOut = async () => {
    await signOut();
    onClose();
  };

  if (!user) return null;

  const displayName = user.fullName || user.firstName || user.emailAddresses[0]?.emailAddress?.split('@')[0] || 'User';
  const email = user.primaryEmailAddress?.emailAddress;
  const avatarUrl = user.imageUrl;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-slate-800 rounded-2xl p-6 w-full max-w-md">
        <div className="text-center mb-6">
          {avatarUrl ? (
            <img
              src={avatarUrl}
              alt="User Avatar"
              className="w-16 h-16 rounded-full mx-auto mb-4"
            />
          ) : (
            <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full mx-auto mb-4 flex items-center justify-center">
              <span className="text-white text-xl font-bold">
                {displayName.charAt(0).toUpperCase()}
              </span>
            </div>
          )}
          <h2 className="text-xl font-bold text-white">{displayName}</h2>
          <p className="text-slate-300 text-sm">{email}</p>
        </div>

        <div className="space-y-4">
          <div className="bg-slate-700/50 rounded-lg p-4">
            <h3 className="text-white font-medium mb-2">Account Info</h3>
            <div className="text-sm text-slate-300 space-y-1">
              <p><span className="text-slate-400">User ID:</span> {user.id?.slice(0, 8)}...</p>
              <p><span className="text-slate-400">Created:</span> {new Date(user.createdAt || '').toLocaleDateString()}</p>
              <p><span className="text-slate-400">Status:</span> <span className="text-green-400">Active</span></p>
              {user.emailAddresses?.length > 0 && (
                <p><span className="text-slate-400">Verified:</span> 
                  <span className={user.emailAddresses[0].verification?.status === 'verified' ? 'text-green-400' : 'text-yellow-400'}>
                    {user.emailAddresses[0].verification?.status === 'verified' ? ' ✓ Verified' : ' Pending'}
                  </span>
                </p>
              )}
            </div>
          </div>

          <div className="space-y-3">
            <button
              onClick={() => {
                // Open Clerk's user profile modal
                user.update;
                onClose();
              }}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-4 rounded-lg transition-colors"
            >
              Edit Profile
            </button>

            <button
              onClick={handleSignOut}
              className="w-full bg-red-600 hover:bg-red-700 text-white font-medium py-3 px-4 rounded-lg transition-colors"
            >
              Sign Out
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

export default ClerkUserProfile;