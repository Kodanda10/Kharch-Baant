import React from 'react';
import { useClerk, useUser } from '@clerk/clerk-react';

const ClerkDebugComponent: React.FC = () => {
    const clerk = useClerk();
    const { user, isLoaded, isSignedIn } = useUser();
    
    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center text-white p-8">
            <div className="bg-white/10 backdrop-blur-md p-8 rounded-2xl shadow-lg border border-white/20">
                <h1 className="text-2xl font-bold mb-4">Clerk Debug Information</h1>
                <div className="space-y-2 text-sm">
                    <p><strong>Clerk loaded:</strong> {clerk ? 'Yes' : 'No'}</p>
                    <p><strong>User loaded:</strong> {isLoaded ? 'Yes' : 'No'}</p>
                    <p><strong>Is signed in:</strong> {isSignedIn ? 'Yes' : 'No'}</p>
                    <p><strong>User ID:</strong> {user?.id || 'Not available'}</p>
                    <p><strong>User email:</strong> {user?.primaryEmailAddress?.emailAddress || 'Not available'}</p>
                    <p><strong>Environment:</strong> {import.meta.env.MODE}</p>
                    <p><strong>Has Key:</strong> {import.meta.env.VITE_CLERK_PUBLISHABLE_KEY ? 'Yes' : 'No'}</p>
                    <p><strong>Key prefix:</strong> {import.meta.env.VITE_CLERK_PUBLISHABLE_KEY?.substring(0, 20) || 'Not found'}</p>
                </div>
            </div>
        </div>
    );
};

export default ClerkDebugComponent;