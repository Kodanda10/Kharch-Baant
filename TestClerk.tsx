import React from 'react';
import { useUser } from '@clerk/clerk-react';

const TestClerk: React.FC = () => {
    const { user, isLoaded } = useUser();
    
    console.log('TestClerk:', { user, isLoaded });
    
    return (
        <div className="min-h-screen bg-red-500 flex items-center justify-center text-white">
            <div className="text-center">
                <h1 className="text-2xl mb-4">Clerk Test</h1>
                <p>isLoaded: {isLoaded ? 'true' : 'false'}</p>
                <p>hasUser: {user ? 'true' : 'false'}</p>
                {user && <p>User ID: {user.id}</p>}
            </div>
        </div>
    );
};

export default TestClerk;