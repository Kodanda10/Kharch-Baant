import React, { useState, useEffect } from 'react';

const ApiStatusIndicator: React.FC = () => {
  const [apiMode, setApiMode] = useState<string>('unknown');
  const [supabaseStatus, setSupabaseStatus] = useState<'checking' | 'connected' | 'error'>('checking');

  useEffect(() => {
    const mode = import.meta.env.VITE_API_MODE || 'mock';
    setApiMode(mode);

    if (mode === 'supabase') {
      checkSupabaseConnection();
    }
  }, []);

  const checkSupabaseConnection = async () => {
    try {
      const { supabase } = await import('../lib/supabase');
      const { data, error } = await supabase.from('groups').select('count', { count: 'exact', head: true });
      
      if (error) throw error;
      setSupabaseStatus('connected');
    } catch (error) {
      console.error('Supabase connection error:', error);
      setSupabaseStatus('error');
    }
  };

  if (process.env.NODE_ENV === 'production') {
    return null; // Don't show in production
  }

  return (
    <div className="fixed bottom-4 right-4 z-50">
      <div className="bg-black/80 backdrop-blur-sm text-white text-xs px-3 py-2 rounded-lg border border-white/20">
        <div className="flex items-center gap-2">
          <div className={`w-2 h-2 rounded-full ${
            apiMode === 'mock' ? 'bg-blue-400' :
            supabaseStatus === 'connected' ? 'bg-green-400' :
            supabaseStatus === 'error' ? 'bg-red-400' :
            'bg-yellow-400'
          }`} />
          <span>
            API: {apiMode === 'mock' ? 'Mock' : 'Supabase'} 
            {apiMode === 'supabase' && (
              <span className="ml-1">
                ({supabaseStatus === 'checking' ? 'checking...' :
                  supabaseStatus === 'connected' ? 'connected' :
                  'error'})
              </span>
            )}
          </span>
        </div>
      </div>
    </div>
  );
};

export default ApiStatusIndicator;